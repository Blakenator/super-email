# Billing System

This document explains how to set up and configure the usage-based billing system for the email client.

## Overview

The billing system provides:
- **Storage-based billing**: Users are billed based on total email body size + attachment size
- **Account-based billing**: Users are limited by the number of email accounts they can add
- **Stripe integration**: Subscriptions are managed via Stripe
- **Usage tracking**: A materialized view recalculates usage daily at midnight UTC

## Tier Limits

### Storage Tiers

| Tier | Storage Limit |
|------|--------------|
| Free | 5 GB |
| Basic | 10 GB |
| Pro | 20 GB |
| Enterprise | 100 GB |

### Account Tiers

| Tier | Account Limit |
|------|--------------|
| Free | 1 account |
| Basic | 2 accounts |
| Pro | 5 accounts |
| Enterprise | Unlimited |

## Stripe Setup

### 1. Create Stripe Products and Prices

In the [Stripe Dashboard](https://dashboard.stripe.com):

1. Go to **Products** and create products for each tier:
   - Storage Tiers: "Basic Storage (10GB)", "Pro Storage (20GB)", "Enterprise Storage (100GB)"
   - Account Tiers: "Basic Accounts (2)", "Pro Accounts (5)", "Enterprise Accounts (Unlimited)"

2. For each product, create a recurring price (monthly or yearly)

3. Note down the Price IDs (starting with `price_...`)

### 2. Configure Webhook

1. Go to **Developers > Webhooks**
2. Add an endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the webhook signing secret (starting with `whsec_...`)

### 3. Configure Customer Portal

1. Go to **Settings > Billing > Customer Portal**
2. Enable the customer portal
3. Configure which features customers can access:
   - Update payment methods
   - Cancel subscriptions
   - View invoices

## Environment Variables

Add these environment variables to your backend:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...

# Storage Tier Price IDs
STRIPE_PRICE_STORAGE_BASIC=price_...
STRIPE_PRICE_STORAGE_PRO=price_...
STRIPE_PRICE_STORAGE_ENTERPRISE=price_...

# Account Tier Price IDs
STRIPE_PRICE_ACCOUNTS_BASIC=price_...
STRIPE_PRICE_ACCOUNTS_PRO=price_...
STRIPE_PRICE_ACCOUNTS_ENTERPRISE=price_...
```

## Database Setup

### Materialized View

The billing system uses a PostgreSQL materialized view to efficiently calculate storage usage. The view is created automatically when the server starts, but you can also create it manually:

```sql
-- Run the migration
psql -d your_database -f backend/db/migrations/create-billing-views.sql
```

The view calculates:
- Total email body size (textBody + htmlBody)
- Total attachment size
- Number of email accounts per user
- Email and attachment counts

### Subscription Table

The `subscriptions` table stores user billing information:
- Stripe customer ID
- Stripe subscription ID
- Current storage and account tiers
- Subscription status
- Billing period information

## How It Works

### Usage Calculation

1. A materialized view (`user_storage_usage`) aggregates storage usage per user
2. The view is refreshed daily at midnight UTC by the usage daemon
3. Real-time calculations are available for immediate checks (e.g., before syncing)

### Sync Blocking

When a user exceeds their limits:
- **Storage exceeded**: Email syncing is paused
- **Account limit exceeded**: Cannot add new email accounts

Users receive error messages explaining the issue and how to resolve it (upgrade or delete data).

### Webhook Handling

When Stripe sends webhook events:
1. `checkout.session.completed`: Links the Stripe subscription to the user
2. `customer.subscription.updated`: Updates tier levels based on active prices
3. `customer.subscription.deleted`: Resets user to free tier
4. `invoice.payment_failed`: Marks subscription as past due

## Frontend Integration

### Billing Settings Page

Access via: `/settings/billing`

Features:
- View current subscription status
- See storage and account usage with progress bars
- Warning when approaching limits
- Link to Stripe Customer Portal for managing subscription

### GraphQL API

**Queries:**
- `getBillingInfo`: Get subscription and usage information
- `getStorageUsage`: Get cached usage from materialized view
- `getStorageUsageRealtime`: Get real-time usage (slower but accurate)

**Mutations:**
- `createCheckoutSession`: Create Stripe Checkout for upgrading
- `createBillingPortalSession`: Get URL to Stripe Customer Portal
- `refreshStorageUsage`: Force refresh the materialized view

## Local Development

For local development without Stripe:
1. Leave the Stripe environment variables empty
2. Users will see "Billing not configured" in the UI
3. All users get free tier limits (5GB, 1 account)

To test Stripe locally:
1. Use Stripe test mode keys (sk_test_..., pk_test_...)
2. Use the [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks:
   ```bash
   stripe listen --forward-to localhost:4000/api/webhooks/stripe
   ```

## Production Deployment

1. Set all Stripe environment variables with production keys
2. Ensure the webhook endpoint is publicly accessible
3. Verify the webhook is receiving events in Stripe Dashboard
4. Monitor the usage daemon logs for daily refresh status

## Troubleshooting

### Usage not updating

The materialized view refreshes at midnight UTC. To force a refresh:
- Use the "Refresh" button in Settings > Billing
- Or call the `refreshStorageUsage` mutation

### Webhook not working

1. Check the Stripe Dashboard for webhook delivery attempts
2. Verify the webhook secret is correct
3. Ensure the endpoint URL is correct and accessible
4. Check server logs for webhook handling errors

### Users can't sync despite being under limits

1. Check the subscription status (must be `active` or `trialing`)
2. Verify the real-time usage calculation is working
3. Check if there's a past due payment blocking access
