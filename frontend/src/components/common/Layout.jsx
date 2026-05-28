import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Bell } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/tickets': 'All Tickets',
  '/tickets/new': 'Create Ticket',
  '/admin/users': 'Manage Users',
  '/profile': 'My Profile',
};

export default function Layout() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  const [notifications, setNotifications] = useState(0);

  const title = pageTitles[location.pathname] || 'HelpDesk';

  useEffect(() => {
    if (!socket) return;
    socket.on('ticket_created', (ticket) => {
      if (user?.role !== 'user') {
        toast.success(`New ticket: ${ticket.title}`, { icon: '🎫' });
        setNotifications(n => n + 1);
      }
    });
    socket.on('ticket_assigned', (ticket) => {
      if (ticket.assignedTo?._id === user?._id || user?.role === 'admin') {
        toast(`Ticket ${ticket.ticketId} assigned`, { icon: '📋' });
      }
    });
    socket.on('ticket_escalated', (ticket) => {
      if (user?.role !== 'user') {
        toast.error(`Ticket ${ticket.ticketId} escalated to Critical!`);
        setNotifications(n => n + 1);
      }
    });
    return () => {
      socket.off('ticket_created');
      socket.off('ticket_assigned');
      socket.off('ticket_escalated');
    };
  }, [socket, user]);

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost" style={{ position: 'relative' }}
              onClick={() => setNotifications(0)}>
              <Bell size={18} />
              {notifications > 0 && (
                <span style={{ position: 'absolute', top: 2, right: 2, background: 'var(--danger)', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {notifications}
                </span>
              )}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13 }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-500)', textTransform: 'capitalize' }}>{user?.role}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
