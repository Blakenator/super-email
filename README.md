# StacksMail - Self-Hosted Email Client

A modern, self-hosted email client built with React, Node.js, and PostgreSQL. Supports multiple IMAP/POP email accounts and SMTP profiles for sending.

## Features

- 📧 **Multi-Account Support**: Configure multiple IMAP/POP email accounts per user
- 📤 **Multiple SMTP Profiles**: Send emails from different accounts/identities
- 📥 **Inbox Management**: View, read, star, and organize your emails
- ✏️ **Compose & Reply**: Write new emails and reply to received messages
- 🔐 **Authentication**: User signup and login via Supabase Auth
- 🎨 **Modern UI**: Clean, responsive interface built with React Bootstrap
- 📎 **Attachments**: Full attachment support with S3 storage in production
- 🔒 **Secure Credentials**: IMAP/SMTP passwords stored in AWS Secrets Manager

## Tech Stack

### Backend
- **Node.js** with Express
- **TypeScript**
- **Apollo GraphQL** Server
- **Sequelize** ORM with PostgreSQL
- **Nodemailer** for SMTP sending
- **AWS S3** for attachment storage
- **AWS Secrets Manager** for credential storage

### Frontend
- **React 19** with Vite
- **TypeScript**
- **Apollo Client** for GraphQL
- **React Bootstrap** for UI components
- **Styled Components** for custom styling
- **React Router** for navigation

### Infrastructure
- **AWS ECS Fargate** for backend containers
- **AWS S3 + CloudFront** for frontend hosting
- **AWS RDS PostgreSQL** for database
- **AWS Secrets Manager** for secure credential storage
- **Pulumi** for Infrastructure as Code

### Database
- **PostgreSQL 15** (Docker locally, RDS in production)

## Project Structure

```
email/
├── backend/               # Express + Apollo GraphQL backend
│   ├── config/           # Centralized configuration
│   ├── db/
│   │   └── models/       # Sequelize models
│   ├── mutations/        # GraphQL mutations
│   ├── queries/          # GraphQL queries
│   ├── helpers/          # Utility functions
│   ├── Dockerfile        # Backend container definition
│   └── index.ts          # Server entry point
├── frontend/             # React + Vite frontend
│   └── src/
│       ├── pages/        # Page components
│       ├── contexts/     # React contexts
│       └── __generated__/ # Generated GraphQL types
├── common/               # Shared schema and types
│   └── schema.graphql    # GraphQL schema
├── infra/                # Pulumi infrastructure code
│   └── index.ts          # AWS infrastructure definition
├── scripts/
│   └── deploy.sh         # Deployment script
├── .github/
│   └── workflows/
│       └── deploy.yml    # GitHub Actions deployment workflow
└── docker-compose.yml    # Local PostgreSQL container

```

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 10+
- Docker (for PostgreSQL)

### Setup

1. **Start the database:**
   ```bash
   docker-compose up -d
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Generate GraphQL types:**
   ```bash
   cd common && pnpm run generate
   ```

4. **Start the development servers:**
   ```bash
   pnpm start
   ```

   This starts:
   - Backend API at `http://localhost:4000/api/graphql`
   - Frontend at `http://localhost:5173`

### Local Configuration

