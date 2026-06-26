# 🎫 HelpDesk Pro — IT Ticket Management System

A full-stack IT Helpdesk application built with **React.js, Node.js, MongoDB, Socket.io**, and deployed on **GCP**. Mirrors real-world ServiceNow ITSM workflows including incident management, SLA tracking, role-based access, and real-time notifications.

---

## 🚀 Features

### 🔐 Authentication & Roles
- JWT-based authentication with secure login/register
- Three roles: **Admin**, **Agent**, **User** with different access levels
- Protected routes — users only see their own tickets

### 🎫 Ticket Management
- Create, view, update, delete tickets
- Auto-generated Ticket IDs (TKT-0001, TKT-0002...)
- Categories: Hardware, Software, Network, Access, Email, Other
- Priority levels: Critical, High, Medium, Low
- Status workflow: Open → In Progress → On Hold → Resolved → Closed

### ⏱ SLA Tracking
- Automatic SLA deadlines based on priority:
  - Critical: 4 hours | High: 8 hours | Medium: 24 hours | Low: 72 hours
- Live SLA breach indicators on ticket list and detail views

### 🚨 Escalation
- Agents/Admins can escalate any ticket to Critical priority
- Escalated tickets are clearly marked with a badge
- Real-time socket notifications on escalation

### 💬 Comments & Internal Notes
- Real-time comments via Socket.io (no page refresh needed)
- Agents/Admins can add **internal notes** invisible to end users
- Full comment history per ticket

### 📊 Analytics Dashboard
- Stats: Total, Open, In Progress, Resolved, SLA Breached, Escalated, Avg Resolution Time
- Line chart: Tickets created vs resolved (last 7 days)
- Pie chart: Tickets by category
- Bar chart: Tickets by priority
- Agent performance comparison (Admin only)

### 👥 User Management (Admin)
- View all users in a table
- Create new users with roles
- Edit name, role, department, active status inline
- Delete users

### 🔔 Real-Time Notifications
- Toast notifications when new tickets are created
- Live alerts when tickets are assigned or escalated
- Notification bell with unread count in topbar

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Vite), React Router, Recharts, Socket.io-client |
| Backend | Node.js, Express.js, REST APIs |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) + bcryptjs |
| Real-time | Socket.io (WebSockets) |
| Styling | Pure CSS with CSS Variables |
| Deployment | GCP (Cloud Run / App Engine) |

---

## 📂 Project Structure

```
helpdesk/
├── backend/
│   ├── src/
│   │   ├── models/          # User, Ticket, Comment schemas
│   │   ├── routes/          # auth, tickets, users, comments, dashboard
│   │   ├── middleware/       # JWT auth middleware
│   │   ├── server.js        # Express + Socket.io server
│   │   └── seed.js          # Demo data seeder
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── context/         # AuthContext, SocketContext
    │   ├── pages/           # auth, tickets, dashboard, admin, profile
    │   ├── components/      # Layout, Sidebar
    │   ├── utils/           # axios API instance
    │   └── App.jsx          # Routes
    ├── .env.example
    └── package.json
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/helpdesk-pro.git
cd helpdesk-pro
```

### 2. Setup Backend
```bash
cd backend
cp .env.example .env
# Edit .env — add your MongoDB URI and JWT secret
npm install
npm run seed        # Load demo data (optional)
npm run dev         # Starts on http://localhost:5000
```

### 3. Setup Frontend
```bash
cd ../frontend
cp .env.example .env
# Edit .env if backend URL differs
npm install
npm run dev         # Starts on http://localhost:5173
```

### 4. Open in browser
```
https://helpdesk-pro-omega.vercel.app/login
```

### Demo Credentials
| Role  | Email | Password |
|-------|-------|----------|
| Admin | admin@helpdesk.com | admin123 |
| Agent | agent@helpdesk.com | agent123 |
| User  | user@helpdesk.com  | user123  |

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET  | /api/auth/me | Get current user |
| PUT  | /api/auth/profile | Update profile |

### Tickets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/tickets | List tickets (with filters) |
| GET    | /api/tickets/:id | Ticket detail |
| POST   | /api/tickets | Create ticket |
| PUT    | /api/tickets/:id | Update ticket |
| PUT    | /api/tickets/:id/assign | Assign to agent |
| PUT    | /api/tickets/:id/escalate | Escalate ticket |
| DELETE | /api/tickets/:id | Delete ticket |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard/stats | Summary stats |
| GET | /api/dashboard/chart | Last 7 days chart |
| GET | /api/dashboard/by-category | Category breakdown |
| GET | /api/dashboard/by-priority | Priority breakdown |
| GET | /api/dashboard/agent-performance | Agent stats |

---

## 📸 Screenshots

> Login → Dashboard → Ticket List → Ticket Detail → Admin Panel

---

## 👩‍💻 Author

**Dasari Jahnavi**  
B.Tech Information Technology | SVCET, Chittoor AP  
[LinkedIn](https://www.linkedin.com/in/jahnavi-dasari-a6b332266?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app) | [GitHub](https://github.com/jahnavi2005-abc)
---

## 📄 License

MIT License — free to use and modify.
