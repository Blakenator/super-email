import { makeMutation } from '../../types.js';
import { Email, EmailAccount, EmailFolder } from '../../db/models/index.js';
import { Attachment } from '../../db/models/attachment.model.js';
import { requireAuth } from '../../helpers/auth.js';
import { Op } from 'sequelize';
import { deleteEmailBody } from '../../helpers/body-storage.js';
import { deleteAttachment } from '../../helpers/attachment-storage.js';
import { logger } from '../../helpers/logger.js';

export const bulkDeleteEmails = makeMutation(
  'bulkDeleteEmails',
  async (_parent, { ids }, context) => {
    const userId = requireAuth(context);

    if (ids.length === 0) {
      return 0;
    }

    const userAccounts = await EmailAccount.findAll({
      where: { userId },
      attributes: ['id'],
    });
    const accountIds = userAccounts.map((a) => a.id);

    if (accountIds.length === 0) {
      throw new Error('No email accounts found');
    }

    const emails = await Email.findAll({
      where: {
        id: { [Op.in]: ids },
        emailAccountId: { [Op.in]: accountIds },
      },
    });

    let movedCount = 0;
    let deletedCount = 0;

    for (const email of emails) {
      if (email.folder === EmailFolder.TRASH) {
        // Clean up S3 objects before permanent deletion
        const attachments = await Attachment.findAll({
          where: { emailId: email.id },
          attributes: ['storageKey'],
        });

        const cleanupPromises: Promise<void>[] = [];

        if (email.bodyStorageKey) {
          cleanupPromises.push(
            deleteEmailBody(email.emailAccountId, email.id).catch((err) => {
              logger.error('bulkDeleteEmails', 'Failed to delete email body from S3', {
                emailId: email.id,
                error: err instanceof Error ? err.message : err,
              });
            }),
          );
        }

        for (const att of attachments) {
          cleanupPromises.push(
            deleteAttachment(att.storageKey).catch((err) => {
              logger.error('bulkDeleteEmails', 'Failed to delete attachment from S3', {
                storageKey: att.storageKey,
                error: err instanceof Error ? err.message : err,
              });
            }),
          );
        }

        await Promise.all(cleanupPromises);

        await email.destroy();
        deletedCount++;
      } else {
        await email.update({ folder: EmailFolder.TRASH });
        movedCount++;
      }
    }

    logger.info('bulkDeleteEmails', `Moved ${movedCount} to trash, permanently deleted ${deletedCount} for user ${userId}`);
    return movedCount + deletedCount;
  },
);
