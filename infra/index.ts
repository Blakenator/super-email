import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// =============================================================================
// COST-OPTIMIZED ARCHITECTURE FOR BOOTSTRAPPED PROJECTS
// =============================================================================
// Total estimated cost: ~$25-35/month
//
// Components:
// - EC2 t4g.nano (ARM): ~$3/month
// - RDS t4g.micro: ~$13/month
// - CloudFront: ~$1-5/month (low traffic)
// - S3: ~$1-5/month
// - Elastic IP: FREE (when attached)
// - Secrets Manager: ~$1/month
//
// What we removed (savings ~$100/month):
// - NAT Gateway: $45-90/month
// - ALB: $16-20/month
// - VPC Endpoints: $28/month
// - ECS Fargate: $10-15/month
// =============================================================================

// Configuration
const config = new pulumi.Config();
const environment = config.require('environment');
const dbInstanceClass = config.get('dbInstanceClass') || 'db.t4g.micro';

// Supabase configuration
const supabaseUrl = config.require('supabaseUrl');
const supabaseAnonKey = config.require('supabaseAnonKey');
const supabaseServiceRoleKey = config.requireSecret('supabaseServiceRoleKey');

const stackName = `email-client-${environment}`;
const currentRegion = aws.getRegionOutput({});

// =============================================================================
// VPC - Simple setup with public subnets only (no NAT needed)
// =============================================================================

const vpc = new aws.ec2.Vpc(`${stackName}-vpc`, {
  cidrBlock: '10.0.0.0/16',
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: {
    Name: `${stackName}-vpc`,
    Environment: environment,
  },
});

// Internet Gateway
const igw = new aws.ec2.InternetGateway(`${stackName}-igw`, {
  vpcId: vpc.id,
  tags: {
    Name: `${stackName}-igw`,
    Environment: environment,
  },
});

// Public subnets (2 AZs for RDS requirement)
const availabilityZones = aws.getAvailabilityZones({ state: 'available' });

const publicSubnet1 = new aws.ec2.Subnet(`${stackName}-public-1`, {
  vpcId: vpc.id,
  cidrBlock: '10.0.1.0/24',
  availabilityZone: availabilityZones.then(azs => azs.names[0]),
  mapPublicIpOnLaunch: true,
  tags: {
    Name: `${stackName}-public-1`,
    Environment: environment,
  },
});

const publicSubnet2 = new aws.ec2.Subnet(`${stackName}-public-2`, {
  vpcId: vpc.id,
  cidrBlock: '10.0.2.0/24',
  availabilityZone: availabilityZones.then(azs => azs.names[1]),
  mapPublicIpOnLaunch: true,
  tags: {
    Name: `${stackName}-public-2`,
    Environment: environment,
  },
});

// Route table for public subnets
const publicRouteTable = new aws.ec2.RouteTable(`${stackName}-public-rt`, {
  vpcId: vpc.id,
  routes: [
    {
      cidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    },
  ],
  tags: {
    Name: `${stackName}-public-rt`,
    Environment: environment,
  },
});

new aws.ec2.RouteTableAssociation(`${stackName}-public-rta-1`, {
  subnetId: publicSubnet1.id,
  routeTableId: publicRouteTable.id,
});

new aws.ec2.RouteTableAssociation(`${stackName}-public-rta-2`, {
  subnetId: publicSubnet2.id,
  routeTableId: publicRouteTable.id,
});

// =============================================================================
// Security Groups
// =============================================================================

