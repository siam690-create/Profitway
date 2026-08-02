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
  FileText
} from 'lucide-react';

// Helper to fix garbled Mojibake UTF-8 strings
const fixMojibake = (str) => {
  if (!str) return '';
  const inputStr = String(str).trim();
  try {
    if (/[\u00C0-\u00FF]/.test(inputStr)) {
      const bytes = new Uint8Array([...inputStr].map(c => c.charCodeAt(0) & 0xFF));
      const decoder = new TextDecoder('utf-8');
      const decoded = decoder.decode(bytes);
      if (decoded && !decoded.includes('')) {
        return decoded;
      }
    }
  } catch (e) {
    // fallback to original
  }
  return inputStr;
};

export const BulkImportModal = ({ isOpen, onClose, onImportSuccess, authFetch }) => {
  const [file, setFile] = useState(null);
  const [parsedProducts, setParsedProducts] = useState([]);
  const [invalidCount, setInvalidCount] = useState(0);
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Importing
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // 1. Download Pre-Formatted Sample Excel Template
  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        'Product Name': 'Wireless Bluetooth Earbuds Pro',
        'SKU': 'AUDIO-EAR-001',
        'Category': 'Electronics',
        'Cost Price (Buy)': 1200,
        'Selling Price': 1850,
        'Stock Quantity': 50,
        'Min Stock Warning': 5,
        'Unit': 'Pcs',
        'Storage Location': 'Rack-A1'
      },
      {
        'Product Name': 'Premium Cotton T-Shirt (Black L)',
        'SKU': 'TSHIRT-BLK-L',
        'Category': 'Clothing',
        'Cost Price (Buy)': 350,
        'Selling Price': 650,
        'Stock Quantity': 100,
        'Min Stock Warning': 10,
        'Unit': 'Pcs',
        'Storage Location': 'Shelf-3'
      },
      {
        'Product Name': 'Organic Green Tea 250g Pack',
        'SKU': 'TEA-GRN-250',
        'Category': 'Groceries',
        'Cost Price (Buy)': 180,
        'Selling Price': 290,
        'Stock Quantity': 30,
        'Min Stock Warning': 8,
        'Unit': 'Pack',
        'Storage Location': 'Counter-B'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    // Set column widths for readability
    worksheet['!cols'] = [
      { wch: 32 }, // Product Name
      { wch: 18 }, // SKU
      { wch: 15 }, // Category
      { wch: 16 }, // Cost Price
      { wch: 14 }, // Selling Price
      { wch: 14 }, // Stock Quantity
      { wch: 18 }, // Min Stock Warning
      { wch: 10 }, // Unit
      { wch: 18 }  // Storage Location
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample_Products');
    XLSX.writeFile(workbook, 'Profitway_Sample_Products_Template.xlsx');
  };

  // 2. Parse Excel/CSV File with 100% UTF-8 Encoding Preservation & Mojibake Auto-Fix
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

        // Standardize Column Mapping with Strict Collision Protection
        let invalid = 0;
        const mapped = rawJson.map((row, idx) => {
          const getVal = (keywords, avoidKeywords = []) => {
            const keys = Object.keys(row);
            // 1. Try strict/prefix match first
            for (const k of keys) {
              const clean = k.trim().toLowerCase();
              if (avoidKeywords.some(ak => clean.includes(ak))) continue;
              if (keywords.some(kw => clean === kw || clean.startsWith(kw))) {
                return row[k];
              }
            }
            // 2. Try includes match second
            for (const k of keys) {
              const clean = k.trim().toLowerCase();
              if (avoidKeywords.some(ak => clean.includes(ak))) continue;
              if (keywords.some(kw => clean.includes(kw))) {
                return row[k];
              }
            }
            return '';
          };

          const rawNameVal = getVal(['product name', 'name', 'title', 'item']);
          const name = fixMojibake(rawNameVal);
          const sku = getVal(['sku', 'barcode', 'code']);
          const rawCatVal = getVal(['category']);
          const category_name = fixMojibake(rawCatVal);

          // Strictly separate Cost Price (Buy) vs Selling Price (Sell)
          const cost_price = Number(getVal(['cost price', 'buy price', 'purchase price', 'cost', 'buy', 'buying'], ['sell', 'sale', 'mrp', 'retail']) || 0);
          const selling_price = Number(getVal(['selling price', 'sale price', 'sell price', 'retail price', 'mrp', 'regular price', 'sell', 'sale', 'price'], ['cost', 'buy', 'purchase', 'buying']) || 0);
          const stock_quantity = Number(getVal(['stock quantity', 'stock', 'qty', 'quantity']) || 0);
          const low_stock_threshold = Number(getVal(['min stock', 'warning', 'low stock', 'threshold']) || 5);
          const unit = getVal(['unit']) || 'Pcs';
          const location = getVal(['storage location', 'location', 'rack']);

          const isValid = Boolean(name && selling_price > 0);
          if (!isValid) invalid++;

          return {
            row_num: idx + 2,
            name: name ? String(name).trim() : '',
            sku: sku ? String(sku).trim() : '',
            category_name: category_name ? String(category_name).trim() : '',
            cost_price,
            selling_price,
            stock_quantity,
            low_stock_threshold,
            unit,
            location: location ? String(location).trim() : '',
            isValid
          };
        });

        setParsedProducts(mapped);
        setInvalidCount(invalid);
        setStep(2);
      } catch (err) {
        setErrorMsg(`Failed to parse file: ${err.message}`);
      }
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  // 3. Confirm Import to API
  const handleConfirmImport = async () => {
    const validItems = parsedProducts.filter(p => p.isValid);
    if (validItems.length === 0) {
      setErrorMsg('No valid products to import.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await authFetch('/api/products/bulk-import', {
        method: 'POST',
        body: JSON.stringify({ products: validItems })
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

  return (
    <div className="modal-overlay" style={{ background: 'rgba(10, 15, 29, 0.85)', backdropFilter: 'blur(10px)', zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '850px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '20px', padding: '28px', color: '#fff' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Bulk Excel / CSV Product Import</h3>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>Upload multiple inventory items into your shop at once</p>
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
                Drop your Excel or CSV file here
              </h4>
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                Supports <strong>.xlsx, .xls, .csv</strong> files
              </p>
            </div>

            <div style={{ background: '#1e293b', padding: '16px 20px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '13px', color: '#f8fafc', display: 'block' }}>Need the correct format?</strong>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Download our pre-formatted Excel template with sample products</span>
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
              <div style={{ fontSize: '13px', display: 'flex', gap: '16px' }}>
                <span>Total Found: <strong>{parsedProducts.length}</strong> items</span>
                <span style={{ color: '#10b981' }}>Valid: <strong>{parsedProducts.length - invalidCount}</strong></span>
                {invalidCount > 0 && <span style={{ color: '#ef4444' }}>Invalid/Skipped: <strong>{invalidCount}</strong></span>}
              </div>

              <button onClick={() => { setStep(1); setParsedProducts([]); setFile(null); }} className="btn btn-secondary btn-sm">
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
                    <th>Product Name</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Cost Price</th>
                    <th>Selling Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedProducts.map((p, idx) => (
                    <tr key={idx} style={{ background: p.isValid ? 'transparent' : 'rgba(239, 68, 68, 0.1)' }}>
                      <td>#{p.row_num}</td>
                      <td style={{ fontWeight: '700', color: p.name ? '#fff' : '#f87171' }}>
                        {p.name || '⚠️ Missing Name'}
                      </td>
                      <td><code>{p.sku || 'Auto-generated'}</code></td>
                      <td>{p.category_name || 'General'}</td>
                      <td>৳{p.cost_price}</td>
                      <td style={{ fontWeight: '700', color: p.selling_price > 0 ? '#10b981' : '#f87171' }}>
                        ৳{p.selling_price}
                      </td>
                      <td>{p.stock_quantity} {p.unit}</td>
                      <td>
                        {p.isValid ? (
                          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '800' }}>
                            <CheckCircle2 size={14} /> Valid
                          </span>
                        ) : (
                          <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '800' }}>
                            <AlertCircle size={14} /> Invalid
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
                disabled={loading || parsedProducts.filter(p => p.isValid).length === 0}
                style={{ background: 'linear-gradient(90deg, #6366f1, #4f46e5)', padding: '10px 24px', fontWeight: '800', gap: '8px' }}
              >
                {loading ? 'Importing Products...' : `Confirm Import (${parsedProducts.filter(p => p.isValid).length} Products)`}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
