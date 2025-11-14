import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { prefix } from "../../env-config";

export interface PrefixedStackProps extends StackProps {
  envName?: string;
}

export class PrefixedCdkStack extends Stack {
  protected readonly prefix: string;
  constructor(scope: Construct, id: string, props?: PrefixedStackProps) {
    super(scope, `${prefix}-${id}`, props);
    this.prefix = prefix;
  }
}
