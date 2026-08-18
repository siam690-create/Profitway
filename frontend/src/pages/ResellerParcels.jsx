import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Package, Plus, PackagePlus, Eye, X, Users, Phone, DollarSign, Wallet, FileText, CheckCircle, Printer, Trash2, Search, RotateCcw, AlertTriangle } from 'lucide-react';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { ProductSelectSearch } from '../components/ProductSelectSearch';

export const ResellerParcels = () => {
  const { authFetch, products, currency, formatCurrency, shopSettings, refreshAllData } = useApp();
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' or 'returns'
  const [salesList, setSalesList] = useState([]);
  const [returnsList, setReturnsList] = useState([]);
  const [accountsList, setAccountsList] = useState([]);
  const [profilesList, setProfilesList] = useState([]);

  // Modals State
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedSaleDetails, setSelectedSaleDetails] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [returnSearchQuery, setReturnSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form State for Reseller Sale Order
  const [resellerName, setResellerName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [accountId, setAccountId] = useState('');
  const [delivCharged, setDelivCharged] = useState('0');
  const [courierCost, setCourierCost] = useState('0');

  // Sale Items Cart
  const [saleItems, setSaleItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [sellQty, setSellQty] = useState('1');
  const [unitCostPrice, setUnitCostPrice] = useState('0');
  const [unitWholesalePrice, setUnitWholesalePrice] = useState('');

  // Form State for Reseller Return
  const [returnResellerName, setReturnResellerName] = useState('');
  const [returnInvoiceNo, setReturnInvoiceNo] = useState('');
  const [returnCourierName, setReturnCourierName] = useState('');
  const [returnCourierCharge, setReturnCourierCharge] = useState('0');
  const [returnDelivLoss, setReturnDelivLoss] = useState('0');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 10));
  const [returnNotes, setReturnNotes] = useState('');

  // Payout Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutResellerName, setPayoutResellerName] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bKash');
  const [payoutAccountId, setPayoutAccountId] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);

  const handleProcessPayoutSubmit = async (e) => {
    e.preventDefault();
    if (!payoutResellerName || !payoutAmount || Number(payoutAmount) <= 0) {
      return alert('Please enter Reseller Name and valid Payout Amount.');
    }

    setIsProcessingPayout(true);
    try {
      const res = await authFetch('/api/reseller/payouts/process', {
        method: 'POST',
        body: JSON.stringify({
          reseller_name: payoutResellerName,
          amount: Number(payoutAmount),
          payment_method: payoutMethod,
          account_id: payoutAccountId || null,
          notes: payoutNotes
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Reseller payout processed successfully!');
        setShowPayoutModal(false);
        setPayoutResellerName('');
        setPayoutAmount('');
        setPayoutNotes('');
        fetchData();
        refreshAllData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error processing payout: ${err.message}`);
    } finally {
      setIsProcessingPayout(false);
    }
  };

  // Return Items Cart
  const [returnItems, setReturnItems] = useState([]);
  const [retProductId, setRetProductId] = useState('');
  const [retQty, setRetQty] = useState('1');
  const [retUnitPrice, setRetUnitPrice] = useState('');
  const [retCostPrice, setRetCostPrice] = useState('0');
  const [retCondition, setRetCondition] = useState('good_restockable');

  // Reseller Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    bkash_no: '',
    nagad_no: '',
    bank_info: '',
    status: 'active'
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleOpenAddProfileModal = () => {
    setEditingProfile(null);
    setProfileForm({ name: '', phone: '', email: '', address: '', bkash_no: '', nagad_no: '', bank_info: '', status: 'active' });
    setShowProfileModal(true);
  };

  const handleOpenEditProfileModal = (profile) => {
    setEditingProfile(profile);
    setProfileForm({
      name: profile.name || '',
      phone: profile.phone || '',
      email: profile.email || '',
      address: profile.address || '',
      bkash_no: profile.bkash_no || '',
      nagad_no: profile.nagad_no || '',
      bank_info: profile.bank_info || '',
      status: profile.status || 'active'
    });
    setShowProfileModal(true);
  };

  const handleSaveProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name) return alert('Reseller Name is required.');

    setIsSavingProfile(true);
    try {
      let res;
      if (editingProfile) {
        res = await authFetch(`/api/reseller/profiles/${editingProfile.id}`, {
          method: 'PUT',
          body: JSON.stringify(profileForm)
        });
      } else {
        res = await authFetch('/api/reseller/profiles', {
          method: 'POST',
          body: JSON.stringify(profileForm)
        });
      }

      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Reseller profile saved successfully!');
        setShowProfileModal(false);
        fetchData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error saving profile: ${err.message}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteProfile = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete reseller profile "${name}"?`)) {
      try {
        const res = await authFetch(`/api/reseller/profiles/${id}`, { method: 'DELETE' });
        if (res.ok) fetchData();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const fetchData = async () => {
    try {
      const sRes = await authFetch('/api/reseller/sales');
      const sData = await sRes.json();
      if (sRes.ok) setSalesList(sData);

      const rRes = await authFetch('/api/reseller/returns');
      const rData = await rRes.json();
      if (rRes.ok) setReturnsList(rData);

      const fRes = await authFetch('/api/finance/summary');
      const fData = await fRes.json();
      if (fRes.ok) setAccountsList(fData.accounts || []);

      const pRes = await authFetch('/api/reseller/profiles');
      const pData = await pRes.json();
      if (pRes.ok) setProfilesList(pData || []);
    } catch (err) {
      console.error('Error fetching reseller data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Add Item to Reseller Sale Cart ---
  const handleAddItemToSale = () => {
    if (!selectedProductId) {
      alert('Please select a product.');
      return;
    }
    const qtyNum = parseInt(sellQty, 10);
    const priceNum = parseFloat(unitWholesalePrice);
    const costNum = parseFloat(unitCostPrice);

    if (!qtyNum || qtyNum <= 0 || isNaN(priceNum)) {
      alert('Please enter valid quantity and price.');
      return;
    }

    const prod = products.find(p => String(p.id) === String(selectedProductId));
    if (!prod) return;

    if (qtyNum > prod.stock_quantity) {
      alert(`Warning: Requested quantity (${qtyNum}) exceeds available stock (${prod.stock_quantity}).`);
    }

    const itemTotal = qtyNum * priceNum;
    const itemCostTotal = qtyNum * costNum;

    setSaleItems([
      ...saleItems,
      {
        product_id: prod.id,
        product_name: prod.name,
        quantity: qtyNum,
        unit_cost_price: costNum,
        unit_wholesale_price: priceNum,
        total_item_price: itemTotal,
        item_profit: itemTotal - itemCostTotal
      }
    ]);

    setSelectedProductId('');
    setSellQty('1');
    setUnitWholesalePrice('');
    setUnitCostPrice('0');
  };

  const handleRemoveSaleItem = (idx) => {
    setSaleItems(saleItems.filter((_, i) => i !== idx));
  };

  // --- Submit Reseller Sale ---
  const handleSubmitSale = async (e) => {
    e.preventDefault();
    if (!resellerName.trim()) {
      alert('Reseller Name / Page Name is required.');
      return;
    }
    if (saleItems.length === 0) {
      alert('Please add at least 1 product to the sale order.');
      return;
    }

    try {
      const payload = {
        reseller_name: resellerName.trim(),
        customer_name: customerName ? customerName.trim() : null,
        customer_phone: customerPhone ? customerPhone.trim() : null,
        items: saleItems,
        delivery_fee_charged: parseFloat(delivCharged || 0),
        courier_actual_cost: parseFloat(courierCost || 0),
        payment_status: 'paid',
        account_id: accountId || null,
        sale_date: saleDate,
        notes: notes || null
      };

      const res = await authFetch('/api/reseller/sales', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Reseller Parcel order recorded successfully!');
        setShowSaleModal(false);
        setResellerName('');
        setCustomerName('');
        setCustomerPhone('');
        setSaleItems([]);
        setNotes('');
        fetchData();
        refreshAllData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error submitting reseller sale: ${err.message}`);
    }
  };

  // --- Delete Reseller Sale ---
  const handleDeleteSale = async (sale) => {
    if (!window.confirm(`Are you sure you want to delete Reseller Order #${sale.invoice_no}? Product stock will be restored into inventory.`)) {
      return;
    }
    try {
      const res = await authFetch(`/api/reseller/sales/${sale.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Reseller Order deleted!');
        fetchData();
        refreshAllData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error deleting reseller sale: ${err.message}`);
    }
  };

  // --- Add Item to Reseller Return Cart ---
  const handleAddItemToReturn = () => {
    if (!retProductId) {
      alert('Please select a returned product.');
      return;
    }
    const q = parseInt(retQty, 10);
    if (!q || q <= 0) return;

    const prod = products.find(p => String(p.id) === String(retProductId));
    if (!prod) return;

    const priceNum = parseFloat(retUnitPrice) || Number(prod.selling_price || 0);
    const costNum = parseFloat(retCostPrice) || Number(prod.cost_price || 0);
    const marginLoss = q * (priceNum - costNum);

    setReturnItems([
      ...returnItems,
      {
        product_id: prod.id,
        product_name: prod.name,
        sku: prod.sku,
        quantity: q,
        unit_wholesale_price: priceNum,
        unit_cost_price: costNum,
        margin_loss: marginLoss > 0 ? marginLoss : 0,
        restock_condition: retCondition
      }
    ]);

    setRetProductId('');
    setRetQty('1');
    setRetUnitPrice('');
    setRetCostPrice('0');
  };

  const handleRemoveReturnItem = (idx) => {
    setReturnItems(returnItems.filter((_, i) => i !== idx));
  };

  // --- Submit Reseller Return ---
  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (returnItems.length === 0) {
      alert('Please add at least 1 returned product item.');
      return;
    }

    try {
      const payload = {
        reseller_name: returnResellerName ? returnResellerName.trim() : null,
        invoice_no: returnInvoiceNo ? returnInvoiceNo.trim() : null,
        courier_name: returnCourierName ? returnCourierName.trim() : null,
        courier_charge: parseFloat(returnCourierCharge || 0),
        return_delivery_loss: parseFloat(returnDelivLoss || 0),
        return_date: returnDate,
        items: returnItems,
        notes: returnNotes || null
      };

      const res = await authFetch('/api/reseller/returns', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Reseller Return recorded and items restocked!');
        setShowReturnModal(false);
        setReturnResellerName('');
        setReturnInvoiceNo('');
        setReturnCourierName('');
        setReturnItems([]);
        setReturnNotes('');
        fetchData();
        refreshAllData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error recording return: ${err.message}`);
    }
  };

  // Calculations
  const calculatedItemsTotal = saleItems.reduce((sum, i) => sum + i.total_item_price, 0);
  const calculatedGrossProfit = saleItems.reduce((sum, i) => sum + i.item_profit, 0) + (parseFloat(delivCharged || 0) - parseFloat(courierCost || 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Package size={24} color="#ec4899" />
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Reseller Parcels Accounting & Tracker</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Record reseller orders, auto-deduct/restock stock, and track reseller profits directly in P&L Statement
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <DateRangeFilter
            onFilterChange={({ startDate: s, endDate: e }) => {
              setStartDate(s);
              setEndDate(e);
            }}
          />
          <button onClick={handleOpenAddProfileModal} className="btn btn-secondary" style={{ borderColor: '#8b5cf6', color: '#8b5cf6' }}>
            <Users size={16} />
            <span>+ Add Reseller Profile</span>
          </button>
          <button onClick={() => setShowPayoutModal(true)} className="btn btn-secondary" style={{ borderColor: '#10b981', color: '#10b981' }}>
            <Wallet size={16} />
            <span>💸 Pay Reseller Profit</span>
          </button>
          <button onClick={() => setShowReturnModal(true)} className="btn btn-secondary" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
            <RotateCcw size={16} />
            <span>+ Record Reseller Return</span>
          </button>
          <button onClick={() => setShowSaleModal(true)} className="btn btn-primary" style={{ background: '#ec4899', borderColor: '#ec4899', color: '#fff' }}>
            <Plus size={16} />
            <span>+ Record Reseller Sale Order</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('sales')}
          className={`btn ${activeTab === 'sales' ? 'btn-primary' : 'btn-secondary'}`}
          style={activeTab === 'sales' ? { background: '#ec4899', borderColor: '#ec4899' } : {}}
        >
          🛍️ Reseller Sales ({salesList.length})
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`btn ${activeTab === 'returns' ? 'btn-primary' : 'btn-secondary'}`}
          style={activeTab === 'returns' ? { background: '#ef4444', borderColor: '#ef4444' } : {}}
        >
          🔄 Reseller Returns ({returnsList.length})
        </button>
        <button
          onClick={() => setActiveTab('profiles')}
          className={`btn ${activeTab === 'profiles' ? 'btn-primary' : 'btn-secondary'}`}
          style={activeTab === 'profiles' ? { background: '#8b5cf6', borderColor: '#8b5cf6' } : {}}
        >
          👥 Reseller Profiles ({profilesList.length})
        </button>
      </div>

      {/* --- SUB TAB 1: RESELLER SALES --- */}
      {activeTab === 'sales' && (() => {
        const filteredSales = salesList.filter(s => {
          if (startDate || endDate) {
            const sDate = new Date(s.sale_date || s.created_at).toISOString().slice(0, 10);
            if (startDate && sDate < startDate) return false;
            if (endDate && sDate > endDate) return false;
          }

          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const inv = String(s.invoice_no || '').toLowerCase();
            const rName = String(s.reseller_name || '').toLowerCase();
            const cName = String(s.customer_name || '').toLowerCase();
            const phone = String(s.customer_phone || '').toLowerCase();
            const itemNames = (s.items || []).map(i => String(i.product_name || '').toLowerCase()).join(' ');

            return inv.includes(q) || rName.includes(q) || cName.includes(q) || phone.includes(q) || itemNames.includes(q);
          }

          return true;
        });

        const totalResellerRev = filteredSales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
        const totalResellerProfit = filteredSales.reduce((sum, s) => sum + (Number(s.gross_profit || 0) + Number(s.delivery_profit || 0)), 0);

        return (
          <div className="glass-card" style={{ padding: '24px' }}>
            {/* Stat Cards Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px', background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px' }}>
              <div>Total Reseller Sales Revenue: <strong style={{ display: 'block', fontSize: '16px', color: '#ec4899' }}>{formatCurrency(totalResellerRev)}</strong></div>
              <div>Reseller Net Gross Profit: <strong style={{ display: 'block', fontSize: '16px', color: 'var(--success)' }}>{formatCurrency(totalResellerProfit)}</strong></div>
              <div>Parcels Dispatched: <strong style={{ display: 'block', fontSize: '16px', color: 'var(--accent-primary)' }}>{filteredSales.length} Parcels</strong></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Reseller Sales History ({filteredSales.length})</h3>

              {/* Instant Search Bar */}
              <div style={{ position: 'relative', width: '320px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '36px', paddingRight: searchQuery ? '32px' : '12px', fontSize: '13px' }}
                  placeholder="Search Reseller Name, Phone, Invoice #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Reseller / Page Name</th>
                    <th>Customer Phone</th>
                    <th>Revenue</th>
                    <th>Reseller Gross Profit</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No reseller sales found. Click "+ Record Reseller Sale Order" to add one.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map(sale => {
                      const netProfit = Number(sale.gross_profit || 0) + Number(sale.delivery_profit || 0);
                      return (
                        <tr key={sale.id}>
                          <td><strong>#{sale.invoice_no}</strong></td>
                          <td style={{ fontSize: '12px' }}>{new Date(sale.sale_date || sale.created_at).toLocaleDateString()}</td>
                          <td>
                            <strong style={{ color: '#ec4899' }}>{sale.reseller_name}</strong>
                            {sale.customer_name && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cust: {sale.customer_name}</div>}
                          </td>
                          <td style={{ fontSize: '12px' }}>{sale.customer_phone || '-'}</td>
                          <td style={{ fontWeight: '600' }}>{formatCurrency(sale.total_amount)}</td>
                          <td style={{ fontWeight: '700', color: 'var(--success)' }}>+{formatCurrency(netProfit)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => setSelectedSaleDetails(sale)} className="btn btn-secondary btn-icon btn-sm" title="View Sale Statement">
                                <Eye size={14} />
                              </button>
                              <button onClick={() => handleDeleteSale(sale)} className="btn btn-danger btn-icon btn-sm" title="Delete & Revert Stock">
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
        );
      })()}

      {/* --- SUB TAB 2: RESELLER RETURNS --- */}
      {activeTab === 'returns' && (() => {
        const filteredReturns = returnsList.filter(r => {
          if (startDate || endDate) {
            const rDate = new Date(r.return_date || r.created_at).toISOString().slice(0, 10);
            if (startDate && rDate < startDate) return false;
            if (endDate && rDate > endDate) return false;
          }

          if (returnSearchQuery.trim()) {
            const q = returnSearchQuery.toLowerCase().trim();
            const inv = String(r.invoice_no || '').toLowerCase();
            const name = String(r.reseller_name || '').toLowerCase();
            const courier = String(r.courier_name || '').toLowerCase();
            const itemNames = (r.items || []).map(i => String(i.product_name || '').toLowerCase()).join(' ');

            return inv.includes(q) || name.includes(q) || courier.includes(q) || itemNames.includes(q);
          }

          return true;
        });

        const totalReturnCharges = filteredReturns.reduce((sum, r) => sum + Number(r.courier_charge || 0) + Number(r.return_delivery_loss || 0), 0);

        return (
          <div className="glass-card" style={{ padding: '24px' }}>
            {/* Stat Cards Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px', background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px' }}>
              <div>Total Returned Parcels: <strong style={{ display: 'block', fontSize: '16px', color: '#ef4444' }}>{filteredReturns.length} Parcels</strong></div>
              <div>Courier Loss & Charges: <strong style={{ display: 'block', fontSize: '16px', color: '#ef4444' }}>-{formatCurrency(totalReturnCharges)}</strong></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Reseller Return Parcels Log ({filteredReturns.length})</h3>

              <div style={{ position: 'relative', width: '320px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '36px', paddingRight: returnSearchQuery ? '32px' : '12px', fontSize: '13px' }}
                  placeholder="Search Reseller Name, Invoice #, Courier..."
                  value={returnSearchQuery}
                  onChange={(e) => setReturnSearchQuery(e.target.value)}
                />
                {returnSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setReturnSearchQuery('')}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Return Date</th>
                    <th>Reseller Name</th>
                    <th>Invoice / Parcel #</th>
                    <th>Courier</th>
                    <th>Courier Loss</th>
                    <th>Returned Items & Condition</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReturns.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No reseller returned parcels recorded.
                      </td>
                    </tr>
                  ) : (
                    filteredReturns.map(ret => (
                      <tr key={ret.id}>
                        <td style={{ fontSize: '12px' }}>{new Date(ret.return_date || ret.created_at).toLocaleDateString()}</td>
                        <td><strong style={{ color: '#ec4899' }}>{ret.reseller_name || 'N/A'}</strong></td>
                        <td><strong>{ret.invoice_no || '-'}</strong></td>
                        <td>{ret.courier_name || '-'}</td>
                        <td style={{ color: '#ef4444', fontWeight: '600' }}>-{formatCurrency(Number(ret.courier_charge || 0) + Number(ret.return_delivery_loss || 0))}</td>
                        <td style={{ fontSize: '12px' }}>
                          {(ret.items || []).map((item, idx) => (
                            <div key={idx}>
                              • {item.product_name} ({item.quantity} pcs) - <span style={{ color: item.restock_condition?.includes('good') ? 'var(--success)' : '#ef4444' }}>{item.restock_condition?.includes('good') ? 'Restocked' : 'Damaged'}</span>
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* --- SUB TAB 3: RESELLER PROFILES DIRECTORY --- */}
      {activeTab === 'profiles' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#8b5cf6" />
                <span>Registered Reseller Profiles ({profilesList.length})</span>
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Manage reseller contact details, bKash/Nagad payout accounts, and portal access status
              </p>
            </div>
            <button onClick={handleOpenAddProfileModal} className="btn btn-primary" style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}>
              <Plus size={16} /> + New Reseller Profile
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reseller Name</th>
                  <th>Phone</th>
                  <th>bKash No</th>
                  <th>Nagad No</th>
                  <th>Bank / Notes</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {profilesList.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No reseller profiles created yet. Click "+ New Reseller Profile" to register your first reseller!
                    </td>
                  </tr>
                ) : (
                  profilesList.map(p => (
                    <tr key={p.id}>
                      <td><strong style={{ color: '#8b5cf6', fontSize: '14px' }}>👤 {p.name}</strong></td>
                      <td>{p.phone || '-'}</td>
                      <td style={{ fontWeight: '600' }}>{p.bkash_no ? `📱 ${p.bkash_no}` : '-'}</td>
                      <td style={{ fontWeight: '600' }}>{p.nagad_no ? `📱 ${p.nagad_no}` : '-'}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.bank_info || p.address || '-'}</td>
                      <td>
                        <span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                          {p.status || 'active'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleOpenEditProfileModal(p)} className="btn btn-secondary btn-icon btn-sm" title="Edit Profile">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => handleDeleteProfile(p.id, p.name)} className="btn btn-danger btn-icon btn-sm" title="Delete Profile">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CREATE RESELLER SALE MODAL --- */}
      {showSaleModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h3>Record Reseller Parcel Order (রিসেল পার্সেল এন্ট্রি)</h3>
              <button onClick={() => setShowSaleModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmitSale}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Reseller Name / Page Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Trendy BD / Fahim Reseller"
                      value={resellerName}
                      onChange={(e) => setResellerName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Customer Name (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="End customer name..."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Customer Phone (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="01711..."
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Sale Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                  />
                </div>

                {/* Add Product Section */}
                <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <PackagePlus size={16} color="#ec4899" />
                    <span>Select Product & Wholesale Price</span>
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr', gap: '10px', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Product *</label>
                      <ProductSelectSearch
                        products={products}
                        selectedId={selectedProductId}
                        onSelect={(id) => {
                          setSelectedProductId(id);
                          const prod = products.find(p => String(p.id) === String(id));
                          if (prod) {
                            setUnitCostPrice(String(prod.cost_price || 0));
                            setUnitWholesalePrice(String(prod.selling_price || 0));
                          }
                        }}
                        placeholder="Type product name or SKU to search..."
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Qty</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="1"
                        value={sellQty}
                        onChange={(e) => setSellQty(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Wholesale Price ({currency})</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        placeholder="Reseller Wholesale Price..."
                        value={unitWholesalePrice}
                        onChange={(e) => setUnitWholesalePrice(e.target.value)}
                      />
                    </div>

                    <button type="button" onClick={handleAddItemToSale} className="btn btn-primary" style={{ padding: '10px', background: '#ec4899', borderColor: '#ec4899', color: '#fff' }}>
                      + Add
                    </button>
                  </div>
                </div>

                {/* Items Cart List */}
                {saleItems.length > 0 && (
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Qty</th>
                          <th>Wholesale Price</th>
                          <th>Total</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {saleItems.map((item, idx) => (
                          <tr key={idx}>
                            <td><strong>{item.product_name}</strong></td>
                            <td>{item.quantity}</td>
                            <td>{formatCurrency(item.unit_wholesale_price)}</td>
                            <td style={{ fontWeight: '700', color: 'var(--success)' }}>{formatCurrency(item.total_item_price)}</td>
                            <td>
                              <button type="button" onClick={() => handleRemoveSaleItem(idx)} className="btn btn-danger btn-icon btn-sm">
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Delivery & Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Delivery Fee Charged ({currency})</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="120.00"
                      value={delivCharged}
                      onChange={(e) => setDelivCharged(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Courier Actual Cost ({currency})</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="100.00"
                      value={courierCost}
                      onChange={(e) => setCourierCost(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px' }}>
                  <div>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Sale Value:</span>
                    <strong style={{ display: 'block', fontSize: '18px', color: '#ec4899' }}>{formatCurrency(calculatedItemsTotal)}</strong>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Net Reseller Profit:</span>
                    <strong style={{ display: 'block', fontSize: '18px', color: 'var(--success)' }}>+{formatCurrency(calculatedGrossProfit)}</strong>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowSaleModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#ec4899', borderColor: '#ec4899' }}>Confirm Reseller Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CREATE RESELLER RETURN MODAL --- */}
      {showReturnModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3>Record Reseller Parcel Return (রিসেল পার্সেল রিটার্ন)</h3>
              <button onClick={() => setShowReturnModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmitReturn}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Reseller Name (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Trendy BD"
                      value={returnResellerName}
                      onChange={(e) => setReturnResellerName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Invoice / Parcel # (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="RSL-123456"
                      value={returnInvoiceNo}
                      onChange={(e) => setReturnInvoiceNo(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Courier Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Steadfast / Pathao"
                      value={returnCourierName}
                      onChange={(e) => setReturnCourierName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Courier Charge ({currency})</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="90.00"
                      value={returnCourierCharge}
                      onChange={(e) => setReturnCourierCharge(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Return Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Add Returned Product Section */}
                <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <PackagePlus size={16} color="#ef4444" />
                    <span>Select Returned Product to Restock</span>
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1.2fr 1.2fr 0.8fr', gap: '8px', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Product *</label>
                      <ProductSelectSearch
                        products={products}
                        selectedId={retProductId}
                        onSelect={(id) => {
                          setRetProductId(id);
                          const prod = products.find(p => String(p.id) === String(id));
                          if (prod) {
                            setRetUnitPrice(String(prod.selling_price || 0));
                            setRetCostPrice(String(prod.cost_price || 0));
                          }
                        }}
                        placeholder="Type product name or SKU to search..."
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Qty</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="1"
                        value={retQty}
                        onChange={(e) => setRetQty(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Resell Price ({currency})</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        placeholder="Resell price..."
                        value={retUnitPrice}
                        onChange={(e) => setRetUnitPrice(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Condition</label>
                      <select
                        className="form-select"
                        value={retCondition}
                        onChange={(e) => setRetCondition(e.target.value)}
                      >
                        <option value="good_restockable">Good (Restock In)</option>
                        <option value="damaged_scrap">Damaged (No Restock)</option>
                      </select>
                    </div>

                    <button type="button" onClick={handleAddItemToReturn} className="btn btn-primary" style={{ padding: '10px', background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}>
                      + Add
                    </button>
                  </div>
                </div>

                {/* Return Items List */}
                {returnItems.length > 0 && (
                  <>
                    <div className="table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Qty</th>
                            <th>Resell Price</th>
                            <th>Margin Loss (-৳)</th>
                            <th>Condition</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {returnItems.map((item, idx) => (
                            <tr key={idx}>
                              <td><strong>{item.product_name}</strong></td>
                              <td>{item.quantity}</td>
                              <td>{formatCurrency(item.unit_wholesale_price)}</td>
                              <td style={{ color: '#ef4444', fontWeight: '700' }}>-{formatCurrency(item.margin_loss)}</td>
                              <td style={{ color: item.restock_condition.includes('good') ? 'var(--success)' : '#ef4444' }}>
                                {item.restock_condition.includes('good') ? 'Good (Restock In)' : 'Damaged'}
                              </td>
                              <td>
                                <button type="button" onClick={() => handleRemoveReturnItem(idx)} className="btn btn-danger btn-icon btn-sm">
                                  <X size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239, 68, 68, 0.08)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '600' }}>
                        Returned Reseller Margin Profit Reversal:
                      </span>
                      <strong style={{ fontSize: '16px', color: '#ef4444' }}>
                        -{formatCurrency(returnItems.reduce((sum, i) => sum + i.margin_loss, 0))}
                      </strong>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowReturnModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }}>Record Reseller Return</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SALE DETAILS STATEMENT MODAL --- */}
      {selectedSaleDetails && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Reseller Order Statement #{selectedSaleDetails.invoice_no}</h3>
              <button onClick={() => setSelectedSaleDetails(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', fontSize: '13px' }}>
                <div>Reseller: <strong style={{ color: '#ec4899' }}>{selectedSaleDetails.reseller_name}</strong></div>
                <div>Customer: <strong>{selectedSaleDetails.customer_name || '-'} ({selectedSaleDetails.customer_phone || '-'})</strong></div>
                <div>Date: <strong>{new Date(selectedSaleDetails.sale_date || selectedSaleDetails.created_at).toLocaleDateString()}</strong></div>
                <div>Net Reseller Profit: <strong style={{ color: 'var(--success)' }}>+{formatCurrency(Number(selectedSaleDetails.gross_profit || 0) + Number(selectedSaleDetails.delivery_profit || 0))}</strong></div>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product Description</th>
                    <th>Qty</th>
                    <th>Wholesale Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedSaleDetails.items || []).map((i, idx) => (
                    <tr key={idx}>
                      <td><strong>{i.product_name}</strong></td>
                      <td>{i.quantity}</td>
                      <td>{formatCurrency(i.unit_price)}</td>
                      <td style={{ fontWeight: '700', color: 'var(--success)' }}>{formatCurrency(i.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- PAY RESELLER PROFIT MODAL --- */}
      {showPayoutModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={20} color="#10b981" />
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Execute Reseller Profit Payout</h3>
              </div>
              <button onClick={() => setShowPayoutModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleProcessPayoutSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Select Reseller Profile / Name *</label>
                  <select
                    className="form-select"
                    required
                    value={payoutResellerName}
                    onChange={(e) => setPayoutResellerName(e.target.value)}
                  >
                    <option value="">Select Reseller...</option>
                    {Array.from(new Set([...profilesList.map(p => p.name), ...salesList.map(s => s.reseller_name)].filter(Boolean))).map((rName, idx) => (
                      <option key={idx} value={rName}>👤 {rName}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Payout Amount ({currency}) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      required
                      placeholder="e.g. 2500.00"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="form-select"
                      value={payoutMethod}
                      onChange={(e) => setPayoutMethod(e.target.value)}
                    >
                      <option value="bKash">bKash Personal / Merchant</option>
                      <option value="Nagad">Nagad Personal</option>
                      <option value="Rocket">Rocket Mobile Banking</option>
                      <option value="Bank Transfer">Bank Wire Transfer</option>
                      <option value="Cash">Cash Handover</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Paid From Store Account (Automated Passbook Ledger)</label>
                  <select
                    className="form-select"
                    value={payoutAccountId}
                    onChange={(e) => setPayoutAccountId(e.target.value)}
                  >
                    <option value="">No Account Balance Deduction (Manual Payout Log Only)</option>
                    {accountsList.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        🏦 {acc.name} ({currency}{Number(acc.balance || 0).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Payout Notes / Trx ID (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. bKash Trx ID: 9BX019A82 / Weekly Payout"
                    value={payoutNotes}
                    onChange={(e) => setPayoutNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowPayoutModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={isProcessingPayout} className="btn btn-success" style={{ background: '#10b981', borderColor: '#10b981' }}>
                  {isProcessingPayout ? 'Processing...' : 'Confirm & Process Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RESELLER PROFILE CREATE / EDIT MODAL --- */}
      {showProfileModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="#8b5cf6" />
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>
                  {editingProfile ? `Edit Reseller Profile: ${editingProfile.name}` : 'Create New Reseller Profile'}
                </h3>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveProfileSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Reseller Name / Brand *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. sellway / Tanvir Ahmed"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="01711000000"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="reseller@example.com"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">bKash Personal / Merchant No</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="01711000000"
                      value={profileForm.bkash_no}
                      onChange={(e) => setProfileForm({ ...profileForm, bkash_no: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nagad Personal No</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="01711000000"
                      value={profileForm.nagad_no}
                      onChange={(e) => setProfileForm({ ...profileForm, nagad_no: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Bank Account Details / Address</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    placeholder="Bank Name, Branch, Account No, Account Holder Name..."
                    value={profileForm.bank_info}
                    onChange={(e) => setProfileForm({ ...profileForm, bank_info: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Portal Status</label>
                  <select
                    className="form-select"
                    value={profileForm.status}
                    onChange={(e) => setProfileForm({ ...profileForm, status: e.target.value })}
                  >
                    <option value="active">Active (সক্রিয়)</option>
                    <option value="suspended">Suspended (স্থগিত)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowProfileModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={isSavingProfile} className="btn btn-primary" style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}>
                  {isSavingProfile ? 'Saving...' : (editingProfile ? 'Save Profile Changes' : 'Create Reseller Profile')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
