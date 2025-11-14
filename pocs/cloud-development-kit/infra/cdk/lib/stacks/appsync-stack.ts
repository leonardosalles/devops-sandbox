import * as cdk from "aws-cdk-lib";
import { FieldLogLevel, GraphqlApi, SchemaFile } from "aws-cdk-lib/aws-appsync";
import {
  Code,
  Function as LambdaFunction,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { join } from "path";
import { PrefixedCdkStack } from "./prefixed-stack";

export class AppSyncStack extends PrefixedCdkStack {
  public readonly api: GraphqlApi;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.api = new GraphqlApi(this, "Api", {
      name: this.prefix + "-graphql",
      schema: SchemaFile.fromAsset(
        join(__dirname, "../../schema/schema.graphql")
      ),
      xrayEnabled: true,
      logConfig: { fieldLogLevel: FieldLogLevel.ALL },
    });

    const handler = new LambdaFunction(this, "AppSyncHandler", {
      runtime: Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: Code.fromAsset(join(__dirname, "../../lambda/resolver")),
      environment: { BUCKET: this.prefix + "-files" },
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
