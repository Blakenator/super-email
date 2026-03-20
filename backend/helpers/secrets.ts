/**
 * Secure Credential Storage for IMAP/SMTP Credentials
 * 
 * In production (AWS): Uses AWS Secrets Manager
 * In development (local): Uses a local JSON file in data/ directory
 * 
 * Credentials are stored per email account/SMTP profile ID.
 * Supports both password-based and OAuth token-based credentials.
 */

import { config } from '../config/env.js';
import { logger } from './logger.js';
import fs from 'fs/promises';
import path from 'path';

export type OAuthProvider = 'google' | 'yahoo' | 'outlook';

export interface PasswordCredentials {
  type: 'password';
  username: string;
  password: string;
}

export interface OAuthCredentials {
  type: 'oauth';
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  email: string;
  provider: OAuthProvider;
}

export type EmailCredentials = PasswordCredentials | OAuthCredentials;

/**
 * Normalize credentials loaded from storage. Handles legacy entries
 * that were stored before the discriminated union was introduced
 * (they have username/password but no `type` field).
 */
function normalizeCredentials(raw: any): EmailCredentials {
  if (raw && raw.type === 'oauth') return raw as OAuthCredentials;
  if (raw && raw.type === 'password') return raw as PasswordCredentials;
  if (raw && raw.username !== undefined) {
    return { type: 'password', username: raw.username, password: raw.password };
  }
  return raw;
}

// AWS SDK is only loaded in production to avoid local dependency issues
let secretsManagerClient: any = null;

async function getSecretsManagerClient() {
  if (config.isDevelopment) {
    throw new Error('Secrets Manager should not be used in development');
  }
  
  if (!secretsManagerClient) {
    const { SecretsManagerClient } = await import('@aws-sdk/client-secrets-manager');
    secretsManagerClient = new SecretsManagerClient({ region: config.aws.region });
  }
  
  return secretsManagerClient;
}

/**
 * Get the secret name/path for a credential
 */
function getSecretPath(type: 'imap' | 'smtp', id: string): string {
  return `${config.secrets.basePath}/${type}/${id}`;
}

/**
 * Get the local secrets file path
 */
function getLocalSecretsPath(): string {
  return path.join(process.cwd(), config.secrets.localSecretsFile);
}

/**
 * Ensure the local secrets directory exists
 */
