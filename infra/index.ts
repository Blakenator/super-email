import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as cloudflare from '@pulumi/cloudflare';

// =============================================================================
// COST-OPTIMIZED ECS ARCHITECTURE
// =============================================================================
// Estimated monthly costs (low traffic):
//   - NAT Gateway (prod only, single): ~$32/month
//   - ALB: ~$16/month
//   - RDS t4g.micro: ~$12/month
//   - ECS Fargate Spot: ~$3-5/month
//   - CloudFront: ~$1-5/month
//   - S3: ~$1-2/month
//   - CloudWatch Logs: ~$1-2/month
// Total (prod): ~$65-75/month
// Total (dev): ~$35-45/month (no NAT, no multi-AZ)
//
// Cost savings vs original:
//   - Removed VPC Interface Endpoints (~$28/month saved)
//   - Single NAT Gateway instead of one per AZ (~$32/month saved in prod)
//   - ARM-based RDS (t4g.micro vs t3.micro) (~$2/month saved)
//   - Fargate Spot (~$10-15/month saved)
//   - Reduced log retention (~$1-2/month saved)
//   - Disabled Container Insights (~$5/month saved)
// =============================================================================

// Configuration
const config = new pulumi.Config();
const environment = config.require('environment');
const dbInstanceClass = config.get('dbInstanceClass') || 'db.t4g.micro'; // ARM-based for cost savings

// Supabase configuration from Pulumi config
const supabaseUrl = config.require('supabaseUrl');
const supabaseAnonKey = config.require('supabaseAnonKey');
const supabaseServiceRoleKey = config.requireSecret('supabaseServiceRoleKey');

const domainName = process.env.DOMAIN_NAME || config.get('domainName');
const cloudflareZoneId = process.env.CLOUDFLARE_ZONE_ID || config.get('cloudflareZoneId');

const stackName = `email-client-${environment}`;
const isProd = environment === 'prod';

// Get current AWS region
const currentRegion = aws.getRegionOutput({});

// Version tracking from environment
const gitCommitSha = process.env.GIT_COMMIT_SHA || 'unknown';
const contentHash = process.env.CONTENT_HASH || 'unknown';
const imageTag = 'latest';

// =============================================================================
// VPC and Networking - Cost Optimized
// =============================================================================
// Dev: No NAT Gateway, ECS runs in public subnets
// Prod: Single NAT Gateway (not one per AZ)

const vpc = new awsx.ec2.Vpc(`${stackName}-vpc`, {
  cidrBlock: '10.0.0.0/16',
  numberOfAvailabilityZones: 2,
  enableDnsHostnames: true,
  enableDnsSupport: true,
  natGateways: {
    // Cost optimization: Single NAT for prod, None for dev
    strategy: isProd ? 'Single' : 'None',
  },
  tags: {
    Name: `${stackName}-vpc`,
    Environment: environment,
  },
});

// =============================================================================
// Security Groups
// =============================================================================

// Security group for the backend ECS service
const backendSecurityGroup = new aws.ec2.SecurityGroup(
  `${stackName}-backend-sg`,
  {
    vpcId: vpc.vpcId,
    description: 'Security group for backend ECS service',
    ingress: [
      {
        description: 'HTTP from ALB',
        fromPort: 4000,
        toPort: 4000,
        protocol: 'tcp',
        cidrBlocks: ['10.0.0.0/16'],
      },
    ],
    egress: [
      {
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    tags: {
      Name: `${stackName}-backend-sg`,
      Environment: environment,
    },
  },
);

// Security group for RDS
const rdsSecurityGroup = new aws.ec2.SecurityGroup(`${stackName}-rds-sg`, {
  vpcId: vpc.vpcId,
  description: 'Security group for RDS PostgreSQL',
  ingress: [
    {
      description: 'PostgreSQL from backend',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      securityGroups: [backendSecurityGroup.id],
    },
  ],
  egress: [
    {
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
    },
  ],
  tags: {
    Name: `${stackName}-rds-sg`,
    Environment: environment,
  },
});

// Security group for ALB
const albSecurityGroup = new aws.ec2.SecurityGroup(`${stackName}-alb-sg`, {
  vpcId: vpc.vpcId,
  description: 'Security group for Application Load Balancer',
  ingress: [
    {
      description: 'HTTP',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
    },
    {
      description: 'HTTPS',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
    },
  ],
  egress: [
    {
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
    },
  ],
  tags: {
    Name: `${stackName}-alb-sg`,
    Environment: environment,
  },
});

// =============================================================================
// RDS PostgreSQL Database - Cost Optimized
// =============================================================================

const dbSubnetGroup = new aws.rds.SubnetGroup(
  `${stackName}-db-subnet-group`,
  {
    namePrefix: `${stackName}-db-subnet-`,
    subnetIds: vpc.privateSubnetIds,
    tags: {
      Name: `${stackName}-db-subnet-group`,
      Environment: environment,
    },
  },
  {
    // Allow replacement when VPC changes
    deleteBeforeReplace: true,
  },
);

// Database password in Secrets Manager
const dbPasswordSecret = new aws.secretsmanager.Secret(
  `${stackName}-db-password`,
  {
    namePrefix: `${stackName}-db-password-`,
    description: 'Database password for Email Client',
    recoveryWindowInDays: 0,
    tags: {
      Name: `${stackName}-db-password`,
      Environment: environment,
    },
  },
);

const dbPasswordVersion = new aws.secretsmanager.SecretVersion(
  `${stackName}-db-password-version`,
  {
    secretId: dbPasswordSecret.id,
    secretString: pulumi
      .output(
        aws.secretsmanager.getRandomPassword({
          passwordLength: 32,
          excludePunctuation: true,
        }),
      )
      .apply((p) => p.randomPassword),
  },
  {
    ignoreChanges: ['secretString'],
  },
);

const dbPassword = dbPasswordVersion.secretString.apply((pwd) => {
  if (!pwd) {
    throw new Error('Database password was not generated');
  }
  return pwd;
});

const database = new aws.rds.Instance(`${stackName}-db`, {
  identifier: `${stackName}-postgres`,
  engine: 'postgres',
  engineVersion: '15',
  instanceClass: dbInstanceClass, // t4g.micro - ARM-based, cheaper
  allocatedStorage: 20,
  maxAllocatedStorage: 100,
  storageType: 'gp3',
  dbName: 'emailclient',
  username: 'emailclient',
  password: dbPassword,
  dbSubnetGroupName: dbSubnetGroup.name,
  vpcSecurityGroupIds: [rdsSecurityGroup.id],
  multiAz: false, // Cost optimization: Single AZ (use backups for DR)
  publiclyAccessible: true,
  skipFinalSnapshot: !isProd,
  finalSnapshotIdentifier: isProd ? `${stackName}-final-snapshot` : undefined,
  backupRetentionPeriod: isProd ? 7 : 1, // Cost optimization: Minimal backups for dev
  deletionProtection: isProd,
  performanceInsightsEnabled: true,
  performanceInsightsRetentionPeriod: 7, // Free tier: 7 days
  tags: {
    Name: `${stackName}-postgres`,
    Environment: environment,
  },
});

// =============================================================================
// S3 Bucket for Email Attachments
// =============================================================================

const attachmentsBucket = new aws.s3.Bucket(`${stackName}-attachments`, {
  bucket: `${stackName}-attachments`,
  acl: 'private',
  versioning: { enabled: false },
  serverSideEncryptionConfiguration: {
    rule: {
      applyServerSideEncryptionByDefault: { sseAlgorithm: 'AES256' },
    },
  },
  // CORS configuration for frontend access via presigned URLs
  corsRules: [
    {
      allowedHeaders: ['*'],
      allowedMethods: ['GET', 'HEAD'],
      allowedOrigins: ['*'], // Presigned URLs are already secure; allow any origin
      exposeHeaders: [
        'ETag',
        'Content-Length',
        'Content-Type',
        'x-amz-checksum-crc32',
      ],
      maxAgeSeconds: 3600,
    },
  ],
  lifecycleRules: [
    {
      id: 'transition-to-infrequent-access',
      enabled: true,
      transitions: [
        { days: 30, storageClass: 'STANDARD_IA' },
        { days: 90, storageClass: 'GLACIER' },
      ],
    },
  ],
  tags: {
    Name: `${stackName}-attachments`,
    Environment: environment,
  },
});

new aws.s3.BucketPublicAccessBlock(`${stackName}-attachments-pab`, {
  bucket: attachmentsBucket.id,
  blockPublicAcls: true,
  blockPublicPolicy: true,
  ignorePublicAcls: true,
  restrictPublicBuckets: true,
});

// =============================================================================
// S3 Bucket for Raw Inbound Emails (Custom Domains)
// =============================================================================
// Archived for compliance/debugging. NOT counted towards user storage budgets.

const rawEmailsBucket = new aws.s3.Bucket(`${stackName}-raw-emails`, {
  bucket: `${stackName}-raw-emails`,
  acl: 'private',
  versioning: { enabled: false },
  serverSideEncryptionConfiguration: {
    rule: {
      applyServerSideEncryptionByDefault: { sseAlgorithm: 'AES256' },
    },
  },
  lifecycleRules: [
    {
      id: 'archive-raw-emails',
      enabled: true,
      transitions: [
        { days: 30, storageClass: 'STANDARD_IA' },
        { days: 365, storageClass: 'GLACIER' },
      ],
    },
  ],
  tags: {
    Name: `${stackName}-raw-emails`,
    Environment: environment,
  },
});

new aws.s3.BucketPublicAccessBlock(`${stackName}-raw-emails-pab`, {
  bucket: rawEmailsBucket.id,
  blockPublicAcls: true,
  blockPublicPolicy: true,
  ignorePublicAcls: true,
  restrictPublicBuckets: true,
});

// =============================================================================
// S3 Bucket for Email Bodies (encrypted at rest)
// =============================================================================

const emailBodiesBucket = new aws.s3.Bucket(`${stackName}-email-bodies`, {
  bucket: `${stackName}-email-bodies`,
  acl: 'private',
  versioning: { enabled: false },
  serverSideEncryptionConfiguration: {
    rule: {
      applyServerSideEncryptionByDefault: { sseAlgorithm: 'AES256' },
    },
  },
  tags: {
    Name: `${stackName}-email-bodies`,
    Environment: environment,
  },
});

new aws.s3.BucketPublicAccessBlock(`${stackName}-email-bodies-pab`, {
  bucket: emailBodiesBucket.id,
  blockPublicAcls: true,
  blockPublicPolicy: true,
  ignorePublicAcls: true,
  restrictPublicBuckets: true,
});

// =============================================================================
// S3 Bucket for Frontend Static Files
// =============================================================================

const frontendBucket = new aws.s3.BucketV2(`${stackName}-frontend`, {
  bucket: `${stackName}-frontend`,
  tags: {
    Name: `${stackName}-frontend`,
    Environment: environment,
  },
});

const frontendPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
  `${stackName}-frontend-pab`,
  {
    bucket: frontendBucket.id,
    blockPublicAcls: false,
    blockPublicPolicy: false,
    ignorePublicAcls: false,
    restrictPublicBuckets: false,
  },
);

const frontendBucketPolicy = new aws.s3.BucketPolicy(
  `${stackName}-frontend-policy`,
  {
    bucket: frontendBucket.id,
    policy: frontendBucket.arn.apply((arn) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'PublicReadGetObject',
            Effect: 'Allow',
            Principal: '*',
            Action: 's3:GetObject',
            Resource: `${arn}/*`,
          },
        ],
      }),
    ),
  },
  { dependsOn: [frontendPublicAccessBlock] },
);

