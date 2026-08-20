import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  RefreshCw,
  Eye,
  Download,
  CheckCircle,
  Printer,
  X,
  RotateCcw,
  Check,
  ExternalLink
} from 'lucide-react';

export const ResellerInvoices = () => {
  const { authFetch, currency = '৳', formatCurrency, showToast } = useApp();

  const [invoices, setInvoices] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Generator form state
  const [generateFor, setGenerateFor] = useState('all');
  const [forceGenerate, setForceGenerate] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Details Modal state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch Invoices and Profiles
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/reseller/invoices');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setInvoices(data);
      }
    } catch (e) {
      console.error('Error fetching invoices:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const res = await authFetch('/api/reseller/profiles');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setProfiles(data);
      }
    } catch (e) {
      console.error('Error fetching profiles:', e);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchProfiles();
  }, []);

  // Handle Invoice Generation
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const payload = {
        reseller_id: generateFor === 'all' ? 'all' : generateFor,
        force_generate: forceGenerate,
        cycle: 'Daily'
      };

      const res = await authFetch('/api/reseller/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        showToast ? showToast('Success 🎉', data.message, 'success') : alert(data.message);
        fetchInvoices();
      } else {
        alert(data.error || 'Failed to generate invoices');
      }
    } catch (e) {
      alert(`Error generating invoice: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setGenerateFor('all');
    setForceGenerate(false);
  };

  // View Invoice Detail Modal
  const handleViewInvoice = async (invoice) => {
    setLoadingDetail(true);
    setShowDetailModal(true);
    try {
      const res = await authFetch(`/api/reseller/invoices/${invoice.id}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedInvoice(data);
      } else {
        alert(data.error || 'Could not load invoice details');
      }
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Mark Paid action
  const handleMarkPaid = async (invoice) => {
    if (!window.confirm(`Mark invoice #${invoice.invoice_id} for ${invoice.reseller_name} as PAID?`)) {
      return;
    }

    try {
      const res = await authFetch(`/api/reseller/invoices/${invoice.id}/mark-paid`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (res.ok) {
        showToast ? showToast('Paid 💰', data.message, 'success') : alert(data.message);
        fetchInvoices();
        if (selectedInvoice && selectedInvoice.id === invoice.id) {
          setSelectedInvoice({ ...selectedInvoice, status: 'Paid' });
        }
      } else {
        alert(data.error || 'Failed to mark as paid');
      }
    } catch (e) {
      alert(`Error marking invoice paid: ${e.message}`);
    }
  };

  // CSV Export
  const handleExportCSV = async (invoice) => {
    try {
      const res = await authFetch(`/api/reseller/invoices/${invoice.id}`);
      const data = await res.json();
      if (!res.ok) return alert('Failed to export CSV');

      const headers = ['Order Invoice #', 'Tracking Code', 'Customer Name', 'Customer Phone', 'Wholesale Price', 'Sale Price (COD)', 'Collected Amount', 'Delivery Fee', 'Reseller Profit', 'Return Loss'];
      const rows = (data.orders || []).map(o => [
        `"${o.invoice_no || ''}"`,
        `"${o.tracking_code || ''}"`,
        `"${o.customer_name || ''}"`,
        `"${o.customer_phone || ''}"`,
        Number(o.reseller_wholesale_cost || 0).toFixed(2),
        Number(o.total_amount || 0).toFixed(2),
        Number(o.collected_amount || o.total_amount || 0).toFixed(2),
        Number(o.delivery_fee_charged || 0).toFixed(2),
        Number(o.reseller_profit || 0).toFixed(2),
        Number(o.return_loss || 0).toFixed(2)
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `invoice_${invoice.invoice_id}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert(`CSV Export error: ${e.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Header Banner */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={24} color="#8b5cf6" />
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Reseller Invoices</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Generate daily, weekly, or monthly payout invoices from completed orders.
          </p>
        </div>

        <button onClick={fetchInvoices} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Generator Control Card */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              Generate For
            </label>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              
              {/* Dropdown */}
              <div style={{ minWidth: '320px', flex: '1', maxWidth: '450px' }}>
                <select
                  value={generateFor}
                  onChange={e => setGenerateFor(e.target.value)}
                  className="form-select"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1.5px solid var(--border-color)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    width: '100%',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="all">All due resellers</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Daily)
                    </option>
                  ))}
                </select>
              </div>

              {/* Force Generate Checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={forceGenerate}
                  onChange={e => setForceGenerate(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                />
                <span>Force generate selected reseller</span>
              </label>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    borderColor: '#6366f1',
                    padding: '10px 32px',
                    fontSize: '14px',
                    fontWeight: '700',
                    borderRadius: '8px',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                  }}
                >
                  {isGenerating ? 'Generating...' : 'Generate'}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn-secondary"
                  style={{
                    padding: '10px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    borderRadius: '8px'
                  }}
                >
                  Reset
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left' }}>Invoice ID</th>
                <th style={{ padding: '14px 16px', textAlign: 'left' }}>Reseller</th>
                <th style={{ padding: '14px 16px', textAlign: 'left' }}>Cycle</th>
                <th style={{ padding: '14px 16px', textAlign: 'left' }}>Period</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>Orders</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Collected</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Admin Price</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Delivery Fee</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Receivable</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '36px', marginBottom: '10px' }}>🧾</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>No invoices generated yet</div>
                    <div style={{ fontSize: '13px', marginTop: '4px' }}>Select a reseller above and click "Generate" to create your first payout invoice.</div>
                  </td>
                </tr>
              ) : (
                invoices.map(inv => {
                  const isPaid = (inv.status || '').toLowerCase() === 'paid';

                  return (
                    <tr
                      key={inv.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Invoice ID */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: '800', fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-primary)' }}>
                          {inv.invoice_id}
                        </span>
                      </td>

                      {/* Reseller Name & Email */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13.5px' }}>
                          {inv.reseller_name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {inv.reseller_email || inv.reseller_phone || '—'}
                        </div>
                      </td>

                      {/* Cycle */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '12.5px' }}>
                        {inv.cycle || 'Daily'}
                      </td>

                      {/* Period */}
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {inv.period || inv.payment_date || '—'}
                      </td>

                      {/* Orders Count */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>
                          {inv.orders_count}
                        </span>
                      </td>

                      {/* Collected */}
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {currency}{Number(inv.total_collection || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Admin Price / Wholesale */}
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '600' }}>
                        {currency}{Number(inv.total_wholesale || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Delivery Fee */}
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '600' }}>
                        {currency}{Number(inv.total_delivery_charge || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Receivable */}
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '800', color: 'var(--text-primary)', fontSize: '14px' }}>
                        {currency}{Number(inv.paid_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            background: isPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.18)',
                            color: isPaid ? '#10b981' : '#f59e0b',
                            border: `1px solid ${isPaid ? '#10b98140' : '#f59e0b50'}`,
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '800',
                            display: 'inline-block',
                            letterSpacing: '0.02em'
                          }}
                        >
                          {isPaid ? 'Paid' : 'Pending'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                          
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => handleViewInvoice(inv)}
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '5px 12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              borderRadius: '6px',
                              color: 'var(--text-primary)'
                            }}
                          >
                            View
                          </button>

                          {/* CSV Button */}
                          <button
                            type="button"
                            onClick={() => handleExportCSV(inv)}
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '5px 12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              borderRadius: '6px',
                              color: 'var(--text-primary)'
                            }}
                          >
                            CSV
                          </button>

                          {/* Mark Paid Button */}
                          {!isPaid ? (
                            <button
                              type="button"
                              onClick={() => handleMarkPaid(inv)}
                              className="btn btn-primary btn-sm"
                              style={{
                                background: '#10b981',
                                borderColor: '#10b981',
                                padding: '5px 14px',
                                fontSize: '12px',
                                fontWeight: '700',
                                borderRadius: '6px',
                                color: '#fff'
                              }}
                            >
                              Mark Paid
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Check size={14} /> Settled
                            </span>
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

      {/* Details / Print Modal */}
      {showDetailModal && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" style={{ maxWidth: '960px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(79, 70, 229, 0.05))', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} color="#8b5cf6" />
                  <span>Invoice Breakdown</span>
                </h3>
                {selectedInvoice && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Invoice ID: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{selectedInvoice.invoice_id}</strong></span>
                    <span>•</span>
                    <span>Reseller: <strong>{selectedInvoice.reseller_name}</strong></span>
                    <span>•</span>
                    <span>Status: <strong style={{ color: selectedInvoice.status === 'Paid' ? '#10b981' : '#f59e0b' }}>{selectedInvoice.status || 'Pending'}</strong></span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer size={15} /> Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="btn btn-secondary btn-icon"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="modal-body">
              {loadingDetail ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Loading invoice details...
                </div>
              ) : selectedInvoice ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>Total Collected</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#f59e0b', marginTop: '4px' }}>
                        {currency}{Number(selectedInvoice.total_collection || 0).toFixed(2)}
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>Admin Wholesale</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                        {currency}{Number(selectedInvoice.total_wholesale || 0).toFixed(2)}
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>Delivery Fee</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#38bdf8', marginTop: '4px' }}>
                        {currency}{Number(selectedInvoice.total_delivery_charge || 0).toFixed(2)}
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>Receivable Amount</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                        {currency}{Number(selectedInvoice.paid_amount || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Orders Table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255, 255, 255, 0.04)', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '10px 12px', textAlign: 'left' }}>Order Invoice #</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left' }}>Tracking</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left' }}>Customer Phone</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left' }}>Items</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Wholesale</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Sale (COD)</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Collected</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Delivery</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Profit / Loss</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedInvoice.orders || []).map((o, idx) => {
                          const profit = Number(o.reseller_profit || 0);
                          const loss = Number(o.return_loss || 0);

                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '10px 12px', fontWeight: '700', color: '#8b5cf6' }}>
                                #{o.invoice_no}
                              </td>
                              <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '11px' }}>
                                {o.tracking_code || '—'}
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                {o.customer_phone || '—'}
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                {(o.items || []).map((item, i) => (
                                  <div key={i} style={{ fontSize: '11px' }}>
                                    • {item.product_name} <strong style={{ color: '#c084fc' }}>×{item.quantity}</strong>
                                  </div>
                                ))}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                                {currency}{Number(o.reseller_wholesale_cost || 0).toFixed(2)}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#f59e0b' }}>
                                {currency}{Number(o.total_amount || 0).toFixed(2)}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', color: '#38bdf8' }}>
                                {currency}{Number(o.collected_amount || o.total_amount || 0).toFixed(2)}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                {currency}{Number(o.delivery_fee_charged || 0).toFixed(2)}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700' }}>
                                {profit > 0 ? (
                                  <span style={{ color: '#10b981' }}>+{currency}{profit.toFixed(2)}</span>
                                ) : loss > 0 ? (
                                  <span style={{ color: '#ef4444' }}>-{currency}{loss.toFixed(2)}</span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>{currency}0.00</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mark Paid button in modal if not yet paid */}
                  {selectedInvoice.status !== 'Paid' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                      <button
                        type="button"
                        onClick={() => handleMarkPaid(selectedInvoice)}
                        className="btn btn-primary"
                        style={{ background: '#10b981', borderColor: '#10b981', padding: '10px 24px', fontWeight: '700' }}
                      >
                        ✓ Mark This Invoice as Paid
                      </button>
                    </div>
                  )}

                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