// Security group for EC2 backend
const backendSecurityGroup = new aws.ec2.SecurityGroup(`${stackName}-backend-sg`, {
  vpcId: vpc.id,
  description: 'Security group for backend EC2 instance',
  ingress: [
    {
      description: 'HTTP from anywhere (CloudFront)',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
    },
    {
      description: 'Backend API port',
      fromPort: 4000,
      toPort: 4000,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
    },
    {
      description: 'SSH for debugging',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'], // TODO: Restrict to your IP in production
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
  vpcId: vpc.id,
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

// =============================================================================
// RDS PostgreSQL Database
// =============================================================================

const dbSubnetGroup = new aws.rds.SubnetGroup(`${stackName}-db-subnet-group`, {
  subnetIds: [publicSubnet1.id, publicSubnet2.id],
  tags: {
    Name: `${stackName}-db-subnet-group`,
    Environment: environment,
  },
});

// Database password in Secrets Manager
const dbPasswordSecret = new aws.secretsmanager.Secret(`${stackName}-db-password`, {
  name: `${stackName}/database-password`,
  description: 'Database password for Email Client',
  recoveryWindowInDays: 0,
  tags: {
    Name: `${stackName}-db-password`,
    Environment: environment,
  },
});

const dbPasswordVersion = new aws.secretsmanager.SecretVersion(`${stackName}-db-password-version`, {
  secretId: dbPasswordSecret.id,
  secretString: pulumi.output(aws.secretsmanager.getRandomPassword({
    passwordLength: 32,
    excludePunctuation: true,
  })).apply(p => p.randomPassword),
}, {
  ignoreChanges: ['secretString'],
});

const dbPassword = dbPasswordVersion.secretString.apply(pwd => {
  if (!pwd) throw new Error('Database password was not generated');
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
  multiAz: false, // Single AZ for cost savings
  publiclyAccessible: false,
  skipFinalSnapshot: true,
  backupRetentionPeriod: 1, // Minimal backups
  deletionProtection: false,
  tags: {
    Name: `${stackName}-postgres`,
    Environment: environment,
  },
});

// =============================================================================
// S3 Buckets
// =============================================================================

// Attachments bucket
const attachmentsBucket = new aws.s3.Bucket(`${stackName}-attachments`, {
  bucket: `${stackName}-attachments`,
  acl: 'private',
  serverSideEncryptionConfiguration: {
    rule: {
      applyServerSideEncryptionByDefault: {
        sseAlgorithm: 'AES256',
      },
    },
  },
  lifecycleRules: [
    {
      id: 'archive-old-attachments',
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

new aws.s3.BucketPublicAccessBlock(`${stackName}-attachments-public-block`, {
  bucket: attachmentsBucket.id,
  blockPublicAcls: true,
  blockPublicPolicy: true,
  ignorePublicAcls: true,
  restrictPublicBuckets: true,
});

// Frontend bucket
const frontendBucket = new aws.s3.BucketV2(`${stackName}-frontend`, {
  bucket: `${stackName}-frontend`,
  tags: {
    Name: `${stackName}-frontend`,
    Environment: environment,
  },
});

const frontendPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(`${stackName}-frontend-public-block`, {
  bucket: frontendBucket.id,
  blockPublicAcls: false,
  blockPublicPolicy: false,
  ignorePublicAcls: false,
  restrictPublicBuckets: false,
});

new aws.s3.BucketPolicy(`${stackName}-frontend-policy`, {
  bucket: frontendBucket.id,
  policy: frontendBucket.arn.apply(arn => JSON.stringify({
    Version: '2012-10-17',
    Statement: [{
      Sid: 'PublicRead',
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:GetObject',
      Resource: `${arn}/*`,
    }],
  })),
}, {
  dependsOn: [frontendPublicAccessBlock],
});

// =============================================================================
// ECR Repository
// =============================================================================

const backendRepo = new aws.ecr.Repository(`${stackName}-backend`, {
  name: `${stackName}-backend`,
  imageTagMutability: 'MUTABLE',
  imageScanningConfiguration: { scanOnPush: false }, // Disable to save a tiny bit
  tags: {
    Name: `${stackName}-backend`,
    Environment: environment,
  },
});

new aws.ecr.LifecyclePolicy(`${stackName}-backend-lifecycle`, {
  repository: backendRepo.name,
  policy: JSON.stringify({
    rules: [{
      rulePriority: 1,
      description: 'Keep last 5 images',
      selection: {
        tagStatus: 'any',
        countType: 'imageCountMoreThan',
        countNumber: 5,
      },
      action: { type: 'expire' },
    }],
  }),
});

// =============================================================================
// IAM Role for EC2
// =============================================================================

const ec2Role = new aws.iam.Role(`${stackName}-ec2-role`, {
  name: `${stackName}-ec2-role`,
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [{
      Action: 'sts:AssumeRole',
      Effect: 'Allow',
      Principal: { Service: 'ec2.amazonaws.com' },
    }],
  }),
  tags: {
    Name: `${stackName}-ec2-role`,
    Environment: environment,
  },
});

// ECR access
new aws.iam.RolePolicyAttachment(`${stackName}-ec2-ecr-policy`, {
  role: ec2Role.name,
  policyArn: 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
});

// S3 access for attachments
const s3Policy = new aws.iam.Policy(`${stackName}-s3-policy`, {
  name: `${stackName}-s3-policy`,
  policy: attachmentsBucket.arn.apply(arn => JSON.stringify({
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'],
      Resource: [arn, `${arn}/*`],
    }],
  })),
});

new aws.iam.RolePolicyAttachment(`${stackName}-ec2-s3-policy`, {
  role: ec2Role.name,
  policyArn: s3Policy.arn,
});

// Secrets Manager access
const secretsPolicy = new aws.iam.Policy(`${stackName}-secrets-policy`, {
  name: `${stackName}-secrets-policy`,
  policy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Action: ['secretsmanager:GetSecretValue', 'secretsmanager:CreateSecret', 'secretsmanager:UpdateSecret', 'secretsmanager:DeleteSecret'],
      Resource: ['arn:aws:secretsmanager:*:*:secret:email-client/*'],
    }],
  }),
});

