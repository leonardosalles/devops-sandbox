#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { AppStack } from "../lib/app-stack";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.deploy" });

const app = new App();
new AppStack(app, "Cs2AppStack", {});
