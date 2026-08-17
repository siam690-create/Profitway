import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Megaphone, Plus, DollarSign, Calculator, Trash2, Calendar, ShoppingBag, X, Layers, FileSpreadsheet, CreditCard, Settings, Filter, Zap, RefreshCw, CheckCircle2, Link2 } from 'lucide-react';

import { ProductSelectSearch } from '../components/ProductSelectSearch';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { BulkImportAdsModal } from '../components/BulkImportAdsModal';

export const PaidAds = () => {
  const { authFetch, products, currency, refreshAllData, user, showToast } = useApp();
  const [adsList, setAdsList] = useState([]);
  const [adAccounts, setAdAccounts] = useState([]);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState('all');
  const [selectedProductFilter, setSelectedProductFilter] = useState('all');
  const [selectedAdAccount, setSelectedAdAccount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  // Meta Auto Syncing State
  const [isSyncingMeta, setIsSyncingMeta] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncTargetDate, setSyncTargetDate] = useState(new Date().toISOString().slice(0, 10));
  const [syncDatePreset, setSyncDatePreset] = useState('today');
  const [syncAdAccountId, setSyncAdAccountId] = useState('all');

  // Ad Account Create / Edit Form
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountPlatform, setNewAccountPlatform] = useState('Facebook Ads');
  const [newAccountIdCode, setNewAccountIdCode] = useState('');
  const [newAccountAccessToken, setNewAccountAccessToken] = useState('');
  const [newAccountExchangeRate, setNewAccountExchangeRate] = useState('127');
  const [newAccountDefaultProduct, setNewAccountDefaultProduct] = useState('');
  const [newAccountIsMetaConnected, setNewAccountIsMetaConnected] = useState(true);

  // Multi-Product Ad Items Form State
  const [adItems, setAdItems] = useState([
    { product_id: '', amount_usd: '', notes: '' }
  ]);
  const [platform, setPlatform] = useState('Facebook Ads');
  const [exchangeRate, setExchangeRate] = useState('127');
  const [adDate, setAdDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  // Manual Product Linking State
  const [linkingAdRecord, setLinkingAdRecord] = useState(null);
  const [linkingProductId, setLinkingProductId] = useState('');

  const handleSaveProductLink = async (e) => {
    e.preventDefault();
    if (!linkingAdRecord || !linkingProductId) return;
    try {
      const res = await authFetch(`/api/ads/${linkingAdRecord.id}/link-product`, {
        method: 'PATCH',
        body: JSON.stringify({ product_id: linkingProductId })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Product linked successfully!', 'success');
        setLinkingAdRecord(null);
        setLinkingProductId('');
        fetchAds();
        refreshAllData();
      } else {
        showToast(`Error: ${data.error}`, 'error');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

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

  const handleMetaSync = async (e) => {
    if (e) e.preventDefault();
    if (isSyncingMeta) return;
    setIsSyncingMeta(true);
    setShowSyncModal(false);
    try {
      let targetDateVal = undefined;
      if (syncDatePreset === 'custom') {
        targetDateVal = syncTargetDate;
      } else if (syncDatePreset === 'today') {
        targetDateVal = new Date().toISOString().slice(0, 10);
      }

      const payload = {
        ad_account_id: syncAdAccountId,
        date_preset: syncDatePreset === 'custom' ? undefined : syncDatePreset,
        date: targetDateVal
      };

      const res = await authFetch('/api/ads/meta-sync', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Meta Marketing API synced successfully!', 'success');
        fetchAds();
        fetchAdAccounts();
        refreshAllData();
      } else {
        showToast(`Meta Sync Error: ${data.error}`, 'error');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setIsSyncingMeta(false);
    }
  };

  const resetAccountForm = () => {
    setEditingAccountId(null);
    setNewAccountName('');
    setNewAccountPlatform('Facebook Ads');
    setNewAccountIdCode('');
    setNewAccountAccessToken('');
    setNewAccountExchangeRate('127');
    setNewAccountDefaultProduct('');
    setNewAccountIsMetaConnected(true);
  };

  const handleEditAccount = (acc) => {
    setEditingAccountId(acc.id);
    setNewAccountName(acc.account_name || '');
    setNewAccountPlatform(acc.platform || 'Facebook Ads');
    setNewAccountIdCode(acc.meta_account_id || acc.account_id_code || '');
    setNewAccountAccessToken(acc.access_token || '');
    setNewAccountExchangeRate(acc.exchange_rate ? String(acc.exchange_rate) : '127');
    setNewAccountDefaultProduct(acc.default_product_id ? String(acc.default_product_id) : '');
    setNewAccountIsMetaConnected(Boolean(acc.is_meta_connected));
  };

  const handleCreateOrUpdateAccount = async (e) => {
    e.preventDefault();
    if (!newAccountName.trim()) return alert('Please enter Ad Account Name');
    try {
      const endpoint = editingAccountId ? `/api/ads/accounts/${editingAccountId}` : '/api/ads/accounts';
      const method = editingAccountId ? 'PUT' : 'POST';

      const res = await authFetch(endpoint, {
        method,
        body: JSON.stringify({
          account_name: newAccountName.trim(),
          platform: newAccountPlatform,
          account_id_code: newAccountIdCode.trim(),
          meta_account_id: newAccountIdCode.trim(),
          access_token: newAccountAccessToken.trim(),
          exchange_rate: newAccountExchangeRate ? Number(newAccountExchangeRate) : 127.00,
          default_product_id: newAccountDefaultProduct ? Number(newAccountDefaultProduct) : null,
          is_meta_connected: newAccountIsMetaConnected ? 1 : 0
        })
      });
      const data = await res.json();
      if (res.ok) {
        resetAccountForm();
        fetchAdAccounts();
        showToast(editingAccountId ? 'Ad Account updated successfully!' : 'Ad Account connected successfully!', 'success');
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitAd = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const validItems = adItems.filter(item => Number(item.amount_usd) > 0);
    if (validItems.length === 0) {
      return alert('Please enter at least one product with a valid USD ad spend amount ($).');
    }

    const matchedAccount = adAccounts.find(a => Number(a.id) === Number(selectedAdAccount));

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
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

  // Metrics Filtered by Date, Ad Account & Product
  const filteredAdsList = adsList.filter(ad => {
    if (selectedAccountFilter !== 'all' && Number(ad.ad_account_id) !== Number(selectedAccountFilter)) {
      return false;
    }
    if (selectedProductFilter !== 'all') {
      if (selectedProductFilter === 'unlinked') {
        if (ad.product_id && !ad.product_name?.includes('General')) return false;
      } else if (Number(ad.product_id) !== Number(selectedProductFilter)) {
        return false;
      }
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
            onClick={() => setShowSyncModal(true)} 
            disabled={isSyncingMeta}
            className="btn btn-secondary"
            style={{ 
              gap: '6px', 
              fontWeight: '700', 
              background: 'linear-gradient(135deg, rgba(24, 119, 242, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)', 
              borderColor: '#1877f2', 
              color: '#38bdf8' 
            }}
            title="Auto Sync Meta Marketing API Campaign Spend"
          >
            {isSyncingMeta ? (
              <>
                <RefreshCw size={16} className="spin" />
                <span>Syncing Meta Ads...</span>
              </>
            ) : (
              <>
                <Zap size={16} color="#38bdf8" />
                <span>⚡ Sync Meta Ads (অটো সিঙ্ক)</span>
              </>
            )}
          </button>

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Paid Ad Campaigns History</h3>

          {/* Product-wise Filter Dropdown using ProductSelectSearch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '320px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Filter by Product:</span>
            <div style={{ flex: 1 }}>
              <ProductSelectSearch
                products={products}
                selectedId={selectedProductFilter}
                onSelect={(id) => setSelectedProductFilter(id || 'all')}
                placeholder="Search product name or SKU to filter..."
                allowAllOption={true}
                allOptionLabel={`📦 All Target Products (${adsList.length} campaigns)`}
                customOptions={[
                  { id: 'unlinked', name: '🔗 Unlinked / General Shop Campaigns' }
                ]}
              />
            </div>
          </div>
        </div>

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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {!ad.product_id || ad.product_name?.includes('General') ? (
                            <button
                              onClick={() => {
                                setLinkingAdRecord(ad);
                                setLinkingProductId(ad.product_id ? String(ad.product_id) : '');
                              }}
                              className="btn btn-secondary btn-xs"
                              style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.4)', fontWeight: '700', gap: '4px' }}
                              title="Manually link this ad spend to a specific inventory product"
                            >
                              <Link2 size={12} />
                              <span>🔗 Link Product ({ad.product_name || 'Unassigned'})</span>
                            </button>
                          ) : (
                            <>
                              <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{ad.product_name}</strong>
                              <button
                                onClick={() => {
                                  setLinkingAdRecord(ad);
                                  setLinkingProductId(String(ad.product_id));
                                }}
                                className="btn btn-secondary btn-icon btn-xs"
                                title="Change / re-map linked product"
                                style={{ padding: '2px 4px' }}
                              >
                                <Link2 size={12} color="var(--accent-primary)" />
                              </button>
                            </>
                          )}
                        </div>

                        {ad.meta_campaign_name && (
                          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '600' }}>
                            📢 {ad.meta_campaign_name}
                          </span>
                        )}
                      </div>
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
                <button type="submit" className="btn btn-success" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving Paid Ad Expense...' : `Save All Paid Ad Expenses (${validProductsCount})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AD ACCOUNTS MANAGER */}
      {showAccountModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>
                  {editingAccountId ? 'Edit Ad Account Connection' : 'Connect Meta & Ad Accounts'}
                </h3>
              </div>
              <button onClick={() => { resetAccountForm(); setShowAccountModal(false); }} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Form to Add / Edit Meta Ad Account */}
              <form onSubmit={handleCreateOrUpdateAccount} style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--accent-primary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '14px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={16} />
                    <span>{editingAccountId ? 'Edit Meta Ad Account Setup' : '+ Connect New Meta Ad Account'}</span>
                  </strong>
                  {editingAccountId && (
                    <button type="button" onClick={resetAccountForm} className="btn btn-secondary btn-xs">Cancel Edit</button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px' }}>Ad Account Name / Title *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Cholojai Meta Ad Account 1"
                      value={newAccountName}
                      onChange={(e) => setNewAccountName(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px' }}>Platform</label>
                    <select
                      className="form-select"
                      value={newAccountPlatform}
                      onChange={(e) => setNewAccountPlatform(e.target.value)}
                    >
                      <option value="Facebook Ads">Facebook / Meta Ads</option>
                      <option value="Google Ads">Google Ads</option>
                      <option value="TikTok Ads">TikTok Ads</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px' }}>Meta Ad Account ID (act_XXXXXXXXXXX)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. act_1234567890"
                      value={newAccountIdCode}
                      onChange={(e) => setNewAccountIdCode(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px' }}>Default Exchange Rate (৳/$)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="e.g. 127.00"
                      value={newAccountExchangeRate}
                      onChange={(e) => setNewAccountExchangeRate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Meta System / User Access Token (Marketing API)</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="e.g. EAAB..."
                    value={newAccountAccessToken}
                    onChange={(e) => setNewAccountAccessToken(e.target.value)}
                  />
                  <small style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                    Generate User / System Access Token from Meta Business Manager with ads_read permission.
                  </small>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px', alignItems: 'center' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px' }}>Sync Default Linked Product (Fallback)</label>
                    <select
                      className="form-select"
                      value={newAccountDefaultProduct}
                      onChange={(e) => setNewAccountDefaultProduct(e.target.value)}
                    >
                      <option value="">Auto-match product by campaign name...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({currency}{p.selling_price})</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px' }}>
                    <input
                      type="checkbox"
                      id="isMetaConn"
                      checked={newAccountIsMetaConnected}
                      onChange={(e) => setNewAccountIsMetaConnected(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label htmlFor="isMetaConn" style={{ fontSize: '12px', fontWeight: '700', cursor: 'pointer', color: '#38bdf8' }}>
                      Enable Meta Auto-Sync ⚡
                    </label>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: '6px' }}>
                  <Plus size={14} />
                  <span>{editingAccountId ? 'Update Ad Account' : 'Save & Connect Ad Account'}</span>
                </button>
              </form>

              {/* List of Existing Connected Ad Accounts */}
              <div>
                <strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>Connected Ad Accounts ({adAccounts.length})</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                  {adAccounts.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
                      No ad accounts created yet. Connect your first Meta Ad Account above!
                    </div>
                  ) : (
                    adAccounts.map(acc => (
                      <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '13px' }}>💳 {acc.account_name}</strong>
                            {acc.is_meta_connected ? (
                              <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700' }}>
                                🟢 Meta API Active
                              </span>
                            ) : (
                              <span style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '12px', fontSize: '10px' }}>
                                ⚪ Manual
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {acc.platform} {acc.meta_account_id || acc.account_id_code ? `• ID: ${acc.meta_account_id || acc.account_id_code}` : ''} • Exchange: ৳{acc.exchange_rate || 127}/$
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button onClick={() => handleEditAccount(acc)} className="btn btn-secondary btn-icon btn-xs" title="Edit Settings">
                            <Settings size={13} color="var(--accent-primary)" />
                          </button>
                          <button onClick={() => handleDeleteAccount(acc.id)} className="btn btn-secondary btn-icon btn-xs" title="Delete Account">
                            <Trash2 size={13} color="var(--danger)" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => { resetAccountForm(); setShowAccountModal(false); }} className="btn btn-secondary">Done</button>
            </div>
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

      {/* MODAL: META AD SYNC DATE OPTIONS */}
      {showSyncModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={20} color="#38bdf8" />
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>⚡ Meta Ads Auto-Sync</h3>
              </div>
              <button onClick={() => setShowSyncModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>

            <form onSubmit={handleMetaSync}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Pull live campaign ad spend from connected Meta Ad Accounts and auto-match products in inventory.
                </p>

                <div className="form-group">
                  <label className="form-label">Select Target Date / Period (তারিখ বা সময় নির্বাচন করুন)</label>
                  <select
                    className="form-select"
                    value={syncDatePreset}
                    onChange={(e) => setSyncDatePreset(e.target.value)}
                  >
                    <option value="today">⚡ Today (আজকের খরচ)</option>
                    <option value="yesterday">📅 Yesterday (গতকালের খরচ)</option>
                    <option value="last_7d">📆 Last 7 Days (গত ৭ দিন)</option>
                    <option value="last_30d">📊 Last 30 Days (গত ৩০ দিন)</option>
                    <option value="custom">📅 Custom Date (নির্দিষ্ট তারিখ - যেমন ۱۵/08/2026)</option>
                  </select>
                </div>

                {syncDatePreset === 'custom' && (
                  <div className="form-group">
                    <label className="form-label">Custom Target Date (তারিখ বেছে নিন)</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={syncTargetDate}
                      onChange={(e) => setSyncTargetDate(e.target.value)}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '700' }}>Select Ad Account (অ্যাড একাউন্ট বেছে নিন)</label>
                  <select
                    className="form-select"
                    value={syncAdAccountId}
                    onChange={(e) => setSyncAdAccountId(e.target.value)}
                  >
                    <option value="all">💳 All Connected Meta Ad Accounts (সবগুলো একাউন্ট)</option>
                    {adAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>💳 {acc.account_name} ({acc.platform})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowSyncModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #1877f2 0%, #6366f1 100%)' }} disabled={isSyncingMeta}>
                  {isSyncingMeta ? 'Syncing Meta Marketing API...' : '⚡ Execute Meta Sync Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL LINK AD TO PRODUCT */}
      {linkingAdRecord && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link2 size={20} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Link Ad Campaign to Product</h3>
              </div>
              <button onClick={() => setLinkingAdRecord(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveProductLink}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--accent-primary)', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Facebook / Meta Campaign Name:</span>
                  <strong style={{ color: '#38bdf8', fontSize: '14px', display: 'block', marginTop: '2px', wordBreak: 'break-word' }}>
                    📢 {linkingAdRecord.meta_campaign_name || linkingAdRecord.notes || linkingAdRecord.product_name || 'Meta Ad Campaign'}
                  </strong>
                  {linkingAdRecord.ad_account_name && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Ad Account: 💳 {linkingAdRecord.ad_account_name}
                    </span>
                  )}
                  <span style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '4px', display: 'block', fontWeight: '700' }}>
                    Ad Date: {new Date(linkingAdRecord.ad_date).toLocaleDateString()} • Spend: ${Number(linkingAdRecord.amount_usd).toFixed(2)} ({currency}{Number(linkingAdRecord.total_bdt_cost).toFixed(2)})
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '700' }}>Select Product from Inventory (প্রোডাক্ট টাইপ বা সার্চ করুন) *</label>
                  <ProductSelectSearch
                    products={products}
                    selectedId={linkingProductId}
                    onSelect={(id) => setLinkingProductId(id)}
                    placeholder="Search product by name or SKU..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setLinkingAdRecord(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product Link 🔗</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
