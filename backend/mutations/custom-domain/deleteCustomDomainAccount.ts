import { makeMutation } from '../../types.js';
import {
  CustomDomainAccount,
  CustomDomain,
  EmailAccount,
  SendProfile,
  Email,
} from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { recalculateUserUsage } from '../../helpers/usage-calculator.js';
import { logger } from '../../helpers/logger.js';

export const deleteCustomDomainAccount = makeMutation(
  'deleteCustomDomainAccount',
  async (_parent, { id }, context) => {
    const userId = requireAuth(context);

    const domainAccount = await CustomDomainAccount.findByPk(id, {
      include: [{ model: CustomDomain, as: 'customDomain' }],
    });

    if (!domainAccount) {
      throw new Error('Custom domain account not found');
    }

    if (domainAccount.customDomain?.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (domainAccount.emailAccountId) {
      await Email.destroy({ where: { emailAccountId: domainAccount.emailAccountId } });
      await EmailAccount.destroy({ where: { id: domainAccount.emailAccountId } });
    }

    if (domainAccount.sendProfileId) {
      await SendProfile.destroy({ where: { id: domainAccount.sendProfileId } });
    }

    await domainAccount.destroy();

    await recalculateUserUsage(userId);

    logger.info('deleteCustomDomainAccount', `Deleted custom domain account ${id} for user ${userId}`);
    return true;
  },
);
