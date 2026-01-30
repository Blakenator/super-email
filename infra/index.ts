import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

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

// S3 policy for attachments
const s3Policy = new aws.iam.Policy(`${stackName}-s3-policy`, {
  name: `${stackName}-s3-policy`,
  policy: attachmentsBucket.arn.apply((arn) =>
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
          Resource: [arn, `${arn}/*`],
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

// =============================================================================
// ECS Task Definition
// =============================================================================

const backendTaskDefinition = new aws.ecs.TaskDefinition(
  `${stackName}-backend-task`,
  {
    family: `${stackName}-backend`,
    networkMode: 'awsvpc',
    requiresCompatibilities: ['FARGATE'],
    cpu: '256',
    memory: '512',
    executionRoleArn: taskExecutionRole.arn,
    taskRoleArn: taskRole.arn,
    containerDefinitions: pulumi
      .output({
        repoUrl: backendRepo.repositoryUrl,
        dbHost: database.address,
        dbPort: database.port,
        dbPass: dbPassword,
        bucketName: attachmentsBucket.bucket,
        region: currentRegion.name,
        supabaseSecretArn: supabaseServiceSecretVersion.arn,
        stripeKeyArn: stripeKeySecretVersion.arn,
        stripeWebhookArn: stripeWebhookSecretVersion.arn,
        internalApiTokenArn: internalApiTokenVersion.arn,
      })
      .apply(
        ({
          repoUrl,
          dbHost,
          dbPort,
          dbPass,
          bucketName,
          region,
          supabaseSecretArn,
          stripeKeyArn,
          stripeWebhookArn,
          internalApiTokenArn,
        }) =>
          JSON.stringify([
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
                { name: 'AWS_REGION', value: region },
                { name: 'SECRETS_BASE_PATH', value: 'email-client' },
                { name: 'SUPABASE_URL', value: supabaseUrl },
                { name: 'SUPABASE_ANON_KEY', value: supabaseAnonKey },
                { name: 'STRIPE_PUBLISHABLE_KEY', value: stripePublishableKey },
                // Stripe price IDs for subscription tiers
                { name: 'STRIPE_PRICE_STORAGE_BASIC', value: stripePriceStorageBasic },
                { name: 'STRIPE_PRICE_STORAGE_PRO', value: stripePriceStoragePro },
                { name: 'STRIPE_PRICE_STORAGE_ENTERPRISE', value: stripePriceStorageEnterprise },
                { name: 'STRIPE_PRICE_ACCOUNTS_BASIC', value: stripePriceAccountsBasic },
                { name: 'STRIPE_PRICE_ACCOUNTS_PRO', value: stripePriceAccountsPro },
                { name: 'STRIPE_PRICE_ACCOUNTS_ENTERPRISE', value: stripePriceAccountsEnterprise },
                // Disable in-process background sync - Lambda handles this
                { name: 'BACKGROUND_SYNC_ENABLED', value: 'false' },
              ],
              secrets: [
                {
                  name: 'SUPABASE_SERVICE_ROLE_KEY',
                  valueFrom: supabaseSecretArn,
                },
                { name: 'STRIPE_SECRET_KEY', valueFrom: stripeKeyArn },
                { name: 'STRIPE_WEBHOOK_SECRET', valueFrom: stripeWebhookArn },
                { name: 'INTERNAL_API_TOKEN', valueFrom: internalApiTokenArn },
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
                startPeriod: 60,
              },
            },
          ]),
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
// Application Load Balancer
// =============================================================================

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
    path: '/api/health', // Fixed: Use correct health endpoint
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
// CloudFront CDN
// =============================================================================

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

    viewerCertificate: {
      cloudfrontDefaultCertificate: true,
    },

    tags: { Name: `${stackName}-cdn`, Environment: environment },
  },
  { dependsOn: [alb, frontendBucketPolicy] },
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
        // Use CloudFront URL to reach the backend via /api/* path
        BACKEND_URL: pulumi.interpolate`https://${frontendDistribution.domainName}`,
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
// Outputs
// =============================================================================

export const vpcId = vpc.vpcId;
export const backendApiUrl = pulumi.interpolate`https://${frontendDistribution.domainName}`;
export const frontendUrl = pulumi.interpolate`https://${frontendDistribution.domainName}`;
export const cloudfrontDomain = frontendDistribution.domainName;
export const frontendBucketName = frontendBucket.bucket;
export const frontendDistributionId = frontendDistribution.id;
export const backendRepoUrl = backendRepo.repositoryUrl;
export const databaseEndpoint = database.endpoint;
export const databaseAddress = database.address;
export const clusterArn = cluster.arn;
export const attachmentsBucketName = attachmentsBucket.bucket;
export const backendLogGroupName = backendLogGroup.name;
export const albDnsName = alb.dnsName;
export const syncLambdaArn = syncLambda.arn;
export const syncLambdaName = syncLambda.name;
