const path = require('path');
const http = require('http');
const express = require('express');
const env = require('./env');
const wsServer = require('./ws/server');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/attachments', require('./routes/attachments'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.$metadata?.httpStatusCode || 500).json({ error: err.message || 'server error' });
});

const server = http.createServer(app);
wsServer.attach(server);

server.listen(env.port, '0.0.0.0', () => {
  console.log(`floci-chat listening on :${env.port}`);
});
