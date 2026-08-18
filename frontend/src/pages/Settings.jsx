import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Server, Settings2, Save, Info, Lock, Printer, FileText, CheckSquare, Eye, Sliders, Globe } from 'lucide-react';
import { StoreApiKeysManager } from '../components/StoreApiKeysManager';

export const Settings = () => {
  const { tenant, shopSettings, fetchSettings, authFetch, refreshAllData } = useApp();
  const [activeTab, setActiveTab] = useState('store');

  // Form State for Store & Invoice Customization Settings
  const [form, setForm] = useState({
    currency: '৳',
    decimal_precision: 2,
    pos_paper_size: '80mm',
    wholesale_paper_size: 'A4',
    company_name: '',
    tagline: '',
    address: '',
    phone: '',
    email: '',
    vat_reg_no: '',
    footer_terms: '',
    footer_thank_you: '',
    show_storage_location: true,
    show_staff_name: true,
    show_savings_discount: true,
    show_qr_barcode: true,
    show_shop_name: true,
    show_address: true,
    show_phone_email: true,
    show_vat_no: true,
    show_invoice_no: true,
    show_invoice_date: true,
    show_customer_info: true
  });

  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (shopSettings) {
      setForm({
        currency: shopSettings.currency || '৳',
        decimal_precision: shopSettings.decimal_precision !== undefined ? shopSettings.decimal_precision : 2,
        pos_paper_size: shopSettings.pos_paper_size || '80mm',
        wholesale_paper_size: shopSettings.wholesale_paper_size || 'A4',
        company_name: shopSettings.company_name || tenant?.shop_name || '',
        tagline: shopSettings.tagline || '',
        address: shopSettings.address || '',
        phone: shopSettings.phone || '',
        email: shopSettings.email || '',
        vat_reg_no: shopSettings.vat_reg_no || '',
        footer_terms: shopSettings.footer_terms || '',
        footer_thank_you: shopSettings.footer_thank_you || '',
        show_storage_location: Boolean(shopSettings.show_storage_location),
        show_staff_name: Boolean(shopSettings.show_staff_name),
        show_savings_discount: Boolean(shopSettings.show_savings_discount),
        show_qr_barcode: Boolean(shopSettings.show_qr_barcode),
        show_shop_name: shopSettings.show_shop_name !== undefined ? Boolean(shopSettings.show_shop_name) : true,
        show_address: shopSettings.show_address !== undefined ? Boolean(shopSettings.show_address) : true,
        show_phone_email: shopSettings.show_phone_email !== undefined ? Boolean(shopSettings.show_phone_email) : true,
        show_vat_no: shopSettings.show_vat_no !== undefined ? Boolean(shopSettings.show_vat_no) : true,
        show_invoice_no: shopSettings.show_invoice_no !== undefined ? Boolean(shopSettings.show_invoice_no) : true,
        show_invoice_date: shopSettings.show_invoice_date !== undefined ? Boolean(shopSettings.show_invoice_date) : true,
        show_customer_info: shopSettings.show_customer_info !== undefined ? Boolean(shopSettings.show_customer_info) : true,
        delivery_inside_dhaka: shopSettings.delivery_inside_dhaka !== undefined ? shopSettings.delivery_inside_dhaka : 60,
        delivery_sub_dhaka: shopSettings.delivery_sub_dhaka !== undefined ? shopSettings.delivery_sub_dhaka : 100,
        delivery_outside_dhaka: shopSettings.delivery_outside_dhaka !== undefined ? shopSettings.delivery_outside_dhaka : 130
      });
    }
  }, [shopSettings, tenant]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await authFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (res.ok) {
        alert('Invoice Print Branding & Paper Customization Settings saved successfully!');
        fetchSettings();
        refreshAllData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Settings Header Bar */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings2 size={24} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Invoice Print & Paper Customization Suite</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Configure paper sizes (A3, A4, A5, Thermal 80/58mm), header/footer display toggles, and financial currency formatting
          </p>
        </div>
      </div>

      {/* Sub Tabs Bar */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('store')}
          className={`btn ${activeTab === 'store' ? 'btn-primary' : 'btn-secondary'}`}
        >
          📄 Invoice Header Branding & Currency
        </button>
        <button
          onClick={() => setActiveTab('receipt')}
          className={`btn ${activeTab === 'receipt' ? 'btn-primary' : 'btn-secondary'}`}
        >
          🖨️ Paper Sizes & Header/Footer Display Toggles
        </button>
        <button
          onClick={() => setActiveTab('apikeys')}
          className={`btn ${activeTab === 'apikeys' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ background: activeTab === 'apikeys' ? 'linear-gradient(90deg, #6366f1, #4f46e5)' : undefined }}
        >
          🌐 Multi-Store Ingestion API Keys
        </button>
      </div>

      {/* Explicit Information Usage & Master Shop Name Safeguard Banner */}
      <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderLeft: '4px solid var(--accent-primary)', borderRadius: '10px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: 'var(--accent-primary)' }}>
          <Info size={18} />
          <span>Statement, Invoice & Receipt Printing Customization Disclaimer</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          📌 <strong>Note:</strong> The branding information configured below (Company Name, Tagline, Phone, Email, Physical Address, VAT Registration #) is <strong>specifically used for customer Statements, Wholesale Invoices, and POS Thermal Receipt Headers</strong>.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', color: 'var(--warning)', marginTop: '4px', fontSize: '12px', fontWeight: '600' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={14} />
            <span>Registered Master Shop Name: <strong>{tenant?.shop_name}</strong> (Code: <strong>{tenant?.shop_code || `SHOP-${1000 + (tenant?.id || 1)}`}</strong>) — If you want to change, please create a Support Ticket.</span>
          </div>
        </div>
      </div>

      {/* --- TAB 1: INVOICE BRANDING & FINANCIAL INFO --- */}
      {activeTab === 'store' && (
        <form onSubmit={handleSaveSettings} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            Invoice / Receipt Header Branding & Currency Formatting
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            {/* Currency Symbol Selection */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: '700' }}>Currency Symbol</label>
              <select
                className="form-select"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                <option value="৳">৳ BDT (Bangladeshi Taka)</option>
                <option value="$">$ USD (US Dollar)</option>
                <option value="€">€ EUR (Euro)</option>
                <option value="₹">₹ INR (Indian Rupee)</option>
                <option value="£">£ GBP (British Pound)</option>
                <option value="SR">SR SAR (Saudi Riyal)</option>
                <option value="AED">AED (UAE Dirham)</option>
              </select>
            </div>

            {/* Decimal Precision Setting */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: '700' }}>Decimal Precision (দশমিক সংখ্যা)</label>
              <select
                className="form-select"
                value={form.decimal_precision}
                onChange={(e) => setForm({ ...form, decimal_precision: Number(e.target.value) })}
              >
                <option value={0}>0 Decimals (e.g. ৳1500)</option>
                <option value={2}>2 Decimals (e.g. ৳1500.00)</option>
                <option value={3}>3 Decimals (e.g. ৳1500.000)</option>
              </select>
            </div>

            {/* VAT / TAX Reg No */}
            <div className="form-group">
              <label className="form-label">Invoice BIN / VAT Registration # (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="VAT-99887766"
                value={form.vat_reg_no}
                onChange={(e) => setForm({ ...form, vat_reg_no: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Invoice Header Company / Shop Printed Name *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="e.g. Profitway Electronics & Wholesale"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                This name will appear on all printed sales invoices, statements & receipts.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Invoice Printed Tagline / Slogan</label>
              <input
                type="text"
                className="form-input"
                placeholder="Leading Retail & Wholesale Electronics Supplier"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Printed Store Phone Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="+880 1711 000111"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Printed Support Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="support@mystore.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Printed Store Physical Address</label>
            <input
              type="text"
              className="form-input"
              placeholder="House #12, Road #4, Block #C, Dhanmondi, Dhaka"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '10px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🚚 Reseller Delivery Charge Rates (কুরিয়ার ডেলিভারি চার্জ সেটিং)
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Set default courier delivery charge amounts for B2B reseller portal orders based on customer delivery area.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Inside Dhaka Delivery Rate (৳) *</label>
                <input
                  type="number"
                  step="1"
                  className="form-input"
                  required
                  placeholder="e.g. 60"
                  value={form.delivery_inside_dhaka}
                  onChange={(e) => setForm({ ...form, delivery_inside_dhaka: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sub Dhaka Delivery Rate (৳) *</label>
                <input
                  type="number"
                  step="1"
                  className="form-input"
                  required
                  placeholder="e.g. 100"
                  value={form.delivery_sub_dhaka}
                  onChange={(e) => setForm({ ...form, delivery_sub_dhaka: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Outside Dhaka Delivery Rate (৳) *</label>
                <input
                  type="number"
                  step="1"
                  className="form-input"
                  required
                  placeholder="e.g. 130"
                  value={form.delivery_outside_dhaka}
                  onChange={(e) => setForm({ ...form, delivery_outside_dhaka: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary" disabled={savingSettings}>
              <Save size={16} />
              <span>{savingSettings ? 'Saving Settings...' : 'Save Settings & Delivery Rates'}</span>
            </button>
          </div>
        </form>
      )}

      {/* --- TAB 2: PAPER SIZES & HEADER/FOOTER DISPLAY TOGGLES --- */}
      {activeTab === 'receipt' && (
        <form onSubmit={handleSaveSettings} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section 1: Paper Sizes */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={18} color="var(--accent-primary)" />
              <span>Printer Paper Size Formats (A3, A4, A5, Thermal 80mm/58mm)</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* POS Paper Size Format */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '700' }}>POS Retail Receipt Paper Format</label>
                <select
                  className="form-select"
                  value={form.pos_paper_size}
                  onChange={(e) => setForm({ ...form, pos_paper_size: e.target.value })}
                >
                  <option value="80mm">Thermal 80mm Paper (Standard POS Thermal Roll)</option>
                  <option value="58mm">Thermal 58mm Paper (Mini Bluetooth Thermal Roll)</option>
                  <option value="A4">A4 Standard Full Page Sheet (210mm x 297mm)</option>
                  <option value="A5">A5 Half Page Sheet (148mm x 210mm - Compact)</option>
                  <option value="A3">A3 Large Format Sheet (297mm x 420mm - Commercial)</option>
                </select>
              </div>

              {/* Wholesale Paper Size Format */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '700' }}>Wholesale B2B Invoice Paper Format</label>
                <select
                  className="form-select"
                  value={form.wholesale_paper_size}
                  onChange={(e) => setForm({ ...form, wholesale_paper_size: e.target.value })}
                >
                  <option value="A4">A4 Standard Full Page Letter (210mm x 297mm - Standard B2B)</option>
                  <option value="A5">A5 Half Page Bill / Invoice (148mm x 210mm - Compact B2B)</option>
                  <option value="A3">A3 Large Format Sheet (297mm x 420mm - Commercial B2B)</option>
                  <option value="80mm">Thermal 80mm Receipt Roll</option>
                  <option value="58mm">Thermal 58mm Mini Roll</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Header Display Toggles */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={18} color="var(--success)" />
              <span>Header Display Options (ইনভয়েসের হেডার অপশনসমূহ)</span>
            </h3>

            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.show_shop_name}
                  onChange={(e) => setForm({ ...form, show_shop_name: e.target.checked })}
                />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Show Shop / Company Name on Header</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.show_address}
                  onChange={(e) => setForm({ ...form, show_address: e.target.checked })}
                />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Show Physical Store Address on Header</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.show_phone_email}
                  onChange={(e) => setForm({ ...form, show_phone_email: e.target.checked })}
                />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Show Support Phone & Email on Header</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.show_vat_no}
                  onChange={(e) => setForm({ ...form, show_vat_no: e.target.checked })}
                />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Show BIN / VAT Registration Number on Header</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.show_invoice_no}
                  onChange={(e) => setForm({ ...form, show_invoice_no: e.target.checked })}
                />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Show Invoice Serial Number (#INV-1002)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.show_invoice_date}
                  onChange={(e) => setForm({ ...form, show_invoice_date: e.target.checked })}
                />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Show Invoice Date & Timestamp</span>
              </label>
            </div>
          </div>

          {/* Section 3: Customer, Storage & Items Display Toggles */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="#f59e0b" />
              <span>Customer, Storage & Pricing Display Options</span>
            </h3>

            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.show_customer_info}
                  onChange={(e) => setForm({ ...form, show_customer_info: e.target.checked })}
                />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Show Customer / Buyer Name & Contact Details</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.show_storage_location}
                  onChange={(e) => setForm({ ...form, show_storage_location: e.target.checked })}
                />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Show Storage Location / Rack Info on Invoice</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.show_staff_name}
                  onChange={(e) => setForm({ ...form, show_staff_name: e.target.checked })}
                />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Show Cashier / Staff Name on Invoice</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.show_savings_discount}
                  onChange={(e) => setForm({ ...form, show_savings_discount: e.target.checked })}
                />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Show Total Savings & Customer Discounts</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.show_qr_barcode}
                  onChange={(e) => setForm({ ...form, show_qr_barcode: e.target.checked })}
                />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Show Barcode / QR Invoice Verification Code</span>
              </label>
            </div>
          </div>

          {/* Section 4: Footer Terms & Conditions Text */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Receipt Footer Terms & Conditions</label>
              <textarea
                className="form-input"
                rows="3"
                placeholder="Goods once sold are returnable within 7 days with valid invoice copy."
                value={form.footer_terms}
                onChange={(e) => setForm({ ...form, footer_terms: e.target.value })}
              ></textarea>
            </div>

            <div className="form-group">
              <label className="form-label">Receipt Footer Thank You Message</label>
              <textarea
                className="form-input"
                rows="3"
                placeholder="Thank you for shopping with us! Have a great day!"
                value={form.footer_thank_you}
                onChange={(e) => setForm({ ...form, footer_thank_you: e.target.value })}
              ></textarea>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary" disabled={savingSettings}>
              <Save size={16} />
              <span>{savingSettings ? 'Saving Settings...' : 'Save Paper & Customization Toggles'}</span>
            </button>
          </div>
        </form>
      )}

      {/* --- TAB 3: MULTI-STORE INGESTION API KEYS MANAGER --- */}
      {activeTab === 'apikeys' && (
        <StoreApiKeysManager />
      )}
    </div>
  );
};
