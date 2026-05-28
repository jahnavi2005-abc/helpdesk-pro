import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { UserPlus, Trash2, Edit2, Check, X } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user', department: '' });

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const startEdit = (user) => {
    setEditingId(user._id);
    setEditForm({ name: user.name, role: user.role, department: user.department || '', isActive: user.isActive });
  };

  const saveEdit = async (id) => {
    try {
      await api.put(`/users/${id}`, editForm);
      toast.success('User updated');
      setEditingId(null);
      fetchUsers();
    } catch (err) { toast.error('Failed to update'); }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const addUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', newUser);
      toast.success('User created');
      setShowAdd(false);
      setNewUser({ name: '', email: '', password: '', role: 'user', department: '' });
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create user'); }
  };

  const roleBadge = (role) => {
    const map = { admin: '#fee2e2:#991b1b', agent: '#dbeafe:#1d4ed8', user: '#f3f4f6:#374151' };
    const [bg, color] = (map[role] || '#f3f4f6:#374151').split(':');
    return <span style={{ background: bg, color, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{role}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Manage Users</div>
          <div className="page-subtitle">{users.length} users registered</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {/* Add user form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">Create New User</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}><X size={16} /></button>
          </div>
          <div className="card-body">
            <form onSubmit={addUser}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Full Name</label>
                  <input className="form-input" placeholder="Name" value={newUser.name}
                    onChange={e => setNewUser({ ...newUser, name: e.target.value })} required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="Email" value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" placeholder="Password" value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })} required minLength={6} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Role</label>
                  <select className="form-input" value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                    <option value="user">User</option>
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Department</label>
                  <input className="form-input" placeholder="e.g. IT, HR" value={newUser.department}
                    onChange={e => setNewUser({ ...newUser, department: e.target.value })} />
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" type="submit">Create User</button>
                <button className="btn btn-outline" type="button" onClick={() => setShowAdd(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Loading users...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Joined</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      {editingId === u._id ? (
                        <input className="form-input" style={{ padding: '4px 8px', fontSize: 13 }}
                          value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          {u.name}
                        </div>
                      )}
                    </td>
                    <td style={{ color: 'var(--gray-500)' }}>{u.email}</td>
                    <td>
                      {editingId === u._id ? (
                        <select className="form-input" style={{ padding: '4px 8px', fontSize: 13, width: 'auto' }}
                          value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                          <option value="user">User</option>
                          <option value="agent">Agent</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : roleBadge(u.role)}
                    </td>
                    <td>
                      {editingId === u._id ? (
                        <input className="form-input" style={{ padding: '4px 8px', fontSize: 13 }}
                          value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} />
                      ) : (u.department || '—')}
                    </td>
                    <td>
                      {editingId === u._id ? (
                        <select className="form-input" style={{ padding: '4px 8px', fontSize: 13, width: 'auto' }}
                          value={editForm.isActive} onChange={e => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}>
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      ) : (
                        <span style={{ color: u.isActive ? 'var(--success)' : 'var(--danger)', fontWeight: 600, fontSize: 12 }}>
                          {u.isActive ? '● Active' : '● Inactive'}
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--gray-500)' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {editingId === u._id ? (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={() => saveEdit(u._id)}><Check size={13} /></button>
                            <button className="btn btn-outline btn-sm" onClick={() => setEditingId(null)}><X size={13} /></button>
                          </>
                        ) : (
                          <>
                            <button className="btn btn-outline btn-sm" onClick={() => startEdit(u)}><Edit2 size={13} /></button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u._id)}><Trash2 size={13} /></button>
                          </>
                        )}
                      </div>
                    </td>
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
