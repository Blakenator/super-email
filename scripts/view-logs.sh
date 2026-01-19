#!/bin/bash
# View backend logs from CloudWatch
# Usage: ./scripts/view-logs.sh [--tail] [--since DURATION]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh" 2>/dev/null || {
    log_info() { echo "[INFO] $1"; }
    log_warn() { echo "[WARN] $1"; }
    log_error() { echo "[ERROR] $1"; }
}

PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${ENVIRONMENT:-dev}"

# Parse arguments
TAIL_LOGS=false
SINCE="1h"

while [[ $# -gt 0 ]]; do
    case $1 in
        --tail|-t)
            TAIL_LOGS=true
            shift
            ;;
        --since|-s)
            SINCE="$2"
            shift 2
            ;;
        --env|-e)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --tail, -t         Follow logs in real-time"
            echo "  --since, -s DURATION  Show logs from the last DURATION (default: 1h)"
            echo "                     Examples: 30m, 1h, 2d, 1w"
            echo "  --env, -e ENV      Environment (default: dev)"
            echo "  --help, -h         Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                     # Show last hour of logs"
            echo "  $0 --since 30m         # Show last 30 minutes"
            echo "  $0 --tail              # Follow logs in real-time"
            echo "  $0 --env prod --tail   # Follow prod logs"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Get log group name
LOG_GROUP="/ecs/email-client-${ENVIRONMENT}/backend"
AWS_REGION="${AWS_REGION:-$(aws configure get region 2>/dev/null || echo "us-west-1")}"

log_info "Log Group: $LOG_GROUP"
log_info "Region: $AWS_REGION"
log_info "Since: $SINCE"
echo ""

if [ "$TAIL_LOGS" = true ]; then
    log_info "Following logs (Ctrl+C to stop)..."
    echo ""
    aws logs tail "$LOG_GROUP" \
        --region "$AWS_REGION" \
        --follow \
        --since "$SINCE" \
        --format short
else
    log_info "Fetching logs..."
    echo ""
    aws logs tail "$LOG_GROUP" \
        --region "$AWS_REGION" \
        --since "$SINCE" \
        --format short
fi
