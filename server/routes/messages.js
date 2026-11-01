const express = require('express');
const { requireAuth } = require('../auth/middleware');
const { conversationId, getMessages } = require('../db/messages');
const { presignDownload } = require('../storage/s3');

const router = express.Router();

router.get('/:otherUserId', requireAuth, async (req, res, next) => {
  try {
    const convId = conversationId(req.user.userId, req.params.otherUserId);
    const items = await getMessages(convId);
    const withUrls = await Promise.all(items.map(async m => ({
      ...m,
      attachmentUrl: m.attachmentKey ? await presignDownload(m.attachmentKey) : null
    })));
    res.json(withUrls);
  } catch (err) { next(err); }
});

module.exports = router;
