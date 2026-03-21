/** Kept separate from email-account.model to avoid circular imports with send-profile.model. */
export enum AuthMethod {
  PASSWORD = 'PASSWORD',
  OAUTH_GOOGLE = 'OAUTH_GOOGLE',
  OAUTH_YAHOO = 'OAUTH_YAHOO',
  OAUTH_OUTLOOK = 'OAUTH_OUTLOOK',
}
