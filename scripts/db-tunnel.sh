#!/bin/bash
# ============================================================================
# RDS Database Tunnel via SSM Port Forwarding
# ============================================================================
# Opens a local port-forwarding tunnel to the RDS database through a running
# ECS task using AWS SSM Session Manager. This is free and requires no extra
# infrastructure (no bastion host, no public DB access).
#
# Prerequisites:
#   - AWS CLI v2 installed and configured
#   - AWS Session Manager Plugin installed
#     (https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html)
#   - A running ECS task in the target environment
#
# Usage:
#   ./scripts/db-tunnel.sh [env] [local_port]
#   ./scripts/db-tunnel.sh dev        # Tunnel on default port 15432
#   ./scripts/db-tunnel.sh dev 5433   # Tunnel on port 5433
#
# Then connect with:
#   psql -h localhost -p 15432 -U emailclient -d emailclient
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

ENV="${1:-dev}"
LOCAL_PORT="${2:-15432}"
STACK_NAME="email-client-${ENV}"
CLUSTER_NAME="${STACK_NAME}-cluster"
SERVICE_NAME="${STACK_NAME}-backend"

# ---- Preflight checks ----

check_prerequisites() {
    local missing=0

    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Install it from https://aws.amazon.com/cli/"
        missing=1
    fi

    # The .deb package installs to /usr/local/sessionmanagerplugin/bin/ which may not be on PATH
    if ! command -v session-manager-plugin &> /dev/null && \
       [ ! -x /usr/local/sessionmanagerplugin/bin/session-manager-plugin ]; then
        log_error "AWS Session Manager Plugin is not installed."
        log_error "Install it from: https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html"
        log_error "  macOS:   brew install --cask session-manager-plugin"
        log_error "  Ubuntu:  curl \"https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_64bit/session-manager-plugin.deb\" -o /tmp/session-manager-plugin.deb && sudo dpkg -i /tmp/session-manager-plugin.deb"
        missing=1
    elif ! command -v session-manager-plugin &> /dev/null; then
        # Plugin exists but isn't on PATH — add it
        export PATH="$PATH:/usr/local/sessionmanagerplugin/bin"
        log_warn "session-manager-plugin found at /usr/local/sessionmanagerplugin/bin (not on PATH). Added temporarily."
    fi

    if [ $missing -ne 0 ]; then
        exit 1
    fi
}

# ---- Main ----

check_prerequisites

log_info "Finding running ECS task in cluster '${CLUSTER_NAME}'..."

TASK_ARN=$(aws ecs list-tasks \
    --cluster "$CLUSTER_NAME" \
    --service-name "$SERVICE_NAME" \
    --desired-status RUNNING \
    --query 'taskArns[0]' \
    --output text 2>/dev/null)

if [ -z "$TASK_ARN" ] || [ "$TASK_ARN" = "None" ]; then
    log_error "No running tasks found for service '${SERVICE_NAME}' in cluster '${CLUSTER_NAME}'."
    log_error "Make sure the ECS service is running: aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${SERVICE_NAME}"
    exit 1
fi

TASK_ID=$(echo "$TASK_ARN" | awk -F'/' '{print $NF}')
log_info "Found task: ${TASK_ID}"

# Get the runtime ID for the backend container
RUNTIME_ID=$(aws ecs describe-tasks \
    --cluster "$CLUSTER_NAME" \
    --tasks "$TASK_ARN" \
    --query 'tasks[0].containers[?name==`backend`].runtimeId' \
    --output text 2>/dev/null)

if [ -z "$RUNTIME_ID" ] || [ "$RUNTIME_ID" = "None" ]; then
    log_error "Could not get runtime ID for the backend container."
    log_error "Make sure the task is fully running (not PROVISIONING/PENDING)."
    exit 1
fi

log_info "Container runtime ID: ${RUNTIME_ID}"

# Get the RDS endpoint
DB_HOST=$(aws rds describe-db-instances \
    --db-instance-identifier "${STACK_NAME}-postgres" \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text 2>/dev/null)

if [ -z "$DB_HOST" ] || [ "$DB_HOST" = "None" ]; then
    log_error "Could not find RDS instance '${STACK_NAME}-postgres'."
    exit 1
fi

log_info "RDS endpoint: ${DB_HOST}"

# Fetch DB password from Secrets Manager
log_info "Fetching database password from Secrets Manager..."
SECRET_ARN=$(aws secretsmanager list-secrets \
    --filters Key=name,Values="${STACK_NAME}-db-password" \
    --query 'SecretList[0].ARN' \
    --output text 2>/dev/null)

DB_PASSWORD=""
if [ -n "$SECRET_ARN" ] && [ "$SECRET_ARN" != "None" ]; then
    DB_PASSWORD=$(aws secretsmanager get-secret-value \
        --secret-id "$SECRET_ARN" \
        --query 'SecretString' \
        --output text 2>/dev/null || true)
fi

if [ -z "$DB_PASSWORD" ]; then
    log_warn "Could not fetch DB password. You'll need to retrieve it manually."
    DB_PASSWORD="<PASSWORD>"
fi

# Build the SSM target string for ECS
SSM_TARGET="ecs:${CLUSTER_NAME}_${TASK_ID}_${RUNTIME_ID}"

DB_USER="emailclient"
DB_NAME="emailclient"

echo ""
log_info "Starting port-forwarding tunnel..."
echo ""
echo "  Local:    localhost:${LOCAL_PORT}"
echo "  Remote:   ${DB_HOST}:5432"
echo "  Database: ${DB_NAME}"
echo "  Username: ${DB_USER}"
echo ""
echo "  Connect with psql:"
echo "    psql -h localhost -p ${LOCAL_PORT} -U ${DB_USER} -d ${DB_NAME}"
echo ""
echo "  JDBC connection string:"
echo "    jdbc:postgresql://localhost:${LOCAL_PORT}/${DB_NAME}?user=${DB_USER}&password=${DB_PASSWORD}"
echo ""
echo "  Or use any GUI tool (DataGrip, pgAdmin, TablePlus, etc.) with:"
echo "    Host: localhost | Port: ${LOCAL_PORT} | User: ${DB_USER} | Password: ${DB_PASSWORD} | DB: ${DB_NAME}"
echo ""
log_warn "Press Ctrl+C to close the tunnel."
echo ""

aws ssm start-session \
    --target "$SSM_TARGET" \
    --document-name AWS-StartPortForwardingSessionToRemoteHost \
    --parameters "{\"host\":[\"${DB_HOST}\"],\"portNumber\":[\"5432\"],\"localPortNumber\":[\"${LOCAL_PORT}\"]}"
