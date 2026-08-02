import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Receipt, 
  TrendingUp, 
  Settings, 
  Sun, 
  Moon,
  Store,
  LogOut,
  Users,
  FileText,
  Truck,
  Undo2,
  Megaphone,
  BarChart3,
  Landmark,
  ShoppingBag,
  HelpCircle,
  CreditCard
} from 'lucide-react';

export const Sidebar = () => {
  const { activeTab, setActiveTab, theme, toggleTheme, cart, dashboardData, tenant, user, logout } = useApp();

  const lowStockCount = dashboardData?.summary?.low_stock_count || 0;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'POS / New Sale', icon: ShoppingCart, badge: cart.length > 0 ? cart.length : null, badgeType: 'success' },
    { id: 'wholesale', label: 'Wholesale B2B Sales', icon: ShoppingBag },
    { id: 'inventory', label: 'Inventory / Stock', icon: Package, badge: lowStockCount > 0 ? lowStockCount : null, badgeType: 'warning' },
    { id: 'purchases', label: 'Purchases & Suppliers', icon: Truck },
    { id: 'orders', label: 'Sales & Orders', icon: FileText },
    { id: 'returns', label: 'Courier Returns', icon: Undo2 },
    { id: 'ads', label: 'Paid Ads Tracker', icon: Megaphone },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'reports', label: 'Profit & Loss', icon: TrendingUp },
    { id: 'finance', label: 'Finance & Dena-Pawna', icon: Landmark },
    { id: 'analytics', label: 'Analytics Breakdown', icon: BarChart3 },
    { id: 'staff', label: 'Staff & Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'subscription', label: 'Subscription Plan', icon: CreditCard },
    { id: 'support', label: 'Support & Help Desk', icon: HelpCircle },
  ];

  const userPermissions = user?.permissions;
  const isOwnerOrAdmin = user?.role === 'owner' || user?.role === 'superadmin';

  const visibleNavItems = navItems.filter(item => {
    if (isOwnerOrAdmin || !userPermissions || !Array.isArray(userPermissions)) return true;
    if (item.id === 'dashboard') return true;
    return userPermissions.includes(item.id);
  });

  const isTrial = tenant?.subscription_status === 'trial';

  return (
    <aside style={styles.sidebar}>
      {/* App & Tenant Brand Header */}
      <div style={styles.brand}>
        <div style={styles.logoIcon}>
          <Store size={22} color="#ffffff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={styles.brandTitle} title={tenant?.shop_name}>{tenant?.shop_name || 'Profitway'}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', flexWrap: 'wrap' }}>
            <span className={`badge ${isTrial ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
              {isTrial ? '14-Day Free Trial' : 'Active Plan'}
            </span>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent-primary)', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
              {tenant?.shop_code || `SHOP-${1000 + (tenant?.id || 1)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={styles.nav}>
        {visibleNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                ...styles.navButton,
                ...(isActive ? styles.navButtonActive : {})
              }}
            >
              <Icon size={19} color={isActive ? '#ffffff' : 'var(--text-secondary)'} />
              <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
              {item.badge && (
                <span className={`badge ${item.badgeType === 'warning' ? 'badge-warning' : 'badge-success'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Info & Logout Footer */}
      <div style={styles.footer}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
          <div>
            <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{user?.name}</strong>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.role?.toUpperCase()}</span>
          </div>

          <button onClick={logout} className="btn btn-secondary btn-icon" title="Sign Out">
            <LogOut size={16} color="var(--danger)" />
          </button>
        </div>

        <button onClick={toggleTheme} style={styles.themeToggle}>
          {theme === 'dark' ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#6366f1" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: '260px',
    backgroundColor: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brand: {
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid var(--border-color)',
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-hover))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },
  brandTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: 'var(--text-primary)',
    lineHeight: '1.2',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  nav: {
    flex: 1,
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflowY: 'auto',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  navButtonActive: {
    backgroundColor: 'var(--accent-primary)',
    color: '#ffffff',
    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
  },
  footer: {
    padding: '16px 20px',
    borderTop: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
  },
  themeToggle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }
};
