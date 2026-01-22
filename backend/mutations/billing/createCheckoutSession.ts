import { makeMutation } from '../../types.js';
import {
  createCheckoutSession as stripeCreateCheckoutSession,
  isStripeConfigured,
} from '../../helpers/stripe.js';
import { User } from '../../db/models/user.model.js';
import { StorageTier, AccountTier } from '../../db/models/subscription.model.js';
import { config } from '../../config/env.js';
import { requireAuth } from '../../helpers/auth.js';

/**
 * Create a Stripe Checkout session to upgrade subscription.
 * Returns the URL to redirect the user to.
 */
export const createCheckoutSession = makeMutation(
  'createCheckoutSession',
  async (_parent, args, context) => {
    const userId = requireAuth(context);

    if (!isStripeConfigured()) {
      throw new Error('Stripe is not configured on this server');
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Map GraphQL enums to model enums (case normalization)
    const storageTier = args.storageTier.toLowerCase() as StorageTier;
    const accountTier = args.accountTier.toLowerCase() as AccountTier;

    // Determine success/cancel URLs
    const baseUrl = config.isProduction
      ? 'https://mail.stacksindustries.com'
      : 'http://localhost:5173';

    const successUrl = `${baseUrl}/settings/billing?checkout=success`;
    const cancelUrl = `${baseUrl}/settings/billing?checkout=canceled`;

    const checkoutUrl = await stripeCreateCheckoutSession(
      user,
      storageTier,
      accountTier,
      successUrl,
      cancelUrl,
    );

    return checkoutUrl;
  },
);
