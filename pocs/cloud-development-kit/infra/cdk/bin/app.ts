import 'dotenv/config';
import * as cdk from 'aws-cdk-lib';
import { AppSyncStack } from '../lib/stacks/appsync.stack';
import { S3Stack } from '../lib/stacks/s3.stack';
import { FrontendStack } from '../lib/stacks/frontend.stack';
import { BackendStack } from '../lib/stacks/backend.stack';
import { TaskExecutorStack } from '../lib/stacks/task-executor-stack';

const app = new cdk.App();

const PREFIX = process.env.PREFIX ?? 'dev';
const APP_NAME = process.env.APP_NAME!;

new AppSyncStack(app, `${APP_NAME}-${PREFIX}-AppSyncStack`, {
  appName: APP_NAME,
  prefix: PREFIX,
});

new S3Stack(app, `${APP_NAME}-${PREFIX}-S3Stack`, {
  appName: APP_NAME,
  prefix: PREFIX,
});

new FrontendStack(app, `${APP_NAME}-${PREFIX}-FrontendStack`, {
  appName: APP_NAME,
  prefix: PREFIX,
});

new BackendStack(app, `${APP_NAME}-${PREFIX}-BackendStack`, {
  appName: APP_NAME,
  prefix: PREFIX,
});

new TaskExecutorStack(app, `${APP_NAME}-${PREFIX}-TaskExecutorStack`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Stack for Task Executor with ECR and Lambda',
});
