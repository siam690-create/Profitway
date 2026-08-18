import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

export const ProductSelectSearch = ({ 
  products = [], 
  selectedId, 
  onSelect, 
  placeholder = "Type product name or SKU to search...",
  allowAllOption = false,
  allOptionLabel = "📦 All Target Products",
  customOptions = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const prevSelectedIdRef = useRef(selectedId);

  // Sync selected product label into search input ONLY when selectedId changes externally
  useEffect(() => {
    if (prevSelectedIdRef.current !== selectedId) {
      prevSelectedIdRef.current = selectedId;

      if (selectedId) {
        if (selectedId === 'all') {
          setSearchTerm(allOptionLabel);
        } else {
          const customOpt = customOptions.find(o => String(o.id) === String(selectedId));
          if (customOpt) {
            setSearchTerm(customOpt.name);
          } else {
            const found = products.find(p => String(p.id) === String(selectedId));
            if (found) {
              setSearchTerm(found.sku ? `${found.name} (${found.sku})` : found.name);
            } else {
              setSearchTerm('');
            }
          }
        }
      } else {
        setSearchTerm('');
      }
    }
  }, [selectedId, products, allOptionLabel, customOptions]);

  // Initial sync on mount if selectedId exists
  useEffect(() => {
    if (selectedId) {
      if (selectedId === 'all') {
        setSearchTerm(allOptionLabel);
      } else {
        const customOpt = customOptions.find(o => String(o.id) === String(selectedId));
        if (customOpt) {
          setSearchTerm(customOpt.name);
        } else {
          const found = products.find(p => String(p.id) === String(selectedId));
          if (found) {
            setSearchTerm(found.sku ? `${found.name} (${found.sku})` : found.name);
          }
        }
      }
    }
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = products.filter(p => {
    if (!searchTerm) return true;
    if (searchTerm === allOptionLabel) return true;
    const term = searchTerm.toLowerCase().trim();
    const nameMatch = p.name ? p.name.toLowerCase().includes(term) : false;
    const skuMatch = p.sku ? p.sku.toLowerCase().includes(term) : false;
    return nameMatch || skuMatch;
  });

  const handleClear = () => {
    const defaultId = allowAllOption ? 'all' : '';
    prevSelectedIdRef.current = defaultId;
    setSearchTerm('');
    onSelect(defaultId);
    setIsOpen(true);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleSelectOption = (id, label) => {
    prevSelectedIdRef.current = id;
    onSelect(id);
    setSearchTerm(label);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          className="form-input"
          placeholder={placeholder}
          value={searchTerm}
          onFocus={() => setIsOpen(true)}
          onChange={handleInputChange}
          style={{
            paddingLeft: '34px',
            paddingRight: searchTerm ? '30px' : '10px',
            fontSize: '13px',
            fontWeight: selectedId ? '600' : '400',
            color: selectedId ? 'var(--text-primary)' : undefined
          }}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '800'
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Floating Filtered Product Dropdown List */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 99999,
            background: 'var(--bg-primary)',
            border: '1px solid var(--accent-primary)',
            borderRadius: '10px',
            maxHeight: '240px',
            overflowY: 'auto',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            marginTop: '4px'
          }}
        >
          {/* Allow All option if enabled */}
          {allowAllOption && (
            <div
              onClick={() => handleSelectOption('all', allOptionLabel)}
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '700',
                color: '#38bdf8',
                background: selectedId === 'all' ? 'var(--bg-secondary)' : 'transparent'
              }}
            >
              {allOptionLabel}
            </div>
          )}

          {/* Render custom extra options if provided */}
          {customOptions.map(opt => (
            <div
              key={opt.id}
              onClick={() => handleSelectOption(opt.id, opt.name)}
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                color: '#eab308',
                background: String(selectedId) === String(opt.id) ? 'var(--bg-secondary)' : 'transparent'
              }}
            >
              {opt.name}
            </div>
          ))}

          {/* Default General Option for modals */}
          {!allowAllOption && customOptions.length === 0 && (
            <div
              onClick={() => handleSelectOption('', '')}
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
                fontSize: '12px',
                color: 'var(--text-muted)',
                background: !selectedId ? 'var(--bg-secondary)' : 'transparent'
              }}
            >
              <em>General Campaign / All Shop Products (No specific product)</em>
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
              No matching products found.
            </div>
          ) : (
            filteredProducts.slice(0, 50).map(p => (
              <div
                key={p.id}
                onClick={() => handleSelectOption(p.id, p.sku ? `${p.name} (${p.sku})` : p.name)}
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: String(selectedId) === String(p.id) ? 'var(--bg-secondary)' : 'transparent'
                }}
              >
                <div>
                  <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-primary)' }}>{p.name}</strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SKU: {p.sku || 'N/A'} {p.stock_quantity !== undefined ? `| Stock: ${p.stock_quantity} left` : ''}</span>
                </div>
                {p.selling_price !== undefined && (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--success)', display: 'block' }}>
                      ৳{Number(p.selling_price || 0).toFixed(2)}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sell Price</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
