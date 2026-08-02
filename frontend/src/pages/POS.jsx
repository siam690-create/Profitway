import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Plus, Minus, Trash2, ShoppingBag, CheckCircle, CreditCard, User, AlertCircle, Truck, Calculator } from 'lucide-react';
import { ReceiptModal } from '../components/ReceiptModal';

export const POS = () => {
  const { products, categories, cart, currency, addToCart, updateCartQty, removeFromCart, clearCart, checkoutSale } = useApp();
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');

  // Manual Delivery Charge & Courier Bill Inputs (above Customer Name as requested!)
  const [customerDeliveryFee, setCustomerDeliveryFee] = useState('120');
  const [courierFee, setCourierFee] = useState('120');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));

  const [completedSale, setCompletedSale] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter products for POS grid (Limit to top 20 products for super fast loading & compact layout)
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? String(p.category_id) === String(selectedCategory) : true;
    return matchesSearch && matchesCategory;
  });

  const displayedProducts = (search || selectedCategory) ? filteredProducts.slice(0, 60) : filteredProducts.slice(0, 20);

  // Real-time Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const cartTotalCost = cart.reduce((sum, item) => sum + (item.unit_cost * item.quantity), 0);
  const cartGrossProfit = cartSubtotal - cartTotalCost;

  // Delivery Profit Calculation
  const delivFeeNum = Number(customerDeliveryFee || 0);
  const courierCostNum = Number(courierFee || 0);
  const deliveryProfit = delivFeeNum - courierCostNum;

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Cart is empty!');
    setIsSubmitting(true);
    const result = await checkoutSale(customerName, paymentMethod, notes, customerDeliveryFee, courierFee, saleDate);
    setIsSubmitting(false);

    if (result.success) {
      setCompletedSale(result.sale);
    } else {
      alert(`Checkout failed: ${result.error}`);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px', alignItems: 'start' }}>
      {/* Left Column: Product Selector Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Search & Category Filter */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search 200+ products by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
          <select
            className="form-select"
            style={{ width: '180px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Quick Notice Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)', padding: '0 4px' }}>
          <span>
            {search || selectedCategory 
              ? `Found ${filteredProducts.length} matching products` 
              : `Showing Top ${displayedProducts.length} Quick Products (Use search above to find any item)`}
          </span>
          {products.length > 20 && !search && !selectedCategory && (
            <span style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>⚡ Total {products.length} Products in Shop</span>
          )}
        </div>

        {/* Product Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '12px' }}>
          {displayedProducts.map(product => {
            const isOut = product.stock_quantity <= 0;
            return (
              <div
                key={product.id}
                onClick={() => !isOut && addToCart(product)}
                className="glass-card"
                style={{
                  padding: '14px',
                  cursor: isOut ? 'not-allowed' : 'pointer',
                  opacity: isOut ? 0.5 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent-primary)' }}>{product.sku}</span>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', margin: '3px 0', color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{product.category_name}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {currency}{Number(product.selling_price).toFixed(2)}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--success)', display: 'block' }}>
                      Profit: +{currency}{Number(product.unit_profit || (product.selling_price - product.cost_price)).toFixed(2)}
                    </span>
                  </div>

                  <span className={`badge ${isOut ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '10px', padding: '3px 6px' }}>
                    {isOut ? 'Out of Stock' : `${product.stock_quantity} left`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: POS Cart & Realtime Profit Counter (STICKY PANEL AT TOP) */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', position: 'sticky', top: '80px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Current Sale Cart</h3>
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)' }}>
              Clear Cart
            </button>
          )}
        </div>

        {/* Cart Item List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px', marginBottom: '16px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
              <ShoppingBag size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
              <p style={{ fontSize: '14px' }}>Click products on the left to add them to this sale cart.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product_id} style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block' }}>{item.product_name}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{currency}{item.unit_price} each</span>
                  </div>
                  <button onClick={() => removeFromCart(item.product_id)} style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer' }}>
                    <Trash2 size={15} />
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-input)', borderRadius: '6px', padding: '2px 6px' }}>
                    <button onClick={() => updateCartQty(item.product_id, item.quantity - 1)} style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <Minus size={14} />
                    </button>
                    <span style={{ fontSize: '13px', fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateCartQty(item.product_id, item.quantity + 1)} style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <Plus size={14} />
                    </button>
                  </div>

                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-primary)' }}>
                    {currency}{(item.unit_price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DELIVERY & COURIER FEES SECTION (ABOVE CUSTOMER NAME AS REQUESTED!) */}
        <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--accent-primary)' }}>
            <Truck size={15} />
            <span>Delivery & Courier Charge Config</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Customer Delivery Fee ({currency})</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '13px' }}
                value={customerDeliveryFee}
                onChange={(e) => setCustomerDeliveryFee(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Courier Actual Bill ({currency})</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '13px' }}
                value={courierFee}
                onChange={(e) => setCourierFee(e.target.value)}
              />
            </div>
          </div>

          {/* Delivery Margin Profit Helper */}
          <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', color: deliveryProfit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: '700', paddingTop: '4px', borderTop: '1px dashed var(--border-color)' }}>
            <span>Net Delivery Profit:</span>
            <span>{deliveryProfit >= 0 ? '+' : ''}{currency}{deliveryProfit.toFixed(2)}</span>
          </div>
        </div>

        {/* Customer, Sale Date & Payment Config */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginBottom: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Customer Name</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '13px' }}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: '700' }}>📅 Sale Date (তারিখ)</label>
              <input
                type="date"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '13px', borderColor: 'var(--accent-primary)' }}
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '0' }}>
            <label className="form-label">Payment Method</label>
            <select
              className="form-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="Cash">Cash</option>
              <option value="bKash">bKash Mobile Banking</option>
              <option value="Nagad">Nagad Mobile Banking</option>
              <option value="Card">Credit / Debit Card</option>
            </select>
          </div>
        </div>

        {/* Live Automatic Profit Counter Box */}
        <div style={{ background: 'var(--bg-primary)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Product Sale Subtotal:</span>
            <strong>{currency}{cartSubtotal.toFixed(2)}</strong>
          </div>

          {delivFeeNum > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: 'var(--accent-primary)' }}>
              <span>Customer Delivery Fee:</span>
              <span>+{currency}{delivFeeNum.toFixed(2)}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px', marginBottom: '6px' }}>
            <span>Grand Total Invoice:</span>
            <span>{currency}{(cartSubtotal + delivFeeNum).toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--success)', fontWeight: '700', borderTop: '1px dashed var(--border-color)', paddingTop: '6px' }}>
            <span>Total Realized Profit (Prod + Deliv):</span>
            <span>+{currency}{(cartGrossProfit + deliveryProfit).toFixed(2)}</span>
          </div>
        </div>

        {/* Complete Checkout Button */}
        <button
          onClick={handleCheckout}
          className="btn btn-success"
          style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '700' }}
          disabled={cart.length === 0 || isSubmitting}
        >
          <CheckCircle size={18} />
          <span>{isSubmitting ? 'Processing Sale...' : 'Complete & Print Invoice'}</span>
        </button>

        {/* Print Receipt Modal on completion */}
        {completedSale && (
          <ReceiptModal sale={completedSale} onClose={() => setCompletedSale(null)} />
        )}
      </div>
    </div>
  );
};
