import { makeQuery } from '../../types.js';
import { EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { generateEmbedding, buildEmbeddingText } from '../../helpers/embedding.js';
import { sequelize } from '../../db/database.js';
import { QueryTypes } from 'sequelize';
import { getEmailBody } from '../../helpers/body-storage.js';
import { logger } from '../../helpers/logger.js';
import {
  hashIdentifier,
  withObservedSpan,
} from '../../helpers/observability.js';

export const semanticSearch = makeQuery(
  'semanticSearch',
  async (_parent, { query, emailAccountId, limit }, context) => {
    const userId = requireAuth(context);
    const resultLimit = limit ?? 10;

    const embedding = await withObservedSpan(
      'semantic_search.query_embedding',
      async () => generateEmbedding(buildEmbeddingText(query, null)),
      {
        attributes: {
          'graphql.operation.name': 'semanticSearch',
          'email.account.hash': hashIdentifier(emailAccountId),
        },
      },
      {
        operation: 'semantic_search.query_embedding',
      },
    );
    if (!embedding) {
      throw new Error('Semantic search is unavailable (embedding model not loaded)');
    }

    // Get account IDs for authorization
    const accountWhere: any = { userId };
    if (emailAccountId) {
      accountWhere.id = emailAccountId;
    }
    const userAccounts = await EmailAccount.findAll({
      where: accountWhere,
      attributes: ['id'],
    });

    if (userAccounts.length === 0) {
      return [];
    }

    const accountIds = userAccounts.map((a) => a.id);
    const accountIdList = accountIds.map((id) => `'${id}'`).join(',');
    const embeddingStr = `[${embedding.join(',')}]`;

    const results = await withObservedSpan(
      'semantic_search.vector_query',
      async () =>
        sequelize.query<{
          email_id: string;
          email_account_id: string;
          score: number;
          id: string;
          subject: string;
          from_address: string;
          from_name: string | null;
          to_addresses: string[];
          received_at: Date;
          is_read: boolean;
          is_starred: boolean;
          is_draft: boolean;
          folder: string;
          body_preview: string | null;
          body_storage_key: string | null;
          message_id: string;
        }>(
          `SELECT 
            esi."emailId" AS email_id,
            esi."emailAccountId" AS email_account_id,
            1 - (esi.embedding <=> '${embeddingStr}'::vector) AS score,
            e.id,
            e.subject,
            e."fromAddress" AS from_address,
            e."fromName" AS from_name,
            e."toAddresses" AS to_addresses,
            e."receivedAt" AS received_at,
            e."isRead" AS is_read,
            e."isStarred" AS is_starred,
            e."isDraft" AS is_draft,
            e.folder,
            e."bodyPreview" AS body_preview,
            e."bodyStorageKey" AS body_storage_key,
            e."messageId" AS message_id
          FROM email_search_index esi
          INNER JOIN emails e ON e.id = esi."emailId"
          WHERE esi."emailAccountId" IN (${accountIdList})
            AND esi.embedding IS NOT NULL
          ORDER BY esi.embedding <=> '${embeddingStr}'::vector
          LIMIT :limit`,
          {
            replacements: { limit: resultLimit },
            type: QueryTypes.SELECT,
          },
        ),
      {
        attributes: {
          'graphql.operation.name': 'semanticSearch',
          'semantic_search.limit': resultLimit,
          'semantic_search.account_count': accountIds.length,
        },
      },
      {
        operation: 'semantic_search.vector_query',
      },
    );

    return results.map((row) => ({
      score: row.score,
      email: {
        id: row.id,
        emailAccountId: row.email_account_id,
        messageId: row.message_id,
        subject: row.subject,
        fromAddress: row.from_address,
        fromName: row.from_name,
        toAddresses: row.to_addresses,
        receivedAt: row.received_at,
        isRead: row.is_read,
        isStarred: row.is_starred,
        isDraft: row.is_draft,
        folder: row.folder,
        bodyPreview: row.body_preview,
        tags: [],
        attachments: [],
        hasAttachments: false,
        attachmentCount: 0,
      },
    }));
  },
);
