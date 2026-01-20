/**
 * Secure Storage Service
 * Uses expo-secure-store for encrypted storage of sensitive data
 * and AsyncStorage for less sensitive cached data.
 */

import * as SecureStore from 'expo-secure-store';

// Keys for secure storage
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  REMEMBER_ME: 'remember_me',
  SAVED_EMAIL: 'saved_email',
  CACHED_EMAILS: 'cached_emails',
  CACHED_CONTACTS: 'cached_contacts',
  LAST_SYNC_TIME: 'last_sync_time',
  PUSH_TOKEN: 'push_token',
  THEME_PREFERENCE: 'theme_preference',
} as const;

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

/**
 * Save a value to secure storage
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
 * Save an object to secure storage (JSON serialized)
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

/**
 * Clear all secure storage (for logout)
 */
export async function clearSecureStorage(): Promise<void> {
  const keysToDelete = [
    STORAGE_KEYS.AUTH_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER_DATA,
    STORAGE_KEYS.CACHED_EMAILS,
    STORAGE_KEYS.CACHED_CONTACTS,
    STORAGE_KEYS.LAST_SYNC_TIME,
  ];
  
  await Promise.all(keysToDelete.map(key => secureDelete(key)));
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
