#!/bin/bash
set -e

# ============================================================================
# SuperMail Deploy Script
# ============================================================================
# This script orchestrates the full deployment to AWS by calling shared
# deployment scripts that are also used by GitHub Actions.
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
# Environment defaults to 'dev' if not specified.
# ============================================================================

ENVIRONMENT="${1:-dev}"
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
echo "  SuperMail Deploy - Environment: $ENVIRONMENT"
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
            if curl -s -o /dev/null -w "%{http_code}" "${BACKEND_API_URL}/api/health" | grep -q "200"; then
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
    echo "  Version Info:"
    echo "    Git SHA: $GIT_COMMIT_SHA"
    echo ""
    echo "  Useful Commands:"
    echo "    View logs: ./scripts/view-logs.sh --tail"
    echo ""
    echo "  Note: CloudFront may take a few minutes to"
    echo "  propagate. If you see errors, wait and retry."
    echo "=============================================="
}

main
