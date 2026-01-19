/**
 * Server Factory - Creates Apollo Server with injectable dependencies
 * 
 * For production/development: Call createServer() with no arguments
 * For testing: Call createServer() with mock dependencies
 */

import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { GraphQLScalarType, Kind } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import type { ApolloServerPlugin } from '@apollo/server';
import type { Sequelize, ModelStatic, Model } from 'sequelize';

import type { BackendContext, AllBackendResolvers } from './types.js';
import { QueryResolvers } from './queries/index.js';
import { MutationResolvers } from './mutations/index.js';
import { logger } from './helpers/logger.js';
import { verifyToken } from './helpers/auth.js';
import { pubSub, MAILBOX_UPDATES } from './helpers/pubsub.js';
import { API_ROUTES } from '@main/common';
import {
  startIdleForUser,
  stopIdleForUser,
  type MailboxUpdateEvent,
} from './helpers/imap-idle.js';

// Default models - imported from db
import {
  Email as DefaultEmail,
  EmailAccount as DefaultEmailAccount,
  SmtpProfile as DefaultSmtpProfile,
  AuthenticationMethod as DefaultAuthMethod,
  Tag as DefaultTag,
  EmailTag as DefaultEmailTag,
  Attachment as DefaultAttachment,
} from './db/models/index.js';
import { sequelize as defaultSequelize } from './db/database.js';

/**
 * Injectable dependencies for server
 */
export interface ServerDependencies {
  /** Sequelize instance for database operations */
  sequelize: Sequelize;
  /** Model overrides for testing */
  models: {
    Email: ModelStatic<Model>;
    EmailAccount: ModelStatic<Model>;
    SmtpProfile: ModelStatic<Model>;
    AuthenticationMethod: ModelStatic<Model>;
    Tag: ModelStatic<Model>;
    EmailTag: ModelStatic<Model>;
    Attachment: ModelStatic<Model>;
  };
  /** Auth token verification function */
  verifyToken: typeof verifyToken;
  /** Path to schema file (relative to cwd or absolute) */
  schemaPath?: string;
  /** Skip database sync (for testing) */
  skipDbSync?: boolean;
  /** Skip WebSocket server (for testing) */
  skipWebSocket?: boolean;
  /** Custom port (defaults to 4000) */
  port?: number;
  /** Enable verbose logging */
  enableLogging?: boolean;
}

/**
 * Default dependencies using actual implementations
 */
export function getDefaultDependencies(): ServerDependencies {
  return {
    sequelize: defaultSequelize,
    models: {
      Email: DefaultEmail,
      EmailAccount: DefaultEmailAccount,
      SmtpProfile: DefaultSmtpProfile,
      AuthenticationMethod: DefaultAuthMethod,
      Tag: DefaultTag,
      EmailTag: DefaultEmailTag,
      Attachment: DefaultAttachment,
    },
    verifyToken,
    schemaPath: path.join(process.cwd(), '..', 'common', 'schema.graphql'),
    skipDbSync: false,
    skipWebSocket: false,
    port: 4000,
    enableLogging: true,
  };
}

/**
 * Server instance returned from createServer
 */
export interface ServerInstance {
  /** Apollo Server instance */
  apolloServer: ApolloServer<BackendContext>;
  /** Express app */
  app: express.Express;
  /** HTTP server */
  httpServer: http.Server;
  /** GraphQL schema */
  schema: ReturnType<typeof makeExecutableSchema>;
  /** Dependencies used to create the server */
  dependencies: ServerDependencies;
  /** Start the server (binds to port) */
  start: () => Promise<void>;
  /** Stop the server */
  stop: () => Promise<void>;
  /** Execute a GraphQL operation directly (for testing) */
  executeOperation: <T = any>(
    query: string,
    variables?: Record<string, any>,
    context?: Partial<BackendContext>,
  ) => Promise<any>;
}

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

// Custom JSON scalar
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

/**
 * Create logging plugin for Apollo Server
 */
