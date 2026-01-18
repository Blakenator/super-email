# Deployment Issue Fixes

## Issues Addressed

### 1. ECS Tasks Not Running (Targets Draining)
**Root Causes:**
- Tasks might be failing health checks
- Missing Supabase environment variables
- Need more time for initial health check

**Fixes Applied:**
- Added `healthCheckGracePeriodSeconds: 60` to give tasks time to connect to DB
- Added explicit dependency on VPC endpoints and database
- Added Supabase environment variables (URL, ANON_KEY, SERVICE_ROLE_KEY)
- Added `LOG_LEVEL: 'info'` for better debugging

**Next Steps:**
1. Run `./scripts/check-deployment.sh prod` to diagnose current state
2. Check CloudWatch logs: `/ecs/email-client-prod/backend`
3. Look for:
   - Database connection errors
   - ECR image pull errors  
   - Application startup errors
   - Health check failures

### 2. Frontend Access Denied (S3/CloudFront)
**Root Cause:**
- S3 bucket had `blockPublicPolicy: true` and `restrictPublicBuckets: true`
- This prevents even the CloudFront service principal from accessing via bucket policy

**Fix Applied:**
```typescript
blockPublicPolicy: false,  // Allow bucket policy for CloudFront
restrictPublicBuckets: false, // Allow service principal access
```

**Security Note:**
- The bucket is still NOT publicly accessible
- Only CloudFront can access it via the bucket policy
- The policy restricts access to the specific CloudFront distribution ARN

### 3. ECS Service Deployment Dependencies
**Fix Applied:**
- Added explicit `dependsOn` to ensure VPC endpoints and database are ready before ECS service starts
- This prevents tasks from failing due to missing infrastructure

## Deployment Commands

### Redeploy Infrastructure
```bash
cd infra
pulumi up --yes
```

### Force New ECS Deployment (if tasks are stuck)
```bash
aws ecs update-service \
  --cluster email-client-prod-cluster \
  --service email-client-prod-backend \
  --force-new-deployment \
  --region us-west-1
```

### Check Deployment Status
```bash
./scripts/check-deployment.sh prod
```

### View Real-Time Logs
```bash
aws logs tail "/ecs/email-client-prod/backend" \
  --follow \
  --region us-west-1
```

### Check CloudFront Distribution Status
```bash
aws cloudfront list-distributions \
  --query "DistributionList.Items[?contains(Origins.Items[0].DomainName, 'email-client-prod-frontend')]" \
  --output table
```

## Verification Checklist

After redeploying, verify:

### Backend
- [ ] ECS tasks are in RUNNING state
- [ ] Target group health is "healthy" (not draining)
- [ ] ALB endpoint returns 200 from `/health`
- [ ] CloudWatch logs show successful startup
- [ ] No database connection errors

### Frontend  
- [ ] Files are in S3 bucket
- [ ] CloudFront distribution status is "Deployed"
- [ ] CloudFront URL loads the app (may take 5-10 mins for propagation)
- [ ] No Access Denied errors

### Database
- [ ] RDS instance is "available"
- [ ] Security group allows connections from ECS tasks
- [ ] Password is set correctly

## Troubleshooting

### If ECS tasks keep failing:
1. Check task stopped reason:
   ```bash
   aws ecs describe-tasks \
     --cluster email-client-prod-cluster \
     --tasks $(aws ecs list-tasks --cluster email-client-prod-cluster --service-name email-client-prod-backend --desired-status STOPPED --region us-west-1 --query 'taskArns[0]' --output text) \
     --region us-west-1 \
     --query 'tasks[0].{stoppedReason:stoppedReason,containers:containers[*].{reason:reason,exitCode:exitCode}}'
   ```

2. Check logs for the failed task
3. Verify database is reachable from private subnets
4. Check if image exists in ECR

### If CloudFront still shows Access Denied:
1. Wait 5-10 minutes for CloudFront to fully deploy
2. Check bucket policy is applied:
   ```bash
   aws s3api get-bucket-policy --bucket email-client-prod-frontend
   ```
3. Verify OAC is attached to distribution
4. Try invalidating CloudFront cache:
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id <DIST_ID> \
     --paths "/*"
   ```

## Files Changed
- `infra/index.ts` - Added health check grace period, Supabase env vars, fixed S3 public access block
- `scripts/check-deployment.sh` - New diagnostic script
