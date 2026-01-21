/**
 * Apollo Client configuration for React Native
 * Includes authentication, caching, and error handling
 */

import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { config } from '../config/env';
import { secureGet, STORAGE_KEYS } from './secureStorage';
import { Alert } from 'react-native';

// Create HTTP link
const httpLink = createHttpLink({
  uri: config.api.graphqlUrl,
});

// Auth link - adds authorization header
const authLink = setContext(async (_, { headers }) => {
  const token = await secureGet(STORAGE_KEYS.AUTH_TOKEN);

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      // eslint-disable-next-line no-console
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path?.join('.') ?? 'unknown'}`,
      );

      // Handle specific error codes
      const code = extensions?.code as string | undefined;

      if (
        code === 'UNAUTHENTICATED' ||
        message.includes('Not authenticated') ||
        message.includes('jwt expired')
      ) {
        // Emit event for auth store to handle
        authErrorEmitter.emit('authError', message);
        return;
      }

      if (code === 'BAD_USER_INPUT' || code === 'GRAPHQL_VALIDATION_FAILED') {
        // Handle validation errors - these are usually GQL issues
        // eslint-disable-next-line no-console
        console.error('[GQL Validation Error]:', message);
        errorEmitter.emit('gqlError', {
          message,
          operation: operation.operationName,
        });
        return;
      }

      // For other errors, emit a general error event
      errorEmitter.emit('error', {
        message,
        code: code ?? 'UNKNOWN',
        operation: operation.operationName,
      });
    });
  }

  if (networkError) {
    // eslint-disable-next-line no-console
    console.error(`[Network error]: ${networkError}`);

    // Check for HTTP status codes
    if ('statusCode' in networkError) {
      const statusCode = (networkError as { statusCode: number }).statusCode;

      if (statusCode === 400) {
        // eslint-disable-next-line no-console
        console.error('[400 Bad Request]: Check GQL query/mutation syntax');
        errorEmitter.emit('badRequest', {
          message: 'Invalid request. Please try again.',
          operation: operation.operationName,
        });
        return;
      }

      if (statusCode === 401 || statusCode === 403) {
        authErrorEmitter.emit('authError', 'Session expired');
        return;
      }

      if (statusCode >= 500) {
        errorEmitter.emit('serverError', {
          message: 'Server error. Please try again later.',
          statusCode,
        });
        return;
      }
    }

    // Handle offline mode
    if (networkError.message.includes('Network request failed')) {
      offlineEmitter.emit('offline');
    }
  }
});

// Simple event emitter for errors
type EventCallback<T = unknown> = (data: T) => void;

class SimpleEventEmitter<T = string> {
  private listeners = new Map<string, EventCallback<T>[]>();

  on(event: string, callback: EventCallback<T>) {
    const existing = this.listeners.get(event) || [];
    this.listeners.set(event, [...existing, callback]);
  }

  off(event: string, callback: EventCallback<T>) {
    const existing = this.listeners.get(event) || [];
    this.listeners.set(
      event,
      existing.filter((cb) => cb !== callback),
    );
  }

  emit(event: string, data?: T) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach((cb) => cb(data as T));
  }
}

export const authErrorEmitter = new SimpleEventEmitter<string>();
export const offlineEmitter = new SimpleEventEmitter<void>();
export const errorEmitter = new SimpleEventEmitter<{
  message: string;
  code?: string;
  operation?: string;
  statusCode?: number;
}>();

// Subscribe to error events and show alerts
errorEmitter.on('error', ({ message }) => {
  Alert.alert('Error', message);
});

errorEmitter.on('badRequest', ({ message, operation }) => {
  // eslint-disable-next-line no-console
  console.error(`[Bad Request in ${operation}]: ${message}`);
  Alert.alert('Request Error', message);
});

errorEmitter.on('serverError', ({ message }) => {
  Alert.alert('Server Error', message);
});

errorEmitter.on('gqlError', ({ message, operation }) => {
  // eslint-disable-next-line no-console
  console.error(`[GQL Error in ${operation}]: ${message}`);
  // Don't show alert for GQL validation errors - they're usually dev issues
});

// Create cache with type policies
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        getEmails: {
          // Merge paginated results
          keyArgs: ['input', ['folder', 'emailAccountId', 'searchQuery']],
          merge(existing = [], incoming, { args }) {
            const offset = args?.input?.offset || 0;
            const merged = existing.slice(0);

            for (let i = 0; i < incoming.length; i++) {
              merged[offset + i] = incoming[i];
            }

            return merged;
          },
        },
      },
    },
    Email: {
      keyFields: ['id'],
    },
    EmailAccount: {
      keyFields: ['id'],
    },
    Contact: {
      keyFields: ['id'],
    },
    Tag: {
      keyFields: ['id'],
    },
    SmtpProfile: {
      keyFields: ['id'],
    },
    MailRule: {
      keyFields: ['id'],
    },
  },
});

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

// Clear cache on logout
export async function clearApolloCache(): Promise<void> {
  await apolloClient.clearStore();
}

/**
 * Helper to safely execute a GraphQL operation with error handling
 */
export async function safeQuery<T>(
  queryFn: () => Promise<T>,
  options?: {
    showErrorAlert?: boolean;
    fallback?: T;
  },
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await queryFn();
    return { data, error: null };
  } catch (err: unknown) {
    const message = (err as Error)?.message || 'An error occurred';
    // eslint-disable-next-line no-console
    console.error('[safeQuery error]:', message);

    if (options?.showErrorAlert) {
      Alert.alert('Error', message);
    }

    return { data: options?.fallback ?? null, error: message };
  }
}
