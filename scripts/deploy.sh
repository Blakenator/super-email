#!/bin/bash
set -e

# ============================================================================
# StacksMail Deploy Script
# ============================================================================
# This script builds and deploys the application to AWS.
# 
# Prerequisites:
#   - AWS CLI configured with appropriate credentials
#   - Docker installed and running
#   - Pulumi CLI installed and logged in
#   - pnpm installed
#
# Usage:
#   ./scripts/deploy.sh [environment]
#
# Environment defaults to 'dev' if not specified.
# ============================================================================

ENVIRONMENT="${1:-dev}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=============================================="
echo "  StacksMail Deploy - Environment: $ENVIRONMENT"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prereqs() {
    log_info "Checking prerequisites..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install it first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker not found. Please install it first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker not found. Please install it first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon not running. Please start Docker."
        log_error ""
        log_error "To start Docker:"
        log_error "  - On macOS: Open Docker Desktop application"
        log_error "  - On Linux: Run 'sudo systemctl start docker' or 'sudo service docker start'"
        log_error "  - You may need to add your user to the docker group: 'sudo usermod -aG docker \$USER'"
        exit 1
    fi
    
    if ! command -v pulumi &> /dev/null; then
        log_error "Pulumi CLI not found. Please install it first."
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm not found. Please install it first."
        exit 1
    fi
    
    log_info "All prerequisites satisfied."
}

# Get AWS account info
get_aws_info() {
    log_info "Getting AWS account information..."
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    AWS_REGION=$(aws configure get region || echo "us-east-1")
    
    if [ -z "$AWS_ACCOUNT_ID" ]; then
        log_error "Failed to get AWS account ID. Check your AWS credentials."
        exit 1
    fi
    
    log_info "AWS Account: $AWS_ACCOUNT_ID"
    log_info "AWS Region: $AWS_REGION"
}

# Deploy infrastructure with Pulumi
deploy_infrastructure() {
    log_info "Deploying infrastructure with Pulumi..."
    
    cd "$PROJECT_ROOT/infra"
    
    # Ensure GIT_COMMIT_SHA is set
    if [ -z "$GIT_COMMIT_SHA" ]; then
        GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
        export GIT_COMMIT_SHA="$GIT_SHA"
    fi
    log_info "Deploying with Git SHA: $GIT_COMMIT_SHA"
    
    # Select or create the stack
    pulumi stack select "$ENVIRONMENT" 2>/dev/null || pulumi stack init "$ENVIRONMENT"
    
    # Set the environment config
    pulumi config set environment "$ENVIRONMENT"
    pulumi config set aws:region "$AWS_REGION"
    
    # Deploy
    pulumi up --yes
    
    # Get outputs
    export BACKEND_REPO_URL=$(pulumi stack output backendRepoUrl)
    export FRONTEND_BUCKET=$(pulumi stack output frontendBucketName)
    export FRONTEND_DISTRIBUTION_ID=$(pulumi stack output frontendDistributionId)
    export BACKEND_API_URL=$(pulumi stack output backendApiUrl)
    export FRONTEND_URL=$(pulumi stack output frontendUrl)
    
    log_info "Infrastructure deployed successfully."
    
    cd "$PROJECT_ROOT"
}

# Get infrastructure outputs without deploying
get_infrastructure_outputs() {
    log_info "Getting existing infrastructure outputs..."
    
    cd "$PROJECT_ROOT/infra"
    
    # Get git commit SHA for versioning
    GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    export GIT_COMMIT_SHA="$GIT_SHA"
    log_info "Git commit SHA: $GIT_SHA"
    
    # Check if stack exists
    if ! pulumi stack select "$ENVIRONMENT" 2>/dev/null; then
        log_warn "Stack $ENVIRONMENT does not exist. Will create during deployment."
        cd "$PROJECT_ROOT"
        return 1
    fi
    
    # Try to get outputs
    BACKEND_REPO_URL=$(pulumi stack output backendRepoUrl 2>/dev/null || echo "")
    
    if [ -z "$BACKEND_REPO_URL" ]; then
        log_warn "ECR repository not found. Will create during deployment."
        cd "$PROJECT_ROOT"
        return 1
    fi
    
    export BACKEND_REPO_URL
    log_info "Found existing ECR repository: $BACKEND_REPO_URL"
    
    cd "$PROJECT_ROOT"
    return 0
}

