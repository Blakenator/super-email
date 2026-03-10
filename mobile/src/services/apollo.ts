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
  Observable,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { config } from '../config/env';
import { secureGet, secureSet, STORAGE_KEYS } from './secureStorage';
import { refreshSession } from './supabase';
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

// Token refresh state - ensures only one refresh happens at a time
let isRefreshingToken = false;
let pendingRefreshSubscribers: Array<(token: string) => void> = [];

function onTokenRefreshed(token: string) {
  pendingRefreshSubscribers.forEach(cb => cb(token));
  pendingRefreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  pendingRefreshSubscribers.push(cb);
}

export function isAuthError(code: string | undefined, message: string): boolean {
  const msg = message.toLowerCase();
  return (
    code === 'UNAUTHENTICATED' ||
    msg.includes('not authenticated') ||
    msg.includes('authentication required') ||
    msg.includes('jwt expired')
  );
}

// Error handling link with automatic token refresh and retry
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    const authErr = graphQLErrors.find(({ message, extensions }) =>
      isAuthError(extensions?.code as string | undefined, message),
    );

    if (authErr) {
      // Attempt to refresh the token and retry the operation
      return new Observable(observer => {
        const retryWithNewToken = (newToken: string) => {
          operation.setContext(({ headers = {} }: Record<string, any>) => ({
            headers: {
              ...headers,
              authorization: `Bearer ${newToken}`,
            },
          }));
          forward(operation).subscribe(observer);
        };

        if (isRefreshingToken) {
          addRefreshSubscriber(retryWithNewToken);
          return;
        }

        isRefreshingToken = true;
        console.log('[Apollo] Auth error detected, refreshing token...');

        refreshSession()
          .then(async (session) => {
            if (session?.access_token) {
              console.log('[Apollo] Token refreshed, retrying operation');
              await secureSet(STORAGE_KEYS.AUTH_TOKEN, session.access_token);
              isRefreshingToken = false;
              onTokenRefreshed(session.access_token);
              retryWithNewToken(session.access_token);
            } else {
              throw new Error('No access token in refreshed session');
            }
          })
          .catch((err) => {
            console.log('[Apollo] Token refresh failed, emitting authError:', err);
            isRefreshingToken = false;
            pendingRefreshSubscribers = [];
            authErrorEmitter.emit('authError', authErr.message);
            observer.error(authErr);
          });
      });
    }

    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      // eslint-disable-next-line no-console
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path?.join('.') ?? 'unknown'}`,
      );

      const code = extensions?.code as string | undefined;

      if (code === 'BAD_USER_INPUT' || code === 'GRAPHQL_VALIDATION_FAILED') {
        // eslint-disable-next-line no-console
        console.error('[GQL Validation Error]:', message);
        errorEmitter.emit('gqlError', {
          message,
          operation: operation.operationName,
        });
        return;
      }

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
        // Attempt token refresh for HTTP-level auth errors too
        return new Observable(observer => {
          const retryWithNewToken = (newToken: string) => {
            operation.setContext(({ headers = {} }: Record<string, any>) => ({
              headers: {
                ...headers,
                authorization: `Bearer ${newToken}`,
              },
            }));
            forward(operation).subscribe(observer);
          };

          if (isRefreshingToken) {
            addRefreshSubscriber(retryWithNewToken);
            return;
          }

          isRefreshingToken = true;
          refreshSession()
            .then(async (session) => {
              if (session?.access_token) {
                await secureSet(STORAGE_KEYS.AUTH_TOKEN, session.access_token);
                isRefreshingToken = false;
                onTokenRefreshed(session.access_token);
                retryWithNewToken(session.access_token);
              } else {
                throw new Error('No access token in refreshed session');
              }
            })
            .catch(() => {
              isRefreshingToken = false;
              pendingRefreshSubscribers = [];
              authErrorEmitter.emit('authError', 'Session expired');
              observer.error(networkError);
            });
        });
      }

      if (statusCode >= 500) {
        errorEmitter.emit('serverError', {
          message: 'Server error. Please try again later.',
          statusCode,
        });
        return;
      }
    }

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
          keyArgs: ['input', ['folder', 'emailAccountId', 'searchQuery', 'offset', 'limit']],
          merge(_existing, incoming) {
            return incoming;
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
    SendProfile: {
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
let subscriptionRetryTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Start mailbox subscription - call this when user is authenticated.
 * On auth errors, automatically refreshes the token, reconnects the
 * WebSocket, and retries.
 */
export function startMailboxSubscription(): void {
  if (subscriptionHandle) {
    console.log('[Subscription] Already subscribed, skipping');
    return;
  }

  if (subscriptionRetryTimeout) {
    clearTimeout(subscriptionRetryTimeout);
    subscriptionRetryTimeout = null;
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
      subscriptionHandle = null;

      if (isAuthError(undefined, err?.message || String(err))) {
        console.log('[Subscription] Auth error, refreshing token and reconnecting...');
        refreshSession()
          .then(async (session) => {
            if (session?.access_token) {
              await secureSet(STORAGE_KEYS.AUTH_TOKEN, session.access_token);
              reconnectWebSocket();
              subscriptionRetryTimeout = setTimeout(() => {
                startMailboxSubscription();
              }, 500);
            } else {
              authErrorEmitter.emit('authError', errMsg);
            }
          })
          .catch(() => {
            authErrorEmitter.emit('authError', errMsg);
          });
        return;
      }

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
  if (subscriptionRetryTimeout) {
    clearTimeout(subscriptionRetryTimeout);
    subscriptionRetryTimeout = null;
  }
  if (subscriptionHandle) {
    console.log('[Subscription] Stopping mailbox subscription...');
    subscriptionHandle.unsubscribe();
    subscriptionHandle = null;
  }
}

// NOTE: Subscription reconnection on foreground is handled by the auth store's
// AppState listener, which refreshes the token first and then restarts the
// subscription. We intentionally do NOT start subscriptions here to avoid
// racing ahead of the token refresh.

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
