const express = require('express');
const { requireAuth } = require('../auth/middleware');
const { listUsers } = require('../db/users');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    res.json(await listUsers(req.user.userId));
  } catch (err) { next(err); }
});

module.exports = router;
