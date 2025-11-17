import { Stack, StackProps, aws_ec2 as ec2 } from "aws-cdk-lib";
import { Construct } from "constructs";

export class NetworkStack extends Stack {
  public readonly vpc: ec2.IVpc;
  public readonly sg: ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.vpc = new ec2.Vpc(this, "Vpc", { maxAzs: 2 });
    this.sg = new ec2.SecurityGroup(this, "Cs2SecurityGroup", {
      vpc: this.vpc,
      allowAllOutbound: true,
      description: "Allow CS2 traffic",
    });
    this.sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(27015));
    this.sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.udp(27015));
    this.sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.udp(27020));
  }
}
