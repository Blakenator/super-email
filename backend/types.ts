import type { Sequelize } from 'sequelize-typescript';
import type { Resolvers } from './__generated__/resolvers-types.js';
import type { MyContext } from '@main/common';

export type BackendContext = MyContext & {
  sequelize: Sequelize;
};
export type AllBackendResolvers = Resolvers<BackendContext>;

export type AllQueries = NonNullable<AllBackendResolvers['Query']>;
export type AllMutations = NonNullable<AllBackendResolvers['Mutation']>;

// Use looser types for resolvers since Sequelize models don't perfectly match GraphQL types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeQuery<K extends keyof AllQueries>(
  _query: K,
  resolver: (...args: any[]) => any,
): NonNullable<AllQueries[K]> {
  return resolver as NonNullable<AllQueries[K]>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeMutation<K extends keyof AllMutations>(
  _mutation: K,
  resolver: (...args: any[]) => any,
): NonNullable<AllMutations[K]> {
  return resolver as NonNullable<AllMutations[K]>;
}
