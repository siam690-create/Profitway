import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Truck, Plus, PackagePlus, CheckCircle, Eye, X, Building2, Phone, MapPin, DollarSign, Wallet, FileText, Trash2 } from 'lucide-react';
import { ProductSelectSearch } from '../components/ProductSelectSearch';
import { DateRangeFilter } from '../components/DateRangeFilter';

export const Purchases = () => {
  const { authFetch, products, currency, refreshAllData } = useApp();
  const [activeSubTab, setActiveSubTab] = useState('orders'); // 'orders' or 'suppliers'
  const [purchasesList, setPurchasesList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [accountsList, setAccountsList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedPurchaseDetails, setSelectedPurchaseDetails] = useState(null);

  // Date Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form State for Purchase Order
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('paid'); // 'paid', 'partial', 'due'
  const [paidAmount, setPaidAmount] = useState('0');
  const [accountId, setAccountId] = useState('');

  // Cart of Products to Purchase
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [buyQty, setBuyQty] = useState('1');
  const [unitBuyPrice, setUnitBuyPrice] = useState('');

  // Supplier Create Form State
  const [supForm, setSupForm] = useState({
    name: '',
    phone: '',
    email: '',
    company_name: '',
    address: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      const pRes = await authFetch('/api/purchases');
      const pData = await pRes.json();
      if (pRes.ok) setPurchasesList(pData);

      const sRes = await authFetch('/api/suppliers');
      const sData = await sRes.json();
      if (sRes.ok) setSuppliersList(sData);

      const fRes = await authFetch('/api/finance/summary');
      const fData = await fRes.json();
      if (fRes.ok) setAccountsList(fData.accounts || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(supForm)
      });
      const data = await res.json();
      if (res.ok) {
        setShowSupplierModal(false);
        setSupForm({ name: '', phone: '', email: '', company_name: '', address: '', notes: '' });
        fetchData();
        if (data.supplier_id) {
          setSupplierId(String(data.supplier_id));
          setSupplierName(data.name);
        }
        alert('Supplier added successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddItemToPurchase = () => {
    if (!selectedProductId || !buyQty || !unitBuyPrice) {
      return alert('Please select a product, quantity, and unit buy price.');
    }
    const prod = products.find(p => String(p.id) === String(selectedProductId));
    if (!prod) return;

    setPurchaseItems(prev => [
      ...prev.filter(item => item.product_id !== prod.id),
      {
        product_id: prod.id,
        product_name: prod.name,
        quantity: Number(buyQty),
        unit_buy_price: Number(unitBuyPrice),
        item_total: Number(buyQty) * Number(unitBuyPrice)
      }
    ]);

    setSelectedProductId('');
    setBuyQty('1');
    setUnitBuyPrice('');
  };

  const handleRemoveItem = (productId) => {
    setPurchaseItems(prev => prev.filter(item => item.product_id !== productId));
  };

  // Live calculation: Cart Items + Currently selected input row (before clicking + Add)
  const pendingItemTotal = (selectedProductId && buyQty && unitBuyPrice)
    ? (Number(buyQty || 0) * Number(unitBuyPrice || 0))
    : 0;

  const totalPurchaseCost = purchaseItems.reduce((sum, item) => sum + item.item_total, 0) + pendingItemTotal;

  const calculatePaidAndDue = () => {
    if (paymentStatus === 'paid') return { paid: totalPurchaseCost, due: 0 };
    if (paymentStatus === 'due') return { paid: 0, due: totalPurchaseCost };
    const paid = Number(paidAmount || 0);
    const due = Math.max(0, totalPurchaseCost - paid);
    return { paid, due };
  };

  const { paid: computedPaid, due: computedDue } = calculatePaidAndDue();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitPurchase = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    let finalItems = [...purchaseItems];
    if (finalItems.length === 0 && selectedProductId && unitBuyPrice) {
      const prod = products.find(p => String(p.id) === String(selectedProductId));
      if (prod) {
        finalItems.push({
          product_id: prod.id,
          product_name: prod.name,
          quantity: Number(buyQty || 1),
          unit_buy_price: Number(unitBuyPrice),
          item_total: Number(buyQty || 1) * Number(unitBuyPrice)
        });
      }
    }

    if (finalItems.length === 0) return alert('Please add at least one product to purchase order.');

    setIsSubmitting(true);
    try {
      const res = await authFetch('/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          supplier_id: supplierId || null,
          supplier_name: supplierName || 'General Supplier',
          notes,
          payment_status: paymentStatus,
          paid_amount: computedPaid,
          due_amount: computedDue,
          account_id: accountId || null,
          items: finalItems
        })
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setPurchaseItems([]);
        setSelectedProductId('');
        setSupplierId('');
        setSupplierName('');
        setNotes('');
        setPaidAmount('0');
        setPaymentStatus('paid');
        refreshAllData();
        fetchData();
        alert('Stock purchase order recorded! Inventory quantities, financial accounts, and supplier dues updated.');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = async (purchaseId) => {
    try {
      const res = await authFetch(`/api/purchases/${purchaseId}`);
      const data = await res.json();
      if (res.ok) setSelectedPurchaseDetails(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePurchase = async (purchase) => {
    if (!window.confirm(`Are you sure you want to delete Purchase Order #${purchase.purchase_no}? Product stock added during this purchase will be reverted back.`)) {
      return;
    }
    try {
      const res = await authFetch(`/api/purchases/${purchase.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Purchase order deleted successfully.');
        fetchData();
        refreshAllData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error deleting purchase order: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Truck size={24} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Purchases & Supplier Management</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Record product purchases, manage supplier contacts, track payment status (Cash/Due), and update inventory stock
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <DateRangeFilter
            onFilterChange={({ startDate: s, endDate: e }) => {
              setStartDate(s);
              setEndDate(e);
            }}
          />
          <button onClick={() => setShowSupplierModal(true)} className="btn btn-secondary">
            <Building2 size={16} />
            <span>+ Add Supplier</span>
          </button>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>+ Record Stock Purchase</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`btn ${activeSubTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
        >
          📦 Purchase Orders Log ({purchasesList.length})
        </button>
        <button
          onClick={() => setActiveSubTab('suppliers')}
          className={`btn ${activeSubTab === 'suppliers' ? 'btn-primary' : 'btn-secondary'}`}
        >
          🏢 Supplier Directory ({suppliersList.length})
        </button>
      </div>

      {/* 1. Purchase Orders Log Table */}
      {activeSubTab === 'orders' && (() => {
        const filteredPurchases = purchasesList.filter(p => {
          if (!startDate && !endDate) return true;
          const pDate = new Date(p.purchase_date || p.created_at).toISOString().slice(0, 10);
          if (startDate && pDate < startDate) return false;
          if (endDate && pDate > endDate) return false;
          return true;
        });

        const totalCost = filteredPurchases.reduce((sum, p) => sum + Number(p.total_amount || 0), 0);
        const totalPaid = filteredPurchases.reduce((sum, p) => sum + Number(p.paid_amount || p.total_amount || 0), 0);
        const totalDue = filteredPurchases.reduce((sum, p) => sum + Number(p.due_amount || 0), 0);

        return (
          <div className="glass-card" style={{ padding: '24px' }}>
            {/* Filtered Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px', background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px' }}>
              <div>Total Restock Purchase: <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text-primary)' }}>{currency}{totalCost.toFixed(2)}</strong></div>
              <div>Total Paid Amount: <strong style={{ display: 'block', fontSize: '15px', color: 'var(--success)' }}>{currency}{totalPaid.toFixed(2)}</strong></div>
              <div>Supplier Dena (Due): <strong style={{ display: 'block', fontSize: '15px', color: 'var(--danger)' }}>{currency}{totalDue.toFixed(2)}</strong></div>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Stock Restock Purchase Orders ({filteredPurchases.length})</h3>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Purchase #</th>
                    <th>Supplier Name</th>
                    <th>Total Cost</th>
                    <th>Paid Amount</th>
                    <th>Due Amount</th>
                    <th>Payment Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No purchase orders found for the selected date filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPurchases.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>{p.purchase_no}</td>
                        <td><strong>{p.supplier_name || 'General Supplier'}</strong></td>
                        <td style={{ fontWeight: '700' }}>{currency}{Number(p.total_amount).toFixed(2)}</td>
                        <td style={{ color: 'var(--success)' }}>{currency}{Number(p.paid_amount || p.total_amount).toFixed(2)}</td>
                        <td style={{ color: Number(p.due_amount) > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: '700' }}>
                          {currency}{Number(p.due_amount || 0).toFixed(2)}
                        </td>
                        <td>
                          <span className={`badge ${p.payment_status === 'due' ? 'badge-danger' : (p.payment_status === 'partial' ? 'badge-warning' : 'badge-success')}`}>
                            {(p.payment_status || 'paid').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(p.purchase_date).toLocaleString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button onClick={() => handleViewDetails(p.id)} className="btn btn-secondary btn-sm" title="View Details">
                              <Eye size={14} />
                              <span>Details</span>
                            </button>
                            <button onClick={() => handleDeletePurchase(p)} className="btn btn-danger btn-sm btn-icon" title="Delete Purchase Order">
                              <Trash2 size={14} color="#fff" />
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
        );
      })()}

      {/* 2. Supplier Directory Table */}
      {activeSubTab === 'suppliers' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Registered Suppliers Directory</h3>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Supplier / Company Name</th>
                  <th>Phone Number</th>
                  <th>Address</th>
                  <th>Purchases Count</th>
                  <th>Outstanding Dues</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {suppliersList.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No suppliers created yet.
                    </td>
                  </tr>
                ) : (
                  suppliersList.map(s => (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.name}</strong>
                        {s.company_name && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.company_name}</div>}
                      </td>
                      <td style={{ fontWeight: '600' }}>{s.phone || 'N/A'}</td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{s.address || 'N/A'}</td>
                      <td style={{ fontWeight: '700' }}>{s.purchase_count || 0} Orders</td>
                      <td style={{ fontWeight: '800', color: Number(s.total_due) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {currency}{Number(s.total_due).toFixed(2)}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add New Supplier Modal */}
      {showSupplierModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={20} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Create Supplier Profile</h3>
              </div>
              <button onClick={() => setShowSupplierModal(false)} className="btn btn-secondary btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Supplier Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. StarTech Wholesale Ltd"
                    value={supForm.name}
                    onChange={(e) => setSupForm({ ...supForm, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="01711000000"
                      value={supForm.phone}
                      onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Company / Firm Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="StarTech BD Ltd"
                      value={supForm.company_name}
                      onChange={(e) => setSupForm({ ...supForm, company_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="IDB Bhaban, Agargaon, Dhaka"
                    value={supForm.address}
                    onChange={(e) => setSupForm({ ...supForm, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes / Remarks</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Payment terms, contact person..."
                    value={supForm.notes}
                    onChange={(e) => setSupForm({ ...supForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowSupplierModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Stock Purchase Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '780px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={20} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Record Stock Purchase (Supplier Buy)</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitPurchase}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Select Supplier</label>
                    <select
                      className="form-select"
                      value={supplierId}
                      onChange={(e) => {
                        setSupplierId(e.target.value);
                        const sup = suppliersList.find(s => String(s.id) === e.target.value);
                        if (sup) setSupplierName(sup.name);
                      }}
                    >
                      <option value="">Select Supplier (or enter name below)...</option>
                      {suppliersList.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.company_name || 'Individual'})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Purchase Notes</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Batch/Challan #..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                {!supplierId && (
                  <div className="form-group">
                    <label className="form-label">Supplier Name (Manual)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Supplier Name..."
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                    />
                  </div>
                )}

                {/* Add Product Line Section (Cleaned: Removed New Sell Price Field) */}
                <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <PackagePlus size={16} color="var(--accent-primary)" />
                    <span>Select Product to Buy</span>
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.5fr auto', gap: '10px', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Product</label>
                      <ProductSelectSearch
                        products={products}
                        selectedId={selectedProductId}
                        onSelect={(id) => {
                          setSelectedProductId(id);
                          const p = products.find(prod => String(prod.id) === String(id));
                          if (p) {
                            setUnitBuyPrice(p.cost_price || '');
                          }
                        }}
                        placeholder="Type product name or SKU..."
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Buy Qty</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="1"
                        value={buyQty}
                        onChange={(e) => setBuyQty(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Unit Buy Price ({currency})</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        placeholder="0.00"
                        value={unitBuyPrice}
                        onChange={(e) => setUnitBuyPrice(e.target.value)}
                      />
                    </div>

                    <button type="button" onClick={handleAddItemToPurchase} className="btn btn-primary" style={{ padding: '10px 14px' }}>
                      + Add
                    </button>
                  </div>
                </div>

                {/* Selected Purchase Cart Table */}
                {purchaseItems.length > 0 && (
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th>Qty</th>
                          <th>Unit Cost</th>
                          <th>Total Cost</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseItems.map((item, idx) => (
                          <tr key={idx}>
                            <td><strong>{item.product_name}</strong></td>
                            <td>{item.quantity}</td>
                            <td>{currency}{item.unit_buy_price.toFixed(2)}</td>
                            <td style={{ fontWeight: '700' }}>{currency}{item.item_total.toFixed(2)}</td>
                            <td>
                              <button type="button" onClick={() => handleRemoveItem(item.product_id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Total Purchase Cost Summary Box (Live Calculation!) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'var(--bg-secondary)', borderRadius: '10px', fontWeight: '800', fontSize: '16px', border: '1px solid var(--border-color)' }}>
                  <span>Total Purchase Cost:</span>
                  <span style={{ color: 'var(--danger)', fontSize: '20px' }}>{currency}{totalPurchaseCost.toFixed(2)}</span>
                </div>

                {/* Payment & Dena Management Panel */}
                <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Payment & Dena Configuration (ক্যাশ ও বাকির হিসাব)
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Payment Status</label>
                      <select
                        className="form-select"
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                      >
                        <option value="paid">Full Paid (নগদ পরিশোধ)</option>
                        <option value="partial">Partial Paid (আংশিক নগদ + বাকি)</option>
                        <option value="due">Full Due / Credit (সম্পূর্ণ বাকি/দেনা)</option>
                      </select>
                    </div>

                    {paymentStatus === 'partial' && (
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Paid Amount ({currency})</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Paid From Account</label>
                      <select
                        className="form-select"
                        disabled={paymentStatus === 'due'}
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                      >
                        <option value="">Select Account...</option>
                        {accountsList.map(a => (
                          <option key={a.id} value={a.id}>{a.name} ({currency}{a.balance})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Dynamic Summary Breakdown Box */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: '8px', fontSize: '13px' }}>
                    <div>
                      <span>Cash Paid Amount:</span>
                      <strong style={{ color: 'var(--success)', display: 'block', fontSize: '15px', marginTop: '2px' }}>
                        +{currency}{computedPaid.toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      <span>Remaining Dena (Auto Dena Record):</span>
                      <strong style={{ color: computedDue > 0 ? 'var(--danger)' : 'var(--text-muted)', display: 'block', fontSize: '15px', marginTop: '2px' }}>
                        {computedDue > 0 ? `-${currency}${computedDue.toFixed(2)}` : '৳0.00'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={totalPurchaseCost <= 0 || isSubmitting}>
                  {isSubmitting ? 'Recording Purchase...' : 'Confirm Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Details Modal */}
      {selectedPurchaseDetails && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <h3>Purchase Order #{selectedPurchaseDetails.purchase_no}</h3>
              <button onClick={() => setSelectedPurchaseDetails(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', fontSize: '13px' }}>
                <div>Supplier: <strong>{selectedPurchaseDetails.supplier_name}</strong></div>
                <div>Total Cost: <strong style={{ color: 'var(--danger)' }}>{currency}{Number(selectedPurchaseDetails.total_amount).toFixed(2)}</strong></div>
                <div>Paid: <strong style={{ color: 'var(--success)' }}>{currency}{Number(selectedPurchaseDetails.paid_amount || selectedPurchaseDetails.total_amount).toFixed(2)}</strong></div>
                <div>Due Dena: <strong style={{ color: 'var(--danger)' }}>{currency}{Number(selectedPurchaseDetails.due_amount || 0).toFixed(2)}</strong></div>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Qty</th>
                    <th>Unit Cost</th>
                    <th>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPurchaseDetails.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td><strong>{item.product_name}</strong></td>
                      <td>{item.quantity}</td>
                      <td>{currency}{Number(item.unit_buy_price).toFixed(2)}</td>
                      <td style={{ fontWeight: '700' }}>{currency}{Number(item.item_total_cost || item.total_cost || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