The backend uses a centralized configuration in `backend/config/env.ts`. Default values work for local development:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `4000` | Backend server port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5433` | PostgreSQL port |
| `DB_NAME` | `email_client` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `password` | Database password |

### Local Secrets Storage

In development, IMAP/SMTP credentials are stored in `data/secrets.json` (gitignored). In production, AWS Secrets Manager is used.

## Deployment to AWS

### Prerequisites

1. **AWS CLI** - Configured with appropriate credentials
2. **Docker** - Installed and running
3. **Pulumi CLI** - Installed and logged in (`pulumi login`)
4. **pnpm** - Installed globally
5. **`.env` file** - Required for production deployments (see below)

### Environment Configuration

**IMPORTANT**: Sensitive credentials are no longer hardcoded in the codebase.

1. **Copy the template file:**
   ```bash
   cp .env.template .env
   ```

2. **Fill in your actual values:**
   ```bash
   # .env file
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   AWS_REGION=us-west-1
   ```

3. **Get your Supabase credentials:**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to Settings → API
   - Copy `Project URL`, `anon/public key`, and `service_role key`

4. **NEVER commit `.env` to git:**
   - The `.env` file is automatically ignored by `.gitignore`
   - Keep it secure and never share it publicly

### Required AWS Permissions

The deploying IAM user/role needs permissions for:
- ECR (create repositories, push images)
- ECS (create clusters, services, task definitions)
- EC2 (VPC, security groups, subnets)
- RDS (create instances, subnet groups)
- S3 (create buckets, upload objects)
- CloudFront (create distributions)
- Secrets Manager (create/read/update secrets)
- IAM (create roles and policies)
- CloudWatch (create log groups)

### Environment Variables for Production

These are set automatically by Pulumi in the ECS task definition:

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Set to `production` |
| `DB_HOST` | RDS endpoint |
| `DB_PORT` | RDS port (5432) |
| `DB_NAME` | Database name |
| `DB_USER` | Database username |
| `DB_PASSWORD` | Database password (from Secrets Manager) |
| `ATTACHMENTS_S3_BUCKET` | S3 bucket for attachments |
| `AWS_REGION` | AWS region |
| `SECRETS_BASE_PATH` | Base path for Secrets Manager (`email-client`) |

### Manual Deployment

1. **Deploy using the script:**
   ```bash
   # Deploy to dev environment
   pnpm run deploy:dev
   
   # Deploy to production
   pnpm run deploy:prod
   ```

   Or directly:
   ```bash
   ./scripts/deploy.sh dev
   ```

2. **The script will:**
   - Check prerequisites
   - Deploy/update AWS infrastructure via Pulumi
   - Build and push the backend Docker image to ECR
   - Build the frontend and upload to S3
   - Invalidate the CloudFront cache
   - Force a new ECS deployment

### GitHub Actions Deployment

#### Setup Required Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add:

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key with deployment permissions |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key |
| `AWS_REGION` | AWS region (e.g., `us-west-1`) |
| `PULUMI_ACCESS_TOKEN` | Pulumi access token ([get one here](https://app.pulumi.com/account/tokens)) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |

#### Triggering Deployment

1. **Manual trigger:**
   - Go to Actions → "Deploy to AWS"
   - Click "Run workflow"
   - Select the environment (dev/prod)

2. **Automatic trigger (optional):**
   - Uncomment the `push` trigger in `.github/workflows/deploy.yml`
   - Deployments will run on every merge to `main`

### Pulumi Stack Setup

1. **Login to Pulumi:**
   ```bash
   pulumi login
   ```

2. **Initialize the stack (first time only):**
   ```bash
   cd infra
   pulumi stack init dev
   pulumi config set environment dev
   pulumi config set aws:region us-east-1
   ```

3. **Preview changes:**
   ```bash
   pnpm run infra:preview
   ```

4. **Apply changes:**
   ```bash
   pnpm run infra:up
   ```

### Infrastructure Outputs

After deployment, Pulumi provides these outputs:

| Output | Description |
|--------|-------------|
| `frontendUrl` | CloudFront URL for the frontend |
| `backendApiUrl` | ALB URL for the backend API |
| `frontendBucketName` | S3 bucket name for frontend files |
| `backendRepoUrl` | ECR repository URL for backend images |
| `databaseEndpoint` | RDS PostgreSQL endpoint |

### Cost Considerations

Approximate monthly costs (us-east-1, dev environment):
- **ECS Fargate** (1 task, 0.25 vCPU, 0.5GB): ~$10/month
- **RDS PostgreSQL** (db.t3.micro): ~$15/month
- **ALB**: ~$16/month + data transfer
- **S3 + CloudFront**: < $5/month (typical usage)
- **Secrets Manager**: < $1/month

**Total**: ~$45-50/month for dev environment

For production, consider:
- Larger RDS instance
- Multiple ECS tasks for redundancy
- Reserved capacity for cost savings

## Usage

1. **Sign Up**: Create an account with your email and password
2. **Add Email Accounts**: Go to Settings → Email Accounts to add IMAP/POP accounts
3. **Add SMTP Profiles**: Go to Settings → SMTP Profiles to configure outgoing email
4. **Sync Emails**: Click "Sync" to fetch emails from your configured accounts
5. **Compose**: Click "Compose" to write and send new emails
6. **Reply**: Open any email and click "Reply" to respond

## API

The GraphQL API is available at `/api/graphql`. Key operations include:

### Queries
- `me` - Get current user
- `getEmails(input)` - Fetch emails with filters
- `getEmail(input)` - Get single email details
- `getEmailAccounts` - List configured email accounts
- `getSmtpProfiles` - List SMTP profiles

### Mutations
- `signUp(input)` - Create new account
- `login(input)` - Authenticate user
- `createEmailAccount(input)` - Add IMAP/POP account
- `createSmtpProfile(input)` - Add SMTP profile
- `sendEmail(input)` - Send an email
- `syncEmailAccount(input)` - Sync emails from account

## Development

### Regenerate Types

After modifying `common/schema.graphql`:

```bash
cd common && pnpm run generate
```

### Database Reset

To reset the database:

```bash
docker-compose down -v
docker-compose up -d
```

The database schema is automatically synced on backend startup.

### Type Checking

```bash
pnpm run typecheck
```

### Building

```bash
pnpm run build
```

## Security

### Credential Storage

- **Local development**: Credentials stored in `data/secrets.json` (gitignored)
- **Production**: Credentials stored in AWS Secrets Manager
- Credentials are never logged or exposed in API responses
- Database still stores credentials for backwards compatibility during migration

### Database Password

- Generated automatically by Pulumi using AWS Secrets Manager
- 32 characters, no punctuation (for compatibility)
- Stored in Secrets Manager and passed to ECS via environment variables

## Troubleshooting

### Common Issues

1. **ECS tasks failing to start**
   - Check CloudWatch logs: `/ecs/email-client-{env}/backend`
   - Verify RDS security group allows connections from ECS
   - Ensure ECR image exists and is accessible

2. **Frontend not updating**
   - CloudFront cache invalidation takes 5-10 minutes
   - Check S3 bucket contents
   - Verify CloudFront distribution is deployed

3. **Database connection errors**
   - Verify RDS is in the same VPC as ECS
   - Check security group rules
   - Ensure DB_PASSWORD is correctly set

## License

ISC
