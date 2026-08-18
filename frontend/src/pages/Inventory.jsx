import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { Package, Plus, Search, Filter, AlertTriangle, Layers3, Edit2, Trash2, X, MapPin, Layers, FileSpreadsheet, Download, Upload, History, ArrowUpRight, ArrowDownRight, Check } from 'lucide-react';
import { BulkImportModal } from '../components/BulkImportModal';

export const Inventory = () => {
  const { products, categories, currency, formatCurrency, fetchCategories, authFetch, refreshAllData } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Stock Audit History & Quick Corrector Modal States
  const [selectedAuditProduct, setSelectedAuditProduct] = useState(null);
  const [showStockAuditModal, setShowStockAuditModal] = useState(false);
  const [stockHistory, setStockHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [targetStockInput, setTargetStockInput] = useState('');
  const [auditFixReason, setAuditFixReason] = useState('');
  const [isFixingStock, setIsFixingStock] = useState(false);

  const handleOpenStockAudit = async (product) => {
    setSelectedAuditProduct(product);
    setTargetStockInput(String(product.stock_quantity || 0));
    setAuditFixReason('');
    setShowStockAuditModal(true);
    setIsLoadingHistory(true);

    try {
      const res = await authFetch(`/api/products/${product.id}/stock-history`);
      const data = await res.json();
      if (res.ok) {
        setStockHistory(data.movements || []);
      } else {
        setStockHistory([]);
      }
    } catch (e) {
      setStockHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleFixStockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAuditProduct || targetStockInput === '') return;

    setIsFixingStock(true);
    try {
      const res = await authFetch(`/api/products/${selectedAuditProduct.id}/adjust-stock`, {
        method: 'PATCH',
        body: JSON.stringify({
          target_stock: Number(targetStockInput),
          reason: auditFixReason || 'Manual stock correction by shop owner'
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Stock updated to ${data.new_stock} Pcs successfully!`);
        refreshAllData();
        handleOpenStockAudit({ ...selectedAuditProduct, stock_quantity: data.new_stock });
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsFixingStock(false);
    }
  };

  // Export Current Products to Excel File
  const handleExportProducts = async () => {
    try {
      const res = await authFetch('/api/products/export');
      const data = await res.json();
      if (!res.ok) return alert('Failed to export stock data.');

      if (!data || data.length === 0) {
        return alert('No products available in stock to export.');
      }

      const exportRows = data.map(p => ({
        'Product Name': p.name,
        'SKU': p.sku,
        'Category': p.category_name || 'General',
        'Cost Price (Buy)': Number(p.cost_price),
        'Selling Price': Number(p.selling_price),
        'Stock Quantity': Number(p.stock_quantity),
        'Low Stock Warning': Number(p.low_stock_threshold || 5),
        'Unit': p.unit || 'Pcs',
        'Storage Location': p.location || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      worksheet['!cols'] = [
        { wch: 32 }, { wch: 18 }, { wch: 15 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 18 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock_Products');
      XLSX.writeFile(workbook, `Profitway_Stock_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      alert(`Export error: ${err.message}`);
    }
  };

  // Category Manager State inside Inventory
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  // Form State
  const [isCombo, setIsCombo] = useState(false);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [resellerPrice, setResellerPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [minStockAlert, setMinStockAlert] = useState('5');
  const [unit, setUnit] = useState('Pcs');
  const [location, setLocation] = useState('');

  // Combo Bundle Items Selection State
  const [comboItems, setComboItems] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [childQty, setChildQty] = useState('1');
  const [childSearchTerm, setChildSearchTerm] = useState('');
  const [isChildSearchOpen, setIsChildSearchOpen] = useState(false);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsCombo(false);
    setName('');
    setSku(`SKU-${Date.now().toString().slice(-6)}`);
    setCategoryId('');
    setCostPrice('');
    setSellingPrice('');
    setResellerPrice('');
    setStockQuantity('10');
    setMinStockAlert('5');
    setUnit('Pcs');
    setLocation('');
    setComboItems([]);
    setShowModal(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setIsCombo(Boolean(product.is_combo));
    setName(product.name);
    setSku(product.sku);
    setCategoryId(product.category_id || '');
    setCostPrice(product.cost_price);
    setSellingPrice(product.selling_price);
    setResellerPrice(product.reseller_price || '');
    setStockQuantity(product.stock_quantity);
    setMinStockAlert(product.low_stock_threshold || product.min_stock_alert);
    setUnit(product.unit || 'Pcs');
    setLocation(product.location || '');

    if (product.is_combo && product.combo_items) {
      setComboItems(product.combo_items.map(ci => ({
        child_product_id: ci.child_product_id,
        child_name: ci.child_name,
        child_cost: ci.child_cost,
        quantity: ci.quantity
      })));
    } else {
      setComboItems([]);
    }

    setShowModal(true);
  };

  const handleAddChildToCombo = () => {
    if (!selectedChildId || !childQty) return alert('Select child product and quantity');
    const childProd = products.find(p => String(p.id) === String(selectedChildId));
    if (!childProd) return;

    setComboItems(prev => [
      ...prev.filter(item => item.child_product_id !== childProd.id),
      {
        child_product_id: childProd.id,
        child_name: childProd.name,
        child_cost: Number(childProd.cost_price),
        quantity: Number(childQty)
      }
    ]);

    setSelectedChildId('');
    setChildSearchTerm('');
    setChildQty('1');
    setIsChildSearchOpen(false);
  };

  const handleRemoveChildFromCombo = (childId) => {
    setComboItems(prev => prev.filter(item => item.child_product_id !== childId));
  };

  const calculatedComboCost = comboItems.reduce((sum, item) => sum + (item.child_cost * item.quantity), 0);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!catName) return;
    setIsSubmittingCat(true);
    try {
      const res = await authFetch('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: catName, description: catDescription })
      });
      if (res.ok) {
        setCatName('');
        setCatDescription('');
        fetchCategories();
        alert('Product category added successfully!');
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const handleDeleteCategory = async (id, catNameStr) => {
    if (window.confirm(`Are you sure you want to delete category "${catNameStr}"?`)) {
      try {
        const res = await authFetch(`/api/categories/${id}`, { method: 'DELETE' });
        if (res.ok) fetchCategories();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const payload = {
      name,
      sku,
      category_id: categoryId ? Number(categoryId) : null,
      cost_price: isCombo ? calculatedComboCost : Number(costPrice),
      selling_price: Number(sellingPrice),
      reseller_price: Number(resellerPrice || 0.00),
      stock_quantity: isCombo ? 0 : Number(stockQuantity),
      min_stock_alert: Number(minStockAlert),
      unit,
      location,
      is_combo: isCombo ? 1 : 0,
      combo_items: isCombo ? comboItems.map(item => ({
        child_product_id: item.child_product_id,
        quantity: item.quantity
      })) : []
    };

    setIsSubmitting(true);
    try {
      let res;
      if (editingProduct) {
        res = await authFetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        res = await authFetch('/api/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        refreshAllData();
        alert(editingProduct ? 'Product updated successfully!' : 'Product added successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, prodName) => {
    if (window.confirm(`Are you sure you want to delete "${prodName}"?`)) {
      try {
        const res = await authFetch(`/api/products/${id}`, { method: 'DELETE' });
        if (res.ok) {
          refreshAllData();
        } else {
          const data = await res.json();
          alert(`Error: ${data.error}`);
        }
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? String(p.category_id) === String(categoryFilter) : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Controls */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search products by name, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div style={{ position: 'relative', width: '200px' }}>
            <Filter size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <select
              className="form-select"
              style={{ paddingLeft: '36px' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Product Categories Manager Modal Button */}
          <button onClick={() => setShowCategoryModal(true)} className="btn btn-secondary" title="Manage Categories">
            <Layers size={16} />
            <span>Categories</span>
          </button>

          {/* Bulk Export Excel Button */}
          <button onClick={handleExportProducts} className="btn btn-secondary" title="Export Current Stock to Excel File">
            <Download size={16} />
            <span>Export Stock</span>
          </button>

          {/* Bulk Import Excel/CSV Button */}
          <button onClick={() => setShowBulkImportModal(true)} className="btn btn-secondary" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)', fontWeight: '700' }}>
            <Upload size={16} />
            <span>Import Excel / CSV</span>
          </button>

          <button onClick={handleOpenAddModal} className="btn btn-primary">
            <Plus size={16} />
            <span>+ Add Product / Combo</span>
          </button>
        </div>
      </div>

      {/* Inventory Products Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product & SKU</th>
                <th>Type</th>
                <th>Category</th>
                <th>Rack / Storage Location</th>
                <th>Cost Price (Buy)</th>
                <th>Selling Price</th>
                <th>Margin / Profit</th>
                <th>Stock Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No products found. Click "+ Add Product / Combo" to add items.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const cost = Number(p.cost_price || 0);
                  const sell = Number(p.selling_price || 0);
                  const unitProfit = sell - cost;
                  const marginPct = cost > 0 ? ((unitProfit / cost) * 100).toFixed(1) : (sell > 0 ? '100.0' : '0.0');
                  const isProfit = unitProfit >= 0;

                  const isLowStock = !p.is_combo && p.stock_quantity <= (p.low_stock_threshold || p.min_stock_alert);

                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{p.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>
                      </td>
                      <td>
                        {p.is_combo ? (
                          <span className="badge badge-primary" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Layers3 size={12} />
                            <span>COMBO BUNDLE</span>
                          </span>
                        ) : (
                          <span className="badge badge-secondary" style={{ fontSize: '11px' }}>STANDARD</span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ fontSize: '11px' }}>
                          {p.category_name || 'General'}
                        </span>
                      </td>
                      <td>
                        {p.location ? (
                          <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}>
                            <MapPin size={10} />
                            <span>{p.location}</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td style={{ fontWeight: '600' }}>{formatCurrency(p.cost_price)}</td>
                      <td style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>{formatCurrency(p.selling_price)}</td>
                      <td>
                        <div style={{ fontWeight: '700', color: isProfit ? 'var(--success)' : 'var(--danger)' }}>
                          {isProfit ? '+' : ''}{formatCurrency(unitProfit)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{marginPct}% margin</div>
                      </td>
                      <td>
                        {p.is_combo ? (
                          <span
                            onClick={() => handleOpenStockAudit(p)}
                            className="badge badge-info"
                            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Click to view Stock Movement History & Audit Log"
                          >
                            <History size={12} /> Auto Bundle Stock ({p.stock_quantity} available)
                          </span>
                        ) : (
                          <span
                            onClick={() => handleOpenStockAudit(p)}
                            className={`badge ${isLowStock ? 'badge-danger' : 'badge-success'}`}
                            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}
                            title="Click to view Stock Movement History & Adjust Stock"
                          >
                            <History size={12} /> {p.stock_quantity} {p.unit || 'Pcs'} {isLowStock && ' (Low Stock!)'}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleOpenEditModal(p)} className="btn btn-secondary btn-icon btn-sm" title="Edit Product">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(p.id, p.name)} className="btn btn-danger btn-icon btn-sm" title="Delete Product">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Manager Modal inside Inventory */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={20} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Product Categories Manager</h3>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className="btn btn-secondary btn-icon">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Add New Category Form */}
              <form onSubmit={handleAddCategory} style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700' }}>Add New Product Category Group</h4>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Category Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Smart Devices or Groceries"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Description (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Brief summary..."
                    value={catDescription}
                    onChange={(e) => setCatDescription(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingCat}>
                  <Plus size={16} />
                  <span>Save Category</span>
                </button>
              </form>

              {/* Categories Table List */}
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Category Name</th>
                      <th>Description</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                          No categories created yet.
                        </td>
                      </tr>
                    ) : (
                      categories.map(cat => (
                        <tr key={cat.id}>
                          <td><strong>{cat.name}</strong></td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{cat.description || '-'}</td>
                          <td>
                            <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="btn btn-danger btn-icon btn-sm">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Product Details' : 'Add New Product or Combo Bundle'}</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Product Type</label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="product_type"
                        checked={!isCombo}
                        onChange={() => setIsCombo(false)}
                      />
                      <span>Standard Product (Single Inventory Item)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="product_type"
                        checked={isCombo}
                        onChange={() => setIsCombo(true)}
                      />
                      <span style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>Combo / Bundle Package</span>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Product Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Logitech Wireless Mouse M185"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">SKU / Barcode *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                    >
                      <option value="">Select Category...</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Storage Location / Rack / Floor (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Warehouse A - Rack #3"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>

                {isCombo ? (
                  /* Combo Bundle Items Setup */
                  <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Layers3 size={16} color="var(--accent-primary)" />
                      <span>Assemble Child Items into this Combo Bundle</span>
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', alignItems: 'flex-end', marginBottom: '12px' }}>
                      {/* Live Autocomplete Product Search Input */}
                      <div className="form-group" style={{ margin: 0, position: 'relative' }}>
                        <label className="form-label">Search Child Product (by Name or SKU)</label>
                        <div style={{ position: 'relative' }}>
                          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Type to search 200+ products..."
                            value={childSearchTerm}
                            onFocus={() => setIsChildSearchOpen(true)}
                            onChange={(e) => {
                              setChildSearchTerm(e.target.value);
                              setIsChildSearchOpen(true);
                            }}
                            style={{ paddingLeft: '34px', paddingRight: childSearchTerm ? '28px' : '10px', fontSize: '13px' }}
                          />
                          {childSearchTerm && (
                            <button
                              type="button"
                              onClick={() => {
                                setChildSearchTerm('');
                                setSelectedChildId('');
                                setIsChildSearchOpen(true);
                              }}
                              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', fontWeight: '800' }}
                            >
                              ×
                            </button>
                          )}
                        </div>

                        {/* Live Floating Results Menu */}
                        {isChildSearchOpen && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              zIndex: 9999,
                              background: 'var(--bg-primary)',
                              border: '1px solid var(--accent-primary)',
                              borderRadius: '10px',
                              maxHeight: '220px',
                              overflowY: 'auto',
                              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                              marginTop: '4px'
                            }}
                          >
                            {products.filter(p => !p.is_combo && (
                              p.name.toLowerCase().includes(childSearchTerm.toLowerCase()) || 
                              p.sku.toLowerCase().includes(childSearchTerm.toLowerCase())
                            )).length === 0 ? (
                              <div style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                                No matching products found.
                              </div>
                            ) : (
                              products
                                .filter(p => !p.is_combo && (
                                  p.name.toLowerCase().includes(childSearchTerm.toLowerCase()) || 
                                  p.sku.toLowerCase().includes(childSearchTerm.toLowerCase())
                                ))
                                .slice(0, 50)
                                .map(p => (
                                  <div
                                    key={p.id}
                                    onClick={() => {
                                      setSelectedChildId(p.id);
                                      setChildSearchTerm(`${p.name} (${p.sku})`);
                                      setIsChildSearchOpen(false);
                                    }}
                                    style={{
                                      padding: '10px 12px',
                                      borderBottom: '1px solid var(--border-color)',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      justify: 'space-between',
                                      alignItems: 'center',
                                      background: selectedChildId === p.id ? 'var(--bg-secondary)' : 'transparent'
                                    }}
                                  >
                                    <div>
                                      <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-primary)' }}>{p.name}</strong>
                                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SKU: {p.sku} | Stock: {p.stock_quantity} left</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                      <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-primary)', display: 'block' }}>
                                        {formatCurrency(p.cost_price)}
                                      </span>
                                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Buy Cost</span>
                                    </div>
                                  </div>
                                ))
                            )}
                          </div>
                        )}
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Quantity</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="1"
                          value={childQty}
                          onChange={(e) => setChildQty(e.target.value)}
                        />
                      </div>

                      <button type="button" onClick={handleAddChildToCombo} className="btn btn-primary" style={{ padding: '10px' }}>
                        + Add to Bundle
                      </button>
                    </div>

                    {comboItems.length > 0 && (
                      <table className="data-table" style={{ marginTop: '10px' }}>
                        <thead>
                          <tr>
                            <th>Child Product</th>
                            <th>Qty</th>
                            <th>Unit Cost</th>
                            <th>Total Cost</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comboItems.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.child_name}</td>
                              <td>{item.quantity}</td>
                              <td>{formatCurrency(item.child_cost)}</td>
                              <td style={{ fontWeight: '700' }}>{formatCurrency(item.child_cost * item.quantity)}</td>
                              <td>
                                <button type="button" onClick={() => handleRemoveChildFromCombo(item.child_product_id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                                  ×
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>Auto-Calculated Combined Cost Price:</span>
                      <strong style={{ fontSize: '16px', color: 'var(--success)' }}>{formatCurrency(calculatedComboCost)}</strong>
                    </div>

                    {/* Combo Pricing Inputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Bundle Selling Price (বিক্রিদাম) *</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input"
                          required
                          placeholder="1200.00"
                          value={sellingPrice}
                          onChange={(e) => setSellingPrice(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">🏷️ Bundle Reseller Price (Wholesale)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input"
                          placeholder="900.00"
                          value={resellerPrice}
                          onChange={(e) => setResellerPrice(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard Product Pricing */
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Cost Price (Buy Cost) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        required
                        placeholder="300.00"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Selling Price (Retail) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        required
                        placeholder="750.00"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">🏷️ Reseller Price (Wholesale)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        placeholder="500.00"
                        value={resellerPrice}
                        onChange={(e) => setResellerPrice(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  {!isCombo && (
                    <div className="form-group">
                      <label className="form-label">Current Stock Qty *</label>
                      <input
                        type="number"
                        className="form-input"
                        required
                        placeholder="10"
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Min Stock Alert</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="5"
                      value={minStockAlert}
                      onChange={(e) => setMinStockAlert(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Pcs"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving Product...' : (editingProduct ? 'Save Product Changes' : 'Save New Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📥 Bulk Excel / CSV Import Modal */}
      <BulkImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onImportSuccess={() => {
          refreshAllData();
        }}
        authFetch={authFetch}
      />

      {/* 📊 Stock Audit History & Quick Corrector Modal */}
      {showStockAuditModal && selectedAuditProduct && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '750px', width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                <History size={18} color="var(--accent-primary)" />
                <span>Stock Audit History & Movement Ledger</span>
              </h3>
              <button onClick={() => setShowStockAuditModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Product Overview Bar */}
              <div style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>{selectedAuditProduct.name}</h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SKU: {selectedAuditProduct.sku}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Current Stock Level</span>
                  <strong style={{ fontSize: '18px', color: 'var(--accent-primary)' }}>
                    {selectedAuditProduct.stock_quantity} {selectedAuditProduct.unit || 'Pcs'}
                  </strong>
                </div>
              </div>

              {/* 🛠️ Quick Stock Fix & Manual Corrector Form */}
              {!selectedAuditProduct.is_combo && (
                <form onSubmit={handleFixStockSubmit} style={{ padding: '14px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 10px 0', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} />
                    <span>Quick Stock Fix & Manual Adjustment</span>
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '10px', alignItems: 'flex-end' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '11px' }}>Set Exact Stock (Pcs) *</label>
                      <input
                        type="number"
                        className="form-input"
                        required
                        placeholder="e.g. 818"
                        value={targetStockInput}
                        onChange={(e) => setTargetStockInput(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '11px' }}>Audit Note / Reason (Optional)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Stock count correction"
                        value={auditFixReason}
                        onChange={(e) => setAuditFixReason(e.target.value)}
                      />
                    </div>
                    <button type="submit" disabled={isFixingStock} className="btn btn-primary" style={{ padding: '10px' }}>
                      {isFixingStock ? 'Saving...' : 'Save Correct Stock'}
                    </button>
                  </div>
                </form>
              )}

              {/* Stock Movement Ledger Table */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>Stock Movement Ledger History</h4>
                {isLoadingHistory ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading stock history...</div>
                ) : stockHistory.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    No audit records logged yet. All future sales, deletions, returns and restocks will automatically log here!
                  </div>
                ) : (
                  <div className="table-wrapper" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Action Type</th>
                          <th>Change Qty</th>
                          <th>Stock After</th>
                          <th>Ref & Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockHistory.map((m, idx) => {
                          const isAdd = Number(m.change_qty) > 0;
                          return (
                            <tr key={idx}>
                              <td style={{ fontSize: '12px' }}>{new Date(m.created_at).toLocaleString()}</td>
                              <td>
                                <span className="badge badge-secondary" style={{ fontSize: '10px' }}>
                                  {m.movement_type.toUpperCase().replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td style={{ fontWeight: '700', color: isAdd ? 'var(--success)' : 'var(--danger)' }}>
                                {isAdd ? '+' : ''}{m.change_qty}
                              </td>
                              <td style={{ fontWeight: '700' }}>{m.new_stock} Pcs</td>
                              <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {m.reference_no && <strong style={{ color: 'var(--text-primary)', marginRight: '4px' }}>[{m.reference_no}]</strong>}
                                {m.notes || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setShowStockAuditModal(false)} className="btn btn-secondary">
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