// =============================================================================
// ECR Repository
// =============================================================================

const backendRepo = new aws.ecr.Repository(`${stackName}-backend`, {
  name: `${stackName}-backend`,
  imageTagMutability: 'MUTABLE',
  imageScanningConfiguration: { scanOnPush: false }, // Cost optimization
  tags: {
    Name: `${stackName}-backend`,
    Environment: environment,
  },
});

new aws.ecr.LifecyclePolicy(`${stackName}-backend-lifecycle`, {
  repository: backendRepo.name,
  policy: JSON.stringify({
    rules: [
      {
        rulePriority: 1,
        description: 'Keep last 5 images', // Cost optimization: fewer images
        selection: {
          tagStatus: 'any',
          countType: 'imageCountMoreThan',
          countNumber: 5,
        },
        action: { type: 'expire' },
      },
    ],
  }),
});

// =============================================================================
// ECS Cluster - Cost Optimized
// =============================================================================

const cluster = new aws.ecs.Cluster(`${stackName}-cluster`, {
  name: `${stackName}-cluster`,
  settings: [
    {
      name: 'containerInsights',
      value: 'disabled', // Cost optimization: Disable Container Insights
    },
  ],
  tags: {
    Name: `${stackName}-cluster`,
    Environment: environment,
  },
});

// Fargate Spot capacity provider for cost savings
const capacityProviders = new aws.ecs.ClusterCapacityProviders(
  `${stackName}-capacity-providers`,
  {
    clusterName: cluster.name,
    capacityProviders: ['FARGATE', 'FARGATE_SPOT'],
    defaultCapacityProviderStrategies: [
      {
        capacityProvider: 'FARGATE_SPOT',
        weight: 4, // 80% Spot
        base: 0,
      },
      {
        capacityProvider: 'FARGATE',
        weight: 1, // 20% On-Demand as fallback
        base: 1, // At least 1 on-demand task
      },
    ],
  },
);

// =============================================================================
// IAM Roles for ECS
// =============================================================================

const taskExecutionRole = new aws.iam.Role(`${stackName}-task-exec-role`, {
  name: `${stackName}-task-exec-role`,
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: { Service: 'ecs-tasks.amazonaws.com' },
      },
    ],
  }),
  tags: { Name: `${stackName}-task-exec-role`, Environment: environment },
});

new aws.iam.RolePolicyAttachment(`${stackName}-task-exec-policy`, {
  role: taskExecutionRole.name,
  policyArn:
    'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
});

// Secrets Manager policy for task execution role (to pull secrets at container start)
const execSecretsPolicy = new aws.iam.Policy(
  `${stackName}-exec-secrets-policy`,
  {
    name: `${stackName}-exec-secrets-policy`,
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['secretsmanager:GetSecretValue'],
          Resource: [`arn:aws:secretsmanager:*:*:secret:${stackName}-*`],
        },
      ],
    }),
  },
);

new aws.iam.RolePolicyAttachment(`${stackName}-task-exec-secrets-policy`, {
  role: taskExecutionRole.name,
  policyArn: execSecretsPolicy.arn,
});

const taskRole = new aws.iam.Role(`${stackName}-task-role`, {
  name: `${stackName}-task-role`,
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: { Service: 'ecs-tasks.amazonaws.com' },
      },
    ],
  }),
  tags: { Name: `${stackName}-task-role`, Environment: environment },
});

