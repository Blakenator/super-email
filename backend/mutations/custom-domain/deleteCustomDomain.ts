import { makeMutation } from '../../types.js';
import {
  CustomDomain,
  CustomDomainDnsRecord,
  CustomDomainAccount,
  EmailAccount,
  SendProfile,
  Email,
} from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { deleteSesIdentity } from '../../helpers/ses-domain.js';
import { recalculateUserUsage } from '../../helpers/usage-calculator.js';
import { logger } from '../../helpers/logger.js';

export const deleteCustomDomain = makeMutation(
  'deleteCustomDomain',
  async (_parent, { id }, context) => {
    const userId = requireAuth(context);

    const customDomain = await CustomDomain.findOne({
      where: { id, userId },
      include: [{ model: CustomDomainAccount, as: 'accounts' }],
    });

    if (!customDomain) {
      throw new Error('Custom domain not found');
    }

    if (customDomain.accounts) {
      for (const account of customDomain.accounts) {
        if (account.emailAccountId) {
          await Email.destroy({ where: { emailAccountId: account.emailAccountId } });
          await EmailAccount.destroy({ where: { id: account.emailAccountId } });
        }
        if (account.sendProfileId) {
          await SendProfile.destroy({ where: { id: account.sendProfileId } });
        }
      }
    }

    await CustomDomainAccount.destroy({ where: { customDomainId: id } });
    await CustomDomainDnsRecord.destroy({ where: { customDomainId: id } });

    await deleteSesIdentity(customDomain.domain);

    await customDomain.destroy();

    await recalculateUserUsage(userId);

    logger.info('deleteCustomDomain', `Deleted custom domain ${customDomain.domain} (${id}) for user ${userId}`);
    return true;
  },
);
