#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ProductCatalogIacStack } from "../lib/product-catalog-iac-stack";

const app = new cdk.App();

new ProductCatalogIacStack(app, "ProductCatalogIacStack", {
  env: {
    account: process.env.X_AWS_ACCOUNT_ID,
    region: process.env.X_AWS_REGION,
  },
});
