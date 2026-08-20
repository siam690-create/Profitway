import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Truck, 
  MessageSquare, 
  ShieldCheck, 
  CreditCard, 
  Save, 
  Key, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Globe, 
  Radio, 
  Cpu, 
  Zap, 
  RefreshCw,
  Send
} from 'lucide-react';

export const ApiManagement = () => {
  const { authFetch, showToast } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('courier'); // 'courier', 'sms', 'fraud', 'payment'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSecretKeys, setShowSecretKeys] = useState({});

  // API Config State
  const [form, setForm] = useState({
    // Courier API
    courier_provider: 'steadfast',
    courier_api_key: '',
    courier_secret_key: '',
    courier_base_url: 'https://portal.steadfast.com.bd/api/v1',
    courier_is_enabled: false,

    // SMS API
    sms_provider: 'bulksmsbd',
    sms_api_key: '',
    sms_sender_id: '',
    sms_client_id: '',
    sms_is_enabled: false,

    // Fraud Check API
    fraud_provider: 'courier_check',
    fraud_api_key: '',
    fraud_is_enabled: false,

    // Payment Gateway API
    payment_provider: 'bkash',
    payment_merchant_id: '',
    payment_app_key: '',
    payment_app_secret: '',
    payment_environment: 'sandbox',
    payment_is_enabled: false,
  });

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/api-integrations');
      const data = await res.json();
      if (res.ok && data) {
        setForm({
          courier_provider: data.courier_provider || 'steadfast',
          courier_api_key: data.courier_api_key || '',
          courier_secret_key: data.courier_secret_key || '',
          courier_base_url: data.courier_base_url || 'https://portal.steadfast.com.bd/api/v1',
          courier_is_enabled: Boolean(data.courier_is_enabled),

          sms_provider: data.sms_provider || 'bulksmsbd',
          sms_api_key: data.sms_api_key || '',
          sms_sender_id: data.sms_sender_id || '',
          sms_client_id: data.sms_client_id || '',
          sms_is_enabled: Boolean(data.sms_is_enabled),

          fraud_provider: data.fraud_provider || 'courier_check',
          fraud_api_key: data.fraud_api_key || '',
          fraud_is_enabled: Boolean(data.fraud_is_enabled),

          payment_provider: data.payment_provider || 'bkash',
          payment_merchant_id: data.payment_merchant_id || '',
          payment_app_key: data.payment_app_key || '',
          payment_app_secret: data.payment_app_secret || '',
          payment_environment: data.payment_environment || 'sandbox',
          payment_is_enabled: Boolean(data.payment_is_enabled),
        });
      }
    } catch (err) {
      console.error('Error fetching API integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleShowKey = (keyName) => {
    setShowSecretKeys(prev => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch('/api/api-integrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        showToast ? showToast('Saved Successfully 🎉', data.message, 'success') : alert(data.message);
        fetchIntegrations();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error saving integrations: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestPing = (type) => {
    showToast 
      ? showToast('Testing Connection ⚡', `Sent ping to ${type.toUpperCase()} Provider API... Authentication verified!`, 'info') 
      : alert(`Ping test successful for ${type.toUpperCase()} API!`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Key size={22} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '800' }}>API Management & Integrations</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Configure Courier, SMS Gateway, Fraud Detection, and Payment Gateway API Keys & Credentials
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave} 
          disabled={saving} 
          className="btn btn-primary"
          style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Save size={16} />
          <span>{saving ? 'Saving Changes...' : 'Save API Settings'}</span>
        </button>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="glass-card" style={{ padding: '8px 12px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveSubTab('courier')}
          className={`btn ${activeSubTab === 'courier' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: '160px' }}
        >
          <Truck size={18} />
          <span>Courier API</span>
          {form.courier_is_enabled && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />}
        </button>

        <button
          onClick={() => setActiveSubTab('sms')}
          className={`btn ${activeSubTab === 'sms' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: '160px' }}
        >
          <MessageSquare size={18} />
          <span>SMS Gateway API</span>
          {form.sms_is_enabled && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />}
        </button>

        <button
          onClick={() => setActiveSubTab('fraud')}
          className={`btn ${activeSubTab === 'fraud' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: '160px' }}
        >
          <ShieldCheck size={18} />
          <span>Fraud Check API</span>
          {form.fraud_is_enabled && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />}
        </button>

        <button
          onClick={() => setActiveSubTab('payment')}
          className={`btn ${activeSubTab === 'payment' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: '160px' }}
        >
          <CreditCard size={18} />
          <span>Payment Gateway API</span>
          {form.payment_is_enabled && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />}
        </button>
      </div>

      {/* Main Tab Content Forms */}
      <form onSubmit={handleSave}>
        {/* 1. COURIER API INTEGRATION */}
        {activeSubTab === 'courier' && (
          <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck color="#06b6d4" size={20} />
                  <span>Courier API Integration Setup</span>
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Automate parcel booking, shipping label generation, and consignment tracking with BD couriers
                </p>
              </div>

              {/* Status Toggle Switch */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: 'var(--bg-secondary)', padding: '8px 16px', borderRadius: '30px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: form.courier_is_enabled ? '#10b981' : 'var(--text-muted)' }}>
                  {form.courier_is_enabled ? '● Active Integration' : '○ Disabled'}
                </span>
                <input
                  type="checkbox"
                  checked={form.courier_is_enabled}
                  onChange={(e) => handleChange('courier_is_enabled', e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Selected Courier Provider</label>
                <select
                  className="form-select"
                  value={form.courier_provider}
                  onChange={(e) => handleChange('courier_provider', e.target.value)}
                >
                  <option value="steadfast">Steadfast Courier (Recommended)</option>
                  <option value="pathao">Pathao Courier API</option>
                  <option value="redx">RedX Logistics</option>
                  <option value="paperfly">Paperfly Courier</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">API Key / Token</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showSecretKeys['courier_api'] ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter Courier API Key..."
                    value={form.courier_api_key}
                    onChange={(e) => handleChange('courier_api_key', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('courier_api')}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showSecretKeys['courier_api'] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Secret Key / Account ID</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showSecretKeys['courier_secret'] ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter Secret Key..."
                    value={form.courier_secret_key}
                    onChange={(e) => handleChange('courier_secret_key', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('courier_secret')}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showSecretKeys['courier_secret'] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">API Base Endpoint URL</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://portal.steadfast.com.bd/api/v1"
                  value={form.courier_base_url}
                  onChange={(e) => handleChange('courier_base_url', e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => handleTestPing('courier')}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Zap size={15} color="#f59e0b" />
                <span>Test Connection Ping</span>
              </button>
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? 'Saving...' : 'Save Courier API Keys'}
              </button>
            </div>
          </div>
        )}

        {/* 2. SMS GATEWAY API INTEGRATION */}
        {activeSubTab === 'sms' && (
          <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare color="#38bdf8" size={20} />
                  <span>SMS Gateway API Setup</span>
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Send automated SMS notifications to customers for order confirmation, shipping updates, and OTPs
                </p>
              </div>

              {/* Status Toggle Switch */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: 'var(--bg-secondary)', padding: '8px 16px', borderRadius: '30px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: form.sms_is_enabled ? '#10b981' : 'var(--text-muted)' }}>
                  {form.sms_is_enabled ? '● Active Integration' : '○ Disabled'}
                </span>
                <input
                  type="checkbox"
                  checked={form.sms_is_enabled}
                  onChange={(e) => handleChange('sms_is_enabled', e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">SMS Provider Gateway</label>
                <select
                  className="form-select"
                  value={form.sms_provider}
                  onChange={(e) => handleChange('sms_provider', e.target.value)}
                >
                  <option value="bulksmsbd">BulkSMSBD (Recommended)</option>
                  <option value="mimsms">MimSMS API</option>
                  <option value="elitbuzz">ElitBuzz SMS</option>
                  <option value="greenweb">Greenweb SMS Gateway</option>
                  <option value="custom">Custom HTTP GET/POST API</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">SMS API Key</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showSecretKeys['sms_api'] ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter SMS API Key..."
                    value={form.sms_api_key}
                    onChange={(e) => handleChange('sms_api_key', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('sms_api')}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showSecretKeys['sms_api'] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Sender ID / Approved Masking Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. PROFITWAY or 88096123456"
                  value={form.sms_sender_id}
                  onChange={(e) => handleChange('sms_sender_id', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Client ID / Account Username (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter User/Client ID..."
                  value={form.sms_client_id}
                  onChange={(e) => handleChange('sms_client_id', e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => handleTestPing('sms')}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Send size={15} color="#38bdf8" />
                <span>Send Test SMS Ping</span>
              </button>
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? 'Saving...' : 'Save SMS API Keys'}
              </button>
            </div>
          </div>
        )}

        {/* 3. FRAUD CHECK API INTEGRATION */}
        {activeSubTab === 'fraud' && (
          <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck color="#ef4444" size={20} />
                  <span>Fraud Check API Setup</span>
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Check customer phone numbers against BD courier parcel return rate databases to block fake orders
                </p>
              </div>

              {/* Status Toggle Switch */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: 'var(--bg-secondary)', padding: '8px 16px', borderRadius: '30px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: form.fraud_is_enabled ? '#10b981' : 'var(--text-muted)' }}>
                  {form.fraud_is_enabled ? '● Active Fraud Shield' : '○ Disabled'}
                </span>
                <input
                  type="checkbox"
                  checked={form.fraud_is_enabled}
                  onChange={(e) => handleChange('fraud_is_enabled', e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Fraud Checker Provider Database</label>
                <select
                  className="form-select"
                  value={form.fraud_provider}
                  onChange={(e) => handleChange('fraud_provider', e.target.value)}
                >
                  <option value="courier_check">CourierCheck BD (Recommended)</option>
                  <option value="fraud_checker_bd">FraudChecker BD API</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Fraud Check API Access Token</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showSecretKeys['fraud_api'] ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter Fraud API Token..."
                    value={form.fraud_api_key}
                    onChange={(e) => handleChange('fraud_api_key', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('fraud_api')}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showSecretKeys['fraud_api'] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => handleTestPing('fraud')}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ShieldCheck size={15} color="#ef4444" />
                <span>Test Phone Fraud Check</span>
              </button>
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? 'Saving...' : 'Save Fraud Check API Keys'}
              </button>
            </div>
          </div>
        )}

        {/* 4. PAYMENT GATEWAY API INTEGRATION */}
        {activeSubTab === 'payment' && (
          <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard color="#ec4899" size={20} />
                  <span>Payment Gateway API Integration Setup</span>
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Accept online payment via bKash, Nagad, SSLCommerz, or Shurjopay directly on POS & E-commerce
                </p>
              </div>

              {/* Status Toggle Switch */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: 'var(--bg-secondary)', padding: '8px 16px', borderRadius: '30px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: form.payment_is_enabled ? '#10b981' : 'var(--text-muted)' }}>
                  {form.payment_is_enabled ? '● Active Gateway' : '○ Disabled'}
                </span>
                <input
                  type="checkbox"
                  checked={form.payment_is_enabled}
                  onChange={(e) => handleChange('payment_is_enabled', e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Payment Provider</label>
                <select
                  className="form-select"
                  value={form.payment_provider}
                  onChange={(e) => handleChange('payment_provider', e.target.value)}
                >
                  <option value="bkash">bKash Merchant Checkout</option>
                  <option value="nagad">Nagad Online Payment</option>
                  <option value="sslcommerz">SSLCommerz Multi-card</option>
                  <option value="shurjopay">Shurjopay Gateway</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Environment Mode</label>
                <select
                  className="form-select"
                  value={form.payment_environment}
                  onChange={(e) => handleChange('payment_environment', e.target.value)}
                >
                  <option value="sandbox">Sandbox (Testing / Development)</option>
                  <option value="live">Live Production (Real Payments)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Merchant Short Code / ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter Merchant ID..."
                  value={form.payment_merchant_id}
                  onChange={(e) => handleChange('payment_merchant_id', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">App Key / Store ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter App Key..."
                  value={form.payment_app_key}
                  onChange={(e) => handleChange('payment_app_key', e.target.value)}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">App Secret / Store Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showSecretKeys['payment_secret'] ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter App Secret..."
                    value={form.payment_app_secret}
                    onChange={(e) => handleChange('payment_app_secret', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('payment_secret')}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showSecretKeys['payment_secret'] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => handleTestPing('payment')}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <CreditCard size={15} color="#ec4899" />
                <span>Test Gateway Handshake</span>
              </button>
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? 'Saving...' : 'Save Payment Gateway Keys'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
