import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight, 
  RefreshCw,
  Megaphone,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export const BulkImportAdsModal = ({ isOpen, onClose, onImportSuccess, authFetch, products = [] }) => {
  const [file, setFile] = useState(null);
  const [parsedAds, setParsedAds] = useState([]);
  const [invalidCount, setInvalidCount] = useState(0);
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview & Edit, 3: Importing
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // 1. Download Pre-Formatted Sample Excel Template for Paid Ads
  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        'Ad Date (YYYY-MM-DD)': '2026-08-04',
        'Product Code / SKU': 'PROD-1001',
        'Ad Cost ($ USD)': 5.50,
        'Ad Platform': 'Facebook Ads',
        'Dollar Rate (BDT)': 122.00,
        'Notes': 'Summer Campaign #1'
      },
      {
        'Ad Date (YYYY-MM-DD)': '2026-08-04',
        'Product Code / SKU': 'PROD-1002',
        'Ad Cost ($ USD)': 10.00,
        'Ad Platform': 'Facebook Ads',
        'Dollar Rate (BDT)': 122.00,
        'Notes': 'Video Ad Retargeting'
      },
      {
        'Ad Date (YYYY-MM-DD)': '2026-08-05',
        'Product Code / SKU': 'PROD-1003',
        'Ad Cost ($ USD)': 3.25,
        'Ad Platform': 'Google Ads',
        'Dollar Rate (BDT)': 122.00,
        'Notes': 'Search Keyword Ads'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    worksheet['!cols'] = [
      { wch: 20 }, // Ad Date
      { wch: 22 }, // Product Code / SKU
      { wch: 18 }, // Ad Cost USD
      { wch: 18 }, // Ad Platform
      { wch: 18 }, // Dollar Rate
      { wch: 28 }  // Notes
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample_Paid_Ads');
    XLSX.writeFile(workbook, 'Profitway_Sample_Paid_Ads_Template.xlsx');
  };

  // Helper to match product by code or explicit ID selection
  const findProductMatch = (codeStr, selectedProdId = null) => {
    if (selectedProdId === 'general') {
      return { id: null, name: 'General Shop Campaign', isMatched: true };
    }

    if (selectedProdId) {
      const p = products.find(prod => Number(prod.id) === Number(selectedProdId));
      if (p) return { id: p.id, name: p.name, isMatched: true };
    }

    const cleanCode = String(codeStr || '').trim().toLowerCase();
    if (!cleanCode) {
      return { id: null, name: 'General Shop Campaign', isMatched: true };
    }

    const found = products.find(p => {
      const pSku = String(p.sku || '').toLowerCase();
      const pCode = String(p.product_code || '').toLowerCase();
      const pId = String(p.id || '').toLowerCase();
      const pName = String(p.name || '').toLowerCase();
      return pSku === cleanCode || pCode === cleanCode || pId === cleanCode || pName === cleanCode;
    });

    if (found) {
      return { id: found.id, name: found.name, isMatched: true };
    }

    // Unmatched Product Code Error
    return { id: null, name: `⚠️ Code "${codeStr}" Not Found`, isMatched: false };
  };

  // 2. Parse Excel/CSV File & Match Product Code with Inventory Products
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array', codepage: 65001 });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setErrorMsg('The selected Excel/CSV file contains no data.');
          return;
        }

        let invalid = 0;
        const mapped = rawJson.map((row, idx) => {
          const getVal = (keywords) => {
            const keys = Object.keys(row);
            for (const k of keys) {
              const clean = k.trim().toLowerCase();
              if (keywords.some(kw => clean === kw || clean.startsWith(kw) || clean.includes(kw))) {
                return row[k];
              }
            }
            return '';
          };

          // Flexible Column Parsing
          let ad_date_raw = getVal(['ad date', 'date', 'ad_date', 'campaign date']);
          let ad_date = new Date().toISOString().slice(0, 10);
          
          if (ad_date_raw) {
            try {
              if (typeof ad_date_raw === 'number') {
                const parsedDate = new Date(Math.round((ad_date_raw - 25569) * 86400 * 1000));
                if (!isNaN(parsedDate.getTime())) {
                  ad_date = parsedDate.toISOString().slice(0, 10);
                }
              } else {
                const parsedDate = new Date(ad_date_raw);
                if (!isNaN(parsedDate.getTime())) {
                  ad_date = parsedDate.toISOString().slice(0, 10);
                }
              }
            } catch (err) {
              // fallback
            }
          }

          const product_code = String(getVal(['product code', 'product_code', 'sku', 'code', 'product']) || '').trim();
          const amount_usd = Number(getVal(['ad cost', 'cost', 'amount_usd', 'usd', 'amount', 'spend']) || 0);
          const platform = String(getVal(['platform', 'ad platform', 'channel']) || 'Facebook Ads').trim();
          const exchange_rate = Number(getVal(['dollar rate', 'exchange_rate', 'rate', 'dollar']) || 122.00);
          const notes = String(getVal(['notes', 'details', 'campaign']) || '').trim();

          const match = findProductMatch(product_code);
          const total_bdt_cost = (amount_usd * exchange_rate).toFixed(2);
          const isValid = amount_usd > 0;
          if (!isValid) invalid++;

          return {
            row_num: idx + 2,
            ad_date,
            product_code,
            product_id: match.id,
            product_name: match.name,
            isMatched: match.isMatched,
            amount_usd,
            platform: platform || 'Facebook Ads',
            exchange_rate: exchange_rate > 0 ? exchange_rate : 122.00,
            total_bdt_cost,
            notes,
            isValid
          };
        });

        setParsedAds(mapped);
        setInvalidCount(invalid);
        setStep(2);
      } catch (err) {
        setErrorMsg(`Failed to parse file: ${err.message}`);
      }
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  // 3. Delete/Remove specific row from parsed list
  const handleDeleteRow = (index) => {
    setParsedAds(prev => {
      const updated = prev.filter((_, i) => i !== index);
      const newInvalid = updated.filter(a => !a.isValid).length;
      setInvalidCount(newInvalid);
      return updated;
    });
  };

  // 4. Update row field value in real-time
  const handleUpdateRow = (index, field, value) => {
    setParsedAds(prev => {
      const updated = [...prev];
      const row = { ...updated[index], [field]: value };

      if (field === 'product_code') {
        const match = findProductMatch(value, row.product_id);
        row.product_id = match.id;
        row.product_name = match.name;
        row.isMatched = match.isMatched;
      }

      const usd = Number(field === 'amount_usd' ? value : row.amount_usd || 0);
      const rate = Number(field === 'exchange_rate' ? value : row.exchange_rate || 122);

      row.total_bdt_cost = (usd * rate).toFixed(2);
      row.isValid = usd > 0;

      updated[index] = row;
      const newInvalid = updated.filter(a => !a.isValid).length;
      setInvalidCount(newInvalid);
      return updated;
    });
  };

  // 5. Select product directly from dropdown to resolve unmatched code
  const handleSelectProductForRow = (index, selectedVal) => {
    setParsedAds(prev => {
      const updated = [...prev];
      const row = { ...updated[index] };

      if (selectedVal === 'general') {
        row.product_id = null;
        row.product_name = 'General Shop Campaign';
        row.isMatched = true;
      } else if (selectedVal) {
        const found = products.find(p => String(p.id) === String(selectedVal));
        if (found) {
          row.product_id = found.id;
          row.product_name = found.name;
          row.product_code = found.sku || found.product_code || String(found.id);
          row.isMatched = true;
        }
      }

      updated[index] = row;
      return updated;
    });
  };

  // 6. Confirm & Import Batch to API
  const handleConfirmImport = async () => {
    const validItems = parsedAds.filter(a => a.isValid);
    if (validItems.length === 0) {
      setErrorMsg('No valid paid ad records to import.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await authFetch('/api/ads/bulk-import', {
        method: 'POST',
        body: JSON.stringify({ ads: validItems })
      });

      const data = await res.json();
      if (res.ok) {
        alert(`🎉 ${data.message}`);
        onImportSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || 'Bulk import failed.');
      }
    } catch (err) {
      setErrorMsg(`Server error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const totalImportUsd = parsedAds.filter(a => a.isValid).reduce((sum, a) => sum + Number(a.amount_usd || 0), 0);
  const totalImportBdt = parsedAds.filter(a => a.isValid).reduce((sum, a) => sum + Number(a.total_bdt_cost || 0), 0);
  const unmatchedCount = parsedAds.filter(a => !a.isMatched).length;

  return (
    <div className="modal-overlay" style={{ background: 'rgba(10, 15, 29, 0.85)', backdropFilter: 'blur(10px)', zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '1020px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '20px', padding: '28px', color: '#fff' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
              <Megaphone size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Bulk Excel / CSV Paid Ads Import</h3>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>Smart Product Code matching, error detection & 1-click dropdown resolution</p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', fontSize: '13px', color: '#f87171', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: FILE UPLOAD ZONE */}
        {step === 1 && (
          <div>
            <div 
              style={{ 
                border: '2px dashed rgba(99, 102, 241, 0.4)', 
                borderRadius: '16px', 
                padding: '40px 20px', 
                textAlign: 'center', 
                background: 'rgba(99, 102, 241, 0.04)',
                cursor: 'pointer',
                marginBottom: '20px',
                position: 'relative'
              }}
            >
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileUpload}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
              />
              <Upload size={38} color="#818cf8" style={{ marginBottom: '12px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '6px' }}>
                Drop your Paid Ads Excel or CSV file here
              </h4>
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                Supports <strong>.xlsx, .xls, .csv</strong> files matching Product Code / SKU and Date
              </p>
            </div>

            <div style={{ background: '#1e293b', padding: '16px 20px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '13px', color: '#f8fafc', display: 'block' }}>Need the sample Excel format?</strong>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Download pre-formatted template with ad date, product code, USD spend & rate columns</span>
              </div>
              
              <button 
                onClick={handleDownloadTemplate}
                className="btn btn-secondary btn-sm"
                style={{ gap: '6px', fontWeight: '700' }}
              >
                <Download size={14} />
                <span>Download Sample Template</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW & INLINE EDIT TABLE */}
        {step === 2 && (
          <div>
            {/* Top Summary Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', background: '#1e293b', padding: '12px 16px', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span>Total Items: <strong>{parsedAds.length}</strong></span>
                <span style={{ color: '#10b981' }}>Valid: <strong>{parsedAds.length - invalidCount}</strong></span>
                {unmatchedCount > 0 ? (
                  <span style={{ color: '#f87171', fontWeight: '700', background: 'rgba(239, 68, 68, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>
                    ⚠️ Unmatched Codes: <strong>{unmatchedCount}</strong>
                  </span>
                ) : (
                  <span style={{ color: '#10b981', fontWeight: '700' }}>✓ All Product Codes Matched</span>
                )}
                <span>Total USD: <strong style={{ color: '#6366f1' }}>${totalImportUsd.toFixed(2)}</strong></span>
                <span>Total Expense: <strong style={{ color: '#f87171' }}>৳{totalImportBdt.toFixed(2)}</strong></span>
              </div>

              <button onClick={() => { setStep(1); setParsedAds([]); setFile(null); }} className="btn btn-secondary btn-sm">
                <RefreshCw size={13} />
                <span>Upload New File</span>
              </button>
            </div>

            {/* Unmatched Code Resolution Banner */}
            {unmatchedCount > 0 && (
              <div style={{ padding: '10px 14px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '8px', fontSize: '12px', color: '#fbbf24', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} />
                <span>
                  <strong>Notice:</strong> {unmatchedCount} product code(s) were not found in your inventory. Select the correct product from the dropdown in the row, edit the SKU code, or choose "General Shop Campaign".
                </span>
              </div>
            )}

            {/* Scrollable Preview Table with Error Highlight & Dropdown Resolution */}
            <div style={{ maxHeight: '380px', overflowY: 'auto', borderRadius: '10px', border: '1px solid #334155', marginBottom: '20px' }}>
              <table className="data-table" style={{ fontSize: '12px', width: '100%' }}>
                <thead>
                  <tr style={{ background: '#1e293b', position: 'sticky', top: 0, zIndex: 10 }}>
                    <th style={{ width: '40px' }}>#</th>
                    <th style={{ minWidth: '115px' }}>Ad Date</th>
                    <th style={{ minWidth: '125px' }}>Product Code</th>
                    <th style={{ minWidth: '220px' }}>Matched Product / Resolve Dropdown</th>
                    <th style={{ minWidth: '120px' }}>Platform</th>
                    <th style={{ minWidth: '100px' }}>Ad Spend ($)</th>
                    <th style={{ minWidth: '90px' }}>Rate (৳/$)</th>
                    <th style={{ minWidth: '95px' }}>Total (৳)</th>
                    <th style={{ width: '55px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedAds.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        All items removed. Upload a new file or add entries.
                      </td>
                    </tr>
                  ) : (
                    parsedAds.map((a, idx) => (
                      <tr 
                        key={idx} 
                        style={{ 
                          background: !a.isMatched ? 'rgba(239, 68, 68, 0.14)' : (!a.isValid ? 'rgba(245, 158, 11, 0.12)' : 'transparent'),
                          borderLeft: !a.isMatched ? '4px solid #ef4444' : 'none'
                        }}
                      >
                        <td>{idx + 1}</td>
                        
                        {/* 1. Editable Ad Date */}
                        <td>
                          <input 
                            type="date"
                            className="form-input"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            value={a.ad_date}
                            onChange={(e) => handleUpdateRow(idx, 'ad_date', e.target.value)}
                          />
                        </td>

                        {/* 2. Editable Product Code (Red Highlight if Unmatched) */}
                        <td>
                          <input 
                            type="text"
                            className="form-input"
                            style={{ 
                              padding: '4px 8px', 
                              fontSize: '12px',
                              borderColor: a.isMatched ? 'var(--border-color)' : '#ef4444',
                              color: a.isMatched ? '#f8fafc' : '#f87171',
                              fontWeight: a.isMatched ? '400' : '700'
                            }}
                            placeholder="Code/SKU..."
                            value={a.product_code}
                            onChange={(e) => handleUpdateRow(idx, 'product_code', e.target.value)}
                          />
                        </td>

                        {/* 3. Matched Product Name & 1-Click Dropdown Resolver */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <select
                              className="form-select"
                              style={{ 
                                padding: '4px 6px', 
                                fontSize: '11px', 
                                borderColor: a.isMatched ? 'rgba(255, 255, 255, 0.15)' : '#ef4444',
                                color: a.isMatched ? '#10b981' : '#f87171',
                                fontWeight: '700',
                                background: '#0f172a'
                              }}
                              value={a.product_id ? String(a.product_id) : (a.isMatched ? 'general' : '')}
                              onChange={(e) => handleSelectProductForRow(idx, e.target.value)}
                            >
                              <option value="" disabled>-- ⚠️ Select Product to Resolve --</option>
                              <option value="general">🌐 General Shop Campaign (No Product)</option>
                              {products.map(p => (
                                <option key={p.id} value={String(p.id)}>
                                  {p.name} ({p.sku || p.product_code || `ID:${p.id}`})
                                </option>
                              ))}
                            </select>

                            {!a.isMatched && (
                              <span style={{ fontSize: '10px', color: '#f87171', fontWeight: '700' }}>
                                ⚠️ Code "{a.product_code}" not found. Select product above to fix.
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 4. Editable Platform Select */}
                        <td>
                          <select
                            className="form-select"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            value={a.platform}
                            onChange={(e) => handleUpdateRow(idx, 'platform', e.target.value)}
                          >
                            <option value="Facebook Ads">Facebook Ads</option>
                            <option value="Google Ads">Google Ads</option>
                            <option value="TikTok Ads">TikTok Ads</option>
                            <option value="Influencer Marketing">Influencer</option>
                            <option value="Others">Others</option>
                          </select>
                        </td>

                        {/* 5. Editable USD Amount */}
                        <td>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: '#94a3b8', fontSize: '11px' }}>$</span>
                            <input 
                              type="number"
                              step="0.01"
                              className="form-input"
                              style={{ paddingLeft: '18px', paddingRight: '4px', fontSize: '12px', fontWeight: '700', color: '#818cf8' }}
                              value={a.amount_usd}
                              onChange={(e) => handleUpdateRow(idx, 'amount_usd', e.target.value)}
                            />
                          </div>
                        </td>

                        {/* 6. Editable Dollar Rate */}
                        <td>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: '#94a3b8', fontSize: '11px' }}>৳</span>
                            <input 
                              type="number"
                              step="0.01"
                              className="form-input"
                              style={{ paddingLeft: '18px', paddingRight: '4px', fontSize: '12px' }}
                              value={a.exchange_rate}
                              onChange={(e) => handleUpdateRow(idx, 'exchange_rate', e.target.value)}
                            />
                          </div>
                        </td>

                        {/* 7. Calculated Total BDT */}
                        <td style={{ fontWeight: '700', color: '#f87171' }}>
                          ৳{a.total_bdt_cost}
                        </td>

                        {/* 8. Action: Remove / Delete Row */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(idx)}
                            className="btn btn-secondary btn-icon btn-sm"
                            title="Remove/Exclude product from import"
                            style={{ width: '28px', height: '28px' }}
                          >
                            <Trash2 size={14} color="#f87171" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                💡 Tip: Type a valid SKU or pick from the dropdown to resolve unmatched product code errors before importing.
              </span>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={onClose} className="btn btn-secondary">Cancel</button>
                <button 
                  onClick={handleConfirmImport} 
                  className="btn btn-primary"
                  disabled={loading || parsedAds.filter(a => a.isValid).length === 0}
                  style={{ background: 'linear-gradient(90deg, #6366f1, #4f46e5)', padding: '10px 24px', fontWeight: '800', gap: '8px' }}
                >
                  {loading ? 'Importing Ads...' : `Confirm & Bulk Import (${parsedAds.filter(a => a.isValid).length} Campaigns)`}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BulkImportAdsModal;
