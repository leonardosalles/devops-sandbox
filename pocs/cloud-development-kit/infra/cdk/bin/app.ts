import "dotenv/config";
import * as cdk from "aws-cdk-lib";
import { AppSyncStack } from "../lib/stacks/appsync.stack";
import { S3Stack } from "../lib/stacks/s3.stack";
import { FrontendStack } from "../lib/stacks/frontend.stack";

const app = new cdk.App();

const PREFIX = process.env.PREFIX ?? "dev";
const APP_NAME = process.env.APP_NAME!;

new AppSyncStack(app, `${APP_NAME}-${PREFIX}-AppSyncStack`, {
  appName: APP_NAME,
  prefix: PREFIX
});

new S3Stack(app, `${APP_NAME}-${PREFIX}-S3Stack`, {
  appName: APP_NAME,
  prefix: PREFIX
});

new FrontendStack(app, `${APP_NAME}-${PREFIX}-FrontendStack`, {
  appName: APP_NAME,
  prefix: PREFIX
});
