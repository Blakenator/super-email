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

# Parse arguments
TAIL_LOGS=false
SINCE="1h"  # Default to last hour

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
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --tail, -t         Follow logs in real-time"
            echo "  --since, -s DURATION  Show logs from the last DURATION (default: 1h)"
            echo "                     Examples: 30m, 1h, 2d, 1w"
            echo "  --help, -h         Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                     # Show last hour of logs"
            echo "  $0 --since 30m         # Show last 30 minutes"
            echo "  $0 --tail              # Follow logs in real-time"
            echo "  $0 --since 2h --tail   # Show last 2 hours then follow"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Get log group name from Pulumi
cd "$PROJECT_ROOT/infra"
LOG_GROUP=$(pulumi stack output backendLogGroupName 2>/dev/null || echo "")
AWS_REGION=$(pulumi config get aws:region 2>/dev/null || echo "us-west-1")
cd "$PROJECT_ROOT"

if [ -z "$LOG_GROUP" ]; then
    log_error "Could not get log group name from Pulumi outputs."
    log_error "Make sure infrastructure is deployed: cd infra && pulumi up"
    exit 1
fi

log_info "Log Group: $LOG_GROUP"
log_info "Region: $AWS_REGION"
log_info "Since: $SINCE"
echo ""

# Convert duration to timestamp
case $SINCE in
    *m)
        MINUTES="${SINCE%m}"
        START_TIME=$(($(date +%s) - MINUTES * 60))000
        ;;
    *h)
        HOURS="${SINCE%h}"
        START_TIME=$(($(date +%s) - HOURS * 3600))000
        ;;
    *d)
        DAYS="${SINCE%d}"
        START_TIME=$(($(date +%s) - DAYS * 86400))000
        ;;
    *w)
        WEEKS="${SINCE%w}"
        START_TIME=$(($(date +%s) - WEEKS * 604800))000
        ;;
    *)
        # Default to 1 hour
        START_TIME=$(($(date +%s) - 3600))000
        ;;
esac

if [ "$TAIL_LOGS" = true ]; then
    log_info "Following logs (Ctrl+C to stop)..."
    echo ""
    aws logs tail "$LOG_GROUP" \
        --region "$AWS_REGION" \
        --follow \
        --since "$SINCE"
else
    log_info "Fetching logs..."
    echo ""
    aws logs filter-log-events \
        --log-group-name "$LOG_GROUP" \
        --region "$AWS_REGION" \
        --start-time "$START_TIME" \
        --query 'events[*].[timestamp,message]' \
        --output text | while read -r timestamp message; do
            # Convert timestamp to human-readable
            if [ -n "$timestamp" ]; then
                date_str=$(date -r $((timestamp / 1000)) '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -d @$((timestamp / 1000)) '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "$timestamp")
                echo "[$date_str] $message"
            fi
        done
fi
