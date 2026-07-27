import React, { useState } from 'react';
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
  Lock
} from 'lucide-react';

export const LandingPage = ({ onGetStarted, onTryDemo, onSuperAdmin }) => {
  const [billingCycle, setBillingCycle] = useState('monthly');

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

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button onClick={onSuperAdmin} style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#cbd5e1', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} color="#a855f7" />
              <span>Super Admin</span>
            </button>
            <button onClick={onGetStarted} style={{ background: 'linear-gradient(90deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 6px 16px rgba(99, 102, 241, 0.35)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Shop Owner Login</span>
              <ArrowRight size={14} />
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
          <button onClick={onGetStarted} style={{ background: 'linear-gradient(90deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', padding: '16px 36px', borderRadius: '14px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 12px 28px rgba(99, 102, 241, 0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Start Free 14-Day Trial</span>
            <ArrowRight size={18} />
          </button>

          <button onClick={onTryDemo} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '16px 32px', borderRadius: '14px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} />
            <span>Try Live Demo Shop</span>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '32px', fontSize: '13px', color: '#64748b' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#10b981" /> No Credit Card Required</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#10b981" /> Setup in 30 Seconds</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} color="#10b981" /> bKash, Nagad & Card Ready</span>
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
            <button onClick={onGetStarted} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: 'none', fontWeight: '800', cursor: 'pointer' }}>Start 14-Day Free Trial</button>
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
            <button onClick={onGetStarted} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'linear-gradient(90deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', fontWeight: '800', cursor: 'pointer', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35)' }}>Start 14-Day Free Trial</button>
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
            <button onClick={onGetStarted} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: 'none', fontWeight: '800', cursor: 'pointer' }}>Contact Sales</button>
          </div>
        </div>
      </section>

      {/* 📄 Footer */}
      <footer style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '40px 24px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
        <p>© 2026 Profitway Platform (profitway.bd). All rights reserved.</p>
        <p style={{ marginTop: '6px' }}>Designed & Engineered for High-Growth Retail & Wholesale Businesses in Bangladesh.</p>
      </footer>
    </div>
  );
};