function createLoggingPlugin(enabled: boolean): ApolloServerPlugin<BackendContext> {
  if (!enabled) {
    return {};
  }
  return {
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
}

/**
 * Build resolvers with injected model dependencies
 */
function buildResolvers(deps: ServerDependencies): AllBackendResolvers {
  const { models } = deps;

  return {
    Query: QueryResolvers,
    Mutation: MutationResolvers,
    Date: dateScalar,
    JSON: jsonScalar,
    
    // Field resolvers using injected models
    User: {
      emailAccounts: async (parent) => {
        const accounts = await models.EmailAccount.findAll({
          where: { userId: parent.id },
          order: [['createdAt', 'DESC']],
        });
        return accounts.map((a) => a.get({ plain: true })) as any;
      },
      smtpProfiles: async (parent) => {
        const profiles = await models.SmtpProfile.findAll({
          where: { userId: parent.id },
          order: [['createdAt', 'DESC']],
        });
        return profiles.map((p) => p.get({ plain: true })) as any;
      },
      authenticationMethods: async (parent) => {
        const methods = await models.AuthenticationMethod.findAll({
          where: { userId: parent.id },
          order: [['createdAt', 'DESC']],
        });
        return methods.map((m) => m.get({ plain: true })) as any;
      },
    },
    EmailAccount: {
      isSyncing: (parent: any) => !!parent.syncId,
    },
    Email: {
      threadCount: async (parent: any) => {
        if (!parent.threadId) return 1;
        const count = await models.Email.count({
          where: { threadId: parent.threadId },
        });
        return count;
      },
      tags: async (parent: any) => {
        const emailTags = await models.EmailTag.findAll({
          where: { emailId: parent.id },
          attributes: ['tagId'],
        });
        if (emailTags.length === 0) return [];
        const tagIds = emailTags.map((et: any) => et.tagId);
        const tags = await models.Tag.findAll({
          where: { id: tagIds },
        });
        return tags.map((t) => t.get({ plain: true }));
      },
      attachments: async (parent: any) => {
        const attachments = await models.Attachment.findAll({
          where: { emailId: parent.id },
        });
        return attachments.map((a) => a.get({ plain: true }));
      },
      hasAttachments: async (parent: any) => {
        const count = await models.Attachment.count({
          where: { emailId: parent.id },
        });
        return count > 0;
      },
      attachmentCount: async (parent: any) => {
        return await models.Attachment.count({
          where: { emailId: parent.id },
        });
      },
    },
    Tag: {
      emailCount: (parent: any) => parent.emailCount ?? 0,
    },
    
    // Subscription resolvers
    Subscription: {
      mailboxUpdates: {
        subscribe: async (_parent: any, _args: any, context: BackendContext) => {
          if (!context.userId) {
            throw new Error('Authentication required');
          }

          const userId = context.userId;
          logger.info('Subscription', `Starting mailboxUpdates subscription for user ${userId}`);

          const updates: MailboxUpdateEvent[] = [];
          let resolveWaiting: ((value: IteratorResult<{ mailboxUpdates: MailboxUpdateEvent }>) => void) | null = null;
          let isComplete = false;
          let cleanedUp = false;

          const pubSubSubscriptionId = await pubSub.subscribe(
            `${MAILBOX_UPDATES}:${userId}`,
            (update: MailboxUpdateEvent) => {
              logger.info('Subscription', `[User ${userId}] Received PubSub event`);
              onUpdate(update);
            },
          );

          const onUpdate = (update: MailboxUpdateEvent) => {
            const wrappedUpdate = { mailboxUpdates: update };
            if (resolveWaiting) {
              const resolve = resolveWaiting;
              resolveWaiting = null;
              resolve({ value: wrappedUpdate, done: false });
            } else {
              updates.push(update);
            }
            if (update.type === 'CONNECTION_CLOSED') {
              isComplete = true;
            }
          };

          const cleanup = async () => {
            if (cleanedUp) return;
            cleanedUp = true;
            await pubSub.unsubscribe(pubSubSubscriptionId);
            await stopIdleForUser(userId);
          };

          try {
            await startIdleForUser(userId, onUpdate);
          } catch (error: any) {
            logger.error('Subscription', `Failed to start IDLE: ${error.message}`);
            throw error;
          }

          const asyncIterator: AsyncIterator<{ mailboxUpdates: MailboxUpdateEvent }> = {
            async next() {
              if (updates.length > 0) {
                const update = updates.shift()!;
                return { value: { mailboxUpdates: update }, done: false };
              }
              if (isComplete) {
                await cleanup();
                return { value: undefined as any, done: true };
              }
              return new Promise((resolve) => { resolveWaiting = resolve; });
            },
            async return() {
              isComplete = true;
              await cleanup();
              if (resolveWaiting) {
                resolveWaiting({ value: undefined as any, done: true });
                resolveWaiting = null;
              }
              return { value: undefined as any, done: true };
            },
            async throw(error: any) {
              isComplete = true;
              await cleanup();
              return { value: undefined as any, done: true };
            },
          };

          return { [Symbol.asyncIterator]() { return asyncIterator; } };
        },
      },
    } as any,
  };
}

/**
 * Create the Apollo Server with injectable dependencies
 */
export async function createServer(
  overrides: Partial<ServerDependencies> = {},
): Promise<ServerInstance> {
  const deps: ServerDependencies = {
    ...getDefaultDependencies(),
    ...overrides,
  };

  const app = express();
  const httpServer = http.createServer(app);

  // Load GraphQL schema
  const schemaPath = deps.schemaPath || path.join(process.cwd(), '..', 'common', 'schema.graphql');
  const typeDefs = readFileSync(schemaPath, { encoding: 'utf-8' });

  // Build resolvers with injected dependencies
  const resolvers = buildResolvers(deps);

  // Create executable schema
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // Set up WebSocket server for subscriptions (optional)
  let serverCleanup: { dispose: () => Promise<void> } | null = null;
  if (!deps.skipWebSocket) {
    const wsServer = new WebSocketServer({
      server: httpServer,
      path: '/api/graphql',
    }) as any;

    serverCleanup = useServer(
      {
        schema,
        context: async (ctx) => {
          const token =
            (ctx.connectionParams?.authorization as string)?.replace('Bearer ', '') ??
            (ctx.connectionParams?.Authorization as string)?.replace('Bearer ', '') ??
            '';

          let userId: string | undefined;
          let supabaseUserId: string | undefined;

          if (token) {
            const payload = await deps.verifyToken(token);
            userId = payload?.userId || undefined;
            supabaseUserId = payload?.supabaseUserId;
          }

          return { token, userId, supabaseUserId, sequelize: deps.sequelize } satisfies BackendContext;
        },
        onConnect: async () => {
          if (deps.enableLogging) logger.info('WebSocket', 'Client connected');
          return true;
        },
        onDisconnect: async (ctx, code, reason) => {
          if (deps.enableLogging) logger.info('WebSocket', `Client disconnected: ${code} ${reason}`);
        },
      },
      wsServer,
    );
  }

  // Create plugins array
  const plugins: ApolloServerPlugin<BackendContext>[] = [
    ApolloServerPluginDrainHttpServer({ httpServer }),
  ];

  if (serverCleanup) {
    plugins.push({
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup!.dispose();
          },
        };
      },
    });
  }

  plugins.push(
    ApolloServerPluginLandingPageLocalDefault({
      embed: true,
      footer: false,
      includeCookies: true,
    }),
  );

  plugins.push(createLoggingPlugin(deps.enableLogging ?? true));

  // Create Apollo Server
  const apolloServer = new ApolloServer<BackendContext>({
    schema,
    introspection: true,
    plugins,
    formatError: (formattedError, error) => {
      if (deps.enableLogging) {
        logger.error('GraphQL', 'Uncaught error:', (error as any)?.originalError ?? error);
      }
      return formattedError;
    },
  });

  // Start Apollo Server
  await apolloServer.start();
  if (deps.enableLogging) logger.info('Server', 'Apollo Server started');

  // Sync database (optional)
  if (!deps.skipDbSync) {
    await deps.sequelize.sync({ alter: true });
    if (deps.enableLogging) logger.info('Database', 'Database synchronized');
  }

  // Setup Express middleware
  app.use(
    API_ROUTES.GRAPHQL,
    cors<cors.CorsRequest>(),
    express.json({ limit: '10mb' }),
    expressMiddleware(apolloServer, {
      context: async ({ req }): Promise<BackendContext> => {
        const token = req.headers.authorization?.replace('Bearer ', '') ?? '';
        let userId: string | undefined;
        let supabaseUserId: string | undefined;

        if (token) {
          const payload = await deps.verifyToken(token);
          userId = payload?.userId || undefined;
          supabaseUserId = payload?.supabaseUserId;
        }

        return { token, userId, supabaseUserId, sequelize: deps.sequelize };
      },
    }),
  );

  // Health check endpoint
  app.get(API_ROUTES.HEALTH, (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
    });
  });

  // Attachment download endpoint
  app.get(`${API_ROUTES.ATTACHMENTS.BASE}/download/:id`, async (req, res) => {
    try {
      const attachmentId = req.params.id;
      const token = req.headers.authorization?.replace('Bearer ', '') ?? '';
      
      if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const payload = await deps.verifyToken(token);
      if (!payload?.userId) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const { Email, EmailAccount, Attachment } = deps.models;
      const attachment = await Attachment.findByPk(attachmentId, {
        include: [
          {
            model: Email,
            include: [
              {
                model: EmailAccount,
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

      const attachmentData = attachment.get({ plain: true }) as any;

      if (process.env.NODE_ENV !== 'production') {
        const { getLocalAttachmentPath } = await import('./helpers/attachment-storage.js');
        const filePath = getLocalAttachmentPath(attachmentId);

        res.setHeader('Content-Type', attachmentData.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${attachmentData.filename}"`);
        res.setHeader('Content-Length', attachmentData.size.toString());

        const { createReadStream } = await import('fs');
        const stream = createReadStream(filePath);
        stream.pipe(res);
      } else {
        const { getAttachmentDownloadUrl } = await import('./helpers/attachment-storage.js');
        const url = await getAttachmentDownloadUrl(attachmentId);
        res.redirect(url);
      }
    } catch (error: any) {
      logger.error('Attachment Download', error.message);
      res.status(500).json({ error: 'Failed to download attachment' });
    }
  });

  const port = deps.port ?? 4000;

  return {
    apolloServer,
    app,
    httpServer,
    schema,
    dependencies: deps,
    
    start: async () => {
      await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
      if (deps.enableLogging) {
        logger.info('Server', `📧 Email Client API ready at http://localhost:${port}/api/graphql`);
      }
    },
    
    stop: async () => {
      await apolloServer.stop();
      httpServer.close();
    },
    
    executeOperation: async <T = any>(
      query: string,
      variables?: Record<string, any>,
      context?: Partial<BackendContext>,
    ) => {
      const contextValue: BackendContext = {
        userId: undefined,
        supabaseUserId: undefined,
        token: '',
        sequelize: deps.sequelize,
        ...context,
      };

      return apolloServer.executeOperation<T>(
        { query, variables },
        { contextValue },
      );
    },
  };
}