// S3 policy for attachments + email bodies
const s3Policy = new aws.iam.Policy(`${stackName}-s3-policy`, {
  name: `${stackName}-s3-policy`,
  policy: pulumi
    .all([attachmentsBucket.arn, emailBodiesBucket.arn])
    .apply(([attachArn, bodiesArn]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:PutObject',
              's3:GetObject',
              's3:DeleteObject',
              's3:ListBucket',
            ],
            Resource: [attachArn, `${attachArn}/*`, bodiesArn, `${bodiesArn}/*`],
          },
        ],
      }),
    ),
});

new aws.iam.RolePolicyAttachment(`${stackName}-task-s3-policy`, {
  role: taskRole.name,
  policyArn: s3Policy.arn,
});

// Secrets Manager policy for task role (runtime access)
const secretsPolicy = new aws.iam.Policy(`${stackName}-secrets-policy`, {
  name: `${stackName}-secrets-policy`,
  policy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:CreateSecret',
          'secretsmanager:UpdateSecret',
          'secretsmanager:DeleteSecret',
          'secretsmanager:TagResource',
          'secretsmanager:UntagResource',
        ],
        Resource: [
          `arn:aws:secretsmanager:*:*:secret:${stackName}-*`,
          'arn:aws:secretsmanager:*:*:secret:email-client/*',
        ],
      },
    ],
  }),
});

new aws.iam.RolePolicyAttachment(`${stackName}-task-secrets-policy`, {
  role: taskRole.name,
  policyArn: secretsPolicy.arn,
});

// SSM policy for ECS Exec and SSM port forwarding (allows local DB tunnel)
const ssmPolicy = new aws.iam.Policy(`${stackName}-ssm-policy`, {
  name: `${stackName}-ssm-policy`,
  policy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'ssmmessages:CreateControlChannel',
          'ssmmessages:CreateDataChannel',
          'ssmmessages:OpenControlChannel',
          'ssmmessages:OpenDataChannel',
        ],
        Resource: '*',
      },
    ],
  }),
});

new aws.iam.RolePolicyAttachment(`${stackName}-task-ssm-policy`, {
  role: taskRole.name,
  policyArn: ssmPolicy.arn,
});

// S3 policy for raw-emails bucket (backend archives inbound raw emails)
const rawEmailsS3Policy = new aws.iam.Policy(`${stackName}-raw-emails-s3-policy`, {
  name: `${stackName}-raw-emails-s3-policy`,
  policy: rawEmailsBucket.arn.apply((arn) =>
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['s3:PutObject', 's3:GetObject'],
          Resource: `${arn}/*`,
        },
      ],
    }),
  ),
});

new aws.iam.RolePolicyAttachment(`${stackName}-task-raw-emails-s3-policy`, {
  role: taskRole.name,
  policyArn: rawEmailsS3Policy.arn,
});

// SES policy for sending emails from custom domains
const sesPolicy = new aws.iam.Policy(`${stackName}-ses-policy`, {
  name: `${stackName}-ses-policy`,
  policy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'ses:SendEmail',
          'ses:SendRawEmail',
          'ses:CreateEmailIdentity',
          'ses:DeleteEmailIdentity',
          'ses:GetEmailIdentity',
        ],
        Resource: '*',
      },
    ],
  }),
});

new aws.iam.RolePolicyAttachment(`${stackName}-task-ses-policy`, {
  role: taskRole.name,
  policyArn: sesPolicy.arn,
});

// =============================================================================
// CloudWatch Log Group - Cost Optimized
// =============================================================================

const backendLogGroup = new aws.cloudwatch.LogGroup(
  `${stackName}-backend-logs`,
  {
    name: `/ecs/${stackName}/backend`,
    retentionInDays: isProd ? 14 : 7, // Cost optimization: Shorter retention
    tags: {
      Name: `${stackName}-backend-logs`,
      Environment: environment,
    },
  },
);

// =============================================================================
// Supabase Secret in Secrets Manager
// =============================================================================

const supabaseServiceSecret = new aws.secretsmanager.Secret(
  `${stackName}-supabase-key`,
  {
    namePrefix: `${stackName}-supabase-`,
    description: 'Supabase Service Role Key',
    recoveryWindowInDays: 0,
    tags: { Name: `${stackName}-supabase-key`, Environment: environment },
  },
);

const supabaseServiceSecretVersion = new aws.secretsmanager.SecretVersion(
  `${stackName}-supabase-key-version`,
  {
    secretId: supabaseServiceSecret.id,
    secretString: supabaseServiceRoleKey,
  },
  { ignoreChanges: ['secretString'] },
);

// =============================================================================
// Stripe Secrets in Secrets Manager
// =============================================================================

// Get Stripe keys from Pulumi config (optional for deployments without billing)
// AWS Secrets Manager requires non-empty values, so use placeholder when not configured
const stripeSecretKey =
  config.getSecret('stripeSecretKey') || pulumi.output('not-configured');
const stripeWebhookSecret =
  config.getSecret('stripeWebhookSecret') || pulumi.output('not-configured');
const stripePublishableKey = config.get('stripePublishableKey') || '';

// Stripe price IDs for subscription tiers (from Pulumi config)
const stripePriceStorageBasic = config.get('stripePriceStorageBasic') || '';
const stripePriceStoragePro = config.get('stripePriceStoragePro') || '';
const stripePriceStorageEnterprise = config.get('stripePriceStorageEnterprise') || '';
const stripePriceAccountsBasic = config.get('stripePriceAccountsBasic') || '';
const stripePriceAccountsPro = config.get('stripePriceAccountsPro') || '';
const stripePriceAccountsEnterprise = config.get('stripePriceAccountsEnterprise') || '';
const stripePriceDomainBasic = config.get('stripePriceDomainsBasic') || '';
const stripePriceDomainPro = config.get('stripePriceDomainsPro') || '';
const stripePriceDomainEnterprise = config.get('stripePriceDomainsEnterprise') || '';
const stripePricePlatformBase = config.get('stripePricePlatformBase') || '';

// SES region override (SES is not available in all regions, e.g. us-west-1)
const sesRegion = config.get('sesRegion') || 'us-west-2';

// Stripe secret key
const stripeKeySecret = new aws.secretsmanager.Secret(
  `${stackName}-stripe-key`,
  {
    namePrefix: `${stackName}-stripe-`,
    description: 'Stripe Secret Key',
    recoveryWindowInDays: 0,
    tags: { Name: `${stackName}-stripe-key`, Environment: environment },
  },
);

const stripeKeySecretVersion = new aws.secretsmanager.SecretVersion(
  `${stackName}-stripe-key-version`,
  {
    secretId: stripeKeySecret.id,
    secretString: stripeSecretKey,
  },
  // Note: Not using ignoreChanges so secret can be updated when config changes
);

// Stripe webhook secret
const stripeWebhookSecretResource = new aws.secretsmanager.Secret(
  `${stackName}-stripe-webhook`,
  {
    namePrefix: `${stackName}-stripe-webhook-`,
    description: 'Stripe Webhook Secret',
    recoveryWindowInDays: 0,
    tags: { Name: `${stackName}-stripe-webhook`, Environment: environment },
  },
);

const stripeWebhookSecretVersion = new aws.secretsmanager.SecretVersion(
  `${stackName}-stripe-webhook-version`,
  {
    secretId: stripeWebhookSecretResource.id,
    secretString: stripeWebhookSecret,
  },
  // Note: Not using ignoreChanges so secret can be updated when config changes
);

