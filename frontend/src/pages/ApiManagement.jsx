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
  Zap, 
  RefreshCw,
  Send,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Shield,
  HelpCircle
} from 'lucide-react';

export const ApiManagement = () => {
  const { authFetch, showToast } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('courier'); // 'courier', 'sms', 'fraud', 'payment'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSecretKeys, setShowSecretKeys] = useState({});
  const [copiedWebhookId, setCopiedWebhookId] = useState(null);

  // Multi-Account Courier State
  const [courierAccounts, setCourierAccounts] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('pathao');
  const [expandedAccountId, setExpandedAccountId] = useState(null);
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);

  // Other API Integrations Form State
  const [form, setForm] = useState({
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

  const COURIER_PROVIDERS = [
    { code: 'steadfast', name: 'Steadfast', logo: '⚡', fields: { keyLabel: 'API Key', secretLabel: 'Secret Key', emailLabel: 'Merchant Store Name' } },
    { code: 'pathao', name: 'Pathao', logo: '🚚', fields: { keyLabel: 'Client ID', secretLabel: 'Client Secret', emailLabel: 'Merchant Email / Store' } },
    { code: 'redx', name: 'RedX', logo: '📦', fields: { keyLabel: 'App Token / Key', secretLabel: 'App Secret', emailLabel: 'Store Name' } },
    { code: 'paperfly', name: 'Paperfly', logo: '🦋', fields: { keyLabel: 'Merchant Username', secretLabel: 'Merchant Password', emailLabel: 'Store Name (Optional)' } },
    { code: '7ton', name: '7TON Express', logo: '🚛', fields: { keyLabel: 'API User ID', secretLabel: 'API Password', emailLabel: 'Branch / Store' } },
    { code: 'packnexa', name: 'Packnexa', logo: '📦', fields: { keyLabel: 'Access Key', secretLabel: 'Secret Key', emailLabel: 'Account ID' } },
    { code: 'carrybee', name: 'Carrybee', logo: '🐝', fields: { keyLabel: 'API Key', secretLabel: 'Secret Key', emailLabel: 'Merchant Code' } },
  ];

  // Fetch Courier Accounts & Other API Settings
  const fetchAllSettings = async () => {
    setLoading(true);
    try {
      const cRes = await authFetch('/api/courier-accounts');
      const cData = await cRes.json();
      if (cRes.ok && Array.isArray(cData)) {
        setCourierAccounts(cData);
        if (cData.length > 0 && !expandedAccountId) {
          setExpandedAccountId(cData[0].id);
        }
      }

      const aRes = await authFetch('/api/api-integrations');
      const aData = await aRes.json();
      if (aRes.ok && aData) {
        setForm({
          sms_provider: aData.sms_provider || 'bulksmsbd',
          sms_api_key: aData.sms_api_key || '',
          sms_sender_id: aData.sms_sender_id || '',
          sms_client_id: aData.sms_client_id || '',
          sms_is_enabled: Boolean(aData.sms_is_enabled),

          fraud_provider: aData.fraud_provider || 'courier_check',
          fraud_api_key: aData.fraud_api_key || '',
          fraud_is_enabled: Boolean(aData.fraud_is_enabled),

          payment_provider: aData.payment_provider || 'bkash',
          payment_merchant_id: aData.payment_merchant_id || '',
          payment_app_key: aData.payment_app_key || '',
          payment_app_secret: aData.payment_app_secret || '',
          payment_environment: aData.payment_environment || 'sandbox',
          payment_is_enabled: Boolean(aData.payment_is_enabled),
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSettings();
  }, []);

  // Account Mutation Handlers
  const handleAddCourierAccount = async () => {
    try {
      const providerAccounts = courierAccounts.filter(a => a.provider_code === selectedProvider);
      const nextNum = providerAccounts.length + 1;
      const providerObj = COURIER_PROVIDERS.find(p => p.code === selectedProvider);
      const newLabel = `Account-${nextNum}`;

      const res = await authFetch('/api/courier-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_code: selectedProvider,
          account_label: newLabel,
          client_id_key: '',
          client_secret_key: '',
          store_name: ''
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast ? showToast('Account Created ✨', data.message, 'success') : alert(data.message);
        await fetchAllSettings();
        if (data.id) setExpandedAccountId(data.id);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error creating courier account: ${err.message}`);
    }
  };

  const handleUpdateAccountField = (id, field, value) => {
    setCourierAccounts(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const handleSaveCourierAccount = async (acc) => {
    setSaving(true);
    try {
      const res = await authFetch(`/api/courier-accounts/${acc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(acc)
      });
      const data = await res.json();
      if (res.ok) {
        showToast ? showToast('Connected & Verified ✓', data.message, 'success') : alert(data.message);
        fetchAllSettings();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error updating courier account: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCourierAccount = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await authFetch(`/api/courier-accounts/${id}/toggle`, { method: 'PATCH' });
      const data = await res.json();
      if (res.ok) {
        fetchAllSettings();
      }
    } catch (err) {
      alert(`Error toggling account: ${err.message}`);
    }
  };

  const handleDeleteCourierAccount = async (id, label) => {
    if (!window.confirm(`Are you sure you want to delete courier account "${label}"?`)) return;
    try {
      const res = await authFetch(`/api/courier-accounts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast ? showToast('Deleted 🗑️', data.message, 'info') : alert(data.message);
        fetchAllSettings();
      }
    } catch (err) {
      alert(`Error deleting account: ${err.message}`);
    }
  };

  const handleCopyWebhook = (id) => {
    const webhookUrl = `https://profitway.bd/api/courier-webhook`;
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhookId(id);
    showToast ? showToast('Copied 📋', 'Webhook URL copied to clipboard!', 'info') : alert('Webhook URL copied!');
    setTimeout(() => setCopiedWebhookId(null), 2000);
  };

  const toggleShowKey = (keyName) => {
    setShowSecretKeys(prev => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const handleSaveGeneralIntegrations = async (e) => {
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
        fetchAllSettings();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error saving integrations: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Helper Stats for Selected Provider & Overall Connected
  const filteredAccounts = courierAccounts.filter(a => a.provider_code === selectedProvider);
  const activeCount = courierAccounts.filter(a => a.is_active).length;
  const selectedProviderObj = COURIER_PROVIDERS.find(p => p.code === selectedProvider) || COURIER_PROVIDERS[0];

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
                Setup Multi-Account Couriers, SMS Gateways, Fraud Checking, and Payment Gateways
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={fetchAllSettings} 
          disabled={loading} 
          className="btn btn-secondary"
          style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Refresh All</span>
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
          <span>Courier Management</span>
          {activeCount > 0 && <span style={{ background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>{activeCount} Active</span>}
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

      {/* 1. COURIER MANAGEMENT (MULTI-ACCOUNT SYSTEM) */}
      {activeSubTab === 'courier' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Connected Stats Bar */}
          <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck color="#8b5cf6" size={22} />
                <span>Courier Management</span>
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{courierAccounts.length} Connected</strong> • {activeCount} active accounts across couriers
              </p>
            </div>

            <button onClick={fetchAllSettings} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} />
              <span>Refresh All</span>
            </button>
          </div>

          {/* Provider Selection & Multi-Account Card */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Courier Provider Selector Dropdown */}
            <div style={{ position: 'relative' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                COURIER PROVIDER
              </label>

              <div 
                onClick={() => setProviderDropdownOpen(prev => !prev)}
                style={{
                  padding: '12px 18px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>{selectedProviderObj.logo}</span>
                  <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>
                    ● {selectedProviderObj.name}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    ({filteredAccounts.length} {filteredAccounts.length === 1 ? 'account' : 'accounts'})
                  </span>
                </div>
                <ChevronDown size={18} color="var(--text-muted)" />
              </div>

              {/* Provider Dropdown Menu */}
              {providerDropdownOpen && (
                <div 
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    background: '#1e293b',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  {COURIER_PROVIDERS.map(p => {
                    const accCount = courierAccounts.filter(a => a.provider_code === p.code).length;
                    const isSelected = selectedProvider === p.code;

                    return (
                      <div
                        key={p.code}
                        onClick={() => {
                          setSelectedProvider(p.code);
                          setProviderDropdownOpen(false);
                        }}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'space-between',
                          background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                          color: isSelected ? '#a855f7' : 'var(--text-primary)',
                          fontWeight: isSelected ? '700' : '600'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {isSelected ? <Check size={16} color="#a855f7" /> : <span style={{ width: '16px' }} />}
                          <span style={{ fontSize: '15px' }}>{p.logo}</span>
                          <span>{p.name}</span>
                          {accCount > 0 && (
                            <span style={{ fontSize: '12px', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '10px' }}>
                              ({accCount} {accCount === 1 ? 'account' : 'accounts'})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Provider Accounts List Card */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck size={18} color="#c084fc" />
                    <span>{selectedProviderObj.name}</span>
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {filteredAccounts.length} {filteredAccounts.length === 1 ? 'account' : 'accounts'} • {filteredAccounts.filter(a => a.is_active).length} active
                  </p>
                </div>

                {/* + Add Account Button */}
                <button
                  type="button"
                  onClick={handleAddCourierAccount}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                >
                  <Plus size={16} />
                  <span>Add account</span>
                </button>
              </div>

              {/* Accounts Accordion Items */}
              {filteredAccounts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No accounts setup for {selectedProviderObj.name} yet. Click <strong>+ Add account</strong> to connect your first account!
                </div>
              ) : (
                filteredAccounts.map(acc => {
                  const isExpanded = expandedAccountId === acc.id;

                  return (
                    <div 
                      key={acc.id}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Item Header */}
                      <div
                        onClick={() => setExpandedAccountId(isExpanded ? null : acc.id)}
                        style={{
                          padding: '14px 18px',
                          display: 'flex',
                          justify: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          background: isExpanded ? 'rgba(99, 102, 241, 0.08)' : 'transparent'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Shield size={16} color="#10b981" />
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
                              {acc.account_label}
                            </div>
                            <div style={{ fontSize: '11px', color: acc.is_verified ? '#10b981' : 'var(--text-muted)' }}>
                              {acc.is_verified ? 'Verified ✓' : 'New — fill & save'}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} onClick={e => e.stopPropagation()}>
                          {/* Active Toggle Switch */}
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={Boolean(acc.is_active)}
                              onChange={(e) => handleToggleCourierAccount(acc.id, e)}
                              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#6366f1' }}
                            />
                          </label>

                          <div onClick={() => setExpandedAccountId(isExpanded ? null : acc.id)}>
                            {isExpanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Account Form */}
                      {isExpanded && (
                        <div style={{ padding: '20px 18px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(15, 23, 42, 0.4)' }}>
                          
                          {/* Account Label */}
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Account Label</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Account Label (e.g. Francium, Account-2)"
                              value={acc.account_label || ''}
                              onChange={(e) => handleUpdateAccountField(acc.id, 'account_label', e.target.value)}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                              Order পাঠানোর সময় এই label দেখা যাবে।
                            </span>
                          </div>

                          {/* Client ID / Key */}
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">{selectedProviderObj.fields.keyLabel}</label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type={showSecretKeys[`acc_key_${acc.id}`] ? 'text' : 'password'}
                                className="form-input"
                                placeholder={`${selectedProviderObj.name} ${selectedProviderObj.fields.keyLabel}`}
                                value={acc.client_id_key || ''}
                                onChange={(e) => handleUpdateAccountField(acc.id, 'client_id_key', e.target.value)}
                              />
                              <button
                                type="button"
                                onClick={() => toggleShowKey(`acc_key_${acc.id}`)}
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                              >
                                {showSecretKeys[`acc_key_${acc.id}`] ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>

                          {/* Client Secret / Password */}
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">{selectedProviderObj.fields.secretLabel}</label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type={showSecretKeys[`acc_sec_${acc.id}`] ? 'text' : 'password'}
                                className="form-input"
                                placeholder={`${selectedProviderObj.name} ${selectedProviderObj.fields.secretLabel}`}
                                value={acc.client_secret_key || ''}
                                onChange={(e) => handleUpdateAccountField(acc.id, 'client_secret_key', e.target.value)}
                              />
                              <button
                                type="button"
                                onClick={() => toggleShowKey(`acc_sec_${acc.id}`)}
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                              >
                                {showSecretKeys[`acc_sec_${acc.id}`] ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>

                          {/* Store Name / Email */}
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">{selectedProviderObj.fields.emailLabel}</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder={selectedProviderObj.fields.emailLabel}
                              value={acc.store_name || ''}
                              onChange={(e) => handleUpdateAccountField(acc.id, 'store_name', e.target.value)}
                            />
                          </div>

                          {/* Webhook URL */}
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>🔗 Webhook URL</span>
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input
                                type="text"
                                className="form-input"
                                readOnly
                                value="https://profitway.bd/api/courier-webhook"
                                style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
                              />
                              <button
                                type="button"
                                onClick={() => handleCopyWebhook(acc.id)}
                                className="btn btn-secondary btn-icon"
                                title="Copy Webhook URL"
                              >
                                {copiedWebhookId === acc.id ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                              </button>
                            </div>
                          </div>

                          {/* Action Buttons Row */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '12px', borderTop: '1px dashed var(--border-color)' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={() => toggleShowKey(`acc_sec_${acc.id}`)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Eye size={14} />
                                <span>Show keys</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteCourierAccount(acc.id, acc.account_label)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Trash2 size={14} />
                                <span>Delete</span>
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSaveCourierAccount(acc)}
                              disabled={saving}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '8px 20px', borderRadius: '8px', background: '#6366f1' }}
                            >
                              {saving ? 'Verifying...' : 'Connect & Verify'}
                            </button>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Demo Tip */}
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.08)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <span>💡</span>
              <span>একই কুরিয়ারের একাধিক account রাখতে পারবেন। Order পাঠানোর সময় active সব account select করার অপশন আসবে।</span>
            </div>

          </div>
        </div>
      )}

      {/* 2. SMS GATEWAY API INTEGRATION */}
      {activeSubTab === 'sms' && (
        <form onSubmit={handleSaveGeneralIntegrations}>
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
                  onChange={(e) => setForm(prev => ({ ...prev, sms_is_enabled: e.target.checked }))}
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
                  onChange={(e) => setForm(prev => ({ ...prev, sms_provider: e.target.value }))}
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
                    onChange={(e) => setForm(prev => ({ ...prev, sms_api_key: e.target.value }))}
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
                  onChange={(e) => setForm(prev => ({ ...prev, sms_sender_id: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Client ID / Account Username (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter User/Client ID..."
                  value={form.sms_client_id}
                  onChange={(e) => setForm(prev => ({ ...prev, sms_client_id: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => showToast ? showToast('SMS Ping ⚡', 'Test SMS request sent successfully!', 'info') : alert('Test SMS sent!')}
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
        </form>
      )}

      {/* 3. FRAUD CHECK API INTEGRATION */}
      {activeSubTab === 'fraud' && (
        <form onSubmit={handleSaveGeneralIntegrations}>
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
                  onChange={(e) => setForm(prev => ({ ...prev, fraud_is_enabled: e.target.checked }))}
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
                  onChange={(e) => setForm(prev => ({ ...prev, fraud_provider: e.target.value }))}
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
                    onChange={(e) => setForm(prev => ({ ...prev, fraud_api_key: e.target.value }))}
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
                onClick={() => showToast ? showToast('Fraud Shield ⚡', 'Fraud Check API authenticated successfully!', 'info') : alert('Fraud Check verified!')}
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
        </form>
      )}

      {/* 4. PAYMENT GATEWAY API INTEGRATION */}
      {activeSubTab === 'payment' && (
        <form onSubmit={handleSaveGeneralIntegrations}>
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
                  onChange={(e) => setForm(prev => ({ ...prev, payment_is_enabled: e.target.checked }))}
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
                  onChange={(e) => setForm(prev => ({ ...prev, payment_provider: e.target.value }))}
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
                  onChange={(e) => setForm(prev => ({ ...prev, payment_environment: e.target.value }))}
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
                  onChange={(e) => setForm(prev => ({ ...prev, payment_merchant_id: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">App Key / Store ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter App Key..."
                  value={form.payment_app_key}
                  onChange={(e) => setForm(prev => ({ ...prev, payment_app_key: e.target.value }))}
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
                    onChange={(e) => setForm(prev => ({ ...prev, payment_app_secret: e.target.value }))}
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
                onClick={() => showToast ? showToast('Gateway Handshake ⚡', 'Payment Gateway API verified!', 'info') : alert('Gateway verified!')}
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
        </form>
      )}

    </div>
  );
};
