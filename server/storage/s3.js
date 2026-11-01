const { randomUUID } = require('crypto');
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3 } = require('../awsClients');
const env = require('../env');

async function presignUpload(filename, contentType) {
  const key = `${randomUUID()}-${filename}`;
  const cmd = new PutObjectCommand({ Bucket: env.s3Bucket, Key: key, ContentType: contentType });
  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });
  return { uploadUrl, key };
}

async function presignDownload(key) {
  const cmd = new GetObjectCommand({ Bucket: env.s3Bucket, Key: key });
  return getSignedUrl(s3, cmd, { expiresIn: 3600 });
}

module.exports = { presignUpload, presignDownload };
