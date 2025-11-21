import { Stack, StackProps, aws_iam as iam, aws_ec2 as ec2 } from "aws-cdk-lib";
import { Construct } from "constructs";

export interface ComputeStackProps extends StackProps {
  vpc: ec2.IVpc;
  securityGroup: ec2.ISecurityGroup;
}

export class ComputeStack extends Stack {
  public readonly ec2Role: iam.Role;
  public readonly vpc: ec2.IVpc;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);
    this.vpc = props.vpc;

    this.ec2Role = new iam.Role(this, "Ec2Role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    this.ec2Role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "AmazonEC2ContainerRegistryReadOnly"
      )
    );
    this.ec2Role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );
  }
}
