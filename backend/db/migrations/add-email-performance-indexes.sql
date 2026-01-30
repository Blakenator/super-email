-- Migration: Add performance indexes for email queries
-- This migration adds indexes to improve:
-- 1. Email inbox filtering (folder + read status)
-- 2. Thread lookups with account filtering
-- 3. From address searches
-- 4. Usage calculations

-- Composite index for folder + read status filtering (unread filtering in inbox)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emails_account_folder_read_date
ON emails (email_account_id, folder, is_read, received_at);

-- Index for thread lookups with account for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emails_thread_account
ON emails (thread_id, email_account_id)
WHERE thread_id IS NOT NULL;

-- Index for from address lookups (search & contact matching)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emails_from_address
ON emails (from_address);

-- Index for usage calculations (counting emails per account)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emails_account_created
ON emails (email_account_id, created_at);

-- Optional: GIN index for full-text search on subject
-- Uncomment if full-text search performance is needed
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emails_subject_fts
-- ON emails USING GIN (to_tsvector('english', subject));

-- Optional: GIN index for full-text search on body
-- Uncomment if full-text search on body is needed (may be large)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emails_body_fts
-- ON emails USING GIN (to_tsvector('english', COALESCE(text_body, '')));
