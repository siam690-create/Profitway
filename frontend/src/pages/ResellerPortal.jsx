import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShoppingBag,
  PackageCheck,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  CreditCard,
  User,
  Phone,
  MapPin,
  Tag,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

const ResellerPortal = () => {
  const { authFetch, currency, showToast, resellerSession, logoutReseller } = useApp();

  const [resellerName, setResellerName] = useState(() => {
    return resellerSession?.name || localStorage.getItem('profitway_reseller_name') || 'sellway';
  });

  useEffect(() => {
    if (resellerSession?.name) {
      setResellerName(resellerSession.name);
    }
  }, [resellerSession]);
  const [resellerId, setResellerId] = useState('');

  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog', 'orders', 'wallet'
  const [catalog, setCatalog] = useState([]);
  const [walletData, setWalletData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter
  const [catalogSearch, setCatalogSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  // Reseller Login Modal State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleResellerLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) {
      return alert('Please enter Email/Phone and Password.');
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/reseller/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        if (loginReseller) {
          loginReseller(data.reseller);
        } else {
          setResellerName(data.reseller.name);
        }
        setShowLoginModal(false);
        setLoginIdentifier('');
        setLoginPassword('');
        showToast ? showToast('Success', data.message, 'success') : alert(data.message);
      } else {
        alert(data.error || 'Login failed.');
      }
    } catch (err) {
      alert(`Error logging in: ${err.message}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Submit Order Modal State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [thana, setThana] = useState('');
  const [courierName, setCourierName] = useState('Steadfast');
  const [customerSellingPrice, setCustomerSellingPrice] = useState('');
  const [deliveryFeeCharged, setDeliveryFeeCharged] = useState('100');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Catalog
  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const url = resellerName 
        ? `/api/reseller/catalog?reseller_name=${encodeURIComponent(resellerName)}`
        : '/api/reseller/catalog';
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setCatalog(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Wallet & Orders
  const fetchWalletAndOrders = async () => {
    if (!resellerName) return;
    try {
      const res = await fetch(`/api/reseller/wallet?reseller_name=${encodeURIComponent(resellerName)}`);
      const data = await res.json();
      if (res.ok) {
        setWalletData(data);
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCatalog();
    fetchWalletAndOrders();
    if (resellerName) {
      localStorage.setItem('profitway_reseller_name', resellerName);
    }
  }, [resellerName]);

  const handleOpenOrderModal = (product) => {
    setSelectedProduct(product);
    setOrderItems([{
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit_reseller_price: Number(product.reseller_price || 0),
      total_reseller_cost: Number(product.reseller_price || 0)
    }]);
    setCustomerSellingPrice(String(Number(product.retail_price || product.reseller_price || 0)));
    setShowOrderModal(true);
  };

  const handleAddProductToOrder = (product) => {
    const existingIndex = orderItems.findIndex(i => i.product_id === product.id);
    if (existingIndex >= 0) {
      const updated = [...orderItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total_reseller_cost = updated[existingIndex].quantity * updated[existingIndex].unit_reseller_price;
      setOrderItems(updated);
    } else {
      setOrderItems(prev => [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_reseller_price: Number(product.reseller_price || 0),
          total_reseller_cost: Number(product.reseller_price || 0)
        }
      ]);
    }
  };

  const totalWholesaleCost = orderItems.reduce((sum, item) => sum + (item.total_reseller_cost || 0), 0);
  const estimatedProfit = Math.max(0, Number(customerSellingPrice || 0) - totalWholesaleCost);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!customerPhone || orderItems.length === 0) {
      return alert('Please enter Customer Phone and select at least 1 product.');
    }

    if (Number(customerSellingPrice) < totalWholesaleCost) {
      if (!window.confirm(`Warning: Customer selling price (${currency}${customerSellingPrice}) is lower than reseller wholesale cost (${currency}${totalWholesaleCost}). Do you want to proceed?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reseller/orders/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reseller_name: resellerName,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          district,
          thana,
          courier_name: courierName,
          items: orderItems,
          customer_total_price: Number(customerSellingPrice),
          delivery_fee_charged: Number(deliveryFeeCharged),
          notes: orderNotes
        })
      });

      const data = await res.json();
      if (res.ok) {
        setShowOrderModal(false);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
        setThana('');
        setOrderNotes('');
        fetchWalletAndOrders();
        showToast ? showToast('Success', data.message, 'success') : alert(data.message);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error submitting order: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCatalog = catalog.filter(p =>
    p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  const filteredOrders = orders.filter(o =>
    (o.invoice_no || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
    (o.customer_name || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
    (o.customer_phone || '').toLowerCase().includes(orderSearch.toLowerCase())
  );

  const summary = walletData?.summary || {
    total_delivered_revenue: 0,
    total_delivered_profit: 0,
    total_return_loss: 0,
    net_profit: 0,
    paid_amount: 0,
    available_balance: 0,
    delivered_count: 0,
    pending_count: 0,
    returned_count: 0
  };

  const renderStatusBadge = (statusStr) => {
    const s = (statusStr || 'delivered').toLowerCase();
    if (s === 'delivered') return <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Delivered</span>;
    if (s === 'returned') return <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><XCircle size={12} /> Returned</span>;
    if (s === 'shipped') return <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Truck size={12} /> Shipped</span>;
    if (s === 'approved') return <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Approved</span>;
    return <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Pending</span>;
  };

  return (
    <div className="page-container" style={{ gap: '20px' }}>
      {/* Top Header Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.98))', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '16px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <ShoppingBag size={22} />
              </div>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#fff' }}>
                  Reseller Self-Service Portal & Earnings Wallet
                </h1>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                  View wholesale prices, submit customer orders, and track real-time profit & payouts
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.05)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <User size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Reseller Profile:</span>
            {resellerSession ? (
              <strong style={{ fontSize: '14px', color: '#8b5cf6' }}>{resellerSession.name}</strong>
            ) : (
              <input
                type="text"
                className="form-input"
                style={{ width: '130px', padding: '6px 10px', fontSize: '13px', fontWeight: '700', textTransform: 'lowercase', height: '32px' }}
                value={resellerName}
                onChange={(e) => setResellerName(e.target.value.toLowerCase().trim())}
                placeholder="e.g. sellway"
              />
            )}

            {resellerSession ? (
              <button onClick={logoutReseller} className="btn btn-danger btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Logout
              </button>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="btn btn-primary btn-sm" style={{ background: '#8b5cf6', borderColor: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} /> Login
              </button>
            )}

            <button onClick={fetchWalletAndOrders} className="btn btn-secondary btn-icon btn-sm" title="Refresh Profile Data">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Live Wallet KPI Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '20px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={16} /> <span>Available Wallet Balance</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#10b981', marginTop: '6px' }}>
              {currency}{summary.available_balance.toFixed(2)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Net Profit minus Payouts Received
            </div>
          </div>

          <div style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={16} /> <span>Delivered Profit ({summary.delivered_count})</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#3b82f6', marginTop: '6px' }}>
              +{currency}{summary.total_delivered_profit.toFixed(2)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Total profit from successful sales
            </div>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingDown size={16} /> <span>Return Charges Loss ({summary.returned_count})</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444', marginTop: '6px' }}>
              -{currency}{summary.total_return_loss.toFixed(2)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Delivery fee cost on returned parcels
            </div>
          </div>

          <div style={{ background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={16} /> <span>Total Payouts Received</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#8b5cf6', marginTop: '6px' }}>
              {currency}{summary.paid_amount.toFixed(2)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Paid to bKash / Bank by merchant
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`btn ${activeTab === 'catalog' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ShoppingBag size={16} />
          <span>🛍️ Wholesale Catalog ({catalog.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <PackageCheck size={16} />
          <span>📦 My Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wallet')}
          className={`btn ${activeTab === 'wallet' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <DollarSign size={16} />
          <span>💰 Earnings & Payout Statements</span>
        </button>
      </div>

      {/* TAB 1: Wholesale Product Catalog */}
      {activeTab === 'catalog' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ position: 'relative', flex: '1', maxWidth: '680px', width: '100%' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(30, 41, 59, 0.85)',
                border: '1.5px solid rgba(139, 92, 246, 0.45)',
                borderRadius: '14px',
                padding: '12px 18px',
                boxShadow: '0 8px 24px rgba(139, 92, 246, 0.15)',
                backdropFilter: 'blur(8px)'
              }}>
                <Search size={20} color="#8b5cf6" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder={`🔍 Search products by name, SKU, or keyword (${catalog.length} items)...`}
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: '600',
                    width: '100%'
                  }}
                />
                {catalogSearch && (
                  <button
                    type="button"
                    onClick={() => setCatalogSearch('')}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                    title="Clear Search"
                  >
                    <XCircle size={18} />
                  </button>
                )}
              </div>
            </div>

            <div style={{ background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#c084fc' }}>
              Showing {filteredCatalog.length} of {catalog.length} products available
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filteredCatalog.map(p => (
              <div key={p.id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>{p.name}</h3>
                    {p.is_combo && <span className="badge badge-info" style={{ fontSize: '10px' }}>COMBO</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>SKU: {p.sku}</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                    <span className={`badge ${p.stock_quantity > 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '11px' }}>
                      In Stock: {p.stock_quantity} {p.unit}
                    </span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>Retail Price:</span>
                    <span style={{ textDecoration: 'line-through' }}>{currency}{p.retail_price.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '800', color: 'var(--accent-primary)' }}>
                    <span>Reseller Wholesale Price:</span>
                    <span style={{ color: '#10b981' }}>{currency}{p.reseller_price.toFixed(2)}</span>
                  </div>

                  <button
                    onClick={() => handleOpenOrderModal(p)}
                    disabled={p.stock_quantity <= 0}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', marginTop: '6px', justifyContent: 'center' }}
                  >
                    <Plus size={14} /> Submit Order for Customer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: My Orders History */}
      {activeTab === 'orders' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ position: 'relative', flex: '1', maxWidth: '550px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(30, 41, 59, 0.85)',
                border: '1.5px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '12px',
                padding: '10px 16px',
                boxShadow: '0 4px 16px rgba(139, 92, 246, 0.1)'
              }}>
                <Search size={18} color="#8b5cf6" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="🔍 Search orders by invoice #, customer name, or phone..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    width: '100%'
                  }}
                />
                {orderSearch && (
                  <button
                    type="button"
                    onClick={() => setOrderSearch('')}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                    title="Clear Search"
                  >
                    <XCircle size={16} />
                  </button>
                )}
              </div>
            </div>
            <button onClick={fetchWalletAndOrders} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} /> Refresh Orders
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Customer Info</th>
                  <th>Selling Price</th>
                  <th>Wholesale Cost</th>
                  <th>Reseller Profit</th>
                  <th>Delivery Status</th>
                  <th>Payout Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No reseller orders found for profile "{resellerName}".
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(o => {
                    const status = (o.order_status || 'delivered').toLowerCase();
                    const profit = Number(o.reseller_profit || o.gross_profit || 0);

                    return (
                      <tr key={o.id}>
                        <td style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>{o.invoice_no}</td>
                        <td style={{ fontSize: '13px' }}>{o.sale_date ? new Date(o.sale_date).toLocaleDateString() : '-'}</td>
                        <td>
                          <div style={{ fontWeight: '600' }}>{o.customer_name || 'Customer'}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📱 {o.customer_phone || '-'}</div>
                        </td>
                        <td style={{ fontWeight: '700' }}>{currency}{Number(o.total_amount || 0).toFixed(2)}</td>
                        <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{currency}{Number(o.reseller_wholesale_cost || o.total_cost || 0).toFixed(2)}</td>
                        <td style={{ fontWeight: '800', color: status === 'returned' ? 'var(--danger)' : 'var(--success)' }}>
                          {status === 'returned' ? `-${currency}${(Number(o.return_loss || 100)).toFixed(2)}` : `+${currency}${profit.toFixed(2)}`}
                        </td>
                        <td>{renderStatusBadge(o.order_status)}</td>
                        <td>
                          {o.payout_status === 'paid' ? (
                            <span className="badge badge-success">Paid</span>
                          ) : (
                            <span className="badge badge-secondary">Unpaid</span>
                          )}
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

      {/* TAB 3: Earnings & Payout Statements */}
      {activeTab === 'wallet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} color="var(--accent-primary)" />
              <span>Reseller Payout Receipts & History</span>
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Payout Ref</th>
                    <th>Date</th>
                    <th>Payment Method</th>
                    <th>Amount Paid</th>
                    <th>Notes / Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(!walletData?.payouts || walletData.payouts.length === 0) ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No payout transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    walletData.payouts.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>{p.transaction_ref || `PAY-${p.id}`}</td>
                        <td>{p.payout_date ? new Date(p.payout_date).toLocaleDateString() : '-'}</td>
                        <td><span className="badge badge-info">{p.payment_method || 'bKash'}</span></td>
                        <td style={{ fontWeight: '800', color: '#10b981' }}>{currency}{Number(p.amount).toFixed(2)}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.notes || 'Payout Completed'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Submit Customer Order Modal */}
      {showOrderModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={20} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Submit Reseller Customer Order</h3>
              </div>
              <button onClick={() => setShowOrderModal(false)} className="btn btn-secondary btn-icon">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Reseller Info Notice */}
                <div style={{ padding: '10px 14px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '8px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Reseller Name: <strong style={{ color: '#8b5cf6' }}>{resellerName}</strong></span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Profile ID: Auto-Linked</span>
                </div>

                {/* Customer Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Customer Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Tanvir Ahmed"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Customer Phone *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="01711000000"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Full Delivery Address *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. House #12, Road #4, Sector #10, Uttara"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">District / City</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Dhaka"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Thana / Area</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Uttara"
                      value={thana}
                      onChange={(e) => setThana(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Courier Service</label>
                    <select
                      className="form-select"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                    >
                      <option value="Steadfast">Steadfast Courier</option>
                      <option value="Pathao">Pathao Courier</option>
                      <option value="RedX">RedX Express</option>
                      <option value="Paperfly">Paperfly</option>
                      <option value="Sundarban">Sundarban Courier</option>
                    </select>
                  </div>
                </div>

                {/* Selected Products Breakdown */}
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <label className="form-label" style={{ marginBottom: '8px' }}>Selected Product(s) & Quantities</label>
                  {orderItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '13px' }}>
                      <span>{item.product_name} x {item.quantity}</span>
                      <span style={{ fontWeight: '700' }}>Wholesale Cost: {currency}{item.total_reseller_cost.toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700' }}>
                    <span>Total Reseller Wholesale Cost:</span>
                    <span style={{ color: 'var(--accent-primary)' }}>{currency}{totalWholesaleCost.toFixed(2)}</span>
                  </div>
                </div>

                {/* Customer Selling Price & Profit Calculation */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Customer Sale Price (কাষ্টমারের মোট দাম) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      required
                      placeholder="e.g. 800.00"
                      value={customerSellingPrice}
                      onChange={(e) => setCustomerSellingPrice(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Delivery Charge ({currency})</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="100.00"
                      value={deliveryFeeCharged}
                      onChange={(e) => setDeliveryFeeCharged(e.target.value)}
                    />
                  </div>
                </div>

                {/* Estimated Reseller Profit Display Box */}
                <div style={{ background: estimatedProfit >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)', padding: '12px 16px', borderRadius: '10px', border: `1px solid ${estimatedProfit >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>Estimated Profit on this Order:</span>
                  <strong style={{ fontSize: '18px', fontWeight: '800', color: estimatedProfit >= 0 ? '#10b981' : '#ef4444' }}>
                    +{currency}{estimatedProfit.toFixed(2)}
                  </strong>
                </div>

                <div className="form-group">
                  <label className="form-label">Special Delivery Instructions / Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Please deliver before 5 PM"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                  />
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowOrderModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-success">
                  {isSubmitting ? 'Submitting Order...' : 'Confirm & Submit Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reseller Authentication Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#8b5cf6" />
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Reseller Portal Login</h3>
              </div>
              <button onClick={() => setShowLoginModal(false)} className="btn btn-secondary btn-icon"><XCircle size={18} /></button>
            </div>
            <form onSubmit={handleResellerLoginSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  Enter your assigned Email, Phone Number, or Reseller Name and Password to access your reseller profile.
                </p>

                <div className="form-group">
                  <label className="form-label">Email / Phone / Reseller Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. sellway or reseller@example.com"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Portal Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowLoginModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={isLoggingIn} className="btn btn-primary" style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}>
                  {isLoggingIn ? 'Logging in...' : 'Login to Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResellerPortal;
