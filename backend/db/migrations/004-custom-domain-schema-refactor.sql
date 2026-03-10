-- Migration: Custom Domain Schema Refactor
--
-- 1. Create enum types
-- 2. Create imap_account_settings and copy data from email_accounts
-- 3. Create send_profiles and copy data from smtp_profiles
-- 4. Create smtp_account_settings and copy data from smtp_profiles
-- 5. Create custom domain tables
-- 6. Refactor email_accounts (add type, rename FK, drop moved columns)
-- 7. Refactor emails (rename smtpProfileId -> sendProfileId)
-- 8. Add domainTier to subscriptions, domainCount to user_usages

-- ============================================================================
-- 1. Create enum types
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE "enum_email_accounts_type" AS ENUM ('IMAP', 'CUSTOM_DOMAIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "enum_imap_account_settings_accountType" AS ENUM ('IMAP', 'POP3');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "enum_send_profiles_type" AS ENUM ('SMTP', 'CUSTOM_DOMAIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "enum_custom_domains_status" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "enum_custom_domain_dns_records_recordType" AS ENUM ('CNAME', 'TXT', 'MX');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "enum_custom_domain_dns_records_purpose" AS ENUM ('DKIM', 'SPF', 'DMARC', 'MX_INBOUND');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "enum_subscriptions_domainTier" AS ENUM ('free', 'basic', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. Create imap_account_settings and copy data from email_accounts
-- ============================================================================

CREATE TABLE IF NOT EXISTS "imap_account_settings" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "emailAccountId" UUID NOT NULL UNIQUE REFERENCES "email_accounts" ("id") ON DELETE CASCADE,
  "host" TEXT NOT NULL,
  "port" INTEGER NOT NULL,
  "accountType" "enum_imap_account_settings_accountType" NOT NULL,
  "useSsl" BOOLEAN NOT NULL DEFAULT true,
  "lastSyncedAt" TIMESTAMP WITH TIME ZONE,
  "historicalSyncId" TEXT,
  "historicalSyncProgress" INTEGER,
  "historicalSyncStatus" TEXT,
  "historicalSyncComplete" BOOLEAN NOT NULL DEFAULT false,
  "historicalSyncExpiresAt" TIMESTAMP WITH TIME ZONE,
  "historicalSyncLastAt" TIMESTAMP WITH TIME ZONE,
  "historicalSyncLastUidInbox" INTEGER,
  "historicalSyncLastUidSent" INTEGER,
  "historicalSyncTotalInbox" INTEGER,
  "historicalSyncTotalSent" INTEGER,
  "updateSyncId" TEXT,
  "updateSyncProgress" INTEGER,
  "updateSyncStatus" TEXT,
  "updateSyncExpiresAt" TIMESTAMP WITH TIME ZONE,
  "lastSyncUidNextInbox" INTEGER,
  "lastSyncUidNextSent" INTEGER,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Copy existing IMAP data from email_accounts (only if old columns still exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_accounts' AND column_name = 'host'
  ) THEN
    EXECUTE '
      INSERT INTO "imap_account_settings" (
        "emailAccountId", "host", "port", "accountType", "useSsl",
        "lastSyncedAt", "historicalSyncId", "historicalSyncProgress",
        "historicalSyncStatus", "historicalSyncComplete", "historicalSyncExpiresAt",
        "historicalSyncLastAt", "historicalSyncLastUidInbox", "historicalSyncLastUidSent",
        "historicalSyncTotalInbox", "historicalSyncTotalSent",
        "updateSyncId", "updateSyncProgress", "updateSyncStatus", "updateSyncExpiresAt",
        "lastSyncUidNextInbox", "lastSyncUidNextSent",
        "createdAt", "updatedAt"
      )
      SELECT
        ea."id", ea."host", ea."port",
        ea."accountType"::TEXT::"enum_imap_account_settings_accountType",
        ea."useSsl", ea."lastSyncedAt",
        ea."historicalSyncId", ea."historicalSyncProgress",
        ea."historicalSyncStatus", ea."historicalSyncComplete", ea."historicalSyncExpiresAt",
        ea."historicalSyncLastAt", ea."historicalSyncLastUidInbox", ea."historicalSyncLastUidSent",
        ea."historicalSyncTotalInbox", ea."historicalSyncTotalSent",
        ea."updateSyncId", ea."updateSyncProgress", ea."updateSyncStatus", ea."updateSyncExpiresAt",
        ea."lastSyncUidNextInbox", ea."lastSyncUidNextSent",
        ea."createdAt", ea."updatedAt"
      FROM "email_accounts" ea
      WHERE NOT EXISTS (
        SELECT 1 FROM "imap_account_settings" ias WHERE ias."emailAccountId" = ea."id"
      )';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "imap_account_settings_email_account_id"
  ON "imap_account_settings" ("emailAccountId");

-- ============================================================================
-- 3. Create send_profiles table and copy data from smtp_profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS "send_profiles" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "alias" TEXT,
  "type" "enum_send_profiles_type" NOT NULL DEFAULT 'SMTP',
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "providerId" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Copy existing data from smtp_profiles into send_profiles (only if old table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'smtp_profiles'
  ) THEN
    EXECUTE '
      INSERT INTO "send_profiles" (
        "id", "userId", "name", "email", "alias", "type", "isDefault", "providerId",
        "createdAt", "updatedAt"
      )
      SELECT
        sp."id", sp."userId", sp."name", sp."email", sp."alias",
        ''SMTP''::"enum_send_profiles_type",
        sp."isDefault", sp."providerId",
        sp."createdAt", sp."updatedAt"
      FROM "smtp_profiles" sp
      WHERE NOT EXISTS (
        SELECT 1 FROM "send_profiles" p WHERE p."id" = sp."id"
      )';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "send_profiles_user_id"
  ON "send_profiles" ("userId");

-- ============================================================================
-- 4. Create smtp_account_settings and copy data from smtp_profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS "smtp_account_settings" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sendProfileId" UUID NOT NULL UNIQUE REFERENCES "send_profiles" ("id") ON DELETE CASCADE,
  "host" TEXT NOT NULL,
  "port" INTEGER NOT NULL,
  "useSsl" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'smtp_profiles'
  ) THEN
    EXECUTE '
      INSERT INTO "smtp_account_settings" (
        "sendProfileId", "host", "port", "useSsl", "createdAt", "updatedAt"
      )
      SELECT
        sp."id", sp."host", sp."port", sp."useSsl", sp."createdAt", sp."updatedAt"
      FROM "smtp_profiles" sp
      WHERE NOT EXISTS (
        SELECT 1 FROM "smtp_account_settings" sas WHERE sas."sendProfileId" = sp."id"
      )';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "smtp_account_settings_send_profile_id"
  ON "smtp_account_settings" ("sendProfileId");

-- ============================================================================
-- 5. Create custom domain tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS "custom_domains" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "domain" TEXT NOT NULL UNIQUE,
  "status" "enum_custom_domains_status" NOT NULL DEFAULT 'PENDING_VERIFICATION',
  "sesIdentityArn" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "custom_domains_user_id" ON "custom_domains" ("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "custom_domains_domain" ON "custom_domains" ("domain");

CREATE TABLE IF NOT EXISTS "custom_domain_dns_records" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "customDomainId" UUID NOT NULL REFERENCES "custom_domains" ("id") ON DELETE CASCADE,
  "recordType" "enum_custom_domain_dns_records_recordType" NOT NULL,
  "purpose" "enum_custom_domain_dns_records_purpose" NOT NULL,
  "name" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "lastCheckedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "custom_domain_dns_records_domain_id"
  ON "custom_domain_dns_records" ("customDomainId");

CREATE TABLE IF NOT EXISTS "custom_domain_accounts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "customDomainId" UUID NOT NULL REFERENCES "custom_domains" ("id") ON DELETE CASCADE,
  "emailAccountId" UUID REFERENCES "email_accounts" ("id") ON DELETE SET NULL,
  "sendProfileId" UUID REFERENCES "send_profiles" ("id") ON DELETE SET NULL,
  "localPart" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "custom_domain_accounts_domain_id"
  ON "custom_domain_accounts" ("customDomainId");
CREATE INDEX IF NOT EXISTS "custom_domain_accounts_email_account_id"
  ON "custom_domain_accounts" ("emailAccountId");
CREATE INDEX IF NOT EXISTS "custom_domain_accounts_send_profile_id"
  ON "custom_domain_accounts" ("sendProfileId");
CREATE UNIQUE INDEX IF NOT EXISTS "custom_domain_accounts_domain_local"
  ON "custom_domain_accounts" ("customDomainId", "localPart");

-- ============================================================================
-- 6. Refactor email_accounts: add type, rename FK, drop moved columns
-- ============================================================================

-- Add type column
ALTER TABLE "email_accounts"
  ADD COLUMN IF NOT EXISTS "type" "enum_email_accounts_type" NOT NULL DEFAULT 'IMAP';

-- Add the new FK column pointing to send_profiles
ALTER TABLE "email_accounts"
  ADD COLUMN IF NOT EXISTS "defaultSendProfileId" UUID REFERENCES "send_profiles" ("id");

-- Copy values from old FK to new FK (only if old column still exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_accounts' AND column_name = 'defaultSmtpProfileId'
  ) THEN
    EXECUTE 'UPDATE "email_accounts" SET "defaultSendProfileId" = "defaultSmtpProfileId" WHERE "defaultSmtpProfileId" IS NOT NULL AND "defaultSendProfileId" IS NULL';
  END IF;
END $$;

-- Drop moved columns from email_accounts
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "host";
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "port";
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "username";
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "password";
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "accountType";
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "useSsl";
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "lastSyncedAt";
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "historicalSyncId";
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "historicalSyncProgress";
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "historicalSyncStatus";
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "historicalSyncComplete";
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "historicalSyncExpiresAt";
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "historicalSyncLastAt";
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "historicalSyncLastUidInbox";
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "historicalSyncLastUidSent";
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "historicalSyncTotalInbox";
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "historicalSyncTotalSent";
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "updateSyncId";
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "updateSyncProgress";
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "updateSyncStatus";
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "updateSyncExpiresAt";
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "lastSyncUidNextInbox";
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "lastSyncUidNextSent";
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "defaultSmtpProfileId";

-- Drop the old accountType enum (no longer used on email_accounts)
DROP TYPE IF EXISTS "enum_email_accounts_accountType";

-- ============================================================================
-- 7. Refactor emails: rename smtpProfileId -> sendProfileId
-- ============================================================================

ALTER TABLE "emails"
  ADD COLUMN IF NOT EXISTS "sendProfileId" UUID REFERENCES "send_profiles" ("id");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'emails' AND column_name = 'smtpProfileId'
  ) THEN
    EXECUTE 'UPDATE "emails" SET "sendProfileId" = "smtpProfileId" WHERE "smtpProfileId" IS NOT NULL AND "sendProfileId" IS NULL';
  END IF;
END $$;

ALTER TABLE "emails" DROP COLUMN IF EXISTS "smtpProfileId";

-- ============================================================================
-- 8. Add domainTier to subscriptions, domainCount to user_usages
-- ============================================================================

ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "domainTier" "enum_subscriptions_domainTier" NOT NULL DEFAULT 'free';

ALTER TABLE "user_usages"
  ADD COLUMN IF NOT EXISTS "domainCount" INTEGER NOT NULL DEFAULT 0;

-- ============================================================================
-- 9. Drop the old smtp_profiles table (data has been migrated to send_profiles)
-- ============================================================================

DROP TABLE IF EXISTS "smtp_profiles";
