#!/bin/bash
# Manual script to start/diagnose the backend container on EC2
# Run this after deployment when the Docker image is ready

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh" 2>/dev/null || {
    log_info() { echo "[INFO] $1"; }
    log_warn() { echo "[WARN] $1"; }
    log_error() { echo "[ERROR] $1"; }
}

EC2_IP="${1:-}"
ACTION="${2:-start}"  # start, diagnose, logs

if [ -z "$EC2_IP" ]; then
    # Try to get from Pulumi
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    cd "$PROJECT_ROOT/infra" 2>/dev/null || true
    EC2_IP=$(pulumi stack output backendPublicIp 2>/dev/null || echo "")
    cd - >/dev/null 2>/dev/null || true
    
    if [ -z "$EC2_IP" ]; then
        echo "Usage: ./scripts/start-ec2-container.sh <EC2_IP> [action]"
        echo ""
        echo "Actions:"
        echo "  start     - Start/restart the backend container (default)"
        echo "  diagnose  - Check EC2 status without making changes"
        echo "  logs      - View container logs"
        echo ""
        echo "Get EC2 IP with: cd infra && pulumi stack output backendPublicIp"
        exit 1
    fi
fi

log_info "EC2 Instance: $EC2_IP"
log_info "Action: $ACTION"
echo ""

case "$ACTION" in
    diagnose)
        log_info "Running diagnostics on EC2..."
        ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ec2-user@"$EC2_IP" << 'ENDSSH'
#!/bin/bash
echo "=== System Info ==="
uname -a
echo ""

echo "=== Docker Status ==="
systemctl is-active docker || echo "Docker NOT running!"
docker --version || echo "Docker NOT installed!"
echo ""

echo "=== SSM Agent Status ==="
systemctl is-active amazon-ssm-agent || echo "SSM Agent NOT running!"
echo ""

echo "=== Container Status ==="
docker ps -a 2>/dev/null || echo "Cannot list containers"
echo ""

echo "=== User Data Log (last 50 lines) ==="
sudo tail -50 /var/log/user-data.log 2>/dev/null || sudo tail -50 /var/log/cloud-init-output.log 2>/dev/null || echo "No user-data log found"
echo ""

echo "=== Update Script ==="
if [ -f ~/update-backend.sh ]; then
    echo "✓ update-backend.sh exists"
    head -5 ~/update-backend.sh
else
    echo "✗ update-backend.sh NOT found!"
fi
echo ""

echo "=== Network Test ==="
curl -s -o /dev/null -w "Health check: %{http_code}\n" http://localhost:4000/api/health 2>/dev/null || echo "Health check failed"
ENDSSH
        ;;
    
    logs)
        log_info "Fetching container logs..."
        ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ec2-user@"$EC2_IP" << 'ENDSSH'
#!/bin/bash
echo "=== Container Status ==="
docker ps -a
echo ""
echo "=== Container Logs (last 100 lines) ==="
docker logs backend --tail 100 2>&1 || echo "No container named 'backend' found"
ENDSSH
        ;;
    
    start|*)
        log_info "Starting/restarting backend container..."
        ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ec2-user@"$EC2_IP" << 'ENDSSH'
#!/bin/bash
set -e

echo "[$(date)] Starting backend update..."

if [ -f ~/update-backend.sh ]; then
    echo "Running update-backend.sh..."
    ~/update-backend.sh
else
    echo "ERROR: update-backend.sh not found!"
    echo ""
    echo "The EC2 user data may not have run correctly."
    echo ""
    echo "=== User Data Log ==="
    sudo cat /var/log/user-data.log 2>/dev/null | tail -50 || sudo cat /var/log/cloud-init-output.log 2>/dev/null | tail -50 || echo "No logs found"
    exit 1
fi

echo ""
echo "=== Container Status ==="
docker ps -a
echo ""
echo "=== Health Check ==="
sleep 5
curl -s http://localhost:4000/api/health && echo "" || echo "Health check failed!"
ENDSSH
        ;;
esac

echo ""
echo "=============================================="
log_info "Done!"
echo "=============================================="
echo ""
echo "Test the backend directly:"
echo "  curl http://$EC2_IP/api/health"
echo ""
