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
import { Settings } from './pages/Settings';
import { Subscription } from './pages/Subscription';
import { Support } from './pages/Support';

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

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
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
