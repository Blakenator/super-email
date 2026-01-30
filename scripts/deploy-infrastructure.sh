#!/bin/bash
# ============================================================================
# Deploy Infrastructure with Pulumi
# ============================================================================
# Usage: ./deploy-infrastructure.sh ENVIRONMENT
# Environment variables required:
#   - AWS_REGION
#   - SUPABASE_URL
#   - SUPABASE_ANON_KEY
#   - SUPABASE_SERVICE_ROLE_KEY
# Environment variables optional (for billing):
#   - STRIPE_SECRET_KEY
#   - STRIPE_WEBHOOK_SECRET
#   - STRIPE_PUBLISHABLE_KEY
# Environment variables optional (for paid subscription tiers):
#   - Any STRIPE_PRICE_* variables are auto-loaded into Pulumi config
#   - e.g., STRIPE_PRICE_STORAGE_BASIC -> stripePriceStorageBasic
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
