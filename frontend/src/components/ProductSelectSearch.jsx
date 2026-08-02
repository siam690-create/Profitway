import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Package } from 'lucide-react';

export const ProductSelectSearch = ({ products = [], selectedId, onSelect, placeholder = "Type product name or SKU to search..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Sync selected product name into search input when selectedId changes
  useEffect(() => {
    if (selectedId) {
      const found = products.find(p => String(p.id) === String(selectedId));
      if (found) {
        setSearchTerm(`${found.name} (${found.sku})`);
      }
    } else {
      setSearchTerm('');
    }
  }, [selectedId, products]);

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
    if (!searchTerm || String(p.id) === String(selectedId)) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = p.name ? p.name.toLowerCase().includes(term) : false;
    const skuMatch = p.sku ? p.sku.toLowerCase().includes(term) : false;
    return nameMatch || skuMatch;
  });

  const handleClear = () => {
    setSearchTerm('');
    onSelect('');
    setIsOpen(true);
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
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (selectedId) onSelect('');
            setIsOpen(true);
          }}
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
            maxHeight: '230px',
            overflowY: 'auto',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            marginTop: '4px'
          }}
        >
          {/* General / Option to clear */}
          <div
            onClick={() => {
              onSelect('');
              setSearchTerm('');
              setIsOpen(false);
            }}
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

          {filteredProducts.length === 0 ? (
            <div style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
              No matching products found.
            </div>
          ) : (
            filteredProducts.slice(0, 50).map(p => (
              <div
                key={p.id}
                onClick={() => {
                  onSelect(p.id);
                  setSearchTerm(`${p.name} (${p.sku})`);
                  setIsOpen(false);
                }}
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  background: String(selectedId) === String(p.id) ? 'var(--bg-secondary)' : 'transparent'
                }}
              >
                <div>
                  <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-primary)' }}>{p.name}</strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SKU: {p.sku} | Stock: {p.stock_quantity} left</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--success)', display: 'block' }}>
                    ৳{Number(p.selling_price || 0).toFixed(2)}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sell Price</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
