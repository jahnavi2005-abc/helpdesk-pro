const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/helpdesk';

const userSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true }, password: String,
  role: String, department: String, isActive: { type: Boolean, default: true }
}, { timestamps: true });

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, unique: true },
  title: String, description: String, category: String,
  priority: String, status: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  slaDeadline: Date, resolvedAt: Date, escalated: { type: Boolean, default: false },
  tags: [String],
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Ticket = mongoose.model('Ticket', ticketSchema);

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({});
  await Ticket.deleteMany({});
  console.log('Cleared existing data');

  const hash = async (p) => bcrypt.hash(p, 10);

  const users = await User.insertMany([
    { name: 'Admin User',  email: 'admin@helpdesk.com', password: await hash('admin123'), role: 'admin',  department: 'IT' },
    { name: 'Support Agent', email: 'agent@helpdesk.com', password: await hash('agent123'), role: 'agent', department: 'Support' },
    { name: 'John Employee', email: 'user@helpdesk.com',  password: await hash('user123'),  role: 'user',  department: 'HR' },
    { name: 'Priya Sharma',  email: 'priya@helpdesk.com', password: await hash('user123'),  role: 'user',  department: 'Finance' },
  ]);

  const [admin, agent, user1, user2] = users;
  console.log('Created users');

  const slaHours = { Critical: 4, High: 8, Medium: 24, Low: 72 };
  const mkSLA = (p) => new Date(Date.now() + slaHours[p] * 3600000);

  const tickets = [
    { ticketId: 'TKT-0001', title: 'Laptop not booting after Windows update', description: 'My laptop stopped booting after the latest Windows update. It shows a blue screen with error code 0x0000007E.', category: 'Hardware', priority: 'High', status: 'Open', createdBy: user1._id, slaDeadline: mkSLA('High'), tags: ['laptop', 'windows', 'boot'] },
    { ticketId: 'TKT-0002', title: 'Cannot access company VPN', description: 'I am unable to connect to the company VPN from home. Getting error "Authentication failed" even with correct credentials.', category: 'Network', priority: 'Critical', status: 'In Progress', createdBy: user2._id, assignedTo: agent._id, slaDeadline: mkSLA('Critical'), escalated: true, tags: ['vpn', 'network', 'remote-work'] },
    { ticketId: 'TKT-0003', title: 'Outlook not syncing emails', description: 'Outlook has not been syncing new emails since yesterday morning. Tried restarting the application but still not working.', category: 'Email', priority: 'Medium', status: 'Resolved', createdBy: user1._id, assignedTo: agent._id, slaDeadline: mkSLA('Medium'), resolvedAt: new Date(), tags: ['email', 'outlook'] },
    { ticketId: 'TKT-0004', title: 'Request access to SAP Finance module', description: 'I need access to the SAP Finance module for the new project starting next week. Manager approval attached.', category: 'Access', priority: 'Low', status: 'Open', createdBy: user2._id, slaDeadline: mkSLA('Low'), tags: ['sap', 'access', 'finance'] },
    { ticketId: 'TKT-0005', title: 'Office printer showing offline', description: 'The shared printer on 3rd floor is showing as offline. Multiple employees are affected and cannot print documents.', category: 'Hardware', priority: 'High', status: 'In Progress', createdBy: user1._id, assignedTo: admin._id, slaDeadline: mkSLA('High'), tags: ['printer', 'hardware'] },
    { ticketId: 'TKT-0006', title: 'Password reset request', description: 'My account got locked after multiple failed login attempts. Please reset my password.', category: 'Access', priority: 'Medium', status: 'Closed', createdBy: user2._id, assignedTo: agent._id, slaDeadline: mkSLA('Medium'), resolvedAt: new Date(), tags: ['password', 'account'] },
  ];

  await Ticket.insertMany(tickets);
  console.log('Created sample tickets');
  console.log('\n✅ Seed complete!\n');
  console.log('Demo login credentials:');
  console.log('  Admin : admin@helpdesk.com / admin123');
  console.log('  Agent : agent@helpdesk.com / agent123');
  console.log('  User  : user@helpdesk.com  / user123');

  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
