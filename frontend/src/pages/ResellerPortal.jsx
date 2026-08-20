import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import * as XLSX from 'xlsx';
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
  AlertCircle,
  Pin,
  ExternalLink,
  Upload,
  Download,
  FileSpreadsheet
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
  // Bulk Order Excel Upload States
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

  // Search & Filter
  const [catalogSearch, setCatalogSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [sortBy, setSortBy] = useState('all'); // 'all', 'pinned', 'top_margin', 'low_price', 'high_price', 'in_stock'
  const [inStockOnly, setInStockOnly] = useState(false);

  // Pinned Products Per Reseller
  const [pinnedProductIds, setPinnedProductIds] = useState(() => {
    try {
      const key = `profitway_pinned_${resellerName || 'default'}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      const key = `profitway_pinned_${resellerName || 'default'}`;
      const saved = localStorage.getItem(key);
      setPinnedProductIds(saved ? JSON.parse(saved) : []);
    } catch (e) {}
  }, [resellerName]);

  const togglePinProduct = (productId) => {
    setPinnedProductIds(prev => {
      let updated;
      if (prev.includes(productId)) {
        updated = prev.filter(id => id !== productId);
        showToast ? showToast('Unpinned', 'Product removed from pinned list', 'info') : null;
      } else {
        updated = [...prev, productId];
        showToast ? showToast('Pinned 📌', 'Product pinned to top of catalog!', 'success') : null;
      }
      const key = `profitway_pinned_${resellerName || 'default'}`;
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    });
  };

  // Reseller Delivery Charge Rates & Dynamic Zones
  const [deliveryArea, setDeliveryArea] = useState('');
  const [deliveryZones, setDeliveryZones] = useState([
    { id: 1, zone_name: 'ঢাকার বাইরে', charge: 120 },
    { id: 2, zone_name: 'ঢাকার ভেতরে', charge: 70 }
  ]);

  useEffect(() => {
    fetch('/api/reseller/delivery-rates')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.zones) && data.zones.length > 0) {
          setDeliveryZones(data.zones);
          setDeliveryArea(data.zones[0].zone_name);
        }
      })
      .catch(() => {});
  }, []);

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

  const selectedZone = deliveryZones.find(z => z.zone_name === deliveryArea) || deliveryZones[0];
  const selectedDeliveryFee = selectedZone ? Number(selectedZone.charge) : 60;
  const totalWholesaleCost = orderItems.reduce((sum, item) => sum + (item.total_reseller_cost || 0), 0);
  const customerProductSalePrice = Number(customerSellingPrice || 0);
  const totalCOD = customerProductSalePrice > 0 ? (customerProductSalePrice + selectedDeliveryFee) : 0;
  const estimatedProfit = Math.max(0, customerProductSalePrice - totalWholesaleCost);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!customerPhone || orderItems.length === 0) {
      return alert('Please enter Customer Phone and select at least 1 product.');
    }

    if (customerProductSalePrice < totalWholesaleCost) {
      if (!window.confirm(`Warning: Customer product sale price (${currency}${customerProductSalePrice}) is lower than reseller wholesale cost (${currency}${totalWholesaleCost}). Do you want to proceed?`)) {
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
          district: selectedZone ? selectedZone.zone_name : 'Dhaka',
          thana: selectedZone ? selectedZone.zone_name : '',
          courier_name: courierName,
          items: orderItems,
          customer_total_price: totalCOD,
          delivery_fee_charged: selectedDeliveryFee,
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

  // Download Demo Template (.xlsx)
  const handleDownloadDemoTemplate = () => {
    try {
      const templateData = [
        {
          'Customer Name': 'Siam Ahmed',
          'Customer Phone': '01884999488',
          'Customer Address': 'House 44, Road 2/A, Dhanmondi',
          'District': 'Dhaka',
          'Thana': 'Dhanmondi',
          'Product SKU': catalog[0]?.sku || 'SKU-001',
          'Quantity': 1,
          'Customer Sale Price (COD)': 500,
          'Delivery Charge': 100,
          'Courier Name': 'Steadfast',
          'Notes': 'Handle with care'
        },
        {
          'Customer Name': 'Rahim Khan',
          'Customer Phone': '01711223344',
          'Customer Address': 'Station Road, Agrabad',
          'District': 'Chittagong',
          'Thana': 'Double Mooring',
          'Product SKU': catalog[1]?.sku || catalog[0]?.sku || 'SKU-002',
          'Quantity': 2,
          'Customer Sale Price (COD)': 1200,
          'Delivery Charge': 120,
          'Courier Name': 'Pathao',
          'Notes': 'Deliver before 5 PM'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);

      ws['!cols'] = [
        { wch: 18 }, { wch: 16 }, { wch: 30 }, { wch: 14 },
        { wch: 16 }, { wch: 18 }, { wch: 10 }, { wch: 24 },
        { wch: 16 }, { wch: 14 }, { wch: 20 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Bulk Orders Demo');

      XLSX.writeFile(wb, 'Profitway_Bulk_Order_Demo_Template.xlsx');
    } catch (err) {
      alert(`Error generating Excel template: ${err.message}`);
    }
  };

  // Process Uploaded Excel/CSV File
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsParsingExcel(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const validated = data.map((row, idx) => {
          const name = String(row['Customer Name'] || row['CustomerName'] || row['Name'] || '').trim();
          const phone = String(row['Customer Phone'] || row['CustomerPhone'] || row['Phone'] || '').trim();
          const address = String(row['Customer Address'] || row['CustomerAddress'] || row['Address'] || '').trim();
          const district = String(row['District'] || 'Dhaka').trim();
          const thana = String(row['Thana'] || '').trim();
          const sku = String(row['Product SKU'] || row['SKU'] || row['Product Code'] || row['Product'] || '').trim();
          const qty = Number(row['Quantity'] || row['Qty'] || 1);
          const codPrice = Number(row['Customer Sale Price (COD)'] || row['COD'] || row['Selling Price'] || 0);
          const delivFee = Number(row['Delivery Charge'] || row['Delivery Fee'] || 100);
          const courier = String(row['Courier Name'] || row['Courier'] || 'Steadfast').trim();
          const notes = String(row['Notes'] || '').trim();

          let errors = [];
          if (!name) errors.push('Customer Name missing');
          if (!phone || phone.length < 10) errors.push('Invalid phone number');
          if (!address) errors.push('Address missing');
          if (!sku) errors.push('Product SKU missing');
          if (codPrice <= 0) errors.push('Invalid COD Price');

          // Match product against live catalog
          const matchedProd = catalog.find(p => 
            (p.sku && p.sku.toLowerCase() === sku.toLowerCase()) || 
            (p.name && p.name.toLowerCase() === sku.toLowerCase())
          );

          let wholesale = 0;
          if (matchedProd) {
            wholesale = Number(matchedProd.reseller_price || matchedProd.retail_price || 0) * qty;
          } else if (sku) {
            errors.push(`SKU '${sku}' not found in catalog`);
          }

          const estProfit = Math.max(0, codPrice - (wholesale + delivFee));

          return {
            id: idx + 1,
            selected: errors.length === 0,
            isValid: errors.length === 0,
            errors,
            name,
            phone,
            address,
            district,
            thana,
            sku,
            quantity: qty,
            codPrice,
            delivFee,
            courier,
            notes,
            matchedProduct: matchedProd,
            wholesale,
            estProfit
          };
        });

        setParsedRows(validated);
      } catch (err) {
        alert(`Error parsing Excel file: ${err.message}`);
      } finally {
        setIsParsingExcel(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Submit Bulk Orders
  const handleSubmitBulkOrders = async () => {
    const selectedRows = parsedRows.filter(r => r.selected && r.isValid);
    if (selectedRows.length === 0) {
      alert('Please select at least 1 valid order row to submit.');
      return;
    }

    setIsSubmittingBulk(true);
    try {
      const payloadOrders = selectedRows.map(r => ({
        customer_name: r.name,
        customer_phone: r.phone,
        customer_address: r.address,
        district: r.district,
        thana: r.thana,
        courier_name: r.courier,
        customer_total_price: r.codPrice,
        delivery_fee_charged: r.delivFee,
        notes: r.notes,
        items: [
          {
            product_id: r.matchedProduct?.id,
            sku: r.sku,
            product_name: r.matchedProduct?.name || r.sku,
            quantity: r.quantity,
            unit_reseller_price: r.matchedProduct?.reseller_price || 0
          }
        ]
      }));

      const res = await fetch('/api/reseller/orders/bulk-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reseller_name: resellerName,
          reseller_id: resellerId || null,
          orders: payloadOrders
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast ? showToast('Bulk Orders Submitted! 🎉', data.message, 'success') : alert(data.message);
        setShowBulkModal(false);
        setParsedRows([]);
        fetchWalletAndOrders();
        setActiveTab('orders');
      } else {
        alert(`Error submitting bulk orders: ${data.error}`);
      }
    } catch (err) {
      alert(`Bulk order submission error: ${err.message}`);
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const filteredCatalog = catalog
    .filter(p => {
      const searchMatch = p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                          p.sku.toLowerCase().includes(catalogSearch.toLowerCase());
      const stockMatch = inStockOnly ? Number(p.stock_quantity || 0) > 0 : true;
      const pinnedMatch = sortBy === 'pinned' ? pinnedProductIds.includes(p.id) : true;
      return searchMatch && stockMatch && pinnedMatch;
    })
    .sort((a, b) => {
      const isAPinned = pinnedProductIds.includes(a.id);
      const isBPinned = pinnedProductIds.includes(b.id);

      // Under 'all' mode, pinned products always float to top!
      if (sortBy === 'all' || sortBy === 'pinned') {
        if (isAPinned && !isBPinned) return -1;
        if (!isAPinned && isBPinned) return 1;
      }

      if (sortBy === 'top_margin') {
        const marginA = Number(a.retail_price || 0) - Number(a.reseller_price || 0);
        const marginB = Number(b.retail_price || 0) - Number(b.reseller_price || 0);
        return marginB - marginA;
      }
      if (sortBy === 'low_price') {
        return Number(a.reseller_price || 0) - Number(b.reseller_price || 0);
      }
      if (sortBy === 'high_price') {
        return Number(b.reseller_price || 0) - Number(a.reseller_price || 0);
      }
      if (sortBy === 'in_stock') {
        return (Number(b.stock_quantity || 0) > 0 ? 1 : 0) - (Number(a.stock_quantity || 0) > 0 ? 1 : 0);
      }
      return 0;
    });

  const filteredOrders = orders
    .filter(o =>
      (o.invoice_no || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.customer_name || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.customer_phone || '').toLowerCase().includes(orderSearch.toLowerCase())
    )
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));

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

  const ALL_STATUSES = [
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
    { key: 'deleted', label: 'Deleted', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.18)', icon: '🗑️' }
  ];

  const renderStatusBadge = (statusStr) => {
    const s = (statusStr || 'pending').toLowerCase();
    const cfg = ALL_STATUSES.find(st => st.key === s) ||
                (s === 'shipped' || s === 'processing' ? ALL_STATUSES.find(st => st.key === 'in_courier') : null) ||
                ALL_STATUSES.find(st => st.key === 'pending');

    return (
      <span
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

        <button
          onClick={() => setShowBulkModal(true)}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)', marginLeft: 'auto' }}
        >
          <Upload size={16} />
          <span>📥 Bulk Excel Upload</span>
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

          {/* Quick Filter Pills & Sort Dropdown Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', background: 'rgba(15, 23, 42, 0.65)', padding: '12px 16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Filter size={15} color="#8b5cf6" /> Filter:
              </span>
              
              <button
                type="button"
                onClick={() => setSortBy('all')}
                style={{
                  background: sortBy === 'all' ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'rgba(255, 255, 255, 0.06)',
                  color: '#fff',
                  border: sortBy === 'all' ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                🔥 All Products
              </button>

              <button
                type="button"
                onClick={() => setSortBy('pinned')}
                style={{
                  background: sortBy === 'pinned' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255, 255, 255, 0.06)',
                  color: '#fff',
                  border: sortBy === 'pinned' ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                📌 Pinned Items ({pinnedProductIds.length})
              </button>

              <button
                type="button"
                onClick={() => setSortBy('top_margin')}
                style={{
                  background: sortBy === 'top_margin' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.06)',
                  color: '#fff',
                  border: sortBy === 'top_margin' ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                💰 Top Margin (সর্বোচ্চ লাভ)
              </button>

              <button
                type="button"
                onClick={() => setSortBy('low_price')}
                style={{
                  background: sortBy === 'low_price' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'rgba(255, 255, 255, 0.06)',
                  color: '#fff',
                  border: sortBy === 'low_price' ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                🏷️ Low Price (কম দাম)
              </button>

              <button
                type="button"
                onClick={() => setSortBy('high_price')}
                style={{
                  background: sortBy === 'high_price' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255, 255, 255, 0.06)',
                  color: '#fff',
                  border: sortBy === 'high_price' ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                💎 High Price (বেশি দাম)
              </button>

              <button
                type="button"
                onClick={() => setInStockOnly(!inStockOnly)}
                style={{
                  background: inStockOnly ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                  color: inStockOnly ? '#34d399' : '#fff',
                  border: inStockOnly ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                ⚡ In-Stock Only {inStockOnly ? '✓' : ''}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sort by:</span>
              <select
                className="form-select"
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '10px', height: '34px', background: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="all">🔥 Default (All Items)</option>
                <option value="top_margin">💰 Top Profit Margin (সর্বোচ্চ লাভ)</option>
                <option value="low_price">🏷️ Lowest Reseller Price (কম পাইকারি দাম)</option>
                <option value="high_price">💎 Highest Reseller Price (বেশি পাইকারি দাম)</option>
                <option value="in_stock">⚡ Available Stock First (স্টকে থাকা প্রোডাক্ট)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filteredCatalog.map(p => {
              const estimatedMargin = Math.max(0, p.retail_price - p.reseller_price);
              const isPinned = pinnedProductIds.includes(p.id);

              return (
                <div
                  key={p.id}
                  className="card"
                  style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    gap: '12px',
                    border: isPinned ? '1.5px solid #f59e0b' : '1px solid var(--border-color)',
                    background: isPinned ? 'rgba(245, 158, 11, 0.04)' : undefined,
                    boxShadow: isPinned ? '0 4px 16px rgba(245, 158, 11, 0.15)' : undefined,
                    position: 'relative'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>{p.name}</h3>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>SKU: {p.sku}</div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {p.is_combo && <span className="badge badge-info" style={{ fontSize: '10px' }}>COMBO</span>}
                        <button
                          type="button"
                          onClick={() => togglePinProduct(p.id)}
                          style={{
                            background: isPinned ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                            border: isPinned ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.15)',
                            color: isPinned ? '#f59e0b' : '#94a3b8',
                            borderRadius: '8px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: '700',
                            transition: 'all 0.2s ease'
                          }}
                          title={isPinned ? 'Unpin Product' : 'Pin Product to Top'}
                        >
                          <Pin size={13} fill={isPinned ? '#f59e0b' : 'transparent'} />
                          <span>{isPinned ? 'Pinned' : 'Pin'}</span>
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                      <span className={`badge ${p.stock_quantity > 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '11px' }}>
                        In Stock: {p.stock_quantity} {p.unit}
                      </span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>Retail Selling Price:</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{currency}{p.retail_price.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '800' }}>
                      <span>Wholesale Reseller Price:</span>
                      <span style={{ color: '#8b5cf6' }}>{currency}{p.reseller_price.toFixed(2)}</span>
                    </div>

                    {/* Estimated Margin Badge */}
                    <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#10b981' }}>💰 Est. Margin / Profit:</span>
                      <strong style={{ fontSize: '13px', fontWeight: '800', color: '#10b981' }}>
                        +{currency}{estimatedMargin.toFixed(2)}
                      </strong>
                    </div>

                    <button
                      onClick={() => handleOpenOrderModal(p)}
                      disabled={p.stock_quantity <= 0}
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', marginTop: '4px', justifyContent: 'center' }}
                    >
                      <Plus size={14} /> Submit Order for Customer
                    </button>
                  </div>
                </div>
              );
            })}
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
                  <th>INVOICE #</th>
                  <th>CUSTOMER INFO</th>
                  <th>ORDERED ITEMS</th>
                  <th>COURIER</th>
                  <th>PRICING & COD BREAKDOWN</th>
                  <th>DELIVERY STATUS</th>
                  <th>EST PROFIT & PAYOUT</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No reseller orders found for profile "{resellerName}".
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(o => {
                    const status = (o.order_status || 'pending').toLowerCase();
                    const wholesale = Number(o.reseller_wholesale_cost || o.total_cost || 0);
                    const sellingPrice = Number(o.total_amount || o.total_price || 0);
                    const deliveryCharge = Number(o.delivery_fee_charged || 100);
                    const totalCOD = sellingPrice > 0 ? sellingPrice : (wholesale + Number(o.reseller_profit || 0) + deliveryCharge);

                    // Est Profit = Total COD - (Wholesale Price + Delivery Charge)
                    const estProfit = Math.max(0, totalCOD - (wholesale + deliveryCharge));

                    return (
                      <tr key={o.id}>
                        {/* INVOICE # & DATE */}
                        <td>
                          <div style={{ fontWeight: '800', color: 'var(--accent-primary)', fontSize: '14px' }}>
                            #{o.invoice_no}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {o.sale_date ? new Date(o.sale_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                          </div>
                        </td>

                        {/* CUSTOMER INFO */}
                        <td>
                          <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13px' }}>
                            {o.customer_name || 'Customer'}
                          </div>
                          {o.customer_phone && (
                            <div style={{ fontSize: '12px', color: '#ec4899', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontWeight: '600' }}>
                              <Phone size={12} /> {o.customer_phone}
                            </div>
                          )}
                          {(o.customer_address || o.district || o.thana) && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '4px', marginTop: '2px', maxWidth: '220px', lineHeight: '1.3' }}>
                              <MapPin size={12} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                              <span>
                                {o.customer_address || ''} {o.thana ? `, ${o.thana}` : ''} {o.district ? `, ${o.district}` : ''}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* ORDERED ITEMS */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '260px' }}>
                            {(o.items && o.items.length > 0) ? (
                              o.items.map((i, idx) => (
                                <div key={idx} style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.3' }}>
                                  • {i.product_name} <span style={{ fontWeight: '700', color: '#c084fc' }}>x{i.quantity}</span>
                                </div>
                              ))
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>-</span>
                            )}
                          </div>
                        </td>

                        {/* COURIER INFO */}
                        <td>
                          {o.tracking_code ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <strong style={{ fontSize: '13px', color: 'var(--text-primary)', letterSpacing: '0.02em', wordBreak: 'break-all' }}>
                                  {o.tracking_code}
                                </strong>
                                <a
                                  href={getTrackingUrl(o)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#8b5cf6', display: 'inline-flex', alignItems: 'center', transition: 'color 0.2s ease' }}
                                  title="Track Parcel on Courier Website"
                                >
                                  <ExternalLink size={14} />
                                </a>
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {o.courier_name || 'Courier'}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>

                        {/* PRICING & COD BREAKDOWN */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: 'var(--text-muted)' }}>
                              <span>Wholesale Price:</span>
                              <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{currency}{wholesale.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: 'var(--text-muted)' }}>
                              <span>Sale Price:</span>
                              <span style={{ fontWeight: '700', color: '#38bdf8' }}>{currency}{sellingPrice.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: 'var(--text-muted)' }}>
                              <span>Delivery Charge:</span>
                              <span>+{currency}{deliveryCharge.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontWeight: '800', borderTop: '1px dashed var(--border-color)', paddingTop: '3px', marginTop: '2px', color: '#fbbf24' }}>
                              <span>Total COD:</span>
                              <span>{currency}{totalCOD.toFixed(2)}</span>
                            </div>
                          </div>
                        </td>

                        {/* DELIVERY STATUS */}
                        <td>
                          {renderStatusBadge(o.order_status)}
                        </td>

                        {/* RESELLER PROFIT & PAYOUT */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontWeight: '800', fontSize: '14px', color: status === 'returned' ? '#ef4444' : '#10b981' }}>
                              {status === 'returned' ? `-${currency}${(Number(o.return_loss || 100)).toFixed(2)}` : `+${currency}${estProfit.toFixed(2)}`}
                            </div>
                            <div>
                              {o.payout_status === 'paid' ? (
                                <span className="badge badge-success" style={{ fontSize: '11px', padding: '2px 8px' }}>Paid</span>
                              ) : (
                                <span className="badge badge-secondary" style={{ fontSize: '11px', padding: '2px 8px' }}>Unpaid</span>
                              )}
                            </div>
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

                {/* Product Sale Price (without delivery charge) */}
                <div className="form-group">
                  <label className="form-label">Customer Product Sale Price (কাষ্টমারের প্রোডাক্ট বিক্রীদাম - ডেলিভারি চার্জ ছাড়া) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    required
                    placeholder="e.g. 380 (ডেলিভারি চার্জ ছাড়া শুধু প্রোডাক্ট বিক্রীদাম)"
                    value={customerSellingPrice}
                    onChange={(e) => setCustomerSellingPrice(e.target.value)}
                  />
                </div>

                {/* Delivery Area Select Dropdown */}
                <div className="form-group">
                  <label className="form-label">Delivery Area / কুরিয়ার এলাকা নির্বাচন করুন *</label>
                  <select
                    className="form-select"
                    value={deliveryArea}
                    onChange={(e) => setDeliveryArea(e.target.value)}
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px 14px', borderRadius: '8px', width: '100%', fontSize: '13.5px', fontWeight: '600' }}
                  >
                    {deliveryZones.map((z, idx) => (
                      <option key={idx} value={z.zone_name}>
                        🚚 {z.zone_name} ({currency}{Number(z.charge).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Live Calculation Summary Box */}
                <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <span>Product Sale Price (প্রোডাক্ট দাম):</span>
                    <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{currency}{customerProductSalePrice.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#38bdf8' }}>
                    <span>Delivery Charge ({selectedZone ? selectedZone.zone_name : 'Delivery'}):</span>
                    <span style={{ fontWeight: '700' }}>+{currency}{selectedDeliveryFee.toFixed(2)}</span>
                  </div>
                  <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '800' }}>
                    <span>Total COD (কাষ্টমারের ডেলিভারিসহ মোট বিক্রীদাম):</span>
                    <span style={{ color: '#f59e0b', fontSize: '16px' }}>{currency}{totalCOD.toFixed(2)}</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>Estimated Reseller Profit:</span>
                    <strong style={{ fontSize: '18px', fontWeight: '800', color: estimatedProfit >= 0 ? '#10b981' : '#ef4444' }}>
                      +{currency}{estimatedProfit.toFixed(2)}
                    </strong>
                  </div>
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

      {/* BULK ORDER EXCEL UPLOAD MODAL */}
      {showBulkModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '950px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', borderRadius: '20px', border: '1.5px solid rgba(16, 185, 129, 0.4)', background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileSpreadsheet color="#10b981" size={24} />
                  <span>📥 Bulk Reseller Order Submit (Excel / CSV)</span>
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Download demo template, fill order data using Product SKUs, and upload to submit multiple orders instantly.
                </p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="btn btn-secondary btn-icon" style={{ borderRadius: '50%' }}>
                <XCircle size={20} />
              </button>
            </div>

            {/* Step 1 & Step 2 Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              
              {/* Step 1: Download Demo Template */}
              <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Download size={18} /> Step 1: Download Demo Excel Template
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.4' }}>
                    Get pre-populated demo sheet containing correct column headers and sample catalog SKUs.
                  </div>
                </div>
                <button onClick={handleDownloadDemoTemplate} className="btn btn-primary" style={{ background: '#8b5cf6', borderColor: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px' }}>
                  <Download size={16} /> <span>Download Demo Sheet (.xlsx)</span>
                </button>
              </div>

              {/* Step 2: Upload Excel File */}
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px dashed rgba(16, 185, 129, 0.5)', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Upload size={18} /> Step 2: Upload Filled Excel File
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Select or drag-and-drop your completed `.xlsx` or `.csv` file here.
                  </div>
                </div>
                <label className="btn btn-success" style={{ background: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer' }}>
                  <Upload size={16} />
                  <span>{isParsingExcel ? 'Parsing File...' : 'Choose Excel / CSV File'}</span>
                  <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: 'none' }} disabled={isParsingExcel} />
                </label>
              </div>
            </div>

            {/* Step 3: Live Preview & Validation Table */}
            {parsedRows.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'rgba(15, 23, 42, 0.8)', padding: '12px 18px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>
                    Preview & Validation Results ({parsedRows.length} Rows Found)
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                    <span style={{ color: '#10b981', fontWeight: '700' }}>
                      ✓ Valid: {parsedRows.filter(r => r.isValid).length}
                    </span>
                    <span style={{ color: '#ef4444', fontWeight: '700' }}>
                      ⚠️ Errors: {parsedRows.filter(r => !r.isValid).length}
                    </span>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <table className="data-table" style={{ fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th>Select</th>
                        <th>Status</th>
                        <th>Customer Info</th>
                        <th>Address & Location</th>
                        <th>Product SKU & Qty</th>
                        <th>COD Price</th>
                        <th>Est Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((r, idx) => (
                        <tr key={idx} style={{ background: !r.isValid ? 'rgba(239, 68, 68, 0.08)' : 'transparent' }}>
                          <td>
                            <input
                              type="checkbox"
                              checked={r.selected}
                              disabled={!r.isValid}
                              onChange={(e) => {
                                const val = e.target.checked;
                                setParsedRows(prev => prev.map(item => item.id === r.id ? { ...item, selected: val } : item));
                              }}
                              style={{ accentColor: '#10b981', cursor: 'pointer', width: '16px', height: '16px' }}
                            />
                          </td>
                          <td>
                            {r.isValid ? (
                              <span className="badge badge-success" style={{ fontSize: '11px' }}>Valid ✓</span>
                            ) : (
                              <div style={{ color: '#ef4444', fontSize: '11px', fontWeight: '700' }}>
                                ⚠️ {r.errors.join(', ')}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{r.name || 'N/A'}</div>
                            <div style={{ fontSize: '11px', color: '#ec4899' }}>📱 {r.phone || 'N/A'}</div>
                          </td>
                          <td>
                            <div>{r.address || 'N/A'}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📍 {r.district} {r.thana ? `, ${r.thana}` : ''}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: '700', color: '#c084fc' }}>{r.sku} x{r.quantity}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.matchedProduct ? r.matchedProduct.name : 'Unknown Product'}</div>
                          </td>
                          <td style={{ fontWeight: '700' }}>{currency}{r.codPrice.toFixed(2)}</td>
                          <td style={{ fontWeight: '800', color: '#10b981' }}>+{currency}{r.estProfit.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Confirm & Submit Button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Ready to submit <strong>{parsedRows.filter(r => r.selected && r.isValid).length}</strong> valid orders
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setShowBulkModal(false)} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitBulkOrders}
                      disabled={isSubmittingBulk || parsedRows.filter(r => r.selected && r.isValid).length === 0}
                      className="btn btn-success"
                      style={{ background: '#10b981', borderColor: '#10b981', padding: '10px 24px', fontWeight: '800' }}
                    >
                      {isSubmittingBulk ? 'Submitting Orders...' : `Submit ${parsedRows.filter(r => r.selected && r.isValid).length} Valid Orders 🚀`}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default ResellerPortal;