# Build and push backend Docker image
deploy_backend() {
    log_info "Building and deploying backend..."
    
    cd "$PROJECT_ROOT"
    
    # Get git commit SHA for versioning (metadata only, not for change detection)
    GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    export GIT_COMMIT_SHA="$GIT_SHA"
    log_info "Git commit SHA: $GIT_SHA"
    
    # Calculate content hash for backend code (excluding commit SHA)
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
    
    if [ "$IMAGE_EXISTS" != "0" ]; then
        log_info "✓ Image with hash $CONTENT_HASH already exists in ECR. Skipping build."
        log_info "Updating ECS service to use existing image..."
        
        # Still update the task definition to use this image and update GIT_COMMIT_SHA env var
        cd "$PROJECT_ROOT/infra"
        pulumi config set gitCommitSha "$GIT_SHA"
        export GIT_COMMIT_SHA="$GIT_SHA"
        pulumi up --yes --target "urn:pulumi:$ENVIRONMENT::email-client-infra::aws:ecs/taskDefinition:TaskDefinition::email-client-$ENVIRONMENT-backend-task" || true
        
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
            --image-tag "$GIT_SHA" \
            --image-manifest "$MANIFEST" \
            --region "$AWS_REGION" > /dev/null 2>&1 || true
        
        cd "$PROJECT_ROOT"
        log_info "Backend deployment complete (reused existing image)."
        return 0
    fi
    
    log_info "✗ Image not found in ECR. Building new image..."
    
    # Temporarily disable Docker credential helpers to avoid pass/keychain issues
    export DOCKER_CONFIG="${DOCKER_CONFIG:-$HOME/.docker}"
    mkdir -p "$DOCKER_CONFIG"
    
    # Backup existing config if it exists
    if [ -f "$DOCKER_CONFIG/config.json" ]; then
        cp "$DOCKER_CONFIG/config.json" "$DOCKER_CONFIG/config.json.backup"
    fi
    
    # Create a minimal config without credential helpers
    echo '{}' > "$DOCKER_CONFIG/config.json"
    
    # Login to ECR
    log_info "Logging into ECR..."
    aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
    
    # Store ECR registry for cleanup
    ECR_REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
    
    # Build the Docker image
    log_info "Building Docker image..."
    # Use cache for faster builds when possible
    docker build -t stacksmail-backend -f backend/Dockerfile .
    
    # Tag with content hash, latest, and git SHA
    docker tag stacksmail-backend:latest "$BACKEND_REPO_URL:content-$CONTENT_HASH"
    docker tag stacksmail-backend:latest "$BACKEND_REPO_URL:latest"
    docker tag stacksmail-backend:latest "$BACKEND_REPO_URL:$GIT_SHA"
    
    log_info "Pushing Docker image to ECR..."
    docker push "$BACKEND_REPO_URL:content-$CONTENT_HASH"
    docker push "$BACKEND_REPO_URL:latest"
    docker push "$BACKEND_REPO_URL:$GIT_SHA"
    
    # Logout from ECR and restore Docker config
    docker logout "$ECR_REGISTRY" > /dev/null 2>&1 || true
    if [ -f "$DOCKER_CONFIG/config.json.backup" ]; then
        mv "$DOCKER_CONFIG/config.json.backup" "$DOCKER_CONFIG/config.json"
    fi
    
    log_info "Backend deployed successfully (new image built)."
}

