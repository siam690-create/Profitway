import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Key, 
  Plus, 
  Copy, 
  Check, 
  Globe, 
  Trash2, 
  Code, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  Power
} from 'lucide-react';

export const StoreApiKeysManager = () => {
  const { authFetch } = useApp();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  const [activeSnippetTab, setActiveSnippetTab] = useState('curl'); // 'curl' | 'php' | 'json'

  // Form State
  const [storeName, setStoreName] = useState('');
  const [storeDomain, setStoreDomain] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/store-api-keys');
      const data = await res.json();
      if (res.ok) {
        setKeys(data);
      }
    } catch (err) {
      console.error('Error fetching Store API Keys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!storeName) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await authFetch('/api/store-api-keys', {
        method: 'POST',
        body: JSON.stringify({
          store_name: storeName,
          store_domain: storeDomain,
          notes
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStoreName('');
        setStoreDomain('');
        setNotes('');
        setShowModal(false);
        fetchKeys();
        alert(`🎉 API Key generated successfully!\nKey: ${data.key.api_key}`);
      } else {
        setErrorMsg(data.error || 'Failed to generate API Key.');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (keyId, currentStatus) => {
    try {
      const res = await authFetch(`/api/store-api-keys/${keyId}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (res.ok) {
        fetchKeys();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteKey = async (keyId, storeName) => {
    if (window.confirm(`Are you sure you want to delete the API Key for "${storeName}"? External orders from this key will no longer be ingested.`)) {
      try {
        const res = await authFetch(`/api/store-api-keys/${keyId}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          fetchKeys();
        }
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(''), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08))', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Globe size={24} color="#818cf8" />
              <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Multi-Store Order Ingestion API Keys</h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '750px' }}>
              Connect multiple external WooCommerce, Shopify, or custom websites. When orders occur on your external sites, they automatically push into Profitway SaaS, deduct stock, and update your live profit analytics.
            </p>
          </div>

          <button 
            onClick={() => setShowModal(true)} 
            className="btn btn-primary"
            style={{ padding: '12px 20px', fontWeight: '800', gap: '8px', background: 'linear-gradient(90deg, #6366f1, #4f46e5)' }}
          >
            <Plus size={18} />
            <span>Connect External Store API Key</span>
          </button>
        </div>
      </div>

      {/* API Keys Table Directory */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Connected Stores & Active API Keys</h3>
          <button onClick={fetchKeys} className="btn btn-secondary btn-sm" title="Refresh Keys List">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {keys.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Key size={36} color="var(--text-muted)" style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ fontSize: '14px', fontWeight: '600' }}>No external store API keys generated yet.</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>Click "Connect External Store API Key" to generate a token for WooCommerce or Shopify.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Store Name</th>
                  <th>Domain / Website</th>
                  <th>API Token Key</th>
                  <th>Ingested Orders</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td>
                      <strong style={{ color: 'var(--accent-primary)', fontSize: '14px' }}>{k.store_name}</strong>
                      {k.notes && <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>{k.notes}</span>}
                    </td>
                    <td style={{ fontSize: '13px' }}>
                      {k.store_domain ? (
                        <a href={k.store_domain.startsWith('http') ? k.store_domain : `https://${k.store_domain}`} target="_blank" rel="noreferrer" style={{ color: '#818cf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{k.store_domain}</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--bg-primary)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', fontFamily: 'monospace' }}>
                        <span>{k.api_key.substring(0, 16)}...</span>
                        <button 
                          onClick={() => copyToClipboard(k.api_key)} 
                          style={{ background: 'transparent', border: 'none', color: copiedKey === k.api_key ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer' }}
                          title="Copy Full API Key"
                        >
                          {copiedKey === k.api_key ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontWeight: '800', fontSize: '12px' }}>
                        <ShoppingBag size={12} style={{ marginRight: '4px' }} />
                        {k.total_ingested_orders || 0} Orders
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${k.is_active ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: '800' }}>
                        {k.is_active ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(k.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleToggleActive(k.id, k.is_active)}
                          className={`btn btn-sm ${k.is_active ? 'btn-secondary' : 'btn-success'}`}
                          title={k.is_active ? 'Disable API Key' : 'Enable API Key'}
                        >
                          <Power size={14} />
                          <span>{k.is_active ? 'Disable' : 'Enable'}</span>
                        </button>

                        <button 
                          onClick={() => handleDeleteKey(k.id, k.store_name)} 
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--danger)' }}
                          title="Delete API Key"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REST API Integration Code Snippets & Documentation Card */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code size={20} color="#818cf8" />
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Developer API Endpoint & Integration Specs</h3>
          </div>

          {/* Snippet Switcher Tabs */}
          <div style={{ display: 'inline-flex', background: 'var(--bg-primary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            {['curl', 'php', 'json'].map((t) => (
              <button 
                key={t}
                onClick={() => setActiveSnippetTab(t)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeSnippetTab === t ? 'var(--accent-primary)' : 'transparent',
                  color: activeSnippetTab === t ? '#fff' : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Endpoint URL: <code style={{ color: 'var(--success)', background: 'var(--bg-primary)', padding: '3px 8px', borderRadius: '4px' }}>POST https://profitway.bd/api/v1/orders/import</code>
        </div>

        {/* Code View Block */}
        <pre style={{ background: '#0a0f1d', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '16px', fontSize: '12px', color: '#38bdf8', overflowX: 'auto', lineHeight: '1.5' }}>
          {activeSnippetTab === 'curl' && `curl -X POST https://profitway.bd/api/v1/orders/import \\
  -H "X-API-Key: pw_store_YOUR_API_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "external_order_id": "9842",
    "customer_name": "Rahim Ahmed",
    "customer_phone": "01700000000",
    "customer_email": "rahim@example.com",
    "shipping_address": "House 12, Road 5, Mirpur 10, Dhaka",
    "payment_method": "bKash / COD",
    "product_sku": "AUDIO-EAR-001",
    "quantity": 1,
    "unit_price": 1850,
    "total_amount": 1850
  }'`}

          {activeSnippetTab === 'php' && `<?php
// WooCommerce / Custom PHP Webhook Ingestion Helper
$apiKey = 'pw_store_YOUR_API_KEY_HERE';
$url = 'https://profitway.bd/api/v1/orders/import';

$orderPayload = [
    'external_order_id' => '1004',
    'customer_name'     => 'Tanvir Hossen',
    'customer_phone'    => '01811223344',
    'shipping_address'  => 'Chittagong, Bangladesh',
    'payment_method'    => 'Cash on Delivery',
    'items' => [
        [
            'product_sku' => 'TSHIRT-BLK-L',
            'quantity'    => 2,
            'unit_price'  => 650
        ]
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-API-Key: ' . $apiKey,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderPayload));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>`}

          {activeSnippetTab === 'json' && `{
  "external_order_id": "ORDER-5541",
  "customer_name": "Siam Shahriar",
  "customer_phone": "01711000111",
  "customer_email": "siam@example.com",
  "shipping_address": "Gulshan 2, Dhaka",
  "payment_method": "Nagad",
  "customer_note": "Deliver between 2 PM - 6 PM",
  "total_amount": 2500,
  "items": [
    {
      "product_sku": "AUDIO-EAR-001",
      "quantity": 1,
      "unit_price": 1850
    },
    {
      "product_sku": "TSHIRT-BLK-L",
      "quantity": 1,
      "unit_price": 650
    }
  ]
}`}
        </pre>
      </div>

      {/* CREATE NEW API KEY MODAL */}
      {showModal && (
        <div className="modal-overlay" style={{ background: 'rgba(10, 15, 29, 0.85)', backdropFilter: 'blur(10px)', zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '480px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '20px', padding: '28px', color: '#fff' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={20} color="#818cf8" />
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Connect External Store API</h3>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
            </div>

            {errorMsg && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '12px', color: '#f87171', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateKey} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1' }}>Store / Website Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. WooCommerce Main Store"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1' }}>Store Domain / Website URL</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. mystore.com or https://mystore.com"
                  value={storeDomain}
                  onChange={(e) => setStoreDomain(e.target.value)}
                  style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1' }}>Notes / Description</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Production WooCommerce Webhook Connection"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                />
              </div>

              <div className="modal-footer" style={{ border: 'none', padding: 0, marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(90deg, #6366f1, #4f46e5)', fontWeight: '800' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Generating Token...' : 'Generate API Key'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
