const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const { protect, authorize } = require('../middleware/auth');

// GET /api/comments/:ticketId
router.get('/:ticketId', protect, async (req, res) => {
  try {
    const query = { ticket: req.params.ticketId };
    // Regular users don't see internal notes
    if (req.user.role === 'user') query.isInternal = false;
    const comments = await Comment.find(query)
      .populate('author', 'name role')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/comments/:ticketId
router.post('/:ticketId', protect, async (req, res) => {
  try {
    const { message, isInternal } = req.body;
    const comment = await Comment.create({
      ticket: req.params.ticketId,
      author: req.user._id,
      message,
      isInternal: req.user.role !== 'user' ? isInternal : false,
    });
    await comment.populate('author', 'name role');

    // Emit real-time comment
    req.app.get('io').to(req.params.ticketId).emit('new_comment', comment);
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/comments/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