new aws.iam.RolePolicyAttachment(`${stackName}-ec2-secrets-policy`, {
  role: ec2Role.name,
  policyArn: secretsPolicy.arn,
});

// CloudWatch Logs access
new aws.iam.RolePolicyAttachment(`${stackName}-ec2-logs-policy`, {
  role: ec2Role.name,
  policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
});

const instanceProfile = new aws.iam.InstanceProfile(`${stackName}-instance-profile`, {
  name: `${stackName}-instance-profile`,
  role: ec2Role.name,
});

// =============================================================================
// Supabase Service Role Key in Secrets Manager
// =============================================================================

const supabaseServiceSecret = new aws.secretsmanager.Secret(`${stackName}-supabase-key`, {
  name: `${stackName}/supabase-service-role-key`,
  description: 'Supabase Service Role Key',
  recoveryWindowInDays: 0,
  tags: {
    Name: `${stackName}-supabase-key`,
    Environment: environment,
  },
});

new aws.secretsmanager.SecretVersion(`${stackName}-supabase-key-version`, {
  secretId: supabaseServiceSecret.id,
  secretString: supabaseServiceRoleKey,
}, {
  ignoreChanges: ['secretString'],
});

// =============================================================================
// EC2 Instance (Backend Server)
// =============================================================================

// Get latest Amazon Linux 2023 ARM64 AMI
const ami = aws.ec2.getAmi({
  mostRecent: true,
  owners: ['amazon'],
  filters: [
    { name: 'name', values: ['al2023-ami-*-arm64'] },
    { name: 'virtualization-type', values: ['hvm'] },
  ],
});

// User data script to set up Docker and run the backend
const userData = pulumi.all([
  backendRepo.repositoryUrl,
  database.address,
  database.port,
  dbPassword,
  attachmentsBucket.bucket,
  currentRegion.name,
  supabaseServiceSecret.arn,
]).apply(([repoUrl, dbHost, dbPort, dbPass, bucketName, region, secretArn]) => `#!/bin/bash
set -e

# Update and install Docker
dnf update -y
dnf install -y docker
systemctl enable docker
systemctl start docker

# Install AWS CLI v2
dnf install -y aws-cli

# Login to ECR
aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${repoUrl.split('/')[0]}

# Get Supabase Service Role Key from Secrets Manager
SUPABASE_SERVICE_KEY=$(aws secretsmanager get-secret-value --secret-id ${secretArn} --query SecretString --output text --region ${region})

# Pull and run the backend container
docker pull ${repoUrl}:latest

docker run -d \\
  --name backend \\
  --restart always \\
  -p 80:4000 \\
  -e NODE_ENV=production \\
  -e LOG_LEVEL=info \\
  -e DB_HOST=${dbHost} \\
  -e DB_PORT=${dbPort} \\
  -e DB_NAME=emailclient \\
  -e DB_USER=emailclient \\
  -e DB_PASSWORD='${dbPass}' \\
  -e PORT=4000 \\
  -e ATTACHMENTS_S3_BUCKET=${bucketName} \\
  -e AWS_REGION=${region} \\
  -e SECRETS_BASE_PATH=email-client \\
  -e SUPABASE_URL=${supabaseUrl} \\
  -e SUPABASE_ANON_KEY=${supabaseAnonKey} \\
  -e SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_KEY" \\
  ${repoUrl}:latest

# Create update script for easy redeployment
cat > /home/ec2-user/update-backend.sh << 'EOF'
#!/bin/bash
aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${repoUrl.split('/')[0]}
docker pull ${repoUrl}:latest
docker stop backend || true
docker rm backend || true
docker run -d \\
  --name backend \\
  --restart always \\
  -p 80:4000 \\
  -e NODE_ENV=production \\
  -e LOG_LEVEL=info \\
  -e DB_HOST=${dbHost} \\
  -e DB_PORT=${dbPort} \\
  -e DB_NAME=emailclient \\
  -e DB_USER=emailclient \\
  -e DB_PASSWORD='${dbPass}' \\
  -e PORT=4000 \\
  -e ATTACHMENTS_S3_BUCKET=${bucketName} \\
  -e AWS_REGION=${region} \\
  -e SECRETS_BASE_PATH=email-client \\
  -e SUPABASE_URL=${supabaseUrl} \\
  -e SUPABASE_ANON_KEY=${supabaseAnonKey} \\
  -e SUPABASE_SERVICE_ROLE_KEY="$(aws secretsmanager get-secret-value --secret-id ${secretArn} --query SecretString --output text --region ${region})" \\
  ${repoUrl}:latest
EOF
chmod +x /home/ec2-user/update-backend.sh
chown ec2-user:ec2-user /home/ec2-user/update-backend.sh

echo "Backend setup complete!"
`);

