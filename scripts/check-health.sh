#!/bin/bash
# Diagnostic script to check deployment health

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT/infra"

# Get outputs
FRONTEND_URL=$(pulumi stack output frontendUrl 2>/dev/null)
BACKEND_API_URL=$(pulumi stack output backendApiUrl 2>/dev/null)
BACKEND_PUBLIC_IP=$(pulumi stack output backendPublicIp 2>/dev/null)
CLOUDFRONT_DOMAIN=$(pulumi stack output cloudfrontDomain 2>/dev/null)

echo "=============================================="
echo "  Deployment Health Check"
echo "=============================================="
echo ""

# Check frontend
echo "1. Frontend (S3 via CloudFront):"
echo "   URL: $FRONTEND_URL"
FRONTEND_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")
if [ "$FRONTEND_CODE" = "200" ]; then
    echo "   Status: ✓ OK ($FRONTEND_CODE)"
else
    echo "   Status: ✗ FAIL ($FRONTEND_CODE)"
fi
echo ""

# Check EC2 direct
if [ -n "$BACKEND_PUBLIC_IP" ]; then
    echo "2. Backend (EC2 Direct):"
    echo "   URL: http://$BACKEND_PUBLIC_IP/api/health"
    EC2_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 5 "http://$BACKEND_PUBLIC_IP/api/health" 2>/dev/null || echo "000")
    if [ "$EC2_CODE" = "200" ]; then
        echo "   Status: ✓ OK ($EC2_CODE)"
    else
        echo "   Status: ✗ FAIL ($EC2_CODE) - Container may not be running"
        echo "   Fix: ./scripts/start-ec2-container.sh $BACKEND_PUBLIC_IP"
    fi
    echo ""
fi

# Check backend via CloudFront
echo "3. Backend (via CloudFront /api/*):"
echo "   URL: ${BACKEND_API_URL}/api/health"
CF_CODE=$(curl -s -o /tmp/cf-response.txt -w "%{http_code}" "${BACKEND_API_URL}/api/health" 2>/dev/null || echo "000")
if [ "$CF_CODE" = "200" ]; then
    echo "   Status: ✓ OK ($CF_CODE)"
else
    echo "   Status: ✗ FAIL ($CF_CODE)"
    echo "   Response:"
    cat /tmp/cf-response.txt | head -10
    echo ""
    echo "   Possible issues:"
    echo "   - CloudFront still propagating (wait 5-10 minutes)"
    echo "   - CloudFront routing to wrong origin (check distribution config)"
    echo "   - EC2 not responding (check #2 above)"
fi
echo ""

echo "=============================================="
echo "  CloudFront Distribution"
echo "=============================================="
echo "  Domain: $CLOUDFRONT_DOMAIN"
echo "  Check origins and behaviors in AWS Console:"
echo "  https://console.aws.amazon.com/cloudfront/v4/home"
echo ""

rm -f /tmp/cf-response.txt
