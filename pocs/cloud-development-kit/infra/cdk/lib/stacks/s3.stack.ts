import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { PrefixedCdkStack, PrefixedStackProps } from "./prefixed-stack";

export class S3Stack extends PrefixedCdkStack {
  public readonly bucket: Bucket;

  constructor(scope: Construct, id: string, props: PrefixedStackProps) {
    super(scope, id, props);

    this.bucket = new Bucket(this, "Files", {
      bucketName: `${this.prefix}-files`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    this.bucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ["s3:GetObject", "s3:PutObject"],
        resources: [`${this.bucket.bucketArn}/*`],
        principals: [new iam.ServicePrincipal("lambda.amazonaws.com")],
      })
    );
  }
}