async function ensureLocalSecretsDir(): Promise<void> {
  const secretsPath = getLocalSecretsPath();
  const dir = path.dirname(secretsPath);
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Read local secrets file
 */
async function readLocalSecrets(): Promise<Record<string, any>> {
  try {
    const data = await fs.readFile(getLocalSecretsPath(), 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      logger.debug('Secrets', 'Local secrets file not found (first run), returning empty');
      return {};
    }
    throw error;
  }
}

/**
 * Write local secrets file
 */
async function writeLocalSecrets(secrets: Record<string, any>): Promise<void> {
  await ensureLocalSecretsDir();
  await fs.writeFile(getLocalSecretsPath(), JSON.stringify(secrets, null, 2), 'utf-8');
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Store credentials for an email account (IMAP)
 */
export async function storeImapCredentials(
  accountId: string,
  credentials: EmailCredentials
): Promise<void> {
  if (config.isProduction) {
    await storeCredentialsAWS('imap', accountId, credentials);
  } else {
    await storeCredentialsLocal('imap', accountId, credentials);
  }
}

/**
 * Get credentials for an email account (IMAP)
 */
export async function getImapCredentials(
  accountId: string
): Promise<EmailCredentials | null> {
  if (config.isProduction) {
    return getCredentialsAWS('imap', accountId);
  } else {
    return getCredentialsLocal('imap', accountId);
  }
}

/**
 * Delete credentials for an email account (IMAP)
 */
export async function deleteImapCredentials(accountId: string): Promise<void> {
  if (config.isProduction) {
    await deleteCredentialsAWS('imap', accountId);
  } else {
    await deleteCredentialsLocal('imap', accountId);
  }
}

/**
 * Store credentials for an SMTP profile
 */
export async function storeSmtpCredentials(
  profileId: string,
  credentials: EmailCredentials
): Promise<void> {
  if (config.isProduction) {
    await storeCredentialsAWS('smtp', profileId, credentials);
  } else {
    await storeCredentialsLocal('smtp', profileId, credentials);
  }
}

/**
 * Get credentials for an SMTP profile
 */
export async function getSmtpCredentials(
  profileId: string
): Promise<EmailCredentials | null> {
  if (config.isProduction) {
    return getCredentialsAWS('smtp', profileId);
  } else {
    return getCredentialsLocal('smtp', profileId);
  }
}

/**
 * Delete credentials for an SMTP profile
 */
export async function deleteSmtpCredentials(profileId: string): Promise<void> {
  if (config.isProduction) {
    await deleteCredentialsAWS('smtp', profileId);
  } else {
    await deleteCredentialsLocal('smtp', profileId);
  }
}

// ============================================================================
// AWS Secrets Manager Implementation
// ============================================================================

async function storeCredentialsAWS(
  type: 'imap' | 'smtp',
  id: string,
  credentials: EmailCredentials
): Promise<void> {
  const client = await getSecretsManagerClient();
  const { CreateSecretCommand, UpdateSecretCommand, ResourceNotFoundException } = await import('@aws-sdk/client-secrets-manager');
  
  const secretName = getSecretPath(type, id);
  const secretValue = JSON.stringify(credentials);
  
  try {
    // Try to update existing secret
    await client.send(new UpdateSecretCommand({
      SecretId: secretName,
      SecretString: secretValue,
    }));
    logger.info('Secrets', `Updated ${type} credentials for ${id}`);
  } catch (error: any) {
    if (error instanceof ResourceNotFoundException || error.name === 'ResourceNotFoundException') {
      // Secret doesn't exist, create it
      await client.send(new CreateSecretCommand({
        Name: secretName,
        SecretString: secretValue,
        Description: `Email ${type.toUpperCase()} credentials for account ${id}`,
        Tags: [
          { Key: 'Application', Value: 'email-client' },
          { Key: 'Type', Value: type },
        ],
      }));
      logger.info('Secrets', `Created ${type} credentials for ${id}`);
    } else {
      throw error;
    }
  }
}

async function getCredentialsAWS(
  type: 'imap' | 'smtp',
  id: string
): Promise<EmailCredentials | null> {
  const client = await getSecretsManagerClient();
  const { GetSecretValueCommand, ResourceNotFoundException } = await import('@aws-sdk/client-secrets-manager');
  
  const secretName = getSecretPath(type, id);
  
  try {
    const response = await client.send(new GetSecretValueCommand({
      SecretId: secretName,
    }));
    
    if (response.SecretString) {
      return normalizeCredentials(JSON.parse(response.SecretString));
    }
    
    return null;
  } catch (error: any) {
    if (error instanceof ResourceNotFoundException || error.name === 'ResourceNotFoundException') {
      logger.debug('Secrets', `${type} credentials not found in AWS for ${id}`);
      return null;
    }
    throw error;
  }
}

async function deleteCredentialsAWS(
  type: 'imap' | 'smtp',
  id: string
): Promise<void> {
  const client = await getSecretsManagerClient();
  const { DeleteSecretCommand, ResourceNotFoundException } = await import('@aws-sdk/client-secrets-manager');
  
  const secretName = getSecretPath(type, id);
  
  try {
    await client.send(new DeleteSecretCommand({
      SecretId: secretName,
      ForceDeleteWithoutRecovery: true,
    }));
    logger.info('Secrets', `Deleted ${type} credentials for ${id}`);
  } catch (error: any) {
    if (error instanceof ResourceNotFoundException || error.name === 'ResourceNotFoundException') {
      logger.debug('Secrets', `${type} credentials already deleted in AWS for ${id}`);
      return;
    }
    throw error;
  }
}

// ============================================================================
// Local File Implementation (Development Only)
// ============================================================================

async function storeCredentialsLocal(
  type: 'imap' | 'smtp',
  id: string,
  credentials: EmailCredentials
): Promise<void> {
  const secrets = await readLocalSecrets();
  const key = `${type}:${id}`;
  secrets[key] = credentials;
  await writeLocalSecrets(secrets);
  logger.info('Secrets', `Stored ${type} credentials locally for ${id}`);
}

async function getCredentialsLocal(
  type: 'imap' | 'smtp',
  id: string
): Promise<EmailCredentials | null> {
  const secrets = await readLocalSecrets();
  const key = `${type}:${id}`;
  const raw = secrets[key];
  if (!raw) return null;
  return normalizeCredentials(raw);
}

async function deleteCredentialsLocal(
  type: 'imap' | 'smtp',
  id: string
): Promise<void> {
  const secrets = await readLocalSecrets();
  const key = `${type}:${id}`;
  delete secrets[key];
  await writeLocalSecrets(secrets);
  logger.info('Secrets', `Deleted ${type} credentials locally for ${id}`);
}

