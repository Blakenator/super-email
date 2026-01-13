import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import 'bootstrap/dist/css/bootstrap.min.css';

import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core';
import { ApolloProvider } from '@apollo/client/react';
import { setContext } from '@apollo/client/link/context';
import { BrowserRouter } from 'react-router';
import { ThemeProvider } from 'styled-components';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, supabase } from './contexts/AuthContext.tsx';
import { ErrorBoundary } from './core/components/ErrorBoundary.tsx';
import { theme } from './core/theme.ts';

const httpLink = new HttpLink({ uri: '/api/graphql' });

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

const client = new ApolloClient({
  link: authLink.concat(httpLink),
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
