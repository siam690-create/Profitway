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
import ResellerPortal from './pages/ResellerPortal';
import { Settings } from './pages/Settings';
import { Subscription } from './pages/Subscription';
import { Support } from './pages/Support';

import StaffPortal from './pages/StaffPortal';
import TeamChat from './pages/TeamChat';

import { TopProgressBar } from './components/TopProgressBar';
import { ToastNotification } from './components/ToastNotification';

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
  const { view, user, activeTab, topLoading, topProgress, toast, setToast } = useApp();

  if (view === 'landing') {
    return (
      <>
        <TopProgressBar isLoading={topLoading} progress={topProgress} />
        <ToastNotification toast={toast} onClose={() => setToast(null)} />
        <LandingPage />
      </>
    );
  }

  const role = (user?.role || '').toLowerCase();
  const isSuperAdmin = role === 'super_admin' || role === 'saas_admin' || role === 'admin';

  if (activeTab === 'saas-master' && isSuperAdmin) {
    return (
      <div className="app-container">
        <TopProgressBar isLoading={topLoading} progress={topProgress} />
        <ToastNotification toast={toast} onClose={() => setToast(null)} />
        <Sidebar />
        <div className="main-content">
          <Header />
          <main className="page-wrapper">
            <SuperAdminDashboard />
          </main>
        </div>
      </div>
    );
  }

  // Permission Checks for Staff/Employee roles
  const hasModulePermission = (moduleKey) => {
    if (isSuperAdmin || role === 'owner') return true;
    try {
      const perms = user?.permissions ? (typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions) : {};
      return Boolean(perms[moduleKey]);
    } catch (e) {
      return false;
    }
  };

  const renderActivePage = () => {
    if (!isSuperAdmin && role !== 'owner' && !hasModulePermission(activeTab)) {
      return (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', margin: '20px' }}>
          <h3 style={{ fontSize: '20px', color: 'var(--danger)', fontWeight: '700' }}>🔒 Access Restricted</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            You do not have permission to access the "{activeTab}" module. Please contact your business owner or admin.
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
      case 'reseller-portal': return <ResellerPortal />;
      case 'settings': return <Settings />;
      case 'subscription': return <Subscription />;
      case 'support': return <Support />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <TopProgressBar isLoading={topLoading} progress={topProgress} />
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
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
