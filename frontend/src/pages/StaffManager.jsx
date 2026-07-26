import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Users, UserPlus, Shield, Trash2, Key, CheckCircle, X, Edit3, Lock } from 'lucide-react';

const MODULE_LIST = [
  { id: 'inventory', name: 'Inventory / Stock' },
  { id: 'analytics', name: 'Analytics Breakdown' },
  { id: 'purchases', name: 'Purchases & Suppliers' },
  { id: 'returns', name: 'Courier Returns' },
  { id: 'ads', name: 'Paid Ads Tracker' },
  { id: 'pos', name: 'POS / New Sale' },
  { id: 'wholesale', name: 'Wholesale B2B Sales' },
  { id: 'orders', name: 'Sales & Orders' },
  { id: 'expenses', name: 'Expenses' },
  { id: 'reports', name: 'Profit & Loss Reports' },
  { id: 'finance', name: 'Finance & Dena-Pawna' },
  { id: 'staff', name: 'Staff & Users Management' }
];

export const StaffManager = () => {
  const { authFetch, currency, user } = useApp();
  const [staffList, setStaffList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier',
    permissions: ['inventory', 'pos', 'wholesale', 'orders']
  });

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/staff');
      const data = await res.json();
      if (res.ok) setStaffList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'cashier',
      permissions: ['inventory', 'pos', 'wholesale', 'orders']
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (member) => {
    setEditingStaff(member);
    setFormData({
      name: member.name,
      email: member.email,
      password: '',
      role: member.role,
      permissions: member.permissions || ['inventory', 'pos', 'wholesale', 'orders']
    });
    setShowModal(true);
  };

  const handlePermissionToggle = (modId) => {
    setFormData(prev => {
      const current = prev.permissions || [];
      if (current.includes(modId)) {
        return { ...prev, permissions: current.filter(p => p !== modId) };
      } else {
        return { ...prev, permissions: [...current, modId] };
      }
    });
  };

  const handleSelectAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: MODULE_LIST.map(m => m.id)
    }));
  };

  const handleDeselectAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: []
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        // Edit existing staff permissions & role
        const res = await authFetch(`/api/staff/${editingStaff.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            role: formData.role,
            permissions: formData.permissions
          })
        });
        const data = await res.json();
        if (res.ok) {
          setShowModal(false);
          fetchStaff();
          alert('Staff access permissions updated successfully!');
        } else {
          alert(`Error: ${data.error}`);
        }
      } else {
        // Create new staff member
        const res = await authFetch('/api/staff', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (res.ok) {
          setShowModal(false);
          setFormData({ name: '', email: '', password: '', role: 'cashier', permissions: ['inventory', 'pos', 'wholesale', 'orders'] });
          fetchStaff();
          alert('New staff account created with custom permissions!');
        } else {
          alert(`Error: ${data.error}`);
        }
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (id, staffName) => {
    if (window.confirm(`Are you sure you want to remove staff member "${staffName}"?`)) {
      try {
        const res = await authFetch(`/api/staff/${id}`, { method: 'DELETE' });
        if (res.ok) fetchStaff();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'owner':
        return <span className="badge badge-info" style={{ background: 'var(--accent-gradient)', color: '#fff' }}>Shop Owner</span>;
      case 'manager':
        return <span className="badge badge-info">Manager</span>;
      case 'cashier':
        return <span className="badge badge-success">Cashier / POS</span>;
      default:
        return <span className="badge badge-secondary">{role}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={24} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Staff & User Permissions Management</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Create team accounts and set custom module access permissions for each staff member
          </p>
        </div>

        {user?.role === 'owner' && (
          <button onClick={handleOpenAddModal} className="btn btn-primary">
            <UserPlus size={16} />
            <span>+ Add Staff Member</span>
          </button>
        )}
      </div>

      {/* Staff Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Module Access Permissions</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map(member => {
                const perms = member.permissions;
                const isOwner = member.role === 'owner';
                return (
                  <tr key={member.id}>
                    <td>
                      <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{member.name}</strong>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{member.email}</td>
                    <td>{getRoleBadge(member.role)}</td>
                    <td>
                      {isOwner ? (
                        <span className="badge badge-success" style={{ fontSize: '11px' }}>Full System Access</span>
                      ) : (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '300px' }}>
                          {(!perms || perms.length === 0) ? (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No Permissions</span>
                          ) : (
                            perms.map(pId => (
                              <span key={pId} className="badge badge-info" style={{ fontSize: '10px', padding: '2px 6px' }}>
                                {MODULE_LIST.find(m => m.id === pId)?.name || pId}
                              </span>
                            ))
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${member.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {member.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      {!isOwner && user?.role === 'owner' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleOpenEditModal(member)} className="btn btn-secondary btn-icon" title="Edit Permissions">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => handleDelete(member.id, member.name)} className="btn btn-danger btn-icon" title="Delete Staff">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Staff & Permissions Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>
                {editingStaff ? `Edit Access Permissions for ${editingStaff.name}` : 'Add New Staff Member'}
              </h3>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {!editingStaff && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-input"
                        required
                        placeholder="e.g. Sales Staff Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email Address (Login ID)</label>
                      <input
                        type="email"
                        className="form-input"
                        required
                        placeholder="staff@yourdomain.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <input
                        type="password"
                        className="form-input"
                        required
                        placeholder="Set strong password..."
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label className="form-label">Staff Role</label>
                  <select
                    className="form-select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="cashier">Cashier (POS & Sales)</option>
                    <option value="manager">Manager (Operations & Inventory)</option>
                  </select>
                </div>

                {/* Module Access Permissions Checkbox Matrix */}
                <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lock size={16} color="var(--accent-primary)" />
                      <h4 style={{ fontSize: '14px', fontWeight: '700' }}>Allowed Module Permissions</h4>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" onClick={handleSelectAllPermissions} style={{ fontSize: '11px', color: 'var(--accent-primary)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                        Select All
                      </button>
                      <button type="button" onClick={handleDeselectAllPermissions} style={{ fontSize: '11px', color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {MODULE_LIST.map(mod => {
                      const isChecked = formData.permissions?.includes(mod.id);
                      return (
                        <label key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: isChecked ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-primary)', borderRadius: '8px', border: isChecked ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)', cursor: 'pointer', fontSize: '13px' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(isChecked)}
                            onChange={() => handlePermissionToggle(mod.id)}
                            style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                          />
                          <span>{mod.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStaff ? 'Save Permissions' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
