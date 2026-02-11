import {
  Email,
  EmailFolder,
  MailRule,
  EmailTag,
  SmtpProfile,
  Tag,
} from '../db/models/index.js';
import { Op, literal } from 'sequelize';
import type { WhereOptions } from 'sequelize';
import { sendEmail } from './email.js';
import { logger } from './logger.js';

const BATCH_SIZE = 100;

/**
 * Build a Sequelize where clause from rule conditions
 */
export function buildRuleWhereClause(
  rule: MailRule,
  accountIds: string[],
): WhereOptions<any> {
  const conditions = rule.conditions;
  const where: WhereOptions<any> = {
    emailAccountId: rule.emailAccountId
      ? rule.emailAccountId
      : { [Op.in]: accountIds },
  };

  const andConditions: any[] = [];

  if (conditions.fromContains?.trim()) {
    const term = conditions.fromContains.trim().toLowerCase().replace(/'/g, "''");
    andConditions.push(
      literal(
        `(LOWER("fromAddress") LIKE '%${term}%' OR LOWER("fromName") LIKE '%${term}%')`,
      ),
    );
  }

  if (conditions.toContains?.trim()) {
    const term = conditions.toContains.trim().toLowerCase().replace(/'/g, "''");
    andConditions.push(
      literal(
        `EXISTS (SELECT 1 FROM unnest("toAddresses") AS addr WHERE LOWER(addr) LIKE '%${term}%')`,
      ),
    );
  }

  if (conditions.ccContains?.trim()) {
    const term = conditions.ccContains.trim().toLowerCase().replace(/'/g, "''");
    andConditions.push(
      literal(
        `EXISTS (SELECT 1 FROM unnest("ccAddresses") AS addr WHERE LOWER(addr) LIKE '%${term}%')`,
      ),
    );
  }

  if (conditions.bccContains?.trim()) {
    const term = conditions.bccContains.trim().toLowerCase().replace(/'/g, "''");
    andConditions.push(
      literal(
        `EXISTS (SELECT 1 FROM unnest("bccAddresses") AS addr WHERE LOWER(addr) LIKE '%${term}%')`,
      ),
    );
  }

  if (conditions.subjectContains?.trim()) {
    const term = conditions.subjectContains.trim().toLowerCase().replace(/'/g, "''");
    andConditions.push(literal(`LOWER("subject") LIKE '%${term}%'`));
  }

  if (conditions.bodyContains?.trim()) {
    const term = conditions.bodyContains.trim().toLowerCase().replace(/'/g, "''");
    andConditions.push(
      literal(
        `(LOWER("textBody") LIKE '%${term}%' OR LOWER("htmlBody") LIKE '%${term}%')`,
      ),
    );
  }

  if (andConditions.length > 0) {
    where[Op.and as any] = andConditions;
  }

  return where;
}

/**
 * Test if a single email matches a rule's conditions
 */
export function emailMatchesRule(email: Email, rule: MailRule): boolean {
  const conditions = rule.conditions;

  // Check account filter
  if (rule.emailAccountId && email.emailAccountId !== rule.emailAccountId) {
    return false;
  }

  if (conditions.fromContains?.trim()) {
    const term = conditions.fromContains.trim().toLowerCase();
    const from = `${email.fromAddress} ${email.fromName || ''}`.toLowerCase();
    if (!from.includes(term)) return false;
  }

  if (conditions.toContains?.trim()) {
    const term = conditions.toContains.trim().toLowerCase();
    const to = (email.toAddresses || []).join(' ').toLowerCase();
    if (!to.includes(term)) return false;
  }

  if (conditions.ccContains?.trim()) {
    const term = conditions.ccContains.trim().toLowerCase();
    const cc = (email.ccAddresses || []).join(' ').toLowerCase();
    if (!cc.includes(term)) return false;
  }

  if (conditions.bccContains?.trim()) {
    const term = conditions.bccContains.trim().toLowerCase();
    const bcc = (email.bccAddresses || []).join(' ').toLowerCase();
    if (!bcc.includes(term)) return false;
  }

  if (conditions.subjectContains?.trim()) {
    const term = conditions.subjectContains.trim().toLowerCase();
    if (!email.subject.toLowerCase().includes(term)) return false;
  }

  if (conditions.bodyContains?.trim()) {
    const term = conditions.bodyContains.trim().toLowerCase();
    const body = `${email.textBody || ''} ${email.htmlBody || ''}`.toLowerCase();
    if (!body.includes(term)) return false;
  }

  return true;
}

/**
 * Count emails matching a rule
 */
export async function countMatchingEmails(
  rule: MailRule,
  accountIds: string[],
): Promise<number> {
  const where = buildRuleWhereClause(rule, accountIds);
  return Email.count({ where });
}

/**
 * Apply a rule's actions to a single email
 */
export async function applyRuleActions(
  email: Email,
  rule: MailRule,
  userId: string,
): Promise<void> {
  const actions = rule.actions;

  if (actions.markRead) {
    email.isRead = true;
  }

  if (actions.star) {
    email.isStarred = true;
  }

  if (actions.archive) {
    email.folder = EmailFolder.ARCHIVE;
  }

  if (actions.delete) {
    email.folder = EmailFolder.TRASH;
  }

  await email.save();

  // Add tags
  if (actions.addTagIds && actions.addTagIds.length > 0) {
    // Verify tags belong to user
    const validTags = await Tag.findAll({
      where: {
        id: { [Op.in]: actions.addTagIds },
        userId,
      },
      attributes: ['id'],
    });

    const associations = validTags.map((tag) => ({
      emailId: email.id,
      tagId: tag.id,
    }));

    if (associations.length > 0) {
      await EmailTag.bulkCreate(associations, { ignoreDuplicates: true });
    }
  }

  // Forward email
  if (actions.forwardTo) {
    try {
      // Get a default SMTP profile
      const smtpProfile = await SmtpProfile.findOne({
        where: { userId, isDefault: true },
      });

      if (smtpProfile) {
        const forwardText = `---------- Forwarded message ----------\nFrom: ${email.fromName || email.fromAddress} <${email.fromAddress}>\nDate: ${email.receivedAt}\nSubject: ${email.subject}\nTo: ${email.toAddresses.join(', ')}\n\n${email.textBody || ''}`;

        await sendEmail(smtpProfile, {
          to: actions.forwardTo.split(',').map((e) => e.trim()),
          subject: `Fwd: ${email.subject}`,
          text: forwardText,
          html: email.htmlBody || undefined,
        });
      } else {
        logger.warn('RuleMatcher', `Cannot forward email ${email.id}: no default SMTP profile found for user ${userId}`);
      }
    } catch (err) {
      logger.error('RuleMatcher', `Failed to forward email ${email.id}`, { forwardTo: actions.forwardTo, error: err instanceof Error ? err.message : err });
    }
  }
}

/**
 * Apply a rule to all matching emails (batched for performance)
 */
export async function applyRuleToMatchingEmails(
  rule: MailRule,
  accountIds: string[],
  userId: string,
): Promise<number> {
  const where = buildRuleWhereClause(rule, accountIds);
  let processedCount = 0;
  let offset = 0;

  while (true) {
    const emails = await Email.findAll({
      where,
      limit: BATCH_SIZE,
      offset,
      order: [['receivedAt', 'DESC']],
    });

    if (emails.length === 0) break;

    for (const email of emails) {
      await applyRuleActions(email, rule, userId);
      processedCount++;
    }

    offset += BATCH_SIZE;

    // Safety limit to prevent infinite loops
    if (processedCount > 10000) {
      logger.warn('RuleMatcher', `Safety limit reached for rule ${rule.id}, stopping at 10000 emails`);
      break;
    }
  }

  return processedCount;
}

/**
 * Apply all enabled rules to a single email (used during sync)
 */
export async function applyRulesToEmail(
  email: Email,
  userId: string,
): Promise<void> {
  const rules = await MailRule.findAll({
    where: {
      userId,
      isEnabled: true,
      [Op.or]: [
        { emailAccountId: null },
        { emailAccountId: email.emailAccountId },
      ],
    },
    order: [['priority', 'ASC']],
  });

  for (const rule of rules) {
    if (emailMatchesRule(email, rule)) {
      await applyRuleActions(email, rule, userId);

      if (rule.stopProcessing) {
        break;
      }
    }
  }
}
