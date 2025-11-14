import * as cdk from "aws-cdk-lib";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { PrefixedCdkStack } from "./prefixed-stack";

export class StorageStack extends PrefixedCdkStack {
  public readonly bucket: Bucket;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.bucket = new Bucket(this, "Files", {
      bucketName: this.prefix + "-files",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Allow the lambda from AppSync to access the bucket
    this.bucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ["s3:GetObject", "s3:PutObject"],
        resources: [this.bucket.bucketArn + "/*"],
        principals: [],
      })
    );
  }
}
