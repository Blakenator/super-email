import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { readFileSync } from 'node:fs';
import type { MyContext } from '@main/common';
import { sequelize } from './db/database.js';
import type { AllBackendResolvers, BackendContext } from './types.js';
import { QueryResolvers } from './queries/index.js';
import { MutationResolvers } from './mutations/index.js';
import { GraphQLScalarType, Kind } from 'graphql';
import { verifyToken } from './helpers/auth.js';
import { logger } from './helpers/logger.js';
import type { ApolloServerPlugin } from '@apollo/server';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { PubSub } from 'graphql-subscriptions';
import {
  startIdleForUser,
  stopIdleForUser,
  type MailboxUpdateEvent,
} from './helpers/imap-idle.js';

// Log startup immediately so we know the server is restarting
console.log('\n====================================');
console.log('🔄 Email Client API Starting...');
console.log(`⏰ ${new Date().toISOString()}`);
console.log('====================================\n');

const app = express();
const httpServer = http.createServer(app);

// Load GraphQL schema
const typeDefs = readFileSync('../common/schema.graphql', {
  encoding: 'utf-8',
});

// Custom Date scalar
const dateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value) {
    if (value instanceof Date) {
      return value.toISOString();
    } else if (typeof value === 'string') {
      try {
        return new Date(Date.parse(value)).toISOString();
      } catch (e: any) {
        throw Error(`Error serializing date string: ${e.message}`);
      }
    }
    throw Error('GraphQL Date Scalar serializer expected a Date object');
  },
  parseValue(value) {
    if (typeof value === 'string') {
      return new Date(value);
    } else if (value instanceof Date) {
      return value;
    }
    throw new Error('GraphQL Date Scalar parser expected a string');
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

// Custom JSON scalar for arbitrary JSON data (like email headers)
const jsonScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON scalar type',
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return JSON.parse(ast.value);
    }
    if (ast.kind === Kind.OBJECT) {
      return ast;
    }
    return null;
  },
});

// Logging plugin for Apollo Server
const loggingPlugin: ApolloServerPlugin<BackendContext> = {
  async requestDidStart({ request }) {
    const start = Date.now();
    const operationName = request.operationName;

    logger.request(operationName, request.variables);

    return {
      async didEncounterErrors({ errors }) {
        const duration = Date.now() - start;
        logger.response(operationName, duration, errors[0]);
      },
      async willSendResponse() {
        const duration = Date.now() - start;
        logger.response(operationName, duration);
      },
    };
  },
};

// Import models for field resolvers
import {
  Email,
  EmailAccount as EmailAccountModel,
  SmtpProfile as SmtpProfileModel,
  AuthenticationMethod as AuthMethodModel,
  Tag,
  EmailTag,
  Attachment,
} from './db/models/index.js';

