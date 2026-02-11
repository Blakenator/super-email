import { createClient } from '@supabase/supabase-js';
import type { BackendContext } from '../types.js';
import { AuthenticationMethod } from '../db/models/index.js';
import { config } from '../config/env.js';
import { logger } from './logger.js';

// Supabase client configuration
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
);

/**
 * Verify a Supabase JWT token and return the local user ID
 * by looking up the auth method with the matching Supabase user ID
 */
export async function verifyToken(
  token: string,
): Promise<{ userId: string; supabaseUserId: string } | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.debug('Auth', 'Token verification failed: no user or error from Supabase', { error: error?.message });
      return null;
    }

    const supabaseUserId = user.id;

    // Look up auth method to find the local user ID
    const authMethod = await AuthenticationMethod.findOne({
      where: { providerUserId: supabaseUserId },
    });

    if (authMethod) {
      return { userId: authMethod.userId, supabaseUserId };
    }

    // No auth method found yet - this is okay for new users
    // The me query or login/signup will create the auth method
    // Return null for userId so requireAuth will fail but we have supabaseUserId for later
    return { userId: '', supabaseUserId };
  } catch (err) {
    logger.error('Auth', 'verifyToken failed unexpectedly', { error: err instanceof Error ? err.message : err });
    return null;
  }
}

/**
 * Get user metadata from Supabase
 */
export async function getUserFromToken(token: string): Promise<{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
} | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.debug('Auth', 'getUserFromToken failed: no user or error from Supabase', { error: error?.message });
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      firstName: user.user_metadata?.firstName || '',
      lastName: user.user_metadata?.lastName || '',
    };
  } catch (err) {
    logger.error('Auth', 'getUserFromToken failed unexpectedly', { error: err instanceof Error ? err.message : err });
    return null;
  }
}

export function getUserIdFromContext(context: BackendContext): string | null {
  return context.userId || null;
}

export function requireAuth(context: BackendContext): string {
  const userId = getUserIdFromContext(context);
  if (!userId) {
    throw new Error('Authentication required');
  }
  return userId;
}
