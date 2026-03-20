import { sequelize } from '../db/database.js';
import { EmailSearchIndex } from '../db/models/email-search-index.model.js';
import { generateEmbedding, buildEmbeddingText } from './embedding.js';
import { logger } from './logger.js';

/**
 * Create or update a search index entry for an email.
 * Computes tsvector (for FTS) and embedding (for semantic search) from the email content.
 */
export async function upsertSearchIndex(params: {
  emailId: string;
  emailAccountId: string;
  subject: string;
  textBody: string | null;
  fromAddress: string;
  toAddresses: string[];
  bodySize: number;
  skipEmbedding?: boolean;
}): Promise<void> {
  const {
    emailId,
    emailAccountId,
    subject,
    textBody,
    fromAddress,
    toAddresses,
    bodySize,
    skipEmbedding = false,
  } = params;

  try {
    const searchText = [subject, textBody, fromAddress, ...toAddresses]
      .filter(Boolean)
      .join(' ');

    let embedding: number[] | null = null;
    if (!skipEmbedding) {
      embedding = await generateEmbedding(buildEmbeddingText(subject, textBody));
    }

    const embeddingLiteral = embedding
      ? `'[${embedding.join(',')}]'::vector`
      : 'NULL';

    await sequelize.query(
      `INSERT INTO email_search_index ("id", "emailId", "emailAccountId", "searchVector", "embedding", "bodySize", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), :emailId, :emailAccountId, to_tsvector('english', :searchText), ${embeddingLiteral}, :bodySize, NOW(), NOW())
       ON CONFLICT ("emailId") DO UPDATE SET
         "searchVector" = to_tsvector('english', :searchText),
         "embedding" = ${embeddingLiteral},
         "bodySize" = :bodySize,
         "updatedAt" = NOW()`,
      {
        replacements: { emailId, emailAccountId, searchText, bodySize },
      },
    );
  } catch (err) {
    logger.error('SearchIndex', 'Failed to upsert search index', {
      emailId,
      error: err instanceof Error ? err.message : err,
    });
  }
}

/**
 * Generate a body preview (first ~200 chars of plain text, stripped of excessive whitespace).
 */
export function generateBodyPreview(
  textBody: string | null,
  htmlBody: string | null,
): string | null {
  const text = textBody || stripHtml(htmlBody);
  if (!text) return null;
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > 200 ? cleaned.slice(0, 200) : cleaned;
}

function stripHtml(html: string | null): string | null {
  if (!html) return null;
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}
