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

// Import Email model for field resolvers
import { Email } from './db/models/index.js';

const resolvers = {
  Query: QueryResolvers,
  Mutation: MutationResolvers,
  Date: dateScalar,
  JSON: jsonScalar,
  // Field resolvers for computed fields
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
  },
} as AllBackendResolvers;

const server = new ApolloServer<BackendContext>({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer }), loggingPlugin],
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

      if (token) {
        const payload = verifyToken(token);
        userId = payload?.userId;
      }

      return {
        token,
        userId,
        sequelize,
      };
    },
  }),
);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start HTTP server
await new Promise<void>((resolve) =>
  httpServer.listen({ port: 4000 }, resolve),
);

logger.info(
  'Server',
  '📧 Email Client API ready at http://localhost:4000/api/graphql',
);
