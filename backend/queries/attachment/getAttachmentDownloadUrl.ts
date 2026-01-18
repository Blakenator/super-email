import { makeQuery } from '../../types.js';
import { Email, EmailAccount } from '../../db/models/index.js';
import { Attachment } from '../../db/models/attachment.model.js';
import { getAttachmentDownloadUrl as getDownloadUrl } from '../../helpers/attachment-storage.js';
import { requireAuth } from '../../helpers/auth.js';

export const getAttachmentDownloadUrl = makeQuery(
  'getAttachmentDownloadUrl',
  async (_parent, { id }, context) => {
    const userId = requireAuth(context);

    const attachment = await Attachment.findOne({
      where: { id },
      include: [
        {
          model: Email,
          include: [
            {
              model: EmailAccount,
              where: { userId },
              required: true,
            },
          ],
        },
      ],
    });

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // Generate a signed URL (S3 in production) or local path (development)
    // Use attachment ID as the storage key (flat bucket structure)
    const downloadUrl = await getDownloadUrl(attachment.id);

    return downloadUrl;
  },
);
