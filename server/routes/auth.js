const express = require('express');
const { signUp, login, getUserFromToken } = require('../auth/cognito');
const { putUser } = require('../db/users');

const router = express.Router();

router.post('/signup', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'username, email, password required' });
    const userId = await signUp(username, email, password);
    await putUser(userId, username, email);
    res.json({ userId, username });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username, password required' });
    const accessToken = await login(username, password);
    const { userId } = await getUserFromToken(accessToken);
    res.json({ accessToken, userId, username });
  } catch (err) { next(err); }
});

module.exports = router;
