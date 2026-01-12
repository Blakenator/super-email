import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { BackendContext } from '../types.js';

// In production, use environment variable
const JWT_SECRET = 'email-client-secret-key-change-in-production';
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export function getUserIdFromContext(context: BackendContext): string | null {
  if (context.userId) {
    return context.userId;
  }
  if (context.token) {
    const payload = verifyToken(context.token);
    return payload?.userId ?? null;
  }
  return null;
}

export function requireAuth(context: BackendContext): string {
  const userId = getUserIdFromContext(context);
  if (!userId) {
    throw new Error('Authentication required');
  }
  return userId;
}
