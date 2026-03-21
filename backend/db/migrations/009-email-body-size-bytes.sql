-- Persisted size of the stored email body payload (UTF-8 bytes of JSON
-- {"textBody":...,"htmlBody":...}), matching S3/local file size for billing.
-- Billing no longer depends on email_search_index.bodySize (which can be missing
-- if search index upsert fails).

ALTER TABLE emails
ADD COLUMN IF NOT EXISTS "bodySizeBytes" INTEGER NOT NULL DEFAULT 0;

-- Best-effort backfill from search index (historically character counts; close
-- for ASCII, may differ from true UTF-8 byte length for existing rows).
UPDATE emails e
SET "bodySizeBytes" = GREATEST(COALESCE(esi."bodySize", 0), 0)
FROM email_search_index esi
WHERE esi."emailId" = e.id;
