-- Migration: Email Body Storage
--
-- Move email bodies from PostgreSQL to S3 with pgvector-backed search index.
-- This migration wipes all existing email data for a clean start.
--
-- PRE-REQUISITES (local development):
--   1. Docker image must be pgvector/pgvector:pg15 (not postgres:15).
--      If you previously used postgres:15, destroy and recreate the volume:
--        docker compose down -v && docker compose up -d
--   2. The CREATE EXTENSION vector command below requires the pgvector
--      binary to be present in the PostgreSQL installation.
--
-- PRE-REQUISITES (production):
--   1. Deploy Pulumi infra changes FIRST (new email-bodies S3 bucket,
--      updated IAM policy, EMAIL_BODIES_S3_BUCKET env var).
--   2. Manually purge orphaned flat-keyed objects from the attachments
--      S3 bucket after deploy (old format: {attachmentId}, new format:
--      {emailAccountId}/{attachmentId}).

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add new columns to emails table
ALTER TABLE emails ADD COLUMN IF NOT EXISTS "bodyStorageKey" TEXT;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS "bodyPreview" TEXT;

-- 3. Create the search index table
CREATE TABLE IF NOT EXISTS email_search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "emailId" UUID NOT NULL UNIQUE REFERENCES emails(id) ON DELETE CASCADE,
  "emailAccountId" UUID NOT NULL,
  "searchVector" TSVECTOR,
  embedding VECTOR(384),
  "bodySize" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_email_search_account
  ON email_search_index ("emailAccountId");
CREATE INDEX IF NOT EXISTS idx_email_search_fts
  ON email_search_index USING GIN ("searchVector");
CREATE INDEX IF NOT EXISTS idx_email_search_embedding
  ON email_search_index USING hnsw (embedding vector_cosine_ops);

-- 5. Wipe all existing email data (clean start).
--    TRUNCATE cascades to: attachments, email_tags, email_search_index.
--    Email accounts, users, tags, custom domains, billing are preserved.
--    IMAP re-sync will repopulate emails in the new storage format.
TRUNCATE emails CASCADE;

-- 6. Drop legacy body columns (no longer needed -- bodies go to S3).
ALTER TABLE emails DROP COLUMN IF EXISTS "textBody";
ALTER TABLE emails DROP COLUMN IF EXISTS "htmlBody";
