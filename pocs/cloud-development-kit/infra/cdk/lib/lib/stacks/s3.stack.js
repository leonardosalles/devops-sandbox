"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Stack = void 0;
const cdk = require("aws-cdk-lib");
const iam = require("aws-cdk-lib/aws-iam");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const aws_s3_1 = require("aws-cdk-lib/aws-s3");
const prefixed_stack_1 = require("./prefixed-stack");
class S3Stack extends prefixed_stack_1.PrefixedCdkStack {
    constructor(scope, id, props) {
        super(scope, id, props);
        this.bucket = new aws_s3_1.Bucket(this, "Files", {
            bucketName: `${this.prefix}-files`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });
        this.bucket.addToResourcePolicy(new aws_iam_1.PolicyStatement({
            actions: ["s3:GetObject", "s3:PutObject"],
            resources: [`${this.bucket.bucketArn}/*`],
            principals: [new iam.ServicePrincipal("lambda.amazonaws.com")],
        }));
    }
}
exports.S3Stack = S3Stack;
