import { makeMutation } from '../../types.js';
import {
  createBillingPortalSession as stripeCreatePortalSession,
  isStripeConfigured,
} from '../../helpers/stripe.js';
import { User } from '../../db/models/user.model.js';
import { config } from '../../config/env.js';

/**
 * Create a Stripe Billing Portal session to manage subscription.
 * Returns the URL to redirect the user to.
 */
export const createBillingPortalSession = makeMutation(
  'createBillingPortalSession',
  async (_parent, _args, context) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    if (!isStripeConfigured()) {
      throw new Error('Stripe is not configured on this server');
    }

    const user = await User.findByPk(context.user.id);
    if (!user) {
      throw new Error('User not found');
    }

    // Determine return URL
    const baseUrl = config.isProduction
      ? 'https://mail.stacksindustries.com'
      : 'http://localhost:5173';

    const returnUrl = `${baseUrl}/settings/billing`;

    const portalUrl = await stripeCreatePortalSession(user, returnUrl);

    return portalUrl;
  },
);
