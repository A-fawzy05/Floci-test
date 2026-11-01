const { WebSocketServer } = require('ws');
const url = require('url');
const { getUserFromToken } = require('../auth/cognito');
const { conversationId, putMessage } = require('../db/messages');

// ponytail: single-process in-memory map, move to a shared store only if you ever run more than one Node instance
const sockets = new Map();

function attach(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', async (ws, req) => {
    const { token } = url.parse(req.url, true).query;
    let user;
    try {
      user = await getUserFromToken(token);
    } catch {
      ws.close(4001, 'invalid token');
      return;
    }

    sockets.set(user.userId, ws);
    ws.on('close', () => sockets.delete(user.userId));

    ws.on('message', async raw => {
      let msg;
      try { msg = JSON.parse(raw); } catch {
        return ws.send(JSON.stringify({ type: 'error', message: 'invalid json' }));
      }
      if (msg.type !== 'message' || !msg.to || !msg.text) {
        return ws.send(JSON.stringify({ type: 'error', message: 'expected {type:"message", to, text}' }));
      }

      const convId = conversationId(user.userId, msg.to);
      const item = await putMessage(convId, user.userId, msg.text, msg.attachmentKey);
      const payload = JSON.stringify({ type: 'message', ...item });

      ws.send(payload);
      const recipient = sockets.get(msg.to);
      if (recipient && recipient.readyState === recipient.OPEN) recipient.send(payload);
    });
  });
}

module.exports = { attach };
