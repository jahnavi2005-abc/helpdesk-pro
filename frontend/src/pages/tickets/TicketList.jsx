import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Search, Filter, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TicketList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', category: '', search: '' });

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      const { data } = await api.get(`/tickets?${params}`);
      setTickets(data.tickets);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, [page, filters]);

  const statusBadge = (s) => {
    const map = { Open: 'badge-open', 'In Progress': 'badge-inprogress', 'On Hold': 'badge-onhold', Resolved: 'badge-resolved', Closed: 'badge-closed' };
    return <span className={`badge ${map[s] || 'badge-open'}`}>{s}</span>;
  };

  const slaStatus = (ticket) => {
    if (['Resolved', 'Closed'].includes(ticket.status)) return null;
    const deadline = new Date(ticket.slaDeadline);
    const now = new Date();
    const hoursLeft = (deadline - now) / (1000 * 60 * 60);
    if (hoursLeft < 0) return <span className="sla-breach">SLA Breached</span>;
    if (hoursLeft < 2) return <span className="sla-warning">⚠ {Math.round(hoursLeft)}h left</span>;
    return null;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Tickets</div>
          <div className="page-subtitle">{total} tickets total</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/tickets/new')}>
          <Plus size={16} /> New Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-bar">
          <Search size={15} color="var(--gray-400)" />
          <input placeholder="Search tickets..." value={filters.search}
            onChange={e => { setFilters({ ...filters, search: e.target.value }); setPage(1); }} />
        </div>
        {[
          { key: 'status', opts: ['', 'Open', 'In Progress', 'On Hold', 'Resolved', 'Closed'], label: 'Status' },
          { key: 'priority', opts: ['', 'Critical', 'High', 'Medium', 'Low'], label: 'Priority' },
          { key: 'category', opts: ['', 'Hardware', 'Software', 'Network', 'Access', 'Email', 'Other'], label: 'Category' },
        ].map(({ key, opts, label }) => (
          <select key={key} className="form-input" style={{ width: 'auto' }}
            value={filters[key]} onChange={e => { setFilters({ ...filters, [key]: e.target.value }); setPage(1); }}>
            <option value="">{label}: All</option>
            {opts.filter(Boolean).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        {Object.values(filters).some(Boolean) && (
          <button className="btn btn-outline btn-sm" onClick={() => { setFilters({ status: '', priority: '', category: '', search: '' }); setPage(1); }}>
            Clear filters
          </button>
        )}
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Loading...</div>
          ) : tickets.length === 0 ? (
            <div className="empty-state"><p>No tickets found</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Title</th><th>Category</th><th>Priority</th>
                  <th>Status</th><th>Assigned To</th><th>SLA</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/tickets/${t._id}`)}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{t.ticketId}</td>
                    <td style={{ maxWidth: 220 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {t.escalated && <span className="escalated-badge">ESC</span>}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                      </div>
                    </td>
                    <td>{t.category}</td>
                    <td>
                      <span className={`priority-dot dot-${t.priority}`} />
                      {t.priority}
                    </td>
                    <td>{statusBadge(t.status)}</td>
                    <td>{t.assignedTo?.name || <span style={{ color: 'var(--gray-400)' }}>Unassigned</span>}</td>
                    <td>{slaStatus(t)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>Page {page} of {pages}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={14} /> Prev
              </button>
              <button className="btn btn-outline btn-sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
