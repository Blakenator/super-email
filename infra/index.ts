import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

// Configuration
const config = new pulumi.Config();
const environment = config.require('environment');
const dbInstanceClass = config.get('dbInstanceClass') || 'db.t3.micro';

const stackName = `email-client-${environment}`;

// Get current AWS region (needed early for VPC endpoints)
const currentRegion = aws.getRegionOutput({});

// =============================================================================
// VPC and Networking
// =============================================================================

const vpc = new awsx.ec2.Vpc(`${stackName}-vpc`, {
  cidrBlock: '10.0.0.0/16',
  numberOfAvailabilityZones: 2,
  enableDnsHostnames: true,
  enableDnsSupport: true,
  natGateways: {
    strategy: environment === 'prod' ? 'OnePerAz' : 'Single', // NAT Gateway for private subnet internet access
  },
  tags: {
    Name: `${stackName}-vpc`,
    Environment: environment,
  },
});

// =============================================================================
// VPC Endpoints for ECR and S3 (allows Fargate to pull images without NAT)
// =============================================================================

// Security group for VPC endpoints
const vpcEndpointSecurityGroup = new aws.ec2.SecurityGroup(`${stackName}-vpce-sg`, {
  vpcId: vpc.vpcId,
  description: 'Security group for VPC endpoints',
  ingress: [
    {
      description: 'HTTPS from VPC',
      fromPort: 443,
      toPort: 443,
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
    Name: `${stackName}-vpce-sg`,
    Environment: environment,
  },
});

// Get private subnet route tables for S3 gateway endpoint
const privateRouteTables = vpc.privateSubnetIds.apply(async (subnetIds) => {
  const routeTableIds: string[] = [];
  for (const subnetId of subnetIds) {
    const rt = await aws.ec2.getRouteTable({ subnetId });
    routeTableIds.push(rt.routeTableId);
  }
  return routeTableIds;
});

// S3 Gateway endpoint (free, for pulling container layers)
const s3Endpoint = new aws.ec2.VpcEndpoint(`${stackName}-s3-endpoint`, {
  vpcId: vpc.vpcId,
  serviceName: pulumi.interpolate`com.amazonaws.${currentRegion.name}.s3`,
  vpcEndpointType: 'Gateway',
  routeTableIds: privateRouteTables,
  tags: {
    Name: `${stackName}-s3-endpoint`,
    Environment: environment,
  },
});

// ECR API endpoint (for docker login, manifest fetching)
const ecrApiEndpoint = new aws.ec2.VpcEndpoint(`${stackName}-ecr-api-endpoint`, {
  vpcId: vpc.vpcId,
  serviceName: pulumi.interpolate`com.amazonaws.${currentRegion.name}.ecr.api`,
  vpcEndpointType: 'Interface',
  subnetIds: vpc.privateSubnetIds,
  securityGroupIds: [vpcEndpointSecurityGroup.id],
  privateDnsEnabled: true,
  tags: {
    Name: `${stackName}-ecr-api-endpoint`,
    Environment: environment,
  },
});

// ECR Docker endpoint (for pulling layers)
const ecrDkrEndpoint = new aws.ec2.VpcEndpoint(`${stackName}-ecr-dkr-endpoint`, {
  vpcId: vpc.vpcId,
  serviceName: pulumi.interpolate`com.amazonaws.${currentRegion.name}.ecr.dkr`,
  vpcEndpointType: 'Interface',
  subnetIds: vpc.privateSubnetIds,
  securityGroupIds: [vpcEndpointSecurityGroup.id],
  privateDnsEnabled: true,
  tags: {
    Name: `${stackName}-ecr-dkr-endpoint`,
    Environment: environment,
  },
});

// CloudWatch Logs endpoint (for sending logs)
const logsEndpoint = new aws.ec2.VpcEndpoint(`${stackName}-logs-endpoint`, {
  vpcId: vpc.vpcId,
  serviceName: pulumi.interpolate`com.amazonaws.${currentRegion.name}.logs`,
  vpcEndpointType: 'Interface',
  subnetIds: vpc.privateSubnetIds,
  securityGroupIds: [vpcEndpointSecurityGroup.id],
  privateDnsEnabled: true,
  tags: {
    Name: `${stackName}-logs-endpoint`,
    Environment: environment,
  },
});

// Secrets Manager endpoint (for fetching secrets)
const secretsEndpoint = new aws.ec2.VpcEndpoint(`${stackName}-secrets-endpoint`, {
  vpcId: vpc.vpcId,
  serviceName: pulumi.interpolate`com.amazonaws.${currentRegion.name}.secretsmanager`,
  vpcEndpointType: 'Interface',
  subnetIds: vpc.privateSubnetIds,
  securityGroupIds: [vpcEndpointSecurityGroup.id],
  privateDnsEnabled: true,
  tags: {
    Name: `${stackName}-secrets-endpoint`,
    Environment: environment,
  },
});

// Security group for the backend ECS service
const backendSecurityGroup = new aws.ec2.SecurityGroup(`${stackName}-backend-sg`, {
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
});

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
// RDS PostgreSQL Database
// =============================================================================

const dbSubnetGroup = new aws.rds.SubnetGroup(`${stackName}-db-subnet-group`, {
  subnetIds: vpc.privateSubnetIds,
  tags: {
    Name: `${stackName}-db-subnet-group`,
    Environment: environment,
  },
});

// Generate random password for database using AWS Secrets Manager
const dbPasswordSecret = new aws.secretsmanager.Secret(`${stackName}-db-password`, {
  name: `${stackName}/database-password`,
  description: 'Database password for Email Client',
  recoveryWindowInDays: 0, // Allow immediate deletion on stack destroy
  tags: {
    Name: `${stackName}-db-password`,
    Environment: environment,
  },
});

// Generate a random password only on first creation
// Use ignoreChanges to prevent regeneration on subsequent updates
const dbPasswordVersion = new aws.secretsmanager.SecretVersion(`${stackName}-db-password-version`, {
  secretId: dbPasswordSecret.id,
  secretString: pulumi.output(aws.secretsmanager.getRandomPassword({
    passwordLength: 32,
    excludePunctuation: true,
  })).apply(p => p.randomPassword),
}, {
  ignoreChanges: ['secretString'], // Don't regenerate password on updates
});

// Ensure dbPassword is always a string (not undefined)
// Since we're generating the password, it will always exist, but TypeScript needs this assertion
const dbPassword = dbPasswordVersion.secretString.apply(pwd => {
  if (!pwd) {
    throw new Error('Database password was not generated');
  }
  return pwd;
});

const database = new aws.rds.Instance(`${stackName}-db`, {
  identifier: `${stackName}-postgres`,
  engine: 'postgres',
  engineVersion: '15',
  instanceClass: dbInstanceClass,
  allocatedStorage: 20,
  maxAllocatedStorage: 100,
  storageType: 'gp3',
  dbName: 'emailclient',
  username: 'emailclient',
  password: dbPassword,
  dbSubnetGroupName: dbSubnetGroup.name,
  vpcSecurityGroupIds: [rdsSecurityGroup.id],
  multiAz: environment === 'prod',
  publiclyAccessible: false,
  skipFinalSnapshot: environment !== 'prod',
  finalSnapshotIdentifier: environment === 'prod' ? `${stackName}-final-snapshot` : undefined,
  backupRetentionPeriod: environment === 'prod' ? 7 : 1,
  deletionProtection: environment === 'prod',
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
  versioning: {
    enabled: false,
  },
  serverSideEncryptionConfiguration: {
    rule: {
      applyServerSideEncryptionByDefault: {
        sseAlgorithm: 'AES256',
      },
    },
  },
  lifecycleRules: [
    {
      id: 'transition-to-infrequent-access',
      enabled: true,
      transitions: [
        {
          days: 30,
          storageClass: 'STANDARD_IA',
        },
        {
          days: 90,
          storageClass: 'GLACIER',
        },
        {
          days: 180,
          storageClass: 'DEEP_ARCHIVE',
        },
      ],
    },
  ],
  tags: {
    Name: `${stackName}-attachments`,
    Environment: environment,
  },
});

// Block all public access to attachments bucket
new aws.s3.BucketPublicAccessBlock(`${stackName}-attachments-public-access-block`, {
  bucket: attachmentsBucket.id,
  blockPublicAcls: true,
  blockPublicPolicy: true,
  ignorePublicAcls: true,
  restrictPublicBuckets: true,
});

// CORS configuration for attachments bucket
new aws.s3.BucketCorsConfigurationV2(`${stackName}-attachments-cors`, {
  bucket: attachmentsBucket.id,
  corsRules: [
    {
      allowedHeaders: ['*'],
      allowedMethods: ['GET', 'PUT', 'POST'],
      allowedOrigins: ['*'], // TODO: Restrict to your domain in production
      exposeHeaders: ['ETag'],
      maxAgeSeconds: 3000,
    },
  ],
});

// =============================================================================
// S3 Bucket for Frontend Static Files + CloudFront CDN
// =============================================================================

const frontendBucket = new aws.s3.BucketV2(`${stackName}-frontend`, {
  bucket: `${stackName}-frontend`,
  tags: {
    Name: `${stackName}-frontend`,
    Environment: environment,
  },
});

// Block public access - but allow CloudFront OAC via bucket policy
new aws.s3.BucketPublicAccessBlock(`${stackName}-frontend-public-access-block`, {
  bucket: frontendBucket.id,
  blockPublicAcls: true,
  blockPublicPolicy: false, // Allow bucket policy for CloudFront
  ignorePublicAcls: true,
  restrictPublicBuckets: false, // Allow service principal access
});

// CloudFront Origin Access Control for S3
const frontendOAC = new aws.cloudfront.OriginAccessControl(`${stackName}-frontend-oac`, {
  name: `${stackName}-frontend-oac`,
  description: 'OAC for frontend S3 bucket',
  originAccessControlOriginType: 's3',
  signingBehavior: 'always',
  signingProtocol: 'sigv4',
});

// CloudFront distribution for frontend
const frontendDistribution = new aws.cloudfront.Distribution(`${stackName}-frontend-cdn`, {
  enabled: true,
  isIpv6Enabled: true,
  defaultRootObject: 'index.html',
  httpVersion: 'http2and3',
  priceClass: 'PriceClass_100', // US, Canada, Europe

  origins: [
    {
      domainName: frontendBucket.bucketRegionalDomainName,
      originId: 'S3Origin',
      originAccessControlId: frontendOAC.id,
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

  // SPA routing - return index.html for 404s (client-side routing)
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
    geoRestriction: {
      restrictionType: 'none',
    },
  },

  viewerCertificate: {
    cloudfrontDefaultCertificate: true,
  },

  tags: {
    Name: `${stackName}-frontend-cdn`,
    Environment: environment,
  },
});

// S3 bucket policy to allow CloudFront access
const frontendBucketPolicy = new aws.s3.BucketPolicy(`${stackName}-frontend-bucket-policy`, {
  bucket: frontendBucket.id,
  policy: pulumi.all([frontendBucket.arn, frontendDistribution.arn]).apply(([bucketArn, distArn]) =>
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'AllowCloudFrontServicePrincipal',
          Effect: 'Allow',
          Principal: {
            Service: 'cloudfront.amazonaws.com',
          },
          Action: 's3:GetObject',
          Resource: `${bucketArn}/*`,
          Condition: {
            StringEquals: {
              'AWS:SourceArn': distArn,
            },
          },
        },
      ],
    })
  ),
});