# Build and deploy frontend to S3 + CloudFront
deploy_frontend() {
    log_info "Building and deploying frontend..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        pnpm install
    fi
    
    # Build frontend
    log_info "Building frontend..."
    cd frontend
    pnpm run build
    
    # Sync to S3
    log_info "Uploading to S3..."
    aws s3 sync dist/ "s3://$FRONTEND_BUCKET/" \
        --delete \
        --cache-control "public, max-age=31536000, immutable" \
        --exclude "index.html" \
        --exclude "*.json"
    
    # Upload HTML and JSON files with no-cache
    aws s3 cp dist/index.html "s3://$FRONTEND_BUCKET/index.html" \
        --cache-control "no-cache, no-store, must-revalidate"
    
    # Upload any JSON files (manifests, etc.) with correct relative paths
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
    
    cd "$PROJECT_ROOT"
    
    log_info "Frontend deployed successfully."
}

# Wait for ECS service to stabilize
wait_for_backend() {
    log_info "Waiting for backend service to stabilize..."
    
    CLUSTER_NAME="email-client-$ENVIRONMENT-cluster"
    SERVICE_NAME="email-client-$ENVIRONMENT-backend"
    
    # Wait up to 5 minutes for the service to be stable
    MAX_ATTEMPTS=30
    ATTEMPT=0
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        ATTEMPT=$((ATTEMPT + 1))
        
        # Check if service has running tasks
        RUNNING_COUNT=$(aws ecs describe-services \
            --cluster "$CLUSTER_NAME" \
            --services "$SERVICE_NAME" \
            --region "$AWS_REGION" \
            --query 'services[0].runningCount' \
            --output text 2>/dev/null || echo "0")
        
        DESIRED_COUNT=$(aws ecs describe-services \
            --cluster "$CLUSTER_NAME" \
            --services "$SERVICE_NAME" \
            --region "$AWS_REGION" \
            --query 'services[0].desiredCount' \
            --output text 2>/dev/null || echo "1")
        
        if [ "$RUNNING_COUNT" = "$DESIRED_COUNT" ] && [ "$RUNNING_COUNT" != "0" ]; then
            log_info "Backend service is running ($RUNNING_COUNT/$DESIRED_COUNT tasks)"
            
            # Try to hit the health endpoint
            if curl -s -o /dev/null -w "%{http_code}" "${BACKEND_API_URL}/health" | grep -q "200"; then
                log_info "Backend health check passed!"
                return 0
            fi
        fi
        
        log_info "Waiting for backend... (attempt $ATTEMPT/$MAX_ATTEMPTS, running: $RUNNING_COUNT/$DESIRED_COUNT)"
        sleep 10
    done
    
    log_warn "Backend service did not stabilize within timeout. Check ECS logs for issues."
    log_warn "You can view logs at: https://${AWS_REGION}.console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#logsV2:log-groups/log-group/\$252Fecs\$252Femail-client-${ENVIRONMENT}\$252Fbackend"
}

# Main deployment flow
main() {
    check_prereqs
    get_aws_info
    
    # Try to get existing infrastructure outputs (ECR repo URL)
    if get_infrastructure_outputs; then
        # Infrastructure exists, build and push image first
        log_info "Building and pushing Docker image before infrastructure update..."
        deploy_backend
        
        # Now update infrastructure (will use the new image)
        deploy_infrastructure
    else
        # First time deploy: create infrastructure first (including ECR repo)
        log_info "First deployment: creating infrastructure first..."
        deploy_infrastructure
        
        # Now build and push the image
        deploy_backend
        
        # Force ECS service to redeploy with the new image
        log_info "Forcing ECS service to use the new image..."
        aws ecs update-service \
            --cluster "email-client-$ENVIRONMENT-cluster" \
            --service "email-client-$ENVIRONMENT-backend" \
            --force-new-deployment \
            --region "$AWS_REGION" \
            > /dev/null 2>&1 || log_warn "Could not force ECS service update (service may not exist yet)"
    fi
    
    # Deploy frontend
    deploy_frontend
    
    # Wait for backend to be healthy
    wait_for_backend
    
    echo ""
    echo "=============================================="
    echo "  Deployment Complete!"
    echo "=============================================="
    echo ""
    echo "  Frontend URL: $FRONTEND_URL"
    echo "  Backend API:  $BACKEND_API_URL"
    echo ""
    echo "  Note: CloudFront may take a few minutes to"
    echo "  propagate. If you see errors, wait and retry."
    echo "=============================================="
}

main
