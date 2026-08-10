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
  Megaphone
} from 'lucide-react';

export const BulkImportAdsModal = ({ isOpen, onClose, onImportSuccess, authFetch, products = [] }) => {
  const [file, setFile] = useState(null);
  const [parsedAds, setParsedAds] = useState([]);
  const [invalidCount, setInvalidCount] = useState(0);
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Importing
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
                // Excel date serial number
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

          // Match product by code / SKU / ID / Name
          let matchedProductId = null;
          let matchedProductName = 'General Shop Campaign';

          if (product_code) {
            const cleanCode = product_code.toLowerCase();
            const found = products.find(p => {
              const pSku = String(p.sku || '').toLowerCase();
              const pCode = String(p.product_code || '').toLowerCase();
              const pId = String(p.id || '').toLowerCase();
              const pName = String(p.name || '').toLowerCase();
              return pSku === cleanCode || pCode === cleanCode || pId === cleanCode || pName.includes(cleanCode);
            });

            if (found) {
              matchedProductId = found.id;
              matchedProductName = found.name;
            } else {
              matchedProductName = `Code: ${product_code} (General)`;
            }
          }

          const total_bdt_cost = (amount_usd * exchange_rate).toFixed(2);
          const isValid = amount_usd > 0;
          if (!isValid) invalid++;

          return {
            row_num: idx + 2,
            ad_date,
            product_code,
            product_id: matchedProductId,
            product_name: matchedProductName,
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

  // 3. Confirm & Import Batch to API
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

  const totalImportUsd = parsedAds.filter(a => a.isValid).reduce((sum, a) => sum + Number(a.amount_usd), 0);
  const totalImportBdt = parsedAds.filter(a => a.isValid).reduce((sum, a) => sum + Number(a.total_bdt_cost), 0);

  return (
    <div className="modal-overlay" style={{ background: 'rgba(10, 15, 29, 0.85)', backdropFilter: 'blur(10px)', zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '880px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '20px', padding: '28px', color: '#fff' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
              <Megaphone size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Bulk Excel / CSV Paid Ads Import</h3>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>Import multiple product ad costs by date and product code in one click</p>
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

        {/* STEP 2: PREVIEW & VALIDATION TABLE */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', background: '#1e293b', padding: '12px 16px', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span>Total Found: <strong>{parsedAds.length}</strong> items</span>
                <span style={{ color: '#10b981' }}>Valid: <strong>{parsedAds.length - invalidCount}</strong></span>
                <span>Total USD: <strong style={{ color: '#6366f1' }}>${totalImportUsd.toFixed(2)}</strong></span>
                <span>Total Expense: <strong style={{ color: '#f87171' }}>৳{totalImportBdt.toFixed(2)}</strong></span>
              </div>

              <button onClick={() => { setStep(1); setParsedAds([]); setFile(null); }} className="btn btn-secondary btn-sm">
                <RefreshCw size={13} />
                <span>Change File</span>
              </button>
            </div>

            {/* Scrollable Preview Table */}
            <div style={{ maxHeight: '350px', overflowY: 'auto', borderRadius: '10px', border: '1px solid #334155', marginBottom: '20px' }}>
              <table className="data-table" style={{ fontSize: '12px', width: '100%' }}>
                <thead>
                  <tr style={{ background: '#1e293b', position: 'sticky', top: 0 }}>
                    <th>Row</th>
                    <th>Ad Date</th>
                    <th>Product Code</th>
                    <th>Matched Product Name</th>
                    <th>Platform</th>
                    <th>Ad Spend ($ USD)</th>
                    <th>Dollar Rate</th>
                    <th>Total BDT</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedAds.map((a, idx) => (
                    <tr key={idx} style={{ background: a.isValid ? 'transparent' : 'rgba(239, 68, 68, 0.1)' }}>
                      <td>#{a.row_num}</td>
                      <td style={{ fontWeight: '600' }}>{a.ad_date}</td>
                      <td><code>{a.product_code || 'N/A'}</code></td>
                      <td style={{ fontWeight: '700', color: a.product_id ? '#10b981' : '#f8fafc' }}>
                        {a.product_name}
                      </td>
                      <td><span className="badge badge-primary">{a.platform}</span></td>
                      <td style={{ fontWeight: '700', color: '#6366f1' }}>${Number(a.amount_usd).toFixed(2)}</td>
                      <td>৳{a.exchange_rate}/$</td>
                      <td style={{ fontWeight: '700', color: '#f87171' }}>৳{a.total_bdt_cost}</td>
                      <td>
                        {a.isValid ? (
                          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '800' }}>
                            <CheckCircle2 size={14} /> Valid
                          </span>
                        ) : (
                          <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '800' }}>
                            <AlertCircle size={14} /> Invalid USD
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
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
        )}

      </div>
    </div>
  );
};

export default BulkImportAdsModal;
