#!/bin/bash
# ============================================================================
# Deploy Backend Docker Image to ECR
# ============================================================================
# Usage: ./deploy-backend.sh ENVIRONMENT
# Environment variables required:
#   - AWS_REGION
#   - AWS_ACCOUNT_ID
#   - BACKEND_REPO_URL
#   - GIT_COMMIT_SHA (optional, will be generated)
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

ENVIRONMENT="${1:-dev}"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log_info "Deploying backend for environment: $ENVIRONMENT"

cd "$PROJECT_ROOT"

# Get git commit SHA for versioning
if [ -z "$GIT_COMMIT_SHA" ]; then
    GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    export GIT_COMMIT_SHA="$GIT_SHA"
fi
log_info "Git commit SHA: $GIT_COMMIT_SHA"

# Verify PROJECT_ROOT is valid
if [ ! -d "$PROJECT_ROOT" ]; then
    log_error "PROJECT_ROOT does not exist: $PROJECT_ROOT"
    exit 1
fi

if [ ! -d "$PROJECT_ROOT/common" ]; then
    log_error "common/ directory not found in PROJECT_ROOT: $PROJECT_ROOT"
    log_error "Current directory: $(pwd)"
    log_error "SCRIPT_DIR: $SCRIPT_DIR"
    exit 1
fi

if [ ! -d "$PROJECT_ROOT/backend" ]; then
    log_error "backend/ directory not found in PROJECT_ROOT: $PROJECT_ROOT"
    exit 1
fi

# Build backend and common packages first
# This ensures we hash the actual build outputs (what gets deployed)
log_info "Building backend and common packages..."
log_info "PROJECT_ROOT: $PROJECT_ROOT"

cd "$PROJECT_ROOT/common"
if ! pnpm run build; then
    log_error "Failed to build common package"
    exit 1
fi

cd "$PROJECT_ROOT/backend"
if ! pnpm run build; then
    log_error "Failed to build backend package"
    exit 1
fi

cd "$PROJECT_ROOT"

# Verify build outputs exist
if [ ! -d "$PROJECT_ROOT/common/dist" ]; then
    log_error "common/dist/ not found - build may have failed"
    exit 1
fi

if [ ! -d "$PROJECT_ROOT/backend/dist" ]; then
    log_error "backend/dist/ not found - build may have failed"
    exit 1
fi

# Calculate content hash from built outputs
# This includes all compiled code and dependencies that actually get deployed
log_info "Calculating backend content hash from build outputs..."
HASH_FILES=$(mktemp)
trap "rm -f $HASH_FILES" EXIT

# Use cross-platform hash command (sha256sum on Linux, shasum -a 256 on macOS)
if command -v sha256sum >/dev/null 2>&1; then
    SHA256_CMD="sha256sum"
else
    SHA256_CMD="shasum -a 256"
fi

# Collect all files that affect the deployed image
# Use absolute paths to ensure we find files regardless of current directory
{
    # Built JavaScript outputs (what actually runs in the container)
    find "$PROJECT_ROOT/backend/dist" -type f \( -name "*.js" -o -name "*.js.map" \) 2>/dev/null
    find "$PROJECT_ROOT/common/dist" -type f \( -name "*.js" -o -name "*.js.map" \) 2>/dev/null
    # GraphQL schema (copied to Docker image)
    find "$PROJECT_ROOT/common" -maxdepth 1 -name "schema.graphql" -type f 2>/dev/null
    # Dockerfile and .dockerignore (affect Docker build)
    find "$PROJECT_ROOT/backend" -maxdepth 1 -type f -name "Dockerfile" 2>/dev/null
    find "$PROJECT_ROOT" -maxdepth 1 -type f -name ".dockerignore" 2>/dev/null
    # Package files that affect dependencies (copied into Docker image)
    echo "$PROJECT_ROOT/pnpm-lock.yaml"
    echo "$PROJECT_ROOT/pnpm-workspace.yaml"
    echo "$PROJECT_ROOT/package.json"
    echo "$PROJECT_ROOT/common/package.json"
    echo "$PROJECT_ROOT/backend/package.json"
} | sort > "$HASH_FILES"

# Check if we found any files
if [ ! -s "$HASH_FILES" ]; then
    log_error "No files found to hash. Build may have failed."
    exit 1
fi

# Calculate hash using cross-platform command
CONTENT_HASH=$(cat "$HASH_FILES" | xargs $SHA256_CMD 2>/dev/null | $SHA256_CMD | cut -d' ' -f1 | cut -c1-12)