// =============================================================================
// ECR Repository (Backend only)
// =============================================================================

const backendRepo = new aws.ecr.Repository(`${stackName}-backend`, {
  name: `${stackName}-backend`,
  imageTagMutability: 'MUTABLE',
  imageScanningConfiguration: {
    scanOnPush: true,
  },
  tags: {
    Name: `${stackName}-backend`,
    Environment: environment,
  },
});

// ECR lifecycle policy to keep only last 10 images
new aws.ecr.LifecyclePolicy(`${stackName}-backend-lifecycle`, {
  repository: backendRepo.name,
  policy: JSON.stringify({
    rules: [
      {
        rulePriority: 1,
        description: 'Keep last 10 images',
        selection: {
          tagStatus: 'any',
          countType: 'imageCountMoreThan',
          countNumber: 10,
        },
        action: {
          type: 'expire',
        },
      },
    ],
  }),
});

// =============================================================================
// ECS Cluster and Backend Service
// =============================================================================

const cluster = new aws.ecs.Cluster(`${stackName}-cluster`, {
  name: `${stackName}-cluster`,
  settings: [
    {
      name: 'containerInsights',
      value: 'enabled',
    },
  ],
  tags: {
    Name: `${stackName}-cluster`,
    Environment: environment,
  },
});

// IAM role for ECS task execution
const taskExecutionRole = new aws.iam.Role(`${stackName}-task-exec-role`, {
  name: `${stackName}-task-exec-role`,
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: 'ecs-tasks.amazonaws.com',
        },
      },
    ],
  }),
  tags: {
    Name: `${stackName}-task-exec-role`,
    Environment: environment,
  },
});

