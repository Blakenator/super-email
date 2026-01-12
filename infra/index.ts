import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

// Configuration
const config = new pulumi.Config();
const environment = config.require('environment');
const dbInstanceClass = config.get('dbInstanceClass') || 'db.t3.micro';

const stackName = `email-client-${environment}`;

// =============================================================================
// VPC and Networking
// =============================================================================

const vpc = new awsx.ec2.Vpc(`${stackName}-vpc`, {
  cidrBlock: '10.0.0.0/16',
  numberOfAvailabilityZones: 2,
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: {
    Name: `${stackName}-vpc`,
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
  tags: {
    Name: `${stackName}-db-password`,
    Environment: environment,
  },
});

// Generate a random password
const dbPasswordVersion = new aws.secretsmanager.SecretVersion(`${stackName}-db-password-version`, {
  secretId: dbPasswordSecret.id,
  secretString: pulumi.output(aws.secretsmanager.getRandomPassword({
    passwordLength: 32,
    excludePunctuation: true,
  })).apply(p => p.randomPassword),
});

const dbPassword = dbPasswordVersion.secretString;

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
// ECR Repositories
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

const frontendRepo = new aws.ecr.Repository(`${stackName}-frontend`, {
  name: `${stackName}-frontend`,
  imageTagMutability: 'MUTABLE',
  imageScanningConfiguration: {
    scanOnPush: true,
  },
  tags: {
    Name: `${stackName}-frontend`,
    Environment: environment,
  },
});

// =============================================================================
// ECS Cluster and Services
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

// CloudWatch Log Groups
const backendLogGroup = new aws.cloudwatch.LogGroup(`${stackName}-backend-logs`, {
  name: `/ecs/${stackName}/backend`,
  retentionInDays: 30,
  tags: {
    Name: `${stackName}-backend-logs`,
    Environment: environment,
  },
});

const frontendLogGroup = new aws.cloudwatch.LogGroup(`${stackName}-frontend-logs`, {
  name: `/ecs/${stackName}/frontend`,
  retentionInDays: 30,
  tags: {
    Name: `${stackName}-frontend-logs`,
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
  ]).apply(([repoUrl, dbHost, dbPort, dbPass]) => JSON.stringify([
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
        { name: 'NODE_ENV', value: environment },
        { name: 'DB_HOST', value: dbHost },
        { name: 'DB_PORT', value: String(dbPort) },
        { name: 'DB_NAME', value: 'emailclient' },
        { name: 'DB_USER', value: 'emailclient' },
        { name: 'DB_PASSWORD', value: dbPass },
        { name: 'PORT', value: '4000' },
      ],
      logConfiguration: {
        logDriver: 'awslogs',
        options: {
          'awslogs-group': `/ecs/${stackName}/backend`,
          'awslogs-region': aws.config.region,
          'awslogs-stream-prefix': 'ecs',
        },
      },
    },
  ])),
  tags: {
    Name: `${stackName}-backend-task`,
    Environment: environment,
  },
});

// Frontend Task Definition
const frontendTaskDefinition = new aws.ecs.TaskDefinition(`${stackName}-frontend-task`, {
  family: `${stackName}-frontend`,
  networkMode: 'awsvpc',
  requiresCompatibilities: ['FARGATE'],
  cpu: '256',
  memory: '512',
  executionRoleArn: taskExecutionRole.arn,
  taskRoleArn: taskRole.arn,
  containerDefinitions: frontendRepo.repositoryUrl.apply((repoUrl) => JSON.stringify([
    {
      name: 'frontend',
      image: `${repoUrl}:latest`,
      essential: true,
      portMappings: [
        {
          containerPort: 80,
          protocol: 'tcp',
        },
      ],
      environment: [
        { name: 'NODE_ENV', value: environment },
      ],
      logConfiguration: {
        logDriver: 'awslogs',
        options: {
          'awslogs-group': `/ecs/${stackName}/frontend`,
          'awslogs-region': aws.config.region,
          'awslogs-stream-prefix': 'ecs',
        },
      },
    },
  ])),
  tags: {
    Name: `${stackName}-frontend-task`,
    Environment: environment,
  },
});

// =============================================================================
// Application Load Balancer
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
    path: '/api/graphql',
    port: 'traffic-port',
    protocol: 'HTTP',
    healthyThreshold: 2,
    unhealthyThreshold: 3,
    timeout: 5,
    interval: 30,
    matcher: '200-499', // GraphQL returns various status codes
  },
  tags: {
    Name: `${stackName}-backend-tg`,
    Environment: environment,
  },
});

// Target group for frontend
const frontendTargetGroup = new aws.lb.TargetGroup(`${stackName}-frontend-tg`, {
  name: `${stackName}-frontend-tg`,
  port: 80,
  protocol: 'HTTP',
  vpcId: vpc.vpcId,
  targetType: 'ip',
  healthCheck: {
    enabled: true,
    path: '/',
    port: 'traffic-port',
    protocol: 'HTTP',
    healthyThreshold: 2,
    unhealthyThreshold: 3,
    timeout: 5,
    interval: 30,
    matcher: '200',
  },
  tags: {
    Name: `${stackName}-frontend-tg`,
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
      targetGroupArn: frontendTargetGroup.arn,
    },
  ],
});

// Listener rule for API routes
const apiListenerRule = new aws.lb.ListenerRule(`${stackName}-api-rule`, {
  listenerArn: httpListener.arn,
  priority: 100,
  conditions: [
    {
      pathPattern: {
        values: ['/api/*'],
      },
    },
  ],
  actions: [
    {
      type: 'forward',
      targetGroupArn: backendTargetGroup.arn,
    },
  ],
});

// =============================================================================
// ECS Services
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
  tags: {
    Name: `${stackName}-backend-service`,
    Environment: environment,
  },
});

const frontendService = new aws.ecs.Service(`${stackName}-frontend-service`, {
  name: `${stackName}-frontend`,
  cluster: cluster.arn,
  taskDefinition: frontendTaskDefinition.arn,
  desiredCount: environment === 'prod' ? 2 : 1,
  launchType: 'FARGATE',
  networkConfiguration: {
    subnets: vpc.privateSubnetIds,
    securityGroups: [backendSecurityGroup.id], // Reuse backend SG for simplicity
    assignPublicIp: false,
  },
  loadBalancers: [
    {
      targetGroupArn: frontendTargetGroup.arn,
      containerName: 'frontend',
      containerPort: 80,
    },
  ],
  tags: {
    Name: `${stackName}-frontend-service`,
    Environment: environment,
  },
});

// =============================================================================
// Outputs
// =============================================================================

export const vpcId = vpc.vpcId;
export const albDnsName = alb.dnsName;
export const albUrl = pulumi.interpolate`http://${alb.dnsName}`;
export const backendRepoUrl = backendRepo.repositoryUrl;
export const frontendRepoUrl = frontendRepo.repositoryUrl;
export const databaseEndpoint = database.endpoint;
export const databaseAddress = database.address;
export const clusterArn = cluster.arn;
