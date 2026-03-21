import { makeMutation } from '../../types.js';
import {
  createCheckoutSession as stripeCreateCheckoutSession,
  tryResumeOrUpdateStripeSubscription,
  isStripeConfigured,
  getOrCreateSubscription,
  syncSubscriptionFromStripe,
} from '../../helpers/stripe.js';
import { User } from '../../db/models/user.model.js';
import { StorageTier, AccountTier } from '../../db/models/subscription.model.js';
import { DomainTier } from '../../db/models/subscription.constants.js';
import { config } from '../../config/env.js';
import { requireAuth } from '../../helpers/auth.js';
import { CheckoutContext } from '../../__generated__/resolvers-types.js';

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

    const storageTier = args.storageTier.toLowerCase() as StorageTier;
    const accountTier = args.accountTier.toLowerCase() as AccountTier;
    const domainTier = args.domainTier.toLowerCase() as DomainTier;
    const checkoutContext = args.checkoutContext ?? CheckoutContext.Billing;

    let subscription = await getOrCreateSubscription(userId);
    subscription = await syncSubscriptionFromStripe(subscription);

    if (subscription.stripeSubscriptionId) {
      const handledInPlace = await tryResumeOrUpdateStripeSubscription(
        subscription.stripeSubscriptionId,
        storageTier,
        accountTier,
        domainTier,
      );
      if (handledInPlace) {
        await syncSubscriptionFromStripe(subscription);
        return null;
      }
    }

    // No in-place subscription (ended, missing, etc.) — new Checkout session
    const baseUrl = config.frontendUrl;
    if (!baseUrl) {
      throw new Error('FRONTEND_URL environment variable is not configured');
    }

    const billingPath = '/settings/billing';
    const setupPath = '/setup';
    const successUrl =
      checkoutContext === CheckoutContext.Setup
        ? `${baseUrl}${setupPath}?checkout=success&session_id={CHECKOUT_SESSION_ID}`
        : `${baseUrl}${billingPath}?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      checkoutContext === CheckoutContext.Setup
        ? `${baseUrl}${setupPath}?checkout=canceled`
        : `${baseUrl}${billingPath}?checkout=canceled`;

    const checkoutUrl = await stripeCreateCheckoutSession(
      user,
      storageTier,
      accountTier,
      successUrl,
      cancelUrl,
      domainTier,
    );

    return checkoutUrl;
  },
);
