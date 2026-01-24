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

# Set Stripe configuration (optional - for billing)
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

# Deploy infrastructure
pulumi up --yes

# Export outputs
export BACKEND_REPO_URL=$(pulumi stack output backendRepoUrl)
export FRONTEND_BUCKET=$(pulumi stack output frontendBucketName)
export FRONTEND_DISTRIBUTION_ID=$(pulumi stack output frontendDistributionId)
export BACKEND_API_URL=$(pulumi stack output backendApiUrl)
export FRONTEND_URL=$(pulumi stack output frontendUrl)

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

cd "$PROJECT_ROOT"
