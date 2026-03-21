#!/bin/bash
# ============================================================================
# Deploy Infrastructure with Pulumi
# ============================================================================
# Usage: ./deploy-infrastructure.sh ENVIRONMENT
#
# Required environment variables:
#   - AWS_REGION
#   - SUPABASE_URL
#   - SUPABASE_ANON_KEY
#   - SUPABASE_SERVICE_ROLE_KEY
#
# Optional — Stripe (pulumi config → ECS env / Secrets Manager):
#   - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PUBLISHABLE_KEY
#   - Every STRIPE_PRICE_* name is auto-imported: env | grep ^STRIPE_PRICE_
#     → Pulumi camelCase key (e.g. STRIPE_PRICE_PLATFORM_BASE → stripePricePlatformBase)
#     → ECS env STRIPE_PRICE_* (see infra/index.ts backend task definition)
#
# Optional — custom domain + Cloudflare:
#   - DOMAIN_NAME, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID
#
# Optional — SES (stack region may lack SES; default in infra is us-west-2):
#   - SES_REGION
#
# Populated by Pulumi into ECS without CI env vars:
#   - DB_*, ATTACHMENTS_S3_BUCKET, EMAIL_BODIES_S3_BUCKET, RAW_EMAILS_S3_BUCKET,
#     AWS_REGION, SECRETS_BASE_PATH, FRONTEND_URL, SQS_CUSTOM_EMAIL_QUEUE_URL,
#     BACKGROUND_SYNC_ENABLED, NODE_ENV, LOG_LEVEL, PORT, SUPABASE_URL, SUPABASE_ANON_KEY,
#     STRIPE_PUBLISHABLE_KEY + all STRIPE_PRICE_* from config
#   - Secrets Manager → ECS: SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY,
#     STRIPE_WEBHOOK_SECRET, INTERNAL_API_TOKEN, JWT_SECRET,
#     GOOGLE_OAUTH_CLIENT_SECRET, YAHOO_OAUTH_CLIENT_SECRET, OUTLOOK_OAUTH_CLIENT_SECRET,
#     FIREBASE_SERVICE_ACCOUNT_JSON
#
# Optional — OAuth (plain config: client IDs; secrets: client secrets).
# Redirect URIs are set automatically from FRONTEND_URL in infra (…/api/oauth/{google|yahoo|outlook}/callback).
#   - GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET
#   - YAHOO_OAUTH_CLIENT_ID, YAHOO_OAUTH_CLIENT_SECRET
#   - OUTLOOK_OAUTH_CLIENT_ID, OUTLOOK_OAUTH_CLIENT_SECRET
#
# Optional — Firebase Admin JSON (web push), same as backend FIREBASE_SERVICE_ACCOUNT_JSON:
#   - FIREBASE_SERVICE_ACCOUNT_JSON (entire JSON object as a string; use GitHub multiline secret or CI file)
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

ENVIRONMENT="${1:-dev}"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load .env file if it exists and not already loaded
if [ -f "$PROJECT_ROOT/.env" ]; then
    log_info "Loading environment variables from .env file..."
    set -a  # automatically export all variables
    source "$PROJECT_ROOT/.env"
    set +a
fi

log_info "Deploying infrastructure with Pulumi for environment: $ENVIRONMENT"

cd "$PROJECT_ROOT/infra"

# Ensure GIT_COMMIT_SHA is set
if [ -z "$GIT_COMMIT_SHA" ]; then
    GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    export GIT_COMMIT_SHA="$GIT_SHA"
fi
log_info "Git commit SHA: $GIT_COMMIT_SHA"

# Set CONTENT_HASH if not already set
if [ -z "$CONTENT_HASH" ]; then
    export CONTENT_HASH="unknown"
fi
log_info "Content hash: $CONTENT_HASH"

# Select or create the stack
pulumi stack select "$ENVIRONMENT" 2>/dev/null || pulumi stack init "$ENVIRONMENT"

# Set configuration
pulumi config set environment "$ENVIRONMENT"
pulumi config set aws:region "$AWS_REGION"

# Set Supabase configuration
pulumi config set supabaseUrl "$SUPABASE_URL"
pulumi config set supabaseAnonKey "$SUPABASE_ANON_KEY"
pulumi config set --secret supabaseServiceRoleKey "$SUPABASE_SERVICE_ROLE_KEY"

# Helper function to convert SCREAMING_SNAKE_CASE to camelCase
# e.g., STRIPE_PRICE_STORAGE_BASIC -> stripePriceStorageBasic
to_camel_case() {
    echo "$1" | awk -F_ '{
        for (i=1; i<=NF; i++) {
            if (i==1) {
                printf tolower($i)
            } else {
                printf toupper(substr($i,1,1)) tolower(substr($i,2))
            }
        }
        print ""
    }'
}

# Set Stripe configuration (optional - for billing)
# These are secrets and need to be set individually
if [ -n "$STRIPE_SECRET_KEY" ]; then
    log_info "Setting Stripe secret key..."
    pulumi config set --secret stripeSecretKey "$STRIPE_SECRET_KEY"
else
    log_warn "STRIPE_SECRET_KEY not set - billing features will be disabled"
fi

if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
    log_info "Setting Stripe webhook secret..."
    pulumi config set --secret stripeWebhookSecret "$STRIPE_WEBHOOK_SECRET"
