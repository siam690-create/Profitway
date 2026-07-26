import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Undo2, Plus, PackagePlus, Truck, AlertOctagon, X, CheckCircle, Eye, Printer, FileText, Edit2, ShieldAlert, Calendar } from 'lucide-react';

export const Returns = () => {
  const { authFetch, products, currency, refreshAllData, user } = useApp();
  const [returnsList, setReturnsList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedReturnDetails, setSelectedReturnDetails] = useState(null);

  // Edit Mode State inside Popup Modal
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    invoice_no: '',
    courier_name: '',
    courier_charge: '',
    return_delivery_loss: '',
    reason: '',
    notes: '',
    return_date: new Date().toISOString().slice(0, 10)
  });

  // Form State for new Return Process
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 10));
  const [invoiceNo, setInvoiceNo] = useState('');
  const [courierName, setCourierName] = useState('Paperfly');
  const [courierCharge, setCourierCharge] = useState('60');
  const [returnDeliveryLoss, setReturnDeliveryLoss] = useState('120'); // Return Delivery Profit Reversal input!
  const [reason, setReason] = useState('Customer Refused / Undelivered');
  const [notes, setNotes] = useState('');

  // Cart of Returned Products
  const [returnItems, setReturnItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [returnQty, setReturnQty] = useState('1');
  const [condition, setCondition] = useState('good_restockable');

  const fetchReturns = async () => {
    try {
      const res = await authFetch('/api/returns');
      const data = await res.json();
      if (res.ok) setReturnsList(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleViewReturnDetails = async (returnId) => {
    try {
      setIsEditing(false);
      const res = await authFetch(`/api/returns/${returnId}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedReturnDetails(data);
        setEditForm({
          invoice_no: data.invoice_no || '',
          courier_name: data.courier_name || 'Paperfly',
          courier_charge: data.courier_charge || '0',
          return_delivery_loss: data.return_delivery_loss || '0',
          reason: data.reason || '',
          notes: data.notes || '',
          return_date: data.return_date ? new Date(data.return_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEditedReturn = async (e) => {
    e.preventDefault();
    if (!selectedReturnDetails) return;

    try {
      const res = await authFetch(`/api/returns/${selectedReturnDetails.id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });
      const data = await res.json();

      if (res.ok) {
        setIsEditing(false);
        refreshAllData();
        fetchReturns();
        handleViewReturnDetails(selectedReturnDetails.id);
        alert('Return information updated successfully by shop owner.');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddItemToReturn = () => {
    if (!selectedProductId || !returnQty) return alert('Select product and returned quantity');
    const prod = products.find(p => String(p.id) === String(selectedProductId));
    if (!prod) return;

    setReturnItems(prev => [
      ...prev.filter(item => item.product_id !== prod.id),
      {
        product_id: prod.id,
        product_name: prod.name,
        sku: prod.sku,
        quantity: Number(returnQty),
        restock_condition: condition
      }
    ]);

    setSelectedProductId('');
    setReturnQty('1');
    setCondition('good_restockable');
  };

  const handleRemoveItem = (productId) => {
    setReturnItems(prev => prev.filter(item => item.product_id !== productId));
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();

    let finalItems = [...returnItems];
    if (finalItems.length === 0 && selectedProductId) {
      const prod = products.find(p => String(p.id) === String(selectedProductId));
      if (prod) {
        finalItems.push({
          product_id: prod.id,
          product_name: prod.name,
          sku: prod.sku,
          quantity: Number(returnQty || 1),
          restock_condition: condition
        });
      }
    }

    if (finalItems.length === 0) return alert('Please select a returned product to restock.');

    try {
      const res = await authFetch('/api/returns', {
        method: 'POST',
        body: JSON.stringify({
          return_date: returnDate, // Custom Return Date Selected by User!
          invoice_no: invoiceNo,
          courier_name: courierName,
          courier_charge: Number(courierCharge || 0),
          return_delivery_loss: Number(returnDeliveryLoss || 0),
          reason,
          notes,
          items: finalItems
        })
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setReturnItems([]);
        setSelectedProductId('');
        setInvoiceNo('');
        setNotes('');
        refreshAllData();
        fetchReturns();
        alert(`Courier return processed for date: ${returnDate}! Items restocked, courier fee & delivery profit reversal logged.`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const isOwner = user?.role === 'owner' || user?.role === 'superadmin';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Undo2 size={24} color="var(--warning)" />
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Courier Return & Restock Manager</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Process courier returned products by specific date to automatically restock inventory, log courier fees & delivery profit reversals
          </p>
        </div>

        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>+ Process Courier Return</span>
        </button>
      </div>

      {/* Returns History Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Courier Return Logs</h3>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Return Date</th>
                <th>Return # & Invoice</th>
                <th>Courier Partner</th>
                <th>Items Count</th>
                <th>Courier Fee</th>
                <th>Delivery Loss</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {returnsList.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No courier returns recorded yet. Click "+ Process Courier Return" to add one.
                  </td>
                </tr>
              ) : (
                returnsList.map(ret => (
                  <tr key={ret.id}>
                    <td style={{ fontSize: '13px', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="var(--accent-primary)" />
                        <span>{new Date(ret.return_date || ret.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{ret.return_no}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {ret.invoice_no ? `Invoice: #${ret.invoice_no}` : 'No Invoice Tag'}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Truck size={12} />
                        <span>{ret.courier_name}</span>
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', fontWeight: '700' }}>{ret.item_count} Items</span>
                    </td>
                    <td style={{ color: 'var(--danger)', fontWeight: '600' }}>
                      {currency}{Number(ret.courier_charge).toFixed(2)}
                    </td>
                    <td style={{ color: 'var(--danger)', fontWeight: '700' }}>
                      {currency}{Number(ret.return_delivery_loss || 0).toFixed(2)}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {ret.reason}
                    </td>
                    <td>
                      <button onClick={() => handleViewReturnDetails(ret.id)} className="btn btn-secondary btn-icon btn-sm" title="View Full Details">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Return Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Record Courier Return Entry</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: '12px' }}>
                  {/* Custom Return Date Input Field */}
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: '700', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} />
                      <span>Return Date (রিটার্ন তারিখ)</span>
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Invoice # (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="INV-20260726-..."
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Courier Service</label>
                    <select
                      className="form-select"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                    >
                      <option value="Paperfly">Paperfly</option>
                      <option value="Steadfast Courier">Steadfast Courier</option>
                      <option value="Pathao Courier">Pathao Courier</option>
                      <option value="RedX Logistics">RedX Logistics</option>
                      <option value="eCourier">eCourier</option>
                      <option value="Sundarban Courier">Sundarban Courier</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Courier Return Charge ({currency})</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="60.00"
                      value={courierCharge}
                      onChange={(e) => setCourierCharge(e.target.value)}
                    />
                  </div>

                  {/* Return Delivery Profit Reversal Input Field */}
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--danger)' }}>Return Delivery Profit Reversal ({currency})</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="120.00"
                      value={returnDeliveryLoss}
                      onChange={(e) => setReturnDeliveryLoss(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Return Reason</label>
                  <select
                    className="form-select"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  >
                    <option value="Customer Refused / Undelivered">Customer Refused / Undelivered</option>
                    <option value="Customer Cancelled Order">Customer Cancelled Order</option>
                    <option value="Wrong Product Sent">Wrong Product Sent</option>
                    <option value="Damaged in Transit">Damaged in Transit</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Return Notes / Comments (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Add details about returned items..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* Add Product Return Item */}
                <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <PackagePlus size={16} color="var(--success)" />
                    <span>Select Returned Product to Restock</span>
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr', gap: '10px', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Product</label>
                      <select
                        className="form-select"
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                      >
                        <option value="">Select Product...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Returned Qty</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="1"
                        value={returnQty}
                        onChange={(e) => setReturnQty(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Condition</label>
                      <select
                        className="form-select"
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                      >
                        <option value="good_restockable">Good (Restock to Inventory)</option>
                        <option value="damaged_scrap">Damaged (Do NOT Restock)</option>
                      </select>
                    </div>

                    <button type="button" onClick={handleAddItemToReturn} className="btn btn-primary" style={{ padding: '10px' }}>
                      + Add Item
                    </button>
                  </div>
                </div>

                {/* Items List */}
                {returnItems.length > 0 && (
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th>Returned Qty</th>
                          <th>Condition Action</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returnItems.map((item, idx) => (
                          <tr key={idx}>
                            <td><strong>{item.product_name}</strong></td>
                            <td>{item.quantity}</td>
                            <td>
                              <span className={`badge ${item.restock_condition === 'good_restockable' ? 'badge-success' : 'badge-danger'}`}>
                                {item.restock_condition === 'good_restockable' ? '🟢 Will Restock +Qty' : '🔴 Damaged Scrap'}
                              </span>
                            </td>
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
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-warning">
                  Process Return & Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Details & Owner Edit Modal */}
      {selectedReturnDetails && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>
                  Courier Return Details — {selectedReturnDetails.return_no}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Processed Date: {new Date(selectedReturnDetails.return_date || selectedReturnDetails.created_at).toLocaleDateString()}
                </span>
              </div>
              <button onClick={() => setSelectedReturnDetails(null)} className="btn btn-secondary btn-icon">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Owner Edit Bar */}
              {isOwner && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <ShieldAlert size={16} color="var(--accent-primary)" />
                    <strong>Shop Owner Administrative Editing</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Edit2 size={14} />
                    <span>{isEditing ? 'Cancel Edit' : 'Edit Return Record'}</span>
                  </button>
                </div>
              )}

              {isEditing ? (
                <form onSubmit={handleSaveEditedReturn} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label">Return Date</label>
                      <input
                        type="date"
                        className="form-input"
                        required
                        value={editForm.return_date}
                        onChange={(e) => setEditForm({ ...editForm, return_date: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Invoice #</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.invoice_no}
                        onChange={(e) => setEditForm({ ...editForm, invoice_no: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label">Courier Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.courier_name}
                        onChange={(e) => setEditForm({ ...editForm, courier_name: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Courier Charge ({currency})</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        value={editForm.courier_charge}
                        onChange={(e) => setEditForm({ ...editForm, courier_charge: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--danger)' }}>Return Delivery Profit Reversal ({currency})</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={editForm.return_delivery_loss}
                      onChange={(e) => setEditForm({ ...editForm, return_delivery_loss: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Reason</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.reason}
                      onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </form>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px' }}>
                    <div>Return Date: <strong style={{ display: 'block' }}>{new Date(selectedReturnDetails.return_date || selectedReturnDetails.created_at).toLocaleDateString()}</strong></div>
                    <div>Courier Partner: <strong style={{ display: 'block' }}>{selectedReturnDetails.courier_name}</strong></div>
                    <div>Courier Return Fee: <strong style={{ display: 'block', color: 'var(--danger)' }}>{currency}{Number(selectedReturnDetails.courier_charge).toFixed(2)}</strong></div>
                    <div>Delivery Profit Reversal: <strong style={{ display: 'block', color: 'var(--danger)' }}>{currency}{Number(selectedReturnDetails.return_delivery_loss || 0).toFixed(2)}</strong></div>
                    <div>Reason: <strong style={{ display: 'block' }}>{selectedReturnDetails.reason}</strong></div>
                    <div>Notes: <strong style={{ display: 'block' }}>{selectedReturnDetails.notes || 'N/A'}</strong></div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Restocked Products List</h4>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th>Returned Qty</th>
                          <th>Condition Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReturnDetails.items?.map((item, idx) => (
                          <tr key={idx}>
                            <td><strong>{item.product_name}</strong></td>
                            <td>{item.quantity}</td>
                            <td>
                              <span className={`badge ${item.restock_condition === 'good_restockable' ? 'badge-success' : 'badge-danger'}`}>
                                {item.restock_condition === 'good_restockable' ? '🟢 Restocked to Inventory' : '🔴 Damaged Scrap'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
