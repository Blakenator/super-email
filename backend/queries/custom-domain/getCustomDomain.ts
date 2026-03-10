import { makeQuery } from '../../types.js';
import {
  CustomDomain,
  CustomDomainDnsRecord,
  CustomDomainAccount,
  EmailAccount,
  SendProfile,
} from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const getCustomDomain = makeQuery(
  'getCustomDomain',
  async (_parent, { id }, context) => {
    const userId = requireAuth(context);

    const domain = await CustomDomain.findOne({
      where: { id, userId },
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

    return domain;
  },
);