new aws.iam.RolePolicyAttachment(`${stackName}-task-exec-policy`, {
  role: taskExecutionRole.name,
  policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
});

// IAM role for ECS tasks
const taskRole = new aws.iam.Role(`${stackName}-task-role`, {
  name: `${stackName}-task-role`,
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: 'ecs-tasks.amazonaws.com',
        },
      },
    ],
  }),
  tags: {
    Name: `${stackName}-task-role`,
    Environment: environment,
  },
});

// Policy for S3 attachments bucket access
const s3AttachmentsPolicy = new aws.iam.Policy(`${stackName}-s3-attachments-policy`, {
  name: `${stackName}-s3-attachments-policy`,
  description: 'Policy for accessing email attachments S3 bucket',
  policy: attachmentsBucket.arn.apply((bucketArn) => JSON.stringify({
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
        Resource: [
          bucketArn,
          `${bucketArn}/*`,
        ],
      },
    ],
  })),
  tags: {
    Name: `${stackName}-s3-attachments-policy`,
    Environment: environment,
  },
});

// Attach S3 policy to task role
new aws.iam.RolePolicyAttachment(`${stackName}-task-s3-policy`, {
  role: taskRole.name,
  policyArn: s3AttachmentsPolicy.arn,
});

// Policy for Secrets Manager access (IMAP/SMTP credentials)
const secretsManagerPolicy = new aws.iam.Policy(`${stackName}-secrets-policy`, {
  name: `${stackName}-secrets-policy`,
  description: 'Policy for accessing email credentials in Secrets Manager',
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
        ],
        Resource: [
          `arn:aws:secretsmanager:*:*:secret:email-client/*`,
        ],
      },
    ],
  }),
  tags: {
    Name: `${stackName}-secrets-policy`,
    Environment: environment,
  },
});

