import { makeMutation } from '../../types.js';
import { CustomDomain, CustomDomainDnsRecord } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { getOrCreateSubscription } from '../../helpers/stripe.js';
import { DOMAIN_LIMITS } from '../../db/models/subscription.constants.js';
import { createSesIdentity } from '../../helpers/ses-domain.js';
import { recalculateUserUsage } from '../../helpers/usage-calculator.js';
import { logger } from '../../helpers/logger.js';
import { sequelize } from '../../db/database.js';

export const addCustomDomain = makeMutation(
  'addCustomDomain',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);
    const domain = input.domain.toLowerCase().trim();

    const subscription = await getOrCreateSubscription(userId);
    const domainLimit = DOMAIN_LIMITS[subscription.domainTier];

    const existingCount = await CustomDomain.count({ where: { userId } });
    if (domainLimit >= 0 && existingCount >= domainLimit) {
      throw new Error(
        `Domain limit reached (${domainLimit} domains). Please upgrade your plan to add more domains.`,
      );
    }

    const existingDomain = await CustomDomain.findOne({
      where: { domain },
    });
    if (existingDomain) {
      throw new Error(`Domain "${domain}" is already registered`);
    }

    const sesResult = await createSesIdentity(domain);

    const result = await sequelize.transaction(async (transaction) => {
      const customDomain = await CustomDomain.create(
        {
          userId,
          domain,
          status: 'PENDING_VERIFICATION',
          sesIdentityArn: sesResult.identityArn || null,
        },
        { transaction },
      );

      if (sesResult.dnsRecords && sesResult.dnsRecords.length > 0) {
        await CustomDomainDnsRecord.bulkCreate(
          sesResult.dnsRecords.map((record) => ({
            customDomainId: customDomain.id,
            recordType: record.recordType,
            purpose: record.purpose,
            name: record.name,
            value: record.value,
            isVerified: false,
          })),
          { transaction },
        );
      }

      return await CustomDomain.findByPk(customDomain.id, {
        include: [{ model: CustomDomainDnsRecord, as: 'dnsRecords' }],
        transaction,
      });
    });

    await recalculateUserUsage(userId);

    logger.info('addCustomDomain', `Added custom domain ${domain} (${result!.id}) for user ${userId}`);
    return result;
  },
);
