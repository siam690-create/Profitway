import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Megaphone, Plus, DollarSign, Calculator, Trash2, Calendar, ShoppingBag, X, Layers, FileSpreadsheet, CreditCard, Settings, Filter } from 'lucide-react';

import { ProductSelectSearch } from '../components/ProductSelectSearch';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { BulkImportAdsModal } from '../components/BulkImportAdsModal';

export const PaidAds = () => {
  const { authFetch, products, currency, refreshAllData, user } = useApp();
  const [adsList, setAdsList] = useState([]);
  const [adAccounts, setAdAccounts] = useState([]);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState('all');
  const [selectedAdAccount, setSelectedAdAccount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  // Ad Account Create Form
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountPlatform, setNewAccountPlatform] = useState('Facebook Ads');
  const [newAccountIdCode, setNewAccountIdCode] = useState('');

  // Multi-Product Ad Items Form State
  const [adItems, setAdItems] = useState([
    { product_id: '', amount_usd: '', notes: '' }
  ]);
  const [platform, setPlatform] = useState('Facebook Ads');
  const [exchangeRate, setExchangeRate] = useState('122');
  const [adDate, setAdDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const fetchAds = async () => {
    try {
      const res = await authFetch('/api/ads');
      const data = await res.json();
      if (res.ok) setAdsList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdAccounts = async () => {
    try {
      const res = await authFetch('/api/ads/accounts');
      const data = await res.json();
      if (res.ok) setAdAccounts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAds();
    fetchAdAccounts();
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!newAccountName.trim()) return alert('Please enter Ad Account Name');
    try {
      const res = await authFetch('/api/ads/accounts', {
        method: 'POST',
        body: JSON.stringify({
          account_name: newAccountName.trim(),
          platform: newAccountPlatform,
          account_id_code: newAccountIdCode.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setNewAccountName('');
        setNewAccountIdCode('');
        fetchAdAccounts();
        alert('Ad Account created successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm('Delete this ad account?')) return;
    try {
      const res = await authFetch(`/api/ads/accounts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAdAccounts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAdItem = () => {
    setAdItems(prev => [...prev, { product_id: '', amount_usd: '', notes: '' }]);
  };

  const handleRemoveAdItem = (index) => {
    if (adItems.length <= 1) return;
    setAdItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAdItemChange = (index, field, value) => {
    setAdItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmitAd = async (e) => {
    e.preventDefault();

    const validItems = adItems.filter(item => Number(item.amount_usd) > 0);
    if (validItems.length === 0) {
      return alert('Please enter at least one product with a valid USD ad spend amount ($).');
    }

    const matchedAccount = adAccounts.find(a => Number(a.id) === Number(selectedAdAccount));

    try {
      const res = await authFetch('/api/ads', {
        method: 'POST',
        body: JSON.stringify({
          items: validItems.map(item => ({
            product_id: item.product_id ? Number(item.product_id) : null,
            amount_usd: Number(item.amount_usd),
            notes: item.notes
          })),
          ad_account_id: matchedAccount ? matchedAccount.id : null,
          ad_account_name: matchedAccount ? matchedAccount.account_name : null,
          platform,
          exchange_rate: Number(exchangeRate || 120),
          ad_date: adDate,
          notes
        })
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setAdItems([{ product_id: '', amount_usd: '', notes: '' }]);
        setNotes('');
        refreshAllData();
        fetchAds();
        alert(data.message || 'Paid Ad expenses logged and synced with operating expenses successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteAd = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ad spend record?')) return;
    try {
      const res = await authFetch(`/api/ads/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        refreshAllData();
        fetchAds();
        alert('Paid Ad record deleted successfully.');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Metrics Filtered by Date & Ad Account
  const filteredAdsList = adsList.filter(ad => {
    if (selectedAccountFilter !== 'all' && Number(ad.ad_account_id) !== Number(selectedAccountFilter)) {
      return false;
    }
    if (!startDate || !endDate) return true;
    const d = new Date(ad.ad_date).toISOString().slice(0, 10);
    return d >= startDate && d <= endDate;
  });

  const totalUsdSpent = filteredAdsList.reduce((sum, ad) => sum + Number(ad.amount_usd), 0);
  const totalBdtSpent = filteredAdsList.reduce((sum, ad) => sum + Number(ad.total_bdt_cost), 0);
  const isOwner = user?.role === 'owner' || user?.role === 'superadmin';

  // Live Batch Calculation
  const totalBatchUsd = adItems.reduce((sum, item) => sum + Number(item.amount_usd || 0), 0);
  const rateNum = Number(exchangeRate || 120);
  const totalBatchBdt = (totalBatchUsd * rateNum).toFixed(2);
  const validProductsCount = adItems.filter(i => Number(i.amount_usd) > 0).length;

  // Account Breakdown Summaries
  const accountSummaries = adAccounts.map(acc => {
    const accAds = filteredAdsList.filter(a => Number(a.ad_account_id) === Number(acc.id));
    const totalUsd = accAds.reduce((sum, a) => sum + Number(a.amount_usd || 0), 0);
    const totalBdt = accAds.reduce((sum, a) => sum + Number(a.total_bdt_cost || 0), 0);
    return { ...acc, totalUsd, totalBdt, count: accAds.length };
  });

  const unassignedAds = filteredAdsList.filter(a => !a.ad_account_id);
  const unassignedUsd = unassignedAds.reduce((sum, a) => sum + Number(a.amount_usd || 0), 0);
  const unassignedBdt = unassignedAds.reduce((sum, a) => sum + Number(a.total_bdt_cost || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Megaphone size={24} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Paid Ads & Marketing Tracker</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Log product-wise Facebook/Google ad costs in USD ($) with custom exchange rate (৳/$) and multi-ad account tracking
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Ad Account Selector Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: '10px', border: '1px solid var(--accent-primary)' }}>
            <CreditCard size={15} color="var(--accent-primary)" />
            <select
              className="form-select"
              value={selectedAccountFilter}
              onChange={(e) => setSelectedAccountFilter(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontWeight: '700', fontSize: '13px', color: 'var(--accent-primary)', padding: '4px 6px', cursor: 'pointer' }}
            >
              <option value="all">💳 All Ad Accounts (সব একাউন্ট)</option>
              {adAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>💳 {acc.account_name} ({acc.platform})</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAccountModal(true)}
            className="btn btn-secondary"
            style={{ gap: '6px', fontWeight: '700', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
            title="Create & Manage Ad Accounts"
          >
            <Settings size={15} />
            <span>Ad Accounts</span>
          </button>

          <DateRangeFilter
            onFilterChange={({ startDate: s, endDate: e }) => {
              setStartDate(s);
              setEndDate(e);
            }}
          />

          <button 
            onClick={() => {
              setAdItems([{ product_id: '', amount_usd: '', notes: '' }]);
              setShowModal(true);
            }} 
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>+ Log Paid Ad Expense</span>
          </button>

          <button 
            onClick={() => setShowBulkModal(true)} 
            className="btn btn-secondary"
            style={{ gap: '6px', fontWeight: '700' }}
          >
            <FileSpreadsheet size={16} color="var(--success)" />
            <span>Bulk Import Excel</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Total Ad Spend (USD)</span>
          <strong style={{ fontSize: '24px', color: 'var(--accent-primary)' }}>${totalUsdSpent.toFixed(2)}</strong>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Total Ad Spend (BDT Expense)</span>
          <strong style={{ fontSize: '24px', color: 'var(--danger)' }}>{currency}{totalBdtSpent.toFixed(2)}</strong>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Total Campaigns Logged</span>
          <strong style={{ fontSize: '24px' }}>{filteredAdsList.length}</strong>
        </div>
      </div>

      {/* Ad Account Spend Breakdown Cards */}
      {adAccounts.length > 0 && (
        <div className="glass-card" style={{ padding: '18px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={16} color="var(--accent-primary)" />
              <span>Ad Account Monthly Spend Breakdown (একাউন্টভিত্তিক ডলার খরচ)</span>
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Filter: {selectedAccountFilter === 'all' ? 'All Accounts' : 'Selected Account'}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {accountSummaries.map(acc => (
              <div
                key={acc.id}
                onClick={() => setSelectedAccountFilter(String(acc.id))}
                style={{
                  background: selectedAccountFilter === String(acc.id) ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-secondary)',
                  border: `1px solid ${selectedAccountFilter === String(acc.id) ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  padding: '12px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  💳 {acc.account_name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {acc.platform} • {acc.count} campaigns
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '15px', color: 'var(--accent-primary)' }}>${acc.totalUsd.toFixed(2)}</strong>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--danger)' }}>{currency}{acc.totalBdt.toFixed(2)}</span>
                </div>
              </div>
            ))}

            {unassignedAds.length > 0 && (
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px dashed var(--border-color)',
                  padding: '12px 14px',
                  borderRadius: '10px'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Unassigned Campaigns
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  General • {unassignedAds.length} campaigns
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '15px', color: 'var(--accent-primary)' }}>${unassignedUsd.toFixed(2)}</strong>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--danger)' }}>{currency}{unassignedBdt.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paid Ads Table Log */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Paid Ad Campaigns History</h3>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ad Date</th>
                <th>Target Product</th>
                <th>Platform</th>
                <th>Ad Cost ($ USD)</th>
                <th>Exchange Rate</th>
                <th>Total BDT Cost ({currency})</th>
                <th>Notes</th>
                {isOwner && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredAdsList.length === 0 ? (
                <tr>
                  <td colSpan={isOwner ? 8 : 7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No paid ad campaigns recorded for this selected date period.
                  </td>
                </tr>
              ) : (
                filteredAdsList.map(ad => (
                  <tr key={ad.id}>
                    <td style={{ fontSize: '13px', fontWeight: '600' }}>
                      {new Date(ad.ad_date).toLocaleDateString()}
                    </td>
                    <td>
                      <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{ad.product_name}</strong>
                    </td>
                    <td>
                      <span className="badge badge-primary" style={{ fontSize: '12px' }}>
                        {ad.platform}
                      </span>
                    </td>
                    <td style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-primary)' }}>
                      ${Number(ad.amount_usd).toFixed(2)}
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      ৳{Number(ad.exchange_rate).toFixed(2)} / $
                    </td>
                    <td style={{ fontSize: '14px', fontWeight: '800', color: 'var(--danger)' }}>
                      {currency}{Number(ad.total_bdt_cost).toFixed(2)}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ad.notes || '-'}</td>
                    {isOwner && (
                      <td>
                        <button onClick={() => handleDeleteAd(ad.id)} className="btn btn-secondary btn-icon btn-sm" title="Delete Log">
                          <Trash2 size={15} color="var(--danger)" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Paid Ad Modal (Multi-Product Supported) */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Megaphone size={20} color="var(--accent-primary)" />
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Log Paid Ad Marketing Expense</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Log ad spend for single or multiple products simultaneously</span>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitAd}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* 1. Shared Campaign Settings Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '10px', background: 'var(--bg-primary)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ color: 'var(--accent-primary)', fontWeight: '700' }}>Ad Account (অ্যাড একাউন্ট)</label>
                    <select
                      className="form-select"
                      value={selectedAdAccount}
                      onChange={(e) => setSelectedAdAccount(e.target.value)}
                    >
                      <option value="">Choose Ad Account...</option>
                      {adAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>💳 {acc.account_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Ad Campaign Date</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={adDate}
                      onChange={(e) => setAdDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Ad Platform</label>
                    <select
                      className="form-select"
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                    >
                      <option value="Facebook Ads">Facebook / Meta Ads</option>
                      <option value="Google Ads">Google / YouTube Ads</option>
                      <option value="TikTok Ads">TikTok Ads</option>
                      <option value="Influencer Marketing">Influencer Marketing</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Dollar Rate (৳/$)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: 'var(--text-muted)' }}>৳</span>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        style={{ paddingLeft: '24px' }}
                        required
                        placeholder="122.00"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Product-wise Ad Cost Rows (Multi-Product Section) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Layers size={16} color="var(--accent-primary)" />
                      <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Product-wise Ad Cost Breakdown</strong>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddAdItem}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '12px' }}
                    >
                      <Plus size={14} />
                      <span>+ Add Another Product</span>
                    </button>
                  </div>

                  {adItems.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        padding: '14px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)' }}>
                          Product #{index + 1}
                        </span>

                        {adItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAdItem(index)}
                            className="btn btn-secondary btn-icon btn-sm"
                            title="Remove Product"
                            style={{ width: '28px', height: '28px' }}
                          >
                            <Trash2 size={14} color="var(--danger)" />
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '12px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '12px' }}>Target Product</label>
                          <ProductSelectSearch
                            products={products}
                            selectedId={item.product_id}
                            onSelect={(id) => handleAdItemChange(index, 'product_id', id)}
                            placeholder="Search & select product..."
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '12px' }}>Ad Spend ($ USD)</label>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: 'var(--text-muted)' }}>$</span>
                            <input
                              type="number"
                              step="0.01"
                              className="form-input"
                              style={{ paddingLeft: '28px' }}
                              required
                              placeholder="e.g. 5.00"
                              value={item.amount_usd}
                              onChange={(e) => handleAdItemChange(index, 'amount_usd', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '12px', padding: '6px 10px' }}
                          placeholder="Specific product campaign notes (optional)..."
                          value={item.notes || ''}
                          onChange={(e) => handleAdItemChange(index, 'notes', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddAdItem}
                    className="btn btn-secondary"
                    style={{ borderStyle: 'dashed', justifyContent: 'center', width: '100%', padding: '10px' }}
                  >
                    <Plus size={16} />
                    <span>+ Add Product Ad Spend Row</span>
                  </button>
                </div>

                {/* 3. Common Campaign Notes & Live Batch Summary Box */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">General Campaign Notes / Tag (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. July Summer Sale Campaign #2"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* Live Currency & Batch Total Card */}
                <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>
                      Batch Total ({validProductsCount} Product{validProductsCount !== 1 ? 's' : ''})
                    </span>
                    <strong style={{ fontSize: '18px', color: 'var(--accent-primary)' }}>
                      ${totalBatchUsd.toFixed(2)} USD
                    </strong>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                      Total Expense @ ৳{rateNum.toFixed(2)}/$
                    </span>
                    <strong style={{ fontSize: '20px', color: 'var(--danger)' }}>
                      {currency}{totalBatchBdt}
                    </strong>
                  </div>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  Save All Paid Ad Expenses ({validProductsCount})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Paid Ads Modal */}
      <BulkImportAdsModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onImportSuccess={() => {
          refreshAllData();
          fetchAds();
        }}
        authFetch={authFetch}
        products={products}
        adAccounts={adAccounts}
      />
    </div>
  );
};
