#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { AppStack } from "../lib/app-stack";

const app = new App();
new AppStack(app, "Cs2AppStack", {});
