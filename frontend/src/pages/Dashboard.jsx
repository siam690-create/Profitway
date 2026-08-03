import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MetricCard } from '../components/MetricCard';
import { SimpleChart } from '../components/SimpleChart';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { 
  DollarSign, 
  TrendingUp, 
  Receipt, 
  Award, 
  AlertTriangle, 
  Package, 
  ShoppingBag,
  ArrowUpRight
} from 'lucide-react';

export const Dashboard = () => {
  const { dashboardData, currency, setActiveTab, authFetch } = useApp();
  const [filteredData, setFilteredData] = useState(null);

  const activeData = filteredData || dashboardData;

  if (!activeData) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading dashboard metrics...
      </div>
    );
  }

  const { summary, low_stock_products, recent_sales, daily_chart } = activeData;

  const handleFilterChange = async ({ startDate: s, endDate: e }) => {
    try {
      let url = '/api/dashboard/summary';
      if (s && e) {
        url += `?startDate=${s}&endDate=${e}`;
      }
      const res = await authFetch(url);
      const data = await res.json();
      if (res.ok) setFilteredData(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Bar with Date Range Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Executive Business Dashboard</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Real-time sales revenue, gross margin, expenses & net profit overview
          </p>
        </div>
        <DateRangeFilter onFilterChange={handleFilterChange} />
      </div>

      {/* Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        <MetricCard
          title="Total Revenue"
          value={`${currency}${summary.total_revenue.toLocaleString()}`}
          subtitle={`${summary.total_sales_count} Total Completed Orders`}
          icon={DollarSign}
          color="indigo"
        />

        <MetricCard
          title="Gross Profit"
          value={`${currency}${summary.gross_profit.toLocaleString()}`}
          subtitle={`COGS: ${currency}${summary.total_costOfGoods.toLocaleString()}`}
          icon={TrendingUp}
          color="emerald"
        />

        <MetricCard
          title="Operating Expenses"
          value={`${currency}${summary.total_expenses.toLocaleString()}`}
          subtitle="Shop Rent, Bills & Misc"
          icon={Receipt}
          color="rose"
        />

        <MetricCard
          title="Net Profit"
          value={`${currency}${summary.net_profit.toLocaleString()}`}
          subtitle={`Net Margin: ${summary.net_margin_pct}%`}
          badgeText={summary.net_profit >= 0 ? '+Profitable' : '-Loss'}
          icon={Award}
          color={summary.net_profit >= 0 ? 'emerald' : 'rose'}
        />

        <MetricCard
          title="Low Stock Warning"
          value={summary.low_stock_count}
          subtitle={`${summary.total_products} Total Product SKUs`}
          badgeText={summary.low_stock_count > 0 ? 'Action Required' : 'Optimal'}
          icon={AlertTriangle}
          color={summary.low_stock_count > 0 ? 'amber' : 'blue'}
        />
      </div>

      {/* Sales & Profit Chart + Quick Action Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Sales & Profit Trend</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Daily performance for the last 7 days</p>
            </div>
            <button onClick={() => setActiveTab('reports')} className="btn btn-secondary btn-sm">
              <span>View P&L Report</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
          <SimpleChart data={daily_chart} currency={currency} />
        </div>

        {/* Quick Inventory Summary Box */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>Stock Valuation</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>Total cash tied in stock</p>

            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Inventory Cost Value</span>
              <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {currency}{summary.total_inventory_cost.toLocaleString()}
              </h3>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Estimated Retail Sales Value</span>
              <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--success)' }}>
                {currency}{summary.total_inventory_value.toLocaleString()}
              </h3>
            </div>
          </div>

          <button onClick={() => setActiveTab('pos')} className="btn btn-primary" style={{ marginTop: '20px', width: '100%' }}>
            <ShoppingBag size={16} />
            <span>Open POS / Record Sale</span>
          </button>
        </div>
      </div>

      {/* Low Stock Alert Table & Recent Sales */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Low Stock Alerts */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#f59e0b" />
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Low Stock Items</h3>
            </div>
            <button onClick={() => setActiveTab('inventory')} className="btn btn-secondary btn-sm">
              Manage Stock
            </button>
          </div>

          {low_stock_products.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>
              🎉 All products have sufficient stock!
            </p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Stock</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {low_stock_products.map(item => (
                    <tr key={item.id}>
                      <td>
                        <strong style={{ display: 'block', fontSize: '13px' }}>{item.name}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.category_name}</span>
                      </td>
                      <td style={{ fontSize: '12px' }}>{item.sku}</td>
                      <td>
                        <span className={`badge ${item.stock_quantity <= 0 ? 'badge-danger' : 'badge-warning'}`}>
                          {item.stock_quantity} {item.unit}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => setActiveTab('inventory')} className="btn btn-secondary btn-sm">
                          Restock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Sales Log */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={18} color="#6366f1" />
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Recent Sales</h3>
            </div>
            <button onClick={() => setActiveTab('reports')} className="btn btn-secondary btn-sm">
              View History
            </button>
          </div>

          {recent_sales.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>
              No sales logged yet.
            </p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_sales.map(sale => (
                    <tr key={sale.id}>
                      <td>
                        <strong style={{ fontSize: '13px', color: 'var(--accent-primary)' }}>{sale.invoice_no}</strong>
                      </td>
                      <td style={{ fontSize: '13px' }}>{sale.customer_name}</td>
                      <td style={{ fontWeight: '600' }}>{currency}{Number(sale.total_amount).toFixed(2)}</td>
                      <td>
                        <span className="badge badge-success">
                          +{currency}{Number(sale.gross_profit).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
