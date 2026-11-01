const { randomUUID } = require('crypto');
const { PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../awsClients');
const env = require('../env');

function conversationId(userA, userB) {
  return [userA, userB].sort().join('#');
}

async function putMessage(convId, senderId, text, attachmentKey) {
  const createdAt = new Date().toISOString();
  const messageId = randomUUID();
  const item = { conversationId: convId, sortKey: `${createdAt}#${messageId}`, senderId, text, attachmentKey, createdAt, messageId };
  await ddb.send(new PutCommand({ TableName: env.tables.messages, Item: item }));
  return item;
}

async function getMessages(convId) {
  const out = await ddb.send(new QueryCommand({
    TableName: env.tables.messages,
    KeyConditionExpression: 'conversationId = :c',
    ExpressionAttributeValues: { ':c': convId }
  }));
  return out.Items || [];
}

module.exports = { conversationId, putMessage, getMessages };
