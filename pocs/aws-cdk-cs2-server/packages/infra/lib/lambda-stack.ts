import * as cdk from "aws-cdk-lib";
import {
  Stack,
  StackProps,
  aws_lambda as lambda,
  aws_iam as iam,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";
import { aws_dynamodb as dynamodb } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export interface LambdaStackProps extends StackProps {
  table: dynamodb.Table;
  repoUri: string;
  ec2Role: iam.Role;
  vpc: any;
  securityGroup: any;
}

export class LambdaStack extends Stack {
  public readonly controlFn: lambda.Function;
  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const role = new iam.Role(this, "LambdaExecRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "ec2:RunInstances",
          "ec2:DescribeInstances",
          "ec2:StartInstances",
          "ec2:StopInstances",
          "ec2:RebootInstances",
          "ec2:TerminateInstances",
          "ec2:DescribeImages",
          "ec2:CreateTags",
        ],
        resources: ["*"],
      })
    );

    this.controlFn = new NodejsFunction(this, "ControlFn", {
      entry: path.join(__dirname, "../../control-lambda/src/index.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        minify: true,
        target: "node20",
        externalModules: [],
      },
      environment: {
        TABLE_NAME: props.table.tableName,
        REPO_URI: props.repoUri,
        REGION:
          process.env.AWS_REGION ||
          process.env.CDK_DEFAULT_REGION ||
          "sa-east-1",
        RCON_PASSWORD: process.env.RCON_PASSWORD || "",
        GSLT: process.env.GSLT || "",
      },
      role,
      timeout: cdk.Duration.seconds(60),
    });

    props.table.grantReadWriteData(this.controlFn);
  }
}
