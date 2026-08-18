import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Search, ShoppingBag, Calendar, Eye, Printer, Filter, CreditCard, DollarSign, Globe, Trash2, Edit2, X, Plus, Minus, Truck, Check, Package, Award } from 'lucide-react';
import { ReceiptModal } from '../components/ReceiptModal';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { ProductSelectSearch } from '../components/ProductSelectSearch';

export const Orders = () => {
  const { authFetch, currency, sales, fetchSales, deleteSale, user, products } = useApp();
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);

  // Full Order Edit Modal State
  const [editingSale, setEditingSale] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('Cash');
  const [editNotes, setEditNotes] = useState('');
  const [editDeliveryFee, setEditDeliveryFee] = useState('0');
  const [editCourierFee, setEditCourierFee] = useState('0');
  const [editItems, setEditItems] = useState([]);
  const [selectedAddProductId, setSelectedAddProductId] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const isOwner = user?.role === 'owner' || user?.role === 'superadmin';

  useEffect(() => {
    fetchSales();
  }, []);

  const handleViewReceipt = async (saleId) => {
    try {
      const res = await authFetch(`/api/sales/${saleId}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedSale(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditModal = async (saleId) => {
    try {
      const res = await authFetch(`/api/sales/${saleId}`);
      const data = await res.json();
      if (res.ok) {
        setEditingSale(data);
        setEditCustomerName(data.customer_name || 'Walk-in Customer');
        setEditPaymentMethod(data.payment_method || 'Cash');
        setEditNotes(data.notes || '');
        setEditDeliveryFee(String(data.delivery_fee_charged || 0));
        setEditCourierFee(String(data.courier_actual_cost || 0));
        
        // Format sale date for datetime-local input
        if (data.sale_date) {
          const d = new Date(data.sale_date);
          if (!isNaN(d.getTime())) {
            const pad = (n) => String(n).padStart(2, '0');
            const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            setEditDate(formatted);
          } else {
            setEditDate('');
          }
        } else {
          setEditDate('');
        }

        setEditItems(data.items ? data.items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: Number(item.quantity || 1),
          unit_price: Number(item.unit_price || 0),
          unit_cost: Number(item.unit_cost || 0)
        })) : []);

        setSelectedAddProductId('');
      } else {
        alert('Failed to load sale details for editing.');
      }
    } catch (err) {
      console.error(err);
      alert(`Error loading sale: ${err.message}`);
    }
  };

  const handleAddItemToEdit = (productId) => {
    if (!productId) return;
    const found = products.find(p => String(p.id) === String(productId));
    if (!found) return;

    const existingIdx = editItems.findIndex(i => String(i.product_id) === String(productId));
    if (existingIdx >= 0) {
      const updated = [...editItems];
      updated[existingIdx].quantity += 1;
      setEditItems(updated);
    } else {
      setEditItems([
        ...editItems,
        {
          product_id: found.id,
          product_name: found.name,
          quantity: 1,
          unit_price: Number(found.selling_price || 0),
          unit_cost: Number(found.cost_price || 0)
        }
      ]);
    }
    setSelectedAddProductId('');
  };

  const handleUpdateEditItemQty = (index, newQty) => {
    const qty = Math.max(1, Number(newQty || 1));
    const updated = [...editItems];
    updated[index].quantity = qty;
    setEditItems(updated);
  };

  const handleUpdateEditItemPrice = (index, newPrice) => {
    const price = Math.max(0, Number(newPrice || 0));
    const updated = [...editItems];
    updated[index].unit_price = price;
    setEditItems(updated);
  };

  const handleRemoveEditItem = (index) => {
    const updated = editItems.filter((_, idx) => idx !== index);
    setEditItems(updated);
  };

  const handleSaveOrderEdit = async (e) => {
    e.preventDefault();
    if (!editingSale || isSubmittingEdit) return;
    if (editItems.length === 0) {
      alert('Order must contain at least one product.');
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const payload = {
        customer_name: editCustomerName,
        payment_method: editPaymentMethod,
        notes: editNotes,
        customer_delivery_fee: Number(editDeliveryFee || 0),
        courier_fee: Number(editCourierFee || 0),
        sale_date: editDate || undefined,
        items: editItems.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price
        }))
      };

      const res = await authFetch(`/api/sales/${editingSale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        alert('Order updated successfully! Inventory stock has been adjusted.');
        setEditingSale(null);
        fetchSales();
      } else {
        alert(`Update failed: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert(`Update error: ${err.message}`);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteSale = async (sale) => {
    if (window.confirm(`Are you sure you want to delete Invoice #${sale.invoice_no}? Product quantities will be restored back to inventory stock.`)) {
      const res = await deleteSale(sale.id);
      if (res.success) {
        alert('Order deleted and product stock restored to inventory successfully!');
      } else {
        alert(`Delete failed: ${res.error}`);
      }
    }
  };

  // Filter Sales locally
  const filteredSales = sales.filter(s => {
    const matchesSearch = (s.invoice_no && s.invoice_no.toLowerCase().includes(search.toLowerCase())) || 
                          (s.customer_name && s.customer_name.toLowerCase().includes(search.toLowerCase()));
    const matchesPayment = paymentMethod ? s.payment_method === paymentMethod : true;
    
    let matchesDate = true;
    if (startDate && endDate) {
      const saleDate = new Date(s.sale_date).toISOString().slice(0, 10);
      matchesDate = saleDate >= startDate && saleDate <= endDate;
    }

    return matchesSearch && matchesPayment && matchesDate;
  });

  const totalFilteredAmount = filteredSales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  const totalFilteredProfit = filteredSales.reduce((sum, s) => sum + Number(s.gross_profit || 0), 0);
  const totalFilteredPcs = filteredSales.reduce((sum, s) => sum + Number(s.total_items_qty || 0), 0);

  // Edit Modal Live Calculations
  const editSubtotal = editItems.reduce((sum, i) => sum + (Number(i.unit_price || 0) * Number(i.quantity || 1)), 0);
  const editTotalCost = editItems.reduce((sum, i) => sum + (Number(i.unit_cost || 0) * Number(i.quantity || 1)), 0);
  const editProdProfit = editSubtotal - editTotalCost;
  const editDelivProfit = Number(editDeliveryFee || 0) - Number(editCourierFee || 0);
  const editGrandTotal = editSubtotal + Number(editDeliveryFee || 0);
  const editTotalProfit = editProdProfit + editDelivProfit;
  const editTotalPcs = editItems.reduce((sum, i) => sum + Number(i.quantity || 1), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Overview & Filter Bar */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Filtered Sales Summary ({filteredSales.length} Orders / Parcels)</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px', marginTop: '6px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)' }}>
              {currency}{totalFilteredAmount.toLocaleString()}
            </h2>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#38bdf8' }}>
              📦 {filteredSales.length} Orders ({totalFilteredPcs} Product Pcs)
            </span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--success)' }}>
              Gross Profit: +{currency}{totalFilteredProfit.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Invoice # or Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <select
            className="form-select"
            style={{ width: '150px' }}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="">All Payments</option>
            <option value="Cash">Cash</option>
            <option value="bKash">bKash</option>
            <option value="Nagad">Nagad</option>
            <option value="Card">Card</option>
          </select>

          <DateRangeFilter
            onFilterChange={({ startDate: s, endDate: e }) => {
              setStartDate(s);
              setEndDate(e);
            }}
          />
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Date & Time</th>
                <th>Customer Name</th>
                <th>Items / Pcs (কোয়ান্টিটি)</th>
                <th>Payment Method</th>
                <th>Total Sale Amount</th>
                <th>Gross Profit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No completed sales orders found.
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => (
                  <tr key={sale.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '14px', color: 'var(--accent-primary)' }}>{sale.invoice_no}</strong>
                        {sale.source_website && (
                          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '800' }}>
                            <Globe size={11} />
                            <span>{sale.source_website}</span>
                          </span>
                        )}
                      </div>
                      {sale.external_order_id && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                          Ext ID: #{sale.external_order_id}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {sale.sale_date ? new Date(sale.sale_date).toLocaleString() : 'N/A'}
                    </td>
                    <td style={{ fontSize: '14px', fontWeight: '500' }}>{sale.customer_name || 'Walk-in Customer'}</td>
                    <td>
                      <span className="badge badge-info" style={{ fontWeight: '700' }}>
                        📦 1 Parcel ({sale.total_items_qty || 1} Pcs)
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-secondary">{sale.payment_method}</span>
                    </td>
                    <td style={{ fontSize: '14px', fontWeight: '800' }}>
                      {currency}{Number(sale.total_amount || 0).toFixed(2)}
                    </td>
                    <td>
                      <span className="badge badge-success">
                        +{currency}{Number(sale.gross_profit || 0).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button onClick={() => handleViewReceipt(sale.id)} className="btn btn-secondary btn-sm" title="View & Print Receipt">
                          <Eye size={14} />
                          <span>Invoice</span>
                        </button>

                        {isOwner && (
                          <>
                            <button onClick={() => handleOpenEditModal(sale.id)} className="btn btn-secondary btn-sm" title="Edit Order Date, Courier & Items">
                              <Edit2 size={14} color="var(--accent-primary)" />
                              <span>Edit Order</span>
                            </button>

                            <button onClick={() => handleDeleteSale(sale)} className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)' }} title="Delete Order & Restore Stock">
                              <Trash2 size={14} color="var(--danger)" />
                              <span>Delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {selectedSale && (
        <ReceiptModal sale={selectedSale} onClose={() => setSelectedSale(null)} />
      )}

      {/* Comprehensive Order Edit Modal */}
      {editingSale && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Edit2 size={20} color="var(--accent-primary)" />
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Edit Sales Order #{editingSale.invoice_no}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Update Order Date, Courier Bills, Customer Info & Product Quantities</span>
                </div>
              </div>
              <button onClick={() => setEditingSale(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveOrderEdit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Section 1: Date & Time, Customer, Payment */}
                <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>📅 Order Date & Time (তারিখ ও সময়)</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: '700' }}>Customer Name (গ্রাহকের নাম)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editCustomerName}
                      onChange={(e) => setEditCustomerName(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: '700' }}>Payment Method</label>
                    <select
                      className="form-select"
                      value={editPaymentMethod}
                      onChange={(e) => setEditPaymentMethod(e.target.value)}
                    >
                      <option value="Cash">Cash</option>
                      <option value="bKash">bKash Mobile Banking</option>
                      <option value="Nagad">Nagad Mobile Banking</option>
                      <option value="Card">Credit / Debit Card</option>
                    </select>
                  </div>
                </div>

                {/* Section 2: Courier Charges Config */}
                <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: 'var(--accent-primary)' }}>
                    <Truck size={16} />
                    <span>Courier & Delivery Charge Config (কুরিয়ার বিল ও ডেলিভারি চার্জ)</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Customer Delivery Charge ({currency})</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        value={editDeliveryFee}
                        onChange={(e) => setEditDeliveryFee(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Courier Actual Bill ({currency})</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        value={editCourierFee}
                        onChange={(e) => setEditCourierFee(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', color: editDelivProfit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: '700', paddingTop: '4px', borderTop: '1px dashed var(--border-color)' }}>
                    <span>Calculated Net Delivery Profit:</span>
                    <span>{editDelivProfit >= 0 ? '+' : ''}{currency}{editDelivProfit.toFixed(2)}</span>
                  </div>
                </div>

                {/* Section 3: Product Items & Quantities */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700' }}>Order Products & Quantities ({editItems.length} Items, {editTotalPcs} Pcs)</h4>
                  </div>

                  {/* Add New Product to Order Picker */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Add Product to Order (নতুন প্রোডাক্ট যোগ করুন)</label>
                    <ProductSelectSearch
                      products={products}
                      selectedId={selectedAddProductId}
                      onSelect={(id) => {
                        setSelectedAddProductId(id);
                        if (id) handleAddItemToEdit(id);
                      }}
                      placeholder="Search inventory product by name or SKU to add..."
                    />
                  </div>

                  {/* Items List Table */}
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                    <table className="data-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th style={{ width: '110px' }}>Unit Price</th>
                          <th style={{ width: '130px', textAlign: 'center' }}>Quantity (Pcs)</th>
                          <th style={{ textAlign: 'right' }}>Total</th>
                          <th style={{ width: '40px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {editItems.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                              No products in this order. Search above to add products.
                            </td>
                          </tr>
                        ) : (
                          editItems.map((item, idx) => (
                            <tr key={idx}>
                              <td>
                                <strong style={{ fontSize: '13px', display: 'block' }}>{item.product_name}</strong>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="form-input"
                                  style={{ padding: '4px 6px', fontSize: '12px', fontWeight: '700' }}
                                  value={item.unit_price}
                                  onChange={(e) => handleUpdateEditItemPrice(idx, e.target.value)}
                                />
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--bg-secondary)', borderRadius: '6px', padding: '2px 6px', border: '1px solid var(--border-color)' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateEditItemQty(idx, item.quantity - 1)}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: '800', padding: '2px 6px' }}
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    className="form-input"
                                    style={{ width: '45px', textAlign: 'center', padding: '2px', fontSize: '12px', fontWeight: '800' }}
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateEditItemQty(idx, e.target.value)}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateEditItemQty(idx, item.quantity + 1)}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: '800', padding: '2px 6px' }}
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--success)' }}>
                                {currency}{(item.unit_price * item.quantity).toFixed(2)}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEditItem(idx)}
                                  style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer' }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Live Order Summary Box */}
                <div style={{ background: 'var(--bg-primary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Product Subtotal:</span>
                    <strong style={{ fontSize: '15px' }}>{currency}{editSubtotal.toFixed(2)}</strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Customer Delivery Fee:</span>
                    <strong style={{ fontSize: '15px', color: 'var(--accent-primary)' }}>+{currency}{Number(editDeliveryFee || 0).toFixed(2)}</strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Grand Total Invoice:</span>
                    <strong style={{ fontSize: '17px', color: 'var(--text-primary)' }}>{currency}{editGrandTotal.toFixed(2)}</strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Estimated Total Profit:</span>
                    <strong style={{ fontSize: '16px', color: editTotalProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {editTotalProfit >= 0 ? '+' : ''}{currency}{editTotalProfit.toFixed(2)}
                    </strong>
                  </div>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setEditingSale(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingEdit}>
                  {isSubmittingEdit ? 'Saving Order...' : 'Save Order Changes 💾'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
