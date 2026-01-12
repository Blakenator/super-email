import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './schema.graphql',
  documents: ['../frontend/src/**/*.{ts,tsx}'],
  generates: {
    '../backend/__generated__/resolvers-types.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        useIndexSignature: true,
        contextType: '@main/common#MyContext',
        strictScalars: true,
        scalars: {
          Date: 'Date',
          JSON: 'Record<string, unknown>',
        },
      },
    },
    '../frontend/src/__generated__/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'gql',
        fragmentMasking: false,
      },
      config: {
        strictScalars: true,
        scalars: {
          Date: 'string',
          JSON: 'Record<string, unknown>',
        },
        useTypeImports: true,
      },
    },
  },
};
export default config;
