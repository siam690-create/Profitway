import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShoppingBag,
  Package,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  RotateCcw,
  Search,
  RefreshCw,
  Eye,
  Printer,
  Copy,
  User,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  AlertCircle,
  Filter
} from 'lucide-react';

export const ResellerOrders = () => {
  const { authFetch, currency, formatCurrency, showToast } = useApp();

  const [orders, setOrders] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'processing', 'shipped', 'delivered', 'returned', 'cancelled'
  const [selectedResellerFilter, setSelectedResellerFilter] = useState('all');

  // Return Loss Modal
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null);
  const [returnLossAmount, setReturnLossAmount] = useState('100');
  const [returnNotes, setReturnNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Order Details Modal
  const [viewingOrder, setViewingOrder] = useState(null);

  const fetchResellerOrders = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/reseller-orders');
      const data = await res.json();
      if (res.ok) {
        setOrders(Array.isArray(data) ? data : []);
      }

      const pRes = await authFetch('/api/reseller/profiles');
      const pData = await pRes.json();
      if (pRes.ok) {
        setProfiles(Array.isArray(pData) ? pData : []);
      }
    } catch (err) {
      console.error('Error fetching admin reseller orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResellerOrders();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus, returnLoss = 0, notes = '') => {
    setIsUpdatingStatus(true);
    try {
      const res = await authFetch(`/api/admin/reseller-orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          order_status: newStatus,
          return_loss: returnLoss,
          notes
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast ? showToast('Success', data.message, 'success') : alert(data.message);
        setShowReturnModal(false);
        setSelectedOrderForReturn(null);
        fetchResellerOrders();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error updating order status: ${err.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOpenReturnModal = (order) => {
    setSelectedOrderForReturn(order);
    setReturnLossAmount('100');
    setReturnNotes('');
    setShowReturnModal(true);
  };

  const copyShippingLabel = (order) => {
    const text = `Invoice: #${order.invoice_no}\nCustomer: ${order.customer_name || 'N/A'}\nPhone: ${order.customer_phone || 'N/A'}\nAddress: ${order.customer_address || 'N/A'}\nDistrict: ${order.district || 'N/A'}, Thana: ${order.thana || 'N/A'}\nCOD Amount: ৳${order.total_price || 0}`;
    navigator.clipboard.writeText(text);
    showToast ? showToast('Copied 📋', 'Customer shipping details copied to clipboard!', 'info') : alert('Copied to clipboard!');
  };

  // Filtered list
  const filteredOrders = orders.filter(o => {
    const status = (o.order_status || 'pending').toLowerCase();
    if (statusFilter !== 'all' && status !== statusFilter) return false;

    if (selectedResellerFilter !== 'all' && String(o.reseller_name).toLowerCase() !== String(selectedResellerFilter).toLowerCase()) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const inv = String(o.invoice_no || '').toLowerCase();
      const rName = String(o.reseller_name || '').toLowerCase();
      const cName = String(o.customer_name || '').toLowerCase();
      const phone = String(o.customer_phone || '').toLowerCase();
      const addr = String(o.customer_address || '').toLowerCase();
      const itemsStr = (o.items || []).map(i => String(i.product_name || '').toLowerCase()).join(' ');

      return inv.includes(q) || rName.includes(q) || cName.includes(q) || phone.includes(q) || addr.includes(q) || itemsStr.includes(q);
    }

    return true;
  });

  // Calculate summary metrics
  const pendingOrders = orders.filter(o => (o.order_status || 'pending').toLowerCase() === 'pending');
  const deliveredOrders = orders.filter(o => (o.order_status || '').toLowerCase() === 'delivered');
  const returnedOrders = orders.filter(o => (o.order_status || '').toLowerCase() === 'returned');

  const totalDeliveredRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.total_price || o.total_amount || 0), 0);
  const totalResellerProfit = deliveredOrders.reduce((sum, o) => sum + Number(o.reseller_profit || 0), 0);
  const totalReturnLoss = returnedOrders.reduce((sum, o) => sum + Number(o.return_loss || 100), 0);

  const renderStatusBadge = (statusStr) => {
    const s = (statusStr || 'pending').toLowerCase();
    if (s === 'pending') return <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Pending Approval</span>;
    if (s === 'processing') return <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Package size={12} /> Processing</span>;
    if (s === 'shipped') return <span className="badge" style={{ background: '#3b82f6', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Truck size={12} /> Shipped</span>;
    if (s === 'delivered') return <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Delivered</span>;
    if (s === 'returned') return <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><RotateCcw size={12} /> Returned</span>;
    if (s === 'cancelled') return <span className="badge" style={{ background: '#64748b', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><XCircle size={12} /> Cancelled</span>;
    return <span className="badge badge-secondary">{statusStr}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Banner */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={24} color="#8b5cf6" />
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Reseller Live Portal Orders</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Manage, approve, ship, and deliver customer sales submitted directly by resellers from their self-service portal
          </p>
        </div>

        <button onClick={fetchResellerOrders} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={15} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* KPI Stats Cards Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Pending Approval</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#f59e0b', marginTop: '4px' }}>
            {pendingOrders.length} <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>Orders</span>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Delivered Sales COD</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
            {formatCurrency(totalDeliveredRevenue)}
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px', fontWeight: '700' }}>
            Delivered Profit: +{formatCurrency(totalResellerProfit)}
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Returned Loss (Courier)</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>
            -{formatCurrency(totalReturnLoss)}
          </div>
          <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '2px', fontWeight: '700' }}>
            {returnedOrders.length} Returned Parcels
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Total Submitted Orders</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#8b5cf6', marginTop: '4px' }}>
            {orders.length} <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>Parcels</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: 0 }}>
        {/* Filter and Search Bar */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* Status Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setStatusFilter('all')}
              className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
              style={statusFilter === 'pending' ? { background: '#f59e0b', borderColor: '#f59e0b' } : {}}
            >
              ⏳ Pending ({pendingOrders.length})
            </button>
            <button
              onClick={() => setStatusFilter('processing')}
              className={`btn btn-sm ${statusFilter === 'processing' ? 'btn-primary' : 'btn-secondary'}`}
              style={statusFilter === 'processing' ? { background: '#3b82f6', borderColor: '#3b82f6' } : {}}
            >
              📦 Processing
            </button>
            <button
              onClick={() => setStatusFilter('shipped')}
              className={`btn btn-sm ${statusFilter === 'shipped' ? 'btn-primary' : 'btn-secondary'}`}
            >
              🚚 Shipped
            </button>
            <button
              onClick={() => setStatusFilter('delivered')}
              className={`btn btn-sm ${statusFilter === 'delivered' ? 'btn-primary' : 'btn-secondary'}`}
              style={statusFilter === 'delivered' ? { background: '#10b981', borderColor: '#10b981' } : {}}
            >
              ✅ Delivered ({deliveredOrders.length})
            </button>
            <button
              onClick={() => setStatusFilter('returned')}
              className={`btn btn-sm ${statusFilter === 'returned' ? 'btn-primary' : 'btn-secondary'}`}
              style={statusFilter === 'returned' ? { background: '#ef4444', borderColor: '#ef4444' } : {}}
            >
              🔄 Returned ({returnedOrders.length})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Filter by Reseller */}
            <select
              className="form-select"
              style={{ width: '180px', padding: '6px 12px', fontSize: '13px' }}
              value={selectedResellerFilter}
              onChange={(e) => setSelectedResellerFilter(e.target.value)}
            >
              <option value="all">👥 All Resellers</option>
              {profiles.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '36px', fontSize: '13px' }}
                placeholder="Search Invoice #, Reseller, Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Reseller Name</th>
                <th>Customer Info</th>
                <th>Ordered Items</th>
                <th>Pricing & COD Breakdown</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No reseller portal orders found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const status = (order.order_status || 'pending').toLowerCase();
                  const profit = Number(order.reseller_profit || 0);
                  const totalCOD = Number(order.total_amount || order.total_price || order.customer_total_price || 0);
                  const deliveryCharge = Number(order.delivery_fee_charged || order.delivery_fee || 0);
                  const wholesaleCost = Number(order.reseller_wholesale_cost || order.total_cost || 0);
                  const salePrice = Math.max(0, totalCOD - deliveryCharge);

                  return (
                    <tr key={order.id}>
                      <td>
                        <strong style={{ color: 'var(--accent-primary)', fontSize: '14px' }}>#{order.invoice_no}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td>
                        <strong style={{ color: '#ec4899', fontSize: '14px' }}>{order.reseller_name}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Profile Linked</div>
                      </td>

                      <td>
                        <div style={{ fontWeight: '700', fontSize: '13px' }}>{order.customer_name || 'Customer'}</div>
                        <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '600' }}>📞 {order.customer_phone}</div>
                        {order.customer_address && (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4', wordBreak: 'break-word', maxWidth: '240px' }}>
                            📍 {order.customer_address}
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {(order.items || []).map((i, idx) => (
                            <div key={idx}>
                              • {i.product_name} <span style={{ fontWeight: '700', color: '#c084fc' }}>x{i.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', minWidth: '190px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                            <span>Wholesale Price:</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{currency}{wholesaleCost.toFixed(2)}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                            <span>Sale Price:</span>
                            <strong style={{ color: '#38bdf8' }}>{currency}{salePrice.toFixed(2)}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                            <span>Delivery Charge:</span>
                            <strong>+{currency}{deliveryCharge.toFixed(2)}</strong>
                          </div>
                          <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '4px', marginTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '12.5px' }}>Total COD:</span>
                            <strong style={{ fontSize: '15px', color: '#f59e0b', fontWeight: '800' }}>{currency}{totalCOD.toFixed(2)}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Est. Profit:</span>
                            <strong style={{ fontSize: '13px', color: profit >= 0 ? '#10b981' : '#ef4444' }}>
                              +{currency}{profit.toFixed(2)}
                            </strong>
                          </div>
                          {status === 'returned' && (
                            <div style={{ fontSize: '11px', color: '#ef4444', textAlign: 'right' }}>
                              Loss: -{currency}{Number(order.return_loss || 100).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </td>

                      <td>{renderStatusBadge(order.order_status)}</td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', flexWrap: 'wrap' }}>
                          {/* Shipping Label Clipboard Button */}
                          <button
                            type="button"
                            onClick={() => copyShippingLabel(order)}
                            className="btn btn-secondary btn-icon btn-sm"
                            title="Copy Courier Label Details"
                          >
                            <Copy size={14} />
                          </button>

                          {/* View Order Modal Button */}
                          <button
                            type="button"
                            onClick={() => setViewingOrder(order)}
                            className="btn btn-secondary btn-icon btn-sm"
                            title="View Full Order Details"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Status Actions */}
                          {status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order.id, 'processing')}
                              disabled={isUpdatingStatus}
                              className="btn btn-primary btn-sm"
                              style={{ background: '#3b82f6', borderColor: '#3b82f6' }}
                            >
                              Approve
                            </button>
                          )}

                          {(status === 'pending' || status === 'processing') && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order.id, 'shipped')}
                              disabled={isUpdatingStatus}
                              className="btn btn-secondary btn-sm"
                              style={{ borderColor: '#3b82f6', color: '#3b82f6' }}
                            >
                              Mark Shipped
                            </button>
                          )}

                          {status !== 'delivered' && status !== 'returned' && status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order.id, 'delivered')}
                              disabled={isUpdatingStatus}
                              className="btn btn-success btn-sm"
                            >
                              Mark Delivered
                            </button>
                          )}

                          {status !== 'returned' && status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => handleOpenReturnModal(order)}
                              disabled={isUpdatingStatus}
                              className="btn btn-danger btn-sm"
                            >
                              Return
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Return Parcel & Loss Entry */}
      {showReturnModal && selectedOrderForReturn && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RotateCcw size={20} color="#ef4444" />
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Record Courier Return & Loss</h3>
              </div>
              <button onClick={() => setShowReturnModal(false)} className="btn btn-secondary btn-icon"><XCircle size={18} /></button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateStatus(selectedOrderForReturn.id, 'returned', Number(returnLossAmount), returnNotes);
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.25)', fontSize: '13px' }}>
                  <strong>Invoice #{selectedOrderForReturn.invoice_no}</strong> ({selectedOrderForReturn.reseller_name})
                  <div style={{ marginTop: '4px', color: 'var(--text-muted)' }}>
                    Customer: {selectedOrderForReturn.customer_name} ({selectedOrderForReturn.customer_phone})
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Return Delivery Fee Loss ({currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    required
                    placeholder="100.00"
                    value={returnLossAmount}
                    onChange={(e) => setReturnLossAmount(e.target.value)}
                  />
                  <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    This delivery loss amount will be charged against the reseller's wallet balance.
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">Return Reason / Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Customer refused delivery at door"
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowReturnModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={isUpdatingStatus} className="btn btn-danger">
                  {isUpdatingStatus ? 'Processing...' : 'Confirm Return & Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Full Order View Modal */}
      {viewingOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="#8b5cf6" />
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Order #{viewingOrder.invoice_no} Details</h3>
              </div>
              <button onClick={() => setViewingOrder(null)} className="btn btn-secondary btn-icon"><XCircle size={18} /></button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Reseller Name:</div>
                  <strong style={{ fontSize: '15px', color: '#ec4899' }}>{viewingOrder.reseller_name}</strong>
                </div>
                <div>
                  {renderStatusBadge(viewingOrder.order_status)}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px' }}>
                <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Customer Delivery Details:</div>
                <div>👤 <strong>Name:</strong> {viewingOrder.customer_name || 'N/A'}</div>
                <div>📞 <strong>Phone:</strong> {viewingOrder.customer_phone || 'N/A'}</div>
                <div>📍 <strong>Address:</strong> {viewingOrder.customer_address || 'N/A'}</div>
                {viewingOrder.district && <div>🏢 <strong>District/City:</strong> {viewingOrder.district}</div>}
                {viewingOrder.thana && <div>🏠 <strong>Thana/Area:</strong> {viewingOrder.thana}</div>}
              </div>

              {/* Items Table */}
              <div>
                <label className="form-label" style={{ marginBottom: '8px' }}>Ordered Items</label>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--bg-secondary)' }}>
                      <tr>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Product</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Wholesale Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(viewingOrder.items || []).map((item, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px 12px' }}>{item.product_name}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '700' }}>x{item.quantity}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '700' }}>{currency}{Number(item.total_cost || item.unit_price || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Total & Profit */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Customer Total COD:</div>
                  <strong style={{ fontSize: '18px', color: 'var(--text-primary)' }}>{currency}{Number(viewingOrder.total_amount || viewingOrder.total_price || 0).toFixed(2)}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Estimated Reseller Profit:</div>
                  <strong style={{ fontSize: '18px', color: '#10b981' }}>+{currency}{Number(viewingOrder.reseller_profit || 0).toFixed(2)}</strong>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => copyShippingLabel(viewingOrder)} className="btn btn-secondary">
                <Copy size={14} /> Copy Courier Details
              </button>
              <button type="button" onClick={() => setViewingOrder(null)} className="btn btn-primary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResellerOrders;
