import React, { Component } from 'react';
import { useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LandingPage } from './pages/LandingPage';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Analytics } from './pages/Analytics';
import { Purchases } from './pages/Purchases';
import { Returns } from './pages/Returns';
import { PaidAds } from './pages/PaidAds';
import { POS } from './pages/POS';
import { Wholesale } from './pages/Wholesale';
import { Orders } from './pages/Orders';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { Finance } from './pages/Finance';
import { StaffManager } from './pages/StaffManager';
import { TaskManager } from './pages/TaskManager';
import { ResellerParcels } from './pages/ResellerParcels';
import { Settings } from './pages/Settings';
import { Subscription } from './pages/Subscription';
import { Support } from './pages/Support';

import StaffPortal from './pages/StaffPortal';
import TeamChat from './pages/TeamChat';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Render Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '60px', textAlign: 'center', color: '#ffffff', background: '#0f172a', minHeight: '100vh' }}>
          <h2>Something went wrong loading this view.</h2>
          <p style={{ color: '#94a3b8', margin: '16px 0' }}>{this.state.error?.toString()}</p>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Clear Cache & Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const { view, user, activeTab } = useApp();

  if (view === 'landing') {
    return <LandingPage />;
  }

  if (view === 'superadmin' || user?.role === 'superadmin') {
    return <SuperAdminDashboard />;
  }

  const userPermissions = user?.permissions;
  const isOwnerOrAdmin = user?.role === 'owner' || user?.role === 'superadmin';

  const hasModulePermission = (tabId) => {
    if (isOwnerOrAdmin || !userPermissions || !Array.isArray(userPermissions)) return true;
    if (tabId === 'staff-portal' || tabId === 'settings' || tabId === 'subscription' || tabId === 'support') return true;
    if (tabId === 'team-chat') return userPermissions.includes('chat') || userPermissions.includes('team-chat');
    return userPermissions.includes(tabId);
  };

  const renderActivePage = () => {
    if (!hasModulePermission(activeTab)) {
      return (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', margin: '40px auto', maxWidth: '560px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '32px' }}>🔒</span>
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#ef4444' }}>Access Restricted (মডিউল অনুমতি নেই)</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            আপনার স্টাফ অ্যাকাউন্টে <strong>{activeTab.toUpperCase()}</strong> মডিউল বা ড্যাশবোর্ড দেখার অনুমতি দেওয়া হয়নি। প্রয়োজনে শপ ওনারের সাথে যোগাযোগ করুন।
          </p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'staff-portal': return <StaffPortal />;
      case 'team-chat': return <TeamChat />;
      case 'inventory': return <Inventory />;
      case 'analytics': return <Analytics />;
      case 'purchases': return <Purchases />;
      case 'returns': return <Returns />;
      case 'ads': return <PaidAds />;
      case 'pos': return <POS />;
      case 'wholesale': return <Wholesale />;
      case 'orders': return <Orders />;
      case 'expenses': return <Expenses />;
      case 'reports': return <Reports />;
      case 'finance': return <Finance />;
      case 'staff': return <StaffManager />;
      case 'tasks': return <TaskManager />;
      case 'reseller-parcels': return <ResellerParcels />;
      case 'settings': return <Settings />;
      case 'subscription': return <Subscription />;
      case 'support': return <Support />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="page-wrapper">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

export default App;
