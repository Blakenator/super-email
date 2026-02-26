/**
 * Encryption Service
 * Provides AES-256-GCM encryption/decryption for cached data in AsyncStorage.
 * The encryption key is generated once via expo-crypto and stored in SecureStore.
 *
 * Uses @noble/ciphers for AES-GCM (authenticated encryption) and
 * expo-crypto for secure random byte generation. No native crypto
 * polyfill needed — both libraries work natively on Hermes.
 */

import { gcm } from '@noble/ciphers/aes.js';
import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const ENCRYPTION_KEY_STORAGE_KEY = 'encryption_key';
const NONCE_LENGTH = 12; // 96-bit nonce recommended for AES-GCM

let encryptionKey: Uint8Array | null = null;

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function loadOrCreateKey(): Promise<Uint8Array> {
  try {
    const existingKey = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORAGE_KEY, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    if (existingKey) {
      return base64ToBytes(existingKey);
    }
  } catch {
    // Key not found or access error — generate a new one
  }

  const newKeyBytes = getRandomBytes(32);
  const newKeyBase64 = bytesToBase64(newKeyBytes);
  await SecureStore.setItemAsync(ENCRYPTION_KEY_STORAGE_KEY, newKeyBase64, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return newKeyBytes;
}

/**
 * Initialize the encryption service. Must be called before encrypt/decrypt.
 * Returns whether a new key was generated (meaning old caches are invalid).
 */
export async function initEncryption(): Promise<{ isNewKey: boolean }> {
  const existingKey = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORAGE_KEY).catch(() => null);
  const isNewKey = existingKey === null;

  encryptionKey = await loadOrCreateKey();
  return { isNewKey };
}

function getKey(): Uint8Array {
  if (!encryptionKey) {
    throw new Error('Encryption not initialized. Call initEncryption() first.');
  }
  return encryptionKey;
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * Output format: base64(nonce || ciphertext || authTag)
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const nonce = getRandomBytes(NONCE_LENGTH);
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  const aes = gcm(key, nonce);
  const sealed = aes.encrypt(plaintextBytes);

  // Prepend nonce to the sealed output (ciphertext + auth tag)
  const combined = new Uint8Array(NONCE_LENGTH + sealed.length);
  combined.set(nonce, 0);
  combined.set(sealed, NONCE_LENGTH);

  return bytesToBase64(combined);
}

/**
 * Decrypt ciphertext produced by encrypt().
 * Expects base64(nonce || ciphertext || authTag).
 */
export function decrypt(ciphertext: string): string {
  const key = getKey();
  const combined = base64ToBytes(ciphertext);

  if (combined.length < NONCE_LENGTH + 16) {
    throw new Error('Decryption failed — data too short');
  }

  const nonce = combined.slice(0, NONCE_LENGTH);
  const sealed = combined.slice(NONCE_LENGTH);

  const aes = gcm(key, nonce);
  const plaintextBytes = aes.decrypt(sealed);

  const decoder = new TextDecoder();
  return decoder.decode(plaintextBytes);
}

export function isEncryptionReady(): boolean {
  return encryptionKey !== null;
}
