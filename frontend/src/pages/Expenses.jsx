import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Receipt, Trash2, Calendar, DollarSign, CreditCard, Search, Filter, RefreshCw, X, FileSpreadsheet } from 'lucide-react';
import { DateRangeFilter } from '../components/DateRangeFilter';

export const Expenses = () => {
  const { expenses, currency, addExpense, deleteExpense, authFetch, refreshAllData } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [accounts, setAccounts] = useState([]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [dateRange, setDateRange] = useState({ range: 'all', startDate: '', endDate: '' });

  const [formData, setFormData] = useState({
    title: '',
    category: 'Utilities',
    amount: '',
    account_id: '',
    expense_date: new Date().toISOString().slice(0, 10),
    notes: ''
  });

  const categories = ['Rent', 'Utilities', 'Salaries & Wages', 'Payroll', 'Transport', 'Marketing', 'Maintenance', 'Miscellaneous'];

  const categoriesList = useMemo(() => {
    const predefined = ['Rent', 'Utilities', 'Salaries & Wages', 'Payroll', 'Transport', 'Marketing', 'Maintenance', 'Miscellaneous'];
    const existing = (expenses || []).map(e => e.category).filter(Boolean);
    return Array.from(new Set([...predefined, ...existing]));
  }, [expenses]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await authFetch('/api/finance/summary');
        const data = await res.json();
        if (res.ok && data.accounts) {
          setAccounts(data.accounts);
        }
      } catch (err) {
        console.error('Error fetching finance accounts:', err);
      }
    };
    fetchAccounts();
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await addExpense(formData);
      if (res.success) {
        setShowModal(false);
        setFormData({ title: '', category: 'Utilities', amount: '', account_id: '', expense_date: new Date().toISOString().slice(0, 10), notes: '' });
        refreshAllData();
      } else {
        alert(`Error: ${res.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete expense "${title}"?`)) {
      await deleteExpense(id);
      refreshAllData();
    }
  };

  // Filtered Expenses Computation
  const filteredExpenses = useMemo(() => {
    return (expenses || []).filter(exp => {
      // 1. Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = (exp.title || '').toLowerCase().includes(term);
        const matchNotes = (exp.notes || '').toLowerCase().includes(term);
        const matchCategory = (exp.category || '').toLowerCase().includes(term);
        if (!matchTitle && !matchNotes && !matchCategory) return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'all' && exp.category !== selectedCategory) {
        return false;
      }

      // 3. Account filter
      if (selectedAccount !== 'all') {
        if (selectedAccount === 'unassigned') {
          if (exp.account_id || exp.account_name) return false;
        } else if (String(exp.account_id) !== String(selectedAccount)) {
          return false;
        }
      }

      // 4. Date range filter
      if (exp.expense_date) {
        const expDateStr = new Date(exp.expense_date).toISOString().slice(0, 10);
        if (dateRange.startDate && expDateStr < dateRange.startDate) return false;
        if (dateRange.endDate && expDateStr > dateRange.endDate) return false;
      }

      return true;
    });
  }, [expenses, searchTerm, selectedCategory, selectedAccount, dateRange]);

  const totalAllExpenses = (expenses || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalFilteredExpenses = filteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const isFilterActive = Boolean(searchTerm || selectedCategory !== 'all' || selectedAccount !== 'all' || (dateRange && dateRange.range !== 'all'));

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedAccount('all');
    setDateRange({ range: 'all', startDate: '', endDate: '' });
  };

  const exportExpensesToCSV = () => {
    const headers = ["Date", "Expense Title", "Category", "Paid Via Account", "Amount (BDT)", "Notes"];
    const rows = filteredExpenses.map(exp => [
      `"${new Date(exp.expense_date).toLocaleDateString()}"`,
      `"${(exp.title || '').replace(/"/g, '""')}"`,
      `"${(exp.category || '').replace(/"/g, '""')}"`,
      `"${(exp.account_name || 'Cash Box / Direct').replace(/"/g, '""')}"`,
      Number(exp.amount || 0).toFixed(2),
      `"${(exp.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Operating_Expenses_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Card */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {isFilterActive ? `Filtered Operating Expenses (${filteredExpenses.length} of ${expenses.length} entries)` : 'Total Logged Operating Expenses'}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '4px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--danger)' }}>
              {currency}{totalFilteredExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            {isFilterActive && (
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                (Total Expenses: {currency}{totalAllExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
              </span>
            )}
          </div>
        </div>

        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>+ Log New Expense</span>
        </button>
      </div>

      {/* Filter Control Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
              placeholder="Search expense title or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter Dropdown */}
          <div style={{ minWidth: '170px' }}>
            <select
              className="form-select"
              style={{ height: '38px', fontSize: '13px', fontWeight: '600' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">🔍 All Categories (সকল খাত)</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>📁 {cat}</option>
              ))}
            </select>
          </div>

          {/* Account Filter Dropdown */}
          <div style={{ minWidth: '180px' }}>
            <select
              className="form-select"
              style={{ height: '38px', fontSize: '13px', fontWeight: '600' }}
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
            >
              <option value="all">💳 All Payment Accounts</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>💳 {acc.name}</option>
              ))}
              <option value="unassigned">Cash Box / Direct</option>
            </select>
          </div>

          {/* Export & Reset Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isFilterActive && (
              <button onClick={handleResetFilters} className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                <RefreshCw size={14} />
                <span>Reset Filters</span>
              </button>
            )}
            <button onClick={exportExpensesToCSV} className="btn btn-success btn-sm" title="Export Filtered Expenses to Excel CSV">
              <FileSpreadsheet size={15} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Date Range Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={15} color="var(--accent-primary)" />
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Date Filter Range:</span>
          </div>

          <DateRangeFilter
            initialRange={dateRange.range}
            onFilterChange={(dates) => setDateRange(dates)}
          />
        </div>
      </div>

      {/* Expense List Table */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Expense Title</th>
                <th>Category</th>
                <th>Paid Via Account</th>
                <th>Amount</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {isFilterActive ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <span>No operational expenses found matching the selected filter criteria.</span>
                        <button onClick={handleResetFilters} className="btn btn-secondary btn-sm">
                          <RefreshCw size={14} />
                          <span>Reset Filters</span>
                        </button>
                      </div>
                    ) : (
                      'No operational expenses recorded yet.'
                    )}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(exp => (
                  <tr key={exp.id}>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(exp.expense_date).toLocaleDateString()}
                    </td>
                    <td>
                      <strong style={{ fontSize: '14px' }}>{exp.title}</strong>
                    </td>
                    <td>
                      <span className="badge badge-info">{exp.category}</span>
                    </td>
                    <td>
                      {exp.account_name ? (
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent-primary)', background: 'var(--bg-secondary)', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          💳 {exp.account_name}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td style={{ fontSize: '14px', fontWeight: '700', color: 'var(--danger)', whiteSpace: 'nowrap' }}>
                      -{currency}{Number(exp.amount).toFixed(2)}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{exp.notes || '-'}</td>
                    <td>
                      <button onClick={() => handleDelete(exp.id, exp.title)} className="btn btn-danger btn-icon" title="Delete Expense">
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

      {/* Log Expense Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Log Operating Expense</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-icon">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Expense Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. July Shop Rent or Transport Cost"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount ({currency}) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      required
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                </div>

                {/* Paid From Account Dropdown */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>
                    Paid From Account (কোন অ্যাকাউন্ট থেকে পরিশোধিত)
                  </label>
                  <select
                    className="form-select"
                    value={formData.account_id}
                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                  >
                    <option value="">Choose Bank / Cash Account (Optional)...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        💳 {acc.name} (Balance: {currency}{Number(acc.balance).toFixed(2)})
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    * Select account to automatically deduct from Bank/Cash balance and log in Passbook!
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Expense Date</label>
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder="Additional details..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving Expense...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
