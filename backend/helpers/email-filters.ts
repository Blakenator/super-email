import { Op, literal } from 'sequelize';
import type { WhereOptions } from 'sequelize';
import { EmailFolder } from '../db/models/index.js';

export interface EmailFilterInput {
  emailAccountId?: string;
  folder?: string;
  isRead?: boolean;
  isStarred?: boolean;
  searchQuery?: string;
  includeAllFolders?: boolean;
  fromContains?: string;
  toContains?: string;
  ccContains?: string;
  bccContains?: string;
  subjectContains?: string;
  bodyContains?: string;
  tagIds?: string[];
}

/**
 * Build a Sequelize where clause for email queries based on filter input
 */
export function buildEmailWhereClause(
  input: EmailFilterInput,
  accountIds: string[],
): WhereOptions<any> {
  const where: WhereOptions<any> = {
    emailAccountId: input.emailAccountId ?? accountIds,
  };

  // Handle drafts folder specially - only show drafts there
  if (input.folder === 'DRAFTS') {
    where.isDraft = true;
    where.folder = EmailFolder.DRAFTS;
  } else if (!input.includeAllFolders) {
    // For all other folders, exclude drafts and apply folder filter
    // Only skip folder filter if includeAllFolders is explicitly true
    where.isDraft = false;
    if (input.folder) {
      where.folder = input.folder;
    }
  }

  if (input.isRead !== undefined && input.isRead !== null) {
    where.isRead = input.isRead;
  }

  if (input.isStarred !== undefined && input.isStarred !== null) {
    where.isStarred = input.isStarred;
  }

  const andConditions: any[] = [];

  // Full-text search using PostgreSQL's to_tsvector and to_tsquery
  if (input.searchQuery?.trim()) {
    const searchTerm = input.searchQuery.trim();
    const sanitized = searchTerm
      .replace(/[^\w\s@.-]/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .map((word: string) => word + ':*')
      .join(' & ');

    if (sanitized) {
      andConditions.push(
        literal(`(
          to_tsvector('english', COALESCE("subject", '')) ||
          to_tsvector('english', COALESCE("textBody", '')) ||
          to_tsvector('english', COALESCE("fromAddress", '')) ||
          to_tsvector('english', COALESCE("fromName", '')) ||
          to_tsvector('english', COALESCE(array_to_string("toAddresses", ' '), ''))
        ) @@ to_tsquery('english', '${sanitized}')`),
      );
    }
  }

  // Advanced field-specific filters
  if (input.fromContains?.trim()) {
    const fromTerm = input.fromContains.trim().toLowerCase().replace(/'/g, "''");
    // Check if it looks like an exact email address (contains @ and no wildcards)
    // If so, use exact match on fromAddress only to match getTopEmailSources behavior
    const isExactEmail = fromTerm.includes('@') && !fromTerm.includes('%') && !fromTerm.includes('*');
    if (isExactEmail) {
      // Exact match on fromAddress only (case-insensitive)
      andConditions.push(
        literal(`LOWER("fromAddress") = '${fromTerm}'`),
      );
    } else {
      // LIKE match on both fromAddress and fromName for partial matches
      andConditions.push(
        literal(`(LOWER("fromAddress") LIKE '%${fromTerm}%' OR LOWER("fromName") LIKE '%${fromTerm}%')`),
      );
    }
  }

  if (input.toContains?.trim()) {
    const toTerm = input.toContains.trim().toLowerCase().replace(/'/g, "''");
    andConditions.push(
      literal(`EXISTS (SELECT 1 FROM unnest("toAddresses") AS addr WHERE LOWER(addr) LIKE '%${toTerm}%')`),
    );
  }

  if (input.ccContains?.trim()) {
    const ccTerm = input.ccContains.trim().toLowerCase().replace(/'/g, "''");
    andConditions.push(
      literal(`EXISTS (SELECT 1 FROM unnest("ccAddresses") AS addr WHERE LOWER(addr) LIKE '%${ccTerm}%')`),
    );
  }

  if (input.bccContains?.trim()) {
    const bccTerm = input.bccContains.trim().toLowerCase().replace(/'/g, "''");
    andConditions.push(
      literal(`EXISTS (SELECT 1 FROM unnest("bccAddresses") AS addr WHERE LOWER(addr) LIKE '%${bccTerm}%')`),
    );
  }

  if (input.subjectContains?.trim()) {
    const subjectTerm = input.subjectContains.trim().toLowerCase().replace(/'/g, "''");
    andConditions.push(
      literal(`LOWER("subject") LIKE '%${subjectTerm}%'`),
    );
  }

  if (input.bodyContains?.trim()) {
    const bodyTerm = input.bodyContains.trim().toLowerCase().replace(/'/g, "''");
    andConditions.push(
      literal(`(LOWER("textBody") LIKE '%${bodyTerm}%' OR LOWER("htmlBody") LIKE '%${bodyTerm}%')`),
    );
  }

  // Tag filtering - emails must have ALL specified tags
  if (input.tagIds && input.tagIds.length > 0) {
    const tagIdList = input.tagIds.map((id) => `'${id.replace(/'/g, "''")}'`).join(',');
    andConditions.push(
      literal(`(
        SELECT COUNT(DISTINCT "tagId") FROM email_tags 
        WHERE email_tags."emailId" = "Email"."id" 
        AND email_tags."tagId" IN (${tagIdList})
      ) = ${input.tagIds.length}`),
    );
  }

  if (andConditions.length > 0) {
    where[Op.and as any] = andConditions;
  }

  return where;
}

/**
 * Check if any advanced filters are being used
 */
export function hasAdvancedFilters(input: EmailFilterInput): boolean {
  return !!(
    input.fromContains?.trim() ||
    input.toContains?.trim() ||
    input.ccContains?.trim() ||
    input.bccContains?.trim() ||
    input.subjectContains?.trim() ||
    input.bodyContains?.trim() ||
    (input.tagIds && input.tagIds.length > 0)
  );
}
