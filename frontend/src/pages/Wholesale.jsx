import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Search, ShoppingBag, Plus, PackagePlus, Eye, X, Users, Phone, MapPin, DollarSign, Wallet, FileText, CheckCircle, ArrowUpRight, Printer, Trash2 } from 'lucide-react';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { ProductSelectSearch } from '../components/ProductSelectSearch';

export const Wholesale = () => {
  const { authFetch, products, currency, formatCurrency, shopSettings, refreshAllData } = useApp();
  const [activeSubTab, setActiveSubTab] = useState('orders'); // 'orders' or 'buyers'
  const [salesList, setSalesList] = useState([]);
  const [buyersList, setBuyersList] = useState([]);
  const [accountsList, setAccountsList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showBuyerModal, setShowBuyerModal] = useState(false);
  const [selectedSaleDetails, setSelectedSaleDetails] = useState(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [buyerSearchQuery, setBuyerSearchQuery] = useState('');
  const [modalProductSearch, setModalProductSearch] = useState('');
  const [modalBuyerSearch, setModalBuyerSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form State for Wholesale Sale Order
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('paid'); // 'paid', 'partial', 'due'
  const [paidAmount, setPaidAmount] = useState('0');
  const [accountId, setAccountId] = useState('');

  const handleDeleteSale = async (sale) => {
    if (!window.confirm(`Are you sure you want to delete Wholesale Order #${sale.invoice_no}? This will restore product stock, refund any paid cash, and remove auto-created Pawna dues.`)) {
      return;
    }

    try {
      const res = await authFetch(`/api/wholesale/sales/${sale.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || `Wholesale Order #${sale.invoice_no} deleted successfully!`);
        fetchData();
        refreshAllData();
      } else {
        alert(`Error deleting wholesale sale: ${data.error}`);
      }
    } catch (err) {
      alert(`Error deleting wholesale sale: ${err.message}`);
    }
  };

  // Cart of Products to Sell Wholesale
  const [saleItems, setSaleItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [sellQty, setSellQty] = useState('1');
  const [unitCostPrice, setUnitCostPrice] = useState('0');
  const [unitWholesalePrice, setUnitWholesalePrice] = useState('');

  // Buyer Create Form State
  const [buyerForm, setBuyerForm] = useState({
    name: '',
    phone: '',
    email: '',
    company_name: '',
    address: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      const sRes = await authFetch('/api/wholesale/sales');
      const sData = await sRes.json();
      if (sRes.ok) setSalesList(sData);

      const bRes = await authFetch('/api/wholesale/customers');
      const bData = await bRes.json();
      if (bRes.ok) setBuyersList(bData);

      const fRes = await authFetch('/api/finance/summary');
      const fData = await fRes.json();
      if (fRes.ok) setAccountsList(fData.accounts || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBuyer = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/wholesale/customers', {
        method: 'POST',
        body: JSON.stringify(buyerForm)
      });
      const data = await res.json();
      if (res.ok) {
        setShowBuyerModal(false);
        setBuyerForm({ name: '', phone: '', email: '', company_name: '', address: '', notes: '' });
        fetchData();
        if (data.customer_id) {
          setCustomerId(String(data.customer_id));
          setCustomerName(data.name);
        }
        alert('Wholesale buyer created successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddItemToSale = () => {
    if (!selectedProductId || !sellQty || !unitWholesalePrice) {
      return alert('Please select a product, quantity, and unit wholesale price.');
    }
    const prod = products.find(p => String(p.id) === String(selectedProductId));
    if (!prod) return;

    const qtyNum = Number(sellQty);
    if (prod.stock_quantity < qtyNum) {
      return alert(`Insufficient stock! Available: ${prod.stock_quantity} Pcs`);
    }

    const costNum = Number(prod.cost_price || 0);
    const sellNum = Number(unitWholesalePrice);
    const itemTotal = qtyNum * sellNum;
    const itemProfit = qtyNum * (sellNum - costNum);

    setSaleItems(prev => [
      ...prev.filter(item => item.product_id !== prod.id),
      {
        product_id: prod.id,
        product_name: prod.name,
        quantity: qtyNum,
        unit_cost_price: costNum,
        unit_wholesale_price: sellNum,
        item_total: itemTotal,
        item_profit: itemProfit
      }
    ]);

    setSelectedProductId('');
    setSellQty('1');
    setUnitCostPrice('0');
    setUnitWholesalePrice('');
  };

  const handleRemoveItem = (productId) => {
    setSaleItems(prev => prev.filter(item => item.product_id !== productId));
  };

  const totalSaleAmount = saleItems.reduce((sum, item) => sum + item.item_total, 0);

  let computedPaid = 0;
  let computedDue = 0;

  if (paymentStatus === 'paid') {
    computedPaid = totalSaleAmount;
    computedDue = 0;
  } else if (paymentStatus === 'due') {
    computedPaid = 0;
    computedDue = totalSaleAmount;
  } else if (paymentStatus === 'partial') {
    computedPaid = Math.min(Number(paidAmount || 0), totalSaleAmount);
    computedDue = Math.max(0, totalSaleAmount - computedPaid);
  }

  const handleSubmitSale = async (e) => {
    e.preventDefault();
    if (saleItems.length === 0) return alert('Add at least one product to the wholesale order.');
    if (!customerName) return alert('Specify Wholesale Buyer / Party Name.');

    if (paymentStatus !== 'due' && !accountId) {
      return alert('Please select a target Cash or Bank Account for collected funds.');
    }

    try {
      const res = await authFetch('/api/wholesale/sales', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: customerId ? Number(customerId) : null,
          customer_name: customerName,
          sale_date: saleDate,
          notes,
          payment_status: paymentStatus,
          paid_amount: computedPaid,
          due_amount: computedDue,
          account_id: paymentStatus !== 'due' ? Number(accountId) : null,
          items: saleItems
        })
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setSaleItems([]);
        setCustomerName('');
        setCustomerId('');
        setNotes('');
        setPaidAmount('0');
        setPaymentStatus('paid');
        refreshAllData();
        fetchData();
        
        // Auto open details and print modal for the newly created wholesale sale
        if (data.sale) {
          handleViewSaleDetails(data.sale.id);
        }
        alert('Wholesale B2B Order created successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleViewSaleDetails = async (saleId) => {
    try {
      const res = await authFetch(`/api/wholesale/sales/${saleId}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedSaleDetails(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintWholesaleInvoice = () => {
    if (!selectedSaleDetails) return;
    const printWindow = window.open('', '_blank');

    const paperSize = shopSettings?.wholesale_paper_size || 'A4';
    const showShopName = shopSettings?.show_shop_name !== undefined ? Boolean(shopSettings.show_shop_name) : true;
    const showAddr = shopSettings?.show_address !== undefined ? Boolean(shopSettings.show_address) : true;
    const showPhoneEmail = shopSettings?.show_phone_email !== undefined ? Boolean(shopSettings.show_phone_email) : true;
    const showVat = shopSettings?.show_vat_no !== undefined ? Boolean(shopSettings.show_vat_no) : true;
    const showInvNo = shopSettings?.show_invoice_no !== undefined ? Boolean(shopSettings.show_invoice_no) : true;
    const showInvDate = shopSettings?.show_invoice_date !== undefined ? Boolean(shopSettings.show_invoice_date) : true;
    const showCustomer = shopSettings?.show_customer_info !== undefined ? Boolean(shopSettings.show_customer_info) : true;

    const compName = shopSettings?.company_name || 'Profitway Electronics Store';
    const compTag = shopSettings?.tagline || 'Leading Retail & Wholesale Supplier';
    const compAddr = shopSettings?.address || 'Dhaka, Bangladesh';
    const compPhone = shopSettings?.phone || '+880 1711 000111';
    const compEmail = shopSettings?.email || 'contact@profitway.com';
    const vatNo = shopSettings?.vat_reg_no || '';
    const footerTerms = shopSettings?.footer_terms || 'Goods once sold are returnable within 7 days with valid invoice copy.';
    const footerThank = shopSettings?.footer_thank_you || 'Thank you for your business!';

    const itemsRows = selectedSaleDetails.items?.map(i => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${i.product_name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${i.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(i.unit_wholesale_price)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">${formatCurrency(i.total_item_price)}</td>
      </tr>
    `).join('') || '';

    // CSS Paper Size @page rule
    let pageCss = '@page { size: A4; margin: 15mm; }';
    if (paperSize === 'A3') pageCss = '@page { size: A3; margin: 20mm; }';
    if (paperSize === 'A5') pageCss = '@page { size: A5 landscape; margin: 10mm; }';
    if (paperSize === '80mm') pageCss = '@page { size: 80mm auto; margin: 5mm; } body { width: 80mm; font-size: 11px; }';
    if (paperSize === '58mm') pageCss = '@page { size: 58mm auto; margin: 3mm; } body { width: 58mm; font-size: 10px; }';

    printWindow.document.write(`
      <html>
        <head>
          <title>Wholesale Invoice - ${selectedSaleDetails.invoice_no}</title>
          <style>
            ${pageCss}
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 15px; color: #111; }
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; flex-wrap: wrap; }
            .title { font-size: 24px; font-weight: 800; color: #2563eb; }
            .subtitle { font-size: 13px; color: #666; margin-top: 2px; }
            .info-grid { display: flex; justify-content: space-between; background: #f8fafc; padding: 14px; border-radius: 8px; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #f1f5f9; text-align: left; padding: 10px; border-bottom: 2px solid #cbd5e1; }
            .summary { width: 280px; margin-left: auto; background: #f8fafc; padding: 14px; border-radius: 8px; }
            .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
            .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 14px; font-size: 12px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              ${showShopName ? `<div class="title">${compName}</div>` : ''}
              ${compTag ? `<div class="subtitle">${compTag}</div>` : ''}
              ${showAddr && compAddr ? `<div style="font-size: 12px; color: #475569; margin-top: 4px;">${compAddr}</div>` : ''}
              ${showPhoneEmail ? `<div style="font-size: 12px; color: #475569;">Phone: ${compPhone} ${compEmail ? `| Email: ${compEmail}` : ''}</div>` : ''}
              ${showVat && vatNo ? `<div style="font-size: 11px; color: #475569;">BIN/VAT Reg: ${vatNo}</div>` : ''}
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; color: #0f172a; font-size: 20px;">WHOLESALE INVOICE</h2>
              ${showInvNo ? `<div style="font-size: 13px; font-weight: bold; margin-top: 4px;">#${selectedSaleDetails.invoice_no}</div>` : ''}
              ${showInvDate ? `<div style="font-size: 12px; color: #64748b;">Date: ${new Date(selectedSaleDetails.sale_date).toLocaleDateString()}</div>` : ''}
              <div style="font-size: 11px; color: #6366f1; font-weight: bold; margin-top: 2px;">Format: ${paperSize} Sheet</div>
            </div>
          </div>

          ${showCustomer ? `
          <div class="info-grid">
            <div>
              <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">B2B Buyer / Party Details:</span>
              <strong style="display: block; font-size: 15px; margin-top: 2px;">${selectedSaleDetails.customer_name}</strong>
              ${selectedSaleDetails.customer_phone ? `<div style="font-size: 12px; color: #334155;">Phone: ${selectedSaleDetails.customer_phone}</div>` : ''}
            </div>
            <div style="text-align: right;">
              <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">Payment Status:</span>
              <div style="font-weight: bold; font-size: 14px; color: ${selectedSaleDetails.due_amount > 0 ? '#dc2626' : '#16a34a'}; margin-top: 2px;">
                ${selectedSaleDetails.due_amount > 0 ? 'PARTIAL / CREDIT (PAWNA DUE)' : 'PAID IN FULL'}
              </div>
            </div>
          </div>
          ` : ''}

          <table>
            <thead>
              <tr>
                <th>Product Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row"><span>Subtotal Revenue:</span> <strong>${formatCurrency(selectedSaleDetails.total_amount)}</strong></div>
            <div class="summary-row" style="color: #16a34a;"><span>Cash Paid:</span> <strong>+${formatCurrency(selectedSaleDetails.paid_amount || selectedSaleDetails.total_amount)}</strong></div>
            <div class="summary-row" style="color: #dc2626; font-size: 16px; font-weight: bold; border-top: 1px solid #cbd5e1; padding-top: 6px; margin-top: 4px;">
              <span>Balance Due Pawna:</span> <span>${formatCurrency(selectedSaleDetails.due_amount || 0)}</span>
            </div>
          </div>

          <div class="footer">
            <div style="margin-bottom: 6px; font-weight: bold;">${footerThank}</div>
            <div>${footerTerms}</div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={24} color="#f59e0b" />
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Wholesale B2B Sales & Customer Directory</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Manage B2B bulk sales with variable pricing, partial payment, due pawna automation, and printable invoices
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <DateRangeFilter
            onFilterChange={({ startDate: s, endDate: e }) => {
              setStartDate(s);
              setEndDate(e);
            }}
          />
          <button onClick={() => setShowBuyerModal(true)} className="btn btn-secondary">
            <Users size={16} />
            <span>+ Add B2B Buyer Profile</span>
          </button>
          <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#000' }}>
            <Plus size={16} />
            <span>+ Create Wholesale Sale</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`btn ${activeSubTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
        >
          🛍️ Wholesale Orders ({salesList.length})
        </button>
        <button
          onClick={() => setActiveSubTab('buyers')}
          className={`btn ${activeSubTab === 'buyers' ? 'btn-primary' : 'btn-secondary'}`}
        >
          👥 Buyer Directory ({buyersList.length})
        </button>
      </div>

      {/* --- SUB TAB 1: WHOLESALE ORDERS --- */}
      {activeSubTab === 'orders' && (() => {
        const filteredSales = salesList.filter(s => {
          if (startDate || endDate) {
            const sDate = new Date(s.sale_date || s.created_at).toISOString().slice(0, 10);
            if (startDate && sDate < startDate) return false;
            if (endDate && sDate > endDate) return false;
          }

          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const inv = String(s.invoice_no || '').toLowerCase();
            const name = String(s.customer_name || '').toLowerCase();
            const phone = String(s.customer_phone || '').toLowerCase();
            const note = String(s.notes || '').toLowerCase();
            const itemNames = (s.items || []).map(i => String(i.product_name || '').toLowerCase()).join(' ');

            return inv.includes(q) || name.includes(q) || phone.includes(q) || note.includes(q) || itemNames.includes(q);
          }

          return true;
        });

        const totalWholesaleRev = filteredSales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
        const totalPaidCash = filteredSales.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0);
        const totalDuePawna = filteredSales.reduce((sum, s) => sum + Number(s.due_amount || 0), 0);

        return (
          <div className="glass-card" style={{ padding: '24px' }}>
            {/* Summary Stat Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px', background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px' }}>
              <div>Total Wholesale Revenue: <strong style={{ display: 'block', fontSize: '15px', color: '#f59e0b' }}>{formatCurrency(totalWholesaleRev)}</strong></div>
              <div>Paid Cash Received: <strong style={{ display: 'block', fontSize: '15px', color: 'var(--success)' }}>{formatCurrency(totalPaidCash)}</strong></div>
              <div>Customer Due Pawna: <strong style={{ display: 'block', fontSize: '15px', color: 'var(--danger)' }}>{formatCurrency(totalDuePawna)}</strong></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Wholesale B2B Sales History ({filteredSales.length})</h3>

              {/* Instant Search Bar */}
              <div style={{ position: 'relative', width: '320px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '36px', paddingRight: searchQuery ? '32px' : '12px', fontSize: '13px' }}
                  placeholder="Search by Buyer Name, Phone, Invoice #, or Item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Buyer Name</th>
                    <th>Total Amount</th>
                    <th>Paid Cash</th>
                    <th>Due Pawna</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No wholesale sales found for the selected date filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map(sale => {
                      const dueNum = Number(sale.due_amount || 0);
                      const paidNum = Number(sale.paid_amount || 0);

                      return (
                        <tr key={sale.id}>
                          <td><strong style={{ color: 'var(--text-primary)' }}>#{sale.invoice_no}</strong></td>
                          <td style={{ fontSize: '13px' }}>{new Date(sale.sale_date).toLocaleDateString()}</td>
                          <td>
                            <strong>{sale.customer_name}</strong>
                            {sale.company_name && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sale.company_name}</div>}
                          </td>
                          <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{formatCurrency(sale.total_amount)}</td>
                          <td style={{ fontWeight: '700', color: 'var(--success)' }}>{formatCurrency(paidNum)}</td>
                          <td style={{ fontWeight: '700', color: dueNum > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                            {formatCurrency(dueNum)}
                          </td>
                          <td>
                            <span className={`badge ${dueNum === 0 ? 'badge-success' : (paidNum > 0 ? 'badge-warning' : 'badge-danger')}`}>
                              {dueNum === 0 ? '🟢 Full Paid' : (paidNum > 0 ? '🟡 Partial Paid' : '🔴 Full Credit Due')}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => handleViewSaleDetails(sale.id)} className="btn btn-secondary btn-icon btn-sm" title="View & Print Wholesale Invoice">
                                <Eye size={14} />
                              </button>
                              <button onClick={() => handleDeleteSale(sale)} className="btn btn-danger btn-icon btn-sm" style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }} title="Delete Wholesale Order & Revert Stock">
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
        );
      })()}

      {/* --- SUB TAB 2: BUYER DIRECTORY --- */}
      {activeSubTab === 'buyers' && (() => {
        const filteredBuyers = buyersList.filter(b => {
          if (!buyerSearchQuery.trim()) return true;
          const q = buyerSearchQuery.toLowerCase().trim();
          return (
            String(b.name || '').toLowerCase().includes(q) ||
            String(b.company_name || '').toLowerCase().includes(q) ||
            String(b.phone || '').toLowerCase().includes(q) ||
            String(b.email || '').toLowerCase().includes(q) ||
            String(b.address || '').toLowerCase().includes(q)
          );
        });

        return (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Registered B2B Wholesale Buyers Profiles ({filteredBuyers.length})</h3>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '280px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '36px', paddingRight: buyerSearchQuery ? '32px' : '12px', fontSize: '13px' }}
                    placeholder="Search Buyer Name, Phone, Company..."
                    value={buyerSearchQuery}
                    onChange={(e) => setBuyerSearchQuery(e.target.value)}
                  />
                  {buyerSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setBuyerSearchQuery('')}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <button onClick={() => setShowBuyerModal(true)} className="btn btn-secondary btn-sm">
                  + Add Buyer Profile
                </button>
              </div>
            </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Buyer Name</th>
                  <th>Company / Store Name</th>
                  <th>Phone Number</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {buyersList.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No wholesale buyers registered yet.
                    </td>
                  </tr>
                ) : (
                  buyersList.map(buyer => (
                    <tr key={buyer.id}>
                      <td><strong>{buyer.name}</strong></td>
                      <td>{buyer.company_name || 'N/A'}</td>
                      <td>{buyer.phone || 'N/A'}</td>
                      <td>{buyer.email || 'N/A'}</td>
                      <td style={{ fontSize: '12px' }}>{buyer.address || 'N/A'}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{buyer.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    })()}

      {/* Add Wholesale Buyer Modal */}
      {showBuyerModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Create Wholesale Buyer / Party Profile</h3>
              <button onClick={() => setShowBuyerModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateBuyer}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Buyer / Contact Name *</label>
                  <input type="text" className="form-input" required placeholder="e.g. Shahadat Hossain" value={buyerForm.name} onChange={(e) => setBuyerForm({ ...buyerForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Company / Shop Name</label>
                  <input type="text" className="form-input" placeholder="e.g. Shahadat Electronics & Retail" value={buyerForm.company_name} onChange={(e) => setBuyerForm({ ...buyerForm, company_name: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input type="text" className="form-input" placeholder="+8801711..." value={buyerForm.phone} onChange={(e) => setBuyerForm({ ...buyerForm, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" placeholder="buyer@gmail.com" value={buyerForm.email} onChange={(e) => setBuyerForm({ ...buyerForm, email: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input type="text" className="form-input" placeholder="Chittagong Market..." value={buyerForm.address} onChange={(e) => setBuyerForm({ ...buyerForm, address: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowBuyerModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Buyer Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Wholesale Order Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h3>Record Wholesale B2B Product Sale</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmitSale}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Select Registered Buyer OR Type Party Name *</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select
                      className="form-select"
                      style={{ flex: 1 }}
                      value={customerId}
                      onChange={(e) => {
                        setCustomerId(e.target.value);
                        const b = buyersList.find(buyer => String(buyer.id) === String(e.target.value));
                        if (b) setCustomerName(b.name);
                      }}
                    >
                      <option value="">Select Existing Buyer...</option>
                      {buyersList.map(b => (
                        <option key={b.id} value={b.id}>{b.name} {b.company_name ? `(${b.company_name})` : ''}</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="Or type custom buyer name..."
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        setCustomerId('');
                      }}
                    />

                    <div style={{ flex: 0.8 }}>
                      <input
                        type="date"
                        className="form-input"
                        title="Sale / Invoice Date"
                        value={saleDate}
                        onChange={(e) => setSaleDate(e.target.value)}
                        style={{ borderColor: 'var(--accent-primary)' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Add Product Line Section */}
                <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <PackagePlus size={16} color="#f59e0b" />
                    <span>Select Product & Custom Wholesale Unit Price</span>
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1.2fr 1fr', gap: '10px', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Product *</label>
                      <ProductSelectSearch
                        products={products}
                        selectedId={selectedProductId}
                        onSelect={(id) => {
                          setSelectedProductId(id);
                          const prod = products.find(p => String(p.id) === String(id));
                          if (prod) {
                            setUnitCostPrice(String(prod.cost_price || 0));
                            setUnitWholesalePrice(String(prod.selling_price || 0));
                          }
                        }}
                        placeholder="Type product name or SKU to search..."
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Wholesale Qty</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="1"
                        value={sellQty}
                        onChange={(e) => setSellQty(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Wholesale Unit Price ({currency})</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        placeholder="Custom wholesale price..."
                        value={unitWholesalePrice}
                        onChange={(e) => setUnitWholesalePrice(e.target.value)}
                      />
                    </div>

                    <button type="button" onClick={handleAddItemToSale} className="btn btn-primary" style={{ padding: '10px', background: '#f59e0b', borderColor: '#f59e0b', color: '#000' }}>
                      + Add Product
                    </button>
                  </div>

                  {selectedProductId && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      Product Buy Cost Price: <strong style={{ color: '#f59e0b' }}>{formatCurrency(unitCostPrice)}</strong>
                    </div>
                  )}
                </div>

                {/* Items List */}
                {saleItems.length > 0 && (
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th>Qty</th>
                          <th>Buy Cost</th>
                          <th>Wholesale Price</th>
                          <th>Unit Profit</th>
                          <th>Total Amount</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {saleItems.map((item, idx) => (
                          <tr key={idx}>
                            <td><strong>{item.product_name}</strong></td>
                            <td>{item.quantity}</td>
                            <td style={{ color: '#f59e0b', fontWeight: '600' }}>{formatCurrency(item.unit_cost_price)}</td>
                            <td style={{ fontWeight: '600' }}>{formatCurrency(item.unit_wholesale_price)}</td>
                            <td style={{ color: item.item_profit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: '700' }}>
                              +{formatCurrency(item.item_profit)}
                            </td>
                            <td style={{ fontWeight: '700', color: 'var(--success)' }}>{formatCurrency(item.item_total)}</td>
                            <td>
                              <button type="button" onClick={() => handleRemoveItem(item.product_id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Total Wholesale Revenue Summary Box */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'var(--bg-secondary)', borderRadius: '10px', fontWeight: '800', fontSize: '16px', border: '1px solid var(--border-color)' }}>
                  <span>Total Wholesale Revenue:</span>
                  <span style={{ color: 'var(--success)', fontSize: '20px' }}>{formatCurrency(totalSaleAmount)}</span>
                </div>

                {/* Payment & Pawna Dues Panel */}
                <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Payment & Pawna Dues Configuration (ক্যাশ ও বাকির হিসাব)
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Payment Status</label>
                      <select
                        className="form-select"
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                      >
                        <option value="paid">Full Paid (সম্পূর্ণ নগদ আদায়)</option>
                        <option value="partial">Partial Paid (আংশিক নগদ + বাকি)</option>
                        <option value="due">Full Due / Credit (সম্পূর্ণ বাকি/পাওনা)</option>
                      </select>
                    </div>

                    {paymentStatus === 'partial' && (
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Collected Amount ({currency})</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Deposit into Account</label>
                      <select
                        className="form-select"
                        disabled={paymentStatus === 'due'}
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                      >
                        <option value="">Select Account...</option>
                        {accountsList.map(a => (
                          <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Dynamic Summary Breakdown Box */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: '8px', fontSize: '13px' }}>
                    <div>
                      <span>Cash Collected Amount:</span>
                      <strong style={{ color: 'var(--success)', display: 'block', fontSize: '15px', marginTop: '2px' }}>
                        +{formatCurrency(computedPaid)}
                      </strong>
                    </div>
                    <div>
                      <span>Remaining Pawna (Auto Pawna Record):</span>
                      <strong style={{ color: computedDue > 0 ? 'var(--danger)' : 'var(--text-muted)', display: 'block', fontSize: '15px', marginTop: '2px' }}>
                        {computedDue > 0 ? `+${formatCurrency(computedDue)}` : formatCurrency(0)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={totalSaleAmount <= 0}>
                  Confirm Wholesale Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wholesale Sale Details & Print Invoice Modal */}
      {selectedSaleDetails && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Wholesale Order #{selectedSaleDetails.invoice_no}</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Date: {new Date(selectedSaleDetails.sale_date).toLocaleDateString()}
                </span>
              </div>
              <button onClick={() => setSelectedSaleDetails(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '14px 18px', borderRadius: '12px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>B2B Party / Buyer:</span>
                  <strong style={{ fontSize: '16px', display: 'block', color: 'var(--text-primary)' }}>{selectedSaleDetails.customer_name}</strong>
                </div>
                
                <button onClick={handlePrintWholesaleInvoice} className="btn btn-primary" style={{ background: '#2563eb', borderColor: '#2563eb' }}>
                  <Printer size={16} />
                  <span>Print Wholesale Invoice</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: 'var(--bg-secondary)', padding: '14px', borderRadius: '12px', fontSize: '13px' }}>
                <div>Total Revenue: <strong style={{ color: 'var(--success)', display: 'block' }}>{formatCurrency(selectedSaleDetails.total_amount)}</strong></div>
                <div>Cash Paid: <strong style={{ color: 'var(--success)', display: 'block' }}>{formatCurrency(selectedSaleDetails.paid_amount || selectedSaleDetails.total_amount)}</strong></div>
                <div>Due Pawna: <strong style={{ color: 'var(--danger)', display: 'block' }}>{formatCurrency(selectedSaleDetails.due_amount || 0)}</strong></div>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Qty</th>
                    <th>Unit Cost</th>
                    <th>Wholesale Price</th>
                    <th>Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSaleDetails.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td><strong>{item.product_name}</strong></td>
                      <td>{item.quantity}</td>
                      <td style={{ color: '#f59e0b' }}>{formatCurrency(item.unit_cost_price)}</td>
                      <td>{formatCurrency(item.unit_wholesale_price)}</td>
                      <td style={{ fontWeight: '700', color: 'var(--success)' }}>{formatCurrency(item.total_item_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