// Internal API Token for Lambda Sync Trigger (created early so ECS can use it)
const internalApiTokenSecret = new aws.secretsmanager.Secret(
  `${stackName}-internal-api-token`,
  {
    namePrefix: `${stackName}-internal-api-token-`,
    description: 'Internal API token for Lambda to trigger sync',
    recoveryWindowInDays: 0,
    tags: { Name: `${stackName}-internal-api-token`, Environment: environment },
  },
);

const internalApiTokenVersion = new aws.secretsmanager.SecretVersion(
  `${stackName}-internal-api-token-version`,
  {
    secretId: internalApiTokenSecret.id,
    secretString: pulumi
      .output(
        aws.secretsmanager.getRandomPassword({
          passwordLength: 64,
          excludePunctuation: true,
        }),
      )
      .apply((p) => p.randomPassword),
  },
  { ignoreChanges: ['secretString'] },
);

// JWT signing secret for OAuth state tokens (backend/server.ts). Must not use dev default in production.
const jwtSigningSecret = new aws.secretsmanager.Secret(
  `${stackName}-jwt-signing`,
  {
    namePrefix: `${stackName}-jwt-`,
    description: 'JWT signing secret for OAuth state',
    recoveryWindowInDays: 0,
    tags: { Name: `${stackName}-jwt-signing`, Environment: environment },
  },
);

const jwtSigningSecretVersion = new aws.secretsmanager.SecretVersion(
  `${stackName}-jwt-signing-version`,
  {
    secretId: jwtSigningSecret.id,
    secretString: pulumi
      .output(
        aws.secretsmanager.getRandomPassword({
          passwordLength: 64,
          excludePunctuation: true,
        }),
      )
      .apply((p) => p.randomPassword),
  },
  { ignoreChanges: ['secretString'] },
);

// =============================================================================
// OAuth client credentials (optional — Gmail / Yahoo / Outlook linking)
// =============================================================================

const googleOAuthClientId = config.get('googleOAuthClientId') || '';
const googleOAuthClientSecret =
  config.getSecret('googleOAuthClientSecret') || pulumi.output('not-configured');
const yahooOAuthClientId = config.get('yahooOAuthClientId') || '';
const yahooOAuthClientSecret =
  config.getSecret('yahooOAuthClientSecret') || pulumi.output('not-configured');
const outlookOAuthClientId = config.get('outlookOAuthClientId') || '';
const outlookOAuthClientSecret =
  config.getSecret('outlookOAuthClientSecret') || pulumi.output('not-configured');

const googleOAuthClientSecretResource = new aws.secretsmanager.Secret(
  `${stackName}-google-oauth-client-secret`,
  {
    namePrefix: `${stackName}-google-oauth-`,
    description: 'Google OAuth client secret',
    recoveryWindowInDays: 0,
    tags: {
      Name: `${stackName}-google-oauth-client-secret`,
      Environment: environment,
    },
  },
);

const googleOAuthClientSecretVersion = new aws.secretsmanager.SecretVersion(
  `${stackName}-google-oauth-client-secret-version`,
  {
    secretId: googleOAuthClientSecretResource.id,
    secretString: googleOAuthClientSecret,
  },
);

const yahooOAuthClientSecretResource = new aws.secretsmanager.Secret(
  `${stackName}-yahoo-oauth-client-secret`,
  {
    namePrefix: `${stackName}-yahoo-oauth-`,
    description: 'Yahoo OAuth client secret',
    recoveryWindowInDays: 0,
    tags: {
      Name: `${stackName}-yahoo-oauth-client-secret`,
      Environment: environment,
    },
  },
);

const yahooOAuthClientSecretVersion = new aws.secretsmanager.SecretVersion(
  `${stackName}-yahoo-oauth-client-secret-version`,
  {
    secretId: yahooOAuthClientSecretResource.id,
    secretString: yahooOAuthClientSecret,
  },
);

const outlookOAuthClientSecretResource = new aws.secretsmanager.Secret(
  `${stackName}-outlook-oauth-client-secret`,
  {
    namePrefix: `${stackName}-outlook-oauth-`,
    description: 'Microsoft Outlook OAuth client secret',
    recoveryWindowInDays: 0,
    tags: {
      Name: `${stackName}-outlook-oauth-client-secret`,
      Environment: environment,
    },
  },
);

const outlookOAuthClientSecretVersion = new aws.secretsmanager.SecretVersion(
  `${stackName}-outlook-oauth-client-secret-version`,
  {
    secretId: outlookOAuthClientSecretResource.id,
    secretString: outlookOAuthClientSecret,
  },
);

// Firebase Admin JSON (optional — web push). Placeholder "{}" when unset (skipped by backend).
const firebaseServiceAccountJson =
  config.getSecret('firebaseServiceAccountJson') || pulumi.output('{}');

const firebaseServiceAccountSecret = new aws.secretsmanager.Secret(
  `${stackName}-firebase-service-account`,
  {
    namePrefix: `${stackName}-firebase-`,
    description: 'Firebase Admin service account JSON',
    recoveryWindowInDays: 0,
    tags: {
      Name: `${stackName}-firebase-service-account`,
      Environment: environment,
    },
  },
);

const firebaseServiceAccountSecretVersion = new aws.secretsmanager.SecretVersion(
  `${stackName}-firebase-service-account-version`,
  {
    secretId: firebaseServiceAccountSecret.id,
    secretString: firebaseServiceAccountJson,
  },
);

// =============================================================================
// Application Load Balancer
// =============================================================================
// Note: ALB is created before Task Definition so CloudFront can be created,
// allowing the Task Definition to reference the CloudFront domain for redirects.

const alb = new aws.lb.LoadBalancer(`${stackName}-alb`, {
  name: `${stackName}-alb`,
  internal: false,
  loadBalancerType: 'application',
  securityGroups: [albSecurityGroup.id],
  subnets: vpc.publicSubnetIds,
  enableDeletionProtection: isProd,
  tags: { Name: `${stackName}-alb`, Environment: environment },
});

const backendTargetGroup = new aws.lb.TargetGroup(`${stackName}-backend-tg`, {
  name: `${stackName}-backend-tg`,
  port: 4000,
  protocol: 'HTTP',
  vpcId: vpc.vpcId,
  targetType: 'ip',
  healthCheck: {
    enabled: true,
    path: '/api/health',
    port: 'traffic-port',
    protocol: 'HTTP',
    healthyThreshold: 2,
    unhealthyThreshold: 3,
    timeout: 5,
    interval: 30,
    matcher: '200',
  },
  tags: { Name: `${stackName}-backend-tg`, Environment: environment },
});

new aws.lb.Listener(`${stackName}-http-listener`, {
  loadBalancerArn: alb.arn,
  port: 80,
  protocol: 'HTTP',
  defaultActions: [{ type: 'forward', targetGroupArn: backendTargetGroup.arn }],
});

// =============================================================================
// Custom Domain: ACM Certificate + Cloudflare DNS
// =============================================================================
// CloudFront requires ACM certificates in us-east-1 regardless of stack region.

const usEast1 = new aws.Provider(`${stackName}-us-east-1`, {
  region: 'us-east-1',
});

const certificate = domainName
  ? new aws.acm.Certificate(
      `${stackName}-cert`,
      {
        domainName: domainName,
        subjectAlternativeNames: [`*.${domainName}`],
        validationMethod: 'DNS',
        tags: { Name: `${stackName}-cert`, Environment: environment },
      },
      { provider: usEast1 },
    )
  : undefined;

