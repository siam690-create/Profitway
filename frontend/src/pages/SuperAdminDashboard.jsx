import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MetricCard } from '../components/MetricCard';
import { 
  ShieldCheck, 
  Store, 
  DollarSign, 
  Users, 
  Clock, 
  CheckCircle, 
  Calendar, 
  LogOut, 
  RefreshCw,
  Edit2,
  X,
  HelpCircle,
  MessageSquare,
  Send,
  CheckSquare
} from 'lucide-react';

export const SuperAdminDashboard = () => {
  const { authFetch, logout, currency } = useApp();
  const [activeTab, setActiveTab] = useState('tenants'); // 'tenants' or 'tickets'
  const [adminData, setAdminData] = useState(null);
  const [shops, setShops] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Edit Master Shop Modal State
  const [editingShop, setEditingShop] = useState(null);
  const [editShopName, setEditShopName] = useState('');
  const [editShopCode, setEditShopCode] = useState('');

  // Super Admin Ticket Reply Modal State
  const [selectedTicketData, setSelectedTicketData] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [updateStatus, setUpdateStatus] = useState('In Progress');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchSuperAdminData = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/super-admin/dashboard');
      const data = await res.json();
      if (res.ok) {
        setAdminData(data);
      }

      const tenantsRes = await authFetch('/api/super-admin/tenants');
      const tenantsData = await tenantsRes.json();
      if (tenantsRes.ok) {
        setShops(tenantsData);
      }

      const ticketsRes = await authFetch('/api/support/tickets');
      const ticketsData = await ticketsRes.json();
      if (ticketsRes.ok) {
        setTickets(ticketsData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuperAdminData();
  }, []);

  const handleOpenEditShop = (shop) => {
    setEditingShop(shop);
    setEditShopName(shop.shop_name);
    setEditShopCode(shop.shop_code || `SHOP-${1000 + shop.id}`);
  };

  const handleSaveMasterShopDetails = async (e) => {
    e.preventDefault();
    if (!editingShop) return;

    try {
      const res = await authFetch(`/api/super-admin/tenants/${editingShop.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          shop_name: editShopName,
          shop_code: editShopCode
        })
      });

      const data = await res.json();
      if (res.ok) {
        setEditingShop(null);
        fetchSuperAdminData();
        alert('Master Shop Name & Unique Shop Code updated successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleExtendTrial = async (shopId) => {
    const days = prompt('Enter number of days to extend trial (e.g. 7 or 14):', '14');
    if (!days || isNaN(days)) return;

    try {
      const res = await authFetch(`/api/super-admin/tenants/${shopId}`, {
        method: 'PATCH',
        body: JSON.stringify({ extend_days: Number(days), subscription_status: 'trial' })
      });
      if (res.ok) {
        fetchSuperAdminData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleActivateSubscription = async (shopId) => {
    if (window.confirm('Activate full subscription for this shop?')) {
      try {
        const res = await authFetch(`/api/super-admin/tenants/${shopId}`, {
          method: 'PATCH',
          body: JSON.stringify({ subscription_status: 'active' })
        });
        if (res.ok) {
          fetchSuperAdminData();
        }
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleApproveShop = async (shopId, newStatus = 'trial') => {
    if (window.confirm(`Approve this shop registration and activate account access?`)) {
      try {
        const res = await authFetch(`/api/super-admin/tenants/${shopId}`, {
          method: 'PATCH',
          body: JSON.stringify({ subscription_status: newStatus })
        });
        if (res.ok) {
          alert('Shop account approved successfully! Confirmation email dispatched to Shop Owner.');
          fetchSuperAdminData();
        }
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleViewTicketThread = async (ticketId) => {
    try {
      const res = await authFetch(`/api/support/tickets/${ticketId}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedTicketData(data.ticket);
        setTicketMessages(data.messages);
        setUpdateStatus(data.ticket.status);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSuperAdminSendReply = async (e) => {
    e.preventDefault();
    if (!adminReplyText || !selectedTicketData) return;

    setSendingReply(true);
    try {
      const res = await authFetch(`/api/support/tickets/${selectedTicketData.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          message: adminReplyText,
          status: updateStatus
        })
      });

      if (res.ok) {
        setAdminReplyText('');
        alert('Reply sent successfully! Email notification dispatched to Shop Owner.');
        handleViewTicketThread(selectedTicketData.id);
        fetchSuperAdminData();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSendingReply(false);
    }
  };

  const handleQuickStatusChange = async (ticketId, newStatus) => {
    try {
      const res = await authFetch(`/api/support/tickets/${ticketId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchSuperAdminData();
        if (selectedTicketData?.id === ticketId) {
          handleViewTicketThread(ticketId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!adminData) {
    return <div style={{ padding: '60px', textAlign: 'center' }}>Loading Super Admin Controller...</div>;
  }

  const { metrics } = adminData;
  const openTicketsCount = tickets.filter(t => t.status === 'Open').length;

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={26} color="var(--success)" />
            <h1 style={{ fontSize: '26px', fontWeight: '800' }}>Super Admin SaaS Controller</h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Platform metrics, shop subscriptions, master shop names, and support help desk tickets
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={fetchSuperAdminData} className="btn btn-secondary btn-sm">
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button onClick={logout} className="btn btn-danger btn-sm">
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <MetricCard
          title="Total Registered Shops"
          value={metrics.total_tenants}
          subtitle="Shops on your SaaS"
          icon={Store}
          color="indigo"
        />

        <MetricCard
          title="Active Paid Subscriptions"
          value={metrics.active_subscriptions}
          subtitle="Paying customers"
          icon={CheckCircle}
          color="emerald"
        />

        <MetricCard
          title="Pending Support Tickets"
          value={openTicketsCount}
          subtitle="Open tickets needing response"
          icon={HelpCircle}
          color="amber"
        />

        <MetricCard
          title="Estimated Monthly Revenue"
          value={`${currency}${metrics.estimated_mrr.toLocaleString()}`}
          subtitle="Estimated MRR"
          icon={DollarSign}
          color="emerald"
        />
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('tenants')}
          className={`btn ${activeTab === 'tenants' ? 'btn-primary' : 'btn-secondary'}`}
        >
          🏬 Tenant Shops ({shops.length})
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`btn ${activeTab === 'tickets' ? 'btn-primary' : 'btn-secondary'}`}
        >
          🎫 Support Tickets ({tickets.length}) {openTicketsCount > 0 && <span className="badge badge-danger" style={{ marginLeft: '6px' }}>{openTicketsCount} Open</span>}
        </button>
      </div>

      {/* --- TAB 1: ALL TENANT SHOPS --- */}
      {activeTab === 'tenants' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>All SaaS Tenant Shops</h3>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Unique Shop Code</th>
                  <th>Master Shop Name</th>
                  <th>Owner Details</th>
                  <th>Products</th>
                  <th>Sales Count</th>
                  <th>Status</th>
                  <th>Trial / Period Ends</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shops.map(shop => {
                  const isPending = shop.subscription_status === 'pending_approval';
                  const isTrial = shop.subscription_status === 'trial';
                  const isActive = shop.subscription_status === 'active';
                  const isSuspended = shop.subscription_status === 'suspended';

                  return (
                    <tr key={shop.id} style={{ background: isPending ? 'rgba(245, 158, 11, 0.08)' : undefined }}>
                      <td>
                        <span className="badge badge-info" style={{ fontWeight: '800', fontSize: '12px' }}>
                          {shop.shop_code || `SHOP-${1000 + shop.id}`}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: '14px', color: 'var(--accent-primary)' }}>{shop.shop_name}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>slug: {shop.slug}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px' }}>{shop.owner_name || shop.owner_user_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{shop.email}</div>
                      </td>
                      <td style={{ fontWeight: '600' }}>{shop.product_count || 0}</td>
                      <td style={{ fontWeight: '600' }}>{shop.sales_count || 0}</td>
                      <td>
                        <span className={`badge ${isPending ? 'badge-warning' : isActive ? 'badge-success' : isTrial ? 'badge-info' : 'badge-danger'}`} style={{ fontWeight: '800' }}>
                          {isPending ? '⏳ PENDING APPROVAL' : shop.subscription_status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        {new Date(shop.trial_ends_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {isPending && (
                            <button onClick={() => handleApproveShop(shop.id, 'trial')} className="btn btn-success btn-sm" style={{ fontWeight: '800' }}>
                              ✓ Approve Account
                            </button>
                          )}
                          <button onClick={() => handleOpenEditShop(shop)} className="btn btn-secondary btn-sm" title="Edit Master Shop Name & Unique Code">
                            <Edit2 size={14} />
                            <span>Edit</span>
                          </button>
                          <button onClick={() => handleExtendTrial(shop.id)} className="btn btn-secondary btn-sm" title="Extend Trial">
                            + Trial
                          </button>
                          {!isActive && !isPending && (
                            <button onClick={() => handleActivateSubscription(shop.id)} className="btn btn-success btn-sm">
                              Activate
                            </button>
                          )}
                          {!isSuspended && (
                            <button onClick={() => handleApproveShop(shop.id, 'suspended')} className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)' }} title="Suspend Shop Account">
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 2: SUPPORT TICKETS MANAGEMENT --- */}
      {activeTab === 'tickets' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Support & Help Desk Tickets Directory</h3>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Shop Name & Code</th>
                  <th>Requested By</th>
                  <th>Category</th>
                  <th>Subject</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No support tickets submitted yet.
                    </td>
                  </tr>
                ) : (
                  tickets.map(t => {
                    const isOpen = t.status === 'Open';
                    const isResolved = t.status === 'Resolved';
                    const isClosed = t.status === 'Closed';

                    return (
                      <tr key={t.id}>
                        <td><strong style={{ color: 'var(--accent-primary)' }}>#{t.ticket_no}</strong></td>
                        <td>
                          <strong>{t.shop_name}</strong>
                          <span style={{ fontSize: '11px', display: 'block', color: 'var(--text-muted)' }}>{t.shop_code || `SHOP-${1000 + t.tenant_id}`}</span>
                        </td>
                        <td>
                          <div style={{ fontSize: '13px' }}>{t.created_by_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.created_by_email}</div>
                        </td>
                        <td style={{ fontSize: '12px' }}>{t.category}</td>
                        <td><strong>{t.subject}</strong></td>
                        <td>
                          <span className={`badge ${t.priority === 'Urgent' ? 'badge-danger' : t.priority === 'High' ? 'badge-warning' : 'badge-secondary'}`}>
                            {t.priority}
                          </span>
                        </td>
                        <td>
                          <select
                            className="form-select"
                            style={{ padding: '2px 8px', fontSize: '12px', height: '28px' }}
                            value={t.status}
                            onChange={(e) => handleQuickStatusChange(t.id, e.target.value)}
                          >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </td>
                        <td>
                          <button onClick={() => handleViewTicketThread(t.id)} className="btn btn-primary btn-sm">
                            <MessageSquare size={14} />
                            <span>Reply & Manage</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Master Shop Modal (Super Admin Only) */}
      {editingShop && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="var(--success)" />
                <h3>Super Admin Master Shop Controls</h3>
              </div>
              <button onClick={() => setEditingShop(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveMasterShopDetails}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Master Shop Name (Unique Account Name)</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={editShopName}
                    onChange={(e) => setEditShopName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unique Shop Code (System Identifier)</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={editShopCode}
                    onChange={(e) => setEditShopCode(e.target.value)}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Used to distinguish shops with identical or similar names (e.g. SHOP-1001, SHOP-1002).
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setEditingShop(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Master Shop Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin Ticket Reply Modal */}
      {selectedTicketData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Manage Ticket #{selectedTicketData.ticket_no}: {selectedTicketData.subject}</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Shop: <strong>{selectedTicketData.shop_name}</strong> | Requested By: <strong>{selectedTicketData.created_by_name}</strong> ({selectedTicketData.created_by_email})
                </span>
              </div>
              <button onClick={() => setSelectedTicketData(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700' }}>Update Ticket Status:</span>
                  <select
                    className="form-select"
                    style={{ width: '160px' }}
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <span className="badge badge-info">{selectedTicketData.category}</span>
              </div>

              {/* Message Thread */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '6px' }}>
                {ticketMessages.map(m => {
                  const isSuper = m.sender_role === 'superadmin';

                  return (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: isSuper ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        background: isSuper ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-secondary)',
                        border: isSuper ? '1px solid var(--success)' : '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '12px 16px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '6px', fontSize: '12px' }}>
                        <strong style={{ color: isSuper ? 'var(--success)' : 'var(--accent-primary)' }}>
                          {isSuper ? '🛡️ You (Super Admin)' : `👤 ${m.sender_name || 'Shop Owner'}`}
                        </strong>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{new Date(m.created_at).toLocaleString()}</span>
                      </div>
                      <p style={{ fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap' }}>{m.message}</p>
                    </div>
                  );
                })}
              </div>

              {/* Super Admin Reply Box */}
              <form onSubmit={handleSuperAdminSendReply} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Type Super Admin response message... (Email notification will be sent to shop owner)"
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                ></textarea>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-success" disabled={sendingReply || !adminReplyText}>
                    <Send size={16} />
                    <span>{sendingReply ? 'Sending Response...' : 'Send Response & Email Shop Owner'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
