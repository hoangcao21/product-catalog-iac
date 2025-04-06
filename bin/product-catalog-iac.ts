#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { FrontendStack } from "../lib/frontend-stack";

const app = new cdk.App();

new FrontendStack(app, "ProductCatalogFrontendStack", {
  env: {
    account: process.env.X_AWS_ACCOUNT_ID,
    region: process.env.X_AWS_REGION,
  },
});