let certValidation: aws.acm.CertificateValidation | undefined;

if (domainName && certificate && cloudflareZoneId) {
  // ACM returns one validation option per SAN, but wildcard + apex share the
  // same CNAME record. Deduplicate by record name to avoid conflicts.
  const validationRecords = certificate.domainValidationOptions.apply((opts) => {
    const unique = new Map<string, (typeof opts)[number]>();
    for (const opt of opts) {
      unique.set(opt.resourceRecordName, opt);
    }
    return [...unique.values()].map(
      (opt, i) =>
        new cloudflare.Record(`${stackName}-cert-validation-${i}`, {
          zoneId: cloudflareZoneId,
          name: opt.resourceRecordName,
          type: opt.resourceRecordType,
          content: opt.resourceRecordValue,
          ttl: 60,
          proxied: false,
        }),
    );
  });

  certValidation = new aws.acm.CertificateValidation(
    `${stackName}-cert-validation`,
    { certificateArn: certificate.arn },
    { provider: usEast1, dependsOn: validationRecords },
  );
}

// =============================================================================
// CloudFront CDN
// =============================================================================
// Note: Created before Task Definition so backend can use the CloudFront URL
// for Stripe checkout redirects.

const frontendDistribution = new aws.cloudfront.Distribution(
  `${stackName}-cdn`,
  {
    enabled: true,
    isIpv6Enabled: true,
    defaultRootObject: 'index.html',
    httpVersion: 'http2and3',
    priceClass: 'PriceClass_100', // US, Canada, Europe only

    origins: [
      {
        domainName: frontendBucket.bucketRegionalDomainName,
        originId: 'S3Origin',
        customOriginConfig: {
          httpPort: 80,
          httpsPort: 443,
          originProtocolPolicy: 'http-only',
          originSslProtocols: ['TLSv1.2'],
        },
      },
      {
        domainName: alb.dnsName,
        originId: 'BackendOrigin',
        customOriginConfig: {
          httpPort: 80,
          httpsPort: 443,
          originProtocolPolicy: 'http-only',
          originSslProtocols: ['TLSv1.2'],
          originReadTimeout: 60,
          originKeepaliveTimeout: 5,
        },
        customHeaders: [{ name: 'X-Forwarded-Proto', value: 'https' }],
      },
    ],

    defaultCacheBehavior: {
      targetOriginId: 'S3Origin',
      viewerProtocolPolicy: 'redirect-to-https',
      allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
      cachedMethods: ['GET', 'HEAD'],
      compress: true,
      cachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6', // CachingOptimized
    },

    orderedCacheBehaviors: [
      {
        pathPattern: '/api/*',
        targetOriginId: 'BackendOrigin',
        viewerProtocolPolicy: 'https-only',
        allowedMethods: [
          'GET',
          'HEAD',
          'OPTIONS',
          'PUT',
          'POST',
          'PATCH',
          'DELETE',
        ],
        cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
        compress: false,
        cachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // CachingDisabled
        originRequestPolicyId: 'b689b0a8-53d0-40ab-baf2-68738e2966ac', // AllViewerExceptHostHeader
      },
    ],

    customErrorResponses: [
      {
        errorCode: 404,
        responseCode: 200,
        responsePagePath: '/index.html',
        errorCachingMinTtl: 0,
      },
      {
        errorCode: 403,
        responseCode: 200,
        responsePagePath: '/index.html',
        errorCachingMinTtl: 0,
      },
    ],

    restrictions: {
      geoRestriction: { restrictionType: 'none' },
    },

    aliases: domainName ? [domainName] : undefined,
    viewerCertificate:
      domainName && certificate
        ? {
            acmCertificateArn: certificate.arn,
            sslSupportMethod: 'sni-only' as const,
            minimumProtocolVersion: 'TLSv1.2_2021',
          }
        : { cloudfrontDefaultCertificate: true },

    tags: { Name: `${stackName}-cdn`, Environment: environment },
  },
  {
    dependsOn: [alb, frontendBucketPolicy, ...(certValidation ? [certValidation] : [])],
  },
);

// Cloudflare CNAME pointing domain to CloudFront
if (domainName && cloudflareZoneId) {
  new cloudflare.Record(`${stackName}-dns`, {
    zoneId: cloudflareZoneId,
    name: domainName,
    type: 'CNAME',
    content: frontendDistribution.domainName,
    ttl: 1,
    proxied: false,
  });
}

// =============================================================================
// Custom Domain Email Infrastructure (SES → S3 → SNS → SQS → Lambda)
// =============================================================================

// SES provider — SES is only available in certain regions (not us-west-1).
// Uses the sesRegion config value, defaulting to us-west-2.
const sesProvider = new aws.Provider(`${stackName}-ses-provider`, {
  region: sesRegion as aws.Region,
});

// SNS topic - SES notifies here after saving raw email to S3.
// Must be in the SES region (SES can only publish to same-region SNS topics).
const customEmailTopic = new aws.sns.Topic(
  `${stackName}-custom-email-topic`,
  {
    name: `${stackName}-custom-email-topic`,
    tags: { Name: `${stackName}-custom-email-topic`, Environment: environment },
  },
  { provider: sesProvider },
);

// SQS Dead Letter Queue for failed email processing
const customEmailDlq = new aws.sqs.Queue(`${stackName}-custom-email-dlq`, {
  name: `${stackName}-custom-email-dlq`,
  messageRetentionSeconds: 14 * 24 * 60 * 60, // 14 days
  tags: { Name: `${stackName}-custom-email-dlq`, Environment: environment },
});

// SQS main queue - Lambda consumes from here
const customEmailQueue = new aws.sqs.Queue(`${stackName}-custom-email-queue`, {
  name: `${stackName}-custom-email-queue`,
  visibilityTimeoutSeconds: 300, // 5 min for Lambda processing
  messageRetentionSeconds: 4 * 24 * 60 * 60, // 4 days
  receiveWaitTimeSeconds: 20,
  redrivePolicy: customEmailDlq.arn.apply((arn) =>
    JSON.stringify({ deadLetterTargetArn: arn, maxReceiveCount: 3 }),
  ),
  tags: { Name: `${stackName}-custom-email-queue`, Environment: environment },
});

// Allow SNS to publish to SQS
new aws.sqs.QueuePolicy(`${stackName}-custom-email-queue-policy`, {
  queueUrl: customEmailQueue.url,
  policy: pulumi
    .all([customEmailQueue.arn, customEmailTopic.arn])
    .apply(([queueArn, topicArn]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowSNS',
            Effect: 'Allow',
            Principal: { Service: 'sns.amazonaws.com' },
            Action: 'sqs:SendMessage',
            Resource: queueArn,
            Condition: { ArnEquals: { 'aws:SourceArn': topicArn } },
          },
        ],
      }),
    ),
});

// SNS → SQS subscription (created in the SES/SNS region, targeting cross-region SQS)
new aws.sns.TopicSubscription(
  `${stackName}-custom-email-sns-sqs`,
  {
    topic: customEmailTopic.arn,
    protocol: 'sqs',
    endpoint: customEmailQueue.arn,
    rawMessageDelivery: false,
  },
  { provider: sesProvider },
);

// Bucket policy allowing SES to write raw emails to S3
const rawEmailsSesPolicy = new aws.s3.BucketPolicy(
  `${stackName}-raw-emails-ses-policy`,
  {
    bucket: rawEmailsBucket.id,
    policy: pulumi
      .all([rawEmailsBucket.arn, aws.getCallerIdentity({})])
      .apply(([arn, identity]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AllowSESPuts',
              Effect: 'Allow',
              Principal: { Service: 'ses.amazonaws.com' },
              Action: 's3:PutObject',
              Resource: `${arn}/*`,
              Condition: {
                StringEquals: { 'AWS:SourceAccount': identity.accountId },
              },
            },
          ],
        }),
      ),
  },
);

