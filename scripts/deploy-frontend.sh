#!/bin/bash
# ============================================================================
# Deploy Frontend
# ============================================================================
# Usage: ./deploy-frontend.sh ENVIRONMENT
# Environment variables required:
#   - FRONTEND_BUCKET
#   - FRONTEND_DISTRIBUTION_ID
#   - BACKEND_API_URL
#   - FRONTEND_URL
#   - SUPABASE_URL
#   - SUPABASE_ANON_KEY
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

ENVIRONMENT="${1:-dev}"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log_info "Deploying frontend for environment: $ENVIRONMENT"

# Validate required environment variables
if [ -z "$BACKEND_API_URL" ]; then
    log_error "BACKEND_API_URL is not set. Cannot deploy frontend without backend URL."
    exit 1
fi

if [ -z "$FRONTEND_URL" ]; then
    log_error "FRONTEND_URL is not set. Cannot deploy frontend."
    exit 1
fi

if [ -z "$SUPABASE_URL" ]; then
    log_error "SUPABASE_URL is not set. Cannot deploy frontend."
    exit 1
fi

if [ -z "$FRONTEND_BUCKET" ]; then
    log_error "FRONTEND_BUCKET is not set. Cannot deploy frontend."
    exit 1
fi

cd "$PROJECT_ROOT/frontend"

# Set environment variables for Vite build
export VITE_SUPABASE_URL="$SUPABASE_URL"
export VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
export VITE_APP_URL="$FRONTEND_URL"

# Backend URL:
# - If DOMAIN_NAME is set: use api subdomain (e.g., https://api.super-mail.app)
# - Otherwise: defaults to window.location.origin (frontend will call /api/* on same domain)
if [ -n "$DOMAIN_NAME" ]; then
    export VITE_BACKEND_URL="https://${BACKEND_SUBDOMAIN:-api}.${DOMAIN_NAME}"
    log_info "Using API subdomain: $VITE_BACKEND_URL"
else
    # Don't set VITE_BACKEND_URL - let it default to window.location.origin
    log_info "Backend URL will default to same origin (calls /api/* paths)"
fi

log_info "Building frontend with production config..."
log_info "  Frontend URL: $FRONTEND_URL"

pnpm run build

# Sync to S3
log_info "Uploading to S3..."
aws s3 sync dist/ "s3://$FRONTEND_BUCKET/" \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "index.html" \
    --exclude "*.json"

# Upload HTML with no-cache
aws s3 cp dist/index.html "s3://$FRONTEND_BUCKET/index.html" \
    --cache-control "no-cache, no-store, must-revalidate"

# Upload any JSON files with correct relative paths
for json_file in $(find dist -name "*.json" -type f 2>/dev/null); do
    relative_path="${json_file#dist/}"
    aws s3 cp "$json_file" "s3://$FRONTEND_BUCKET/$relative_path" \
        --cache-control "no-cache"
done

# Invalidate CloudFront cache
log_info "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
    --distribution-id "$FRONTEND_DISTRIBUTION_ID" \
    --paths "/*" \
    > /dev/null

log_info "Frontend deployed successfully."