else
    log_warn "STRIPE_WEBHOOK_SECRET not set - Stripe webhooks will not work"
fi

if [ -n "$STRIPE_PUBLISHABLE_KEY" ]; then
    log_info "Setting Stripe publishable key..."
    pulumi config set stripePublishableKey "$STRIPE_PUBLISHABLE_KEY"
fi

# Auto-load all STRIPE_PRICE_* environment variables into Pulumi config
# This allows adding new price tiers without modifying this script
PRICE_COUNT=0
log_info "Loading Stripe price IDs from environment..."
while IFS='=' read -r name value; do
    if [ -n "$value" ]; then
        # Convert env var name to Pulumi config key (camelCase)
        config_key=$(to_camel_case "$name")
        pulumi config set "$config_key" "$value"
        log_info "  Set $config_key"
        PRICE_COUNT=$((PRICE_COUNT + 1))
    fi
done < <(env | grep -E '^STRIPE_PRICE_' | sort)

if [ "$PRICE_COUNT" -eq 0 ]; then
    log_warn "No Stripe price IDs configured - paid subscription tiers will be unavailable"
else
    log_info "Loaded $PRICE_COUNT Stripe price ID(s)"
fi

# SES region (SES is not available in all regions, e.g. us-west-1)
if [ -n "$SES_REGION" ]; then
    log_info "Setting SES region: $SES_REGION"
    pulumi config set sesRegion "$SES_REGION"
fi

# Set custom domain configuration (optional)
if [ -n "$DOMAIN_NAME" ]; then
    log_info "Setting custom domain: $DOMAIN_NAME"
    pulumi config set domainName "$DOMAIN_NAME"
else
    log_warn "DOMAIN_NAME not set - using default CloudFront domain"
fi

if [ -n "$CLOUDFLARE_ZONE_ID" ]; then
    log_info "Setting Cloudflare zone ID..."
    pulumi config set cloudflareZoneId "$CLOUDFLARE_ZONE_ID"
fi

# OAuth (optional — email provider linking)
if [ -n "$GOOGLE_OAUTH_CLIENT_ID" ]; then
    log_info "Setting Google OAuth client ID..."
    pulumi config set googleOAuthClientId "$GOOGLE_OAUTH_CLIENT_ID"
fi
if [ -n "$GOOGLE_OAUTH_CLIENT_SECRET" ]; then
    log_info "Setting Google OAuth client secret..."
    pulumi config set --secret googleOAuthClientSecret "$GOOGLE_OAUTH_CLIENT_SECRET"
fi
if [ -n "$YAHOO_OAUTH_CLIENT_ID" ]; then
    log_info "Setting Yahoo OAuth client ID..."
    pulumi config set yahooOAuthClientId "$YAHOO_OAUTH_CLIENT_ID"
fi
if [ -n "$YAHOO_OAUTH_CLIENT_SECRET" ]; then
    log_info "Setting Yahoo OAuth client secret..."
    pulumi config set --secret yahooOAuthClientSecret "$YAHOO_OAUTH_CLIENT_SECRET"
fi
if [ -n "$OUTLOOK_OAUTH_CLIENT_ID" ]; then
    log_info "Setting Outlook OAuth client ID..."
    pulumi config set outlookOAuthClientId "$OUTLOOK_OAUTH_CLIENT_ID"
fi
if [ -n "$OUTLOOK_OAUTH_CLIENT_SECRET" ]; then
    log_info "Setting Outlook OAuth client secret..."
    pulumi config set --secret outlookOAuthClientSecret "$OUTLOOK_OAUTH_CLIENT_SECRET"
fi

# Firebase Admin (optional — web push)
if [ -n "$FIREBASE_SERVICE_ACCOUNT_JSON" ]; then
    log_info "Setting Firebase service account JSON..."
    pulumi config set --secret firebaseServiceAccountJson "$FIREBASE_SERVICE_ACCOUNT_JSON"
fi

# Deploy infrastructure
pulumi up --yes

# Export outputs
BACKEND_REPO_URL=$(pulumi stack output backendRepoUrl)
FRONTEND_BUCKET=$(pulumi stack output frontendBucketName)
FRONTEND_DISTRIBUTION_ID=$(pulumi stack output frontendDistributionId)
BACKEND_API_URL=$(pulumi stack output backendApiUrl)
FRONTEND_URL=$(pulumi stack output frontendUrl)

export BACKEND_REPO_URL
export FRONTEND_BUCKET
export FRONTEND_DISTRIBUTION_ID
export BACKEND_API_URL
export FRONTEND_URL

# Output to file for sourcing by other scripts
cat > "$PROJECT_ROOT/.deploy-outputs" << EOF
export BACKEND_REPO_URL="$BACKEND_REPO_URL"
export FRONTEND_BUCKET="$FRONTEND_BUCKET"
export FRONTEND_DISTRIBUTION_ID="$FRONTEND_DISTRIBUTION_ID"
export BACKEND_API_URL="$BACKEND_API_URL"
export FRONTEND_URL="$FRONTEND_URL"
EOF

log_info "Infrastructure deployed successfully."
log_info "  Backend Repo: $BACKEND_REPO_URL"
log_info "  Frontend Bucket: $FRONTEND_BUCKET"
log_info "  Frontend URL: $FRONTEND_URL"

cd "$PROJECT_ROOT"