// EC2 instance - t4g.nano is the smallest ARM instance (~$3/month)
const backendInstance = new aws.ec2.Instance(`${stackName}-backend`, {
  ami: ami.then(a => a.id),
  instanceType: 't4g.micro', // $6/month, more headroom than nano
  subnetId: publicSubnet1.id,
  vpcSecurityGroupIds: [backendSecurityGroup.id],
  iamInstanceProfile: instanceProfile.name,
  associatePublicIpAddress: true,
  userData: userData,
  userDataReplaceOnChange: false, // Don't recreate on user data change
  rootBlockDevice: {
    volumeSize: 20,
    volumeType: 'gp3',
    deleteOnTermination: true,
  },
  tags: {
    Name: `${stackName}-backend`,
    Environment: environment,
  },
}, {
  dependsOn: [database],
});

// Elastic IP for stable address
const backendEip = new aws.ec2.Eip(`${stackName}-backend-eip`, {
  instance: backendInstance.id,
  domain: 'vpc',
  tags: {
    Name: `${stackName}-backend-eip`,
    Environment: environment,
  },
});

// =============================================================================
// CloudFront CDN
// =============================================================================

const frontendDistribution = new aws.cloudfront.Distribution(`${stackName}-cdn`, {
  enabled: true,
  isIpv6Enabled: true,
  defaultRootObject: 'index.html',
  httpVersion: 'http2and3',
  priceClass: 'PriceClass_100',

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
      // Backend API via EC2 Elastic IP
      domainName: backendEip.publicDns,
      originId: 'BackendOrigin',
      customOriginConfig: {
        httpPort: 80,
        httpsPort: 443,
        originProtocolPolicy: 'http-only',
        originSslProtocols: ['TLSv1.2'],
        originReadTimeout: 60,
        originKeepaliveTimeout: 5,
      },
      customHeaders: [
        { name: 'X-Forwarded-Proto', value: 'https' },
      ],
    },
  ],

  defaultCacheBehavior: {
    targetOriginId: 'S3Origin',
    viewerProtocolPolicy: 'redirect-to-https',
    allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
    cachedMethods: ['GET', 'HEAD'],
    compress: true,
    cachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
  },

  orderedCacheBehaviors: [
    {
      pathPattern: '/api/*',
      targetOriginId: 'BackendOrigin',
      viewerProtocolPolicy: 'https-only',
      allowedMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
      cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
      compress: false,
      cachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad',
      originRequestPolicyId: 'b689b0a8-53d0-40ab-baf2-68738e2966ac',
    },
  ],

  customErrorResponses: [
    { errorCode: 404, responseCode: 200, responsePagePath: '/index.html', errorCachingMinTtl: 0 },
    { errorCode: 403, responseCode: 200, responsePagePath: '/index.html', errorCachingMinTtl: 0 },
  ],

  restrictions: {
    geoRestriction: { restrictionType: 'none' },
  },

  viewerCertificate: {
    cloudfrontDefaultCertificate: true,
  },

  tags: {
    Name: `${stackName}-cdn`,
    Environment: environment,
  },
}, {
  dependsOn: [backendEip, frontendPublicAccessBlock],
});

// =============================================================================
// Outputs
// =============================================================================

export const vpcId = vpc.id;
export const backendApiUrl = pulumi.interpolate`https://${frontendDistribution.domainName}`;
export const frontendUrl = pulumi.interpolate`https://${frontendDistribution.domainName}`;
export const frontendBucketName = frontendBucket.bucket;
export const frontendDistributionId = frontendDistribution.id;
export const backendRepoUrl = backendRepo.repositoryUrl;
export const backendInstanceId = backendInstance.id;
export const backendPublicIp = backendEip.publicIp;
export const backendPublicDns = backendEip.publicDns;
export const databaseEndpoint = database.endpoint;
export const databaseAddress = database.address;
export const attachmentsBucketName = attachmentsBucket.bucket;
