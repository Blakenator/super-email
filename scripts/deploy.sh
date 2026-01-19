#!/bin/bash
set -e

# ============================================================================
# StacksMail Deploy Script
# ============================================================================
# This script orchestrates the full deployment to AWS.
# 
# Architecture: Cost-optimized for bootstrapped projects
#   - EC2 t4g.micro (ARM): ~$6/month
#   - RDS t4g.micro: ~$13/month
#   - CloudFront CDN: ~$1-5/month
#   - Total: ~$25-35/month
#
# Prerequisites:
#   - AWS CLI configured with appropriate credentials
#   - Docker installed and running
#   - Pulumi CLI installed and logged in
#   - pnpm installed
#   - .env file with required credentials (see .env.template)
#
# Usage:
#   ./scripts/deploy.sh [environment]
#
# Environment defaults to 'prod' if not specified.
# ============================================================================

ENVIRONMENT="${1:-prod}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load common functions
source "$SCRIPT_DIR/common.sh"

# Load environment variables from .env file if it exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    log_info "Loading environment variables from .env file..."
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
else
    log_warn ".env file not found. Using environment variables or defaults."
    log_warn "Create a .env file from .env.template for production deployments."
fi

echo "=============================================="
echo "  StacksMail Deploy - Environment: $ENVIRONMENT"
echo "=============================================="

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
    AWS_REGION="${AWS_REGION:-$(aws configure get region || echo "us-west-1")}"
    export AWS_REGION
    
    if [ -z "$AWS_ACCOUNT_ID" ]; then
        log_error "Failed to get AWS account ID. Check your AWS credentials."
        exit 1
    fi
    
    log_info "AWS Account: $AWS_ACCOUNT_ID"
    log_info "AWS Region: $AWS_REGION"
}

# Deploy infrastructure with Pulumi
deploy_infrastructure() {
    "$SCRIPT_DIR/deploy-infrastructure.sh" "$ENVIRONMENT"
    
    # Load outputs
    if [ -f "$PROJECT_ROOT/.deploy-outputs" ]; then
        source "$PROJECT_ROOT/.deploy-outputs"
    fi
}

# Get infrastructure outputs without deploying
get_infrastructure_outputs() {
    log_info "Getting existing infrastructure outputs..."
    
    cd "$PROJECT_ROOT/infra"
    
    # Check if stack exists
    if ! pulumi stack select "$ENVIRONMENT" 2>/dev/null; then
        log_warn "Stack $ENVIRONMENT does not exist. Will create during deployment."
        cd "$PROJECT_ROOT"
        return 1
    fi
    
    # Try to get outputs
    BACKEND_REPO_URL=$(pulumi stack output backendRepoUrl 2>/dev/null || echo "")
    BACKEND_INSTANCE_ID=$(pulumi stack output backendInstanceId 2>/dev/null || echo "")
    BACKEND_PUBLIC_IP=$(pulumi stack output backendPublicIp 2>/dev/null || echo "")
    FRONTEND_URL=$(pulumi stack output frontendUrl 2>/dev/null || echo "")
    BACKEND_API_URL=$(pulumi stack output backendApiUrl 2>/dev/null || echo "")
    FRONTEND_BUCKET=$(pulumi stack output frontendBucketName 2>/dev/null || echo "")
    FRONTEND_DISTRIBUTION_ID=$(pulumi stack output frontendDistributionId 2>/dev/null || echo "")
    
    export BACKEND_REPO_URL BACKEND_INSTANCE_ID BACKEND_PUBLIC_IP FRONTEND_URL BACKEND_API_URL FRONTEND_BUCKET FRONTEND_DISTRIBUTION_ID
    
    if [ -z "$BACKEND_REPO_URL" ]; then
        log_warn "ECR repository not found. Will create during deployment."
        cd "$PROJECT_ROOT"
        return 1
    fi
    
    log_info "Found existing infrastructure:"
    log_info "  ECR: $BACKEND_REPO_URL"
    log_info "  EC2: $BACKEND_PUBLIC_IP"
    
    cd "$PROJECT_ROOT"
    return 0
}

# Build and push backend Docker image
deploy_backend() {
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
    
    # Call shared deployment script
    "$SCRIPT_DIR/deploy-backend.sh" "$ENVIRONMENT"
    
    # Logout from ECR and restore Docker config
    docker logout "$ECR_REGISTRY" > /dev/null 2>&1 || true
    if [ -f "$DOCKER_CONFIG/config.json.backup" ]; then
        mv "$DOCKER_CONFIG/config.json.backup" "$DOCKER_CONFIG/config.json"
    fi
}

