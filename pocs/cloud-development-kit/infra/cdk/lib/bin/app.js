"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const cdk = require("aws-cdk-lib");
const appsync_stack_1 = require("../lib/stacks/appsync.stack");
const s3_stack_1 = require("../lib/stacks/s3.stack");
const app = new cdk.App();
const PREFIX = process.env.PREFIX ?? "dev";
const APP_NAME = process.env.APP_NAME;
new appsync_stack_1.AppSyncStack(app, `${APP_NAME}-${PREFIX}-AppSyncStack`, {
    appName: APP_NAME,
    prefix: PREFIX
});
new s3_stack_1.S3Stack(app, `${APP_NAME}-${PREFIX}-S3Stack`, {
    appName: APP_NAME,
    prefix: PREFIX
});
