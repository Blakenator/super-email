import { makeMutation } from '../../types.js';
import { CustomDomain, CustomDomainDnsRecord } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { getOrCreateSubscription } from '../../helpers/stripe.js';
import { DOMAIN_LIMITS } from '../../db/models/subscription.constants.js';
import { createSesIdentity } from '../../helpers/ses-domain.js';
import { recalculateUserUsage } from '../../helpers/usage-calculator.js';
import { logger } from '../../helpers/logger.js';

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

    const customDomain = await CustomDomain.create({
      userId,
      domain,
      status: 'PENDING_VERIFICATION',
      sesIdentityArn: sesResult.identityArn || null,
    });

    if (sesResult.dnsRecords && sesResult.dnsRecords.length > 0) {
      await CustomDomainDnsRecord.bulkCreate(
        sesResult.dnsRecords.map((record: any) => ({
          customDomainId: customDomain.id,
          recordType: record.type,
          purpose: record.purpose,
          name: record.name,
          value: record.value,
          isVerified: false,
        })),
      );
    }

    const result = await CustomDomain.findByPk(customDomain.id, {
      include: [{ model: CustomDomainDnsRecord, as: 'dnsRecords' }],
    });

    await recalculateUserUsage(userId);

    logger.info('addCustomDomain', `Added custom domain ${domain} (${customDomain.id}) for user ${userId}`);
    return result;
  },
);
