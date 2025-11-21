import {
  Stack,
  StackProps,
  aws_apigateway as apigw,
  aws_lambda as lambda,
  aws_ssm as ssm,
} from "aws-cdk-lib";
import { Construct } from "constructs";

export interface ApiStackProps extends StackProps {
  lambdaFunction: lambda.Function;
}

export class ApiStack extends Stack {
  public readonly api: apigw.RestApi;
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    this.api = new apigw.RestApi(this, "Cs2Api", {
      restApiName: "CS2 Server Manager",
      defaultCorsPreflightOptions: {
        allowOrigins: ["*"],
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
        ],
      },
    });

    this.apiUrl = this.api.url;

    new ssm.StringParameter(this, "ApiUrlParam", {
      parameterName: "/cs2/api-url",
      stringValue: this.apiUrl,
    });

    const lambdaIntegration = new apigw.LambdaIntegration(props.lambdaFunction);

    const servers = this.api.root.addResource("servers");
    servers.addMethod("POST", lambdaIntegration);
    servers.addMethod("GET", lambdaIntegration);

    const single = servers.addResource("{id}");
    single.addResource("start").addMethod("POST", lambdaIntegration);
    single.addResource("stop").addMethod("POST", lambdaIntegration);
    single.addResource("restart").addMethod("POST", lambdaIntegration);
    single.addResource("terminate").addMethod("POST", lambdaIntegration);
    single.addResource("status").addMethod("POST", lambdaIntegration);
  }
}
