import { ImapFlow } from 'imapflow';
import type { ImapAccountSettings } from '../db/models/imap-account-settings.model.js';
import { getImapCredentials } from './secrets.js';
import { logger } from './logger.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes('timeout') ||
    message.includes('etimedout') ||
    message.includes('econnreset') ||
    message.includes('econnrefused') ||
    message.includes('socket hang up') ||
    message.includes('connection closed') ||
    message.includes('network error')
  );
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = MAX_RETRIES,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (isRetryableError(error) && attempt < maxRetries) {
        logger.warn('IMAP', `${operationName} failed (attempt ${attempt}/${maxRetries}): ${lastError.message}. Retrying in ${RETRY_DELAY_MS}ms...`);
        await sleep(RETRY_DELAY_MS * attempt);
      } else {
        throw lastError;
      }
    }
  }

  throw lastError;
}

export function createImapClientFromCredentials(
  host: string,
  port: number,
  username: string,
  password: string,
  useSsl: boolean,
): ImapFlow {
  return new ImapFlow({
    host,
    port,
    secure: useSsl,
    auth: { user: username, pass: password },
    logger: false,
  });
}

/**
 * Create an IMAP client for an account, resolving credentials
 * from the secure store.
 */
export async function createImapClient(
  imapSettings: ImapAccountSettings,
): Promise<ImapFlow> {
  const credentials = await getImapCredentials(imapSettings.emailAccountId);
  if (!credentials) {
    throw new Error(
      `No IMAP credentials found for account ${imapSettings.emailAccountId}`,
    );
  }
  return createImapClientFromCredentials(
    imapSettings.host,
    imapSettings.port,
    credentials.username,
    credentials.password,
    imapSettings.useSsl,
  );
}

export async function testImapConnection(
  host: string,
  port: number,
  username: string,
  password: string,
  useSsl: boolean,
): Promise<{ success: boolean; error?: string }> {
  const client = createImapClientFromCredentials(host, port, username, password, useSsl);

  try {
    await withRetry(() => client.connect(), `Test connect to ${host}`);
    await client.logout();
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    try {
      await client.logout();
    } catch (logoutErr) {
      logger.debug('IMAP', `Logout failed after connection test to ${host}`, { error: logoutErr instanceof Error ? logoutErr.message : logoutErr });
    }
    return { success: false, error: errorMsg };
  }
}

export async function testImapConnectionForAccount(
  imapSettings: ImapAccountSettings,
): Promise<{ success: boolean; error?: string }> {
  const credentials = await getImapCredentials(imapSettings.emailAccountId);
  if (!credentials) {
    return { success: false, error: 'No credentials found for this account' };
  }

  return testImapConnection(
    imapSettings.host,
    imapSettings.port,
    credentials.username,
    credentials.password,
    imapSettings.useSsl,
  );
}

export async function listImapMailboxes(
  imapSettings: ImapAccountSettings,
): Promise<string[]> {
  const client = await createImapClient(imapSettings);

  try {
    await withRetry(
      () => client.connect(),
      `Connect to ${imapSettings.host} for listing`,
    );
    const mailboxes = await withRetry(() => client.list(), 'List mailboxes');
    await client.logout();

    return mailboxes.map((mb) => mb.path);
  } catch (err) {
    logger.error('IMAP', `Failed to list mailboxes for account ${imapSettings.emailAccountId}`, { error: err instanceof Error ? err.message : err });
    try {
      await client.logout();
    } catch (logoutErr) {
      logger.debug('IMAP', `Logout failed after listing mailboxes`, { error: logoutErr instanceof Error ? logoutErr.message : logoutErr });
    }
    throw err;
  }
}
