import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Zap, 
  Package, 
  Users, 
  ShoppingBag, 
  Sparkles, 
  Check, 
  AlertTriangle, 
  ArrowUpRight, 
  Receipt, 
  BarChart3, 
  Megaphone, 
  Landmark, 
  Crown,
  TrendingUp,
  Flame
} from 'lucide-react';

export const Subscription = () => {
  const { authFetch, currency, formatCurrency } = useApp();
  const [subData, setSubData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'
  const [upgradingPlanId, setUpgradingPlanId] = useState(null);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/subscription/my-plan');
      const data = await res.json();
      if (res.ok) setSubData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleRequestUpgrade = async (plan) => {
    const priceText = billingCycle === 'yearly' ? `${currency}${plan.price_yearly}/yr` : `${currency}${plan.price_monthly}/mo`;
    if (window.confirm(`Submit upgrade / renewal request for "${plan.name}" (${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'} billing @ ${priceText})?`)) {
      setUpgradingPlanId(plan.id);
      try {
        const res = await authFetch('/api/subscription/upgrade', {
          method: 'POST',
          body: JSON.stringify({ plan_id: plan.id, billing_cycle: billingCycle })
        });
        const data = await res.json();
        if (res.ok) {
          alert(data.message);
          fetchSubscription();
        } else {
          alert(`Error: ${data.error}`);
        }
      } catch (err) {
        alert(`Error: ${err.message}`);
      } finally {
        setUpgradingPlanId(null);
      }
    }
  };

  if (!subData) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Sparkles size={32} className="spin" color="var(--accent-primary)" style={{ marginBottom: '12px' }} />
        <div>Loading Subscription & Plan details...</div>
      </div>
    );
  }

  const { subscription_status, shop_name, shop_code, expiry_date, remaining_days, progress_percentage, usage, current_plan, available_plans } = subData;
  const isTrial = subscription_status === 'trial';

  // SVG Circular Gauge calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress_percentage / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1280px', margin: '0 auto' }}>
      
      {/* 🌟 1. HERO ACTIVE PLAN BANNER WITH MESH GRADIENT */}
      <div 
        className="glass-card" 
        style={{ 
          padding: '32px', 
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.22) 0%, rgba(168, 85, 247, 0.15) 50%, rgba(16, 185, 129, 0.12) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '20px'
        }}
      >
        {/* Subtle Decorative Background Glow */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }}></div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', position: 'relative', zIndex: 1 }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '6px 14px', borderRadius: '30px', marginBottom: '14px' }}>
              <Sparkles size={14} color="#818cf8" />
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Account Subscription Status
              </span>
            </div>

            <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.5px' }}>
              {current_plan.plan_name}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '14px', flexWrap: 'wrap' }}>
              <span className={`badge ${isTrial ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '13px', padding: '6px 14px', borderRadius: '30px', fontWeight: '800' }}>
                {isTrial ? '⏳ 14-Day Free Trial' : '🟢 Active Subscription Plan'}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '6px 14px', borderRadius: '30px', border: '1px solid var(--border-color)' }}>
                <StoreIcon size={14} color="var(--accent-primary)" />
                <span>Shop: <strong>{shop_name}</strong></span>
                <span style={{ color: 'var(--accent-primary)', fontWeight: '800', marginLeft: '4px' }}>[{shop_code}]</span>
              </div>
            </div>
          </div>

          {/* ⏱️ CIRCULAR COUNTDOWN TIME GAUGE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'var(--bg-secondary)', padding: '20px 28px', borderRadius: '18px', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r={radius} stroke="var(--bg-primary)" strokeWidth="8" fill="transparent" />
                <circle
                  cx="45"
                  cy="45"
                  r={radius}
                  stroke={remaining_days <= 3 ? '#ef4444' : '#10b981'}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  transform="rotate(-90 45 45)"
                />
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: '900', color: remaining_days <= 3 ? '#ef4444' : '#10b981', display: 'block', lineHeight: '1' }}>
                  {remaining_days}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                  Days
                </span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>
                Remaining Period
              </span>
              <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-primary)', marginTop: '2px' }}>
                {remaining_days} Days Left
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Expires: <strong style={{ color: 'var(--text-secondary)' }}>{new Date(expiry_date).toLocaleDateString()}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 2. SYSTEM USAGE CAPACITY METERS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* Product Stock Capacity Meter */}
        <div className="glass-card" style={{ padding: '22px', borderTop: '4px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '10px', color: '#6366f1' }}>
                <Package size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '14px', display: 'block' }}>Product Stock Limit</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Catalog capacity</span>
              </div>
            </div>

            <span style={{ fontSize: '13px', fontWeight: '900', color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)', padding: '4px 10px', borderRadius: '8px' }}>
              {usage.products} / {usage.max_products >= 99999 ? 'Unlimited' : usage.max_products}
            </span>
          </div>

          <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, (usage.products / (usage.max_products >= 99999 ? 1000 : usage.max_products)) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #3b82f6)', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>Products Added</span>
            <span>{usage.max_products >= 99999 ? 'Unlimited' : `${Math.max(0, usage.max_products - usage.products)} Available`}</span>
          </div>
        </div>

        {/* Staff User Accounts Capacity Meter */}
        <div className="glass-card" style={{ padding: '22px', borderTop: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '10px', color: '#10b981' }}>
                <Users size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '14px', display: 'block' }}>Staff Accounts Limit</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Multi-user team</span>
              </div>
            </div>

            <span style={{ fontSize: '13px', fontWeight: '900', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '8px' }}>
              {usage.staff} / {usage.max_staff} Users
            </span>
          </div>

          <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, (usage.staff / usage.max_staff) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>Team Members</span>
            <span>{Math.max(0, usage.max_staff - usage.staff)} Seats Open</span>
          </div>
        </div>

        {/* Total Processed Transactions Card */}
        <div className="glass-card" style={{ padding: '22px', borderTop: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '10px', color: '#f59e0b' }}>
                <ShoppingBag size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '14px', display: 'block' }}>Processed Sales Orders</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Transaction volume</span>
              </div>
            </div>

            <span style={{ fontSize: '16px', fontWeight: '900', color: '#f59e0b' }}>
              {usage.sales} Sales
            </span>
          </div>

          <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} />
            <span>Unlimited sales transaction volume included</span>
          </div>
        </div>
      </div>

      {/* ✨ 3. UNLOCKED PLATFORM MODULES GRID */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <ShieldCheck size={22} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Modules & Features Unlocked in Your Account</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {[
            { title: 'POS Cash Register & Barcode', icon: Receipt, color: '#6366f1' },
            { title: 'Wholesale B2B & Pawna Dues Audit', icon: ShoppingBag, color: '#f59e0b' },
            { title: 'Courier Return Date Reversal', icon: BarChart3, color: '#ec4899' },
            { title: 'Paid Ads CPA Tracker & ROAS Multiplier', icon: Megaphone, color: '#8b5cf6' },
            { title: 'Loss Audit & Risk Products Engine', icon: AlertTriangle, color: '#ef4444' },
            { title: 'Finance Accounts & Payroll Suite', icon: Landmark, color: '#10b981' },
            { title: 'Investment Capital & Repayments', icon: TrendingUp, color: '#06b6d4' },
            { title: 'Thermal 80mm/58mm & A4 Invoices', icon: Receipt, color: '#3b82f6' },
            { title: 'Multi-Staff Account Permissions', icon: Users, color: '#10b981' }
          ].map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  background: 'var(--bg-secondary)', 
                  padding: '12px 16px', 
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  transition: 'transform 0.2s ease, border-color 0.2s ease'
                }}
              >
                <div style={{ padding: '8px', background: `${item.color}15`, borderRadius: '8px', color: item.color }}>
                  <IconComponent size={16} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🚀 4. STUNNING PRICING CATALOG & UPGRADE SECTION */}
      <div className="glass-card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '28px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Crown size={24} color="#f59e0b" />
              <h3 style={{ fontSize: '22px', fontWeight: '900' }}>Upgrade or Renew Your Plan</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Select a suitable plan for your growing business and request instant renewal
            </p>
          </div>

          {/* Monthly / Yearly Billing Cycle Selector Switch */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '30px', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '8px 18px',
                borderRadius: '24px',
                border: 'none',
                background: billingCycle === 'monthly' ? 'var(--accent-primary)' : 'transparent',
                color: billingCycle === 'monthly' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Monthly Billing
            </button>
            
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              style={{
                padding: '8px 18px',
                borderRadius: '24px',
                border: 'none',
                background: billingCycle === 'yearly' ? 'var(--accent-primary)' : 'transparent',
                color: billingCycle === 'yearly' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>Yearly Billing</span>
              <span style={{ fontSize: '10px', background: '#f59e0b', color: '#000', padding: '2px 6px', borderRadius: '10px', fontWeight: '900' }}>
                🔥 2 MONTHS FREE
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {available_plans.map(plan => {
            const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
            const isPro = plan.code === 'pro';

            return (
              <div
                key={plan.id}
                style={{
                  background: isPro 
                    ? 'linear-gradient(145deg, rgba(99, 102, 241, 0.18), rgba(168, 85, 247, 0.12))' 
                    : 'var(--bg-secondary)',
                  border: isPro ? '2px solid #6366f1' : '1px solid var(--border-color)',
                  borderRadius: '20px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  boxShadow: isPro ? '0 16px 36px rgba(99, 102, 241, 0.2)' : '0 4px 16px rgba(0,0,0,0.1)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                }}
              >
                {isPro && (
                  <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg, #6366f1, #a855f7)', color: '#ffffff', padding: '4px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '900', letterSpacing: '0.6px', textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Flame size={13} />
                    <span>MOST POPULAR CHOICE</span>
                  </div>
                )}

                <div>
                  <h4 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)', marginTop: isPro ? '6px' : '0' }}>
                    {plan.name}
                  </h4>

                  <div style={{ margin: '16px 0', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '34px', fontWeight: '900', color: isPro ? 'var(--accent-primary)' : 'var(--text-primary)', letterSpacing: '-1px' }}>
                      {formatCurrency(price)}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '16px 0', margin: '16px 0', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color="var(--success)" />
                      <span>Max Products: <strong>{plan.max_products >= 99999 ? 'Unlimited Products' : `${plan.max_products} Products`}</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color="var(--success)" />
                      <span>Max Staff Accounts: <strong>{plan.max_staff} Users</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color="var(--success)" />
                      <span>POS & Wholesale Invoices: <strong>Full Access</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color="var(--success)" />
                      <span>Financial & Loss Audit: <strong>Full Access</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRequestUpgrade(plan)}
                  className={`btn ${isPro ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    fontWeight: '800',
                    fontSize: '14px',
                    background: isPro ? 'linear-gradient(90deg, #6366f1, #4f46e5)' : undefined,
                    boxShadow: isPro ? '0 8px 20px rgba(99, 102, 241, 0.35)' : undefined
                  }}
                  disabled={upgradingPlanId === plan.id}
                >
                  <Zap size={16} />
                  <span>{upgradingPlanId === plan.id ? 'Submitting Request...' : `Renew / Upgrade to ${plan.name}`}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Helper Store Icon
const StoreIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
    <path d="M2 7h20"/>
  </svg>
);
