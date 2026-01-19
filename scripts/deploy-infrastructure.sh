#!/bin/bash
# ============================================================================
# Deploy Infrastructure with Pulumi
# ============================================================================
# Usage: ./deploy-infrastructure.sh ENVIRONMENT
# Environment variables loaded from .env file
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

ENVIRONMENT="${1:-prod}"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log_info "Deploying infrastructure with Pulumi for environment: $ENVIRONMENT"

cd "$PROJECT_ROOT/infra"

# Ensure GIT_COMMIT_SHA is set
if [ -z "$GIT_COMMIT_SHA" ]; then
    GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    export GIT_COMMIT_SHA="$GIT_SHA"
fi
log_info "Git commit SHA: $GIT_COMMIT_SHA"

# Export environment variables for Pulumi (reads from process.env)
export ENVIRONMENT="$ENVIRONMENT"
export AWS_REGION="${AWS_REGION:-us-west-1}"
export DB_INSTANCE_CLASS="${DB_INSTANCE_CLASS:-db.t4g.micro}"
export DOMAIN_NAME="${DOMAIN_NAME:-}"
export BACKEND_SUBDOMAIN="${BACKEND_SUBDOMAIN:-api}"

log_info "Configuration:"
log_info "  Environment: $ENVIRONMENT"
log_info "  AWS Region: $AWS_REGION"
log_info "  Domain: ${DOMAIN_NAME:-<not set, using CloudFront>}"

# Select or create the stack
pulumi stack select "$ENVIRONMENT" 2>/dev/null || pulumi stack init "$ENVIRONMENT"

# Deploy infrastructure
pulumi up --yes

# Export outputs
export BACKEND_REPO_URL=$(pulumi stack output backendRepoUrl)
export FRONTEND_BUCKET=$(pulumi stack output frontendBucketName)
export FRONTEND_DISTRIBUTION_ID=$(pulumi stack output frontendDistributionId)
export BACKEND_API_URL=$(pulumi stack output backendApiUrl)
export FRONTEND_URL=$(pulumi stack output frontendUrl)
export BACKEND_INSTANCE_ID=$(pulumi stack output backendInstanceId 2>/dev/null || echo "")
export BACKEND_PUBLIC_IP=$(pulumi stack output backendPublicIp 2>/dev/null || echo "")

# Output to file for sourcing by other scripts
cat > "$PROJECT_ROOT/.deploy-outputs" << EOF
export BACKEND_REPO_URL="$BACKEND_REPO_URL"
export FRONTEND_BUCKET="$FRONTEND_BUCKET"
export FRONTEND_DISTRIBUTION_ID="$FRONTEND_DISTRIBUTION_ID"
export BACKEND_API_URL="$BACKEND_API_URL"
export FRONTEND_URL="$FRONTEND_URL"
export BACKEND_INSTANCE_ID="$BACKEND_INSTANCE_ID"
export BACKEND_PUBLIC_IP="$BACKEND_PUBLIC_IP"
EOF

log_info "Infrastructure deployed successfully."
log_info "  Backend Repo: $BACKEND_REPO_URL"
log_info "  Frontend URL: $FRONTEND_URL"
if [ -n "$BACKEND_PUBLIC_IP" ]; then
    log_info "  Backend EC2 IP: $BACKEND_PUBLIC_IP"
fi

cd "$PROJECT_ROOT"
