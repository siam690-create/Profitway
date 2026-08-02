import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Search, ShoppingBag, Calendar, Eye, Printer, Filter, CreditCard, DollarSign, Globe, Trash2, Edit2 } from 'lucide-react';
import { ReceiptModal } from '../components/ReceiptModal';
import { DateRangeFilter } from '../components/DateRangeFilter';

export const Orders = () => {
  const { authFetch, currency, sales, fetchSales, deleteSale, user } = useApp();
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Overview & Filter Bar */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Filtered Orders Revenue ({filteredSales.length} Orders)</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginTop: '4px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)' }}>
              {currency}{totalFilteredAmount.toLocaleString()}
            </h2>
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
                <th>Payment Method</th>
                <th>Total Sale Amount</th>
                <th>Gross Profit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
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
                      <span className="badge badge-info">{sale.payment_method}</span>
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
                          <span>View Invoice</span>
                        </button>

                        {isOwner && (
                          <>
                            <button onClick={() => handleViewReceipt(sale.id)} className="btn btn-secondary btn-sm" title="Edit Order Information">
                              <Edit2 size={14} color="var(--accent-primary)" />
                              <span>Edit</span>
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
    </div>
  );
};
