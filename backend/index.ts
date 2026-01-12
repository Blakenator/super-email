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

const app = express();

const httpServer = http.createServer(app);

const typeDefs = readFileSync('../common/schema.graphql', {
  encoding: 'utf-8',
});

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
        throw Error(
          `Error occurred while serializing the date string: ${e.message}`,
        );
      }
    }
    throw Error('GraphQL Date Scalar serializer expected a `Date` object');
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

const resolvers: AllBackendResolvers = {
  Query: QueryResolvers,
  Mutation: MutationResolvers,
  Date: dateScalar,
};

const server = new ApolloServer<MyContext>({
  typeDefs,
  resolvers: resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  formatError: (formattedError, error) => {
    console.error(
      `Uncaught error encountered:`,
      (error as any)?.originalError ?? error,
    );
    return formattedError;
  },
});

await server.start();

await sequelize.sync({ alter: true });

app.use(
  '/api/graphql',
  cors<cors.CorsRequest>(),
  express.json(),
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

await new Promise<void>((resolve) =>
  httpServer.listen({ port: 4000 }, resolve),
);

console.log(`📧 Email Client API ready at http://localhost:4000/api/graphql`);
