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
import type { Sequelize } from 'sequelize-typescript';
import type { ModelStatic, Model } from 'sequelize';

import type { BackendContext, AllBackendResolvers } from './types.js';
import { QueryResolvers } from './queries/index.js';
import { MutationResolvers } from './mutations/index.js';
import { logger } from './helpers/logger.js';
import { verifyToken } from './helpers/auth.js';
import { pubSub, MAILBOX_UPDATES, publishMailboxUpdate } from './helpers/pubsub.js';
import {
  startIdleForUser,
  stopIdleForUser,
  type MailboxUpdateEvent,
} from './helpers/imap-idle.js';
import {
  startBackgroundSync,
  stopBackgroundSync,
  runBackgroundSyncCycle,
} from './helpers/background-sync.js';
import { startUsageDaemon, stopUsageDaemon } from './helpers/usage-daemon.js';
import { preWarmEmbeddingModel } from './helpers/embedding.js';
import { handleStripeWebhook, isStripeConfigured } from './helpers/stripe.js';
import { parseAndStoreCustomEmail } from './helpers/custom-email-parser.js';
import { sendNewEmailNotifications, type NewEmailInfo } from './helpers/push-notifications.js';
import { EmailAccountType } from './db/models/email-account.model.js';
import type { Email } from './db/models/email.model.js';
import { setupBillingDatabase } from './db/setup-billing.js';
import { runMigrations } from './db/migrations/migrator.js';
import { API_ROUTES } from '@main/common';

