/**
 * Apollo Client configuration for React Native
 * Includes authentication, caching, error handling, and WebSocket subscriptions
 */

import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  split,
  gql,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { config } from '../config/env';
import { secureGet, STORAGE_KEYS } from './secureStorage';
import { Alert, AppState } from 'react-native';

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

// Create WebSocket client for subscriptions
let wsClient: ReturnType<typeof createClient> | null = null;

const getWsClient = () => {
  if (!wsClient) {
    wsClient = createClient({
      url: config.api.wsUrl,
      connectionParams: async () => {
        const token = await secureGet(STORAGE_KEYS.AUTH_TOKEN);
        return {
          authorization: token ? `Bearer ${token}` : '',
        };
      },
      shouldRetry: () => true,
      retryAttempts: Infinity,
      on: {
        connected: () => {
          console.log('[WS] Connected to subscription server');
          subscriptionEmitter.emit('connected');
        },
        closed: () => {
          console.log('[WS] Disconnected from subscription server');
          subscriptionEmitter.emit('disconnected');
        },
        error: (error) => {
          console.error('[WS] Subscription error:', error);
          subscriptionEmitter.emit('error', error);
        },
      },
    });
  }
  return wsClient;
};

// Create WebSocket link
const wsLink = new GraphQLWsLink(getWsClient());

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

// Subscription connection emitter
export const subscriptionEmitter = new SimpleEventEmitter<unknown>();

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
  from([errorLink, authLink, httpLink]),
);

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: splitLink,
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

// Reconnect WebSocket (useful after token refresh)
export function reconnectWebSocket(): void {
  if (wsClient) {
    wsClient.dispose();
    wsClient = null;
  }
  // The next subscription will create a new client
}

// Mailbox subscription query
const MAILBOX_UPDATES_SUBSCRIPTION = gql`
  subscription MailboxUpdates {
    mailboxUpdates {
      type
      emailAccountId
      message
      emails {
        id
        messageId
        folder
        fromAddress
        fromName
        subject
        textBody
        receivedAt
        isRead
        isStarred
        emailAccountId
        toAddresses
        ccAddresses
        bccAddresses
        threadId
        threadCount
        tags {
          id
          name
          color
        }
      }
    }
  }
`;

export interface MailboxUpdate {
  type: 'NEW_EMAILS' | 'EMAIL_UPDATED' | 'EMAIL_DELETED' | 'SYNC_STARTED' | 'SYNC_COMPLETED' | 'CONNECTION_ESTABLISHED' | 'CONNECTION_CLOSED' | 'ERROR';
  emailAccountId?: string | null;
  message?: string | null;
  emails?: Array<{
    id: string;
    messageId: string;
    folder: string;
    fromAddress: string;
    fromName?: string | null;
    subject: string;
    textBody?: string | null;
    receivedAt: string;
    isRead: boolean;
    isStarred: boolean;
    emailAccountId: string;
    toAddresses: string[];
    ccAddresses?: string[] | null;
    bccAddresses?: string[] | null;
    threadId?: string | null;
    threadCount?: number | null;
    tags?: Array<{ id: string; name: string; color: string }>;
  }>;
}

// Mailbox update emitter for app to subscribe to
export const mailboxUpdateEmitter = new SimpleEventEmitter<MailboxUpdate>();

let subscriptionHandle: { unsubscribe: () => void } | null = null;

/**
 * Start mailbox subscription - call this when user is authenticated
 */
export function startMailboxSubscription(): void {
  if (subscriptionHandle) {
    console.log('[Subscription] Already subscribed, skipping');
    return;
  }

  console.log('[Subscription] Starting mailbox subscription...');
  
  const observable = apolloClient.subscribe({
    query: MAILBOX_UPDATES_SUBSCRIPTION,
  });

  subscriptionHandle = observable.subscribe({
    next: ({ data }) => {
      if (data?.mailboxUpdates) {
        console.log('[Subscription] Received update:', data.mailboxUpdates.type);
        mailboxUpdateEmitter.emit('update', data.mailboxUpdates);
      }
    },
    error: (err) => {
      console.error('[Subscription] Error:', err);
      subscriptionEmitter.emit('error', err);
    },
    complete: () => {
      console.log('[Subscription] Completed');
      subscriptionHandle = null;
    },
  });
}

/**
 * Stop mailbox subscription - call this when user logs out
 */
export function stopMailboxSubscription(): void {
  if (subscriptionHandle) {
    console.log('[Subscription] Stopping mailbox subscription...');
    subscriptionHandle.unsubscribe();
    subscriptionHandle = null;
  }
}

// Handle app state changes - reconnect when app comes to foreground
AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'active' && subscriptionHandle === null) {
    // Check if we should be subscribed (user is authenticated)
    secureGet(STORAGE_KEYS.AUTH_TOKEN).then((token) => {
      if (token) {
        console.log('[Subscription] App came to foreground, reconnecting...');
        startMailboxSubscription();
      }
    });
  }
});

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
