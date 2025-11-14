import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import { PrefixedCdkStack, PrefixedStackProps } from "./prefixed-stack";

export class BackendStack extends PrefixedCdkStack {
  public readonly service: ecs_patterns.ApplicationLoadBalancedFargateService;

  constructor(scope: Construct, id: string, props: PrefixedStackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
    });

    const cluster = new ecs.Cluster(this, "Cluster", { vpc });

    this.service = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      "BackendService",
      {
        cluster,
        cpu: 256,
        memoryLimitMiB: 512,
        desiredCount: 1,
        taskImageOptions: {
          image: ecs.ContainerImage.fromAsset("../../apps/backend/dist"),
          containerPort: 3001,
          environment: {
            APPSYNC_URL: props.env?.region
              ? `https://${props.appName}-${props.prefix}-graphql.appsync-api.${props.env.region}.amazonaws.com/graphql`
              : "",
          },
        },
        publicLoadBalancer: true,
        minHealthyPercent: 100,
        maxHealthyPercent: 200,
      },
    );

    new cdk.CfnOutput(this, "BackendURL", {
      value: this.service.loadBalancer.loadBalancerDnsName,
    });
  }
}
