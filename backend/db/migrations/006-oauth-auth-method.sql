-- Add OAuth authentication method tracking to email accounts.
-- Supports PASSWORD (existing), OAUTH_GOOGLE, OAUTH_YAHOO, OAUTH_OUTLOOK.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_email_accounts_authMethod') THEN
    CREATE TYPE "enum_email_accounts_authMethod" AS ENUM (
      'PASSWORD',
      'OAUTH_GOOGLE',
      'OAUTH_YAHOO',
      'OAUTH_OUTLOOK'
    );
  END IF;
END
$$;

ALTER TABLE email_accounts
  ADD COLUMN IF NOT EXISTS "authMethod" "enum_email_accounts_authMethod" NOT NULL DEFAULT 'PASSWORD';

ALTER TABLE email_accounts
  ADD COLUMN IF NOT EXISTS "needsReauth" BOOLEAN NOT NULL DEFAULT false;