// Attach Secrets Manager policy to task role
new aws.iam.RolePolicyAttachment(`${stackName}-task-secrets-policy`, {
  role: taskRole.name,
  policyArn: secretsManagerPolicy.arn,
});

// CloudWatch Log Groups
const backendLogGroup = new aws.cloudwatch.LogGroup(`${stackName}-backend-logs`, {
  name: `/ecs/${stackName}/backend`,
  retentionInDays: 30,
  tags: {
    Name: `${stackName}-backend-logs`,
    Environment: environment,
  },
});

// Backend Task Definition
const backendTaskDefinition = new aws.ecs.TaskDefinition(`${stackName}-backend-task`, {
  family: `${stackName}-backend`,
  networkMode: 'awsvpc',
  requiresCompatibilities: ['FARGATE'],
  cpu: '256',
  memory: '512',
  executionRoleArn: taskExecutionRole.arn,
  taskRoleArn: taskRole.arn,
  containerDefinitions: pulumi.all([
    backendRepo.repositoryUrl,
    database.address,
    database.port,
    dbPassword,
    attachmentsBucket.bucket,
    currentRegion.name,
  ]).apply(([repoUrl, dbHost, dbPort, dbPass, bucketName, region]) => JSON.stringify([
    {
      name: 'backend',
      image: `${repoUrl}:latest`,
      essential: true,
      portMappings: [
        {
          containerPort: 4000,
          protocol: 'tcp',
        },
      ],
      environment: [
        { name: 'NODE_ENV', value: 'production' },
        { name: 'LOG_LEVEL', value: 'info' },
        { name: 'DB_HOST', value: dbHost },
        { name: 'DB_PORT', value: String(dbPort) },
        { name: 'DB_NAME', value: 'emailclient' },
        { name: 'DB_USER', value: 'emailclient' },
        { name: 'DB_PASSWORD', value: dbPass },
        { name: 'PORT', value: '4000' },
        { name: 'ATTACHMENTS_S3_BUCKET', value: bucketName },
        { name: 'AWS_REGION', value: region },
        { name: 'SECRETS_BASE_PATH', value: 'email-client' },
        // Supabase config - TODO: Move to Secrets Manager in production
        { name: 'SUPABASE_URL', value: 'https://ivqyyttllhpwbducgpih.supabase.co' },
        { name: 'SUPABASE_ANON_KEY', value: 'sb_publishable_jcR4C-0t6ibdL5010_bLMg_-0xxL61F' },
        { name: 'SUPABASE_SERVICE_ROLE_KEY', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2cXl5dHRsbGhwd2JkdWNncGloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzQyMDg5MCwiZXhwIjoyMDUyOTk2ODkwfQ.vBBqCSy-AqAJyPWE0QlZzP1JJHGvJ-_a_P-9l-cZuFo' },
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
        command: ['CMD-SHELL', 'wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1'],
        interval: 30,
        timeout: 5,
        retries: 3,
        startPeriod: 60,
      },
    },
  ])),
  tags: {
    Name: `${stackName}-backend-task`,
    Environment: environment,
  },
});

// =============================================================================
// Application Load Balancer (Backend API only)
// =============================================================================

const alb = new aws.lb.LoadBalancer(`${stackName}-alb`, {
  name: `${stackName}-alb`,
  internal: false,
  loadBalancerType: 'application',
  securityGroups: [albSecurityGroup.id],
  subnets: vpc.publicSubnetIds,
  enableDeletionProtection: environment === 'prod',
  tags: {
    Name: `${stackName}-alb`,
    Environment: environment,
  },
});

// Target group for backend
const backendTargetGroup = new aws.lb.TargetGroup(`${stackName}-backend-tg`, {
  name: `${stackName}-backend-tg`,
  port: 4000,
  protocol: 'HTTP',
  vpcId: vpc.vpcId,
  targetType: 'ip',
  healthCheck: {
    enabled: true,
    path: '/health',
    port: 'traffic-port',
    protocol: 'HTTP',
    healthyThreshold: 2,
    unhealthyThreshold: 3,
    timeout: 5,
    interval: 30,
    matcher: '200',
  },
  tags: {
    Name: `${stackName}-backend-tg`,
    Environment: environment,
  },
});

// ALB Listener
const httpListener = new aws.lb.Listener(`${stackName}-http-listener`, {
  loadBalancerArn: alb.arn,
  port: 80,
  protocol: 'HTTP',
  defaultActions: [
    {
      type: 'forward',
      targetGroupArn: backendTargetGroup.arn,
    },
  ],
});

// =============================================================================
// ECS Backend Service
// =============================================================================

const backendService = new aws.ecs.Service(`${stackName}-backend-service`, {
  name: `${stackName}-backend`,
  cluster: cluster.arn,
  taskDefinition: backendTaskDefinition.arn,
  desiredCount: environment === 'prod' ? 2 : 1,
  launchType: 'FARGATE',
  networkConfiguration: {
    subnets: vpc.privateSubnetIds,
    securityGroups: [backendSecurityGroup.id],
    assignPublicIp: false,
  },
  loadBalancers: [
    {
      targetGroupArn: backendTargetGroup.arn,
      containerName: 'backend',
      containerPort: 4000,
    },
  ],
  healthCheckGracePeriodSeconds: 60, // Give time for DB connection
  deploymentConfiguration: {
    minimumHealthyPercent: 50,
    maximumPercent: 200,
  },
  tags: {
    Name: `${stackName}-backend-service`,
    Environment: environment,
  },
}, {
  dependsOn: [database, ecrApiEndpoint, ecrDkrEndpoint, s3Endpoint, logsEndpoint], // Wait for VPC endpoints and DB
});

// =============================================================================
// Outputs
// =============================================================================

export const vpcId = vpc.vpcId;
export const backendApiUrl = pulumi.interpolate`http://${alb.dnsName}`;
export const frontendUrl = pulumi.interpolate`https://${frontendDistribution.domainName}`;
export const frontendBucketName = frontendBucket.bucket;
export const frontendDistributionId = frontendDistribution.id;
export const backendRepoUrl = backendRepo.repositoryUrl;
export const databaseEndpoint = database.endpoint;
export const databaseAddress = database.address;
export const clusterArn = cluster.arn;
export const attachmentsBucketName = attachmentsBucket.bucket;
export const attachmentsBucketArn = attachmentsBucket.arn;
