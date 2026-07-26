import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Receipt, Trash2, Calendar, DollarSign } from 'lucide-react';

export const Expenses = () => {
  const { expenses, currency, addExpense, deleteExpense } = useApp();
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Utilities',
    amount: '',
    expense_date: new Date().toISOString().slice(0, 10),
    notes: ''
  });

  const categories = ['Rent', 'Utilities', 'Salaries', 'Transport', 'Marketing', 'Maintenance', 'Miscellaneous'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await addExpense(formData);
    if (res.success) {
      setShowModal(false);
      setFormData({ title: '', category: 'Utilities', amount: '', expense_date: new Date().toISOString().slice(0, 10), notes: '' });
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete expense "${title}"?`)) {
      await deleteExpense(id);
    }
  };

  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Card */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Logged Expenses</span>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--danger)' }}>
            {currency}{totalExpenses.toLocaleString()}
          </h2>
        </div>

        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>+ Log New Expense</span>
        </button>
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
                <th>Amount</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No operational expenses recorded yet.
                  </td>
                </tr>
              ) : (
                expenses.map(exp => (
                  <tr key={exp.id}>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {new Date(exp.expense_date).toLocaleDateString()}
                    </td>
                    <td>
                      <strong style={{ fontSize: '14px' }}>{exp.title}</strong>
                    </td>
                    <td>
                      <span className="badge badge-info">{exp.category}</span>
                    </td>
                    <td style={{ fontSize: '14px', fontWeight: '700', color: 'var(--danger)' }}>
                      -{currency}{Number(exp.amount).toFixed(2)}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{exp.notes || '-'}</td>
                    <td>
                      <button onClick={() => handleDelete(exp.id, exp.title)} className="btn btn-danger btn-icon">
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
                  <label className="form-label">Expense Title</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. July Shop Rent or Electricity Bill"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
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
                    <label className="form-label">Amount ({currency})</label>
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
                <button type="submit" className="btn btn-primary">
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
