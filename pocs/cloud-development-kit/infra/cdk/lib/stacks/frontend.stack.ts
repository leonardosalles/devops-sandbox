import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { PrefixedCdkStack, PrefixedStackProps } from "./prefixed-stack";

export class FrontendStack extends PrefixedCdkStack {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: PrefixedStackProps) {
    super(scope, id, props);

    this.bucket = new s3.Bucket(this, "FrontendBucket", {
      bucketName: `${this.prefix}-frontend`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const oac = new cloudfront.S3OriginAccessControl(this, "FrontendOAC", {
      originAccessControlName: `${this.prefix}-OAC`,
    });

    const origin = origins.S3BucketOrigin.withOriginAccessControl(this.bucket, {
      originAccessControl: oac,
      originPath: "/static",
      connectionTimeout: cdk.Duration.seconds(10),
      connectionAttempts: 2,

      originShieldRegion: props.env?.region,
      originShieldEnabled: true,
      originId: "frontendOrigin",
    });

    this.distribution = new cloudfront.Distribution(
      this,
      "FrontendDistribution",
      {
        defaultBehavior: {
          origin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        defaultRootObject: "index.html",
      }
    );

    new s3deploy.BucketDeployment(this, "DeployFrontend", {
      sources: [s3deploy.Source.asset("../../apps/frontend/out")],
      destinationBucket: this.bucket,
      distribution: this.distribution,
      distributionPaths: ["/*"],
    });

    new cdk.CfnOutput(this, "FrontendBucketName", {
      value: this.bucket.bucketName,
    });
    new cdk.CfnOutput(this, "FrontendURL", {
      value: `https://${this.distribution.domainName}`,
    });
  }
}
