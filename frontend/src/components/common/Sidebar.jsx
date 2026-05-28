import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Ticket, PlusCircle, Users, User, LogOut, Headset
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Headset size={22} />
          <div>Help<span>Desk</span></div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">Main</div>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard /> Dashboard
        </NavLink>
        <NavLink to="/tickets" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Ticket /> All Tickets
        </NavLink>
        <NavLink to="/tickets/new" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <PlusCircle /> New Ticket
        </NavLink>

        {user?.role === 'admin' && (
          <>
            <div className="nav-section" style={{ marginTop: 8 }}>Admin</div>
            <NavLink to="/admin/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users /> Manage Users
            </NavLink>
          </>
        )}

        <div className="nav-section" style={{ marginTop: 8 }}>Account</div>
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <User /> Profile
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
          Logged in as <strong style={{ color: 'white' }}>{user?.name}</strong>
          <br />
          <span style={{ textTransform: 'capitalize', color: '#A8D5BC' }}>{user?.role}</span>
        </div>
        <button className="nav-item" onClick={handleLogout} style={{ padding: '8px 0' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}
