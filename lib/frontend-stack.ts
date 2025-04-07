import * as cdk from "aws-cdk-lib";
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { HttpMethods } from "aws-cdk-lib/aws-s3";

import { Construct } from "constructs";

import * as path from "node:path";

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const s3WebsiteBucket: cdk.aws_s3.Bucket = new cdk.aws_s3.Bucket(
      this,
      "ProductCatalogFrontendBucket",
      {
        versioned: true,
        cors: [
          {
            allowedMethods: [HttpMethods.GET],
            allowedHeaders: ["*"],
            allowedOrigins: ["*"],
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    new cdk.aws_s3_deployment.BucketDeployment(
      this,
      "UploadFrontendBundledBuild",
      {
        sources: [
          cdk.aws_s3_deployment.Source.asset(
            path.join(__dirname, "..", "..", "product-catalog-frontend", "dist")
          ),
        ],
        destinationBucket: s3WebsiteBucket,
      }
    );

    console.log(
      `❓ If this bucket has been configured for static website hosting?`,
      {
        value: s3WebsiteBucket.isWebsite ? "yes" : "no",
      }
    );

    new cdk.CfnOutput(this, `CfnFrontendBucketName`, {
      value: s3WebsiteBucket.bucketName,
    });

    new cdk.CfnOutput(this, `CfnFrontendBucketWebsiteUrl`, {
      value: s3WebsiteBucket.bucketWebsiteUrl,
    });

    // ------------------------------------------------------
    const originAccessControl = new cdk.aws_cloudfront.S3OriginAccessControl(
      this,
      "FrontendBucketOAC",
      {
        description: "OAC for Frontend Bucket",
      }
    );

    const cloudFrontDistribution = new cdk.aws_cloudfront.Distribution(
      this,
      "FrontendCloudFrontDistribution",
      {
        defaultBehavior: {
          origin:
            cdk.aws_cloudfront_origins.S3BucketOrigin.withOriginAccessControl(
              s3WebsiteBucket,
              { originAccessControl }
            ),
          viewerProtocolPolicy:
            cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods:
            cdk.aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          compress: true,
        },
        defaultRootObject: "index.html",
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: cdk.Duration.seconds(0),
          },
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: cdk.Duration.seconds(0),
          },
        ],
      }
    );

    s3WebsiteBucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        effect: cdk.aws_iam.Effect.ALLOW,
        actions: ["s3:GetObject"],
        principals: [
          new cdk.aws_iam.ServicePrincipal("cloudfront.amazonaws.com"),
        ],
        resources: [s3WebsiteBucket.arnForObjects("*")],
        conditions: {
          StringEquals: {
            // Reference the specific CloudFront distribution ARN
            "AWS:SourceArn": cloudFrontDistribution.distributionArn,
          },
        },
      })
    );

    new cdk.CfnOutput(this, `CfnFrontendCloudFrontDistributionName`, {
      value: cloudFrontDistribution.distributionDomainName,
    });
  }
}
