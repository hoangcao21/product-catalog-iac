#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { FrontendStack } from "../lib/frontend-stack";
import { BackendStack } from "../lib/backend-stack";

const app = new cdk.App();

const commonConfig = {
  env: {
    account: process.env.X_AWS_ACCOUNT_ID,
    region: process.env.X_AWS_REGION,
  },
};

new BackendStack(app, "ProductCatalogBackendStack", commonConfig);

new FrontendStack(app, "ProductCatalogFrontendStack", commonConfig);
