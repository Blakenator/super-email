import { makeMutation } from '../../types.js';
import {
  CustomDomain,
  CustomDomainAccount,
  EmailAccount,
  SendProfile,
} from '../../db/models/index.js';
import { EmailAccountType } from '../../db/models/email-account.model.js';
import { SendProfileType } from '../../db/models/send-profile.model.js';
import { requireAuth } from '../../helpers/auth.js';
import { recalculateUserUsage } from '../../helpers/usage-calculator.js';
import { logger } from '../../helpers/logger.js';

export const createCustomDomainAccount = makeMutation(
  'createCustomDomainAccount',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    const customDomain = await CustomDomain.findOne({
      where: { id: input.customDomainId, userId },
    });

    if (!customDomain) {
      throw new Error('Custom domain not found');
    }

    if (customDomain.status !== 'VERIFIED') {
      throw new Error('Custom domain must be verified before creating accounts');
    }

    const emailAddress = `${input.localPart}@${customDomain.domain}`;

    const existingAccount = await CustomDomainAccount.findOne({
      where: { customDomainId: input.customDomainId, localPart: input.localPart },
    });
    if (existingAccount) {
      throw new Error(`Account ${emailAddress} already exists`);
    }

    const emailAccount = await EmailAccount.create({
      userId,
      name: input.name,
      email: emailAddress,
      type: EmailAccountType.CUSTOM_DOMAIN,
      isDefault: false,
    });

    const sendProfile = await SendProfile.create({
      userId,
      name: input.name,
      email: emailAddress,
      type: SendProfileType.CUSTOM_DOMAIN,
      isDefault: false,
    });

    await emailAccount.update({ defaultSendProfileId: sendProfile.id });

    const domainAccount = await CustomDomainAccount.create({
      customDomainId: input.customDomainId,
      emailAccountId: emailAccount.id,
      sendProfileId: sendProfile.id,
      localPart: input.localPart,
    });

    await recalculateUserUsage(userId);

    const result = await CustomDomainAccount.findByPk(domainAccount.id, {
      include: [
        { model: EmailAccount, as: 'emailAccount' },
        { model: SendProfile, as: 'sendProfile' },
      ],
    });

    logger.info('createCustomDomainAccount', `Created custom domain account ${emailAddress} for user ${userId}`);
    return result;
  },
);
