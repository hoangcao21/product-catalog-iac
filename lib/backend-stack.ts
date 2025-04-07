import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "node:path";

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productTable = new cdk.aws_dynamodb.Table(this, "ProductTable", {
      partitionKey: {
        name: "productId",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      tableName: "ProductTable",
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For persistent resources like database, it wont be destroyed when we run "cdk destroy". It is the behavior from CDK. We need to add this attribute
    });

    productTable.addGlobalSecondaryIndex({
      indexName: "categoryGlobalIndex",
      projectionType: cdk.aws_dynamodb.ProjectionType.ALL,
      partitionKey: {
        name: "categoryLowercase",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "productId",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
    });

    const userTable = new cdk.aws_dynamodb.Table(this, "UserTable", {
      partitionKey: {
        name: "userId",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      tableName: "UserTable",
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For persistent resources like database, it wont be destroyed when we run "cdk destroy". It is the behavior from CDK. We need to add this attribute
    });

    userTable.addGlobalSecondaryIndex({
      indexName: "userNameGlobalIndex",
      projectionType: cdk.aws_dynamodb.ProjectionType.ALL,
      partitionKey: {
        name: "userName",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "userId",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
    });

    const productReviewTable = new cdk.aws_dynamodb.Table(
      this,
      "ProductReviewTable",
      {
        partitionKey: {
          name: "reviewId",
          type: cdk.aws_dynamodb.AttributeType.STRING,
        },
        tableName: "ProductReviewTable",
        removalPolicy: cdk.RemovalPolicy.DESTROY, // For persistent resources like database, it wont be destroyed when we run "cdk destroy". It is the behavior from CDK. We need to add this attribute
      }
    );

    productReviewTable.addGlobalSecondaryIndex({
      indexName: "productIdGlobalIndex",
      projectionType: cdk.aws_dynamodb.ProjectionType.ALL,
      partitionKey: {
        name: "productId",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "createdAt",
        type: cdk.aws_dynamodb.AttributeType.NUMBER,
      },
    });

    // ------------------------------------------------------
    const lambdaCommonEnv = {
      JWT_SECRET_KEY: "verySecretOne",
      SHA256_SECRET_KEY: "verySecretOne",
    };

    const preflightLambdaFunction = new cdk.aws_lambda.Function(
      this,
      "PreflightLambdaFunction",
      {
        runtime: cdk.aws_lambda.Runtime.NODEJS_22_X,
        handler: "functions/preflight.handler",
        code: cdk.aws_lambda.Code.fromAsset(
          path.join(
            __dirname,
            "..",
            "..",
            "product-catalog-backend",
            "dist",
            "preflight.zip"
          )
        ),
        environment: lambdaCommonEnv,
        timeout: cdk.Duration.minutes(5),
      }
    );

    const authLambdaFunction = new cdk.aws_lambda.Function(
      this,
      "AuthLambdaFunction",
      {
        runtime: cdk.aws_lambda.Runtime.NODEJS_22_X,
        handler: "functions/auth.handler",
        code: cdk.aws_lambda.Code.fromAsset(
          path.join(
            __dirname,
            "..",
            "..",
            "product-catalog-backend",
            "dist",
            "auth.zip"
          )
        ),
        environment: lambdaCommonEnv,
        timeout: cdk.Duration.minutes(5),
      }
    );

    userTable.grantFullAccess(authLambdaFunction);

    const productsLambdaFunction = new cdk.aws_lambda.Function(
      this,
      "ProductsLambdaFunction",
      {
        runtime: cdk.aws_lambda.Runtime.NODEJS_22_X,
        handler: "functions/products.handler",
        code: cdk.aws_lambda.Code.fromAsset(
          path.join(
            __dirname,
            "..",
            "..",
            "product-catalog-backend",
            "dist",
            "products.zip"
          )
        ),
        environment: lambdaCommonEnv,
        timeout: cdk.Duration.minutes(5),
      }
    );

    userTable.grantFullAccess(productsLambdaFunction);
    productTable.grantFullAccess(productsLambdaFunction);
    productReviewTable.grantFullAccess(productsLambdaFunction);

    // ------------------------------------------------------
    const restApiGateway = new cdk.aws_apigateway.RestApi(
      this,
      "RestApiGateway"
    );

    new cdk.CfnOutput(this, "CfnRestApiGatewayUrl", {
      value: restApiGateway.url,
    });

    restApiGateway.root
      .addProxy({ anyMethod: false })
      .addMethod(
        "OPTIONS",
        new cdk.aws_apigateway.LambdaIntegration(preflightLambdaFunction)
      );

    const authResource = restApiGateway.root.addResource("auth");
    authResource.addMethod(
      "POST",
      new cdk.aws_apigateway.LambdaIntegration(authLambdaFunction)
    );
    authResource
      .addProxy({ anyMethod: false })
      .addMethod(
        "POST",
        new cdk.aws_apigateway.LambdaIntegration(authLambdaFunction)
      );

    const commonHttpVerbs = ["GET", "PUT", "POST", "DELETE"];

    const productsResource = restApiGateway.root.addResource("products");
    commonHttpVerbs.forEach((httpVerb) => {
      productsResource.addMethod(
        httpVerb,
        new cdk.aws_apigateway.LambdaIntegration(productsLambdaFunction)
      );
    });

    const productsProxyResource = productsResource.addProxy({
      anyMethod: false,
    });
    commonHttpVerbs.forEach((httpVerb) => {
      productsProxyResource.addMethod(
        httpVerb,
        new cdk.aws_apigateway.LambdaIntegration(productsLambdaFunction)
      );
    });
  }
}
