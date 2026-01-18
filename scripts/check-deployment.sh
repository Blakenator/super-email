#!/bin/bash
ENVIRONMENT="${1:-prod}"
REGION=$(aws configure get region || echo "us-west-1")

echo "=== ECS Service Status ==="
aws ecs describe-services \
  --cluster "email-client-$ENVIRONMENT-cluster" \
  --services "email-client-$ENVIRONMENT-backend" \
  --region "$REGION" \
  --query 'services[0].{desiredCount:desiredCount,runningCount:runningCount,status:status,deployments:deployments[*].{status:status,desiredCount:desiredCount,runningCount:runningCount,failedTasks:failedTasks}}' \
  --output json

echo ""
echo "=== ECS Tasks ==="
aws ecs list-tasks \
  --cluster "email-client-$ENVIRONMENT-cluster" \
  --service-name "email-client-$ENVIRONMENT-backend" \
  --region "$REGION" \
  --output json

echo ""
echo "=== Recent Task Failures ==="
TASK_ARNS=$(aws ecs list-tasks \
  --cluster "email-client-$ENVIRONMENT-cluster" \
  --service-name "email-client-$ENVIRONMENT-backend" \
  --desired-status STOPPED \
  --region "$REGION" \
  --query 'taskArns[0:3]' \
  --output text)

if [ -n "$TASK_ARNS" ]; then
  aws ecs describe-tasks \
    --cluster "email-client-$ENVIRONMENT-cluster" \
    --tasks $TASK_ARNS \
    --region "$REGION" \
    --query 'tasks[*].{taskArn:taskArn,lastStatus:lastStatus,stoppedReason:stoppedReason,containers:containers[*].{name:name,exitCode:exitCode,reason:reason}}' \
    --output json
fi

echo ""
echo "=== Target Group Health ==="
TG_ARN=$(aws elbv2 describe-target-groups \
  --names "email-client-$ENVIRONMENT-backend-tg" \
  --region "$REGION" \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)
aws elbv2 describe-target-health \
  --target-group-arn "$TG_ARN" \
  --region "$REGION" \
  --output json

echo ""
echo "=== CloudFront Distribution ==="
DIST_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?contains(Origins.Items[0].DomainName, 'email-client-$ENVIRONMENT-frontend')].Id" \
  --output text)
echo "Distribution ID: $DIST_ID"
aws cloudfront get-distribution --id "$DIST_ID" \
  --query 'Distribution.{Status:Status,DomainName:DomainName,Enabled:Enabled,OriginAccessControl:Origins.Items[0].OriginAccessControlId}' \
  --output json 2>/dev/null

echo ""
echo "=== S3 Bucket Policy ==="
aws s3api get-bucket-policy \
  --bucket "email-client-$ENVIRONMENT-frontend" \
  --query 'Policy' \
  --output text 2>/dev/null | jq . 2>/dev/null || echo "No bucket policy found"

echo ""
echo "=== S3 Public Access Block ==="
aws s3api get-public-access-block \
  --bucket "email-client-$ENVIRONMENT-frontend" \
  --output json 2>/dev/null

echo ""
echo "=== CloudWatch Logs (Last 20 lines) ==="
aws logs tail "/ecs/email-client-$ENVIRONMENT/backend" \
  --since 10m \
  --format short \
  --region "$REGION" 2>/dev/null | tail -20 || echo "No recent logs found"