const resolvers: AllBackendResolvers = {
  Query: QueryResolvers,
  Mutation: MutationResolvers,
  Date: dateScalar,
  JSON: jsonScalar,
  // Field resolvers for computed fields
  User: {
    // Fetch email accounts for user
    emailAccounts: async (parent) => {
      const accounts = await EmailAccountModel.findAll({
        where: { userId: parent.id },
        order: [['createdAt', 'DESC']],
      });
      return accounts.map((a) => a.get({ plain: true })) as any;
    },
    // Fetch SMTP profiles for user
    smtpProfiles: async (parent) => {
      const profiles = await SmtpProfileModel.findAll({
        where: { userId: parent.id },
        order: [['createdAt', 'DESC']],
      });
      return profiles.map((p) => p.get({ plain: true })) as any;
    },
    // Fetch authentication methods for user
    authenticationMethods: async (parent) => {
      const methods = await AuthMethodModel.findAll({
        where: { userId: parent.id },
        order: [['createdAt', 'DESC']],
      });
      return methods.map((m) => m.get({ plain: true })) as any;
    },
  },
  EmailAccount: {
    // Compute isSyncing from syncId presence
    isSyncing: (parent: any) => !!parent.syncId,
  },
  Email: {
    // Compute thread count - number of emails in the same thread
    threadCount: async (parent: any) => {
      if (!parent.threadId) return 1;
      const count = await Email.count({
        where: { threadId: parent.threadId },
      });
      return count;
    },
    // Fetch tags for email via junction table
    tags: async (parent: any) => {
      const emailTags = await EmailTag.findAll({
        where: { emailId: parent.id },
        attributes: ['tagId'],
      });
      if (emailTags.length === 0) return [];
      const tagIds = emailTags.map((et) => et.tagId);
      const tags = await Tag.findAll({
        where: { id: tagIds },
      });
      return tags.map((t) => t.get({ plain: true }));
    },
    // Fetch attachments for email
    attachments: async (parent: any) => {
      const attachments = await Attachment.findAll({
        where: { emailId: parent.id },
      });
      return attachments.map((a) => a.get({ plain: true }));
    },
    // Check if email has attachments
    hasAttachments: async (parent: any) => {
      const count = await Attachment.count({
        where: { emailId: parent.id },
      });
      return count > 0;
    },
    // Get attachment count
    attachmentCount: async (parent: any) => {
      return await Attachment.count({
        where: { emailId: parent.id },
      });
    },
  },
  Tag: {
    // Email count is already computed in the query with literal
    emailCount: (parent: any) => parent.emailCount ?? 0,
  },
  // Subscription resolvers - cast to any to avoid complex type issues
  Subscription: {
    mailboxUpdates: {
      subscribe: async (_parent: any, _args: any, context: BackendContext) => {
        if (!context.userId) {
          throw new Error('Authentication required');
        }

        const userId = context.userId;
        logger.info(
          'Subscription',
          `Starting mailboxUpdates subscription for user ${userId}`,
        );

        // Create an async iterator using a more robust pattern
        const updates: MailboxUpdateEvent[] = [];
        let resolveWaiting:
          | ((
              value: IteratorResult<{ mailboxUpdates: MailboxUpdateEvent }>,
            ) => void)
          | null = null;
        let isComplete = false;
        let cleanedUp = false;

        const onUpdate = (update: MailboxUpdateEvent) => {
          logger.info(
            'Subscription',
            `[User ${userId}] Received IDLE event: type=${update.type}, account=${update.emailAccountId}, message=${update.message || 'none'}`,
          );

          const wrappedUpdate = { mailboxUpdates: update };

          if (resolveWaiting) {
            const resolve = resolveWaiting;
            resolveWaiting = null;
            resolve({ value: wrappedUpdate, done: false });
          } else {
            updates.push(update);
          }

          // Mark as complete if connection closed
          if (update.type === 'CONNECTION_CLOSED') {
            isComplete = true;
          }
        };

        const cleanup = async () => {
          if (cleanedUp) return;
          cleanedUp = true;
          logger.info(
            'Subscription',
            `Cleaning up mailboxUpdates subscription for user ${userId}`,
          );
          await stopIdleForUser(userId);
        };

        // Start IDLE connections
        try {
          await startIdleForUser(userId, onUpdate);
        } catch (error: any) {
          logger.error(
            'Subscription',
            `Failed to start IDLE: ${error.message}`,
          );
          throw error;
        }

        // Create a proper AsyncIterator
        const asyncIterator: AsyncIterator<{
          mailboxUpdates: MailboxUpdateEvent;
        }> = {
          async next(): Promise<
            IteratorResult<{ mailboxUpdates: MailboxUpdateEvent }>
          > {
            // Check if there are queued updates
            if (updates.length > 0) {
              const update = updates.shift()!;
              return { value: { mailboxUpdates: update }, done: false };
            }

            // Check if we're done
            if (isComplete) {
              await cleanup();
              return { value: undefined as any, done: true };
            }

            // Wait for the next update
            return new Promise((resolve) => {
              resolveWaiting = resolve;
            });
          },

          async return(): Promise<
            IteratorResult<{ mailboxUpdates: MailboxUpdateEvent }>
          > {
            logger.info(
              'Subscription',
              `[User ${userId}] Iterator return() called`,
            );
            isComplete = true;
            await cleanup();
            if (resolveWaiting) {
              resolveWaiting({ value: undefined as any, done: true });
              resolveWaiting = null;
            }
            return { value: undefined as any, done: true };
          },

          async throw(
            error: any,
          ): Promise<IteratorResult<{ mailboxUpdates: MailboxUpdateEvent }>> {
            logger.error(
              'Subscription',
              `[User ${userId}] Iterator throw() called: ${error?.message || error}`,
            );
            isComplete = true;
            await cleanup();
            return { value: undefined as any, done: true };
          },
        };

        // Return an object with Symbol.asyncIterator
        return {
          [Symbol.asyncIterator]() {
            return asyncIterator;
          },
        };
      },
    },
  } as any,
};

