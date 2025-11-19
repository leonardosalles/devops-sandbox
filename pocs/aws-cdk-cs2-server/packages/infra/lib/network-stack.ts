import { Stack, StackProps, aws_ec2 as ec2 } from "aws-cdk-lib";
import { Construct } from "constructs";

export class NetworkStack extends Stack {
  public readonly vpc: ec2.IVpc;
  public readonly sg: ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    this.sg = new ec2.SecurityGroup(this, "Cs2SecurityGroup", {
      vpc: this.vpc,
      allowAllOutbound: true,
      description: "Allow CS2 traffic",
    });

    this.sg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(27015),
      "CS2 TCP 27015"
    );
    this.sg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udp(27015),
      "CS2 UDP 27015"
    );
    this.sg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udp(27020),
      "GOTV UDP 27020"
    );
    this.sg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udp(27005),
      "Steam backend 27005"
    );

    for (let p = 27031; p <= 27036; p++) {
      this.sg.addIngressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.udp(p),
        `Steam SDR UDP ${p}`
      );
    }

    this.sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), "SSH");
  }
}