# Build and deploy frontend to S3 + CloudFront
deploy_frontend() {
    # Install dependencies if needed
    if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
        log_info "Installing dependencies..."
        cd "$PROJECT_ROOT"
        pnpm install
    fi
    
    # Call shared deployment script
    "$SCRIPT_DIR/deploy-frontend.sh" "$ENVIRONMENT"
}

# Wait for frontend to be available
wait_for_frontend() {
    log_info "Checking frontend availability..."
    
    MAX_ATTEMPTS=6
    ATTEMPT=0
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        ATTEMPT=$((ATTEMPT + 1))
        
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")
        
        if [ "$HTTP_CODE" = "200" ]; then
            log_info "✓ Frontend is available!"
            return 0
        fi
        
        log_info "Waiting for frontend... (attempt $ATTEMPT/$MAX_ATTEMPTS, status: $HTTP_CODE)"
        sleep 5
    done
    
    log_warn "Frontend not responding. CloudFront may still be propagating."
}

# Wait for backend to be healthy
wait_for_backend() {
    log_info "Checking backend availability..."
    
    # First check if EC2 is responding directly
    if [ -n "$BACKEND_PUBLIC_IP" ]; then
        log_info "Testing EC2 direct connection..."
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://$BACKEND_PUBLIC_IP/api/health" 2>/dev/null || echo "000")
        
        if [ "$HTTP_CODE" != "200" ]; then
            log_warn "EC2 backend not responding on http://$BACKEND_PUBLIC_IP/api/health"
            log_warn "Container may not be running. Starting container..."
            log_warn ""
            log_warn "Run this command to start the container:"
            log_warn "  ./scripts/start-ec2-container.sh $BACKEND_PUBLIC_IP"
            log_warn ""
            log_warn "Or SSH to the instance and check:"
            log_warn "  ssh ec2-user@$BACKEND_PUBLIC_IP"
            log_warn "  docker ps -a"
            log_warn "  docker logs backend"
            return 1
        else
            log_info "✓ EC2 backend is responding directly"
        fi
    fi
    
    # Now check via CloudFront
    log_info "Testing CloudFront proxy..."
    MAX_ATTEMPTS=6
    ATTEMPT=0
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        ATTEMPT=$((ATTEMPT + 1))
        
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_API_URL}/api/health" 2>/dev/null || echo "000")
        
        if [ "$HTTP_CODE" = "200" ]; then
            log_info "✓ Backend health check passed via CloudFront!"
            return 0
        fi
        
        log_info "Waiting for CloudFront... (attempt $ATTEMPT/$MAX_ATTEMPTS, status: $HTTP_CODE)"
        sleep 10
    done
    
    log_warn "Backend not accessible via CloudFront."
    log_warn "CloudFront may still be propagating, or there may be a routing issue."
}

# Main deployment flow
main() {
    check_prereqs
    get_aws_info
    
    # Try to get existing infrastructure outputs
    if get_infrastructure_outputs; then
        # Infrastructure exists, build and push image first
        log_info "Updating existing deployment..."
        deploy_backend
        
        # Update infrastructure (in case of config changes)
        deploy_infrastructure
    else
        # First time deploy: create infrastructure first (including ECR repo)
        log_info "First deployment: creating infrastructure first..."
        deploy_infrastructure
        
        # Now build and push the image
        deploy_backend
    fi
    
    # Deploy frontend
    deploy_frontend
    
    echo ""
    echo "=============================================="
    echo "  Running Health Checks"
    echo "=============================================="
    
    # Check frontend availability
    wait_for_frontend
    
    # Check backend availability
    wait_for_backend
    
    echo ""
    echo "=============================================="
    echo "  Deployment Complete!"
    echo "=============================================="
    echo ""
    echo "  Frontend URL: $FRONTEND_URL"
    echo "  Backend API:  $BACKEND_API_URL"
    if [ -n "$BACKEND_PUBLIC_IP" ]; then
        echo "  EC2 IP:       $BACKEND_PUBLIC_IP"
        echo ""
        echo "  Manual Container Start:"
        echo "    ./scripts/start-ec2-container.sh $BACKEND_PUBLIC_IP"
    fi
    echo ""
    echo "  Note: CloudFront may take a few minutes to"
    echo "  propagate. If you see errors, wait and retry."
    echo "=============================================="
}

main
