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
    const displayName = input.name || emailAddress;

    const existingAccount = await CustomDomainAccount.findOne({
      where: { customDomainId: input.customDomainId, localPart: input.localPart },
    });
    if (existingAccount) {
      throw new Error(`Account ${emailAddress} already exists`);
    }

    const emailAccount = await EmailAccount.create({
      userId,
      name: displayName,
      email: emailAddress,
      type: EmailAccountType.CUSTOM_DOMAIN,
      isDefault: false,
    });

    const sendProfile = await SendProfile.create({
      userId,
      name: displayName,
      email: emailAddress,
      type: SendProfileType.CUSTOM_DOMAIN,
      isDefault: false,
      emailAccountId: emailAccount.id,
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
