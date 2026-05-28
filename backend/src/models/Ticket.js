const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, unique: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['Hardware', 'Software', 'Network', 'Access', 'Email', 'Other'],
    default: 'Other'
  },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'On Hold', 'Resolved', 'Closed'],
    default: 'Open'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  slaDeadline: { type: Date },
  resolvedAt: { type: Date },
  closedAt: { type: Date },
  tags: [{ type: String }],
  attachments: [{ filename: String, url: String }],
  escalated: { type: Boolean, default: false },
  escalationReason: { type: String, default: '' },
}, { timestamps: true });

// Auto-generate ticketId
ticketSchema.pre('save', async function (next) {
  if (!this.ticketId) {
    const count = await mongoose.model('Ticket').countDocuments();
    this.ticketId = `TKT-${String(count + 1).padStart(4, '0')}`;
  }
  // Auto-set SLA based on priority
  if (!this.slaDeadline) {
    const slaHours = { Critical: 4, High: 8, Medium: 24, Low: 72 };
    const hours = slaHours[this.priority] || 24;
    this.slaDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
