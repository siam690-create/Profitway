import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Search, ShoppingBag, Calendar, Eye, Printer, Filter, CreditCard, DollarSign } from 'lucide-react';
import { ReceiptModal } from '../components/ReceiptModal';

export const Orders = () => {
  const { authFetch, currency, sales, fetchSales } = useApp();
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [loading, setLoading] = useState(false);

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

  // Filter Sales locally
  const filteredSales = sales.filter(s => {
    const matchesSearch = s.invoice_no.toLowerCase().includes(search.toLowerCase()) || 
                          (s.customer_name && s.customer_name.toLowerCase().includes(search.toLowerCase()));
    const matchesPayment = paymentMethod ? s.payment_method === paymentMethod : true;
    
    let matchesDate = true;
    if (startDate && endDate) {
      const saleDate = new Date(s.sale_date).toISOString().slice(0, 10);
      matchesDate = saleDate >= startDate && saleDate <= endDate;
    }

    return matchesSearch && matchesPayment && matchesDate;
  });

  const totalFilteredAmount = filteredSales.reduce((sum, s) => sum + Number(s.total_amount), 0);
  const totalFilteredProfit = filteredSales.reduce((sum, s) => sum + Number(s.gross_profit), 0);

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

          <input
            type="date"
            className="form-input"
            style={{ width: '140px' }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span style={{ color: 'var(--text-muted)' }}>-</span>
          <input
            type="date"
            className="form-input"
            style={{ width: '140px' }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
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
                      <strong style={{ fontSize: '14px', color: 'var(--accent-primary)' }}>{sale.invoice_no}</strong>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {new Date(sale.sale_date).toLocaleString()}
                    </td>
                    <td style={{ fontSize: '14px', fontWeight: '500' }}>{sale.customer_name || 'Walk-in Customer'}</td>
                    <td>
                      <span className="badge badge-info">{sale.payment_method}</span>
                    </td>
                    <td style={{ fontSize: '14px', fontWeight: '800' }}>
                      {currency}{Number(sale.total_amount).toFixed(2)}
                    </td>
                    <td>
                      <span className="badge badge-success">
                        +{currency}{Number(sale.gross_profit).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleViewReceipt(sale.id)} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Eye size={14} />
                        <span>View Invoice</span>
                      </button>
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
