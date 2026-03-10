import { makeMutation } from '../../types.js';
import { CustomDomain, CustomDomainDnsRecord } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { getSesVerificationStatus } from '../../helpers/ses-domain.js';
import { logger } from '../../helpers/logger.js';

export const verifyCustomDomain = makeMutation(
  'verifyCustomDomain',
  async (_parent, { id }, context) => {
    const userId = requireAuth(context);

    const customDomain = await CustomDomain.findOne({
      where: { id, userId },
      include: [{ model: CustomDomainDnsRecord, as: 'dnsRecords' }],
    });

    if (!customDomain) {
      throw new Error('Custom domain not found');
    }

    const verificationStatus = await getSesVerificationStatus(customDomain.domain);

    if (customDomain.dnsRecords) {
      for (const record of customDomain.dnsRecords) {
        const isVerified = verificationStatus.recordStatuses[record.purpose.toLowerCase()] ?? false;
        await record.update({
          isVerified,
          lastCheckedAt: new Date(),
        });
      }
    }

    const allVerified = verificationStatus.overallVerified;
    const newStatus = allVerified ? 'VERIFIED' : customDomain.status === 'FAILED' ? 'FAILED' : 'PENDING_VERIFICATION';

    await customDomain.update({ status: newStatus });

    await customDomain.reload({
      include: [{ model: CustomDomainDnsRecord, as: 'dnsRecords' }],
    });

    logger.info('verifyCustomDomain', `Verified domain ${customDomain.domain}: status=${newStatus}`);
    return customDomain;
  },
);
