import * as cdk from "aws-cdk-lib";
import { HttpMethods } from "aws-cdk-lib/aws-s3";

import { Construct } from "constructs";

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const s3Bucket: cdk.aws_s3.Bucket = new cdk.aws_s3.Bucket(
      this,
      "ProductCatalogFrontendBucket",
      {
        versioned: true,
        websiteIndexDocument: "index.html",
        websiteErrorDocument: "index.html",
        cors: [
          {
            allowedMethods: [HttpMethods.GET],
            allowedHeaders: ["*"],
            allowedOrigins: ["*"],
          },
        ],
        blockPublicAccess: {
          blockPublicAcls: false,
          blockPublicPolicy: false,
          restrictPublicBuckets: false,
          ignorePublicAcls: undefined,
        },
      }
    );

    // This method will grant read ("s3:GetObject") access to all objects ("*") in the bucket.
    s3Bucket.grantPublicAccess();

    console.log(
      `❓ If this bucket has been configured for static website hosting?`,
      {
        value: s3Bucket.isWebsite ? "yes" : "no",
      }
    );

    new cdk.CfnOutput(this, `CfnFrontendBucketName`, {
      value: s3Bucket.bucketName,
    });

    new cdk.CfnOutput(this, `CfnFrontendBucketWebsiteUrl`, {
      value: s3Bucket.bucketWebsiteUrl,
    });

    const cloudFrontDistribution = new cdk.aws_cloudfront.Distribution(
      this,
      "FrontendCloudFrontDistribution",
      {
        defaultBehavior: {
          origin: new cdk.aws_cloudfront_origins.S3StaticWebsiteOrigin(
            s3Bucket
          ),
        },
      }
    );

    new cdk.CfnOutput(this, `CfnFrontendCloudFrontDistributionName`, {
      value: cloudFrontDistribution.distributionDomainName,
    });

    new cdk.CfnOutput(this, `CfnFrontendCloudFrontDomainName`, {
      value: cloudFrontDistribution.domainName,
    });
  }
}
