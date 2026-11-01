const express = require('express');
const { requireAuth } = require('../auth/middleware');
const { presignUpload } = require('../storage/s3');

const router = express.Router();

router.post('/presign', requireAuth, async (req, res, next) => {
  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) return res.status(400).json({ error: 'filename, contentType required' });
    res.json(await presignUpload(filename, contentType));
  } catch (err) { next(err); }
});

module.exports = router;
