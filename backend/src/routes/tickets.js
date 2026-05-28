const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { protect, authorize } = require('../middleware/auth');

// GET /api/tickets - list with filters
router.get('/', protect, async (req, res) => {
  try {
    const { status, priority, category, assignedTo, search, page = 1, limit = 10 } = req.query;
    const query = {};

    // Users only see their own tickets
    if (req.user.role === 'user') query.createdBy = req.user._id;

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (assignedTo) query.assignedTo = assignedTo;
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { ticketId: { $regex: search, $options: 'i' } },
    ];

    const total = await Ticket.countDocuments(query);
    const tickets = await Ticket.find(query)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ tickets, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tickets/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tickets - create
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, category, priority, tags } = req.body;
    const ticket = await Ticket.create({
      title, description, category, priority, tags,
      createdBy: req.user._id,
    });
    await ticket.populate('createdBy', 'name email');

    // Emit socket event
    req.app.get('io').emit('ticket_created', ticket);

    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/tickets/:id - update
router.put('/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Users can only update their own tickets if still Open
    if (req.user.role === 'user') {
      if (ticket.createdBy.toString() !== req.user._id.toString())
        return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, category, priority, status, assignedTo, tags } = req.body;

    if (title) ticket.title = title;
    if (description) ticket.description = description;
    if (category) ticket.category = category;
    if (priority) ticket.priority = priority;
    if (tags) ticket.tags = tags;
    if (assignedTo !== undefined) ticket.assignedTo = assignedTo || null;

    // Status transitions
    if (status && status !== ticket.status) {
      ticket.status = status;
      if (status === 'Resolved') ticket.resolvedAt = new Date();
      if (status === 'Closed') ticket.closedAt = new Date();
    }

    const updated = await ticket.save();
    await updated.populate('createdBy', 'name email');
    await updated.populate('assignedTo', 'name email');

    req.app.get('io').emit('ticket_updated', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/tickets/:id/assign
router.put('/:id/assign', protect, authorize('admin', 'agent'), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    ticket.assignedTo = req.body.agentId;
    ticket.status = 'In Progress';
    await ticket.save();
    await ticket.populate('assignedTo', 'name email');
    req.app.get('io').emit('ticket_assigned', ticket);
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/tickets/:id/escalate
router.put('/:id/escalate', protect, authorize('admin', 'agent'), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    ticket.escalated = true;
    ticket.escalationReason = req.body.reason || 'Manually escalated';
    ticket.priority = 'Critical';
    await ticket.save();
    req.app.get('io').emit('ticket_escalated', ticket);
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tickets/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Ticket.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ticket deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
