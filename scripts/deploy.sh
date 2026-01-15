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
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon not running. Please start Docker."
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
    
    # Select or create the stack
    pulumi stack select "$ENVIRONMENT" 2>/dev/null || pulumi stack init "$ENVIRONMENT"
    
    # Set the environment config
    pulumi config set environment "$ENVIRONMENT"
    pulumi config set aws:region "$AWS_REGION"
    
    # Deploy
    pulumi up --yes
    
    # Get outputs
    BACKEND_REPO_URL=$(pulumi stack output backendRepoUrl)
    FRONTEND_BUCKET=$(pulumi stack output frontendBucketName)
    FRONTEND_DISTRIBUTION_ID=$(pulumi stack output frontendDistributionId)
    BACKEND_API_URL=$(pulumi stack output backendApiUrl)
    FRONTEND_URL=$(pulumi stack output frontendUrl)
    
    log_info "Infrastructure deployed successfully."
    
    cd "$PROJECT_ROOT"
}

# Build and push backend Docker image
deploy_backend() {
    log_info "Building and deploying backend..."
    
    cd "$PROJECT_ROOT"
    
    # Login to ECR
    aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
    
    # Build the Docker image
    log_info "Building Docker image..."
    docker build -t stacksmail-backend -f backend/Dockerfile .
    
    # Tag and push
    docker tag stacksmail-backend:latest "$BACKEND_REPO_URL:latest"
    docker tag stacksmail-backend:latest "$BACKEND_REPO_URL:$(git rev-parse --short HEAD)"
    
    log_info "Pushing Docker image to ECR..."
    docker push "$BACKEND_REPO_URL:latest"
    docker push "$BACKEND_REPO_URL:$(git rev-parse --short HEAD)"
    
    # Force new deployment of ECS service
    log_info "Updating ECS service..."
    CLUSTER_NAME="email-client-$ENVIRONMENT-cluster"
    SERVICE_NAME="email-client-$ENVIRONMENT-backend"
    
    aws ecs update-service \
        --cluster "$CLUSTER_NAME" \
        --service "$SERVICE_NAME" \
        --force-new-deployment \
        --region "$AWS_REGION" \
        > /dev/null
    
    log_info "Backend deployed successfully."
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
    
    # Upload any JSON files (manifests, etc.)
    find dist -name "*.json" -exec aws s3 cp {} "s3://$FRONTEND_BUCKET/{}" \
        --cache-control "no-cache" \; 2>/dev/null || true
    
    # Invalidate CloudFront cache
    log_info "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id "$FRONTEND_DISTRIBUTION_ID" \
        --paths "/*" \
        > /dev/null
    
    cd "$PROJECT_ROOT"
    
    log_info "Frontend deployed successfully."
}

# Main deployment flow
main() {
    check_prereqs
    get_aws_info
    deploy_infrastructure
    deploy_backend
    deploy_frontend
    
    echo ""
    echo "=============================================="
    echo "  Deployment Complete!"
    echo "=============================================="
    echo ""
    echo "  Frontend URL: $FRONTEND_URL"
    echo "  Backend API:  $BACKEND_API_URL"
    echo ""
    echo "  Note: It may take a few minutes for the ECS"
    echo "  service to fully deploy the new containers."
    echo "=============================================="
}

main
