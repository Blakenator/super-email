-- Backfill unsubscribeUrl and unsubscribeEmail from stored headers JSONB.
-- Existing rows have correct data in headers but NULL unsubscribe fields
-- because the original extraction logic missed certain mailparser formats.

-- Source 1: Extract from headers->'list' (JSON-stringified object)
-- Structure: {"unsubscribe": {"url": "https://...", "mail": "user@example.com"}}

UPDATE emails
SET "unsubscribeUrl" = (headers->>'list')::jsonb->'unsubscribe'->>'url'
WHERE "unsubscribeUrl" IS NULL
  AND headers IS NOT NULL
  AND headers->>'list' LIKE '{%"unsubscribe"%'
  AND (headers->>'list')::jsonb->'unsubscribe'->>'url' IS NOT NULL;

UPDATE emails
SET "unsubscribeEmail" = (headers->>'list')::jsonb->'unsubscribe'->>'mail'
WHERE "unsubscribeEmail" IS NULL
  AND headers IS NOT NULL
  AND headers->>'list' LIKE '{%"unsubscribe"%'
  AND (headers->>'list')::jsonb->'unsubscribe'->>'mail' IS NOT NULL;

-- Source 2: Extract from headers->'list-unsubscribe' (raw angle-bracket string)
-- Format: <https://example.com/unsub>, <mailto:unsub@example.com>

UPDATE emails
SET "unsubscribeUrl" = substring(headers->>'list-unsubscribe' FROM '<(https?://[^>]+)>')
WHERE "unsubscribeUrl" IS NULL
  AND headers IS NOT NULL
  AND headers->>'list-unsubscribe' LIKE '%<http%';

UPDATE emails
SET "unsubscribeEmail" = substring(headers->>'list-unsubscribe' FROM '<mailto:([^>]+)>')
WHERE "unsubscribeEmail" IS NULL
  AND headers IS NOT NULL
  AND headers->>'list-unsubscribe' LIKE '%<mailto:%';
