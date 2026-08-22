import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Globe,
  ShoppingBag,
  Package,
  CheckCircle,
  Clock,
  Truck,
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
  ExternalLink,
  Code,
  Check,
  Send,
  X
} from 'lucide-react';
import { DateRangeFilter } from '../components/DateRangeFilter';

export const ApiOrders = () => {
  const { authFetch, currency, formatCurrency, showToast, user } = useApp();

  const [orders, setOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals State
  const [viewingOrder, setViewingOrder] = useState(null);
  const [showRawPayload, setShowRawPayload] = useState(false);
  const [copiedLabelId, setCopiedLabelId] = useState(null);

  // Courier Dispatch State
  const [courierAccounts, setCourierAccounts] = useState([]);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchOrder, setDispatchOrder] = useState(null);
  const [selectedCourierAccountId, setSelectedCourierAccountId] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/external-orders');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setOrders(data);
      }

      // Fetch Connected Store API Keys
      const sRes = await authFetch('/api/store-api-keys');
      const sData = await sRes.json();
      if (sRes.ok && Array.isArray(sData)) {
        setStores(sData);
      }

      // Fetch Courier Accounts
      const cRes = await authFetch('/api/courier-accounts');
      const cData = await cRes.json();
      if (cRes.ok && Array.isArray(cData)) {
        setCourierAccounts(cData);
      }
    } catch (err) {
      console.error('Error fetching API Store Orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const ALL_STATUSES = [
    { key: 'all', label: 'All Orders', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', icon: '📋' },
    { key: 'new', label: 'New Orders', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.15)', icon: '✨' },
    { key: 'pending', label: 'Pending', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: '⏳' },
    { key: 'confirmed', label: 'Confirmed', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: '👍' },
    { key: 'ready', label: 'Ready', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', icon: '📦' },
    { key: 'in_courier', label: 'In Courier', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', icon: '🚚' },
    { key: 'delivered', label: 'Delivered', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: '✅' },
    { key: 'partially_delivered', label: 'Partially Delivered', color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.15)', icon: '🌓' },
    { key: 'hold', label: 'Hold', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', icon: '⏸️' },
    { key: 'return_pending', label: 'Return Pending', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', icon: '⏳' },
    { key: 'returned', label: 'Returned', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: '🔄' },
    { key: 'cancelled', label: 'Cancelled', color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)', icon: '🚫' }
  ];

  const handleUpdateStatus = async (orderId, newStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await authFetch(`/api/external-orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        showToast ? showToast('Status Updated ✅', `Order status changed to ${newStatus.toUpperCase()}`, 'success') : alert(`Status updated to ${newStatus}`);
        fetchOrders();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteOrder = async (orderId, invoiceNo) => {
    if (!window.confirm(`Are you sure you want to delete order #${invoiceNo}? Stock will be automatically restored.`)) return;
    try {
      const res = await authFetch(`/api/external-orders/${orderId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        showToast ? showToast('Deleted 🗑️', data.message, 'success') : alert(data.message);
        fetchOrders();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
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
    if (!selectedCourierAccountId || !dispatchOrder) return;
    setIsDispatching(true);
    try {
      const res = await authFetch('/api/courier-accounts/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: dispatchOrder.id,
          orderType: 'sale',
          courierAccountId: selectedCourierAccountId
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast ? showToast('Dispatched 🚚', data.message, 'success') : alert(data.message);
        setShowDispatchModal(false);
        setDispatchOrder(null);
        fetchOrders();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsDispatching(false);
    }
  };

  const copyShippingLabel = (order) => {
    const text = `Invoice: #${order.invoice_no}\nExt Order ID: #${order.external_order_id || 'N/A'}\nStore: ${order.source_website || 'Website Store'}\nCustomer: ${order.customer_name || 'N/A'}\nPhone: ${order.customer_phone || 'N/A'}\nAddress: ${order.shipping_address || 'N/A'}\nCOD Amount: ৳${Number(order.total_amount || 0).toFixed(2)}`;
    navigator.clipboard.writeText(text);
    setCopiedLabelId(order.id);
    setTimeout(() => setCopiedLabelId(null), 2000);
    showToast ? showToast('Copied 📋', 'Customer details copied to clipboard!', 'info') : alert('Copied to clipboard!');
  };

  const printInvoice = (order) => {
    const printWindow = window.open('', '_blank');
    const itemsHtml = (order.items || []).map(i => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${i.product_name || 'Product'} (SKU: ${i.sku || '-'})</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${i.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">৳${Number(i.unit_price || 0).toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">৳${Number(i.total_price || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order Invoice #${order.invoice_no}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
          th { background: #f8fafc; padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2 style="margin: 0; color: #4f46e5;">ORDER INVOICE</h2>
            <div style="font-size: 13px; color: #64748b;">Source: ${order.source_website || 'API Web Store'} | Ext ID: #${order.external_order_id}</div>
          </div>
          <div style="text-align: right;">
            <h3 style="margin: 0;">#${order.invoice_no}</h3>
            <div style="font-size: 12px; color: #64748b;">Date: ${new Date(order.created_at || order.sale_date).toLocaleDateString()}</div>
          </div>
        </div>

        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 13px;">
          <strong>Customer Information:</strong><br/>
          Name: ${order.customer_name}<br/>
          Phone: ${order.customer_phone}<br/>
          Address: ${order.shipping_address || 'N/A'}
        </div>

        <table>
          <thead>
            <tr>
              <th>Item Details</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="text-align: right; margin-top: 20px; font-size: 14px;">
          <div>Subtotal: <strong>৳${Number(order.total_amount || 0).toFixed(2)}</strong></div>
          <div style="font-size: 18px; font-weight: bold; color: #4f46e5; margin-top: 6px;">Total COD: ৳${Number(order.total_amount || 0).toFixed(2)}</div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Filtered Orders
  const filteredOrders = orders.filter(o => {
    const rawStatus = (o.order_status || 'new').toLowerCase();
    const status = rawStatus === 'shipped' || rawStatus === 'processing' ? 'in_courier'
      : rawStatus === 'partial_delivery' ? 'partially_delivered'
      : rawStatus;

    if (statusFilter !== 'all' && status !== statusFilter) return false;

    if (selectedStoreFilter !== 'all') {
      const matchStore = String(o.source_website || '').toLowerCase() === String(selectedStoreFilter).toLowerCase() ||
                         String(o.key_store_name || '').toLowerCase() === String(selectedStoreFilter).toLowerCase();
      if (!matchStore) return false;
    }

    if (startDate && endDate) {
      const orderDate = new Date(o.sale_date || o.created_at).toISOString().slice(0, 10);
      if (orderDate < startDate || orderDate > endDate) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const inv = String(o.invoice_no || '').toLowerCase();
      const extId = String(o.external_order_id || '').toLowerCase();
      const cName = String(o.customer_name || '').toLowerCase();
      const phone = String(o.customer_phone || '').toLowerCase();
      const addr = String(o.shipping_address || '').toLowerCase();
      const source = String(o.source_website || '').toLowerCase();
      const itemsStr = (o.items || []).map(i => String(i.product_name || '').toLowerCase()).join(' ');

      return inv.includes(q) || extId.includes(q) || cName.includes(q) || phone.includes(q) || addr.includes(q) || source.includes(q) || itemsStr.includes(q);
    }

    return true;
  });

  // KPI Metrics
  const totalOrdersCount = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const totalProfit = orders.reduce((sum, o) => sum + Number(o.gross_profit || 0), 0);
  const deliveredCount = orders.filter(o => (o.order_status || '').toLowerCase() === 'delivered').length;
  const inCourierCount = orders.filter(o => {
    const s = (o.order_status || '').toLowerCase();
    return s === 'in_courier' || s === 'shipped' || s === 'processing';
  }).length;
  const newOrdersCount = orders.filter(o => (o.order_status || '').toLowerCase() === 'new' || (o.order_status || '').toLowerCase() === 'pending').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Globe size={24} color="#6366f1" />
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>🌐 API Store Orders (WooCommerce / Shopify / Custom Web)</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Live orders automatically synced from your connected websites and external stores via Webhook & Ingestion API
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={fetchOrders} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh Orders</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #6366f1' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
            <Globe size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Total API Orders</div>
            <div style={{ fontSize: '22px', fontWeight: '800', marginTop: '2px' }}>{totalOrdersCount}</div>
            <div style={{ fontSize: '11px', color: '#818cf8', fontWeight: '600' }}>{stores.length} connected stores</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #10b981' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Total Revenue</div>
            <div style={{ fontSize: '22px', fontWeight: '800', marginTop: '2px', color: '#10b981' }}>{currency}{totalRevenue.toFixed(2)}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>COD value</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #06b6d4' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
            <Truck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>In Courier Transit</div>
            <div style={{ fontSize: '22px', fontWeight: '800', marginTop: '2px', color: '#06b6d4' }}>{inCourierCount}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>On the way</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #0ea5e9' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}>
            <Package size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>New / Pending Action</div>
            <div style={{ fontSize: '22px', fontWeight: '800', marginTop: '2px', color: '#0ea5e9' }}>{newOrdersCount}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Requires processing</div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
          {ALL_STATUSES.map(st => {
            const count = st.key === 'all'
              ? orders.length
              : orders.filter(o => {
                  const s = (o.order_status || 'new').toLowerCase();
                  if (st.key === 'in_courier') return s === 'in_courier' || s === 'shipped' || s === 'processing';
                  if (st.key === 'partially_delivered') return s === 'partially_delivered' || s === 'partial_delivery';
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
                  fontSize: '12px',
                  fontWeight: isActive ? '700' : '600',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  ...(isActive ? { background: st.color, borderColor: st.color, color: '#fff' } : {})
                }}
              >
                <span>{st.icon}</span> {st.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Store Filter */}
            <select
              className="form-select"
              style={{ width: '200px', fontSize: '13px' }}
              value={selectedStoreFilter}
              onChange={(e) => setSelectedStoreFilter(e.target.value)}
            >
              <option value="all">🌐 All Connected Stores</option>
              {stores.map(s => (
                <option key={s.id} value={s.store_name}>{s.store_name} ({s.store_domain || 'API'})</option>
              ))}
            </select>

            {/* Date Range Filter */}
            <DateRangeFilter
              onFilterChange={({ startDate: s, endDate: e }) => {
                setStartDate(s || '');
                setEndDate(e || '');
              }}
            />
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px', fontSize: '13px' }}
              placeholder="Search Invoice #, Ext ID, Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice & Store</th>
                <th>Customer Details</th>
                <th>Ordered Items</th>
                <th>Pricing & COD</th>
                <th>Courier & Tracking</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌐</div>
                    <div style={{ fontWeight: '700', fontSize: '15px' }}>No API store orders found</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>
                      Orders submitted to <code>/api/v1/orders/import</code> via your Store API Key will appear here automatically.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const sRaw = (order.order_status || 'new').toLowerCase();
                  const currentKey = sRaw === 'shipped' || sRaw === 'processing' ? 'in_courier'
                    : sRaw === 'partial_delivery' ? 'partially_delivered'
                    : sRaw;
                  const cfg = ALL_STATUSES.find(st => st.key === currentKey) || ALL_STATUSES.find(st => st.key === 'new');

                  return (
                    <tr key={order.id}>
                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--accent-primary)', fontSize: '13px' }}>
                          #{order.invoice_no}
                        </div>
                        {order.external_order_id && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            Ext ID: #{order.external_order_id}
                          </div>
                        )}
                        <span style={{ fontSize: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
                          <Globe size={10} />
                          <span>{order.source_website || order.key_store_name || 'Web Store'}</span>
                        </span>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {new Date(order.created_at || order.sale_date).toLocaleDateString()}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{order.customer_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Phone size={12} />
                          <span>{order.customer_phone}</span>
                        </div>
                        {order.shipping_address && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '4px', marginTop: '4px', maxWidth: '240px' }}>
                            <MapPin size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{order.shipping_address}</span>
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {(order.items || []).map((item, idx) => (
                            <div key={idx}>
                              • {item.product_name} <strong style={{ color: 'var(--accent-primary)' }}>×{item.quantity}</strong>
                              {item.sku && <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '4px' }}>({item.sku})</span>}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: '800', fontSize: '14px', color: '#10b981' }}>
                          ৳{Number(order.total_amount || 0).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Cost: ৳{Number(order.total_cost || 0).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: Number(order.gross_profit || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                          Profit: {Number(order.gross_profit || 0) >= 0 ? '+' : ''}৳{Number(order.gross_profit || 0).toFixed(2)}
                        </div>
                      </td>

                      <td>
                        {order.tracking_code ? (
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#06b6d4' }}>{order.courier_name || 'Courier'}</div>
                            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-primary)', marginTop: '2px' }}>
                              {order.tracking_code}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenDispatchModal(order)}
                            className="btn btn-sm btn-secondary"
                            style={{ fontSize: '11px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.3)' }}
                          >
                            <Truck size={12} />
                            <span>Book Courier</span>
                          </button>
                        )}
                      </td>

                      <td>
                        <select
                          value={currentKey}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
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
                            textTransform: 'capitalize'
                          }}
                        >
                          {ALL_STATUSES.filter(s => s.key !== 'all').map(s => (
                            <option key={s.key} value={s.key} style={{ background: '#1e293b', color: '#f8fafc' }}>
                              {s.icon} {s.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => copyShippingLabel(order)}
                            className="btn btn-secondary btn-icon btn-sm"
                            title="Copy Shipping Label to Clipboard"
                          >
                            {copiedLabelId === order.id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                          </button>

                          <button
                            onClick={() => printInvoice(order)}
                            className="btn btn-secondary btn-icon btn-sm"
                            title="Print Invoice / Packing Slip"
                          >
                            <Printer size={14} />
                          </button>

                          <button
                            onClick={() => { setViewingOrder(order); setShowRawPayload(false); }}
                            className="btn btn-secondary btn-icon btn-sm"
                            title="View Full Order Details & Payload"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            onClick={() => handleDeleteOrder(order.id, order.invoice_no)}
                            className="btn btn-secondary btn-icon btn-sm"
                            style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                            title="Delete Order"
                          >
                            <Trash2 size={14} />
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

      {/* MODAL 1: VIEW ORDER DETAILS */}
      {viewingOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--accent-primary)' }}>
                  Order #{viewingOrder.invoice_no}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Source: {viewingOrder.source_website || 'Web Store'} | Ext ID: #{viewingOrder.external_order_id}
                </div>
              </div>
              <button onClick={() => setViewingOrder(null)} className="btn btn-secondary btn-icon">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Customer Info Card */}
              <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px', fontSize: '13px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Customer Name</div>
                  <strong style={{ fontSize: '14px' }}>{viewingOrder.customer_name}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Phone Number</div>
                  <strong style={{ fontSize: '14px' }}>{viewingOrder.customer_phone}</strong>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Shipping Address</div>
                  <div>{viewingOrder.shipping_address || 'N/A'}</div>
                </div>
                {viewingOrder.notes && (
                  <div style={{ gridColumn: 'span 2', color: '#f59e0b' }}>
                    <strong>Note:</strong> {viewingOrder.notes}
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewingOrder.items || []).map((item, i) => (
                      <tr key={i}>
                        <td>
                          <strong>{item.product_name}</strong>
                          {item.sku && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SKU: {item.sku}</div>}
                        </td>
                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>৳${Number(item.unit_price || 0).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: '700' }}>৳${Number(item.total_price || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pricing Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', fontSize: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <div>Total Cost: <strong>৳${Number(viewingOrder.total_cost || 0).toFixed(2)}</strong></div>
                <div>Total COD: <strong style={{ color: '#10b981' }}>৳${Number(viewingOrder.total_amount || 0).toFixed(2)}</strong></div>
                <div>Gross Profit: <strong style={{ color: '#6366f1' }}>৳${Number(viewingOrder.gross_profit || 0).toFixed(2)}</strong></div>
              </div>

              {/* Raw JSON Payload Viewer Toggle */}
              {viewingOrder.raw_payload && (
                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowRawPayload(!showRawPayload)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}
                  >
                    <Code size={13} />
                    <span>{showRawPayload ? 'Hide Raw API JSON Payload' : 'View Raw API JSON Payload'}</span>
                  </button>

                  {showRawPayload && (
                    <pre style={{ background: '#0f172a', color: '#38bdf8', padding: '12px', borderRadius: '8px', fontSize: '11px', maxHeight: '200px', overflowY: 'auto', marginTop: '8px' }}>
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(viewingOrder.raw_payload), null, 2);
                        } catch (e) {
                          return viewingOrder.raw_payload;
                        }
                      })()}
                    </pre>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => printInvoice(viewingOrder)} className="btn btn-secondary">
                <Printer size={15} />
                <span>Print Invoice</span>
              </button>
              <button onClick={() => setViewingOrder(null)} className="btn btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DISPATCH TO COURIER */}
      {showDispatchModal && dispatchOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>🚚 Dispatch Order to Courier</h3>
              <button onClick={() => setShowDispatchModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                <div><strong>Invoice:</strong> #{dispatchOrder.invoice_no}</div>
                <div><strong>Customer:</strong> {dispatchOrder.customer_name} ({dispatchOrder.customer_phone})</div>
                <div><strong>Address:</strong> {dispatchOrder.shipping_address || 'N/A'}</div>
                <div><strong>COD Amount:</strong> ৳${Number(dispatchOrder.total_amount || 0).toFixed(2)}</div>
              </div>

              <div className="form-group">
                <label className="form-label">Select Connected Courier Account *</label>
                <select
                  className="form-select"
                  value={selectedCourierAccountId}
                  onChange={(e) => setSelectedCourierAccountId(e.target.value)}
                >
                  {courierAccounts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.provider_code.toUpperCase()} — {c.account_label || c.merchant_code || 'Account'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowDispatchModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleConfirmDispatch} disabled={isDispatching} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
                {isDispatching ? 'Connecting API...' : '🚀 Confirm & Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
