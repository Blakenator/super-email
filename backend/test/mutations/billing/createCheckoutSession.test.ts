/**
 * Tests for createCheckoutSession mutation — sync + in-place vs Checkout branching.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import esmock from 'esmock';
import {
  createMockContext,
  createUnauthenticatedContext,
} from '../../utils/index.js';
import { CheckoutContext } from '../../../__generated__/resolvers-types.js';

describe('createCheckoutSession mutation', () => {
  let createCheckoutSession: (
    parent: unknown,
    args: {
      storageTier: string;
      accountTier: string;
      domainTier: string;
      checkoutContext?: CheckoutContext;
    },
    context: unknown,
  ) => Promise<string | null>;
  let getOrCreateSubscriptionStub: sinon.SinonStub;
  let syncSubscriptionFromStripeStub: sinon.SinonStub;
  let tryResumeOrUpdateStub: sinon.SinonStub;
  let stripeCheckoutSessionStub: sinon.SinonStub;
  let userFindByPkStub: sinon.SinonStub;

  const tierArgs = {
    storageTier: 'BASIC',
    accountTier: 'FREE',
    domainTier: 'FREE',
  };

  beforeEach(async () => {
    getOrCreateSubscriptionStub = sinon.stub().resolves({
      stripeSubscriptionId: 'sub_123',
      userId: 'user-1',
    });
    syncSubscriptionFromStripeStub = sinon.stub().callsFake((s: unknown) =>
      Promise.resolve(s),
    );
    tryResumeOrUpdateStub = sinon.stub();
    stripeCheckoutSessionStub = sinon
      .stub()
      .resolves('https://checkout.stripe.com/test');
    userFindByPkStub = sinon.stub().resolves({
      id: 'user-1',
      email: 'a@b.com',
      firstName: 'A',
      lastName: 'B',
    });

    const mod = await esmock(
      '../../../mutations/billing/createCheckoutSession.js',
      {
        '../../../helpers/stripe.js': {
          isStripeConfigured: () => true,
          getOrCreateSubscription: getOrCreateSubscriptionStub,
          syncSubscriptionFromStripe: syncSubscriptionFromStripeStub,
          tryResumeOrUpdateStripeSubscription: tryResumeOrUpdateStub,
          createCheckoutSession: stripeCheckoutSessionStub,
        },
        '../../../db/models/user.model.js': {
          User: { findByPk: userFindByPkStub },
        },
        '../../../config/env.js': {
          config: { frontendUrl: 'http://localhost:5173' },
        },
      },
    );
    createCheckoutSession = mod.createCheckoutSession;
  });

  afterEach(() => {
    sinon.restore();
  });

  it('throws when not authenticated', async () => {
    try {
      await createCheckoutSession(
        null,
        tierArgs,
        createUnauthenticatedContext(),
      );
      expect.fail('Should have thrown');
    } catch (err: unknown) {
      expect((err as Error).message).to.equal('Authentication required');
    }
  });

  it('returns null when in-place resume/update succeeds', async () => {
    tryResumeOrUpdateStub.resolves(true);
    const ctx = createMockContext({ userId: 'user-1' });
    const out = await createCheckoutSession(null, tierArgs, ctx);
    expect(out).to.equal(null);
    expect(tryResumeOrUpdateStub.calledOnce).to.be.true;
    expect(tryResumeOrUpdateStub.firstCall.args[0]).to.equal('sub_123');
    expect(syncSubscriptionFromStripeStub.callCount).to.equal(2);
    expect(stripeCheckoutSessionStub.called).to.be.false;
  });

  it('creates checkout when in-place returns false (e.g. canceled in Stripe)', async () => {
    tryResumeOrUpdateStub.resolves(false);
    const ctx = createMockContext({ userId: 'user-1' });
    const out = await createCheckoutSession(null, tierArgs, ctx);
    expect(out).to.equal('https://checkout.stripe.com/test');
    expect(stripeCheckoutSessionStub.calledOnce).to.be.true;
    expect(syncSubscriptionFromStripeStub.callCount).to.equal(1);
  });

  it('uses /setup checkout return URLs when checkoutContext is SETUP', async () => {
    tryResumeOrUpdateStub.resolves(false);
    const ctx = createMockContext({ userId: 'user-1' });
    await createCheckoutSession(
      null,
      { ...tierArgs, checkoutContext: CheckoutContext.Setup },
      ctx,
    );
    expect(stripeCheckoutSessionStub.calledOnce).to.be.true;
    const successUrl = stripeCheckoutSessionStub.firstCall.args[3] as string;
    const cancelUrl = stripeCheckoutSessionStub.firstCall.args[4] as string;
    expect(successUrl).to.contain('/setup?checkout=success');
    expect(cancelUrl).to.contain('/setup?checkout=canceled');
  });

  it('creates checkout when there is no stripeSubscriptionId after sync', async () => {
    getOrCreateSubscriptionStub.resolves({
      stripeSubscriptionId: null,
      userId: 'user-1',
    });
    const ctx = createMockContext({ userId: 'user-1' });
    const out = await createCheckoutSession(null, tierArgs, ctx);
    expect(out).to.equal('https://checkout.stripe.com/test');
    expect(tryResumeOrUpdateStub.called).to.be.false;
    expect(stripeCheckoutSessionStub.calledOnce).to.be.true;
  });

  it('throws when Stripe is not configured', async () => {
    const mod = await esmock(
      '../../../mutations/billing/createCheckoutSession.js',
      {
        '../../../helpers/stripe.js': {
          isStripeConfigured: () => false,
          getOrCreateSubscription: getOrCreateSubscriptionStub,
          syncSubscriptionFromStripe: syncSubscriptionFromStripeStub,
          tryResumeOrUpdateStripeSubscription: tryResumeOrUpdateStub,
          createCheckoutSession: stripeCheckoutSessionStub,
        },
        '../../../db/models/user.model.js': {
          User: { findByPk: userFindByPkStub },
        },
        '../../../config/env.js': {
          config: { frontendUrl: 'http://localhost:5173' },
        },
      },
    );
    const resolver = mod.createCheckoutSession;
    try {
      await resolver(null, tierArgs, createMockContext({ userId: 'user-1' }));
      expect.fail('Should have thrown');
    } catch (err: unknown) {
      expect((err as Error).message).to.contain('Stripe is not configured');
    }
  });
});
