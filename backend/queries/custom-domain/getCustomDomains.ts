import { makeQuery } from '../../types.js';
import {
  CustomDomain,
  CustomDomainDnsRecord,
  CustomDomainAccount,
  EmailAccount,
  SendProfile,
} from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const getCustomDomains = makeQuery(
  'getCustomDomains',
  async (_parent, _args, context) => {
    const userId = requireAuth(context);

    const domains = await CustomDomain.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      include: [
        { model: CustomDomainDnsRecord, as: 'dnsRecords' },
        {
          model: CustomDomainAccount,
          as: 'accounts',
          include: [
            { model: EmailAccount, as: 'emailAccount' },
            { model: SendProfile, as: 'sendProfile' },
          ],
        },
      ],
    });

    return domains;
  },
);
