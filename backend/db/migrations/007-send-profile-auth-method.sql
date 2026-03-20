-- Add authMethod and emailAccountId columns to send_profiles.
-- Reuses the existing enum_email_accounts_authMethod ENUM type.

ALTER TABLE send_profiles
  ADD COLUMN IF NOT EXISTS "authMethod" "enum_email_accounts_authMethod" NOT NULL DEFAULT 'PASSWORD';

ALTER TABLE send_profiles
  ADD COLUMN IF NOT EXISTS "emailAccountId" UUID REFERENCES email_accounts(id) ON DELETE SET NULL;
