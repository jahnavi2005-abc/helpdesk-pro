import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Ticket, Clock, AlertTriangle, CheckCircle, XCircle, TrendingUp, Zap, Users } from 'lucide-react';

const COLORS = ['#2E7D52', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [agentData, setAgentData] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, r] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/tickets?limit=5'),
        ]);
        setStats(s.data);
        setRecentTickets(r.data.tickets);

        if (user?.role !== 'user') {
          const [c, cat, pri, ag] = await Promise.all([
            api.get('/dashboard/chart'),
            api.get('/dashboard/by-category'),
            api.get('/dashboard/by-priority'),
            user?.role === 'admin' ? api.get('/dashboard/agent-performance') : Promise.resolve({ data: [] }),
          ]);
          setChartData(c.data);
          setCategoryData(cat.data);
          setPriorityData(pri.data);
          setAgentData(ag.data);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [user]);

  const statusBadge = (s) => {
    const map = { Open: 'badge-open', 'In Progress': 'badge-inprogress', 'On Hold': 'badge-onhold', Resolved: 'badge-resolved', Closed: 'badge-closed' };
    return <span className={`badge ${map[s] || 'badge-open'}`}>{s}</span>;
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>Loading dashboard...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</div>
          <div className="page-subtitle">Here's what's happening with your tickets today</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/tickets/new')}>
          + New Ticket
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total Tickets', value: stats.total || 0, icon: <Ticket size={20} />, color: '#2E7D52', bg: '#f0faf5' },
          { label: 'Open', value: stats.open || 0, icon: <Zap size={20} />, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'In Progress', value: stats.inProgress || 0, icon: <Clock size={20} />, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Resolved', value: stats.resolved || 0, icon: <CheckCircle size={20} />, color: '#10b981', bg: '#f0fdf4' },
          { label: 'SLA Breached', value: stats.slaBreached || 0, icon: <AlertTriangle size={20} />, color: '#ef4444', bg: '#fef2f2' },
          { label: 'Escalated', value: stats.escalated || 0, icon: <TrendingUp size={20} />, color: '#8b5cf6', bg: '#f5f3ff' },
          { label: 'Avg Resolution', value: `${stats.avgResolutionTime || 0}h`, icon: <Clock size={20} />, color: '#06b6d4', bg: '#ecfeff' },
          { label: 'Critical', value: stats.critical || 0, icon: <XCircle size={20} />, color: '#ef4444', bg: '#fef2f2' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts - admin/agent only */}
      {user?.role !== 'user' && (
        <div className="charts-grid">
          <div className="card">
            <div className="card-header"><div className="card-title">Tickets (Last 7 Days)</div></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="created" stroke="#2E7D52" strokeWidth={2} dot={false} name="Created" />
                  <Line type="monotone" dataKey="resolved" stroke="#3b82f6" strokeWidth={2} dot={false} name="Resolved" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Tickets by Category</div></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Tickets by Priority</div></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Tickets" radius={[4, 4, 0, 0]}>
                    {priorityData.map((entry, i) => {
                      const c = { Critical: '#ef4444', High: '#f59e0b', Medium: '#3b82f6', Low: '#10b981' };
                      return <Cell key={i} fill={c[entry.name] || '#2E7D52'} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {user?.role === 'admin' && agentData.length > 0 && (
            <div className="card">
              <div className="card-header"><div className="card-title">Agent Performance</div></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={agentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
                    <XAxis dataKey="agent" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" fill="#2E7D52" name="Total" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="resolved" fill="#3b82f6" name="Resolved" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Tickets */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <div className="card-title">Recent Tickets</div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/tickets')}>View All</button>
        </div>
        <div className="table-wrapper">
          {recentTickets.length === 0 ? (
            <div className="empty-state"><Ticket size={40} /><p>No tickets yet</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Title</th><th>Priority</th><th>Status</th><th>Created By</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map(t => (
                  <tr key={t._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/tickets/${t._id}`)}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600 }}>{t.ticketId}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.escalated && <span className="escalated-badge" style={{ marginRight: 6 }}>ESC</span>}
                      {t.title}
                    </td>
                    <td>
                      <span className={`priority-dot dot-${t.priority}`} />
                      {t.priority}
                    </td>
                    <td>{statusBadge(t.status)}</td>
                    <td>{t.createdBy?.name}</td>
                    <td>{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
