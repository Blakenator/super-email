-- Materialized view for user storage usage
-- This calculates the total storage used by each user based on:
-- 1. Email body sizes (textBody + htmlBody)
-- 2. Attachment sizes
-- Should be refreshed daily at midnight UTC

-- Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS user_storage_usage;

-- Create the materialized view
CREATE MATERIALIZED VIEW user_storage_usage AS
SELECT 
  u.id AS user_id,
  -- Count of email accounts
  COALESCE(ea_count.account_count, 0) AS account_count,
  -- Total email body size (text + html bodies)
  COALESCE(email_stats.total_body_size, 0) AS total_body_size_bytes,
  -- Total attachment size
  COALESCE(attachment_stats.total_attachment_size, 0) AS total_attachment_size_bytes,
  -- Combined total storage
  COALESCE(email_stats.total_body_size, 0) + COALESCE(attachment_stats.total_attachment_size, 0) AS total_storage_bytes,
  -- Email count for reference
  COALESCE(email_stats.email_count, 0) AS email_count,
  -- Attachment count for reference
  COALESCE(attachment_stats.attachment_count, 0) AS attachment_count,
  -- Last refresh timestamp
  NOW() AS last_refreshed_at
FROM users u
-- Email account count
LEFT JOIN (
  SELECT 
    "userId" AS user_id,
    COUNT(*) AS account_count
  FROM email_accounts
  GROUP BY "userId"
) ea_count ON ea_count.user_id = u.id
-- Email body sizes
LEFT JOIN (
  SELECT 
    ea."userId" AS user_id,
    COUNT(e.id) AS email_count,
    SUM(
      COALESCE(LENGTH(e."textBody"), 0) + 
      COALESCE(LENGTH(e."htmlBody"), 0)
    ) AS total_body_size
  FROM emails e
  INNER JOIN email_accounts ea ON e."emailAccountId" = ea.id
  GROUP BY ea."userId"
) email_stats ON email_stats.user_id = u.id
-- Attachment sizes
LEFT JOIN (
  SELECT 
    ea."userId" AS user_id,
    COUNT(a.id) AS attachment_count,
    SUM(a.size) AS total_attachment_size
  FROM attachments a
  INNER JOIN emails e ON a."emailId" = e.id
  INNER JOIN email_accounts ea ON e."emailAccountId" = ea.id
  GROUP BY ea."userId"
) attachment_stats ON attachment_stats.user_id = u.id;

-- Create unique index on user_id for faster lookups and REFRESH CONCURRENTLY support
CREATE UNIQUE INDEX idx_user_storage_usage_user_id ON user_storage_usage (user_id);

-- Create index for sorting by storage usage
CREATE INDEX idx_user_storage_usage_total ON user_storage_usage (total_storage_bytes DESC);

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT ON user_storage_usage TO your_app_user;

COMMENT ON MATERIALIZED VIEW user_storage_usage IS 
'Cached storage usage statistics per user. Includes email body sizes and attachment sizes. 
Refresh daily at midnight UTC using: REFRESH MATERIALIZED VIEW CONCURRENTLY user_storage_usage;';
