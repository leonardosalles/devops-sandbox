import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { NetworkStack } from "./network-stack";
import { EcrStack } from "./ecr-stack";
import { DatabaseStack } from "./database-stack";
import { ComputeStack } from "./compute-stack";
import { LambdaStack } from "./lambda-stack";
import { ApiStack } from "./api-stack";

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const network = new NetworkStack(this, "NetworkStack", {});

    const ecr = new EcrStack(this, "EcrStack", {
      repoName: process.env.DOCKER_IMAGE_NAME || "cs2-server-modded",
    });

    const db = new DatabaseStack(this, "DatabaseStack", {});

    const compute = new ComputeStack(this, "ComputeStack", {
      vpc: network.vpc,
      securityGroup: network.sg,
    });

    const lambda = new LambdaStack(this, "LambdaStack", {
      table: db.table,
      repoUri: ecr.repo.repositoryUri,
      ec2Role: compute.ec2Role,
      vpc: network.vpc,
      securityGroup: network.sg,
      rconPassword: process.env.RCON_PASSWORD!,
      gslt: process.env.GSLT!,
      imageAmiId: process.env.IMAGE_AMI_ID!,
      ec2InstanceType: process.env.EC2_INSTANCE_TYPE!,
    });

    const api = new ApiStack(this, "ApiStack", {
      lambdaFunction: lambda.controlFn,
    });

    new cdk.CfnOutput(this, "ApiUrl", { value: api.api.url });
    new cdk.CfnOutput(this, "EcrRepo", { value: ecr.repo.repositoryUri });
  }
}
