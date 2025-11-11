
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AppSyncStack } from '../lib/stacks/appsync-stack';
import { StorageStack } from '../lib/stacks/s3-stack';

const app = new cdk.App();
new AppSyncStack(app, 'AppSyncStack');
new StorageStack(app, 'StorageStack');
