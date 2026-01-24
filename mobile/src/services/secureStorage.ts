/**
 * Secure Storage Service
 * Uses expo-secure-store for encrypted storage of sensitive data (tokens, etc.)
 * and AsyncStorage for less sensitive cached data (emails, contacts).
 * 
 * SecureStore has a 2KB limit, so we use AsyncStorage for larger cached data.
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for secure storage (sensitive, small data - uses SecureStore)
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  REMEMBER_ME: 'remember_me',
  SAVED_EMAIL: 'saved_email',
  LAST_SYNC_TIME: 'last_sync_time',
  PUSH_TOKEN: 'push_token',
  THEME_PREFERENCE: 'theme_preference',
} as const;

// Keys for async storage (larger cached data - uses AsyncStorage)
export const CACHE_KEYS = {
  CACHED_EMAILS: '@cache/emails',
  CACHED_CONTACTS: '@cache/contacts',
} as const;

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
type CacheKey = typeof CACHE_KEYS[keyof typeof CACHE_KEYS];

/**
 * Save a value to secure storage (for small, sensitive data)
 */
export async function secureSet(key: StorageKey, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    console.error(`Error saving to secure storage [${key}]:`, error);
    throw error;
  }
}

/**
 * Get a value from secure storage
 */
export async function secureGet(key: StorageKey): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`Error reading from secure storage [${key}]:`, error);
    return null;
  }
}

/**
 * Delete a value from secure storage
 */
export async function secureDelete(key: StorageKey): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`Error deleting from secure storage [${key}]:`, error);
  }
}

/**
 * Save an object to secure storage (JSON serialized) - for small data only
 */
export async function secureSetObject<T>(key: StorageKey, value: T): Promise<void> {
  const jsonValue = JSON.stringify(value);
  await secureSet(key, jsonValue);
}

/**
 * Get an object from secure storage (JSON parsed)
 */
export async function secureGetObject<T>(key: StorageKey): Promise<T | null> {
  const jsonValue = await secureGet(key);
  if (!jsonValue) return null;
  
  try {
    return JSON.parse(jsonValue) as T;
  } catch (error) {
    console.error(`Error parsing JSON from secure storage [${key}]:`, error);
    return null;
  }
}

// ============================================================================
// AsyncStorage functions for larger cached data (emails, contacts)
// ============================================================================

/**
 * Save a value to async storage (for larger, non-sensitive cached data)
 */
export async function cacheSet(key: CacheKey, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error saving to cache [${key}]:`, error);
  }
}

/**
 * Get a value from async storage cache
 */
export async function cacheGet(key: CacheKey): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error(`Error reading from cache [${key}]:`, error);
    return null;
  }
}

/**
 * Delete a value from async storage cache
 */
export async function cacheDelete(key: CacheKey): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error deleting from cache [${key}]:`, error);
  }
}

/**
 * Save an object to async storage cache (JSON serialized)
 */
export async function cacheSetObject<T>(key: CacheKey, value: T): Promise<void> {
  const jsonValue = JSON.stringify(value);
  await cacheSet(key, jsonValue);
}

/**
 * Get an object from async storage cache (JSON parsed)
 */
export async function cacheGetObject<T>(key: CacheKey): Promise<T | null> {
  const jsonValue = await cacheGet(key);
  if (!jsonValue) return null;
  
  try {
    return JSON.parse(jsonValue) as T;
  } catch (error) {
    console.error(`Error parsing JSON from cache [${key}]:`, error);
    return null;
  }
}

/**
 * Clear all secure storage and cache (for logout)
 */
export async function clearSecureStorage(): Promise<void> {
  const keysToDelete = [
    STORAGE_KEYS.AUTH_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER_DATA,
    STORAGE_KEYS.LAST_SYNC_TIME,
  ];
  
  // Clear sensitive data from SecureStore
  await Promise.all(keysToDelete.map(key => secureDelete(key)));
  
  // Clear cached data from AsyncStorage
  await Promise.all([
    cacheDelete(CACHE_KEYS.CACHED_EMAILS),
    cacheDelete(CACHE_KEYS.CACHED_CONTACTS),
  ]);
}

/**
 * Check if biometric storage is available
 */
export async function isBiometricStorageAvailable(): Promise<boolean> {
  try {
    // Test if we can access secure store with biometric requirements
    const testKey = '__biometric_test__';
    await SecureStore.setItemAsync(testKey, 'test', {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      requireAuthentication: true,
    });
    await SecureStore.deleteItemAsync(testKey);
    return true;
  } catch {
    return false;
  }
}
