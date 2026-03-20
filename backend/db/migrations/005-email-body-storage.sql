-- Migration: Email Body Storage
--
-- Move email bodies from PostgreSQL to S3 with pgvector-backed search index.
-- This migration wipes all existing email data for a clean start.

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