// SES Receipt Rule Set (container for all receipt rules)
const sesReceiptRuleSet = new aws.ses.ReceiptRuleSet(
  `${stackName}-receipt-rule-set`,
  { ruleSetName: `${stackName}-receipt-rules` },
  { provider: sesProvider },
);

// Activate the receipt rule set
new aws.ses.ActiveReceiptRuleSet(
  `${stackName}-active-receipt-rule-set`,
  { ruleSetName: sesReceiptRuleSet.ruleSetName },
  { provider: sesProvider },
);

// Catch-all receipt rule: save inbound email to S3 + notify SNS
// SES only delivers for verified domain identities, so catch-all is safe.
new aws.ses.ReceiptRule(
  `${stackName}-catch-all-rule`,
  {
    name: `${stackName}-catch-all`,
    ruleSetName: sesReceiptRuleSet.ruleSetName,
    enabled: true,
    scanEnabled: true,
    s3Actions: [
      {
        bucketName: rawEmailsBucket.bucket,
        objectKeyPrefix: 'inbound/',
        position: 1,
        topicArn: customEmailTopic.arn,
      },
    ],
  },
  { provider: sesProvider, dependsOn: [rawEmailsSesPolicy] },
);

// =============================================================================
// ECS Task Definition
// =============================================================================

const backendTaskDefinition = new aws.ecs.TaskDefinition(
  `${stackName}-backend-task`,
  {
    family: `${stackName}-backend`,
    networkMode: 'awsvpc',
    requiresCompatibilities: ['FARGATE'],
    cpu: '1024',
    memory: '2048',
    executionRoleArn: taskExecutionRole.arn,
    taskRoleArn: taskRole.arn,
    containerDefinitions: pulumi
      .output({
        repoUrl: backendRepo.repositoryUrl,
        dbHost: database.address,
        dbPort: database.port,
        dbPass: dbPassword,
        bucketName: attachmentsBucket.bucket,
        emailBodiesBucketName: emailBodiesBucket.bucket,
        region: currentRegion.name,
        supabaseSecretArn: supabaseServiceSecretVersion.arn,
        stripeKeyArn: stripeKeySecretVersion.arn,
        stripeWebhookArn: stripeWebhookSecretVersion.arn,
        internalApiTokenArn: internalApiTokenVersion.arn,
        jwtSigningSecretArn: jwtSigningSecretVersion.arn,
        googleOAuthClientSecretArn: googleOAuthClientSecretVersion.arn,
        yahooOAuthClientSecretArn: yahooOAuthClientSecretVersion.arn,
        outlookOAuthClientSecretArn: outlookOAuthClientSecretVersion.arn,
        firebaseServiceAccountSecretArn: firebaseServiceAccountSecretVersion.arn,
        cloudfrontDomain: frontendDistribution.domainName,
        rawEmailsBucketName: rawEmailsBucket.bucket,
        customEmailQueueUrl: customEmailQueue.url,
      })
      .apply(
        ({
          repoUrl,
          dbHost,
          dbPort,
          dbPass,
          bucketName,
          emailBodiesBucketName,
          region,
          supabaseSecretArn,
          stripeKeyArn,
          stripeWebhookArn,
          internalApiTokenArn,
          jwtSigningSecretArn,
          googleOAuthClientSecretArn,
          yahooOAuthClientSecretArn,
          outlookOAuthClientSecretArn,
          firebaseServiceAccountSecretArn,
          cloudfrontDomain,
          rawEmailsBucketName,
          customEmailQueueUrl,
        }) => {
          const frontendBase = domainName
            ? `https://${domainName}`
            : `https://${cloudfrontDomain}`;
          return JSON.stringify([
            {
              name: 'backend',
              image: `${repoUrl}:${imageTag}`,
              essential: true,
              portMappings: [{ containerPort: 4000, protocol: 'tcp' }],
              environment: [
                { name: 'NODE_ENV', value: 'production' },
                { name: 'LOG_LEVEL', value: 'info' },
                { name: 'GIT_COMMIT_SHA', value: gitCommitSha },
                { name: 'CONTENT_HASH', value: contentHash },
                { name: 'DB_HOST', value: dbHost },
                { name: 'DB_PORT', value: String(dbPort) },
                { name: 'DB_NAME', value: 'emailclient' },
                { name: 'DB_USER', value: 'emailclient' },
                { name: 'DB_PASSWORD', value: dbPass },
                { name: 'PORT', value: '4000' },
                { name: 'ATTACHMENTS_S3_BUCKET', value: bucketName },
                { name: 'EMAIL_BODIES_S3_BUCKET', value: emailBodiesBucketName },
                { name: 'AWS_REGION', value: region },
                { name: 'SECRETS_BASE_PATH', value: 'email-client' },
                { name: 'SUPABASE_URL', value: supabaseUrl },
                { name: 'SUPABASE_ANON_KEY', value: supabaseAnonKey },
                { name: 'STRIPE_PUBLISHABLE_KEY', value: stripePublishableKey },
                {
                  name: 'FRONTEND_URL',
                  value: frontendBase,
                },
                // Stripe price IDs for subscription tiers
                { name: 'STRIPE_PRICE_STORAGE_BASIC', value: stripePriceStorageBasic },
                { name: 'STRIPE_PRICE_STORAGE_PRO', value: stripePriceStoragePro },
                { name: 'STRIPE_PRICE_STORAGE_ENTERPRISE', value: stripePriceStorageEnterprise },
                { name: 'STRIPE_PRICE_ACCOUNTS_BASIC', value: stripePriceAccountsBasic },
                { name: 'STRIPE_PRICE_ACCOUNTS_PRO', value: stripePriceAccountsPro },
                { name: 'STRIPE_PRICE_ACCOUNTS_ENTERPRISE', value: stripePriceAccountsEnterprise },
                { name: 'STRIPE_PRICE_DOMAINS_BASIC', value: stripePriceDomainBasic },
                { name: 'STRIPE_PRICE_DOMAINS_PRO', value: stripePriceDomainPro },
                { name: 'STRIPE_PRICE_DOMAINS_ENTERPRISE', value: stripePriceDomainEnterprise },
                { name: 'STRIPE_PRICE_PLATFORM_BASE', value: stripePricePlatformBase },
                // Custom domain email infrastructure
                { name: 'SES_REGION', value: sesRegion },
                { name: 'RAW_EMAILS_S3_BUCKET', value: rawEmailsBucketName },
                { name: 'SQS_CUSTOM_EMAIL_QUEUE_URL', value: customEmailQueueUrl },
                // Disable in-process background sync - Lambda handles this
                { name: 'BACKGROUND_SYNC_ENABLED', value: 'false' },
                // OAuth (client IDs + redirect URIs aligned with FRONTEND_URL)
                { name: 'GOOGLE_OAUTH_CLIENT_ID', value: googleOAuthClientId },
                {
                  name: 'GOOGLE_OAUTH_REDIRECT_URI',
                  value: `${frontendBase}/api/oauth/google/callback`,
                },
                { name: 'YAHOO_OAUTH_CLIENT_ID', value: yahooOAuthClientId },
                {
                  name: 'YAHOO_OAUTH_REDIRECT_URI',
                  value: `${frontendBase}/api/oauth/yahoo/callback`,
                },
                { name: 'OUTLOOK_OAUTH_CLIENT_ID', value: outlookOAuthClientId },
                {
                  name: 'OUTLOOK_OAUTH_REDIRECT_URI',
                  value: `${frontendBase}/api/oauth/outlook/callback`,
                },
              ],
              secrets: [
                {
                  name: 'SUPABASE_SERVICE_ROLE_KEY',
                  valueFrom: supabaseSecretArn,
                },
                { name: 'STRIPE_SECRET_KEY', valueFrom: stripeKeyArn },
                { name: 'STRIPE_WEBHOOK_SECRET', valueFrom: stripeWebhookArn },
                { name: 'INTERNAL_API_TOKEN', valueFrom: internalApiTokenArn },
                { name: 'JWT_SECRET', valueFrom: jwtSigningSecretArn },
                {
                  name: 'GOOGLE_OAUTH_CLIENT_SECRET',
                  valueFrom: googleOAuthClientSecretArn,
                },
                {
                  name: 'YAHOO_OAUTH_CLIENT_SECRET',
                  valueFrom: yahooOAuthClientSecretArn,
                },
                {
                  name: 'OUTLOOK_OAUTH_CLIENT_SECRET',
                  valueFrom: outlookOAuthClientSecretArn,
                },
                {
                  name: 'FIREBASE_SERVICE_ACCOUNT_JSON',
                  valueFrom: firebaseServiceAccountSecretArn,
                },
              ],
              logConfiguration: {
                logDriver: 'awslogs',
                options: {
                  'awslogs-group': `/ecs/${stackName}/backend`,
                  'awslogs-region': region,
                  'awslogs-stream-prefix': 'ecs',
                },
              },
              healthCheck: {
                command: [
                  'CMD-SHELL',
                  'wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1',
                ],
                interval: 30,
                timeout: 5,
                retries: 3,
                startPeriod: 120,
              },
            },
          ]);
        },
      ),
    tags: {
      Name: `${stackName}-backend-task`,
      Environment: environment,
      GitCommitSha: gitCommitSha,
      ContentHash: contentHash,
    },
  },
);

