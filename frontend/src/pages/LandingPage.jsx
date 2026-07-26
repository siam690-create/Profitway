import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Store, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Check, 
  ArrowRight, 
  CheckCircle, 
  BarChart3, 
  ShoppingBag, 
  Layers, 
  X,
  Sparkles,
  Lock
} from 'lucide-react';

export const LandingPage = () => {
  const { plans, setView, login, registerTenant, loading } = useApp();
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Signup Form State
  const [signupForm, setSignupForm] = useState({
    shop_name: '',
    owner_name: '',
    email: '',
    password: '',
    phone: '',
    currency: '৳'
  });

  // Login Form State
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [authError, setAuthError] = useState('');

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const res = await registerTenant(signupForm);
    if (!res.success) {
      setAuthError(res.error);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const res = await login(loginForm.email, loginForm.password);
    if (!res.success) {
      setAuthError(res.error);
    }
  };

  // Quick Demo Login Handler
  const handleQuickDemo = async (email, password) => {
    setLoginForm({ email, password });
    setShowLoginModal(true);
    await login(email, password);
  };

  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', fontFamily: 'var(--font-family-body)' }}>
      {/* Header Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 48px', borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(10px)', sticky: 'top', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.5)' }}>
            <Store size={24} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-family-heading)' }}>Profitway</h2>
            <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: '600', letterSpacing: '0.05em' }}>SaaS CLOUD PLATFORM</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => setShowLoginModal(true)} className="btn btn-secondary">
            Sign In
          </button>
          <button onClick={() => setShowSignupModal(true)} className="btn btn-primary">
            <span>Start 14-Day Free Trial</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '80px 24px 60px 24px', textAlign: 'center', maxWidth: '1100px', margin: '0 auto' }}>
        <div className="badge badge-info" style={{ padding: '8px 16px', fontSize: '13px', marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={15} color="var(--accent-primary)" />
          <span>Next-Gen Stock & Profit Management for Retail Shops & SMEs</span>
        </div>

        <h1 style={{ fontSize: '52px', fontWeight: '800', lineHeight: '1.15', marginBottom: '20px', fontFamily: 'var(--font-family-heading)' }}>
          Track Inventory, Record POS Sales & Compute <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Live Profits Instantly</span>
        </h1>

        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '780px', margin: '0 auto 36px auto', lineHeight: '1.6' }}>
          Zero page reloads. Automated stock deduction upon sales checkout. Comprehensive Profit & Loss financial reporting tailored for business growth.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowSignupModal(true)} className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }}>
            <span>Start Free 14-Day Trial</span>
            <ArrowRight size={18} />
          </button>

          <button onClick={() => handleQuickDemo('owner@demostore.com', 'demo123')} className="btn btn-success" style={{ padding: '14px 28px', fontSize: '16px' }}>
            <Zap size={18} />
            <span>Try Live Demo Shop</span>
          </button>

          <button onClick={() => handleQuickDemo('admin@profitway.bd', 'admin123')} className="btn btn-secondary" style={{ padding: '14px 24px', fontSize: '16px' }}>
            <Lock size={18} />
            <span>Super Admin Portal</span>
          </button>
        </div>

        {/* Feature Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '48px', color: 'var(--text-secondary)', fontSize: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} color="var(--success)" />
            <span>No Credit Card Required</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} color="var(--success)" />
            <span>Setup in 30 Seconds</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} color="var(--success)" />
            <span>bKash, Nagad & Card Ready</span>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{ padding: '60px 24px 100px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '12px' }}>Simple, Transparent Subscription Plans</h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>Choose the best plan for your shop size</p>

          {/* Billing Cycle Toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '30px', border: '1px solid var(--border-color)', marginTop: '24px' }}>
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                background: billingCycle === 'monthly' ? 'var(--accent-primary)' : 'transparent',
                color: billingCycle === 'monthly' ? '#fff' : 'var(--text-secondary)',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Monthly Billing
            </button>

            <button
              onClick={() => setBillingCycle('yearly')}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                background: billingCycle === 'yearly' ? 'var(--success)' : 'transparent',
                color: billingCycle === 'yearly' ? '#fff' : 'var(--text-secondary)',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Yearly Billing</span>
              <span className="badge badge-warning" style={{ fontSize: '10px', padding: '2px 6px' }}>2 Months Free</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {plans.map(plan => {
            const isPro = plan.code === 'pro';
            const price = billingCycle === 'monthly' ? plan.price_monthly : Math.round(plan.price_yearly / 12);

            return (
              <div
                key={plan.id}
                className="glass-card"
                style={{
                  padding: '32px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  border: isPro ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  transform: isPro ? 'scale(1.03)' : 'none',
                  boxShadow: isPro ? 'var(--shadow-glow)' : 'var(--shadow-sm)'
                }}
              >
                {isPro && (
                  <span style={{ position: 'absolute', top: '-14px', right: '24px', background: 'var(--accent-gradient)', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '4px 12px', borderRadius: '20px', textTransform: 'uppercase' }}>
                    Most Popular
                  </span>
                )}

                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>{plan.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-primary)' }}>
                      ৳{Number(price).toLocaleString()}
                    </span>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ month</span>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Check size={16} color="var(--success)" />
                      <span>Up to <strong>{plan.max_products.toLocaleString()} Products</strong></span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Check size={16} color="var(--success)" />
                      <span>Up to <strong>{plan.max_staff} Staff Registers</strong></span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Check size={16} color="var(--success)" />
                      <span>Real-time POS Checkout</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Check size={16} color="var(--success)" />
                      <span>Live Stock & Profit Calculation</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Check size={16} color="var(--success)" />
                      <span>Printable Invoices & P&L Statement</span>
                    </li>
                  </ul>
                </div>

                <button onClick={() => setShowSignupModal(true)} className={`btn ${isPro ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', padding: '12px' }}>
                  <span>Start 14-Day Free Trial</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Free Trial Registration Modal */}
      {showSignupModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Create Your Shop Account</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Get instant 14-day free access. No credit card required.</p>
              </div>
              <button onClick={() => setShowSignupModal(false)} className="btn btn-secondary btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSignupSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {authError && (
                  <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
                    {authError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Shop / Business Name</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Dhaka Gadget Shop"
                    value={signupForm.shop_name}
                    onChange={(e) => setSignupForm({ ...signupForm, shop_name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Owner Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="Your Name"
                      value={signupForm.owner_name}
                      onChange={(e) => setSignupForm({ ...signupForm, owner_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="017xxxxxxxx"
                      value={signupForm.phone}
                      onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    required
                    placeholder="name@company.com"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-input"
                    required
                    placeholder="••••••••"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowSignupModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating Shop Account...' : 'Start Free 14-Day Trial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Sign In to Your Account</h3>
              <button onClick={() => setShowLoginModal(false)} className="btn btn-secondary btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLoginSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {authError && (
                  <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
                    {authError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    required
                    placeholder="name@company.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-input"
                    required
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowLoginModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
