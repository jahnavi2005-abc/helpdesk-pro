import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Mail, Briefcase, Lock, Save } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', department: user?.department || '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      const payload = { name: form.name, department: form.department };
      if (form.password) payload.password = form.password;
      await updateProfile(payload);
      toast.success('Profile updated!');
      setForm(f => ({ ...f, password: '', confirmPassword: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setLoading(false); }
  };

  const roleColors = { admin: '#991b1b', agent: '#1d4ed8', user: '#374151' };

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="page-header">
        <div>
          <div className="page-title">My Profile</div>
          <div className="page-subtitle">Manage your account information</div>
        </div>
      </div>

      {/* Profile card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, flexShrink: 0 }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{user?.name}</div>
            <div style={{ color: 'var(--gray-500)', fontSize: 13, marginTop: 2 }}>{user?.email}</div>
            <span style={{ display: 'inline-block', marginTop: 8, background: roleColors[user?.role] + '20', color: roleColors[user?.role], padding: '3px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="card">
        <div className="card-header"><div className="card-title">Edit Profile</div></div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                <User size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />Full Name
              </label>
              <input className="form-input" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Mail size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />Email Address
              </label>
              <input className="form-input" value={user?.email} disabled
                style={{ background: 'var(--gray-50)', color: 'var(--gray-400)' }} />
              <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>Email cannot be changed</div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Briefcase size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />Department
              </label>
              <input className="form-input" placeholder="e.g. IT, HR, Finance" value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })} />
            </div>

            <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: 16, marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={14} /> Change Password
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" placeholder="Leave blank to keep current"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} minLength={6} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input className="form-input" type="password" placeholder="Repeat new password"
                  value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}>
              <Save size={15} /> {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