// =============================================================================
// ECS Service - Cost Optimized with Fargate Spot
// =============================================================================

const backendService = new aws.ecs.Service(
  `${stackName}-backend-service`,
  {
    name: `${stackName}-backend`,
    cluster: cluster.arn,
    taskDefinition: backendTaskDefinition.arn,
    desiredCount: 1, // Cost optimization: Single task
    // Use capacity provider strategy for Fargate Spot
    capacityProviderStrategies: [
      {
        capacityProvider: 'FARGATE_SPOT',
        weight: 4,
        base: 0,
      },
      {
        capacityProvider: 'FARGATE',
        weight: 1,
        base: 1, // At least 1 on-demand for reliability
      },
    ],
    networkConfiguration: {
      // Cost optimization: Use public subnets for dev (no NAT needed)
      // Use private subnets for prod (with NAT)
      subnets: isProd ? vpc.privateSubnetIds : vpc.publicSubnetIds,
      securityGroups: [backendSecurityGroup.id],
      assignPublicIp: !isProd, // Public IP for dev (no NAT)
    },
    loadBalancers: [
      {
        targetGroupArn: backendTargetGroup.arn,
        containerName: 'backend',
        containerPort: 4000,
      },
    ],
    healthCheckGracePeriodSeconds: 120,
    enableExecuteCommand: true, // For debugging
    propagateTags: 'SERVICE',
    tags: {
      Name: `${stackName}-backend-service`,
      Environment: environment,
      GitCommitSha: gitCommitSha,
      ContentHash: contentHash,
    },
  },
  {
    dependsOn: [database, capacityProviders],
  },
);

// =============================================================================
// Lambda for Sync Cron Trigger
// =============================================================================

// IAM role for the sync trigger Lambda
const syncLambdaRole = new aws.iam.Role(`${stackName}-sync-lambda-role`, {
  name: `${stackName}-sync-lambda-role`,
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: { Service: 'lambda.amazonaws.com' },
      },
    ],
  }),
  tags: { Name: `${stackName}-sync-lambda-role`, Environment: environment },
});

// Basic Lambda execution policy (CloudWatch Logs)
new aws.iam.RolePolicyAttachment(`${stackName}-sync-lambda-basic-policy`, {
  role: syncLambdaRole.name,
  policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
});

// VPC access policy (if Lambda needs to access VPC resources)
new aws.iam.RolePolicyAttachment(`${stackName}-sync-lambda-vpc-policy`, {
  role: syncLambdaRole.name,
  policyArn:
    'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
});

// CloudWatch Log Group for Lambda
const syncLambdaLogGroup = new aws.cloudwatch.LogGroup(
  `${stackName}-sync-lambda-logs`,
  {
    name: `/aws/lambda/${stackName}-sync-trigger`,
    retentionInDays: 7, // Cost optimization
    tags: { Name: `${stackName}-sync-lambda-logs`, Environment: environment },
  },
);

// The Lambda function
const syncLambda = new aws.lambda.Function(
  `${stackName}-sync-trigger`,
  {
    name: `${stackName}-sync-trigger`,
    role: syncLambdaRole.arn,
    runtime: 'nodejs20.x',
    handler: 'sync-trigger.handler',
    timeout: 30, // 30 seconds should be enough to trigger sync
    memorySize: 128, // Minimal memory needed for HTTP call
    // For initial deployment, use inline code. In CI/CD, this would be replaced with S3 bucket
    code: new pulumi.asset.AssetArchive({
      'sync-trigger.js': new pulumi.asset.StringAsset(`
        // Placeholder Lambda code - replace with actual build in CI/CD
        exports.handler = async (event, context) => {
          const BACKEND_URL = process.env.BACKEND_URL || '';
          const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN || '';
          
          if (!BACKEND_URL || !INTERNAL_API_TOKEN) {
            console.error('Missing configuration');
            return { statusCode: 500, body: 'Missing configuration' };
          }
          
          try {
            const response = await fetch(BACKEND_URL + '/api/internal/trigger-sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Internal-Token': INTERNAL_API_TOKEN,
              },
            });
            const result = await response.json();
            console.log('Sync result:', result);
            return { statusCode: response.status, body: JSON.stringify(result) };
          } catch (error) {
            console.error('Error:', error);
            return { statusCode: 500, body: error.message };
          }
        };
      `),
    }),
    environment: {
      variables: {
        BACKEND_URL: domainName
          ? `https://${domainName}`
          : pulumi.interpolate`https://${frontendDistribution.domainName}`,
        INTERNAL_API_TOKEN: internalApiTokenVersion.secretString.apply(
          (s) => s || '',
        ),
      },
    },
    tags: { Name: `${stackName}-sync-trigger`, Environment: environment },
  },
  { dependsOn: [syncLambdaLogGroup] },
);

// EventBridge rule to trigger Lambda on a schedule (every 15 minutes in prod, every 5 minutes in dev)
const syncScheduleExpression = isProd ? 'rate(15 minutes)' : 'rate(5 minutes)';

const syncScheduleRule = new aws.cloudwatch.EventRule(
  `${stackName}-sync-schedule`,
  {
    name: `${stackName}-sync-schedule`,
    description: 'Trigger email sync Lambda on a schedule',
    scheduleExpression: syncScheduleExpression,
    tags: { Name: `${stackName}-sync-schedule`, Environment: environment },
  },
);

