import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class TaskExecutorStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const repository = new ecr.Repository(this, 'TaskExecutorRepository', {
      repositoryName: 'task-executor',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      imageScanOnPush: true,
    });

    const lambdaRole = new iam.Role(this, 'TaskExecutorLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for Task Executor Lambda',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ecr:GetDownloadUrlForLayer', 'ecr:BatchGetImage', 'ecr:GetAuthorizationToken'],
        resources: ['*'],
      }),
    );

    const taskExecutor = new lambda.DockerImageFunction(this, 'TaskExecutor', {
      functionName: 'task-executor',
      code: lambda.DockerImageCode.fromImageAsset('../task-demo'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      role: lambdaRole,
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: repository.repositoryUri,
      description: 'ECR Repository URI',
    });

    new cdk.CfnOutput(this, 'TaskExecutorFunctionName', {
      value: taskExecutor.functionName,
      description: 'Task Executor Lambda Function Name',
    });
  }
}
