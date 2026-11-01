const {
  SignUpCommand,
  AdminConfirmSignUpCommand,
  InitiateAuthCommand,
  GetUserCommand
} = require('@aws-sdk/client-cognito-identity-provider');
const { cognito } = require('../awsClients');
const env = require('../env');

async function signUp(username, email, password) {
  const out = await cognito.send(new SignUpCommand({
    ClientId: env.cognito.clientId,
    Username: username,
    Password: password,
    UserAttributes: [{ Name: 'email', Value: email }]
  }));
  await cognito.send(new AdminConfirmSignUpCommand({
    UserPoolId: env.cognito.userPoolId,
    Username: username
  }));
  return out.UserSub;
}

async function login(username, password) {
  const out = await cognito.send(new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: env.cognito.clientId,
    AuthParameters: { USERNAME: username, PASSWORD: password }
  }));
  return out.AuthenticationResult.AccessToken;
}

async function getUserFromToken(accessToken) {
  const out = await cognito.send(new GetUserCommand({ AccessToken: accessToken }));
  const sub = out.UserAttributes.find(a => a.Name === 'sub')?.Value;
  return { userId: sub, username: out.Username };
}

module.exports = { signUp, login, getUserFromToken };
