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
  rconPassword: string;
  gslt: string;
  imageAmiId: string;
  ec2InstanceType: string;
}

export class LambdaStack extends Stack {
  public readonly controlFn: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const lambdaRole = new iam.Role(this, "LambdaExecRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "ec2:RunInstances",
          "ec2:DescribeInstances",
          "ec2:StartInstances",
          "ec2:StopInstances",
          "ec2:RebootInstances",
          "ec2:TerminateInstances",
          "ec2:DescribeImages",
        ],
        resources: ["*"],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["iam:PassRole"],
        resources: [props.ec2Role.roleArn],
      })
    );

    const instanceProfile = new iam.CfnInstanceProfile(
      this,
      "Cs2InstanceProfile",
      {
        roles: [props.ec2Role.roleName],
      }
    );

    const environment = {
      TABLE_NAME: props.table.tableName,
      REPO_URI: props.repoUri,
      REGION: process.env.AWS_REGION || "sa-east-1",

      SECURITY_GROUP_ID: props.securityGroup.securityGroupId,
      SUBNET_ID: props.vpc.publicSubnets[0].subnetId,
      INSTANCE_PROFILE_NAME: instanceProfile.ref,

      RCON_PASSWORD: props.rconPassword,
      GSLT: props.gslt,
      IMAGE_AMI_ID: props.imageAmiId,
      EC2_INSTANCE_TYPE: props.ec2InstanceType,
    };

    this.controlFn = new NodejsFunction(this, "ControlFn", {
      entry: path.join(__dirname, "../../control-lambda/src/index.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      environment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(60),
    });

    props.table.grantReadWriteData(this.controlFn);

    new cdk.CfnOutput(this, "Environment", {
      value: JSON.stringify(environment),
    });
  }
}
