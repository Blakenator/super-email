-- Migration: Drop obsolete date-based sync columns
-- Incremental sync now uses UID-based tracking (lastSyncUidNextInbox/Sent)
-- instead of date-based IMAP SINCE. Historical sync already uses UID-based
-- resume (historicalSyncLastUidInbox/Sent), so the old date column is dead.

ALTER TABLE email_accounts
DROP COLUMN IF EXISTS "lastSyncEmailReceivedAt";

ALTER TABLE email_accounts
DROP COLUMN IF EXISTS "historicalSyncOldestDate";
