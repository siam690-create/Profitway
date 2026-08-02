import React, { useState } from 'react';
import { X, Printer, CheckCircle, Edit2, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ReceiptModal = ({ sale: rawSale, onClose }) => {
  const { currency, formatCurrency, shopSettings, user, authFetch, fetchSales } = useApp();
  
  const sale = rawSale?.sale ? rawSale.sale : rawSale;

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    customer_name: sale?.customer_name || 'Walk-in Customer',
    payment_method: sale?.payment_method || 'Cash',
    notes: sale?.notes || ''
  });

  if (!sale) return null;

  const isOwner = user?.role === 'owner' || user?.role === 'superadmin';

  const compName = shopSettings?.company_name || 'Profitway POS';
  const compTag = shopSettings?.tagline || 'Retail & Wholesale Management';
  const compAddr = shopSettings?.address || '';
  const compPhone = shopSettings?.phone || '';
  const vatNo = shopSettings?.vat_reg_no || '';
  const footerTerms = shopSettings?.footer_terms || 'Goods once sold are returnable within 7 days with valid invoice.';
  const footerThank = shopSettings?.footer_thank_you || 'Thank you for your business!';
  const showShopName = shopSettings?.show_shop_name !== undefined ? Boolean(shopSettings.show_shop_name) : true;
  const showAddr = shopSettings?.show_address !== undefined ? Boolean(shopSettings.show_address) : true;
  const showPhoneEmail = shopSettings?.show_phone_email !== undefined ? Boolean(shopSettings.show_phone_email) : true;
  const showVat = shopSettings?.show_vat_no !== undefined ? Boolean(shopSettings.show_vat_no) : true;
  const showInvNo = shopSettings?.show_invoice_no !== undefined ? Boolean(shopSettings.show_invoice_no) : true;
  const showInvDate = shopSettings?.show_invoice_date !== undefined ? Boolean(shopSettings.show_invoice_date) : true;
  const showCustomer = shopSettings?.show_customer_info !== undefined ? Boolean(shopSettings.show_customer_info) : true;
  const showStaff = shopSettings?.show_staff_name !== undefined ? Boolean(shopSettings.show_staff_name) : true;

  const handlePrint = () => {
    window.print();
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(`/api/sales/${sale.id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (res.ok) {
        setIsEditing(false);
        fetchSales();
        alert('Order information updated successfully by shop owner.');
        onClose();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={20} color="#10b981" />
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Sales Receipt #{sale.invoice_no}</h3>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon">
            <X size={18} />
          </button>
        </div>

        {!isEditing ? (
          <div className="modal-body printable-receipt">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              {showShopName && <h2 style={{ fontSize: '20px', fontWeight: '800' }}>{compName}</h2>}
              {compTag && <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{compTag}</p>}
              {showAddr && compAddr && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{compAddr}</p>}
              {showPhoneEmail && compPhone && <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Phone: {compPhone}</p>}
              {showVat && vatNo && <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>VAT/BIN: {vatNo}</p>}
              
              {showInvNo && <p style={{ fontSize: '13px', fontWeight: '600', marginTop: '8px' }}>Invoice: #{sale.invoice_no}</p>}
              {showInvDate && <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(sale.sale_date).toLocaleString()}</p>}
            </div>

            <div style={{ borderTop: '1px dashed var(--border-color)', borderBottom: '1px dashed var(--border-color)', padding: '12px 0', marginBottom: '16px', fontSize: '13px' }}>
              {showCustomer && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Customer:</span>
                  <strong>{sale.customer_name}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Payment Method:</span>
                <strong>{sale.payment_method}</strong>
              </div>
              {showStaff && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Cashier / Staff:</span>
                  <strong>{user?.name || 'Authorized Staff'}</strong>
                </div>
              )}
            </div>

            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', marginBottom: '16px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textTransform: 'uppercase', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 0' }}>Item</th>
                  <th style={{ textAlign: 'center', padding: '6px 0' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '6px 0' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '6px 0' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items?.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px 0', fontWeight: '500' }}>{item.product_name}</td>
                    <td style={{ textAlign: 'center', padding: '8px 0' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '8px 0' }}>{formatCurrency(item.unit_price)}</td>
                    <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: '600' }}>{formatCurrency(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '10px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(sale.total_amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '800', color: 'var(--accent-primary)', marginTop: '8px' }}>
                <span>Grand Total:</span>
                <span>{formatCurrency(sale.total_amount)}</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <p style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{footerThank}</p>
              <p style={{ fontSize: '11px' }}>{footerTerms}</p>
            </div>
          </div>
        ) : (
          /* Owner Edit Form Mode */
          <form onSubmit={handleSaveEdit}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'var(--warning-bg)', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={16} />
                <span><strong>Shop Owner Access Mode:</strong> Correct customer details or payment method.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={editForm.customer_name}
                  onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  value={editForm.payment_method}
                  onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value })}
                >
                  <option value="Cash">Cash</option>
                  <option value="bKash">bKash Mobile Banking</option>
                  <option value="Nagad">Nagad Mobile Banking</option>
                  <option value="Card">Credit / Debit Card</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Sale Notes (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">
                Cancel Edit
              </button>
              <button type="submit" className="btn btn-success">
                Save Corrected Order Info
              </button>
            </div>
          </form>
        )}

        {!isEditing && (
          <div className="modal-footer">
            {isOwner && (
              <button onClick={() => setIsEditing(true)} className="btn btn-secondary">
                <Edit2 size={15} />
                <span>Edit Order Info (Owner Only)</span>
              </button>
            )}
            <button onClick={handlePrint} className="btn btn-primary">
              <Printer size={16} />
              <span>Print Receipt</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
