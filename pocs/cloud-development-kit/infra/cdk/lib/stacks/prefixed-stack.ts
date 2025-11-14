import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

interface AwsEnv {
  account: string;
  region: string;
}

export interface PrefixedStackProps extends cdk.StackProps {
  appName: string;
  prefix: string;
}

export class PrefixedCdkStack extends cdk.Stack {
  public readonly appName: string;
  public readonly prefix: string;

  constructor(scope: Construct, id: string, props: PrefixedStackProps) {
    super(scope, id, props);

    this.appName = props.appName;
    this.prefix = `${props.appName}-${props.prefix}`;
  }
}
