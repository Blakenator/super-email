/**
 * Apollo Client configuration for React Native
 * Includes authentication, caching, and error handling
 */

import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  ApolloLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { config } from '../config/env';
import { secureGet, STORAGE_KEYS } from './secureStorage';

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
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
      
      // Handle authentication errors
      if (message.includes('Not authenticated') || message.includes('jwt expired')) {
        // Emit event for auth store to handle
        authErrorEmitter.emit('authError', message);
      }
    });
  }
  
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    
    // Handle offline mode
    if (networkError.message.includes('Network request failed')) {
      offlineEmitter.emit('offline');
    }
  }
});

// Simple event emitter for auth errors
type EventCallback = (data: string) => void;

class SimpleEventEmitter {
  private listeners: Map<string, EventCallback[]> = new Map();
  
  on(event: string, callback: EventCallback) {
    const existing = this.listeners.get(event) || [];
    this.listeners.set(event, [...existing, callback]);
  }
  
  off(event: string, callback: EventCallback) {
    const existing = this.listeners.get(event) || [];
    this.listeners.set(event, existing.filter(cb => cb !== callback));
  }
  
  emit(event: string, data: string = '') {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }
}

export const authErrorEmitter = new SimpleEventEmitter();
export const offlineEmitter = new SimpleEventEmitter();

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