// Default models - imported from db
import {
  Email as DefaultEmail,
  EmailAccount as DefaultEmailAccount,
  SendProfile as DefaultSendProfile,
  AuthenticationMethod as DefaultAuthMethod,
  Tag as DefaultTag,
  EmailTag as DefaultEmailTag,
  Attachment as DefaultAttachment,
} from './db/models/index.js';
import { sequelize as defaultSequelize } from './db/database.js';
import config from './config/env.js';

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
    SendProfile: ModelStatic<Model>;
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
  /** Skip background sync scheduler (for testing) */
  skipBackgroundSync?: boolean;
  /** Skip usage daemon (for testing) */
  skipUsageDaemon?: boolean;
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
      SendProfile: DefaultSendProfile,
      AuthenticationMethod: DefaultAuthMethod,
      Tag: DefaultTag,
      EmailTag: DefaultEmailTag,
      Attachment: DefaultAttachment,
    },
    verifyToken,
    schemaPath: path.join(process.cwd(), '..', 'common', 'schema.graphql'),
    skipDbSync: false,
    skipWebSocket: false,
    skipBackgroundSync: false,
    skipUsageDaemon: false,
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
function createLoggingPlugin(
  enabled: boolean,
): ApolloServerPlugin<BackendContext> {
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
      sendProfiles: async (parent) => {
        const profiles = await models.SendProfile.findAll({
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
    ImapAccountSettings: {
      isHistoricalSyncing: (parent: any) => !!parent.historicalSyncId,
      isUpdateSyncing: (parent: any) => !!parent.updateSyncId,
    },
    Email: {
      threadCount: async (parent: any) => {
        if (!parent.threadId) {
          return 1;
        }
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
        if (emailTags.length === 0) {
          return [];
        }
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
    Contact: {
      // Sequelize returns the association as 'ContactEmails' based on model name
      // but GraphQL schema expects 'emails'
      emails: (parent: any) => parent.ContactEmails || parent.emails || [],
    },

    // Subscription resolvers
    Subscription: {
      mailboxUpdates: {
        subscribe: async (
          _parent: any,
          _args: any,
          context: BackendContext,
        ) => {
          if (!context.userId) {
            throw new Error('Authentication required');
          }

          const userId = context.userId;
          logger.info(
            'Subscription',
            `Starting mailboxUpdates subscription for user ${userId}`,
          );

          const updates: MailboxUpdateEvent[] = [];
          let resolveWaiting:
            | ((
                value: IteratorResult<{ mailboxUpdates: MailboxUpdateEvent }>,
              ) => void)
            | null = null;
          let isComplete = false;
          let cleanedUp = false;

          const pubSubSubscriptionId = await pubSub.subscribe(
            `${MAILBOX_UPDATES}:${userId}`,
            (update: MailboxUpdateEvent) => {
              logger.info(
                'Subscription',
                `[User ${userId}] Received PubSub event`,
              );
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
            if (cleanedUp) {
              return;
            }
            cleanedUp = true;
            await pubSub.unsubscribe(pubSubSubscriptionId);
            await stopIdleForUser(userId);
          };

          try {
            await startIdleForUser(userId, onUpdate);
          } catch (error: any) {
            logger.error(
              'Subscription',
              `Failed to start IDLE: ${error.message}`,
            );
            throw error;
          }

          const asyncIterator: AsyncIterator<{
            mailboxUpdates: MailboxUpdateEvent;
          }> = {
            async next() {
              if (updates.length > 0) {
                const update = updates.shift()!;
                return { value: { mailboxUpdates: update }, done: false };
              }
              if (isComplete) {
                await cleanup();
                return { value: undefined as any, done: true };
              }
              return new Promise((resolve) => {
                resolveWaiting = resolve;
              });
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

          return {
            [Symbol.asyncIterator]() {
              return asyncIterator;
            },
          };
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
  const schemaPath =
    deps.schemaPath ||
    path.join(process.cwd(), '..', 'common', 'schema.graphql');
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
      path: API_ROUTES.GRAPHQL,
    }) as any;

    const wsCleanup = useServer(
      {
        schema,
        context: async (ctx) => {
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
            const payload = await deps.verifyToken(token);
            userId = payload?.userId || undefined;
            supabaseUserId = payload?.supabaseUserId;
          }

          return {
            token,
            userId,
            supabaseUserId,
            sequelize: deps.sequelize,
          } satisfies BackendContext;
        },
        onConnect: async () => {
          if (deps.enableLogging) {
            logger.info('WebSocket', 'Client connected');
          }
          return true;
        },
        onDisconnect: async (ctx, code, reason) => {
          if (deps.enableLogging) {
            logger.info('WebSocket', `Client disconnected: ${code} ${reason}`);
          }
        },
      },
      wsServer,
    );

    // Wrap dispose to ensure it always returns Promise<void>
    serverCleanup = {
      dispose: async () => {
        const result = wsCleanup.dispose();
        if (result instanceof Promise) {
          await result;
        }
      },
    };
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
            await serverCleanup.dispose();
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
        logger.error(
          'GraphQL',
          'Uncaught error:',
          (error as any)?.originalError ?? error,
        );
      }
      return formattedError;
    },
  });

  // Start Apollo Server
  await apolloServer.start();
  if (deps.enableLogging) {
    logger.info('Server', 'Apollo Server started');
  }

  // Database setup (optional)
  if (!deps.skipDbSync) {
    await setupBillingDatabase();

    // Run SQL migrations BEFORE sync so they can copy data from old columns
    // that sync({ alter: true }) would otherwise drop.
    try {
      await runMigrations(deps.sequelize);
      if (deps.enableLogging) {
        logger.info('Database', 'Migrations completed');
      }
    } catch (migrationError) {
      logger.error('Database', 'Migration failed', migrationError);
    }

    // Disabled in favour of explicit SQL migrations.
    // Uncomment for local dev bootstrapping if needed:
    // await deps.sequelize.sync({ alter: true });
    // if (deps.enableLogging) {
    //   logger.info('Database', 'Database synchronized');
    // }
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

  // Internal endpoint for triggering background sync (called by Lambda cron)
  // Protected by a shared secret token
  app.post('/api/internal/trigger-sync', async (req, res) => {
    const internalToken = req.headers['x-internal-token'];
    const expectedToken = config.internalApiToken;

    // If no token is configured, reject all requests
    if (!expectedToken) {
      logger.warn(
        'Internal API',
        'Trigger sync called but no internal token configured',
      );
      return res.status(503).json({ error: 'Internal API not configured' });
    }

    // Validate the token
    if (internalToken !== expectedToken) {
      logger.warn('Internal API', 'Trigger sync called with invalid token');
      return res.status(401).json({ error: 'Invalid internal token' });
    }

    try {
      logger.info('Internal API', 'Trigger sync requested via internal API');
      const result = await runBackgroundSyncCycle();
      logger.info('Internal API', 'Trigger sync completed via internal API');
      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      logger.error('Internal API', `Trigger sync failed: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  // Internal endpoint for Lambda callback when a new custom domain email arrives
  app.post('/api/internal/new-custom-email', express.json({ limit: '25mb' }), async (req, res) => {
    const internalToken = req.headers['x-internal-token'];
    const expectedToken = config.internalApiToken;

    if (!expectedToken) {
      return res.status(503).json({ error: 'Internal API not configured' });
    }
    if (internalToken !== expectedToken) {
      return res.status(401).json({ error: 'Invalid internal token' });
    }

    const {
      rawEmail,
      emailAccountId: providedAccountId,
      recipientAddress,
      userId: providedUserId,
    } = req.body;

    if (!rawEmail || !recipientAddress) {
      return res.status(400).json({
        error: 'Missing required fields: rawEmail (base64), recipientAddress',
      });
    }

    try {
      let emailAccountId = providedAccountId as string | undefined;
      let userId = providedUserId as string | undefined;

      // Look up the account by recipient address if not explicitly provided
      if (!emailAccountId || !userId) {
        const account = await DefaultEmailAccount.findOne({
          where: { email: recipientAddress, type: EmailAccountType.CUSTOM_DOMAIN },
        });
        if (!account) {
          return res.status(404).json({
            error: `No custom domain account found for ${recipientAddress}`,
          });
        }
        emailAccountId = (account as any).id;
        userId = (account as any).userId;
      }

      const rawBuffer = Buffer.from(rawEmail, 'base64');
      const result = await parseAndStoreCustomEmail(rawBuffer, emailAccountId!, recipientAddress);

      const savedEmail = await deps.models.Email.findByPk(result.emailId) as Email | null;
      if (savedEmail) {
        await sendNewEmailNotifications(userId!, [savedEmail as NewEmailInfo], recipientAddress);

        publishMailboxUpdate(userId!, {
          type: 'NEW_EMAILS',
          emailAccountId: emailAccountId!,
          emails: [savedEmail],
          message: `New email from ${result.fromAddress}`,
        });
      }

      logger.info('Internal API', `Custom email processed: ${result.emailId} for ${recipientAddress}`);
      res.json({ success: true, ...result });
    } catch (error: any) {
      logger.error('Internal API', `Custom email processing failed: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
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

      const attachmentData = attachment.get({ plain: true });

      if (process.env.NODE_ENV !== 'production') {
        const { getLocalAttachmentPath } =
          await import('./helpers/attachment-storage.js');
        const filePath = getLocalAttachmentPath(attachmentData.storageKey);

        res.setHeader('Content-Type', attachmentData.mimeType);
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${attachmentData.filename}"`,
        );
        res.setHeader('Content-Length', attachmentData.size.toString());

        const { createReadStream } = await import('fs');
        const stream = createReadStream(filePath);
        stream.pipe(res);
      } else {
        const { getAttachmentDownloadUrl } =
          await import('./helpers/attachment-storage.js');
        const url = await getAttachmentDownloadUrl(attachmentData.storageKey);
        res.redirect(url);
      }
    } catch (error: any) {
      logger.error('Attachment Download', error.message);
      res.status(500).json({ error: 'Failed to download attachment' });
    }
  });

  // ====================================================================
  // OAuth Routes for email account linking (Google, Yahoo, Outlook)
  // ====================================================================
  const setupOAuthRoutes = async () => {
    const jwt = await import('jsonwebtoken');
    const { verifyToken: verifyAuthToken } = await import('./helpers/auth.js');
    const {
      buildGoogleAuthUrl,
      buildYahooAuthUrl,
      buildOutlookAuthUrl,
      exchangeGoogleCode,
      exchangeYahooCode,
      exchangeOutlookCode,
      revokeToken,
    } = await import('./helpers/oauth-tokens.js');
    const { storeImapCredentials, storeSmtpCredentials } = await import('./helpers/secrets.js');
    const { EmailAccount, AuthMethod } = await import('./db/models/email-account.model.js');
    const { ImapAccountSettings, ImapAccountType } = await import('./db/models/imap-account-settings.model.js');
    const { SendProfile, SendProfileType } = await import('./db/models/send-profile.model.js');
    const { SmtpAccountSettings } = await import('./db/models/smtp-account-settings.model.js');

    type OAuthProviderKey = 'google' | 'yahoo' | 'outlook';

    const providerConfig: Record<OAuthProviderKey, {
      buildAuthUrl: (state: string) => string;
      exchangeCode: (code: string) => Promise<{ accessToken: string; refreshToken: string; expiresAt: number; email: string }>;
      authMethod: string;
      providerId: string;
      imap: { host: string; port: number; useSsl: boolean };
      smtp: { host: string; port: number; useSsl: boolean };
    }> = {
      google: {
        buildAuthUrl: buildGoogleAuthUrl,
        exchangeCode: exchangeGoogleCode,
        authMethod: AuthMethod.OAUTH_GOOGLE,
        providerId: 'gmail',
        imap: { host: 'imap.gmail.com', port: 993, useSsl: true },
        smtp: { host: 'smtp.gmail.com', port: 587, useSsl: false },
      },
      yahoo: {
        buildAuthUrl: buildYahooAuthUrl,
        exchangeCode: exchangeYahooCode,
        authMethod: AuthMethod.OAUTH_YAHOO,
        providerId: 'yahoo',
        imap: { host: 'imap.mail.yahoo.com', port: 993, useSsl: true },
        smtp: { host: 'smtp.mail.yahoo.com', port: 587, useSsl: false },
      },
      outlook: {
        buildAuthUrl: buildOutlookAuthUrl,
        exchangeCode: exchangeOutlookCode,
        authMethod: AuthMethod.OAUTH_OUTLOOK,
        providerId: 'outlook',
        imap: { host: 'outlook.office365.com', port: 993, useSsl: true },
        smtp: { host: 'smtp.office365.com', port: 587, useSsl: false },
      },
    };

    const OAUTH_STATE_EXPIRY = '10m';
    const frontendSettingsUrl = `${config.frontendUrl}/settings/accounts`;

    for (const [provider, pConfig] of Object.entries(providerConfig) as [OAuthProviderKey, typeof providerConfig[OAuthProviderKey]][]) {
      // Start: validate user token, redirect to provider consent screen
      app.get(`/api/oauth/${provider}/start`, async (req, res) => {
        try {
          const token = req.query.token as string;
          const accountId = req.query.accountId as string | undefined;
          if (!token) {
            return res.redirect(`${frontendSettingsUrl}?oauth=error&reason=missing_token`);
          }

          const payload = await verifyAuthToken(token);
          if (!payload?.userId) {
            return res.redirect(`${frontendSettingsUrl}?oauth=error&reason=invalid_token`);
          }

          const statePayload = {
            userId: payload.userId,
            provider,
            accountId: accountId || undefined,
            csrf: crypto.randomUUID(),
          };
          const stateJwt = jwt.default.sign(statePayload, config.jwt.secret, {
            expiresIn: OAUTH_STATE_EXPIRY,
          });

          const authUrl = pConfig.buildAuthUrl(stateJwt);
          res.redirect(authUrl);
        } catch (err: any) {
          logger.error('OAuth', `${provider} start failed`, { error: err.message });
          res.redirect(`${frontendSettingsUrl}?oauth=error&reason=start_failed`);
        }
      });

      // Callback: exchange code for tokens, create account + send profile
      app.get(`/api/oauth/${provider}/callback`, async (req, res) => {
        try {
          const { code, state, error: oauthError } = req.query as Record<string, string>;

          if (oauthError) {
            logger.warn('OAuth', `${provider} callback received error: ${oauthError}`);
            return res.redirect(`${frontendSettingsUrl}?oauth=error&reason=${encodeURIComponent(oauthError)}`);
          }

          if (!code || !state) {
            return res.redirect(`${frontendSettingsUrl}?oauth=error&reason=missing_params`);
          }

          // Verify the state JWT
          let statePayload: { userId: string; provider: string; accountId?: string; csrf: string };
          try {
            statePayload = jwt.default.verify(state, config.jwt.secret) as any;
          } catch {
            return res.redirect(`${frontendSettingsUrl}?oauth=error&reason=invalid_state`);
          }

          if (statePayload.provider !== provider) {
            return res.redirect(`${frontendSettingsUrl}?oauth=error&reason=provider_mismatch`);
          }

          // Exchange code for tokens
          const tokenResult = await pConfig.exchangeCode(code);
          const oauthCreds = {
            type: 'oauth' as const,
            accessToken: tokenResult.accessToken,
            refreshToken: tokenResult.refreshToken,
            expiresAt: tokenResult.expiresAt,
            email: tokenResult.email,
            provider: provider as OAuthProviderKey,
          };

          // Re-auth flow: update existing account
          if (statePayload.accountId) {
            const existing = await EmailAccount.findOne({
              where: { id: statePayload.accountId, userId: statePayload.userId },
            });
            if (existing) {
              await storeImapCredentials(existing.id, oauthCreds);
              const linkedProfile = await SendProfile.findOne({
                where: { emailAccountId: existing.id },
              });
              if (linkedProfile) {
                await storeSmtpCredentials(linkedProfile.id, oauthCreds);
              }
              await existing.update({ needsReauth: false });
              logger.info('OAuth', `Re-authenticated ${provider} account ${existing.id} for user ${statePayload.userId}`);
              return res.redirect(`${frontendSettingsUrl}?oauth=success&reauth=true`);
            }
          }

          // Block duplicate: check if an account with the same email + provider already exists
          const existingDuplicate = await EmailAccount.findOne({
            where: {
              userId: statePayload.userId,
              email: tokenResult.email,
              authMethod: pConfig.authMethod,
            },
          });
          if (existingDuplicate) {
            logger.warn('OAuth', `Duplicate ${provider} account for ${tokenResult.email} blocked for user ${statePayload.userId}`);
            return res.redirect(`${frontendSettingsUrl}?oauth=error&reason=account_already_connected`);
          }

          // Create new account + send profile in a transaction
          const transaction = await deps.sequelize.transaction();
          try {
            const emailAccount = await EmailAccount.create({
              userId: statePayload.userId,
              name: tokenResult.email,
              email: tokenResult.email,
              type: 'IMAP',
              providerId: pConfig.providerId,
              authMethod: pConfig.authMethod,
            }, { transaction });

            const sendProfile = await SendProfile.create({
              userId: statePayload.userId,
              name: tokenResult.email,
              email: tokenResult.email,
              type: SendProfileType.SMTP,
              providerId: pConfig.providerId,
              authMethod: pConfig.authMethod,
              emailAccountId: emailAccount.id,
            }, { transaction });

            await emailAccount.update({ defaultSendProfileId: sendProfile.id }, { transaction });

            await SmtpAccountSettings.create({
              sendProfileId: sendProfile.id,
              host: pConfig.smtp.host,
              port: pConfig.smtp.port,
              useSsl: pConfig.smtp.useSsl,
            }, { transaction });

            await ImapAccountSettings.create({
              emailAccountId: emailAccount.id,
              host: pConfig.imap.host,
              port: pConfig.imap.port,
              accountType: ImapAccountType.IMAP,
              useSsl: pConfig.imap.useSsl,
            }, { transaction });

            await transaction.commit();

            // Store credentials after transaction (not critical path for rollback)
            await storeImapCredentials(emailAccount.id, oauthCreds);
            await storeSmtpCredentials(sendProfile.id, oauthCreds);

            logger.info('OAuth', `Created ${provider} account ${emailAccount.id} for user ${statePayload.userId}`);
            res.redirect(`${frontendSettingsUrl}?oauth=success`);
          } catch (txErr) {
            await transaction.rollback();
            throw txErr;
          }
        } catch (err: any) {
          logger.error('OAuth', `${provider} callback failed`, { error: err.message });
          res.redirect(`${frontendSettingsUrl}?oauth=error&reason=callback_failed`);
        }
      });
    }
  };

  await setupOAuthRoutes();

  // Stripe webhook endpoint (must use raw body for signature verification)
  app.post(
    '/api/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      logger.info('Stripe', 'Webhook endpoint triggered');
      if (!isStripeConfigured()) {
        return res.status(503).json({ error: 'Stripe is not configured' });
      }

      const signature = req.headers['stripe-signature'];
      if (!signature || typeof signature !== 'string') {
        return res.status(400).json({ error: 'Missing Stripe signature' });
      }

      try {
        await handleStripeWebhook(req.body, signature);
        res.json({ received: true });
      } catch (error: any) {
        logger.error('Stripe Webhook', error.message);
        res.status(400).json({ error: error.message });
      }
    },
  );

  const port = deps.port ?? 4000;

  return {
    apolloServer,
    app,
    httpServer,
    schema,
    dependencies: deps,

    start: async () => {
      await new Promise<void>((resolve) =>
        httpServer.listen({ port }, resolve),
      );
      if (deps.enableLogging) {
        logger.info(
          'Server',
          `📧 Email Client API ready at http://localhost:${port}${API_ROUTES.GRAPHQL}`,
        );
      }
      // Pre-warm embedding model so first semantic search has no cold-start
      preWarmEmbeddingModel();
      // Start background sync for stale email accounts (unless disabled)
      if (!deps.skipBackgroundSync) {
        startBackgroundSync();
      }
      // Start usage calculation daemon (unless disabled)
      if (!deps.skipUsageDaemon) {
        startUsageDaemon();
      }
    },

    stop: async () => {
      // Stop background sync scheduler
      stopBackgroundSync();
      // Stop usage daemon
      stopUsageDaemon();
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
