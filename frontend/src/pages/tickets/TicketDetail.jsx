import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Send, AlertTriangle, UserCheck, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const commentsEndRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [t, c] = await Promise.all([
          api.get(`/tickets/${id}`),
          api.get(`/comments/${id}`),
        ]);
        setTicket(t.data);
        setComments(c.data);
        if (user?.role !== 'user') {
          const a = await api.get('/users/agents');
          setAgents(a.data);
        }
      } catch (err) { toast.error('Failed to load ticket'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id, user]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_room', id);
    socket.on('new_comment', (c) => setComments(prev => [...prev, c]));
    return () => socket.off('new_comment');
  }, [socket, id]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const updateStatus = async (status) => {
    try {
      const { data } = await api.put(`/tickets/${id}`, { status });
      setTicket(data);
      toast.success(`Status updated to ${status}`);
    } catch (err) { toast.error('Failed to update status'); }
  };

  const assignTicket = async (agentId) => {
    try {
      const { data } = await api.put(`/tickets/${id}/assign`, { agentId });
      setTicket(data);
      toast.success('Ticket assigned');
    } catch (err) { toast.error('Failed to assign'); }
  };

  const escalate = async () => {
    if (!confirm('Escalate this ticket to Critical priority?')) return;
    try {
      const { data } = await api.put(`/tickets/${id}/escalate`, { reason: 'Manually escalated by agent' });
      setTicket(data);
      toast.success('Ticket escalated');
    } catch (err) { toast.error('Failed to escalate'); }
  };

  const sendComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSending(true);
    try {
      await api.post(`/comments/${id}`, { message: comment, isInternal });
      setComment('');
      setIsInternal(false);
    } catch (err) { toast.error('Failed to send comment'); }
    finally { setSending(false); }
  };

  const statusBadge = (s) => {
    const map = { Open: 'badge-open', 'In Progress': 'badge-inprogress', 'On Hold': 'badge-onhold', Resolved: 'badge-resolved', Closed: 'badge-closed' };
    return <span className={`badge ${map[s] || 'badge-open'}`}>{s}</span>;
  };

  const priorityBadge = (p) => {
    const map = { Critical: 'badge-critical', High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
    return <span className={`badge ${map[p] || 'badge-medium'}`}>{p}</span>;
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>Loading ticket...</div>;
  if (!ticket) return <div style={{ textAlign: 'center', padding: 60 }}>Ticket not found</div>;

  const slaBreached = new Date(ticket.slaDeadline) < new Date() && !['Resolved', 'Closed'].includes(ticket.status);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}><ArrowLeft size={16} /></button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 700, fontSize: 16 }}>{ticket.ticketId}</span>
              {ticket.escalated && <span className="escalated-badge">ESCALATED</span>}
            </div>
            <div className="page-subtitle">Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</div>
          </div>
        </div>
      </div>

      <div className="ticket-detail-grid">
        {/* Left: main content */}
        <div>
          <div className="card">
            <div className="card-body">
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>{ticket.title}</h2>
              <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
              {ticket.tags?.length > 0 && (
                <div style={{ marginTop: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ticket.tags.map(tag => (
                    <span key={tag} style={{ background: 'var(--primary-bg)', color: 'var(--primary)', padding: '2px 10px', borderRadius: 99, fontSize: 12 }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status update - agents/admin */}
          {user?.role !== 'user' && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-header"><div className="card-title">Update Status</div></div>
              <div className="card-body">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Open', 'In Progress', 'On Hold', 'Resolved', 'Closed'].map(s => (
                    <button key={s} className={`btn btn-sm ${ticket.status === s ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => updateStatus(s)}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <div className="card-title">Comments ({comments.length})</div>
            </div>
            <div className="card-body">
              <div style={{ maxHeight: 360, overflowY: 'auto', marginBottom: 16 }}>
                {comments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--gray-400)', fontSize: 13 }}>No comments yet. Be the first to respond.</div>
                ) : (
                  comments.map(c => (
                    <div key={c._id} className="comment-item">
                      <div className="comment-avatar">{c.author?.name?.charAt(0).toUpperCase()}</div>
                      <div className={`comment-bubble ${c.isInternal ? 'internal' : ''}`}>
                        <div className="comment-meta">
                          <strong>{c.author?.name}</strong> · {c.author?.role}
                          {c.isInternal && <span style={{ marginLeft: 6, color: '#854d0e', fontSize: 10, fontWeight: 700 }}>🔒 INTERNAL</span>}
                          <span style={{ marginLeft: 8 }}>{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--gray-700)', whiteSpace: 'pre-wrap' }}>{c.message}</div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Comment form */}
              {!['Closed'].includes(ticket.status) && (
                <form onSubmit={sendComment}>
                  <textarea className="form-input" rows={3} placeholder="Write a comment..."
                    value={comment} onChange={e => setComment(e.target.value)} style={{ marginBottom: 8 }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {user?.role !== 'user' && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--gray-600)' }}>
                        <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                        <Lock size={13} /> Internal note
                      </label>
                    )}
                    <button className="btn btn-primary btn-sm" type="submit" disabled={sending || !comment.trim()}
                      style={{ marginLeft: 'auto' }}>
                      <Send size={13} /> {sending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right: sidebar info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Ticket info */}
          <div className="card">
            <div className="card-header"><div className="card-title">Ticket Details</div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                ['Status', statusBadge(ticket.status)],
                ['Priority', priorityBadge(ticket.priority)],
                ['Category', ticket.category],
                ['Created By', ticket.createdBy?.name],
                ['Assigned To', ticket.assignedTo?.name || 'Unassigned'],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{val}</span>
                </div>
              ))}

              {/* SLA */}
              <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>SLA Deadline</div>
                <div className={slaBreached ? 'sla-breach' : ''} style={{ fontSize: 13 }}>
                  {new Date(ticket.slaDeadline).toLocaleString('en-IN')}
                  {slaBreached && <div style={{ fontSize: 11, marginTop: 2 }}>⚠ SLA BREACHED</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Assign - admin/agent */}
          {user?.role !== 'user' && agents.length > 0 && (
            <div className="card">
              <div className="card-header"><div className="card-title">Assign Agent</div></div>
              <div className="card-body">
                <select className="form-input" value={ticket.assignedTo?._id || ''}
                  onChange={e => assignTicket(e.target.value || null)}>
                  <option value="">Unassigned</option>
                  {agents.map(a => <option key={a._id} value={a._id}>{a.name} ({a.role})</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Escalate */}
          {user?.role !== 'user' && !ticket.escalated && !['Resolved', 'Closed'].includes(ticket.status) && (
            <button className="btn btn-danger" onClick={escalate} style={{ justifyContent: 'center' }}>
              <AlertTriangle size={16} /> Escalate to Critical
            </button>
          )}

          {/* Timestamps */}
          <div className="card">
            <div className="card-body" style={{ fontSize: 12, color: 'var(--gray-500)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>Created: {new Date(ticket.createdAt).toLocaleString('en-IN')}</div>
              <div>Updated: {new Date(ticket.updatedAt).toLocaleString('en-IN')}</div>
              {ticket.resolvedAt && <div style={{ color: 'var(--success)' }}>Resolved: {new Date(ticket.resolvedAt).toLocaleString('en-IN')}</div>}
              {ticket.closedAt && <div>Closed: {new Date(ticket.closedAt).toLocaleString('en-IN')}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
