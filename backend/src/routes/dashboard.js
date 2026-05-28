const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const matchQuery = req.user.role === 'user' ? { createdBy: req.user._id } : {};

    const [total, open, inProgress, resolved, closed, critical, escalated] = await Promise.all([
      Ticket.countDocuments(matchQuery),
      Ticket.countDocuments({ ...matchQuery, status: 'Open' }),
      Ticket.countDocuments({ ...matchQuery, status: 'In Progress' }),
      Ticket.countDocuments({ ...matchQuery, status: 'Resolved' }),
      Ticket.countDocuments({ ...matchQuery, status: 'Closed' }),
      Ticket.countDocuments({ ...matchQuery, priority: 'Critical' }),
      Ticket.countDocuments({ ...matchQuery, escalated: true }),
    ]);

    // SLA breached = past deadline and not resolved/closed
    const slaBreached = await Ticket.countDocuments({
      ...matchQuery,
      slaDeadline: { $lt: new Date() },
      status: { $nin: ['Resolved', 'Closed'] }
    });

    // Avg resolution time (hours)
    const resolvedTickets = await Ticket.find({ ...matchQuery, resolvedAt: { $exists: true } });
    let avgResolutionTime = 0;
    if (resolvedTickets.length > 0) {
      const totalTime = resolvedTickets.reduce((acc, t) =>
        acc + (new Date(t.resolvedAt) - new Date(t.createdAt)), 0);
      avgResolutionTime = Math.round((totalTime / resolvedTickets.length) / (1000 * 60 * 60));
    }

    res.json({ total, open, inProgress, resolved, closed, critical, escalated, slaBreached, avgResolutionTime });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/chart - tickets by day (last 7 days)
router.get('/chart', protect, authorize('admin', 'agent'), async (req, res) => {
  try {
    const days = 7;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const start = new Date(); start.setDate(start.getDate() - i); start.setHours(0, 0, 0, 0);
      const end = new Date(start); end.setHours(23, 59, 59, 999);
      const count = await Ticket.countDocuments({ createdAt: { $gte: start, $lte: end } });
      const resolved = await Ticket.countDocuments({ resolvedAt: { $gte: start, $lte: end } });
      data.push({
        date: start.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
        created: count,
        resolved,
      });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/by-category
router.get('/by-category', protect, authorize('admin', 'agent'), async (req, res) => {
  try {
    const data = await Ticket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json(data.map(d => ({ name: d._id, value: d.count })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/by-priority
router.get('/by-priority', protect, authorize('admin', 'agent'), async (req, res) => {
  try {
    const data = await Ticket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    res.json(data.map(d => ({ name: d._id, value: d.count })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/agent-performance
router.get('/agent-performance', protect, authorize('admin'), async (req, res) => {
  try {
    const data = await Ticket.aggregate([
      { $match: { assignedTo: { $ne: null } } },
      { $group: {
        _id: '$assignedTo',
        total: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0] } },
      }},
    ]);
    const populated = await User.populate(data, { path: '_id', select: 'name email' });
    res.json(populated.map(d => ({
      agent: d._id?.name || 'Unassigned',
      total: d.total, resolved: d.resolved, closed: d.closed,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
