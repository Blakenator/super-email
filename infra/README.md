# Email Client Infrastructure

This package contains the Infrastructure as Code (IaC) for deploying the Email Client application to AWS using [Pulumi](https://www.pulumi.com/).

## Architecture

The infrastructure includes:

- **VPC** with public and private subnets across 2 availability zones
- **RDS PostgreSQL** database in private subnets
- **ECS Fargate** cluster running:
  - Backend API service (Node.js/Express/GraphQL)
  - Frontend service (React/Vite served via Nginx)
- **Application Load Balancer** for routing traffic
- **ECR** repositories for Docker images
- **CloudWatch** log groups for container logs

## Prerequisites

1. Install [Pulumi CLI](https://www.pulumi.com/docs/install/)
2. Install [AWS CLI](https://aws.amazon.com/cli/) and configure credentials
3. Install Node.js 20+

## Setup

```bash
# Install dependencies
pnpm install

# Login to Pulumi (use local state for development)
pulumi login --local

# Create a new stack
pulumi stack init dev
```

## Configuration

Set the required configuration values:

```bash
# Set AWS region
pulumi config set aws:region us-east-1

# Set environment
pulumi config set email-client-infra:environment dev

# Optionally customize DB instance class
pulumi config set email-client-infra:dbInstanceClass db.t3.micro
```

## Deploy

```bash
# Preview changes
pnpm run preview

# Deploy infrastructure
pnpm run up
```

## Destroy

```bash
# Tear down all resources
pnpm run destroy
```

## Outputs

After deployment, you'll get:

- `albUrl` - The Application Load Balancer URL
- `backendRepoUrl` - ECR repository URL for backend images
- `frontendRepoUrl` - ECR repository URL for frontend images
- `databaseEndpoint` - RDS PostgreSQL endpoint

## Building and Pushing Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
cd ../backend
docker build -t email-client-backend .
docker tag email-client-backend:latest <backend-repo-url>:latest
docker push <backend-repo-url>:latest

# Build and push frontend
cd ../frontend
docker build -t email-client-frontend .
docker tag email-client-frontend:latest <frontend-repo-url>:latest
docker push <frontend-repo-url>:latest
```

## Environment-Specific Configuration

- **dev**: Single instance, no deletion protection, minimal backups
- **prod**: Multi-AZ RDS, deletion protection, 7-day backups, 2 ECS tasks per service
