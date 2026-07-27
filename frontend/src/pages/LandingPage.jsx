import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  ShieldCheck, 
  Check, 
  Zap, 
  ArrowRight, 
  BarChart3, 
  Receipt, 
  Truck, 
  Megaphone, 
  AlertTriangle, 
  Landmark, 
  Printer, 
  Users, 
  HelpCircle, 
  CreditCard, 
  Crown,
  Sparkles,
  Lock,
  X,
  Store,
  Clock,
  UserCheck
} from 'lucide-react';

export const LandingPage = () => {
  const { login, registerTenant } = useApp();
  const [billingCycle, setBillingCycle] = useState('monthly');
  
  // Auth Modal States: null, 'login', 'signup', 'superadmin', 'pending_notice'
  const [authModal, setAuthModal] = useState(null);

  // Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [signupForm, setSignupForm] = useState({
    shop_name: '',
    owner_name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [signupError, setSignupError] = useState('');

  const [registeredNotice, setRegisteredNotice] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Auto detect if URL is /superadmin
  useEffect(() => {
    if (window.location.pathname.toLowerCase().includes('/superadmin') || window.location.hash.toLowerCase().includes('/superadmin')) {
      setAuthModal('superadmin');
      setLoginEmail('admin@profitway.bd');
    }
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setAuthLoading(true);

    const res = await login(loginEmail, loginPassword);
    setAuthLoading(false);

    if (!res.success) {
      setLoginError(res.error);
    } else {
      setAuthModal(null);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupError('');
    setAuthLoading(true);

    const res = await registerTenant(
      signupForm.shop_name,
      signupForm.owner_name,
      signupForm.email,
      signupForm.password,
      1
    );
    setAuthLoading(false);

    if (res.success) {
      setRegisteredNotice({
        shop_name: res.shop_name,
        shop_code: res.shop_code,
        message: res.message
      });
      setAuthModal('pending_notice');
    } else {
      setSignupError(res.error);
    }
  };

  const handleDemoShopLogin = async () => {
    setAuthLoading(true);
    await login('owner@demostore.com', 'demo123');
    setAuthLoading(false);
  };

  return (
    <div style={{ background: '#0a0f1d', color: '#f8fafc', minHeight: '100vh', fontFamily: "'Outfit', 'Segoe UI', sans-serif" }}>
      
      {/* 🌟 Top Navigation Bar */}
      <nav style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10, 15, 29, 0.85)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)' }}>
              <TrendingUp size={22} color="#fff" />
            </div>
            <div>
              <span style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px', background: 'linear-gradient(90deg, #ffffff, #c7d2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Profitway
              </span>
              <span style={{ fontSize: '10px', color: '#818cf8', fontWeight: '800', display: 'block', letterSpacing: '1px', marginTop: '-4px' }}>
                POS & BUSINESS AUDIT SAAS
              </span>
            </div>
          </div>

          {/* Clean General Navigation Header Buttons (Login & Sign Up) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => { setAuthModal('login'); setLoginEmail(''); setLoginPassword(''); setLoginError(''); }}
              style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '800', cursor: 'pointer' }}
            >
              Login
            </button>

            <button 
              onClick={() => { setAuthModal('signup'); setSignupError(''); }}
              style={{ background: 'linear-gradient(90deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 6px 16px rgba(99, 102, 241, 0.35)', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Sign Up</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </nav>

      {/* 🚀 Hero Section */}
      <header style={{ padding: '80px 24px 60px', textAlign: 'center', maxWidth: '1100px', margin: '0 auto', position: 'relative' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '8px 18px', borderRadius: '30px', marginBottom: '24px' }}>
          <Sparkles size={16} color="#818cf8" />
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#c7d2fe', letterSpacing: '0.5px' }}>
            Complete POS, Wholesale B2B, Paid Ads ROAS & Finance Management Platform
          </span>
        </div>

        <h1 style={{ fontSize: '48px', fontWeight: '900', lineHeight: '1.15', letterSpacing: '-1px', marginBottom: '20px' }}>
          Manage Inventory, POS Sales, Wholesale Pawna & <span style={{ background: 'linear-gradient(90deg, #6366f1, #ec4899, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Live Business Profits</span>
        </h1>

        <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '800px', margin: '0 auto 36px', lineHeight: '1.6' }}>
          An all-in-one SaaS solution designed for retail shops, wholesalers, and e-commerce SMEs. Track live profit breakdown, automated courier return date reversals, bank accounts & liabilities audit, paid ads CPA/ROAS, and customizable thermal/A4 invoice printing.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setAuthModal('signup')} 
            style={{ background: 'linear-gradient(90deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', padding: '16px 36px', borderRadius: '14px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 12px 28px rgba(99, 102, 241, 0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>Start Free 14-Day Trial</span>
            <ArrowRight size={18} />
          </button>

          <button 
            onClick={handleDemoShopLogin} 
            style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '16px 32px', borderRadius: '14px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Zap size={18} />
            <span>Try Live Demo Shop</span>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '32px', fontSize: '13px', color: '#64748b' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#10b981" /> No Credit Card Required</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#10b981" /> Setup in 30 Seconds</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#10b981" /> Super Admin Approval Protected</span>
        </div>
      </header>

      {/* 🛠️ Comprehensive Platform Features Showcase (10 Full Modules) */}
      <section style={{ padding: '60px 24px', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '900' }}>Everything Your Business Needs to Grow</h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', marginTop: '8px' }}>
            10 specialized business modules built to eliminate manual calculation and maximize shop profitability
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {[
            {
              icon: Receipt,
              color: '#6366f1',
              title: 'POS Retail Cash Register & Barcode',
              desc: 'Ultra-fast checkout with barcode scanning, instant stock deduction, discount calculations, and receipt generation.'
            },
            {
              icon: ShoppingBag,
              color: '#f59e0b',
              title: 'Wholesale B2B Sales & Pawna Audit',
              desc: 'Manage party customers, credit sales, due pawna balances, cash receipts, and printable wholesale invoices.'
            },
            {
              icon: Truck,
              color: '#ec4899',
              title: 'Courier Returns Date Reversal',
              desc: 'Record paperfly/courier returns by exact entry date for perfectly accurate daily analytics and profit reversal.'
            },
            {
              icon: Megaphone,
              color: '#8b5cf6',
              title: 'Paid Ads CPA Tracker & ROAS Multiplier',
              desc: 'Track marketing ad spend per product to measure cost-per-acquisition (CPA), return on ad spend (ROAS), and net profit.'
            },
            {
              icon: AlertTriangle,
              color: '#ef4444',
              title: 'Loss Audit & Risk Products Engine',
              desc: 'Dedicated Risk section pinpointing loss-making sales, negative margins, and high-return problematic products.'
            },
            {
              icon: Landmark,
              color: '#10b981',
              title: 'Finance, Accounts & Payroll Suite',
              desc: 'Manage cash and bank account balances, manual fund deposits, fund transfers, liabilities (Dena), receivables (Pawna), and staff salary payroll.'
            },
            {
              icon: TrendingUp,
              color: '#06b6d4',
              title: 'Investment Capital & Repayments',
              desc: 'Track investor deposits, capital injections, repayment schedules, and investor ledger balances.'
            },
            {
              icon: Printer,
              color: '#3b82f6',
              title: 'Print Customization (A3, A4, A5, Thermal 80/58mm)',
              desc: 'Customize paper size formats and toggle headers (Shop Name, Address, VAT No, Customer Info, Terms & Barcodes).'
            },
            {
              icon: Users,
              color: '#10b981',
              title: 'Multi-Staff Permissions Manager',
              desc: 'Create staff accounts with granular role permissions (POS cashier, inventory manager, financial accountant).'
            },
            {
              icon: HelpCircle,
              color: '#a855f7',
              title: '24/7 Support Desk Ticket System',
              desc: 'Integrated help desk allowing shop owners to open support tickets with direct email notifications to Super Admin.'
            }
          ].map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div 
                key={idx} 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)', 
                  borderRadius: '18px', 
                  padding: '28px',
                  transition: 'transform 0.3s ease, border-color 0.3s ease'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, marginBottom: '18px' }}>
                  <IconComp size={24} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', marginBottom: '8px' }}>{item.title}</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 💳 Subscription Plans Catalog */}
      <section style={{ padding: '60px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '900' }}>Simple, Transparent Subscription Plans</h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', marginTop: '8px' }}>Choose the best plan for your shop size</p>

          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', padding: '6px', borderRadius: '30px', border: '1px solid rgba(255, 255, 255, 0.1)', marginTop: '24px' }}>
            <button 
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '8px 20px',
                borderRadius: '24px',
                border: 'none',
                background: billingCycle === 'monthly' ? '#6366f1' : 'transparent',
                color: '#fff',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Monthly Billing
            </button>
            <button 
              onClick={() => setBillingCycle('yearly')}
              style={{
                padding: '8px 20px',
                borderRadius: '24px',
                border: 'none',
                background: billingCycle === 'yearly' ? '#6366f1' : 'transparent',
                color: '#fff',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Yearly Billing</span>
              <span style={{ fontSize: '10px', background: '#f59e0b', color: '#000', padding: '2px 6px', borderRadius: '10px', fontWeight: '900' }}>2 Months Free</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Starter Plan */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Starter Plan</h3>
              <div style={{ margin: '16px 0', fontSize: '36px', fontWeight: '900' }}>
                {billingCycle === 'yearly' ? '৳9,990' : '৳999'}<span style={{ fontSize: '13px', color: '#64748b' }}>/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
              </div>
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', padding: '16px 0', margin: '16px 0', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>✓ Up to <strong>300 Products</strong></div>
                <div>✓ Up to <strong>2 Staff Registers</strong></div>
                <div>✓ Full POS & Wholesale Access</div>
                <div>✓ Profit & Loss Financial Audit</div>
              </div>
            </div>
            <button onClick={() => setAuthModal('signup')} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: 'none', fontWeight: '800', cursor: 'pointer' }}>Sign Up Free Account</button>
          </div>

          {/* Pro Plan */}
          <div style={{ background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.1))', border: '2px solid #6366f1', borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#6366f1', color: '#fff', padding: '4px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '900' }}>🔥 MOST POPULAR</span>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Pro Plan</h3>
              <div style={{ margin: '16px 0', fontSize: '36px', fontWeight: '900', color: '#818cf8' }}>
                {billingCycle === 'yearly' ? '৳24,990' : '৳2,499'}<span style={{ fontSize: '13px', color: '#64748b' }}>/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
              </div>
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', padding: '16px 0', margin: '16px 0', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>✓ Up to <strong>2,500 Products</strong></div>
                <div>✓ Up to <strong>5 Staff Registers</strong></div>
                <div>✓ Full Paid Ads CPA & ROAS Tracker</div>
                <div>✓ Bank Accounts & Payroll Suite</div>
                <div>✓ Courier Returns Date Audit</div>
              </div>
            </div>
            <button onClick={() => setAuthModal('signup')} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'linear-gradient(90deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', fontWeight: '800', cursor: 'pointer', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35)' }}>Sign Up Free Account</button>
          </div>

          {/* Enterprise Plan */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Enterprise Plan</h3>
              <div style={{ margin: '16px 0', fontSize: '36px', fontWeight: '900' }}>
                {billingCycle === 'yearly' ? '৳49,990' : '৳4,999'}<span style={{ fontSize: '13px', color: '#64748b' }}>/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
              </div>
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', padding: '16px 0', margin: '16px 0', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>✓ <strong>Unlimited Products</strong> (99,999)</div>
                <div>✓ Up to <strong>50 Staff Registers</strong></div>
                <div>✓ Dedicated Account Manager</div>
                <div>✓ Priority 24/7 Support Desk</div>
              </div>
            </div>
            <button onClick={() => setAuthModal('signup')} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: 'none', fontWeight: '800', cursor: 'pointer' }}>Sign Up Free Account</button>
          </div>
        </div>
      </section>

      {/* 📄 Footer */}
      <footer style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '40px 24px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
        <p>© 2026 Profitway Platform (profitway.bd). All rights reserved.</p>
        <p style={{ marginTop: '6px' }}>Designed & Engineered for High-Growth Retail & Wholesale Businesses in Bangladesh.</p>
      </footer>

      {/* 🔐 AUTH MODAL SUITE (Login, Sign Up, Super Admin & Pending Approval Notice) */}
      {authModal && (
        <div className="modal-overlay" style={{ background: 'rgba(10, 15, 29, 0.85)', backdropFilter: 'blur(10px)', zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '440px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '20px', padding: '28px', color: '#fff' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {authModal === 'superadmin' ? <Lock size={20} color="#a855f7" /> : <Store size={20} color="#6366f1" />}
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>
                  {authModal === 'login' && 'Account Login'}
                  {authModal === 'signup' && 'Create Free Shop Account'}
                  {authModal === 'superadmin' && 'Super Admin Secret Portal'}
                  {authModal === 'pending_notice' && 'Signup Request Submitted'}
                </h3>
              </div>

              <button onClick={() => setAuthModal(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* --- TAB 1: GENERAL LOGIN (Owner, Staff, Manager, Cashier) --- */}
            {authModal === 'login' && (
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loginError && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '12px', color: '#f87171' }}>
                    {loginError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1' }}>Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    required
                    placeholder="user@mystore.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1' }}>Password</label>
                  <input
                    type="password"
                    className="form-input"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '10px', fontWeight: '800', background: 'linear-gradient(90deg, #6366f1, #4f46e5)' }} disabled={authLoading}>
                  {authLoading ? 'Authenticating...' : 'Sign In to Dashboard'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '13px', color: '#94a3b8' }}>
                  Don't have a shop account yet?{' '}
                  <span onClick={() => { setAuthModal('signup'); setSignupError(''); }} style={{ color: '#818cf8', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}>
                    Sign Up
                  </span>
                </div>
              </form>
            )}

            {/* --- TAB 2: SHOP OWNER SIGN UP --- */}
            {authModal === 'signup' && (
              <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {signupError && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '12px', color: '#f87171' }}>
                    {signupError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1' }}>Shop / Business Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Profitway Electronics & Wholesale"
                    value={signupForm.shop_name}
                    onChange={(e) => setSignupForm({ ...signupForm, shop_name: e.target.value })}
                    style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1' }}>Shop Owner Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Md. Shahriar"
                    value={signupForm.owner_name}
                    onChange={(e) => setSignupForm({ ...signupForm, owner_name: e.target.value })}
                    style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#cbd5e1' }}>Email Address *</label>
                    <input
                      type="email"
                      className="form-input"
                      required
                      placeholder="owner@mystore.com"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ color: '#cbd5e1' }}>Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="+880 1711 000111"
                      value={signupForm.phone}
                      onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                      style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1' }}>Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    required
                    placeholder="••••••••"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                  />
                </div>

                <div style={{ fontSize: '11px', color: '#94a3b8', background: '#1e293b', padding: '8px 12px', borderRadius: '6px' }}>
                  📌 <strong>Approval Safeguard:</strong> Your account registration will be sent to Super Admin for instant verification & approval.
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '10px', fontWeight: '800', background: 'linear-gradient(90deg, #6366f1, #4f46e5)' }} disabled={authLoading}>
                  {authLoading ? 'Submitting Registration...' : 'Submit Registration Request'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '13px', color: '#94a3b8' }}>
                  Already have an account?{' '}
                  <span onClick={() => { setAuthModal('login'); setLoginError(''); }} style={{ color: '#818cf8', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}>
                    Sign In
                  </span>
                </div>
              </form>
            )}

            {/* --- TAB 3: SUPER ADMIN SECRET PORTAL LOGIN --- */}
            {authModal === 'superadmin' && (
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: '#c084fc' }}>
                  🔒 <strong>Super Admin Portal Access:</strong> Log in to review pending signups, manage master shop names, and approve subscriptions.
                </div>

                {loginError && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '12px', color: '#f87171' }}>
                    {loginError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1' }}>Super Admin Email</label>
                  <input
                    type="email"
                    className="form-input"
                    required
                    placeholder="admin@profitway.bd"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1' }}>Password</label>
                  <input
                    type="password"
                    className="form-input"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '10px', fontWeight: '800', background: 'linear-gradient(90deg, #a855f7, #7c3aed)' }} disabled={authLoading}>
                  {authLoading ? 'Authenticating Super Admin...' : 'Login to Super Admin SaaS Controller'}
                </button>
              </form>
            )}

            {/* --- TAB 4: SIGNUP PENDING APPROVAL NOTICE MODAL --- */}
            {authModal === 'pending_notice' && registeredNotice && (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#f59e0b' }}>
                  <Clock size={32} />
                </div>

                <h4 style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', marginBottom: '8px' }}>
                  Registration Submitted!
                </h4>

                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '16px' }}>
                  Shop <strong>{registeredNotice.shop_name}</strong> (Code: <strong style={{ color: '#818cf8' }}>{registeredNotice.shop_code}</strong>) has been registered.
                </p>

                <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '14px', borderRadius: '10px', fontSize: '12px', color: '#cbd5e1', textAlign: 'left', lineHeight: '1.5', marginBottom: '20px' }}>
                  📌 <strong>Next Step:</strong> Your account is currently <strong>Pending Super Admin Approval</strong>. Once approved, an activation email will be sent to your email address and you can log in immediately.
                </div>

                <button onClick={() => setAuthModal(null)} className="btn btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '10px', fontWeight: '800' }}>
                  Close & Return to Home
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
