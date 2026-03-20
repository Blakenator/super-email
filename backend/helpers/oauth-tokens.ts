/**
 * OAuth Token Refresh & Revocation
 *
 * Handles access-token lifecycle for Google, Yahoo, and Outlook OAuth accounts.
 * - Checks expiry and refreshes automatically before IMAP/SMTP connections.
 * - Revokes tokens with the provider on account deletion.
 * - Marks accounts as needsReauth when refresh tokens become invalid.
 */

import { config } from '../config/env.js';
import { logger } from './logger.js';
import {
  type OAuthCredentials,
  type OAuthProvider,
  storeImapCredentials,
  storeSmtpCredentials,
  getImapCredentials,
  getSmtpCredentials,
} from './secrets.js';
import { EmailAccount } from '../db/models/email-account.model.js';

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // refresh 5 minutes before expiry

export class ReauthRequiredError extends Error {
  constructor(public accountId: string, public provider: OAuthProvider) {
    super(`OAuth re-authentication required for ${provider} account ${accountId}`);
    this.name = 'ReauthRequiredError';
  }
}

// ============================================================================
// Token Refresh
// ============================================================================

async function refreshGoogleToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: number }> {
  const { OAuth2Client } = await import('google-auth-library');
  const client = new OAuth2Client(
    config.oauth.google.clientId,
    config.oauth.google.clientSecret,
  );
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();
  if (!credentials.access_token) {
    throw new Error('Google token refresh returned no access token');
  }
  return {
    accessToken: credentials.access_token,
    expiresAt: credentials.expiry_date || Date.now() + 3600 * 1000,
  };
}

async function refreshYahooToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: number }> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.oauth.yahoo.clientId,
    client_secret: config.oauth.yahoo.clientSecret,
  });

  const resp = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Yahoo token refresh failed (${resp.status}): ${body}`);
  }

  const data = await resp.json() as { access_token: string; expires_in: number; refresh_token?: string };
  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

async function refreshOutlookToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: number }> {
  const { ConfidentialClientApplication } = await import('@azure/msal-node');
  const cca = new ConfidentialClientApplication({
    auth: {
      clientId: config.oauth.outlook.clientId,
      clientSecret: config.oauth.outlook.clientSecret,
      authority: 'https://login.microsoftonline.com/common',
    },
  });

  const result = await cca.acquireTokenByRefreshToken({
    refreshToken,
    scopes: [
      'https://outlook.office365.com/IMAP.AccessAsUser.All',
      'https://outlook.office365.com/SMTP.Send',
      'offline_access',
    ],
  });

  if (!result?.accessToken) {
    throw new Error('Outlook token refresh returned no access token');
  }

  return {
    accessToken: result.accessToken,
    expiresAt: result.expiresOn ? result.expiresOn.getTime() : Date.now() + 3600 * 1000,
  };
}

/**
 * Get a valid access token, refreshing if expired.
 * Updates the stored credentials with the new token on refresh.
 * Throws ReauthRequiredError if the refresh token is invalid.
 */
export async function getValidAccessToken(
  credentialType: 'imap' | 'smtp',
  id: string,
  credentials: OAuthCredentials,
): Promise<string> {
  if (credentials.expiresAt > Date.now() + TOKEN_EXPIRY_BUFFER_MS) {
    return credentials.accessToken;
  }

  logger.info('OAuth', `Refreshing ${credentials.provider} token for ${credentialType}:${id}`);

  try {
    let result: { accessToken: string; expiresAt: number };

    switch (credentials.provider) {
      case 'google':
        result = await refreshGoogleToken(credentials.refreshToken);
        break;
      case 'yahoo':
        result = await refreshYahooToken(credentials.refreshToken);
        break;
      case 'outlook':
        result = await refreshOutlookToken(credentials.refreshToken);
        break;
    }

    const updated: OAuthCredentials = {
      ...credentials,
      accessToken: result.accessToken,
      expiresAt: result.expiresAt,
    };

    const storeFn = credentialType === 'imap' ? storeImapCredentials : storeSmtpCredentials;
    await storeFn(id, updated);

    logger.info('OAuth', `Refreshed ${credentials.provider} token for ${credentialType}:${id}`);
    return result.accessToken;
  } catch (err: any) {
    const message = err instanceof Error ? err.message : String(err);
    const isInvalidGrant =
      message.includes('invalid_grant') ||
      message.includes('Token has been expired or revoked') ||
      message.includes('invalid_token');

    if (isInvalidGrant) {
      logger.warn('OAuth', `Refresh token invalid for ${credentialType}:${id}, marking needsReauth`, { error: message });
      await markNeedsReauth(credentialType, id);
      throw new ReauthRequiredError(id, credentials.provider);
    }

    logger.error('OAuth', `Token refresh failed for ${credentialType}:${id}`, { error: message });
    throw err;
  }
}

async function markNeedsReauth(credentialType: 'imap' | 'smtp', id: string): Promise<void> {
  try {
    if (credentialType === 'imap') {
      await EmailAccount.update({ needsReauth: true }, { where: { id } });
    } else {
      // For SMTP, find the account via its send profile
      const { SendProfile } = await import('../db/models/send-profile.model.js');
      const profile = await SendProfile.findByPk(id);
      if (profile) {
        const account = await EmailAccount.findOne({ where: { defaultSendProfileId: id } });
        if (account) {
          await account.update({ needsReauth: true });
        }
      }
    }
  } catch (dbErr) {
    logger.error('OAuth', `Failed to mark needsReauth for ${credentialType}:${id}`, {
      error: dbErr instanceof Error ? dbErr.message : dbErr,
    });
  }
}

// ============================================================================
// Token Revocation
// ============================================================================

export async function revokeToken(provider: OAuthProvider, token: string): Promise<void> {
  try {
    switch (provider) {
      case 'google': {
        const resp = await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        if (!resp.ok) {
          logger.warn('OAuth', `Google token revocation returned ${resp.status}`);
        }
        break;
      }
      case 'yahoo': {
        const resp = await fetch('https://api.login.yahoo.com/oauth2/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            token,
            token_type_hint: 'refresh_token',
          }).toString(),
        });
        if (!resp.ok) {
          logger.warn('OAuth', `Yahoo token revocation returned ${resp.status}`);
        }
        break;
      }
      case 'outlook':
        // Microsoft does not provide a token revocation endpoint
        logger.debug('OAuth', 'Outlook does not support token revocation; deleting locally only');
        break;
    }
    logger.info('OAuth', `Revoked ${provider} token`);
  } catch (err) {
    logger.warn('OAuth', `Token revocation failed for ${provider} (best-effort)`, {
      error: err instanceof Error ? err.message : err,
    });
  }
}

// ============================================================================
// OAuth URL Generation
// ============================================================================

export function buildGoogleAuthUrl(stateJwt: string): string {
  const params = new URLSearchParams({
    client_id: config.oauth.google.clientId,
    redirect_uri: config.oauth.google.redirectUri,
    response_type: 'code',
    scope: 'https://mail.google.com/ openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state: stateJwt,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function buildYahooAuthUrl(stateJwt: string): string {
  const params = new URLSearchParams({
    client_id: config.oauth.yahoo.clientId,
    redirect_uri: config.oauth.yahoo.redirectUri,
    response_type: 'code',
    scope: 'mail-r mail-w openid',
    state: stateJwt,
  });
  return `https://api.login.yahoo.com/oauth2/request_auth?${params.toString()}`;
}

