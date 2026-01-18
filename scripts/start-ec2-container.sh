#!/bin/bash
# Manual script to start the backend container on EC2
# Run this after first deployment when the Docker image is ready

set -e

EC2_IP="${1:-}"
if [ -z "$EC2_IP" ]; then
    echo "Usage: ./scripts/start-ec2-container.sh <EC2_IP>"
    echo ""
    echo "Get EC2 IP with: cd infra && pulumi stack output backendPublicIp"
    exit 1
fi

echo "Starting backend container on EC2 instance: $EC2_IP"
echo ""
echo "This will SSH to the instance and run the update-backend.sh script"
echo "Make sure you have SSH access configured!"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

ssh ec2-user@"$EC2_IP" << 'ENDSSH'
#!/bin/bash
set -e

echo "Checking if update-backend.sh exists..."
if [ -f ~/update-backend.sh ]; then
    echo "Running update-backend.sh..."
    ~/update-backend.sh
else
    echo "ERROR: update-backend.sh not found!"
    echo "The EC2 user data may not have run yet."
    echo ""
    echo "Check system logs:"
    echo "  sudo cat /var/log/cloud-init-output.log"
    exit 1
fi

echo ""
echo "Checking container status..."
docker ps -a

echo ""
echo "Recent container logs:"
docker logs backend --tail 50

echo ""
echo "✅ Container started successfully!"
ENDSSH

echo ""
echo "=============================================="
echo "  Container Started!"
echo "=============================================="
echo ""
echo "Test the backend:"
echo "  curl http://$EC2_IP/health"
echo ""
