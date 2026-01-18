# Mixed Content (HTTP/HTTPS) Issue

## Problem
Frontend is served over HTTPS (CloudFront) but tries to call backend over HTTP (ALB).
Browsers block mixed content for security.

## Solutions

### Option 1: Add HTTPS to ALB (Recommended for Production)
Requires an SSL certificate from AWS Certificate Manager.

**Steps:**
1. Request/import SSL certificate in ACM
2. Add HTTPS listener (port 443) to ALB
3. Update Pulumi to use HTTPS listener
4. Update backendApiUrl output to use `https://`

### Option 2: Use CloudFront as Proxy (Quick Fix)
Configure CloudFront to proxy `/api/*` requests to the backend ALB.

**Pros:** No SSL cert needed, CloudFront handles HTTPS
**Cons:** Adds latency, more complex routing

### Option 3: Disable Mixed Content (Dev Only - NOT for Production)
For local testing only - not secure!

## Current Workaround
The backend ALB currently only has HTTP listener. Frontend config now supports both
but will fail in production due to mixed content blocking.

## Implementation Needed
See `infra/index.ts` - need to add:
- SSL certificate resource
- HTTPS listener on ALB
- Update security groups for port 443
