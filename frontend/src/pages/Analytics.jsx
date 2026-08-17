import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, Calendar, TrendingUp, DollarSign, PackageCheck, Layers3, Award, ArrowUpRight, ArrowDownRight, Megaphone, Undo2, Receipt, RotateCcw, Truck, ShoppingBag, Users, AlertTriangle, Flame, ShieldAlert, Sparkles, CheckCircle2, RefreshCw, Target, Zap, AlertCircle, ChevronLeft, ChevronRight, Info, FileSpreadsheet, Download } from 'lucide-react';

export const Analytics = () => {
  const { authFetch, currency } = useApp();
  const [range, setRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      let url = `/api/analytics/products?range=${range}&_t=${Date.now()}`;
      if (range === 'custom' && startDate && endDate) {
        url += `&start_date=${startDate}&end_date=${endDate}`;
      }

      const res = await authFetch(url);
      const data = await res.json();
      if (res.ok) setAnalyticsData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const handleApplyCustomFilter = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) return alert('Select both Start Date and End Date');
    fetchAnalytics();
  };

  const summary = analyticsData?.summary || {};
  const wholesaleSummary = analyticsData?.wholesale_summary || {};
  const topWholesaleBuyers = analyticsData?.top_wholesale_buyers || [];
  const topSellers = analyticsData?.top_sellers || [];
  const slowMovers = analyticsData?.slow_movers || [];
  const adsPerformance = analyticsData?.ads_performance || [];
  const riskProducts = analyticsData?.risk_products || [];
  const products = analyticsData?.products || [];

  // Total Aggregates for Product Profitability Summary Row
  const totalParcelsCount = products.reduce((sum, p) => sum + Number(p.parcels_count || 0), 0);
  const totalUnitsSold = products.reduce((sum, p) => sum + Number(p.units_sold || 0), 0);
  const totalGrossProfit = products.reduce((sum, p) => sum + Number(p.gross_profit || 0), 0);
  const totalUnitsReturned = products.reduce((sum, p) => sum + Number(p.units_returned || 0), 0);
  const totalReturnCharges = products.reduce((sum, p) => sum + Number(p.return_charges || 0), 0);
  const totalReturnProfitAdjust = products.reduce((sum, p) => sum + Number(p.return_profit_adjust || 0), 0);
  const totalProductDeliveryProfit = products.reduce((sum, p) => sum + Number(p.product_delivery_profit || 0), 0);
  const totalAdSpendBdt = products.reduce((sum, p) => sum + Number(p.ad_spend_bdt || 0), 0);
  const totalNetRealProfit = products.reduce((sum, p) => sum + Number(p.net_real_profit || 0), 0);

  const isNetProfitPositive = Number(summary.net_real_profit || 0) >= 0;
  const netDelivProfit = Number(summary.net_delivery_profit || 0);

  const scrollTable = (containerId, direction) => {
    const el = document.getElementById(containerId);
    if (el) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleExportExcel = () => {
    if (!products || products.length === 0) return alert('No data available to export.');

    const headers = [
      'Product Name',
      'SKU',
      'Cost Price (BDT)',
      'Selling Price (BDT)',
      'Customer Parcels (Orders)',
      'Units Sold',
      'Product Gross Profit (BDT)',
      'Returned Units',
      'Returned Courier Loss (BDT)',
      'Return Profit Adjust (BDT)',
      'Delivery Profit/Loss (BDT)',
      'Marketing Cost (BDT)',
      'Net Real Profit (BDT)',
      'Profit Margin (%)'
    ];

    const rows = products.map(p => [
      `"${(p.product_name || '').replace(/"/g, '""')}"`,
      `"${(p.sku || '').replace(/"/g, '""')}"`,
      p.cost_price.toFixed(2),
      p.selling_price.toFixed(2),
      p.parcels_count || 0,
      p.units_sold || 0,
      p.gross_profit.toFixed(2),
      p.units_returned || 0,
      (p.return_charges || 0).toFixed(2),
      (p.return_profit_adjust || 0).toFixed(2),
      p.product_delivery_profit.toFixed(2),
      p.ad_spend_bdt.toFixed(2),
      p.net_real_profit.toFixed(2),
      p.profit_margin.toFixed(2)
    ]);

    // Add TOTAL SUMMARY Row at the bottom of the Excel sheet
    rows.push([
      '"TOTAL SUMMARY (সর্বমোট)"',
      '""',
      '""',
      '""',
      totalParcelsCount,
      totalUnitsSold,
      totalGrossProfit.toFixed(2),
      totalUnitsReturned,
      totalReturnCharges.toFixed(2),
      totalReturnProfitAdjust.toFixed(2),
      totalProductDeliveryProfit.toFixed(2),
      totalAdSpendBdt.toFixed(2),
      totalNetRealProfit.toFixed(2),
      '""'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `Product_Profitability_Analytics_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Date Range Filter Bar */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={24} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Product & Business Analytics Suite</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Executive Overview, Product Profitability, Wholesale B2B, ROAS Marketing, Risk Audit & Product Rankings
          </p>
        </div>

        {/* Date Filter Quick Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setRange('today')}
            className={`btn btn-sm ${range === 'today' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Today
          </button>
          <button
            onClick={() => setRange('week')}
            className={`btn btn-sm ${range === 'week' ? 'btn-primary' : 'btn-secondary'}`}
          >
            This Week
          </button>
          <button
            onClick={() => setRange('month')}
            className={`btn btn-sm ${range === 'month' ? 'btn-primary' : 'btn-secondary'}`}
          >
            This Month
          </button>
          <button
            onClick={() => setRange('all')}
            className={`btn btn-sm ${range === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All Time
          </button>
          <button
            onClick={() => setRange('custom')}
            className={`btn btn-sm ${range === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Custom Date
          </button>
        </div>
      </div>

      {/* Custom Date Picker Inputs */}
      {range === 'custom' && (
        <form onSubmit={handleApplyCustomFilter} className="glass-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="form-group" style={{ margin: 0, flex: 1 }}>
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ margin: 0, flex: 1 }}>
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-input"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '22px' }}>
            Apply Filter
          </button>
        </form>
      )}

      {/* Analytics Section Sub-Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('overview')}
          className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
        >
          📊 Executive Overview
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-secondary'}`}
        >
          📦 Product Profitability ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('wholesale')}
          className={`btn ${activeTab === 'wholesale' ? 'btn-primary' : 'btn-secondary'}`}
        >
          🛍️ Wholesale B2B Analytics
        </button>
        <button
          onClick={() => setActiveTab('ranking')}
          className={`btn ${activeTab === 'ranking' ? 'btn-primary' : 'btn-secondary'}`}
        >
          🏆 Product Ranking & Performers
        </button>
        <button
          onClick={() => setActiveTab('roas')}
          className={`btn ${activeTab === 'roas' ? 'btn-primary' : 'btn-secondary'}`}
        >
          📢 Ads Cost & Product ROAS ({adsPerformance.length})
        </button>
        <button
          onClick={() => setActiveTab('risk')}
          className={`btn ${activeTab === 'risk' ? 'btn-danger' : 'btn-secondary'}`}
          style={{ background: activeTab === 'risk' ? 'var(--danger)' : undefined, color: activeTab === 'risk' ? '#fff' : undefined }}
        >
          🚨 Risk & Loss Audit ({riskProducts.length})
        </button>
      </div>

      {/* --- TAB 1: EXECUTIVE OVERVIEW --- */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Executive P&L Stat Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
            <div className="glass-card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>1. Gross Product Sales (বিক্রি)</span>
                <DollarSign size={16} color="var(--accent-primary)" />
              </div>
              <strong style={{ fontSize: '20px', color: 'var(--text-primary)' }}>{currency}{Number(summary.gross_sales_revenue || 0).toFixed(2)}</strong>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{summary.total_pos_orders || 0} Total Orders</div>
            </div>

            <div className="glass-card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>2. COGS (কেনাদাম)</span>
                <PackageCheck size={16} color="var(--text-secondary)" />
              </div>
              <strong style={{ fontSize: '20px', color: 'var(--text-secondary)' }}>{currency}{Number(summary.gross_cogs || 0).toFixed(2)}</strong>
            </div>

            <div className="glass-card" style={{ padding: '18px', background: netDelivProfit >= 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', border: `1px solid ${netDelivProfit >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: netDelivProfit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: '700' }}>
                  3. {netDelivProfit >= 0 ? 'Net Delivery Profit' : 'Net Delivery Loss'}
                </span>
                <Truck size={16} color={netDelivProfit >= 0 ? 'var(--success)' : 'var(--danger)'} />
              </div>
              <strong style={{ fontSize: '20px', color: netDelivProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {netDelivProfit >= 0 ? '+' : '-'}{currency}{Math.abs(netDelivProfit).toFixed(2)}
              </strong>
            </div>

            <div className="glass-card" style={{ padding: '18px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: '700' }}>4. Returned Reversals (বাতিল লাভ)</span>
                <RotateCcw size={16} color="var(--danger)" />
              </div>
              <strong style={{ fontSize: '20px', color: 'var(--danger)' }}>
                -{currency}{(Number(summary.returned_profit_reversal || 0) + Number(summary.returned_delivery_profit_reversal || 0)).toFixed(2)}
              </strong>
            </div>

            <div className="glass-card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>5. Paid Ads Cost (বিজ্ঞাপন)</span>
                <Megaphone size={16} color="var(--warning)" />
              </div>
              <strong style={{ fontSize: '20px', color: 'var(--danger)' }}>{currency}{Number(summary.paid_ads_cost || 0).toFixed(2)}</strong>
            </div>

            <div className="glass-card" style={{ padding: '18px', background: isNetProfitPositive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', border: `1px solid ${isNetProfitPositive ? 'var(--success)' : 'var(--danger)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: isNetProfitPositive ? 'var(--success)' : 'var(--danger)', fontWeight: '700' }}>6. NET REAL PROFIT (আসল নিট লাভ)</span>
                <TrendingUp size={16} color={isNetProfitPositive ? 'var(--success)' : 'var(--danger)'} />
              </div>
              <strong style={{ fontSize: '22px', color: isNetProfitPositive ? 'var(--success)' : 'var(--danger)' }}>
                {isNetProfitPositive ? '+' : ''}{currency}{Number(summary.net_real_profit || 0).toFixed(2)}
              </strong>
            </div>
          </div>

          {/* Quick Metrics Health Badges */}
          <div className="glass-card" style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', color: 'var(--danger)' }}>
                <Undo2 size={20} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Courier Return Rate</span>
                <strong style={{ fontSize: '16px', color: Number(summary.return_rate_pct) > 10 ? 'var(--danger)' : 'var(--text-primary)' }}>
                  {summary.return_rate_pct}% ({summary.total_returns_count || 0} Returns)
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px', color: 'var(--accent-primary)' }}>
                <Sparkles size={20} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Marketing ROAS Multiplier</span>
                <strong style={{ fontSize: '16px', color: 'var(--accent-primary)' }}>
                  {summary.roas_multiplier}x ROAS
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', color: 'var(--danger)' }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Loss Products Risk Count</span>
                <strong style={{ fontSize: '16px', color: 'var(--danger)' }}>
                  {summary.total_risk_products_count || 0} Products at Loss (-{currency}{Number(summary.total_risk_loss || 0).toFixed(2)})
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: PRODUCT PROFITABILITY --- */}
      {activeTab === 'products' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Itemized Product Financial Performance Breakdown</h3>
              <button
                type="button"
                onClick={handleExportExcel}
                className="btn btn-sm"
                style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.4)', fontWeight: '700', gap: '6px' }}
                title="Download this profitability report as an Excel (.csv) spreadsheet file"
              >
                <FileSpreadsheet size={15} />
                <span>Export to Excel (.csv)</span>
              </button>
            </div>

            {/* Table Horizontal Scroll Mover Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Table Navigation:</span>
              <button
                type="button"
                onClick={() => scrollTable('products-table-container', 'left')}
                className="btn btn-secondary btn-sm"
                title="Scroll Table Left"
              >
                <ChevronLeft size={14} />
                <span>Scroll Left</span>
              </button>
              <button
                type="button"
                onClick={() => scrollTable('products-table-container', 'right')}
                className="btn btn-secondary btn-sm"
                title="Scroll Table Right"
              >
                <span>Scroll Right</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div id="products-table-container" className="table-wrapper" style={{ overflowX: 'auto', scrollBehavior: 'smooth' }}>
            <table className="data-table" style={{ minWidth: '1500px' }}>
              <thead>
                {/* 🌟 TOTAL COLUMN SUMMARY ROW */}
                {products.length > 0 && (
                  <tr style={{ background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.22), rgba(16, 185, 129, 0.22))', borderBottom: '2px solid var(--accent-primary)' }}>
                    <td style={{ padding: '14px 12px', background: 'transparent' }}>
                      <div style={{ fontWeight: '800', color: '#38bdf8', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={16} color="#38bdf8" />
                        <span>TOTAL SUMMARY (সর্বমোট)</span>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{products.length} Products Aggregate</span>
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>-</td>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>-</td>
                    <td style={{ textAlign: 'center', fontWeight: '800', color: '#38bdf8', fontSize: '14px' }}>
                      {totalParcelsCount.toLocaleString()} Orders
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: '800', color: 'var(--success)', fontSize: '14px' }}>
                      {totalUnitsSold.toLocaleString()} Sold
                    </td>
                    <td style={{ fontWeight: '800', color: 'var(--success)', fontSize: '14px' }}>
                      +{currency}{totalGrossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: '800', color: totalUnitsReturned > 0 ? 'var(--danger)' : 'var(--text-muted)', fontSize: '14px' }}>
                      {totalUnitsReturned.toLocaleString()} Returned
                    </td>
                    <td style={{ fontWeight: '800', color: totalReturnCharges > 0 ? 'var(--danger)' : 'var(--text-muted)', fontSize: '14px' }}>
                      -{currency}{totalReturnCharges.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ fontWeight: '800', color: totalReturnProfitAdjust > 0 ? 'var(--danger)' : 'var(--text-muted)', fontSize: '14px' }}>
                      -{currency}{totalReturnProfitAdjust.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ fontWeight: '800', color: totalProductDeliveryProfit >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: '14px' }}>
                      {totalProductDeliveryProfit >= 0 ? '+' : ''}{currency}{totalProductDeliveryProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ fontWeight: '800', color: totalAdSpendBdt > 0 ? 'var(--danger)' : 'var(--text-muted)', fontSize: '14px' }}>
                      -{currency}{totalAdSpendBdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ fontWeight: '800', fontSize: '15px', color: totalNetRealProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {totalNetRealProfit >= 0 ? '+' : ''}{currency}{totalNetRealProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}

                <tr>
                  <th style={{ minWidth: '180px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>PRODUCT NAME & SKU</span>
                      <span title="প্রোডাক্টের নাম এবং ইউনিক স্টক কিপিং ইউনিট (SKU) আইডেন্টিফায়ার" style={{ cursor: 'pointer', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center' }}>
                        <Info size={13} />
                      </span>
                    </div>
                  </th>

                  <th style={{ minWidth: '110px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>COST PRICE</span>
                      <span title="প্রোডাক্ট প্রতি কেনা দাম বা উৎপাদন খরচ (Unit Purchase / COGS Cost)" style={{ cursor: 'pointer', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center' }}>
                        <Info size={13} />
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>(কেনাদাম)</span>
                  </th>

                  <th style={{ minWidth: '110px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>SELLING PRICE</span>
                      <span title="প্রোডাক্ট প্রতি নির্ধারিত খুচরা বিক্রি দাম (Unit Retail Sale Price)" style={{ cursor: 'pointer', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center' }}>
                        <Info size={13} />
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>(বিক্রিদাম)</span>
                  </th>

                  <th style={{ minWidth: '120px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <span>CUSTOMER / PARCEL</span>
                      <span title="এই প্রোডাক্ট সম্বলিত মোট কাস্টমার বা পার্সেল অর্ডার সংখ্যা" style={{ cursor: 'pointer', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center' }}>
                        <Info size={13} />
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>(পার্সেল সংখ্যা)</span>
                  </th>

                  <th style={{ minWidth: '120px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <span>PRODUCT SOLD</span>
                      <span title="কুরিয়ারে সফলভাবে ডেলিভারি হওয়া মোট ইউনিট প্রোডাক্ট বিক্রি সংখ্যা (Delivered Sales Qty)" style={{ cursor: 'pointer', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center' }}>
                        <Info size={13} />
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>(বিক্রি সংখ্যা)</span>
                  </th>

                  <th style={{ minWidth: '140px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>PRODUCT GROSS PROFIT</span>
                      <span title="সফল প্রোডাক্ট বিক্রি থেকে অর্জিত কাঁচা লাভ = (বিক্রিদাম - কেনাদাম) × ডেলিভারি প্রোডাক্ট সংখ্যা" style={{ cursor: 'pointer', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center' }}>
                        <Info size={13} />
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>(+৳ কাঁচা লাভ)</span>
                  </th>

                  <th style={{ minWidth: '120px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <span>RETURNED PRODUCT</span>
                      <span title="কুরিয়ার থেকে ডেলিভারি আনসাকসেসফুল হয়ে রিটার্ন আসা মোট প্রোডাক্ট সংখ্যা" style={{ cursor: 'pointer', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center' }}>
                        <Info size={13} />
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>(রিটার্ন সংখ্যা)</span>
                  </th>

                  <th style={{ minWidth: '150px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>RETURNED COURIER LOSS</span>
                      <span title="প্রোডাক্ট রিটার্ন আসার কারণে কুরিয়ার কোম্পানিকে দেওয়া ড্যামেজ বা রিটার্ন বুকিং ফি লস" style={{ cursor: 'pointer', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center' }}>
                        <Info size={13} />
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>(-৳ কুরিয়ার ক্ষতি)</span>
                  </th>

                  <th style={{ minWidth: '150px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>RETURN PROFIT ADJUST</span>
                      <span title="প্রোডাক্ট রিটার্ন আসার ফলে প্রত্যাশিত গ্রস প্রফিট ও ডেলিভারি ফি বাতিল হওয়ার মোট ক্ষতি" style={{ cursor: 'pointer', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center' }}>
                        <Info size={13} />
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>(-৳ প্রফিট বাতিল)</span>
                  </th>

                  <th style={{ minWidth: '150px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>DELIVERY PROFIT/LOSS</span>
                      <span title="কাস্টমার থেকে সংগৃহীত ডেলিভারি ফি মাইনাস কুরিয়ারকে দেওয়া আসল ডেলিভারি চার্জের নিট লাভ বা ক্ষতি" style={{ cursor: 'pointer', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center' }}>
                        <Info size={13} />
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>(+/-৳ ডেলিভারি ফি)</span>
                  </th>

                  <th style={{ minWidth: '130px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>MARKETING COST</span>
                      <span title="পেইড এডস ট্র্যাকার (Paid Ads Tracker) থেকে এই প্রোডাক্টের জন্য হওয়া ফেসবুক/গুগল এড খরচ" style={{ cursor: 'pointer', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center' }}>
                        <Info size={13} />
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>(-৳ এডস খরচ)</span>
                  </th>

                  <th style={{ minWidth: '160px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>NET REAL PROFIT</span>
                      <span title="প্রোডাক্টের সর্বমোট আসল লাভ = গ্রস প্রফিট + ডেলিভারি লাভ - রিটার্ন কুরিয়ার ফি লস - রিটার্ন প্রফিট অ্যাডজাস্ট - এডস খরচ" style={{ cursor: 'pointer', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center' }}>
                        <Info size={13} />
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>(নিট আসল লাভ)</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="12" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No product sales or financial records found for the selected date range.
                    </td>
                  </tr>
                ) : (
                  products.map(p => {
                    const isProfitPos = p.net_real_profit >= 0;
                    return (
                      <tr key={p.product_id}>
                        {/* 1. PRODUCT NAME & SKU */}
                        <td>
                          <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{p.product_name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>
                        </td>

                        {/* 2. COST PRICE */}
                        <td style={{ fontSize: '13px', fontWeight: '600' }}>
                          {currency}{p.cost_price.toFixed(2)}
                        </td>

                        {/* 3. SELLING PRICE */}
                        <td style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-primary)' }}>
                          {currency}{p.selling_price.toFixed(2)}
                        </td>

                        {/* 4. CUSTOMER / PARCEL */}
                        <td style={{ textAlign: 'center', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {p.parcels_count || 0} Orders
                        </td>

                        {/* 5. PRODUCT SOLD */}
                        <td style={{ textAlign: 'center', fontWeight: '700', color: 'var(--success)' }}>
                          {p.units_sold} Sold
                        </td>

                        {/* 6. PRODUCT GROSS PROFIT */}
                        <td style={{ fontSize: '13px', fontWeight: '700', color: 'var(--success)' }}>
                          +{currency}{p.gross_profit.toFixed(2)}
                        </td>

                        {/* 7. RETURNED PRODUCT */}
                        <td style={{ textAlign: 'center', fontWeight: '700', color: p.units_returned > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {p.units_returned} Returned
                        </td>

                        {/* 8. RETURNED COURIER FEE LOSS */}
                        <td style={{ color: p.return_charges > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          -{currency}{(p.return_charges || 0).toFixed(2)}
                        </td>

                        {/* 9. RETURN PRODUCT PROFIT ADJUST */}
                        <td style={{ color: (p.return_profit_adjust || 0) > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          -{currency}{(p.return_profit_adjust || 0).toFixed(2)}
                        </td>

                        {/* 10. DELIVERY FEE PROFIT/LOSS */}
                        <td style={{ color: p.product_delivery_profit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
                          {p.product_delivery_profit >= 0 ? '+' : ''}{currency}{p.product_delivery_profit.toFixed(2)}
                        </td>

                        {/* 11. MARKETING COST */}
                        <td style={{ color: p.ad_spend_bdt > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          -{currency}{p.ad_spend_bdt.toFixed(2)}
                        </td>

                        {/* 12. NET REAL PROFIT */}
                        <td>
                          <strong style={{ fontSize: '14px', color: isProfitPos ? 'var(--success)' : 'var(--danger)' }}>
                            {isProfitPos ? '+' : ''}{currency}{p.net_real_profit.toFixed(2)}
                          </strong>
                          <span className={`badge ${isProfitPos ? 'badge-success' : 'badge-danger'}`} style={{ display: 'block', width: 'fit-content', marginTop: '4px', fontSize: '10px' }}>
                            {p.profit_margin.toFixed(1)}% Margin
                          </span>
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

      {/* --- TAB 3: WHOLESALE B2B ANALYTICS --- */}
      {activeTab === 'wholesale' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Wholesale B2B Revenue</span>
              <strong style={{ fontSize: '24px', display: 'block', color: 'var(--text-primary)', marginTop: '4px' }}>
                {currency}{Number(wholesaleSummary.wholesale_revenue || 0).toFixed(2)}
              </strong>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{wholesaleSummary.wholesale_orders_count || 0} B2B Orders</span>
            </div>

            <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--success)' }}>
              <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '700' }}>Wholesale B2B Gross Profit</span>
              <strong style={{ fontSize: '24px', display: 'block', color: 'var(--success)', marginTop: '4px' }}>
                +{currency}{Number(wholesaleSummary.wholesale_profit || 0).toFixed(2)}
              </strong>
            </div>

            <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-primary)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cash Collected from Buyers</span>
              <strong style={{ fontSize: '24px', display: 'block', color: 'var(--accent-primary)', marginTop: '4px' }}>
                {currency}{Number(wholesaleSummary.wholesale_cash_collected || 0).toFixed(2)}
              </strong>
            </div>

            <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--danger)' }}>
              <span style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: '700' }}>Pending Pawna Dues</span>
              <strong style={{ fontSize: '24px', display: 'block', color: 'var(--danger)', marginTop: '4px' }}>
                {currency}{Number(wholesaleSummary.wholesale_pending_pawna || 0).toFixed(2)}
              </strong>
            </div>
          </div>

          {/* Top Wholesale Buyers Directory Table */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Top Wholesale B2B Buyers Ranking</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <button type="button" onClick={() => scrollTable('wholesale-table-container', 'left')} className="btn btn-secondary btn-sm">
                  <ChevronLeft size={14} /> Scroll Left
                </button>
                <button type="button" onClick={() => scrollTable('wholesale-table-container', 'right')} className="btn btn-secondary btn-sm">
                  Scroll Right <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div id="wholesale-table-container" className="table-wrapper" style={{ overflowX: 'auto', scrollBehavior: 'smooth' }}>
              <table className="data-table" style={{ minWidth: '850px' }}>
                <thead>
                  <tr>
                    <th>Buyer Name & Company</th>
                    <th>Contact Phone</th>
                    <th>Orders Count</th>
                    <th>Total B2B Spent</th>
                    <th>Profit Generated</th>
                    <th>Current Pawna Due</th>
                  </tr>
                </thead>
                <tbody>
                  {topWholesaleBuyers.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No wholesale sales recorded for this date range.
                      </td>
                    </tr>
                  ) : (
                    topWholesaleBuyers.map(b => (
                      <tr key={b.buyer_id}>
                        <td>
                          <strong>{b.buyer_name}</strong>
                          {b.company_name && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{b.company_name}</div>}
                        </td>
                        <td style={{ fontSize: '13px' }}>{b.phone || 'N/A'}</td>
                        <td><span className="badge badge-info">{b.orders_count} Orders</span></td>
                        <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{currency}{Number(b.total_spent).toFixed(2)}</td>
                        <td style={{ fontWeight: '700', color: 'var(--success)' }}>{currency}{Number(b.total_profit_generated).toFixed(2)}</td>
                        <td style={{ fontWeight: '700', color: Number(b.current_pawna_due) > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {currency}{Number(b.current_pawna_due).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: PRODUCT PERFORMANCE RANKINGS --- */}
      {activeTab === 'ranking' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Top Selling Products */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Flame size={20} color="var(--success)" />
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>🥇 Top 5 Best-Selling Products</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topSellers.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No top sales yet</div>
              ) : (
                topSellers.map((p, rank) => (
                  <div key={p.product_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        #{rank + 1}
                      </span>
                      <div>
                        <strong style={{ fontSize: '14px', display: 'block' }}>{p.product_name}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SKU: {p.sku} | Cost: {currency}{p.cost_price} | Sell: {currency}{p.selling_price}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--success)', display: 'block' }}>{p.units_sold} Units Sold</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Net Profit: {currency}{p.net_real_profit.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Slow Moving Products */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertTriangle size={20} color="var(--warning)" />
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>🐢 Slow-Moving Products (High Stock, Low Sales)</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {slowMovers.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>All products are selling fast!</div>
              ) : (
                slowMovers.map(p => (
                  <div key={p.product_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <strong style={{ fontSize: '14px', display: 'block' }}>{p.product_name}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SKU: {p.sku} | Cost: {currency}{p.cost_price} | Sell: {currency}{p.selling_price}</span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-warning" style={{ fontSize: '12px', display: 'inline-block', marginBottom: '2px' }}>
                        In Stock: {p.stock_quantity} Pcs
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Only {p.units_sold} Sold in Range</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 5: ADS & MARKETING ROAS PRODUCT BREAKDOWN --- */}
      {activeTab === 'roas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top ROAS Summary Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--warning)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Paid Ads Spend</span>
              <strong style={{ fontSize: '24px', display: 'block', color: 'var(--danger)', marginTop: '4px' }}>
                {currency}{Number(summary.paid_ads_cost || 0).toFixed(2)}
              </strong>
            </div>

            <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--success)' }}>
              <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '700' }}>Gross Sales Revenue</span>
              <strong style={{ fontSize: '24px', display: 'block', color: 'var(--success)', marginTop: '4px' }}>
                {currency}{Number(summary.gross_sales_revenue || 0).toFixed(2)}
              </strong>
            </div>

            <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-primary)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Overall Campaign ROAS Multiplier</span>
              <strong style={{ fontSize: '24px', display: 'block', color: 'var(--accent-primary)', marginTop: '4px' }}>
                {summary.roas_multiplier}x ROAS
              </strong>
            </div>
          </div>

          {/* Product-wise Ad Spend & ROAS Breakdown Table */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Product-wise Ad Spend & ROAS Performance Ranking</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Track which products generate highest Return on Ad Spend (ROAS) vs unprofitable campaign spend
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <button type="button" onClick={() => scrollTable('roas-table-container', 'left')} className="btn btn-secondary btn-sm">
                  <ChevronLeft size={14} /> Scroll Left
                </button>
                <button type="button" onClick={() => scrollTable('roas-table-container', 'right')} className="btn btn-secondary btn-sm">
                  Scroll Right <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div id="roas-table-container" className="table-wrapper" style={{ overflowX: 'auto', scrollBehavior: 'smooth' }}>
              <table className="data-table" style={{ minWidth: '950px' }}>
                <thead>
                  <tr>
                    <th>ROAS Rank & Product Name</th>
                    <th>Cost Price<br/><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(কেনাদাম)</span></th>
                    <th>Selling Price<br/><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(বিক্রিদাম)</span></th>
                    <th>Total Ad Spend<br/><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(-৳)</span></th>
                    <th>Sales Revenue<br/><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Generated</span></th>
                    <th>Units Sold</th>
                    <th>Cost Per Sale<br/><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(CPA)</span></th>
                    <th>ROAS Multiplier</th>
                    <th>Ad Campaign Status</th>
                  </tr>
                </thead>
                <tbody>
                  {adsPerformance.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No product ad campaigns recorded for this date range. Go to "Paid Ads Tracker" to log ad spend.
                      </td>
                    </tr>
                  ) : (
                    adsPerformance.map((p, idx) => {
                      const isHighRoas = p.roas >= 3.0;
                      const isProfitableRoas = p.roas >= 1.0;
                      const hasAdSpend = p.ad_spend_bdt > 0;

                      return (
                        <tr key={p.product_id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '800', width: '22px', height: '22px', borderRadius: '50%', background: isHighRoas ? 'var(--success)' : (isProfitableRoas ? 'var(--accent-primary)' : 'var(--danger)'), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                #{idx + 1}
                              </span>
                              <div>
                                <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{p.product_name}</strong>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: '13px' }}>{currency}{p.cost_price.toFixed(2)}</td>
                          <td style={{ fontSize: '13px', color: 'var(--accent-primary)' }}>{currency}{p.selling_price.toFixed(2)}</td>
                          <td style={{ fontWeight: '700', color: hasAdSpend ? 'var(--danger)' : 'var(--text-muted)' }}>
                            {hasAdSpend ? `-${currency}${p.ad_spend_bdt.toFixed(2)}` : 'No Direct Ad'}
                          </td>
                          <td style={{ fontWeight: '700', color: 'var(--success)' }}>
                            {currency}{p.gross_revenue.toFixed(2)}
                          </td>
                          <td style={{ fontSize: '13px', fontWeight: '600' }}>{p.units_sold} Pcs</td>
                          <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {p.cpa > 0 ? `${currency}${p.cpa.toFixed(2)} / sale` : 'N/A'}
                          </td>
                          <td>
                            <strong style={{ fontSize: '16px', color: isHighRoas ? 'var(--success)' : (isProfitableRoas ? 'var(--accent-primary)' : 'var(--danger)') }}>
                              {hasAdSpend ? `${p.roas.toFixed(2)}x` : 'N/A'}
                            </strong>
                          </td>
                          <td>
                            {hasAdSpend ? (
                              isHighRoas ? (
                                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Flame size={12} />
                                  <span>🔥 Winner (High ROAS)</span>
                                </span>
                              ) : isProfitableRoas ? (
                                <span className="badge badge-info">
                                  <span>🟢 Profitable Campaign</span>
                                </span>
                              ) : (
                                <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <AlertTriangle size={12} />
                                  <span>⚠️ Unprofitable Spend</span>
                                </span>
                              )
                            ) : (
                              <span className="badge badge-secondary">Organic Sales</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 6: RISK AUDIT & LOSS-MAKING PRODUCTS --- */}
      {activeTab === 'risk' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Risk Executive Header Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid var(--danger)' }}>
              <span style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: '700' }}>Loss-Making Risk Products Count</span>
              <strong style={{ fontSize: '24px', display: 'block', color: 'var(--danger)', marginTop: '4px' }}>
                {riskProducts.length} Products at Loss Risk
              </strong>
            </div>

            <div className="glass-card" style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid var(--danger)' }}>
              <span style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: '700' }}>Total Net Capital Loss Amount</span>
              <strong style={{ fontSize: '24px', display: 'block', color: 'var(--danger)', marginTop: '4px' }}>
                -{currency}{Number(summary.total_risk_loss || 0).toFixed(2)}
              </strong>
            </div>
          </div>

          {/* Detailed Risk Products Table */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={20} />
                  <span>Risk Audit & Loss Products Table</span>
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Detailed audit of products generating net financial loss due to pricing, excessive ad spend, or courier return charges
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <button type="button" onClick={() => scrollTable('risk-table-container', 'left')} className="btn btn-secondary btn-sm">
                  <ChevronLeft size={14} /> Scroll Left
                </button>
                <button type="button" onClick={() => scrollTable('risk-table-container', 'right')} className="btn btn-secondary btn-sm">
                  Scroll Right <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div id="risk-table-container" className="table-wrapper" style={{ overflowX: 'auto', scrollBehavior: 'smooth' }}>
              <table className="data-table" style={{ minWidth: '950px' }}>
                <thead>
                  <tr>
                    <th>Risk Product Name & SKU</th>
                    <th>Cost Price<br/><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(কেনাদাম)</span></th>
                    <th>Selling Price<br/><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(বিক্রিদাম)</span></th>
                    <th>Sold / Returned<br/><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Quantity</span></th>
                    <th>Ad Spend / Return Fee<br/><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Loss (-৳)</span></th>
                    <th>Net BDT Real Loss<br/><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(নিট ক্ষতি)</span></th>
                    <th>Identified Risk Root Cause</th>
                    <th>Recommended Action</th>
                  </tr>
                </thead>
                <tbody>
                  {riskProducts.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--success)' }}>
                        🎉 Great news! No products are currently generating net financial loss. All products are profitable!
                      </td>
                    </tr>
                  ) : (
                    riskProducts.map(p => {
                      const isPriceLoss = p.selling_price < p.cost_price;

                      return (
                        <tr key={p.product_id} style={{ background: 'rgba(239, 68, 68, 0.02)' }}>
                          <td>
                            <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{p.product_name}</strong>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>
                          </td>
                          <td style={{ fontSize: '13px', fontWeight: '600' }}>
                            {currency}{p.cost_price.toFixed(2)}
                          </td>
                          <td style={{ fontSize: '13px', color: isPriceLoss ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: isPriceLoss ? '700' : 'normal' }}>
                            {currency}{p.selling_price.toFixed(2)}
                          </td>
                          <td style={{ fontSize: '13px' }}>
                            <div>{p.units_sold} Sold</div>
                            {p.units_returned > 0 && <div style={{ color: 'var(--danger)', fontWeight: '700' }}>{p.units_returned} Returned</div>}
                          </td>
                          <td style={{ fontSize: '13px', color: 'var(--danger)' }}>
                            {p.ad_spend_bdt > 0 && <div>Ads: -{currency}{p.ad_spend_bdt.toFixed(2)}</div>}
                            {p.return_charges > 0 && <div>Return: -{currency}{p.return_charges.toFixed(2)}</div>}
                            {p.ad_spend_bdt === 0 && p.return_charges === 0 && 'N/A'}
                          </td>
                          <td>
                            <strong style={{ fontSize: '16px', color: 'var(--danger)' }}>
                              -{currency}{Math.abs(p.net_real_profit).toFixed(2)}
                            </strong>
                          </td>
                          <td>
                            <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                              <ShieldAlert size={12} />
                              <span>{p.risk_reason}</span>
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-warning" style={{ fontSize: '11px' }}>
                              {p.risk_recommendation}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
