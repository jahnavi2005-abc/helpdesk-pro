import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

export default function CreateTicket() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: 'Software', priority: 'Medium', tags: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [] };
      const { data } = await api.post('/tickets', payload);
      toast.success(`Ticket ${data.ticketId} created!`);
      navigate(`/tickets/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create ticket');
    } finally { setLoading(false); }
  };

  const slaInfo = { Critical: '4 hours', High: '8 hours', Medium: '24 hours', Low: '72 hours' };

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="page-header">
        <div>
          <div className="page-title">Create New Ticket</div>
          <div className="page-subtitle">Describe your issue and we'll assign it to the right agent</div>
        </div>
        <button className="btn btn-outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" placeholder="Brief description of the issue"
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea className="form-input" rows={5} placeholder="Provide as much detail as possible about the issue..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required style={{ minHeight: 120 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {['Hardware', 'Software', 'Network', 'Access', 'Email', 'Other'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {/* SLA info box */}
            <div style={{ padding: 12, background: 'var(--primary-bg)', borderRadius: 8, marginBottom: 16, fontSize: 13, color: 'var(--gray-600)' }}>
              <strong>SLA for {form.priority} priority:</strong> Must be resolved within <strong>{slaInfo[form.priority]}</strong>
            </div>

            <div className="form-group">
              <label className="form-label">Tags <span style={{ fontWeight: 400, color: 'var(--gray-400)' }}>(optional, comma-separated)</span></label>
              <input className="form-input" placeholder="e.g. laptop, wifi, password-reset"
                value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Ticket'}
              </button>
              <button className="btn btn-outline btn-lg" type="button" onClick={() => navigate(-1)}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