export function buildOutlookAuthUrl(stateJwt: string): string {
  const params = new URLSearchParams({
    client_id: config.oauth.outlook.clientId,
    redirect_uri: config.oauth.outlook.redirectUri,
    response_type: 'code',
    scope: 'https://outlook.office365.com/IMAP.AccessAsUser.All https://outlook.office365.com/SMTP.Send offline_access openid email profile',
    state: stateJwt,
  });
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
}

// ============================================================================
// Token Exchange (auth code -> tokens)
// ============================================================================

export interface OAuthTokenResult {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  email: string;
}

export async function exchangeGoogleCode(code: string): Promise<OAuthTokenResult> {
  const { OAuth2Client } = await import('google-auth-library');
  const client = new OAuth2Client(
    config.oauth.google.clientId,
    config.oauth.google.clientSecret,
    config.oauth.google.redirectUri,
  );
  const { tokens } = await client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Google code exchange did not return required tokens');
  }

  // Fetch user email from Google
  const userResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userResp.ok) throw new Error(`Failed to fetch Google user info: ${userResp.status}`);
  const userInfo = await userResp.json() as { email: string };

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expiry_date || Date.now() + 3600 * 1000,
    email: userInfo.email,
  };
}

export async function exchangeYahooCode(code: string): Promise<OAuthTokenResult> {
  const credentials = Buffer.from(
    `${config.oauth.yahoo.clientId}:${config.oauth.yahoo.clientSecret}`,
  ).toString('base64');

  const resp = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.oauth.yahoo.redirectUri,
    }).toString(),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Yahoo code exchange failed (${resp.status}): ${body}`);
  }

  const data = await resp.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    xoauth_yahoo_guid: string;
  };

  // Fetch user email from Yahoo
  const profileResp = await fetch(
    `https://api.login.yahoo.com/openid/v1/userinfo`,
    { headers: { Authorization: `Bearer ${data.access_token}` } },
  );
  if (!profileResp.ok) throw new Error(`Failed to fetch Yahoo user info: ${profileResp.status}`);
  const profile = await profileResp.json() as { email: string };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    email: profile.email,
  };
}

export async function exchangeOutlookCode(code: string): Promise<OAuthTokenResult> {
  const resp = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: config.oauth.outlook.clientId,
      client_secret: config.oauth.outlook.clientSecret,
      redirect_uri: config.oauth.outlook.redirectUri,
      scope: 'https://outlook.office365.com/IMAP.AccessAsUser.All https://outlook.office365.com/SMTP.Send offline_access openid email profile',
    }).toString(),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Outlook code exchange failed (${resp.status}): ${body}`);
  }

  const data = await resp.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  // Fetch user email from Microsoft Graph
  const profileResp = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  if (!profileResp.ok) throw new Error(`Failed to fetch Outlook user info: ${profileResp.status}`);
  const profile = await profileResp.json() as { mail?: string; userPrincipalName: string };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    email: profile.mail || profile.userPrincipalName,
  };
}
