import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Megaphone, Plus, DollarSign, Calculator, Trash2, Calendar, ShoppingBag, X } from 'lucide-react';

import { ProductSelectSearch } from '../components/ProductSelectSearch';

export const PaidAds = () => {
  const { authFetch, products, currency, refreshAllData, user } = useApp();
  const [adsList, setAdsList] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [platform, setPlatform] = useState('Facebook Ads');
  const [amountUsd, setAmountUsd] = useState('120');
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

  useEffect(() => {
    fetchAds();
  }, []);

  const handleSubmitAd = async (e) => {
    e.preventDefault();
    if (!amountUsd || Number(amountUsd) <= 0) return alert('Enter a valid USD ad cost.');

    try {
      const res = await authFetch('/api/ads', {
        method: 'POST',
        body: JSON.stringify({
          product_id: selectedProductId ? Number(selectedProductId) : null,
          platform,
          amount_usd: Number(amountUsd),
          exchange_rate: Number(exchangeRate || 120),
          ad_date: adDate,
          notes
        })
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setAmountUsd('');
        setNotes('');
        refreshAllData();
        fetchAds();
        alert('Paid Ad expense logged and synced with operating expenses successfully!');
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
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Metrics
  const totalUsdSpent = adsList.reduce((sum, ad) => sum + Number(ad.amount_usd), 0);
  const totalBdtSpent = adsList.reduce((sum, ad) => sum + Number(ad.total_bdt_cost), 0);
  const isOwner = user?.role === 'owner' || user?.role === 'superadmin';

  // Live Conversion Calculation for Form
  const usdNum = Number(amountUsd || 0);
  const rateNum = Number(exchangeRate || 120);
  const calculatedBdt = (usdNum * rateNum).toFixed(2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Megaphone size={24} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Paid Ads & Marketing Tracker</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Log product-wise Facebook/Google ad costs in USD ($) with custom exchange rate (৳/$)
          </p>
        </div>

        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>+ Log Paid Ad Expense</span>
        </button>
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
          <strong style={{ fontSize: '24px' }}>{adsList.length}</strong>
        </div>
      </div>

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
              {adsList.length === 0 ? (
                <tr>
                  <td colSpan={isOwner ? 8 : 7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No paid ad campaigns logged yet. Click "+ Log Paid Ad Expense" to record marketing costs.
                  </td>
                </tr>
              ) : (
                adsList.map(ad => (
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

      {/* Log Paid Ad Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Megaphone size={20} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Log Paid Ad Marketing Expense</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitAd}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Target Product (Optional)</label>
                    <ProductSelectSearch
                      products={products}
                      selectedId={selectedProductId}
                      onSelect={(id) => setSelectedProductId(id)}
                      placeholder="Type product name or code/SKU..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ad Campaign Date</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={adDate}
                      onChange={(e) => setAdDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
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

                {/* USD Amount & Exchange Rate Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Ad Spend Amount ($ USD)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: 'var(--text-muted)' }}>$</span>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        style={{ paddingLeft: '28px' }}
                        required
                        placeholder="120.00"
                        value={amountUsd}
                        onChange={(e) => setAmountUsd(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Dollar Rate (৳ BDT per 1$)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: 'var(--text-muted)' }}>৳</span>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        style={{ paddingLeft: '28px' }}
                        required
                        placeholder="122.00"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Live Currency Conversion Card */}
                {amountUsd && exchangeRate && (
                  <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <span>Calculation Formula: </span>
                      <strong>${usdNum.toFixed(2)} × ৳{rateNum.toFixed(2)}</strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textAlign: 'right' }}>Total Expense</span>
                      <strong style={{ fontSize: '18px', color: 'var(--danger)' }}>{currency}{calculatedBdt}</strong>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Notes / Campaign Details (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. July Summer Campaign #2"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  Save Paid Ad Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
