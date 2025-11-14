import * as cdk from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import { FieldLogLevel, GraphqlApi } from "aws-cdk-lib/aws-appsync";
import {
  Function as LambdaFunction,
  Code,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { join } from "path";
import { PrefixedCdkStack, PrefixedStackProps } from "./prefixed-stack";

export class AppSyncStack extends PrefixedCdkStack {
  public readonly api: GraphqlApi;

  constructor(scope: Construct, id: string, props: PrefixedStackProps) {
    super(scope, id, props);

    this.api = new GraphqlApi(this, "Api", {
      name: `${this.prefix}-graphql`,
      definition: appsync.Definition.fromFile(
        join(__dirname, "../../../schema/schema.graphql")
      ),
      xrayEnabled: true,
      logConfig: { fieldLogLevel: FieldLogLevel.ALL },
    });

    const handler = new LambdaFunction(this, "AppSyncHandler", {
      runtime: Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: Code.fromAsset(join(__dirname, "../../lambda/resolver")),
      environment: { BUCKET: `${this.prefix}-files` },
    });

    const lambdaDs = this.api.addLambdaDataSource("LambdaDS", handler);

    lambdaDs.createResolver("helloQueryResolver", {
      fieldName: "hello",
      typeName: "Query",
    });

    new cdk.CfnOutput(this, "GraphqlUrl", { value: this.api.graphqlUrl });
    new cdk.CfnOutput(this, "GraphqlApiKey", { value: this.api.apiKey! });
  }
}
