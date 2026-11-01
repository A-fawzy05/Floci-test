require('dotenv').config();

function required(name, fallback) {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`missing env var ${name}`);
  return v;
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  floci: {
    endpoint: required('FLOCI_ENDPOINT', 'http://localhost:4566'),
    region: required('AWS_REGION', 'us-east-1'),
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
    }
  },
  cognito: {
    userPoolId: required('COGNITO_USER_POOL_ID'),
    clientId: required('COGNITO_CLIENT_ID')
  },
  tables: {
    users: required('DDB_USERS_TABLE', 'ChatUsers'),
    messages: required('DDB_MESSAGES_TABLE', 'ChatMessages')
  },
  s3Bucket: required('S3_BUCKET', 'chat-attachments')
};
