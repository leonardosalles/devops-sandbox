
import { Construct } from 'constructs';
import { PrefixedCdkStack } from './prefixed-stack';
import * as cdk from 'aws-cdk-lib';
import { GraphqlApi, SchemaFile, FieldLogLevel } from 'aws-cdk-lib/aws-appsync';
import { join } from 'path';
import { Runtime, Code, Function as LambdaFunction } from 'aws-cdk-lib/aws-lambda';
import { LambdaDataSource } from 'aws-cdk-lib/aws-appsync';

export class AppSyncStack extends PrefixedCdkStack {
  public readonly api: GraphqlApi;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.api = new GraphqlApi(this, 'Api', {
      name: this.prefix + '-graphql',
      schema: SchemaFile.fromAsset(join(__dirname, '../../schema/schema.graphql')),
      xrayEnabled: true,
      logConfig: { fieldLogLevel: FieldLogLevel.ALL }
    });

    const handler = new LambdaFunction(this, 'AppSyncHandler', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: Code.fromAsset(join(__dirname, '../../lambda/resolver')),
      environment: { BUCKET: this.prefix + '-files' }
    });

    const lambdaDs = this.api.addLambdaDataSource('LambdaDS', handler);

    // Resolver for Query.hello -> lambda
    lambdaDs.createResolver({
      typeName: 'Query',
      fieldName: 'hello'
    });

    new cdk.CfnOutput(this, 'GraphqlUrl', { value: this.api.graphqlUrl });
    new cdk.CfnOutput(this, 'GraphqlApiKey', { value: this.api.apiKey! });
  }
}
