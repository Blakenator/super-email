import { makeQuery } from '../../types.js';
import {
  getOrCreateSubscription,
  isStripeConfigured,
  previewSubscriptionUpdate,
} from '../../helpers/stripe.js';
import { StorageTier, AccountTier } from '../../db/models/subscription.model.js';
import {
  DomainTier,
  SubscriptionStatus,
} from '../../db/models/subscription.constants.js';
import { requireAuth } from '../../helpers/auth.js';

export const previewSubscriptionChange = makeQuery(
  'previewSubscriptionChange',
  async (_parent, args, context) => {
    const userId = requireAuth(context);

    if (!isStripeConfigured()) {
      return null;
    }

    const subscription = await getOrCreateSubscription(userId);

    if (
      !subscription.stripeSubscriptionId ||
      !subscription.stripeCustomerId ||
      subscription.status !== SubscriptionStatus.ACTIVE
    ) {
      return null;
    }

    const storageTier = args.storageTier.toLowerCase() as StorageTier;
    const accountTier = args.accountTier.toLowerCase() as AccountTier;
    const domainTier = args.domainTier.toLowerCase() as DomainTier;

    const preview = await previewSubscriptionUpdate(
      subscription.stripeSubscriptionId,
      subscription.stripeCustomerId,
      storageTier,
      accountTier,
      domainTier,
    );

    return preview;
  },
);
