/**
 * Supabase Client for React Native
 * Configured with secure storage for session persistence
 */

import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';
import { secureGet, secureSet, secureDelete, STORAGE_KEYS } from './secureStorage';

// Custom storage adapter using expo-secure-store
const secureStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    return secureGet(key as typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]);
  },
  async setItem(key: string, value: string): Promise<void> {
    await secureSet(key as typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS], value);
  },
  async removeItem(key: string): Promise<void> {
    await secureDelete(key as typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]);
  },
};

// Create Supabase client with secure storage
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      storage: secureStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Not needed for mobile
    },
  }
);

// Auth helper functions
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: { firstName?: string; lastName?: string }
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function refreshSession() {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) throw error;
  return data.session;
}

// Listen for auth state changes
export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  return supabase.auth.onAuthStateChange(callback);
}
