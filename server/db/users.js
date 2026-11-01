const { PutCommand, ScanCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../awsClients');
const env = require('../env');

async function putUser(userId, username, email) {
  await ddb.send(new PutCommand({
    TableName: env.tables.users,
    Item: { userId, username, email, createdAt: new Date().toISOString() }
  }));
}

async function listUsers(excludeUserId) {
  const out = await ddb.send(new ScanCommand({ TableName: env.tables.users }));
  return (out.Items || []).filter(u => u.userId !== excludeUserId);
}

async function getUser(userId) {
  const out = await ddb.send(new GetCommand({ TableName: env.tables.users, Key: { userId } }));
  return out.Item;
}

module.exports = { putUser, listUsers, getUser };
