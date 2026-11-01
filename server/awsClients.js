const { CognitoIdentityProviderClient } = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { S3Client } = require('@aws-sdk/client-s3');
const env = require('./env');

const base = { endpoint: env.floci.endpoint, region: env.floci.region, credentials: env.floci.credentials };

const cognito = new CognitoIdentityProviderClient(base);
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient(base));
const s3 = new S3Client({ ...base, forcePathStyle: true });

module.exports = { cognito, ddb, s3 };
