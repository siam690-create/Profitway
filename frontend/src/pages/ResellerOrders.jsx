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
  Filter,
  Trash2,
  ExternalLink
} from 'lucide-react';

export const ResellerOrders = () => {
  const { authFetch, currency, formatCurrency, showToast } = useApp();

  const [orders, setOrders] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Bulk Selection States
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Filters & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'processing', 'shipped', 'delivered', 'returned', 'cancelled'
  const [selectedResellerFilter, setSelectedResellerFilter] = useState('all');

  // Return Loss Modal States
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null);
  const [returnLossAmount, setReturnLossAmount] = useState('100');
  const [returnNotes, setReturnNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Order Details Modal States
  const [viewingOrder, setViewingOrder] = useState(null);

  // Dispatch to Courier Modal States
  const [courierAccounts, setCourierAccounts] = useState([]);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchOrder, setDispatchOrder] = useState(null);
  const [selectedCourierAccountId, setSelectedCourierAccountId] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

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

      const cRes = await authFetch('/api/courier-accounts');
      const cData = await cRes.json();
      if (cRes.ok && Array.isArray(cData)) {
        setCourierAccounts(cData);
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

  // Filtered list (Declared after all states & hooks!)
  const filteredOrders = orders.filter(o => {
    const status = (o.order_status || 'pending').toLowerCase();

    // Soft-deleted orders stay exclusively in the 'deleted' tab
    if (statusFilter === 'all' && status === 'deleted') return false;

    if (statusFilter !== 'all') {
      if (statusFilter === 'in_courier') {
        if (status !== 'in_courier' && status !== 'shipped' && status !== 'processing') return false;
      } else if (status !== statusFilter) {
        return false;
      }
    }

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

  const toggleSelectOrder = (id) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isAllSelected = filteredOrders.length > 0 && filteredOrders.every(o => selectedOrderIds.includes(o.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  const clearSelection = () => {
    setSelectedOrderIds([]);
    setBulkStatus('');
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedOrderIds.length === 0) return;

    if (bulkStatus === 'in_courier' || bulkStatus === 'shipped') {
      setDispatchOrder(null); // bulk mode
      if (courierAccounts && courierAccounts.length > 0) {
        const active = courierAccounts.find(a => a.is_active) || courierAccounts[0];
        setSelectedCourierAccountId(active.id);
      }
      setShowDispatchModal(true);
      return;
    }

    setIsBulkProcessing(true);
    try {
      const res = await authFetch('/api/admin/reseller-orders/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedOrderIds, order_status: bulkStatus })
      });
      const data = await res.json();
      if (res.ok) {
        showToast ? showToast('Updated ✅', data.message, 'success') : alert(data.message);
        clearSelection();
        fetchResellerOrders();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error bulk updating status: ${err.message}`);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrderIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to DELETE ${selectedOrderIds.length} selected orders? This action cannot be undone.`)) {
      return;
    }
    setIsBulkProcessing(true);
    try {
      const res = await authFetch('/api/admin/reseller-orders/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedOrderIds })
      });
      const data = await res.json();
      if (res.ok) {
        showToast ? showToast('Deleted 🗑️', data.message, 'success') : alert(data.message);
        clearSelection();
        fetchResellerOrders();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error bulk deleting orders: ${err.message}`);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkPrint = () => {
    if (selectedOrderIds.length === 0) return;
    const selectedOrders = orders.filter(o => selectedOrderIds.includes(o.id));
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bulk Print Shipping Labels (${selectedOrders.length} Parcels)</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
            .label-card { border: 2px solid #000; border-radius: 8px; padding: 16px; margin-bottom: 20px; page-break-inside: avoid; }
            .label-header { border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
            .label-title { font-size: 20px; font-weight: bold; }
            .label-row { font-size: 14px; margin-bottom: 6px; }
            .label-row strong { font-size: 15px; }
            .cod-box { font-size: 22px; font-weight: bold; margin-top: 10px; border-top: 1px dashed #000; padding-top: 8px; }
          </style>
        </head>
        <body>
          <h2>🚚 Customer Courier Shipping Labels (${selectedOrders.length} Parcels)</h2>
          ${selectedOrders.map(o => `
            <div class="label-card">
              <div class="label-header">
                <span class="label-title">Invoice #${o.invoice_no}</span>
                <span>Reseller: ${o.reseller_name}</span>
              </div>
              <div class="label-row">👤 <strong>Customer:</strong> ${o.customer_name || 'N/A'}</div>
              <div class="label-row">📞 <strong>Phone:</strong> ${o.customer_phone || 'N/A'}</div>
              <div class="label-row">📍 <strong>Address:</strong> ${o.customer_address || 'N/A'} (${o.district || ''}, ${o.thana || ''})</div>
              <div class="label-row">📦 <strong>Items:</strong> ${(o.items || []).map(i => `${i.product_name} x${i.quantity}`).join(', ')}</div>
              <div class="cod-box">💰 Total COD Amount: ৳${Number(o.total_price || o.total_amount || 0).toFixed(2)}</div>
            </div>
          `).join('')}
          <script>window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Status Configuration for Workflow
  const ALL_STATUSES = [
    { key: 'all', label: 'All Orders', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', icon: '📋' },
    { key: 'new', label: 'New Orders', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.15)', icon: '✨' },
    { key: 'pending', label: 'Pending', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: '⏳' },
    { key: 'confirmed', label: 'Confirmed', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: '👍' },
    { key: 'ready', label: 'Ready', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', icon: '📦' },
    { key: 'in_courier', label: 'In Courier', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', icon: '🚚' },
    { key: 'delivered', label: 'Delivered', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: '✅' },
    { key: 'partial_delivery', label: 'Partial Delivery', color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.15)', icon: '🌓' },
    { key: 'hold', label: 'Hold', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', icon: '⏸️' },
    { key: 'return_pending', label: 'Return Pending', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', icon: '⏳' },
    { key: 'returned', label: 'Returned', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: '🔄' },
    { key: 'completed', label: 'Completed', color: '#059669', bg: 'rgba(5, 150, 105, 0.15)', icon: '🎯' },
    { key: 'cancelled', label: 'Cancelled', color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)', icon: '🚫' },
    { key: 'deleted', label: 'Delete', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.18)', icon: '🗑️' }
  ];

  const handleDeleteOrder = async (orderId, invoiceNo) => {
    if (!window.confirm(`Are you sure you want to DELETE order #${invoiceNo}? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await authFetch(`/api/admin/reseller-orders/${orderId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        showToast ? showToast('Deleted 🗑️', data.message, 'success') : alert(data.message);
        fetchResellerOrders();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error deleting order: ${err.message}`);
    }
  };

  const handleOpenDispatchModal = (order) => {
    setDispatchOrder(order);
    if (courierAccounts && courierAccounts.length > 0) {
      const active = courierAccounts.find(a => a.is_active) || courierAccounts[0];
      setSelectedCourierAccountId(active.id);
    }
    setShowDispatchModal(true);
  };

  const handleConfirmDispatch = async () => {
    if (!selectedCourierAccountId) return;
    if (!dispatchOrder && selectedOrderIds.length === 0) return;

    setIsDispatching(true);
    try {
      const payload = dispatchOrder 
        ? { orderId: dispatchOrder.id, orderType: 'reseller', courierAccountId: selectedCourierAccountId }
        : { orderIds: selectedOrderIds, orderType: 'reseller', courierAccountId: selectedCourierAccountId };

      const res = await authFetch('/api/courier-accounts/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showToast ? showToast('Dispatched 🚚', data.message, 'success') : alert(data.message);
        setShowDispatchModal(false);
        setDispatchOrder(null);
        clearSelection();
        fetchResellerOrders();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error dispatching to courier: ${err.message}`);
    } finally {
      setIsDispatching(false);
    }
  };

  const copyShippingLabel = (order) => {
    const text = `Invoice: #${order.invoice_no}\nCustomer: ${order.customer_name || 'N/A'}\nPhone: ${order.customer_phone || 'N/A'}\nAddress: ${order.customer_address || 'N/A'}\nDistrict: ${order.district || 'N/A'}, Thana: ${order.thana || 'N/A'}\nCOD Amount: ৳${order.total_price || order.total_amount || 0}`;
    navigator.clipboard.writeText(text);
    showToast ? showToast('Copied 📋', 'Customer shipping details copied to clipboard!', 'info') : alert('Copied to clipboard!');
  };

  const getTrackingUrl = (order = {}) => {
    const trackingCode = order.tracking_code || '';
    if (!trackingCode) return '#';

    const p = String(order.provider_code || '').toLowerCase();
    const c = String(order.courier_name || '').toLowerCase();
    const t = String(trackingCode).toUpperCase();
    const phone = String(order.customer_phone || order.phone || '').trim();

    if (p === 'pathao' || c.includes('pathao') || t.startsWith('DC') || t.startsWith('PAT') || t.startsWith('DT')) {
      return `https://merchant.pathao.com/tracking?consignment_id=${trackingCode}${phone ? `&phone=${phone}` : ''}`;
    } else if (p === 'steadfast' || c.includes('steadfast') || t.startsWith('SF')) {
      return `https://steadfast.com.bd/t/${trackingCode}`;
    } else if (p === 'redx' || c.includes('redx')) {
      return `https://redx.com.bd/track-order?trackingId=${trackingCode}`;
    } else if (p === 'paperfly' || c.includes('paperfly')) {
      return `https://www.paperfly.com.bd/tracking?tracking_id=${trackingCode}`;
    }
    return `https://merchant.pathao.com/tracking?consignment_id=${trackingCode}${phone ? `&phone=${phone}` : ''}`;
  };

  // Calculate summary metrics
  const pendingOrders = orders.filter(o => (o.order_status || 'pending').toLowerCase() === 'pending');
  const deliveredOrders = orders.filter(o => (o.order_status || '').toLowerCase() === 'delivered');
  const returnedOrders = orders.filter(o => (o.order_status || '').toLowerCase() === 'returned');

  const totalDeliveredRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.total_price || o.total_amount || 0), 0);
  const totalResellerProfit = deliveredOrders.reduce((sum, o) => sum + Number(o.reseller_profit || 0), 0);
  const totalReturnLoss = returnedOrders.reduce((sum, o) => sum + Number(o.return_loss || 100), 0);

  const renderStatusBadge = (statusStr) => {
    const s = (statusStr || 'pending').toLowerCase();
    const cfg = ALL_STATUSES.find(st => st.key === s) ||
                (s === 'shipped' || s === 'processing' ? ALL_STATUSES.find(st => st.key === 'in_courier') : null) ||
                ALL_STATUSES.find(st => st.key === 'pending');

    return (
      <span
        className="badge"
        style={{
          background: cfg.bg,
          color: cfg.color,
          border: `1px solid ${cfg.color}40`,
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '700',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          textTransform: 'capitalize'
        }}
      >
        <span>{cfg.icon}</span> {cfg.label}
      </span>
    );
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

      {/* Main Table Card */}
      <div className="card" style={{ padding: 0 }}>
        {/* Filter and Search Bar */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Scrollable Status Filter Pills Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'thin' }}>
            {ALL_STATUSES.map(st => {
              const count = st.key === 'all'
                ? orders.length
                : orders.filter(o => {
                    const s = (o.order_status || 'pending').toLowerCase();
                    if (st.key === 'in_courier') return s === 'in_courier' || s === 'shipped' || s === 'processing';
                    return s === st.key;
                  }).length;

              const isActive = statusFilter === st.key;

              return (
                <button
                  key={st.key}
                  onClick={() => setStatusFilter(st.key)}
                  className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    whiteSpace: 'nowrap',
                    fontSize: '12.5px',
                    fontWeight: isActive ? '700' : '600',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    ...(isActive ? { background: st.color, borderColor: st.color, color: '#fff', boxShadow: `0 2px 8px ${st.color}40` } : {})
                  }}
                >
                  <span>{st.icon}</span> {st.label} ({count})
                </button>
              );
            })}
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

        {/* Sticky Bulk Action Bar (Rendered when 1 or more orders are checked) */}
        {selectedOrderIds.length > 0 && (
          <div
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15))',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              borderRadius: '12px',
              margin: '16px 16px 0 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              {/* Selected Count Badge */}
              <div style={{ background: '#8b5cf6', color: '#fff', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={15} />
                <span>{selectedOrderIds.length} Selected</span>
              </div>

              {/* Bulk Status Select + Apply */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  className="form-select"
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                >
                  <option value="">Change status to...</option>
                  {ALL_STATUSES.filter(s => s.key !== 'all').map(s => (
                    <option key={s.key} value={s.key}>{s.icon} {s.label}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleBulkStatusUpdate}
                  disabled={!bulkStatus || isBulkProcessing}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '6px 16px' }}
                >
                  {isBulkProcessing ? 'Applying...' : 'Apply'}
                </button>
              </div>

              {/* Bulk Print Button */}
              <button
                type="button"
                onClick={handleBulkPrint}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={14} />
                <span>Print Labels</span>
              </button>

              {/* Bulk Delete Button */}
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={isBulkProcessing}
                className="btn btn-danger btn-sm"
                style={{ background: '#ef4444', borderColor: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 size={14} />
                <span>Delete All</span>
              </button>
            </div>

            {/* Clear Selection Button */}
            <button
              type="button"
              onClick={clearSelection}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '12px' }}
            >
              ✕ Clear Selection
            </button>
          </div>
        )}

        {/* Orders Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#8b5cf6' }}
                    title="Select / Deselect All Filtered Orders"
                  />
                </th>
                <th>Invoice #</th>
                <th>Reseller Name</th>
                <th>Customer Info</th>
                <th>Ordered Items</th>
                <th>Courier</th>
                <th>Pricing & COD Breakdown</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No reseller portal orders found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const status = (order.order_status || 'pending').toLowerCase();
                  const totalCOD = Number(order.total_amount || order.total_price || order.customer_total_price || 0);
                  const deliveryCharge = Number(order.delivery_fee_charged || order.delivery_fee || 0);
                  const wholesaleCost = Number(order.reseller_wholesale_cost || order.total_cost || 0);
                  const salePrice = Math.max(0, totalCOD - deliveryCharge);
                  const profit = Math.max(0, salePrice - wholesaleCost);
                  const isChecked = selectedOrderIds.includes(order.id);

                  return (
                    <tr key={order.id} style={isChecked ? { background: 'rgba(139, 92, 246, 0.08)' } : {}}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOrder(order.id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#8b5cf6' }}
                        />
                      </td>

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
                        {order.tracking_code ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ fontSize: '13px', color: 'var(--text-primary)', letterSpacing: '0.02em', wordBreak: 'break-all' }}>
                                {order.tracking_code}
                              </strong>
                              <a
                                href={getTrackingUrl(order)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#8b5cf6', display: 'inline-flex', alignItems: 'center', transition: 'color 0.2s ease' }}
                                title="Track Parcel on Courier Website"
                              >
                                <ExternalLink size={14} />
                              </a>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {order.courier_name || 'Courier'}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                        )}
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
                          {status === 'returned' && (
                            <div style={{ fontSize: '11px', color: '#ef4444', textAlign: 'right' }}>
                              Loss: -{currency}{Number(order.return_loss || 100).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </td>

                      <td>
                        {(() => {
                          const currentKey = status === 'shipped' || status === 'processing' ? 'in_courier' : status;
                          const cfg = ALL_STATUSES.find(st => st.key === currentKey) || ALL_STATUSES.find(st => st.key === 'pending');

                          return (
                            <select
                              value={currentKey}
                              onChange={(e) => {
                                const newSt = e.target.value;
                                if (newSt === 'returned') {
                                  handleOpenReturnModal(order);
                                } else if (newSt === 'in_courier' || newSt === 'shipped') {
                                  handleOpenDispatchModal(order);
                                } else {
                                  handleUpdateStatus(order.id, newSt);
                                }
                              }}
                              style={{
                                background: cfg.bg,
                                color: cfg.color,
                                border: `1px solid ${cfg.color}60`,
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                outline: 'none',
                                textTransform: 'capitalize',
                                boxShadow: `0 2px 6px ${cfg.color}20`
                              }}
                            >
                              {ALL_STATUSES.filter(s => s.key !== 'all').map(s => (
                                <option
                                  key={s.key}
                                  value={s.key}
                                  style={{ background: '#1e293b', color: '#f8fafc', fontWeight: '600' }}
                                >
                                  {s.icon} {s.label}
                                </option>
                              ))}
                            </select>
                          );
                        })()}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
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

                          {/* Delete Order Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order.id, order.invoice_no)}
                            className="btn btn-secondary btn-icon btn-sm"
                            title="Delete Reseller Order"
                            style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                          >
                            <XCircle size={14} />
                          </button>
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

      {/* Send Order to Courier Dispatch Modal (Single or Bulk) */}
      {showDispatchModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={22} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>
                  {dispatchOrder 
                    ? `Send Order #${dispatchOrder.invoice_no} to Courier`
                    : `Send ${selectedOrderIds.length} Selected Orders to Courier`}
                </h3>
              </div>
              <button onClick={() => setShowDispatchModal(false)} className="btn btn-secondary btn-icon"><XCircle size={18} /></button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Order Info Summary */}
              {dispatchOrder ? (
                <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid var(--border-color)' }}>
                  <div>👤 Customer: <strong>{dispatchOrder.customer_name || 'N/A'}</strong> ({dispatchOrder.customer_phone})</div>
                  <div>📍 Address: {dispatchOrder.customer_address}</div>
                  <div>💰 Total COD: <strong style={{ color: '#f59e0b', fontSize: '15px' }}>{currency}{Number(dispatchOrder.total_amount || dispatchOrder.total_price || 0).toFixed(2)}</strong></div>
                </div>
              ) : (
                <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', fontSize: '13px', border: '1px solid var(--border-color)' }}>
                  📦 <strong>{selectedOrderIds.length} Orders</strong> will be dispatched to the selected courier account. Tracking codes will be automatically generated and linked.
                </div>
              )}

              {/* Select Courier Account */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: '700' }}>Select Courier Account / Store</label>
                {courierAccounts.length === 0 ? (
                  <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderRadius: '8px', fontSize: '12px' }}>
                    ⚠️ No active Courier Account found. Please setup accounts in <strong>API Management</strong> first.
                  </div>
                ) : (
                  <select
                    className="form-select"
                    value={selectedCourierAccountId}
                    onChange={(e) => setSelectedCourierAccountId(e.target.value)}
                    style={{ padding: '10px 14px', fontSize: '14px', fontWeight: '600', background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderRadius: '10px' }}
                  >
                    {courierAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.provider_code.toUpperCase()} — {acc.account_label} ({acc.is_active ? 'Active ✓' : 'Disabled'})
                      </option>
                    ))}
                  </select>
                )}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  এই কুরিয়ার অ্যাকাউন্টের মাধ্যমে রিয়েল-টাইম কুরিয়ার এপিআই-তে পার্সেল বুক হবে।
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setShowDispatchModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                disabled={!selectedCourierAccountId || isDispatching}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Truck size={16} />
                <span>{isDispatching ? 'Dispatching to Courier...' : dispatchOrder ? '🚚 Dispatch Order to Courier' : `🚚 Dispatch ${selectedOrderIds.length} Orders`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResellerOrders;
