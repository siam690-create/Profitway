import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Landmark, Wallet, ArrowUpRight, ArrowDownRight, Plus, RefreshCw, DollarSign, Send, CheckCircle, UserCheck, ShieldAlert, X, TrendingUp, HandCoins, Eye, Printer, FileText, Calendar, Building2, Download } from 'lucide-react';
import { DateRangeFilter } from '../components/DateRangeFilter';

export const Finance = () => {
  const { authFetch, currency, tenant, refreshAllData } = useApp();
  const [activeSubTab, setActiveSubTab] = useState('accounts');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [financeData, setFinanceData] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [investmentData, setInvestmentData] = useState({ summary: {}, investments: [], transactions: [] });
  const [loading, setLoading] = useState(false);

  // Modals
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDenaModal, setShowDenaModal] = useState(false);
  const [showPawnaModal, setShowPawnaModal] = useState(false);
  const [showPayDenaModal, setShowPayDenaModal] = useState(null);
  const [showCollectPawnaModal, setShowCollectPawnaModal] = useState(null);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [showRepayInvestModal, setShowRepayInvestModal] = useState(null);

  // Audit History Modals
  const [denaAuditData, setDenaAuditData] = useState(null);
  const [pawnaAuditData, setPawnaAuditData] = useState(null);
  const [accountStatementData, setAccountStatementData] = useState(null);
  const [investAuditData, setInvestAuditData] = useState(null);

  // Form States
  const [accForm, setAccForm] = useState({ name: '', account_type: 'bank', account_number: '', initial_balance: '' });
  const [depositForm, setDepositForm] = useState({ account_id: '', amount: '', source_title: 'Manual Fund Deposit', notes: '' });
  const [transferForm, setTransferForm] = useState({ from_account_id: '', to_account_id: '', amount: '' });
  const [denaForm, setDenaForm] = useState({ title: '', party_type: 'supplier', party_name: '', total_amount: '', due_date: '', notes: '' });
  const [pawnaForm, setPawnaForm] = useState({ title: '', party_type: 'customer', party_name: '', total_amount: '', due_date: '', notes: '' });
  const [payDenaAmt, setPayDenaAmt] = useState('');
  const [payDenaAccId, setPayDenaAccId] = useState('');
  const [collectPawnaAmt, setCollectPawnaAmt] = useState('');
  const [collectPawnaAccId, setCollectPawnaAccId] = useState('');

  // Investment Forms
  const [investForm, setInvestForm] = useState({ investor_name: '', phone: '', email: '', invested_amount: '', account_id: '', notes: '' });
  const [repayInvestAmt, setRepayInvestAmt] = useState('');
  const [repayInvestAccId, setRepayInvestAccId] = useState('');
  const [repayInvestNotes, setRepayInvestNotes] = useState('');

  // Payroll Form
  const [payrollForm, setPayrollForm] = useState({
    staff_id: '',
    staff_name: '',
    month_year: new Date().toISOString().slice(0, 7),
    base_salary: '',
    bonus: '0',
    advance_deduction: '0',
    payment_method: 'Cash',
    account_id: '',
    notes: ''
  });

  const fetchFinance = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/finance/summary');
      const data = await res.json();
      if (res.ok) setFinanceData(data);

      const staffRes = await authFetch('/api/staff');
      const staffData = await staffRes.json();
      if (staffRes.ok) setStaffList(staffData);

      const supRes = await authFetch('/api/suppliers');
      const supData = await supRes.json();
      if (supRes.ok) setSuppliersList(supData);

      const invRes = await authFetch('/api/investments');
      const invData = await invRes.json();
      if (invRes.ok) setInvestmentData(invData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  const handleOpenDenaAudit = async (denaId) => {
    try {
      const res = await authFetch(`/api/finance/liabilities/${denaId}/audit`);
      const data = await res.json();
      if (res.ok) setDenaAuditData(data);
    } catch (err) {
      alert(`Error fetching Dena history: ${err.message}`);
    }
  };

  const handleOpenPawnaAudit = async (pawnaId) => {
    try {
      const res = await authFetch(`/api/finance/receivables/${pawnaId}/audit`);
      const data = await res.json();
      if (res.ok) setPawnaAuditData(data);
    } catch (err) {
      alert(`Error fetching Pawna history: ${err.message}`);
    }
  };

  const handleOpenAccountStatement = async (accId) => {
    try {
      const res = await authFetch(`/api/finance/accounts/${accId}/statement`);
      const data = await res.json();
      if (res.ok) setAccountStatementData(data);
    } catch (err) {
      alert(`Error fetching Account statement: ${err.message}`);
    }
  };

  const handleOpenInvestAudit = (investRecord) => {
    const relatedLogs = investmentData.transactions.filter(t => t.investment_id === investRecord.id);
    setInvestAuditData({
      investment: investRecord,
      transactions: relatedLogs
    });
  };

  const handlePrintStatement = () => {
    window.print();
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/finance/accounts', {
        method: 'POST',
        body: JSON.stringify(accForm)
      });
      if (res.ok) {
        setShowAccountModal(false);
        setAccForm({ name: '', account_type: 'bank', account_number: '', initial_balance: '' });
        fetchFinance();
        alert('Financial account added!');
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/finance/deposit', {
        method: 'POST',
        body: JSON.stringify(depositForm)
      });
      const data = await res.json();
      if (res.ok) {
        setShowDepositModal(false);
        setDepositForm({ account_id: '', amount: '', source_title: 'Manual Fund Deposit', notes: '' });
        fetchFinance();
        alert(data.message || 'Funds deposited into account successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/finance/transfer', {
        method: 'POST',
        body: JSON.stringify(transferForm)
      });
      const data = await res.json();
      if (res.ok) {
        setShowTransferModal(false);
        setTransferForm({ from_account_id: '', to_account_id: '', amount: '' });
        fetchFinance();
        alert('Funds transferred successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCreateDena = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/finance/liabilities', {
        method: 'POST',
        body: JSON.stringify(denaForm)
      });
      if (res.ok) {
        setShowDenaModal(false);
        setDenaForm({ title: '', party_type: 'supplier', party_name: '', total_amount: '', due_date: '', notes: '' });
        fetchFinance();
        alert('Dena (Liability) record created!');
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCreatePawna = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/finance/receivables', {
        method: 'POST',
        body: JSON.stringify(pawnaForm)
      });
      if (res.ok) {
        setShowPawnaModal(false);
        setPawnaForm({ title: '', party_type: 'customer', party_name: '', total_amount: '', due_date: '', notes: '' });
        fetchFinance();
        alert('Pawna (Receivable) record created!');
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handlePayDenaSubmit = async (e) => {
    e.preventDefault();
    if (!showPayDenaModal) return;
    try {
      const res = await authFetch(`/api/finance/liabilities/${showPayDenaModal.id}/pay`, {
        method: 'POST',
        body: JSON.stringify({ payment_amount: payDenaAmt, account_id: payDenaAccId })
      });
      if (res.ok) {
        setShowPayDenaModal(null);
        setPayDenaAmt('');
        setPayDenaAccId('');
        fetchFinance();
        alert('Dena payment processed successfully!');
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCollectPawnaSubmit = async (e) => {
    e.preventDefault();
    if (!showCollectPawnaModal) return;
    try {
      const res = await authFetch(`/api/finance/receivables/${showCollectPawnaModal.id}/collect`, {
        method: 'POST',
        body: JSON.stringify({ collection_amount: collectPawnaAmt, account_id: collectPawnaAccId })
      });
      if (res.ok) {
        setShowCollectPawnaModal(null);
        setCollectPawnaAmt('');
        setCollectPawnaAccId('');
        fetchFinance();
        alert('Pawna collection processed successfully!');
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCreateInvestmentSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/investments', {
        method: 'POST',
        body: JSON.stringify(investForm)
      });
      const data = await res.json();
      if (res.ok) {
        setShowInvestModal(false);
        setInvestForm({ investor_name: '', phone: '', email: '', invested_amount: '', account_id: '', notes: '' });
        fetchFinance();
        alert('New investment capital recorded & deposited into account!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleRepayInvestmentSubmit = async (e) => {
    e.preventDefault();
    if (!showRepayInvestModal) return;
    try {
      const res = await authFetch(`/api/investments/${showRepayInvestModal.id}/repay`, {
        method: 'POST',
        body: JSON.stringify({
          repayment_amount: repayInvestAmt,
          account_id: repayInvestAccId,
          notes: repayInvestNotes
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowRepayInvestModal(null);
        setRepayInvestAmt('');
        setRepayInvestAccId('');
        setRepayInvestNotes('');
        fetchFinance();
        alert('Investment capital repayment processed!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handlePaySalarySubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/finance/payroll', {
        method: 'POST',
        body: JSON.stringify(payrollForm)
      });
      const data = await res.json();
      if (res.ok) {
        setPayrollForm({
          staff_id: '',
          staff_name: '',
          month_year: new Date().toISOString().slice(0, 7),
          base_salary: '',
          bonus: '0',
          advance_deduction: '0',
          payment_method: 'Cash',
          account_id: '',
          notes: ''
        });
        fetchFinance();
        refreshAllData();
        alert('Staff salary disbursed and logged in expenses!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const summary = financeData?.summary || {};
  const accounts = financeData?.accounts || [];
  const liabilities = financeData?.liabilities || [];
  const receivables = financeData?.receivables || [];
  const payroll = financeData?.payroll || [];
  const investments = investmentData?.investments || [];
  const invSummary = investmentData?.summary || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Landmark size={24} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Finance, Dena-Pawna & Treasury OS</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Manage Liquid Accounts, Manual Fund Deposits, Dena (Payables), Pawna (Receivables), Business Investments & Staff Payroll
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <DateRangeFilter
            onFilterChange={({ startDate: s, endDate: e }) => {
              setStartDate(s);
              setEndDate(e);
            }}
          />

          <button onClick={() => setShowDepositModal(true)} className="btn btn-success btn-sm">
            <Plus size={15} />
            <span>+ Deposit Funds (ফান্ড জমা)</span>
          </button>

          <button onClick={() => setShowTransferModal(true)} className="btn btn-secondary btn-sm">
            <Send size={15} />
            <span>Transfer Funds</span>
          </button>

          <button onClick={() => setShowAccountModal(true)} className="btn btn-primary btn-sm">
            <Plus size={15} />
            <span>+ Add Account</span>
          </button>
        </div>
      </div>

      {/* Financial Executive Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>1. Liquid Balance</span>
            <Wallet size={18} color="var(--accent-primary)" />
          </div>
          <strong style={{ fontSize: '24px', color: 'var(--text-primary)' }}>{currency}{Number(summary.total_liquid_balance || 0).toFixed(2)}</strong>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Across {accounts.length} Accounts</div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '700' }}>2. Total Pawna (পাওনা)</span>
            <ArrowUpRight size={18} color="var(--success)" />
          </div>
          <strong style={{ fontSize: '24px', color: 'var(--success)' }}>+{currency}{Number(summary.total_pawna || 0).toFixed(2)}</strong>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Customer & Wholesale Dues</div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: '700' }}>3. Total Dena (দেনা)</span>
            <ArrowDownRight size={18} color="var(--danger)" />
          </div>
          <strong style={{ fontSize: '24px', color: 'var(--danger)' }}>-{currency}{Number(summary.total_dena || 0).toFixed(2)}</strong>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Supplier Restocks & Dues</div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#8b5cf6', fontWeight: '700' }}>4. Active Investor Capital</span>
            <HandCoins size={18} color="#8b5cf6" />
          </div>
          <strong style={{ fontSize: '24px', color: '#8b5cf6' }}>{currency}{Number(invSummary.active_capital || 0).toFixed(2)}</strong>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Raised Investor Funds</div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b', background: 'rgba(245, 158, 11, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '700' }}>5. Net Business Capital</span>
            <DollarSign size={18} color="#f59e0b" />
          </div>
          <strong style={{ fontSize: '24px', color: '#f59e0b' }}>{currency}{Number(summary.net_capital || 0).toFixed(2)}</strong>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>(Cash + Pawna) - Dena</div>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveSubTab('accounts')}
          className={`btn ${activeSubTab === 'accounts' ? 'btn-primary' : 'btn-secondary'}`}
        >
          💵 Cash & Bank Accounts ({accounts.length})
        </button>
        <button
          onClick={() => setActiveSubTab('pawna')}
          className={`btn ${activeSubTab === 'pawna' ? 'btn-primary' : 'btn-secondary'}`}
        >
          📥 Pawna (পাওনা / Dues)
        </button>
        <button
          onClick={() => setActiveSubTab('dena')}
          className={`btn ${activeSubTab === 'dena' ? 'btn-primary' : 'btn-secondary'}`}
        >
          📤 Dena (দেনা / Payables)
        </button>
        <button
          onClick={() => setActiveSubTab('investments')}
          className={`btn ${activeSubTab === 'investments' ? 'btn-primary' : 'btn-secondary'}`}
        >
          📈 Investments (বিনিয়োগ খাত)
        </button>
        <button
          onClick={() => setActiveSubTab('payroll')}
          className={`btn ${activeSubTab === 'payroll' ? 'btn-primary' : 'btn-secondary'}`}
        >
          👔 Staff Salary & Payroll
        </button>
      </div>

      {/* 1. Cash & Bank Accounts Section */}
      {activeSubTab === 'accounts' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {accounts.map(acc => (
            <div key={acc.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-primary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>{acc.account_type}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{acc.account_number || 'Cash Box'}</span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{acc.name}</h3>
              <strong style={{ fontSize: '24px', color: 'var(--success)' }}>{currency}{Number(acc.balance).toFixed(2)}</strong>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  onClick={() => {
                    setDepositForm({ account_id: acc.id, amount: '', source_title: 'Manual Fund Deposit', notes: '' });
                    setShowDepositModal(true);
                  }}
                  className="btn btn-success btn-sm"
                  style={{ flex: 1 }}
                >
                  <Plus size={14} />
                  <span>Deposit Fund</span>
                </button>
                <button onClick={() => handleOpenAccountStatement(acc.id)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  <FileText size={14} />
                  <span>Passbook</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Pawna / Receivables Section */}
      {activeSubTab === 'pawna' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Customer & Courier Pawna Dues (পাওনা খাত)</h3>
            <button onClick={() => setShowPawnaModal(true)} className="btn btn-success btn-sm">
              <Plus size={15} />
              <span>+ Record New Pawna</span>
            </button>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title & Description</th>
                  <th>Party Name & Type</th>
                  <th>Total Due</th>
                  <th>Collected</th>
                  <th>Pending Dues</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {receivables.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No Pawna (Receivable) records found.
                    </td>
                  </tr>
                ) : (
                  receivables.map(r => {
                    const pending = Number(r.total_amount) - Number(r.amount_collected);
                    return (
                      <tr key={r.id}>
                        <td>
                          <strong>{r.title}</strong>
                          {r.notes && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.notes}</div>}
                        </td>
                        <td>
                          <strong>{r.party_name}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>{r.party_type}</span>
                        </td>
                        <td style={{ fontWeight: '600' }}>{currency}{Number(r.total_amount).toFixed(2)}</td>
                        <td style={{ color: 'var(--success)' }}>{currency}{Number(r.amount_collected).toFixed(2)}</td>
                        <td style={{ fontWeight: '700', color: pending > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {currency}{pending.toFixed(2)}
                        </td>
                        <td>
                          <span className={`badge ${r.status === 'collected' ? 'badge-success' : 'badge-warning'}`}>
                            {r.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleOpenPawnaAudit(r.id)} className="btn btn-secondary btn-sm" title="View Full History Statement">
                              <Eye size={14} />
                              <span>History</span>
                            </button>
                            {pending > 0 && (
                              <button onClick={() => { setShowCollectPawnaModal(r); setCollectPawnaAmt(pending); }} className="btn btn-success btn-sm">
                                Collect Money
                              </button>
                            )}
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
      )}

      {/* 3. Dena / Liabilities Section */}
      {activeSubTab === 'dena' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Supplier & Vendor Dena Liabilities (দেনা খাত)</h3>
            <button onClick={() => setShowDenaModal(true)} className="btn btn-danger btn-sm">
              <Plus size={15} />
              <span>+ Record New Dena</span>
            </button>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title & Description</th>
                  <th>Party Name & Type</th>
                  <th>Total Dena</th>
                  <th>Paid Amount</th>
                  <th>Pending Dena</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {liabilities.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No Dena (Liability) records found.
                    </td>
                  </tr>
                ) : (
                  liabilities.map(l => {
                    const pending = Number(l.total_amount) - Number(l.amount_paid);
                    return (
                      <tr key={l.id}>
                        <td>
                          <strong>{l.title}</strong>
                          {l.notes && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.notes}</div>}
                        </td>
                        <td>
                          <strong>{l.party_name}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>{l.party_type}</span>
                        </td>
                        <td style={{ fontWeight: '600' }}>{currency}{Number(l.total_amount).toFixed(2)}</td>
                        <td style={{ color: 'var(--success)' }}>{currency}{Number(l.amount_paid).toFixed(2)}</td>
                        <td style={{ fontWeight: '700', color: pending > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {currency}{pending.toFixed(2)}
                        </td>
                        <td>
                          <span className={`badge ${l.status === 'paid' ? 'badge-success' : 'badge-danger'}`}>
                            {l.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleOpenDenaAudit(l.id)} className="btn btn-secondary btn-sm" title="View Full Detailed History Statement">
                              <Eye size={14} />
                              <span>History</span>
                            </button>
                            {pending > 0 && (
                              <button onClick={() => { setShowPayDenaModal(l); setPayDenaAmt(pending); }} className="btn btn-primary btn-sm">
                                Pay Dena
                              </button>
                            )}
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
      )}

      {/* 4. Business Investment Section */}
      {activeSubTab === 'investments' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Business Investments & Investor Capital (বিনিয়োগ খাত)</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Track external investments, investor funding deposits, and capital repayments
              </p>
            </div>

            <button onClick={() => setShowInvestModal(true)} className="btn btn-primary btn-sm" style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}>
              <Plus size={15} />
              <span>+ Record New Investment</span>
            </button>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Investor Name</th>
                  <th>Contact Info</th>
                  <th>Invested Amount</th>
                  <th>Returned Capital</th>
                  <th>Net Active Capital</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {investments.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No business investments recorded yet.
                    </td>
                  </tr>
                ) : (
                  investments.map(inv => {
                    const activeCapital = Number(inv.invested_amount) - Number(inv.returned_amount);
                    return (
                      <tr key={inv.id}>
                        <td>
                          <strong>{inv.investor_name}</strong>
                          {inv.notes && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{inv.notes}</div>}
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <div>{inv.phone || 'N/A'}</div>
                          <div>{inv.email || ''}</div>
                        </td>
                        <td style={{ fontWeight: '700', color: '#8b5cf6' }}>{currency}{Number(inv.invested_amount).toFixed(2)}</td>
                        <td style={{ color: 'var(--success)' }}>{currency}{Number(inv.returned_amount).toFixed(2)}</td>
                        <td style={{ fontWeight: '800', color: activeCapital > 0 ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                          {currency}{activeCapital.toFixed(2)}
                        </td>
                        <td>
                          <span className={`badge ${inv.status === 'returned' ? 'badge-success' : 'badge-warning'}`}>
                            {inv.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(inv.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleOpenInvestAudit(inv)} className="btn btn-secondary btn-sm" title="View Investment Statement">
                              <Eye size={14} />
                              <span>History</span>
                            </button>
                            {activeCapital > 0 && (
                              <button onClick={() => { setShowRepayInvestModal(inv); setRepayInvestAmt(activeCapital); }} className="btn btn-secondary btn-sm">
                                Return Capital
                              </button>
                            )}
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
      )}

      {/* 5. Staff Salary & Payroll Section */}
      {activeSubTab === 'payroll' && (
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px' }}>
          {/* Disburse Salary Form */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Disburse Staff Salary</h3>

            <form onSubmit={handlePaySalarySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Select Staff Employee</label>
                <select
                  className="form-select"
                  required
                  value={payrollForm.staff_id}
                  onChange={(e) => {
                    const st = staffList.find(s => String(s.id) === e.target.value);
                    setPayrollForm({
                      ...payrollForm,
                      staff_id: e.target.value,
                      staff_name: st ? st.name : ''
                    });
                  }}
                >
                  <option value="">Choose Staff...</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Staff Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Employee Full Name"
                  value={payrollForm.staff_name}
                  onChange={(e) => setPayrollForm({ ...payrollForm, staff_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Month & Year</label>
                <input
                  type="month"
                  className="form-input"
                  required
                  value={payrollForm.month_year}
                  onChange={(e) => setPayrollForm({ ...payrollForm, month_year: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Base Salary ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    required
                    placeholder="15000"
                    value={payrollForm.base_salary}
                    onChange={(e) => setPayrollForm({ ...payrollForm, base_salary: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bonus ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={payrollForm.bonus}
                    onChange={(e) => setPayrollForm({ ...payrollForm, bonus: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Advance Cut ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={payrollForm.advance_deduction}
                    onChange={(e) => setPayrollForm({ ...payrollForm, advance_deduction: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Paid From Account</label>
                  <select
                    className="form-select"
                    value={payrollForm.account_id}
                    onChange={(e) => setPayrollForm({ ...payrollForm, account_id: e.target.value })}
                  >
                    <option value="">Select Account...</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({currency}{a.balance})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>Net Salary Paid:</span>
                <strong style={{ color: 'var(--success)' }}>
                  {currency}{((Number(payrollForm.base_salary || 0) + Number(payrollForm.bonus || 0)) - Number(payrollForm.advance_deduction || 0)).toFixed(2)}
                </strong>
              </div>

              <button type="submit" className="btn btn-success" style={{ marginTop: '8px' }}>
                <CheckCircle size={16} />
                <span>Disburse & Log Salary</span>
              </button>
            </form>
          </div>

          {/* Salary History Table */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Payroll & Salary Disbursal History</h3>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Month</th>
                    <th>Base + Bonus</th>
                    <th>Advance Cut</th>
                    <th>Net Paid</th>
                    <th>Payment Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payroll.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No salary disbursements logged yet.
                      </td>
                    </tr>
                  ) : (
                    payroll.map(p => (
                      <tr key={p.id}>
                        <td><strong>{p.staff_name}</strong></td>
                        <td>{p.month_year}</td>
                        <td>{currency}{(Number(p.base_salary) + Number(p.bonus)).toFixed(2)}</td>
                        <td style={{ color: 'var(--danger)' }}>-{currency}{Number(p.advance_deduction).toFixed(2)}</td>
                        <td style={{ fontWeight: '800', color: 'var(--success)' }}>{currency}{Number(p.net_salary_paid).toFixed(2)}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(p.payment_date).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- AUDIT HISTORY & STATEMENT PRINT MODALS --- */}

      {/* 1. Dena Audit History & Statement Modal */}
      {denaAuditData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '780px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Supplier Dena Statement & Audit Trail</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Party: {denaAuditData.liability.party_name}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handlePrintStatement} className="btn btn-secondary btn-sm">
                  <Printer size={15} />
                  <span>Print Statement</span>
                </button>
                <button onClick={() => setDenaAuditData(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
              </div>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Summary Banner */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px' }}>
                <div>Supplier Name: <strong style={{ display: 'block', fontSize: '15px' }}>{denaAuditData.liability.party_name}</strong></div>
                <div>Total Dena: <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text-primary)' }}>{currency}{Number(denaAuditData.liability.total_amount).toFixed(2)}</strong></div>
                <div>Paid Amount: <strong style={{ display: 'block', fontSize: '15px', color: 'var(--success)' }}>{currency}{Number(denaAuditData.liability.amount_paid).toFixed(2)}</strong></div>
                <div>Pending Dena: <strong style={{ display: 'block', fontSize: '15px', color: 'var(--danger)' }}>{currency}{(Number(denaAuditData.liability.total_amount) - Number(denaAuditData.liability.amount_paid)).toFixed(2)}</strong></div>
              </div>

              {/* Purchase Order Products Breakdown */}
              {denaAuditData.items && denaAuditData.items.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Purchased Products Breakdown (কেনা প্রোডাক্টের তালিকা)</h4>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Qty Purchased</th>
                        <th>Unit Buy Price</th>
                        <th>Line Total Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {denaAuditData.items.map((item, idx) => (
                        <tr key={idx}>
                          <td><strong>{item.product_name}</strong></td>
                          <td>{item.quantity}</td>
                          <td>{currency}{Number(item.unit_buy_price).toFixed(2)}</td>
                          <td style={{ fontWeight: '700' }}>{currency}{Number(item.total_cost).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Payment Logs Ledger */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Dena Repayment History Ledger (টাকা ফেরতের হিসাব)</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Payment Date</th>
                      <th>Amount Paid</th>
                      <th>Account Paid From</th>
                      <th>Notes / Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!denaAuditData.payment_logs || denaAuditData.payment_logs.length === 0) ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                          No payments made against this Dena yet.
                        </td>
                      </tr>
                    ) : (
                      denaAuditData.payment_logs.map(log => (
                        <tr key={log.id}>
                          <td style={{ fontSize: '12px' }}>{new Date(log.payment_date).toLocaleString()}</td>
                          <td style={{ fontWeight: '700', color: 'var(--success)' }}>{currency}{Number(log.amount).toFixed(2)}</td>
                          <td><strong>{log.account_name || 'Cash Box'}</strong></td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{log.notes || 'Repayment'}</td>
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

      {/* 2. Pawna Audit History & Statement Modal */}
      {pawnaAuditData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '780px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Customer Pawna Statement & Audit Trail</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Party: {pawnaAuditData.receivable.party_name}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handlePrintStatement} className="btn btn-secondary btn-sm">
                  <Printer size={15} />
                  <span>Print Statement</span>
                </button>
                <button onClick={() => setPawnaAuditData(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
              </div>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px' }}>
                <div>Customer Name: <strong style={{ display: 'block', fontSize: '15px' }}>{pawnaAuditData.receivable.party_name}</strong></div>
                <div>Total Pawna: <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text-primary)' }}>{currency}{Number(pawnaAuditData.receivable.total_amount).toFixed(2)}</strong></div>
                <div>Collected: <strong style={{ display: 'block', fontSize: '15px', color: 'var(--success)' }}>{currency}{Number(pawnaAuditData.receivable.amount_collected).toFixed(2)}</strong></div>
                <div>Pending Pawna: <strong style={{ display: 'block', fontSize: '15px', color: 'var(--danger)' }}>{currency}{(Number(pawnaAuditData.receivable.total_amount) - Number(pawnaAuditData.receivable.amount_collected)).toFixed(2)}</strong></div>
              </div>

              {/* Sold Items Breakdown */}
              {pawnaAuditData.items && pawnaAuditData.items.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Sold Products Breakdown (বিক্রি হওয়া প্রোডাক্টের তালিকা)</h4>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Qty Sold</th>
                        <th>Unit Wholesale Price</th>
                        <th>Line Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pawnaAuditData.items.map((item, idx) => (
                        <tr key={idx}>
                          <td><strong>{item.product_name}</strong></td>
                          <td>{item.quantity}</td>
                          <td>{currency}{Number(item.unit_wholesale_price || item.unit_price).toFixed(2)}</td>
                          <td style={{ fontWeight: '700', color: 'var(--success)' }}>{currency}{Number(item.total_item_price || item.total_price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Collection Logs Ledger */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Pawna Collection History Ledger (টাকা আদায়ের হিসাব)</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Collection Date</th>
                      <th>Amount Collected</th>
                      <th>Account Deposited</th>
                      <th>Notes / Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!pawnaAuditData.collection_logs || pawnaAuditData.collection_logs.length === 0) ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                          No money collected against this Pawna yet.
                        </td>
                      </tr>
                    ) : (
                      pawnaAuditData.collection_logs.map(log => (
                        <tr key={log.id}>
                          <td style={{ fontSize: '12px' }}>{new Date(log.collection_date).toLocaleString()}</td>
                          <td style={{ fontWeight: '700', color: 'var(--success)' }}>{currency}{Number(log.amount).toFixed(2)}</td>
                          <td><strong>{log.account_name || 'Cash Box'}</strong></td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{log.notes || 'Collection'}</td>
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

      {/* 3. Account Passbook / Ledger Statement Modal */}
      {accountStatementData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{accountStatementData.account.name} Passbook Ledger</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Account #: {accountStatementData.account.account_number || 'Cash Box'}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handlePrintStatement} className="btn btn-secondary btn-sm">
                  <Printer size={15} />
                  <span>Print Passbook</span>
                </button>
                <button onClick={() => setAccountStatementData(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
              </div>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px' }}>
                <div>Account Name: <strong>{accountStatementData.account.name}</strong></div>
                <div>Account Type: <strong style={{ textTransform: 'uppercase' }}>{accountStatementData.account.account_type}</strong></div>
                <div>Current Liquid Balance: <strong style={{ fontSize: '18px', color: 'var(--success)' }}>{currency}{Number(accountStatementData.account.balance).toFixed(2)}</strong></div>
              </div>

              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Transaction Type</th>
                      <th>Description / Notes</th>
                      <th>Debit (-৳)</th>
                      <th>Credit (+৳)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountStatementData.transactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                          No transactions recorded for this account yet.
                        </td>
                      </tr>
                    ) : (
                      accountStatementData.transactions.map((tx, idx) => (
                        <tr key={idx}>
                          <td style={{ fontSize: '12px' }}>{new Date(tx.date).toLocaleString()}</td>
                          <td><span className="badge badge-info" style={{ fontSize: '10px' }}>{tx.type}</span></td>
                          <td style={{ fontSize: '12px' }}>{tx.notes}</td>
                          <td style={{ color: Number(tx.debit) > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: Number(tx.debit) > 0 ? '700' : 'normal' }}>
                            {Number(tx.debit) > 0 ? `-${currency}${Number(tx.debit).toFixed(2)}` : '-'}
                          </td>
                          <td style={{ color: Number(tx.credit) > 0 ? 'var(--success)' : 'var(--text-muted)', fontWeight: Number(tx.credit) > 0 ? '700' : 'normal' }}>
                            {Number(tx.credit) > 0 ? `+${currency}${Number(tx.credit).toFixed(2)}` : '-'}
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

      {/* 4. Investor Capital Audit Modal */}
      {investAuditData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Investor Capital Audit — {investAuditData.investment.investor_name}</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Phone: {investAuditData.investment.phone || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handlePrintStatement} className="btn btn-secondary btn-sm">
                  <Printer size={15} />
                  <span>Print Statement</span>
                </button>
                <button onClick={() => setInvestAuditData(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
              </div>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px' }}>
                <div>Total Invested: <strong style={{ display: 'block', fontSize: '16px', color: '#8b5cf6' }}>{currency}{Number(investAuditData.investment.invested_amount).toFixed(2)}</strong></div>
                <div>Capital Returned: <strong style={{ display: 'block', fontSize: '16px', color: 'var(--success)' }}>{currency}{Number(investAuditData.investment.returned_amount).toFixed(2)}</strong></div>
                <div>Net Outstanding: <strong style={{ display: 'block', fontSize: '16px', color: 'var(--accent-primary)' }}>{currency}{(Number(investAuditData.investment.invested_amount) - Number(investAuditData.investment.returned_amount)).toFixed(2)}</strong></div>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Capital Transaction History Ledger</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investAuditData.transactions.map((t, idx) => (
                      <tr key={idx}>
                        <td style={{ fontSize: '12px' }}>{new Date(t.transaction_date).toLocaleString()}</td>
                        <td>
                          <span className={`badge ${t.type === 'deposit' ? 'badge-success' : 'badge-warning'}`}>
                            {t.type.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontWeight: '700', color: t.type === 'deposit' ? 'var(--success)' : 'var(--danger)' }}>
                          {t.type === 'deposit' ? '+' : '-'}{currency}{Number(t.amount).toFixed(2)}
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Deposit Funds Modal */}
      {showDepositModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Direct Fund Deposit (ম্যানুয়াল ফান্ড জমা)</h3>
              <button onClick={() => setShowDepositModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleDepositSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Deposit Target Account</label>
                  <select
                    className="form-select"
                    required
                    value={depositForm.account_id}
                    onChange={(e) => setDepositForm({ ...depositForm, account_id: e.target.value })}
                  >
                    <option value="">Select Target Account...</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({currency}{a.balance})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Deposit Amount ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    required
                    placeholder="10000.00"
                    value={depositForm.amount}
                    onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Deposit Purpose / Source Title</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Owner Additional Capital, Cash Top-up, Service Fee..."
                    value={depositForm.source_title}
                    onChange={(e) => setDepositForm({ ...depositForm, source_title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Additional details..."
                    value={depositForm.notes}
                    onChange={(e) => setDepositForm({ ...depositForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowDepositModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-success">
                  <CheckCircle size={16} />
                  <span>Deposit Funds</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {showAccountModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Add Financial Account</h3>
              <button onClick={() => setShowAccountModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateAccount}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Account Name</label>
                  <input type="text" className="form-input" required placeholder="e.g. City Bank Corporate" value={accForm.name} onChange={(e) => setAccForm({ ...accForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Account Type</label>
                  <select className="form-select" value={accForm.account_type} onChange={(e) => setAccForm({ ...accForm, account_type: e.target.value })}>
                    <option value="bank">Bank Account</option>
                    <option value="bkash">bKash Mobile Banking</option>
                    <option value="nagad">Nagad Mobile Banking</option>
                    <option value="cash">Hand Cash</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Account / Phone #</label>
                  <input type="text" className="form-input" placeholder="017... or A/C 1102938" value={accForm.account_number} onChange={(e) => setAccForm({ ...accForm, account_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Balance ({currency})</label>
                  <input type="number" step="0.01" className="form-input" placeholder="0.00" value={accForm.initial_balance} onChange={(e) => setAccForm({ ...accForm, initial_balance: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAccountModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-success">Add Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fund Transfer Modal */}
      {showTransferModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Transfer Funds Between Accounts</h3>
              <button onClick={() => setShowTransferModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleTransfer}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">From Account (Source)</label>
                  <select className="form-select" required value={transferForm.from_account_id} onChange={(e) => setTransferForm({ ...transferForm, from_account_id: e.target.value })}>
                    <option value="">Select Source Account...</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({currency}{a.balance})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">To Account (Destination)</label>
                  <select className="form-select" required value={transferForm.to_account_id} onChange={(e) => setTransferForm({ ...transferForm, to_account_id: e.target.value })}>
                    <option value="">Select Destination Account...</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({currency}{a.balance})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Transfer Amount ({currency})</label>
                  <input type="number" step="0.01" className="form-input" required placeholder="5000.00" value={transferForm.amount} onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowTransferModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Execute Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Dena Modal */}
      {showDenaModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Record New Dena (Liability)</h3>
              <button onClick={() => setShowDenaModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateDena}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Title / Description</label>
                  <input type="text" className="form-input" required placeholder="e.g. Stock Restock Bill #102" value={denaForm.title} onChange={(e) => setDenaForm({ ...denaForm, title: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Select Registered Supplier (Optional)</label>
                  <select
                    className="form-select"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        setDenaForm({ ...denaForm, party_name: e.target.value });
                      }
                    }}
                  >
                    <option value="">Select Existing Supplier (or type manually below)...</option>
                    {suppliersList.map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.company_name || 'Supplier'})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Supplier / Party Name (Type or Auto-Filled)</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Star Tech Wholesale"
                    value={denaForm.party_name}
                    onChange={(e) => setDenaForm({ ...denaForm, party_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Total Dena Amount ({currency})</label>
                  <input type="number" step="0.01" className="form-input" required placeholder="12000.00" value={denaForm.total_amount} onChange={(e) => setDenaForm({ ...denaForm, total_amount: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowDenaModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-danger">Save Dena</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Pawna Modal */}
      {showPawnaModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Record New Pawna (Receivable)</h3>
              <button onClick={() => setShowPawnaModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreatePawna}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Title / Description</label>
                  <input type="text" className="form-input" required placeholder="e.g. Customer Credit Sale #402" value={pawnaForm.title} onChange={(e) => setPawnaForm({ ...pawnaForm, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer / Party Name</label>
                  <input type="text" className="form-input" required placeholder="e.g. Tanvir Ahmed" value={pawnaForm.party_name} onChange={(e) => setPawnaForm({ ...pawnaForm, party_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Pawna Amount ({currency})</label>
                  <input type="number" step="0.01" className="form-input" required placeholder="4500.00" value={pawnaForm.total_amount} onChange={(e) => setPawnaForm({ ...pawnaForm, total_amount: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowPawnaModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-success">Save Pawna</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Investment Modal */}
      {showInvestModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Record New Business Investment</h3>
              <button onClick={() => setShowInvestModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateInvestmentSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Investor Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Syed Kamrul Hasan"
                    value={investForm.investor_name}
                    onChange={(e) => setInvestForm({ ...investForm, investor_name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="01711000000"
                      value={investForm.phone}
                      onChange={(e) => setInvestForm({ ...investForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Invested Amount ({currency})</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      required
                      placeholder="100000.00"
                      value={investForm.invested_amount}
                      onChange={(e) => setInvestForm({ ...investForm, invested_amount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Deposit Investment Into Account</label>
                  <select
                    className="form-select"
                    required
                    value={investForm.account_id}
                    onChange={(e) => setInvestForm({ ...investForm, account_id: e.target.value })}
                  >
                    <option value="">Select Account...</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({currency}{a.balance})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Investment Terms / Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Equity share, return terms..."
                    value={investForm.notes}
                    onChange={(e) => setInvestForm({ ...investForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowInvestModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}>Save Investment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repay Investment Modal */}
      {showRepayInvestModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>Return Capital to {showRepayInvestModal.investor_name}</h3>
              <button onClick={() => setShowRepayInvestModal(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleRepayInvestmentSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Repayment Amount ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    required
                    value={repayInvestAmt}
                    onChange={(e) => setRepayInvestAmt(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Paid From Account</label>
                  <select
                    className="form-select"
                    required
                    value={repayInvestAccId}
                    onChange={(e) => setRepayInvestAccId(e.target.value)}
                  >
                    <option value="">Select Account...</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({currency}{a.balance})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Partial / Full capital repayment..."
                    value={repayInvestNotes}
                    onChange={(e) => setRepayInvestNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowRepayInvestModal(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-success">Process Repayment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Dena Modal */}
      {showPayDenaModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>Pay Dena to {showPayDenaModal.party_name}</h3>
              <button onClick={() => setShowPayDenaModal(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handlePayDenaSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Payment Amount ({currency})</label>
                  <input type="number" step="0.01" className="form-input" required value={payDenaAmt} onChange={(e) => setPayDenaAmt(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Paid From Account</label>
                  <select className="form-select" value={payDenaAccId} onChange={(e) => setPayDenaAccId(e.target.value)}>
                    <option value="">Select Account...</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({currency}{a.balance})</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowPayDenaModal(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Process Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Pawna Modal */}
      {showCollectPawnaModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>Collect Pawna from {showCollectPawnaModal.party_name}</h3>
              <button onClick={() => setShowCollectPawnaModal(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleCollectPawnaSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Collection Amount ({currency})</label>
                  <input type="number" step="0.01" className="form-input" required value={collectPawnaAmt} onChange={(e) => setCollectPawnaAmt(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Deposit into Account</label>
                  <select className="form-select" value={collectPawnaAccId} onChange={(e) => setCollectPawnaAccId(e.target.value)}>
                    <option value="">Select Account...</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({currency}{a.balance})</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCollectPawnaModal(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-success">Collect Money</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
