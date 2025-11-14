"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppSyncStack = void 0;
const cdk = require("aws-cdk-lib");
const appsync = require("aws-cdk-lib/aws-appsync");
const aws_appsync_1 = require("aws-cdk-lib/aws-appsync");
const aws_lambda_1 = require("aws-cdk-lib/aws-lambda");
const path_1 = require("path");
const prefixed_stack_1 = require("./prefixed-stack");
class AppSyncStack extends prefixed_stack_1.PrefixedCdkStack {
    constructor(scope, id, props) {
        super(scope, id, props);
        this.api = new aws_appsync_1.GraphqlApi(this, "Api", {
            name: `${this.prefix}-graphql`,
            definition: appsync.Definition.fromFile((0, path_1.join)(__dirname, "../../../schema/schema.graphql")),
            xrayEnabled: true,
            logConfig: { fieldLogLevel: aws_appsync_1.FieldLogLevel.ALL },
        });
        const handler = new aws_lambda_1.Function(this, "AppSyncHandler", {
            runtime: aws_lambda_1.Runtime.NODEJS_20_X,
            handler: "index.handler",
            code: aws_lambda_1.Code.fromAsset((0, path_1.join)(__dirname, "../../lambda/resolver")),
            environment: { BUCKET: `${this.prefix}-files` },
        });
        const lambdaDs = this.api.addLambdaDataSource("LambdaDS", handler);
        lambdaDs.createResolver("helloQueryResolver", {
            fieldName: "hello",
            typeName: "Query",
        });
        new cdk.CfnOutput(this, "GraphqlUrl", { value: this.api.graphqlUrl });
        new cdk.CfnOutput(this, "GraphqlApiKey", { value: this.api.apiKey });
    }
}
exports.AppSyncStack = AppSyncStack;
