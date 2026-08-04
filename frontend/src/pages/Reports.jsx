import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TrendingUp, DollarSign, Calendar, Printer, Award, FileText, Truck, RotateCcw } from 'lucide-react';
import { DateRangeFilter } from '../components/DateRangeFilter';

export const Reports = () => {
  const { currency, authFetch } = useApp();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      let url = '/api/reports/profit-loss?';
      if (startDate && endDate) {
        url += `start_date=${startDate}&end_date=${endDate}`;
      }
      const res = await authFetch(url);
      const data = await res.json();
      if (res.ok) setReportData(data);
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  if (!reportData) {
    return (
      <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
          {loading ? 'Calculating Profit & Loss statement...' : 'Failed to load report. Please refresh.'}
        </p>
      </div>
    );
  }

  const fin = reportData.financial_summary || {};
  const expMap = reportData.expense_breakdown || {};
  const expenseEntries = Object.entries(expMap);

  const grossDelivProfit = Number(fin.gross_delivery_profit || 0);
  const returnedDelivReversal = Number(fin.returned_delivery_profit_reversal || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Filter & Print Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <DateRangeFilter
          onFilterChange={({ startDate: s, endDate: e }) => {
            setStartDate(s);
            setEndDate(e);
          }}
        />

        <button onClick={handlePrint} className="btn btn-primary">
          <Printer size={16} />
          <span>Print Financial Statement</span>
        </button>
      </div>

      {/* Printable Financial Statement Container */}
      <div className="glass-card printable-receipt" style={{ padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px', borderBottom: '2px solid var(--border-color)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Profit & Loss (P&L) Statement</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Period: {startDate && endDate ? `${startDate} to ${endDate}` : 'All Time History'}
          </p>
        </div>

        {/* P&L Main Breakdown Table */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: 'var(--text-primary)' }}>
            Financial Performance Summary
          </h3>

          <table className="data-table" style={{ fontSize: '14px' }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: '600' }}>1. Gross Product Sales Revenue</td>
                <td style={{ textAlign: 'right', fontWeight: '700' }}>{currency}{Number(fin.total_sales_revenue || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-secondary)' }}>Less: Cost of Goods Sold (COGS)</td>
                <td style={{ textAlign: 'right', color: 'var(--danger)' }}>-{currency}{Number(fin.total_cogs || 0).toLocaleString()}</td>
              </tr>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                <td style={{ fontWeight: '700', fontSize: '14px' }}>= GROSS PRODUCT PROFIT</td>
                <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '15px', color: 'var(--accent-primary)' }}>
                  {currency}{Number(fin.gross_product_profit || 0).toLocaleString()}
                </td>
              </tr>

              {/* Separate Row 1: Gross Delivery Charge Profit */}
              <tr style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                <td style={{ fontWeight: '700', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Truck size={16} color="var(--success)" />
                  <span>+ Add: Gross Delivery Charge Profit</span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--success)' }}>
                  +{currency}{grossDelivProfit.toLocaleString()}
                </td>
              </tr>

              {/* Separate Row 2: Returned Delivery Profit Reversal */}
              <tr style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                <td style={{ fontWeight: '700', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RotateCcw size={16} color="var(--danger)" />
                  <span>Less: Returned Delivery Profit Reversal</span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--danger)' }}>
                  -{currency}{returnedDelivReversal.toLocaleString()}
                </td>
              </tr>

              {/* Separate Row 3: Reseller Parcels Gross Profit */}
              <tr style={{ background: 'rgba(236, 72, 153, 0.05)' }}>
                <td style={{ fontWeight: '700', color: '#ec4899', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={16} color="#ec4899" />
                  <span>+ Add: Reseller Parcels Gross Profit</span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800', color: '#ec4899' }}>
                  +{currency}{Number(fin.reseller_gross_profit || 0).toLocaleString()}
                </td>
              </tr>

              <tr style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
                <td style={{ fontWeight: '700', fontSize: '15px' }}>= TOTAL OPERATING GROSS INCOME</td>
                <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '16px', color: 'var(--success)' }}>
                  {currency}{Number(fin.total_operating_gross_income || 0).toLocaleString()}
                </td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-secondary)' }}>Less: Total Operating Expenses (Ads, Returns, Rent, etc.)</td>
                <td style={{ textAlign: 'right', color: 'var(--danger)' }}>-{currency}{Number(fin.total_operating_expenses || 0).toLocaleString()}</td>
              </tr>
              <tr style={{ background: Number(fin.net_operating_profit || 0) >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
                <td style={{ fontWeight: '800', fontSize: '18px', color: Number(fin.net_operating_profit || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  = NET OPERATING PROFIT
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '20px', color: Number(fin.net_operating_profit || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {currency}{Number(fin.net_operating_profit || 0).toLocaleString()} ({fin.profit_margin_pct}%)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Operating Expenses Breakdown Table */}
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>Operating Expense Breakdown</h4>
          {expenseEntries.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No operating expenses recorded for this period.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenseEntries.map(([cat, amt], idx) => (
                  <tr key={idx}>
                    <td><strong>{cat}</strong></td>
                    <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--danger)' }}>
                      -{currency}{Number(amt).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
