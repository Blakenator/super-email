-- Migration: Rename updateSyncLastAt to lastSyncEmailReceivedAt
-- This column now stores the receivedAt date of the most recent synced email,
-- rather than the wall-clock time of the last sync. This anchors the next
-- incremental IMAP SINCE search to actual data, avoiding gaps if a sync
-- partially fails.

ALTER TABLE email_accounts
RENAME COLUMN "updateSyncLastAt" TO "lastSyncEmailReceivedAt";
