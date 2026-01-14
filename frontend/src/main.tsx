import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  split,
} from '@apollo/client/core';
import { ApolloProvider } from '@apollo/client/react';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { BrowserRouter } from 'react-router';
import { ThemeProvider } from 'styled-components';
import { AuthProvider, supabase } from './contexts/AuthContext.tsx';
import { ErrorBoundary } from './core/components/ErrorBoundary.tsx';
import { lightTheme } from './core/theme.ts';
import { ThemedApp } from './ThemedApp.tsx';

const httpLink = new HttpLink({ uri: '/api/graphql' });

// WebSocket link for subscriptions
const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/graphql`;

const wsLink = new GraphQLWsLink(
  createClient({
    url: wsUrl,
    connectionParams: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return {
        authorization: session?.access_token
          ? `Bearer ${session.access_token}`
          : '',
      };
    },
    // Reconnect on close
    shouldRetry: () => true,
    retryAttempts: Infinity, // Keep retrying
    retryWait: async (retries) => {
      // Exponential backoff with max 30 seconds
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(1000 * 2 ** retries, 30000)),
      );
    },
    keepAlive: 10000, // Send ping every 10 seconds
    on: {
      connected: () => console.log('[WS] Connected'),
      closed: (event) => console.log('[WS] Closed', event),
      error: (error) => console.error('[WS] Error', error),
    },
  }),
);

const authLink = setContext(async (_, { headers }) => {
  // Get the current session from Supabase
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Split link - use WebSocket for subscriptions, HTTP for queries/mutations
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink),
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Initial light theme for loading state, ThemedApp will apply actual theme */}
    <ThemeProvider theme={lightTheme}>
      <ErrorBoundary>
        <ApolloProvider client={client}>
          <AuthProvider>
            <BrowserRouter>
              <ThemedApp />
            </BrowserRouter>
          </AuthProvider>
        </ApolloProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
);
