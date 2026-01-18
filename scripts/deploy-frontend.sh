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

cd "$PROJECT_ROOT/frontend"

# Set environment variables for Vite build
export VITE_SUPABASE_URL="$SUPABASE_URL"
export VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
export VITE_BACKEND_API_URL="${BACKEND_API_URL}/api/graphql"
export VITE_APP_URL="$FRONTEND_URL"

log_info "Building frontend with production config..."
log_info "  Frontend URL: $FRONTEND_URL"
log_info "  Backend API URL: $BACKEND_API_URL"

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
