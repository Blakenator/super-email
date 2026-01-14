import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
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
import { Toaster } from 'react-hot-toast';
import { AuthProvider, supabase } from './contexts/AuthContext.tsx';
import { ErrorBoundary } from './core/components/ErrorBoundary.tsx';
import { theme } from './core/theme.ts';

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
    <ThemeProvider theme={theme}>
      <ErrorBoundary>
        <ApolloProvider client={client}>
          <AuthProvider>
            <BrowserRouter>
              <App />
              <Toaster
                position="bottom-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    iconTheme: {
                      primary: '#22c55e',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </BrowserRouter>
          </AuthProvider>
        </ApolloProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
);
