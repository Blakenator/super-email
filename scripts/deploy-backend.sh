#!/bin/bash
# ============================================================================
# Deploy Backend Docker Image to ECR and Update EC2
# ============================================================================
# Usage: ./deploy-backend.sh ENVIRONMENT
# Environment variables required:
#   - AWS_REGION
#   - BACKEND_REPO_URL
#   - BACKEND_INSTANCE_ID (optional, for EC2 update)
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

ENVIRONMENT="${1:-prod}"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log_info "Deploying backend for environment: $ENVIRONMENT"

cd "$PROJECT_ROOT"

# Get git commit SHA for versioning
if [ -z "$GIT_COMMIT_SHA" ]; then
    GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    export GIT_COMMIT_SHA="$GIT_SHA"
fi
log_info "Git commit SHA: $GIT_COMMIT_SHA"

# Calculate content hash for backend code
log_info "Calculating backend content hash..."
CONTENT_HASH=$(find backend common -type f \( -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name "Dockerfile" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/dist/*" \
    -exec sha256sum {} \; | sort | sha256sum | cut -d' ' -f1 | cut -c1-12)

log_info "Backend content hash: $CONTENT_HASH"

# Check if this content hash already exists in ECR
log_info "Checking if image with hash $CONTENT_HASH already exists in ECR..."
IMAGE_EXISTS=$(aws ecr describe-images \
    --repository-name "email-client-$ENVIRONMENT-backend" \
    --image-ids imageTag="content-$CONTENT_HASH" \
    --region "$AWS_REGION" \
    2>/dev/null | jq -r '.imageDetails | length' || echo "0")

BUILD_NEW_IMAGE=false

if [ "$IMAGE_EXISTS" != "0" ]; then
    log_info "✓ Image with hash $CONTENT_HASH already exists in ECR."
    
    # Tag the existing image with latest
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
else
    log_info "✗ Image not found in ECR. Building new image..."
    BUILD_NEW_IMAGE=true

    # Build and push Docker image for ARM64 (Graviton)
    log_info "Building Docker image for ARM64 (Graviton)..."

    # Ensure buildx is available
    docker buildx create --name multiarch --use 2>/dev/null || docker buildx use multiarch 2>/dev/null || true

    # Build for ARM64 and push directly to ECR
    docker buildx build \
        --platform linux/arm64 \
        -t "$BACKEND_REPO_URL:content-$CONTENT_HASH" \
        -t "$BACKEND_REPO_URL:latest" \
        -t "$BACKEND_REPO_URL:$GIT_COMMIT_SHA" \
        -f backend/Dockerfile \
        --push \
        .
    
    log_info "Docker image built and pushed to ECR."
fi

# Update EC2 instance to pull new image
if [ -n "$BACKEND_INSTANCE_ID" ]; then
    log_info "Updating EC2 instance $BACKEND_INSTANCE_ID..."
    
    # Use SSM to run the update script on EC2
    aws ssm send-command \
        --instance-ids "$BACKEND_INSTANCE_ID" \
        --document-name "AWS-RunShellScript" \
        --parameters 'commands=["/home/ec2-user/update-backend.sh"]' \
        --region "$AWS_REGION" \
        --output text > /dev/null 2>&1 || {
            log_warn "SSM command failed. You may need to manually SSH and run: /home/ec2-user/update-backend.sh"
            log_warn "Or wait for the next EC2 reboot to pick up the new image."
        }
    
    log_info "EC2 update command sent. Container will restart with new image."
else
    log_warn "BACKEND_INSTANCE_ID not set. Skipping EC2 update."
    log_warn "The new image is in ECR. Restart the EC2 instance or run update-backend.sh manually."
fi

log_info "Backend deployment complete."
echo "BACKEND_IMAGE_TAG=content-$CONTENT_HASH" > "$PROJECT_ROOT/.backend-image-tag"