# Ensure we got a valid hash
if [ -z "$CONTENT_HASH" ] || [ ${#CONTENT_HASH} -ne 12 ]; then
    log_error "Failed to calculate content hash (got: '$CONTENT_HASH')"
    exit 1
fi

log_info "Backend content hash: $CONTENT_HASH"
export CONTENT_HASH

# Check if this content hash already exists in ECR
log_info "Checking if image with hash $CONTENT_HASH already exists in ECR..."

IMAGE_EXISTS="0"

# Temporarily disable exit on error for ECR check (it's okay if this fails)
set +e

# Check if jq is available
if command -v jq >/dev/null 2>&1; then
    # Try to check ECR for existing image
    ECR_OUTPUT=$(aws ecr describe-images \
        --repository-name "email-client-$ENVIRONMENT-backend" \
        --image-ids imageTag="content-$CONTENT_HASH" \
        --region "$AWS_REGION" \
        2>&1)
    ECR_EXIT=$?

    if [ $ECR_EXIT -eq 0 ] && [ -n "$ECR_OUTPUT" ]; then
        # Try to parse JSON (may fail if output is error message)
        IMAGE_COUNT=$(echo "$ECR_OUTPUT" | jq -r '.imageDetails | length' 2>/dev/null)
        JQ_EXIT=$?

        if [ $JQ_EXIT -eq 0 ] && [ -n "$IMAGE_COUNT" ] && [ "$IMAGE_COUNT" != "null" ]; then
            # Validate it's a number using basic pattern matching
            case "$IMAGE_COUNT" in
                ''|*[!0-9]*)
                    IMAGE_EXISTS="0"
                    ;;
                *)
                    IMAGE_EXISTS="$IMAGE_COUNT"
                    ;;
            esac
        fi
    fi
else
    log_warn "jq not found. Cannot check ECR for existing images. Will build new image."
fi

# Re-enable exit on error
set -e

if [ "$IMAGE_EXISTS" != "0" ]; then
    log_info "✓ Image with hash $CONTENT_HASH already exists in ECR. Skipping build."

    # Tag the existing image with latest and git SHA
    MANIFEST=$(aws ecr batch-get-image \
        --repository-name "email-client-$ENVIRONMENT-backend" \
        --image-ids imageTag="content-$CONTENT_HASH" \
        --region "$AWS_REGION" \
        --query 'images[0].imageManifest' \
        --output text)

    aws ecr put-image \
        --repository-name "email-client-$ENVIRONMENT-backend" \
        --image-tag "latest" \
        --image-manifest "$MANIFEST" \
        --region "$AWS_REGION" > /dev/null 2>&1 || true

    aws ecr put-image \
        --repository-name "email-client-$ENVIRONMENT-backend" \
        --image-tag "$GIT_COMMIT_SHA" \
        --image-manifest "$MANIFEST" \
        --region "$AWS_REGION" > /dev/null 2>&1 || true

    log_info "Backend deployment complete (reused existing image)."
    echo "BACKEND_IMAGE_TAG=content-$CONTENT_HASH" > "$PROJECT_ROOT/.backend-image-tag"
    exit 0
fi

log_info "✗ Image not found in ECR. Building new image..."

# Build and push Docker image
log_info "Building Docker image..."
docker build -t stacksmail-backend -f backend/Dockerfile .

# Tag with content hash, latest, and git SHA
docker tag stacksmail-backend:latest "$BACKEND_REPO_URL:content-$CONTENT_HASH"
docker tag stacksmail-backend:latest "$BACKEND_REPO_URL:latest"
docker tag stacksmail-backend:latest "$BACKEND_REPO_URL:$GIT_COMMIT_SHA"

log_info "Pushing Docker image to ECR..."
docker push "$BACKEND_REPO_URL:content-$CONTENT_HASH"
docker push "$BACKEND_REPO_URL:latest"
docker push "$BACKEND_REPO_URL:$GIT_COMMIT_SHA"

# Force ECS service to redeploy with new image
log_info "Forcing ECS service to redeploy..."
aws ecs update-service \
    --cluster "email-client-$ENVIRONMENT-cluster" \
    --service "email-client-$ENVIRONMENT-backend" \
    --force-new-deployment \
    --region "$AWS_REGION" \
    > /dev/null 2>&1 || log_warn "Could not force ECS service update (service may not exist yet)"

log_info "Backend deployed successfully (new image built)."
echo "BACKEND_IMAGE_TAG=content-$CONTENT_HASH" > "$PROJECT_ROOT/.backend-image-tag"
