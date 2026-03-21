# Email Client Infrastructure

This package contains the Infrastructure as Code (IaC) for deploying the Email Client application to AWS using [Pulumi](https://www.pulumi.com/).

## Architecture

The infrastructure includes:

- **VPC** with public and private subnets across 2 availability zones
- **RDS PostgreSQL** database in private subnets
- **ECS Fargate** cluster running:
  - Backend API service (Node.js/Express/GraphQL)
  - Frontend service (React/Vite served via Nginx)
- **Application Load Balancer** for routing traffic
- **ECR** repositories for Docker images
- **CloudWatch** log groups for container logs

## Prerequisites

1. Install [Pulumi CLI](https://www.pulumi.com/docs/install/)
2. Install [AWS CLI](https://aws.amazon.com/cli/) and configure credentials
3. Install Node.js 20+

## Setup

```bash
# Install dependencies
pnpm install

# Login to Pulumi (use local state for development)
pulumi login --local

# Create a new stack
pulumi stack init dev
```

## Configuration

Set the required configuration values:

```bash
# Set AWS region
pulumi config set aws:region us-east-1

# Set environment
pulumi config set email-client-infra:environment dev

# Optionally customize DB instance class
pulumi config set email-client-infra:dbInstanceClass db.t3.micro
```

### Stripe Configuration (for billing)

To enable paid subscription tiers, configure Stripe:

```bash
# Stripe API keys (required for billing)
pulumi config set --secret email-client-infra:stripeSecretKey sk_test_...
pulumi config set --secret email-client-infra:stripeWebhookSecret whsec_...
pulumi config set email-client-infra:stripePublishableKey pk_test_...

# Stripe price IDs for subscription tiers (from Stripe Dashboard)
# See docs/BILLING.md for how to create these in Stripe
pulumi config set email-client-infra:stripePricePlatformBase price_...
pulumi config set email-client-infra:stripePriceStorageBasic price_...
pulumi config set email-client-infra:stripePriceStoragePro price_...
pulumi config set email-client-infra:stripePriceStorageEnterprise price_...
pulumi config set email-client-infra:stripePriceAccountsBasic price_...
pulumi config set email-client-infra:stripePriceAccountsPro price_...
pulumi config set email-client-infra:stripePriceAccountsEnterprise price_...
pulumi config set email-client-infra:stripePriceDomainsBasic price_...
pulumi config set email-client-infra:stripePriceDomainsPro price_...
pulumi config set email-client-infra:stripePriceDomainsEnterprise price_...
```

If Stripe is not configured, the billing UI will show "Billing not configured" and all users will have free tier limits.

Note: The frontend URL for Stripe checkout redirects is automatically derived from the CloudFront distribution domain.

### OAuth (Gmail / Yahoo / Outlook)

Client IDs are plain Pulumi config; client secrets are stored in Secrets Manager (placeholders when unset).

```bash
pulumi config set email-client-infra:googleOAuthClientId YOUR_CLIENT_ID.apps.googleusercontent.com
pulumi config set --secret email-client-infra:googleOAuthClientSecret GOCSPX-...
# Optional: Yahoo and Outlook
pulumi config set email-client-infra:yahooOAuthClientId ...
pulumi config set --secret email-client-infra:yahooOAuthClientSecret ...
pulumi config set email-client-infra:outlookOAuthClientId ...
pulumi config set --secret email-client-infra:outlookOAuthClientSecret ...
```

Redirect URIs are set on the ECS task from your deployed app URL: `https://<your-domain>/api/oauth/{google|yahoo|outlook}/callback`. Register those URLs in each provider console.

### Firebase Admin (web push)

Optional. Paste the service account JSON as a single Pulumi secret (or use `FIREBASE_SERVICE_ACCOUNT_JSON` with `scripts/deploy-infrastructure.sh` / GitHub Actions).

```bash
pulumi config set --secret email-client-infra:firebaseServiceAccountJson "$(cat path/to/service-account.json)"
```

## Deploy

```bash
# Preview changes
pnpm run preview

# Deploy infrastructure
pnpm run up
```

## Destroy

```bash
# Tear down all resources
pnpm run destroy
```

## Outputs

After deployment, you'll get:

- `albUrl` - The Application Load Balancer URL
- `backendRepoUrl` - ECR repository URL for backend images
- `frontendRepoUrl` - ECR repository URL for frontend images
- `databaseEndpoint` - RDS PostgreSQL endpoint

## Building and Pushing Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
cd ../backend
docker build -t email-client-backend .
docker tag email-client-backend:latest <backend-repo-url>:latest
docker push <backend-repo-url>:latest

# Build and push frontend
cd ../frontend
docker build -t email-client-frontend .
docker tag email-client-frontend:latest <frontend-repo-url>:latest
docker push <frontend-repo-url>:latest
```

## Environment-Specific Configuration

- **dev**: Single instance, no deletion protection, minimal backups
- **prod**: Multi-AZ RDS, deletion protection, 7-day backups, 2 ECS tasks per service