// Target for the EventBridge rule
const syncScheduleTarget = new aws.cloudwatch.EventTarget(
  `${stackName}-sync-schedule-target`,
  {
    rule: syncScheduleRule.name,
    arn: syncLambda.arn,
  },
);

// Permission for EventBridge to invoke Lambda
const syncLambdaPermission = new aws.lambda.Permission(
  `${stackName}-sync-lambda-permission`,
  {
    action: 'lambda:InvokeFunction',
    function: syncLambda.name,
    principal: 'events.amazonaws.com',
    sourceArn: syncScheduleRule.arn,
  },
);

// =============================================================================
// Lambda for Custom Email Processing (SQS → parse → backend API)
// =============================================================================

const customEmailLambdaRole = new aws.iam.Role(
  `${stackName}-custom-email-lambda-role`,
  {
    name: `${stackName}-custom-email-lambda-role`,
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: { Service: 'lambda.amazonaws.com' },
        },
      ],
    }),
    tags: {
      Name: `${stackName}-custom-email-lambda-role`,
      Environment: environment,
    },
  },
);

new aws.iam.RolePolicyAttachment(`${stackName}-custom-email-lambda-basic`, {
  role: customEmailLambdaRole.name,
  policyArn:
    'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
});

// SQS consume permissions
const customEmailSqsPolicy = new aws.iam.Policy(
  `${stackName}-custom-email-sqs-policy`,
  {
    name: `${stackName}-custom-email-sqs-policy`,
    policy: pulumi
      .all([customEmailQueue.arn, customEmailDlq.arn])
      .apply(([queueArn, dlqArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'sqs:ReceiveMessage',
                'sqs:DeleteMessage',
                'sqs:GetQueueAttributes',
              ],
              Resource: [queueArn, dlqArn],
            },
          ],
        }),
      ),
  },
);

new aws.iam.RolePolicyAttachment(`${stackName}-custom-email-lambda-sqs`, {
  role: customEmailLambdaRole.name,
  policyArn: customEmailSqsPolicy.arn,
});

// S3 read permission (download raw emails saved by SES)
const customEmailLambdaS3Policy = new aws.iam.Policy(
  `${stackName}-custom-email-lambda-s3-policy`,
  {
    name: `${stackName}-custom-email-lambda-s3-policy`,
    policy: rawEmailsBucket.arn.apply((arn) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject'],
            Resource: `${arn}/*`,
          },
        ],
      }),
    ),
  },
);

new aws.iam.RolePolicyAttachment(`${stackName}-custom-email-lambda-s3`, {
  role: customEmailLambdaRole.name,
  policyArn: customEmailLambdaS3Policy.arn,
});

const customEmailLambdaLogGroup = new aws.cloudwatch.LogGroup(
  `${stackName}-custom-email-lambda-logs`,
  {
    name: `/aws/lambda/${stackName}-custom-email-processor`,
    retentionInDays: 7,
    tags: {
      Name: `${stackName}-custom-email-lambda-logs`,
      Environment: environment,
    },
  },
);

const customEmailLambda = new aws.lambda.Function(
  `${stackName}-custom-email-processor`,
  {
    name: `${stackName}-custom-email-processor`,
    role: customEmailLambdaRole.arn,
    runtime: 'nodejs20.x',
    handler: 'custom-email-processor.handler',
    timeout: 120,
    memorySize: 256,
    // Placeholder – CI/CD replaces with bundled code from backend/lambda/
    code: new pulumi.asset.AssetArchive({
      'custom-email-processor.js': new pulumi.asset.StringAsset(`
        const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

        exports.handler = async (event) => {
          const BACKEND_URL = process.env.BACKEND_URL || '';
          const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN || '';

          if (!BACKEND_URL || !INTERNAL_API_TOKEN) {
            console.error('Missing BACKEND_URL or INTERNAL_API_TOKEN');
            return { statusCode: 500, body: 'Missing configuration' };
          }

          const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
          const results = [];

          for (const record of event.Records) {
            try {
              const snsMessage = JSON.parse(record.body);
              const sesNotification = JSON.parse(snsMessage.Message);

              const receipt = sesNotification.receipt || {};
              const action = receipt.action || {};
              const bucketName = action.bucketName;
              const objectKey = action.objectKey;
              const recipients = receipt.recipients || [];

              if (!bucketName || !objectKey) {
                console.error('Missing S3 location in SES notification');
                continue;
              }

              const s3Resp = await s3.send(
                new GetObjectCommand({ Bucket: bucketName, Key: objectKey }),
              );
              const chunks = [];
              for await (const chunk of s3Resp.Body) { chunks.push(chunk); }
              const rawEmailBase64 = Buffer.concat(chunks).toString('base64');

              for (const recipientAddress of recipients) {
                const resp = await fetch(
                  BACKEND_URL + '/api/internal/new-custom-email',
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'X-Internal-Token': INTERNAL_API_TOKEN,
                    },
                    body: JSON.stringify({ rawEmail: rawEmailBase64, recipientAddress }),
                  },
                );
                const result = await resp.json();
                console.log('Processed', recipientAddress, result);
                results.push(result);
              }
            } catch (error) {
              console.error('Error processing record:', error);
              throw error;
            }
          }

          return { statusCode: 200, processed: results.length };
        };
      `),
    }),
    environment: {
      variables: {
        BACKEND_URL: domainName
          ? `https://${domainName}`
          : pulumi.interpolate`https://${frontendDistribution.domainName}`,
        INTERNAL_API_TOKEN: internalApiTokenVersion.secretString.apply(
          (s) => s || '',
        ),
      },
    },
    tags: {
      Name: `${stackName}-custom-email-processor`,
      Environment: environment,
    },
  },
  { dependsOn: [customEmailLambdaLogGroup] },
);

// SQS event source mapping → Lambda
new aws.lambda.EventSourceMapping(
  `${stackName}-custom-email-event-source`,
  {
    eventSourceArn: customEmailQueue.arn,
    functionName: customEmailLambda.name,
    batchSize: 5,
    maximumBatchingWindowInSeconds: 10,
    functionResponseTypes: ['ReportBatchItemFailures'],
  },
);

// =============================================================================
// Outputs
// =============================================================================

export const vpcId = vpc.vpcId;
export const backendApiUrl = domainName
  ? `https://${domainName}`
  : pulumi.interpolate`https://${frontendDistribution.domainName}`;
export const frontendUrl = domainName
  ? `https://${domainName}`
  : pulumi.interpolate`https://${frontendDistribution.domainName}`;
export const cloudfrontDomain = frontendDistribution.domainName;
export const customDomain = domainName;
export const frontendBucketName = frontendBucket.bucket;
export const frontendDistributionId = frontendDistribution.id;
export const backendRepoUrl = backendRepo.repositoryUrl;
export const databaseEndpoint = database.endpoint;
export const databaseAddress = database.address;
export const clusterArn = cluster.arn;
export const attachmentsBucketName = attachmentsBucket.bucket;
export const emailBodiesBucketName = emailBodiesBucket.bucket;
export const backendLogGroupName = backendLogGroup.name;
export const albDnsName = alb.dnsName;
export const syncLambdaArn = syncLambda.arn;
export const syncLambdaName = syncLambda.name;
export const rawEmailsBucketName = rawEmailsBucket.bucket;
export const customEmailQueueUrl = customEmailQueue.url;
export const customEmailLambdaArn = customEmailLambda.arn;
export const customEmailLambdaName = customEmailLambda.name;
export const sesReceiptRuleSetName = sesReceiptRuleSet.ruleSetName;