// Create executable schema for WebSocket server
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Create WebSocket server for subscriptions
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/api/graphql',
}) as any; // Cast to any to avoid WS type version mismatch

// Set up graphql-ws server for subscriptions
const serverCleanup = useServer(
  {
    schema,
    context: async (ctx) => {
      // Extract auth token from connection params
      const token =
        (ctx.connectionParams?.authorization as string)?.replace(
          'Bearer ',
          '',
        ) ??
        (ctx.connectionParams?.Authorization as string)?.replace(
          'Bearer ',
          '',
        ) ??
        '';

      let userId: string | undefined;
      let supabaseUserId: string | undefined;

      if (token) {
        const payload = await verifyToken(token);
        userId = payload?.userId || undefined;
        supabaseUserId = payload?.supabaseUserId;
      }

      return {
        token,
        userId,
        supabaseUserId,
        sequelize,
      } satisfies BackendContext;
    },
    onConnect: async (ctx) => {
      logger.info('WebSocket', 'Client connected');
      return true;
    },
    onDisconnect: async (ctx, code, reason) => {
      logger.info('WebSocket', `Client disconnected: ${code} ${reason}`);
    },
  },
  wsServer,
);

const server = new ApolloServer<BackendContext>({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    // Proper WebSocket cleanup plugin
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
    loggingPlugin,
  ],
  formatError: (formattedError, error) => {
    logger.error(
      'GraphQL',
      'Uncaught error:',
      (error as any)?.originalError ?? error,
    );
    return formattedError;
  },
});

// Initialize server
await server.start();
logger.info('Server', 'Apollo Server started');

// Sync database
await sequelize.sync({ alter: true });
logger.info('Database', 'Database synchronized');

// Setup Express middleware
app.use(
  '/api/graphql',
  cors<cors.CorsRequest>(),
  express.json({ limit: '10mb' }), // Increase limit for larger emails
  expressMiddleware(server, {
    context: async ({ req }): Promise<BackendContext> => {
      const token = req.headers.authorization?.replace('Bearer ', '') ?? '';
      let userId: string | undefined;
      let supabaseUserId: string | undefined;

      if (token) {
        const payload = await verifyToken(token);
        userId = payload?.userId || undefined;
        supabaseUserId = payload?.supabaseUserId;
      }

      return {
        token,
        userId,
        supabaseUserId,
        sequelize,
      };
    },
  }),
);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Attachment download endpoint (for development - serves local files)
app.get('/api/attachments/download/:id', async (req, res) => {
  try {
    const attachmentId = req.params.id;
    logger.info('Attachment', 'Download request', {
      attachmentId,
      hasAuth: !!req.headers.authorization,
    });

    const token = req.headers.authorization?.replace('Bearer ', '') ?? '';
    if (!token) {
      logger.warn('Attachment', 'No auth token provided');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const payload = await verifyToken(token);
    if (!payload?.userId) {
      logger.warn('Attachment', 'Invalid token');
      return res.status(401).json({ error: 'Invalid token' });
    }

    logger.info('Attachment', 'Token verified', {
      userId: payload.userId,
      attachmentId,
    });

    // Verify user has access to this attachment by looking it up by ID
    const attachment = await Attachment.findByPk(attachmentId, {
      include: [
        {
          model: Email,
          include: [
            {
              model: EmailAccountModel,
              where: { userId: payload.userId },
              required: true,
            },
          ],
        },
      ],
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // In development, serve from local disk
    if (process.env.NODE_ENV !== 'production') {
      const { getLocalAttachmentPath } = await import(
        './helpers/attachment-storage.js'
      );
      const filePath = getLocalAttachmentPath(attachmentId);

      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${attachment.filename}"`,
      );
      res.setHeader('Content-Length', attachment.size.toString());
      console.log({ attachment });

      const { createReadStream } = await import('fs');
      const stream = createReadStream(filePath);
      stream.pipe(res);
    } else {
      // In production, redirect to S3 presigned URL
      const { getAttachmentDownloadUrl } = await import(
        './helpers/attachment-storage.js'
      );
      const url = await getAttachmentDownloadUrl(attachmentId);
      console.log({ url });
      res.redirect(url);
    }
  } catch (error: any) {
    logger.error('Attachment Download', error.message);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
});

// Start HTTP server
await new Promise<void>((resolve) =>
  httpServer.listen({ port: 4000 }, resolve),
);

logger.info(
  'Server',
  '📧 Email Client API ready at http://localhost:4000/api/graphql',
);
