import * as cdk from "aws-cdk-lib";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { ApiStack } from "./api-stack";
import { ComputeStack } from "./compute-stack";
import { DatabaseStack } from "./database-stack";
import { EcrStack } from "./ecr-stack";
import { LambdaStack } from "./lambda-stack";
import { NetworkStack } from "./network-stack";

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const networkStack = new NetworkStack(this, "NetworkStack", {});

    const ecrStack = new EcrStack(this, "EcrStack", {
      repoName: process.env.DOCKER_IMAGE_NAME || "cs2-server-modded",
    });

    const dbStack = new DatabaseStack(this, "DatabaseStack", {});

    const computeStack = new ComputeStack(this, "ComputeStack", {
      vpc: networkStack.vpc,
      securityGroup: networkStack.sg,
    });

    const lambdaStack = new LambdaStack(this, "LambdaStack", {
      table: dbStack.table,
      repoUri: ecrStack.repo.repositoryUri,
      ec2Role: computeStack.ec2Role,
      vpc: networkStack.vpc,
      securityGroup: networkStack.sg,
      rconPassword: process.env.RCON_PASSWORD!,
      gslt: process.env.GSLT!,
      imageAmiId: process.env.IMAGE_AMI_ID!,
      ec2InstanceType: process.env.EC2_INSTANCE_TYPE!,
    });

    const apiStack = new ApiStack(this, "ApiStack", {
      lambdaFunction: lambdaStack.controlFn,
    });

    new cdk.CfnOutput(this, "ApiUrl", { value: apiStack.api.url });
    new cdk.CfnOutput(this, "EcrRepo", { value: ecrStack.repo.repositoryUri });
  }
}
