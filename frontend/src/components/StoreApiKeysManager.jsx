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
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header & Key Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code size={22} color="#818cf8" />
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                🌐 Developer API & External Website Integration Specs
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              WooCommerce, Shopify, Sohoz Pro, বা যেকোনো কাস্টম ওয়েবসাইট থেকে সরাসরি Profitway SaaS-এ অর্ডার পাঠানোর পূর্ণাঙ্গ ডকুমেন্টেশন।
            </p>
          </div>

          {/* Active Store Key Selector */}
          {keys.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-primary)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Active Token:</span>
              <code style={{ fontSize: '12px', color: '#818cf8', fontWeight: '700' }}>
                {keys.find(k => k.is_active)?.api_key ? `${keys.find(k => k.is_active)?.api_key.substring(0, 16)}...` : 'No Active Key'}
              </code>
            </div>
          )}
        </div>

        {/* HTTP Endpoint & Auth Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          <div style={{ background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>HTTP API Endpoint</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ background: '#10b981', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>POST</span>
              <code style={{ fontSize: '13px', color: '#38bdf8', fontWeight: '700' }}>https://profitway.bd/api/v1/orders/import</code>
            </div>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>Required Header Authentication</div>
            <div style={{ marginTop: '4px', fontSize: '13px', color: 'var(--text-primary)' }}>
              <code>X-API-Key: {keys.find(k => k.is_active)?.api_key || 'pw_store_YOUR_API_KEY'}</code>
            </div>
          </div>
        </div>

        {/* Code Snippet Tabs Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', background: 'var(--bg-primary)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            {[
              { id: 'woocommerce', label: 'WordPress / WooCommerce' },
              { id: 'curl', label: 'cURL / Postman' },
              { id: 'php', label: 'PHP / Laravel' },
              { id: 'nodejs', label: 'Node.js (Fetch)' },
              { id: 'python', label: 'Python (Requests)' },
              { id: 'json', label: 'JSON Schema' },
              { id: 'guide', label: '📘 বাংলা গাইড (Step-by-Step)' }
            ].map((t) => (
              <button 
                key={t.id}
                onClick={() => setActiveSnippetTab(t.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeSnippetTab === t.id ? 'var(--accent-primary)' : 'transparent',
                  color: activeSnippetTab === t.id ? '#fff' : 'var(--text-muted)',
                  fontSize: '12.5px',
                  fontWeight: activeSnippetTab === t.id ? '800' : '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeSnippetTab !== 'guide' && (
            <button
              onClick={() => {
                const activeKey = keys.find(k => k.is_active)?.api_key || 'pw_store_YOUR_API_KEY_HERE';
                let codeToCopy = '';
                if (activeSnippetTab === 'woocommerce') {
                  codeToCopy = `add_action('woocommerce_thankyou', 'profitway_sync_woocommerce_order', 20, 1);\nfunction profitway_sync_woocommerce_order($order_id) {\n    if (!$order_id) return;\n    $order = wc_get_order($order_id);\n    if (!$order || $order->get_meta('_profitway_synced')) return;\n\n    $items = [];\n    foreach ($order->get_items() as $item) {\n        $product = $item->get_product();\n        $sku = $product ? $product->get_sku() : '';\n        $qty = $item->get_quantity();\n        $items[] = [\n            'product_sku'  => !empty($sku) ? $sku : 'SKU-' . $item->get_product_id(),\n            'product_name' => $item->get_name(),\n            'quantity'     => (int)$qty,\n            'unit_price'   => (float)($qty > 0 ? ($item->get_subtotal() / $qty) : 0)\n        ];\n    }\n\n    $customer_name = trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name());\n    $shipping_address = trim(implode(', ', array_filter([\n        $order->get_shipping_address_1() ?: $order->get_billing_address_1(),\n        $order->get_shipping_city() ?: $order->get_billing_city(),\n        $order->get_shipping_state() ?: $order->get_billing_state()\n    ])));\n\n    $payload = [\n        'external_order_id' => (string)$order->get_id(),\n        'customer_name'     => !empty($customer_name) ? $customer_name : 'Customer',\n        'customer_phone'    => $order->get_billing_phone() ?: '01700000000',\n        'customer_email'    => $order->get_billing_email() ?: '',\n        'shipping_address'  => !empty($shipping_address) ? $shipping_address : 'Dhaka, Bangladesh',\n        'payment_method'    => $order->get_payment_method_title() ?: 'Cash on Delivery',\n        'delivery_fee'      => (float)$order->get_shipping_total(),\n        'total_amount'      => (float)$order->get_total(),\n        'customer_note'     => $order->get_customer_note() ?: '',\n        'items'             => $items\n    ];\n\n    $response = wp_remote_post('https://profitway.bd/api/v1/orders/import', [\n        'headers' => [\n            'Content-Type' => 'application/json',\n            'X-API-Key'    => '${activeKey}'\n        ],\n        'body'    => wp_json_encode($payload),\n        'timeout' => 20\n    ]);\n\n    if (!is_wp_error($response)) {\n        $code = wp_remote_retrieve_response_code($response);\n        if ($code >= 200 && $code < 300) {\n            $order->update_meta_data('_profitway_synced', 'yes');\n            $order->save();\n        }\n    }\n}`;
                } else if (activeSnippetTab === 'curl') {
                  codeToCopy = `curl -X POST https://profitway.bd/api/v1/orders/import \\\n  -H "X-API-Key: ${activeKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "external_order_id": "3086",\n    "customer_name": "মোঃ হাসান",\n    "customer_phone": "01798008642",\n    "customer_email": "hasan@example.com",\n    "shipping_address": "চার বাড়ি, পো: জমিরগঞ্জ, নোয়াখালী",\n    "payment_method": "Cash on Delivery",\n    "delivery_fee": 120.00,\n    "total_amount": 570.00,\n    "customer_note": "Call before delivery",\n    "items": [\n      {\n        "product_sku": "SKU-101",\n        "product_name": "Magic Pitha Maker",\n        "quantity": 1,\n        "unit_price": 450.00\n      }\n    ]\n  }'`;
                } else if (activeSnippetTab === 'php') {
                  codeToCopy = `<?php\n$apiKey = '${activeKey}';\n$url = 'https://profitway.bd/api/v1/orders/import';\n\n$payload = [\n    'external_order_id' => '1004',\n    'customer_name'     => 'Tanvir Hossen',\n    'customer_phone'    => '01811223344',\n    'customer_email'    => 'tanvir@gmail.com',\n    'shipping_address'  => 'House #12, Road #4, Sector #10, Uttara, Dhaka',\n    'payment_method'    => 'Cash on Delivery',\n    'delivery_fee'      => 70.00,\n    'total_amount'      => 1370.00,\n    'items' => [\n        [\n            'product_sku'  => 'TSHIRT-BLK-L',\n            'product_name' => 'Premium Black T-Shirt',\n            'quantity'     => 2,\n            'unit_price'   => 650.00\n        ]\n    ]\n];\n\n$ch = curl_init($url);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, [\n    'X-API-Key: ' . $apiKey,\n    'Content-Type: application/json'\n]);\ncurl_setopt($ch, CURLOPT_POST, true);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_TIMEOUT, 15);\n\n$response = curl_exec($ch);\ncurl_close($ch);\necho $response;\n?>`;
                } else if (activeSnippetTab === 'nodejs') {
                  codeToCopy = `const apiKey = '${activeKey}';\nconst endpoint = 'https://profitway.bd/api/v1/orders/import';\n\nconst orderPayload = {\n  external_order_id: 'ORD-9021',\n  customer_name: 'সাদিয়া ইসলাম',\n  customer_phone: '01912345678',\n  customer_email: 'sadia@gmail.com',\n  shipping_address: 'মিরপুর ২, ঢাকা',\n  payment_method: 'Cash on Delivery',\n  delivery_fee: 70.0,\n  total_amount: 1920.0,\n  items: [\n    {\n      product_sku: 'AUDIO-EAR-001',\n      product_name: 'Wireless Earbuds M10',\n      quantity: 1,\n      unit_price: 1850.0\n    }\n  ]\n};\n\nasync function syncOrder() {\n  const res = await fetch(endpoint, {\n    method: 'POST',\n    headers: {\n      'Content-Type': 'application/json',\n      'X-API-Key': apiKey\n    },\n    body: JSON.stringify(orderPayload)\n  });\n  const result = await res.json();\n  console.log(result);\n}\nsyncOrder();`;
                } else if (activeSnippetTab === 'python') {
                  codeToCopy = `import requests\n\napi_key = '${activeKey}'\nurl = 'https://profitway.bd/api/v1/orders/import'\n\npayload = {\n    "external_order_id": "PY-108",\n    "customer_name": "কামাল উদ্দিন",\n    "customer_phone": "01788990011",\n    "customer_email": "kamal@gmail.com",\n    "shipping_address": "জিইসি মোড়, চট্টগ্রাম",\n    "payment_method": "Cash on Delivery",\n    "delivery_fee": 120.0,\n    "total_amount": 970.0,\n    "items": [\n        {\n            "product_sku": "SKU-TRIMMER-T9",\n            "product_name": "Vintage T9 Trimmer",\n            "quantity": 1,\n            "unit_price": 850.0\n        }\n    ]\n}\n\nresponse = requests.post(url, json=payload, headers={\n    "X-API-Key": api_key,\n    "Content-Type": "application/json"\n}, timeout=15)\n\nprint(response.json())`;
                } else if (activeSnippetTab === 'json') {
                  codeToCopy = `{\n  "external_order_id": "ORDER-5541",\n  "customer_name": "মোঃ হাসান",\n  "customer_phone": "01798008642",\n  "customer_email": "hasan@gmail.com",\n  "shipping_address": "মিরপুর ১০, ঢাকা",\n  "payment_method": "Cash on Delivery",\n  "delivery_fee": 70.00,\n  "total_amount": 1920.00,\n  "customer_note": "ডেলিভারির আগে ফোন দিবেন",\n  "items": [\n    {\n      "product_sku": "AUDIO-EAR-001",\n      "product_name": "M10 Wireless Earbuds",\n      "quantity": 1,\n      "unit_price": 1850.00\n    }\n  ]\n}`;
                }
                navigator.clipboard.writeText(codeToCopy);
                setCopiedKey('code_copied');
                setTimeout(() => setCopiedKey(''), 2500);
              }}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', borderColor: 'rgba(129, 140, 248, 0.3)', fontWeight: '700' }}
            >
              {copiedKey === 'code_copied' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copiedKey === 'code_copied' ? 'Copied Code! ✓' : '📋 Copy Code'}</span>
            </button>
          )}
        </div>

        {/* CODE BLOCK / GUIDE DISPLAY */}
        {activeSnippetTab === 'guide' ? (
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', lineHeight: '1.6' }}>
            
            <div style={{ borderLeft: '4px solid #818cf8', paddingLeft: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: '800' }}>
                🚀 অন্য ওয়েবসাইট বা প্ল্যাটফর্ম থেকে Profitway-তে অর্ডার কানেক্ট করার ৩টি সহজ ধাপ:
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: '800', color: '#818cf8', fontSize: '14px', marginBottom: '6px' }}>
                  ১. API Key তৈরি করুন
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  উপরের <strong style={{ color: '#fff' }}>"+ Connect External Store API Key"</strong> বাটনে ক্লিক করে আপনার ওয়েবসাইটের নাম ও ডোমেইন দিয়ে একটি সিক্রেট কী তৈরি করুন।
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: '800', color: '#10b981', fontSize: '14px', marginBottom: '6px' }}>
                  ২. কোড বা Webhook বসান
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  - <strong>WordPress / WooCommerce:</strong> <code>WordPress / WooCommerce</code> ট্যাবের কোডটি কপি করে থিমের <code>functions.php</code>-তে বসান।<br/>
                  - <strong>Sohoz Pro / Funnel / Custom:</strong> Webhook URL দিন <code>https://profitway.bd/api/v1/orders/import</code> এবং Header-এ দিন <code>X-API-Key</code>।
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: '800', color: '#f59e0b', fontSize: '14px', marginBottom: '6px' }}>
                  ৩. প্রোডাক্ট SKU মিল রাখুন
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  অর্ডারে পাঠানো <code>product_sku</code> যদি Profitway-এর প্রোডাক্ট SKU-এর সাথে মিলে যায়, তবে অর্ডার আসার সাথে সাথে <strong>অটোমেটিক স্টক কমবে এবং রিয়েল-টাইম লাভ-ক্ষতি হিসাব হবে!</strong>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={20} style={{ flexShrink: 0 }} />
              <div>
                <strong>ডুপ্লিকেট অর্ডার প্রোটেকশন:</strong> একই <code>external_order_id</code> দুবার আসলে সিস্টেম স্বয়ংক্রিয়ভাবে শনাক্ত করবে এবং কোনো ভুল স্টক বা ডুপ্লিকেট ইনভয়েস তৈরি হতে দিবে না।
              </div>
            </div>

          </div>
        ) : (
          <pre style={{ background: '#0a0f1d', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '18px', fontSize: '12px', color: '#38bdf8', overflowX: 'auto', lineHeight: '1.55', maxHeight: '420px' }}>
            {activeSnippetTab === 'woocommerce' && `<?php
/**
 * Auto-sync WooCommerce Orders to Profitway SaaS
 * Paste this snippet into your active theme's functions.php or a snippet plugin (e.g. Code Snippets).
 */
add_action('woocommerce_thankyou', 'profitway_sync_woocommerce_order', 20, 1);
function profitway_sync_woocommerce_order($order_id) {
    if (!$order_id) return;

    $order = wc_get_order($order_id);
    if (!$order) return;

    // Prevent duplicate sync during multiple page reloads
    if ($order->get_meta('_profitway_synced')) return;

    $items = [];
    foreach ($order->get_items() as $item) {
        $product = $item->get_product();
        $sku = $product ? $product->get_sku() : '';
        $qty = $item->get_quantity();
        $price = $qty > 0 ? ($item->get_subtotal() / $qty) : 0;

        $items[] = [
            'product_sku'  => !empty($sku) ? $sku : 'SKU-' . $item->get_product_id(),
            'product_name' => $item->get_name(),
            'quantity'     => (int)$qty,
            'unit_price'   => (float)$price
        ];
    }

    $customer_name = trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name());
    if (empty($customer_name)) {
        $customer_name = trim($order->get_shipping_first_name() . ' ' . $order->get_shipping_last_name());
    }

    $shipping_address = trim(implode(', ', array_filter([
        $order->get_shipping_address_1() ?: $order->get_billing_address_1(),
        $order->get_shipping_address_2() ?: $order->get_billing_address_2(),
        $order->get_shipping_city() ?: $order->get_billing_city(),
        $order->get_shipping_state() ?: $order->get_billing_state()
    ])));

    $payload = [
        'external_order_id' => (string)$order->get_id(),
        'customer_name'     => !empty($customer_name) ? $customer_name : 'Customer',
        'customer_phone'    => $order->get_billing_phone() ?: '01700000000',
        'customer_email'    => $order->get_billing_email() ?: '',
        'shipping_address'  => !empty($shipping_address) ? $shipping_address : 'Dhaka, Bangladesh',
        'payment_method'    => $order->get_payment_method_title() ?: 'Cash on Delivery',
        'delivery_fee'      => (float)$order->get_shipping_total(),
        'total_amount'      => (float)$order->get_total(),
        'customer_note'     => $order->get_customer_note() ?: '',
        'items'             => $items
    ];

    $response = wp_remote_post('https://profitway.bd/api/v1/orders/import', [
        'headers' => [
            'Content-Type' => 'application/json',
            'X-API-Key'    => '${keys.find(k => k.is_active)?.api_key || 'pw_store_YOUR_API_KEY_HERE'}'
        ],
        'body'    => wp_json_encode($payload),
        'timeout' => 20
    ]);

    if (!is_wp_error($response)) {
        $code = wp_remote_retrieve_response_code($response);
        if ($code >= 200 && $code < 300) {
            $order->update_meta_data('_profitway_synced', 'yes');
            $order->save();
        }
    }
}`}

            {activeSnippetTab === 'curl' && `curl -X POST https://profitway.bd/api/v1/orders/import \\
  -H "X-API-Key: ${keys.find(k => k.is_active)?.api_key || 'pw_store_YOUR_API_KEY_HERE'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "external_order_id": "3086",
    "customer_name": "মোঃ হাসান",
    "customer_phone": "01798008642",
    "customer_email": "hasan@example.com",
    "shipping_address": "চার বাড়ি, পো: জমিরগঞ্জ, নোয়াখালী",
    "payment_method": "Cash on Delivery",
    "delivery_fee": 120.00,
    "total_amount": 570.00,
    "customer_note": "Call before delivery",
    "items": [
      {
        "product_sku": "SKU-101",
        "product_name": "Magic Pitha Maker",
        "quantity": 1,
        "unit_price": 450.00
      }
    ]
  }'`}

            {activeSnippetTab === 'php' && `<?php
// Custom PHP / Laravel Webhook Ingestion
$apiKey = '${keys.find(k => k.is_active)?.api_key || 'pw_store_YOUR_API_KEY_HERE'}';
$url = 'https://profitway.bd/api/v1/orders/import';

$payload = [
    'external_order_id' => '1004',
    'customer_name'     => 'Tanvir Hossen',
    'customer_phone'    => '01811223344',
    'customer_email'    => 'tanvir@gmail.com',
    'shipping_address'  => 'House #12, Road #4, Sector #10, Uttara, Dhaka',
    'payment_method'    => 'Cash on Delivery',
    'delivery_fee'      => 70.00,
    'total_amount'      => 1370.00,
    'items' => [
        [
            'product_sku'  => 'TSHIRT-BLK-L',
            'product_name' => 'Premium Black T-Shirt',
            'quantity'     => 2,
            'unit_price'   => 650.00
        ]
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-API-Key: ' . $apiKey,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>`}

            {activeSnippetTab === 'nodejs' && `// Node.js (Fetch API / Express / Next.js)
const apiKey = '${keys.find(k => k.is_active)?.api_key || 'pw_store_YOUR_API_KEY_HERE'}';
const endpoint = 'https://profitway.bd/api/v1/orders/import';

const orderPayload = {
  external_order_id: 'ORD-9021',
  customer_name: 'সাদিয়া ইসলাম',
  customer_phone: '01912345678',
  customer_email: 'sadia@gmail.com',
  shipping_address: 'মিরপুর ২, ঢাকা',
  payment_method: 'Cash on Delivery',
  delivery_fee: 70.0,
  total_amount: 1920.0,
  items: [
    {
      product_sku: 'AUDIO-EAR-001',
      product_name: 'Wireless Earbuds M10',
      quantity: 1,
      unit_price: 1850.0
    }
  ]
};

async function syncOrder() {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    },
    body: JSON.stringify(orderPayload)
  });

  const result = await res.json();
  console.log('Profitway Sync Result:', result);
}

syncOrder();`}

            {activeSnippetTab === 'python' && `import requests

api_key = '${keys.find(k => k.is_active)?.api_key || 'pw_store_YOUR_API_KEY_HERE'}'
url = 'https://profitway.bd/api/v1/orders/import'

payload = {
    "external_order_id": "PY-108",
    "customer_name": "কামাল উদ্দিন",
    "customer_phone": "01788990011",
    "customer_email": "kamal@gmail.com",
    "shipping_address": "জিইসি মোড়, চট্টগ্রাম",
    "payment_method": "Cash on Delivery",
    "delivery_fee": 120.0,
    "total_amount": 970.0,
    "items": [
        {
            "product_sku": "SKU-TRIMMER-T9",
            "product_name": "Vintage T9 Trimmer",
            "quantity": 1,
            "unit_price": 850.0
        }
    ]
}

response = requests.post(url, json=payload, headers={
    "X-API-Key": api_key,
    "Content-Type": "application/json"
}, timeout=15)

print("Status Code:", response.status_code)
print("Response JSON:", response.json())`}

            {activeSnippetTab === 'json' && `{
  "external_order_id": "3086",
  "customer_name": "মোঃ হাসান",
  "customer_phone": "01798008642",
  "customer_email": "hasan@gmail.com",
  "shipping_address": "চার বাড়ি, পো: জমিরগঞ্জ, নোয়াখালী",
  "payment_method": "Cash on Delivery",
  "delivery_fee": 120.00,
  "total_amount": 570.00,
  "customer_note": "ডেলিভারির আগে ফোন দিবেন",
  "items": [
    {
      "product_sku": "SKU-101",
      "product_name": "Magic Pitha Maker",
      "quantity": 1,
      "unit_price": 450.00
    }
  ]
}`}
          </pre>
        )}

        {/* API Parameters Reference Table */}
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 12px 0', color: 'var(--text-primary)' }}>
            📋 Request Body Parameters Schema
          </h4>
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
            <table className="data-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Field Name</th>
                  <th>Type</th>
                  <th>Required?</th>
                  <th>Description</th>
                  <th>Sample Value</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '12.5px' }}>
                <tr>
                  <td><code>external_order_id</code></td>
                  <td><span className="badge badge-secondary">String</span></td>
                  <td><span className="badge badge-danger">Required</span></td>
                  <td>আপনার ওয়েবসাইটের নিজস্ব Order ID / Invoice No (ডুপ্লিকেট প্রতিরোধ করে)</td>
                  <td><code>"3086"</code></td>
                </tr>
                <tr>
                  <td><code>customer_name</code></td>
                  <td><span className="badge badge-secondary">String</span></td>
                  <td><span className="badge badge-danger">Required</span></td>
                  <td>গ্রাহকের পুরো নাম</td>
                  <td><code>"মোঃ হাসান"</code></td>
                </tr>
                <tr>
                  <td><code>customer_phone</code></td>
                  <td><span className="badge badge-secondary">String</span></td>
                  <td><span className="badge badge-danger">Required</span></td>
                  <td>গ্রাহকের ১১ ডিজিটের মোবাইল নম্বর</td>
                  <td><code>"01798008642"</code></td>
                </tr>
                <tr>
                  <td><code>shipping_address</code></td>
                  <td><span className="badge badge-secondary">String</span></td>
                  <td><span className="badge badge-danger">Required</span></td>
                  <td>গ্রাহকের সম্পূর্ণ ডেলিভারি ঠিকানা (গ্রাম/রোড, থানা, জেলা)</td>
                  <td><code>"চার বাড়ি, নোয়াখালী"</code></td>
                </tr>
                <tr>
                  <td><code>items</code></td>
                  <td><span className="badge badge-secondary">Array</span></td>
                  <td><span className="badge badge-danger">Required</span></td>
                  <td>অর্ডারে থাকা প্রোডাক্টসমূহের তালিকা (Array of objects)</td>
                  <td><code>[&#123; product_sku: "...", quantity: 1 &#125;]</code></td>
                </tr>
                <tr>
                  <td><code>items[].product_sku</code></td>
                  <td><span className="badge badge-secondary">String</span></td>
                  <td><span className="badge badge-success">Recommended</span></td>
                  <td>Profitway প্রোডাক্টের SKU (ম্যাচ হলে স্টক কমবে ও লাভ হিসাব হবে)</td>
                  <td><code>"SKU-101"</code></td>
                </tr>
                <tr>
                  <td><code>items[].quantity</code></td>
                  <td><span className="badge badge-secondary">Number</span></td>
                  <td><span className="badge badge-danger">Required</span></td>
                  <td>প্রোডাক্টের পরিমাণ / সংখ্যা</td>
                  <td><code>1</code></td>
                </tr>
                <tr>
                  <td><code>items[].unit_price</code></td>
                  <td><span className="badge badge-secondary">Number</span></td>
                  <td><span className="badge badge-danger">Required</span></td>
                  <td>প্রতি পিস প্রোডাক্টের বিক্রয়মূল্য</td>
                  <td><code>450.00</code></td>
                </tr>
                <tr>
                  <td><code>delivery_fee</code></td>
                  <td><span className="badge badge-secondary">Number</span></td>
                  <td><span className="badge badge-secondary">Optional</span></td>
                  <td>ডেলিভারি চার্জ</td>
                  <td><code>120.00</code></td>
                </tr>
                <tr>
                  <td><code>total_amount</code></td>
                  <td><span className="badge badge-secondary">Number</span></td>
                  <td><span className="badge badge-secondary">Optional</span></td>
                  <td>ডেলিভারিসহ গ্রাহকের সর্বমোট ক্যাশ অন ডেলিভারি (COD) টাকা</td>
                  <td><code>570.00</code></td>
                </tr>
                <tr>
                  <td><code>payment_method</code></td>
                  <td><span className="badge badge-secondary">String</span></td>
                  <td><span className="badge badge-secondary">Optional</span></td>
                  <td>পেমেন্ট মেথড (যেমন: Cash on Delivery, bKash, Nagad)</td>
                  <td><code>"Cash on Delivery"</code></td>
                </tr>
                <tr>
                  <td><code>customer_note</code></td>
                  <td><span className="badge badge-secondary">String</span></td>
                  <td><span className="badge badge-secondary">Optional</span></td>
                  <td>গ্রাহকের বিশেষ ডেলিভারি নির্দেশিকা বা নোট</td>
                  <td><code>"Call before delivery"</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* API Response Specs */}
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 12px 0', color: 'var(--text-primary)' }}>
            📬 Expected Server Responses
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontWeight: '800', color: '#10b981', fontSize: '13px', marginBottom: '6px' }}>
                🟢 200 OK (Success Response)
              </div>
              <pre style={{ fontSize: '11.5px', color: '#34d399', margin: 0, overflowX: 'auto' }}>
{`{
  "success": true,
  "message": "Order successfully ingested into Profitway SaaS!",
  "order_id": 482,
  "order_number": "INV-10492",
  "external_order_id": "3086",
  "source": "TrendX",
  "total_amount": 570,
  "stock_deducted": true
}`}
              </pre>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontWeight: '800', color: '#ef4444', fontSize: '13px', marginBottom: '6px' }}>
                🔴 400 Bad Request / 401 Unauthorized
              </div>
              <pre style={{ fontSize: '11.5px', color: '#f87171', margin: 0, overflowX: 'auto' }}>
{`// Invalid API Key (401)
{
  "success": false,
  "error": "Invalid or inactive Store API Key."
}

// Missing Fields (400)
{
  "success": false,
  "error": "Missing required payload fields: external_order_id, customer_name, and customer_phone are mandatory."
}`}
              </pre>
            </div>
          </div>
        </div>

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
