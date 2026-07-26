import React from 'react';
import { useApp } from '../context/AppContext';
import { RefreshCw, ShoppingBag, AlertTriangle, Truck, Undo2, Megaphone, BarChart3 } from 'lucide-react';

export const Header = () => {
  const { activeTab, setActiveTab, refreshAllData, loading, dashboardData, tenant } = useApp();

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Executive Dashboard';
      case 'inventory': return 'Inventory & Stock Management';
      case 'analytics': return 'Product & Business Analytics Breakdown';
      case 'purchases': return 'Stock Restock & Supplier Purchases';
      case 'returns': return 'Courier Return & Restock Manager';
      case 'ads': return 'Paid Ads & Marketing Cost Tracker';
      case 'pos': return 'Point of Sale (POS) & New Sale';
      case 'orders': return 'Sales & Orders History';
      case 'expenses': return 'Operating Expense Logger';
      case 'reports': return 'Profit & Loss Financial Statement';
      case 'staff': return 'Staff & Users Management';
      case 'settings': return 'System Settings & Categories';
      default: return 'Dashboard';
    }
  };

  const lowStockCount = dashboardData?.summary?.low_stock_count || 0;

  return (
    <header style={styles.header}>
      <div>
        <h1 style={styles.title}>{getTitle()}</h1>
        <p style={styles.subtitle}>
          Shop: <strong>{tenant?.shop_name}</strong> • Real-time inventory & live profit calculation
        </p>
      </div>

      <div style={styles.actions}>
        {/* Low Stock Warning Alert Pill */}
        {lowStockCount > 0 && (
          <button 
            onClick={() => setActiveTab('inventory')} 
            className="badge badge-warning" 
            style={{ padding: '8px 14px', fontSize: '13px', cursor: 'pointer', border: 'none' }}
          >
            <AlertTriangle size={15} />
            <span>{lowStockCount} Items Low in Stock</span>
          </button>
        )}

        {/* Quick Analytics Button */}
        <button onClick={() => setActiveTab('analytics')} className="btn btn-secondary btn-sm">
          <BarChart3 size={15} />
          <span>Analytics</span>
        </button>

        {/* Quick Log Paid Ad Button */}
        <button onClick={() => setActiveTab('ads')} className="btn btn-secondary btn-sm">
          <Megaphone size={15} />
          <span>+ Log Paid Ad</span>
        </button>

        {/* Refresh Data */}
        <button 
          onClick={refreshAllData} 
          className="btn btn-secondary btn-sm" 
          title="Refresh Data"
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>

        {/* Quick New Sale */}
        <button onClick={() => setActiveTab('pos')} className="btn btn-success btn-sm">
          <ShoppingBag size={15} />
          <span>+ Record Sale</span>
        </button>
      </div>
    </header>
  );
};

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 32px',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
    backdropFilter: 'blur(10px)'
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginTop: '2px'
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  }
};
