import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Landmark, Wallet, ArrowUpRight, ArrowDownRight, Plus, RefreshCw, DollarSign, Send, CheckCircle, UserCheck, ShieldAlert, X, TrendingUp, HandCoins, Eye, Printer, FileText, Calendar, Building2, Download, UserPlus, FileSpreadsheet } from 'lucide-react';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { ResponsiveSubTabs } from '../components/ResponsiveSubTabs';

const formatDateTimeBD = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString('en-US', {
      timeZone: 'Asia/Dhaka',
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch (e) {
    return new Date(dateStr).toLocaleString();
  }
};

const exportPassbookToExcel = (accountName, transactions) => {
  const headers = ["Date & Time (BD Time)", "Transaction Type", "Description / Notes", "Debit (-BDT)", "Credit (+BDT)"];
  const rows = transactions.map(tx => [
    `"${formatDateTimeBD(tx.date)}"`,
    `"${(tx.type || '').replace(/"/g, '""')}"`,
    `"${(tx.notes || '').replace(/"/g, '""')}"`,
    tx.debit ? Number(tx.debit).toFixed(2) : '0.00',
    tx.credit ? Number(tx.credit).toFixed(2) : '0.00'
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  const cleanName = (accountName || 'Account').replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute("download", `Passbook_${cleanName}_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const Finance = () => {
  const { authFetch, currency, tenant, refreshAllData, showToast } = useApp();
  const [activeSubTab, setActiveSubTab] = useState('accounts');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [financeData, setFinanceData] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [investmentData, setInvestmentData] = useState({ summary: {}, investments: [], transactions: [] });
  const [loading, setLoading] = useState(false);

  // Passbook Date & Category Filter States
  const [passbookDateFilter, setPassbookDateFilter] = useState('all');
  const [passbookCategoryFilter, setPassbookCategoryFilter] = useState('all');
  const [passbookStartDate, setPassbookStartDate] = useState('');
  const [passbookEndDate, setPassbookEndDate] = useState('');
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('profitway_finance_categories');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Modals
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showDenaModal, setShowDenaModal] = useState(false);
  const [showPawnaModal, setShowPawnaModal] = useState(false);
  const [showAddPawnaModal, setShowAddPawnaModal] = useState(false);
  const [showPayDenaModal, setShowPayDenaModal] = useState(null);
  const [showCollectPawnaModal, setShowCollectPawnaModal] = useState(null);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [showAddInvestorModal, setShowAddInvestorModal] = useState(false);
  const [showRepayInvestModal, setShowRepayInvestModal] = useState(null);

  // Audit History Modals
  const [denaAuditData, setDenaAuditData] = useState(null);
  const [pawnaAuditData, setPawnaAuditData] = useState(null);
  const [accountStatementData, setAccountStatementData] = useState(null);
  const [investAuditData, setInvestAuditData] = useState(null);
  const [denaReceiptModalData, setDenaReceiptModalData] = useState(null);

  // Form States
  const [accForm, setAccForm] = useState({ name: '', account_type: 'bank', account_number: '', initial_balance: '' });
  const [depositForm, setDepositForm] = useState({ account_id: '', amount: '', source_title: 'Manual Fund Deposit', notes: '' });
  const [transferForm, setTransferForm] = useState({ from_account_id: '', to_account_id: '', amount: '' });
  const [adjustForm, setAdjustForm] = useState({ account_id: '', adjustment_type: 'debit', amount: '', reason_title: 'Owner Personal Withdrawal', notes: '' });
  const [denaForm, setDenaForm] = useState({ title: '', party_type: 'supplier', party_name: '', total_amount: '', due_date: '', notes: '' });
  const [pawnaForm, setPawnaForm] = useState({ title: '', party_type: 'customer', party_name: '', total_amount: '', due_date: '', notes: '' });
  const [addPawnaForm, setAddPawnaForm] = useState({ title: '', party_type: 'customer', party_name: '', total_amount: '', due_date: '', notes: '' });
  const [payDenaAmt, setPayDenaAmt] = useState('');
  const [payDenaAccId, setPayDenaAccId] = useState('');
  const [collectPawnaAmt, setCollectPawnaAmt] = useState('');
  const [collectPawnaAccId, setCollectPawnaAccId] = useState('');

  // Investment Forms
  const [investForm, setInvestForm] = useState({ investor_name: '', phone: '', email: '', invested_amount: '', account_id: '', notes: '' });
  const [addInvestorForm, setAddInvestorForm] = useState({ investor_name: '', phone: '', email: '', invested_amount: '', account_id: '', notes: '' });
  const [repayInvestAmt, setRepayInvestAmt] = useState('');
  const [repayInvestAccId, setRepayInvestAccId] = useState('');
  const [repayInvestNotes, setRepayInvestNotes] = useState('');

  // Payroll / HR Integration States
  const [allEmployeesList, setAllEmployeesList] = useState([]);
  const [salarySheetData, setSalarySheetData] = useState([]);
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedPayrollAccId, setSelectedPayrollAccId] = useState('');
  const [payrollNotes, setPayrollNotes] = useState('');
  const [payType, setPayType] = useState('full'); // 'full' or 'partial'
  const [customPayAmount, setCustomPayAmount] = useState('');

  const fetchSalarySheetData = async (mYear) => {
    try {
      const validMonth = mYear && mYear.length >= 7 ? mYear.slice(0, 7) : new Date().toISOString().slice(0, 7);
      const res = await authFetch(`/api/staff/salary-sheet?month_year=${validMonth}`);
      const data = await res.json();
      if (res.ok) setSalarySheetData(data);
    } catch (e) { console.error(e); }
  };

  const fetchFinance = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/finance/summary');
      const data = await res.json();
      if (res.ok) setFinanceData(data);

      const empRes = await authFetch('/api/staff/employees');
      const empData = await empRes.json();
      if (empRes.ok) setAllEmployeesList(empData);

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

  useEffect(() => {
    if (activeSubTab === 'payroll') {
      fetchSalarySheetData(payrollMonth);
    }
  }, [activeSubTab, payrollMonth]);

  const handleOpenDenaAudit = async (denaItem) => {
    try {
      const sampleId = typeof denaItem === 'object' ? denaItem.sample_id : denaItem;
      const partyName = typeof denaItem === 'object' ? denaItem.party_name : '';
      const url = `/api/finance/liabilities/${sampleId}/audit?party_name=${encodeURIComponent(partyName)}`;
      const res = await authFetch(url);
      const data = await res.json();
      if (res.ok) setDenaAuditData(data);
    } catch (err) {
      alert(`Error fetching Dena history: ${err.message}`);
    }
  };

  const handleOpenPawnaAudit = async (pawnaItem) => {
    try {
      const sampleId = typeof pawnaItem === 'object' ? pawnaItem.sample_id : pawnaItem;
      const partyName = typeof pawnaItem === 'object' ? pawnaItem.party_name : '';
      const url = `/api/finance/receivables/${sampleId}/audit?party_name=${encodeURIComponent(partyName)}`;
      const res = await authFetch(url);
      const data = await res.json();
      if (res.ok) setPawnaAuditData(data);
    } catch (err) {
      alert(`Error fetching Pawna history: ${err.message}`);
    }
  };

  const handleOpenAccountStatement = async (accId) => {
    try {
      setPassbookDateFilter('all');
      setPassbookStartDate('');
      setPassbookEndDate('');
      const res = await authFetch(`/api/finance/accounts/${accId}/statement`);
      const data = await res.json();
      if (res.ok) setAccountStatementData(data);
    } catch (err) {
      alert(`Error fetching Account statement: ${err.message}`);
    }
  };

  const handleOpenInvestAudit = (investRecord) => {
    const investorName = investRecord.investor_name;
    const relatedLogs = (investmentData.transactions || []).filter(t => 
      (t.investor_name && t.investor_name.toLowerCase() === investorName.toLowerCase()) ||
      (investRecord.entries && investRecord.entries.some(e => e.id === t.investment_id)) ||
      (investRecord.sample_id && investRecord.sample_id === t.investment_id)
    );

    const deposits = relatedLogs.filter(t => t.type === 'deposit');
    const repayments = relatedLogs.filter(t => t.type === 'repayment');

    setInvestAuditData({
      investor_name: investorName,
      investment: investRecord,
      deposits,
      repayments,
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
    setShowDepositModal(false);
    try {
      const res = await authFetch('/api/finance/deposit', {
        method: 'POST',
        body: JSON.stringify(depositForm)
      });
      const data = await res.json();
      if (res.ok) {
        setDepositForm({ account_id: '', amount: '', source_title: 'Manual Fund Deposit', notes: '' });
        fetchFinance();
        showToast(data.message || 'Funds deposited into account successfully!', 'success');
      } else {
        showToast(`Error: ${data.error}`, 'error');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setShowTransferModal(false);
    try {
      const res = await authFetch('/api/finance/transfer', {
        method: 'POST',
        body: JSON.stringify(transferForm)
      });
      const data = await res.json();
      if (res.ok) {
        setTransferForm({ from_account_id: '', to_account_id: '', amount: '' });
        fetchFinance();
        showToast('Funds transferred successfully!', 'success');
      } else {
        showToast(`Error: ${data.error}`, 'error');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustForm.account_id || !adjustForm.amount) return;

    let finalReasonTitle = adjustForm.reason_title;
    if (adjustForm.reason_title === 'CUSTOM') {
      if (!adjustForm.custom_category || !adjustForm.custom_category.trim()) {
        return alert('Please enter a custom category name.');
      }
      finalReasonTitle = adjustForm.custom_category.trim();
      if (!customCategories.includes(finalReasonTitle)) {
        const updated = [...customCategories, finalReasonTitle];
        setCustomCategories(updated);
        try { localStorage.setItem('profitway_finance_categories', JSON.stringify(updated)); } catch (e) {}
      }
    }

    setShowAdjustModal(false);
    try {
      const res = await authFetch('/api/finance/adjust', {
        method: 'POST',
        body: JSON.stringify({
          ...adjustForm,
          reason_title: finalReasonTitle
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAdjustForm({ account_id: '', adjustment_type: 'debit', amount: '', reason_title: 'Owner Personal Cash Draw / Withdrawal', custom_category: '', notes: '' });
        fetchFinance();
        showToast(data.message || 'Account balance adjusted successfully!', 'success');
      } else {
        showToast(`Error: ${data.error}`, 'error');
      }
    } catch (err) {
      showToast(`Error adjusting balance: ${err.message}`, 'error');
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
      const data = await res.json();
      if (res.ok) {
        setShowPawnaModal(false);
        setPawnaForm({ title: '', party_type: 'customer', party_name: '', total_amount: '', due_date: '', notes: '', created_at: new Date().toISOString().slice(0, 10), account_id: '' });
        fetchFinance();
        refreshAllData();
        alert(data.message || 'Pawna (Receivable) record created!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddPawnaProfileSubmit = async (e) => {
    e.preventDefault();
    if (!addPawnaForm.party_name) return;
    try {
      const res = await authFetch('/api/finance/receivables', {
        method: 'POST',
        body: JSON.stringify({
          ...addPawnaForm,
          title: addPawnaForm.title || `Pawna Profile: ${addPawnaForm.party_name}`
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddPawnaModal(false);
        setAddPawnaForm({ title: '', party_type: 'customer', party_name: '', total_amount: '', due_date: '', notes: '' });
        fetchFinance();
        refreshAllData();
        alert(data.message || `Pawna Profile created for "${addPawnaForm.party_name}"!`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error creating Pawna profile: ${err.message}`);
    }
  };

  const handlePayDenaSubmit = async (e) => {
    e.preventDefault();
    if (!showPayDenaModal) return;
    try {
      const res = await authFetch(`/api/finance/liabilities/${showPayDenaModal.sample_id || showPayDenaModal.id}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          payment_amount: payDenaAmt,
          account_id: payDenaAccId,
          party_name: showPayDenaModal.party_name
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowPayDenaModal(null);
        setPayDenaAmt('');
        setPayDenaAccId('');
        fetchFinance();
        if (data.receipt) {
          setDenaReceiptModalData(data.receipt);
        } else {
          alert(data.message || 'Dena payment recorded & account balance updated!');
        }
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCollectPawnaSubmit = async (e) => {
    e.preventDefault();
    if (!showCollectPawnaModal) return;
    try {
      const res = await authFetch(`/api/finance/receivables/${showCollectPawnaModal.sample_id || showCollectPawnaModal.id}/collect`, {
        method: 'POST',
        body: JSON.stringify({
          collection_amount: collectPawnaAmt,
          account_id: collectPawnaAccId,
          party_name: showCollectPawnaModal.party_name
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowCollectPawnaModal(null);
        setCollectPawnaAmt('');
        setCollectPawnaAccId('');
        fetchFinance();
        alert(data.message || 'Pawna collection recorded & account balance updated!');
      } else {
        alert(`Error: ${data.error}`);
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
        alert(data.message || 'New investment capital recorded!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddInvestorSubmit = async (e) => {
    e.preventDefault();
    if (!addInvestorForm.investor_name) return;
    try {
      const res = await authFetch('/api/investments', {
        method: 'POST',
        body: JSON.stringify(addInvestorForm)
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddInvestorModal(false);
        setAddInvestorForm({ investor_name: '', phone: '', email: '', invested_amount: '', account_id: '', notes: '' });
        fetchFinance();
        alert(data.message || `Investor Profile "${addInvestorForm.investor_name}" created successfully!`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error creating investor profile: ${err.message}`);
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
    if (!selectedStaffId) return alert('Please select a staff employee.');
    if (!selectedPayrollAccId) return alert('Please select a payment account.');

    let empData = salarySheetData.find(s => String(s.employee_id) === String(selectedStaffId));
    if (!empData) {
      const fallbackEmp = allEmployeesList.find(x => String(x.id) === String(selectedStaffId));
      if (fallbackEmp) {
        const baseSal = Number(fallbackEmp.base_salary || 0);
        empData = {
          employee_id: fallbackEmp.id,
          employee_code: fallbackEmp.employee_code,
          name: fallbackEmp.name,
          designation: fallbackEmp.designation,
          base_salary: baseSal,
          bonus_amount: 0,
          overtime_pay: 0,
          absent_penalty: 0,
          loan_deduction: 0,
          pf_deduction: 0,
          net_payable: baseSal,
          total_paid: 0,
          due_amount: baseSal,
          is_paid: false
        };
      }
    }

    if (!empData) return alert('Employee salary details not found.');
    if (empData.is_paid) return alert('Salary for this staff is already fully disbursed for this month!');

    const dueVal = empData.due_amount !== undefined ? empData.due_amount : empData.net_payable;
    const amountToPay = payType === 'partial' ? Number(customPayAmount || 0) : dueVal;

    if (amountToPay <= 0) return alert('Please enter a valid payment amount greater than 0.');
    if (amountToPay > dueVal + 0.05) return alert(`Payment amount (৳${amountToPay.toFixed(2)}) cannot exceed current due salary (৳${dueVal.toFixed(2)}).`);

    try {
      const payload = {
        employee_id: empData.employee_id,
        month_year: payrollMonth,
        base_salary: empData.base_salary,
        bonus: empData.bonus_amount || 0,
        overtime_pay: empData.overtime_pay || 0,
        absent_penalty: empData.absent_penalty || 0,
        loan_deduction: empData.loan_deduction || 0,
        pf_deduction: empData.pf_deduction || 0,
        net_payable: empData.net_payable,
        paid_amount: amountToPay,
        account_id: selectedPayrollAccId,
        notes: payrollNotes
      };

      const res = await authFetch('/api/staff/salary-sheet/disburse', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedStaffId('');
        setCustomPayAmount('');
        setPayType('full');
        setPayrollNotes('');
        fetchSalarySheetData(payrollMonth);
        fetchFinance();
        refreshAllData();
        alert(data.message || 'Staff salary disbursement logged successfully!');
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

          <button
            onClick={() => {
              setAdjustForm({
                account_id: (accounts && accounts.length > 0) ? accounts[0].id : '',
                adjustment_type: 'debit',
                amount: '',
                reason_title: 'Owner Personal Withdrawal',
                notes: ''
              });
              setShowAdjustModal(true);
            }}
            className="btn btn-secondary btn-sm"
            style={{ background: 'var(--bg-secondary)', borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--danger)', fontWeight: '700' }}
            title="Withdraw funds, pay suppliers or send money directly from financial accounts"
          >
            <ArrowDownRight size={15} />
            <span>💸 Pay / Withdraw Money (উত্তোলন / খরচ)</span>
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
      <ResponsiveSubTabs
        tabs={[
          { id: 'accounts', label: `Cash & Bank Accounts (${accounts.length})`, icon: Wallet },
          { id: 'pawna', label: 'Pawna (পাওনা / Dues)', icon: ArrowUpRight },
          { id: 'dena', label: 'Dena (দেনা / Payables)', icon: ArrowDownRight },
          { id: 'investments', label: 'Investments (বিনিয়োগ খাত)', icon: HandCoins },
          { id: 'payroll', label: 'Staff Salary & Payroll', icon: Landmark }
        ]}
        activeTab={activeSubTab}
        onSelectTab={setActiveSubTab}
      />

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

              <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setDepositForm({ account_id: acc.id, amount: '', source_title: 'Manual Fund Deposit', notes: '' });
                    setShowDepositModal(true);
                  }}
                  className="btn btn-success btn-sm"
                  style={{ flex: 1 }}
                  title="Deposit Funds into this account"
                >
                  <Plus size={14} />
                  <span>+ Deposit</span>
                </button>

                <button
                  onClick={() => {
                    setAdjustForm({ account_id: acc.id, adjustment_type: 'debit', amount: '', reason_title: 'Owner Personal Withdrawal', notes: '' });
                    setShowAdjustModal(true);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', fontWeight: '700' }}
                  title="Withdraw or pay funds directly from this account"
                >
                  <ArrowDownRight size={14} />
                  <span>💸 Pay / Withdraw</span>
                </button>

                <button onClick={() => handleOpenAccountStatement(acc.id)} className="btn btn-secondary btn-sm" style={{ flex: 1 }} title="View Passbook Ledger">
                  <FileText size={14} />
                  <span>Passbook</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Pawna / Receivables Section */}
      {activeSubTab === 'pawna' && (() => {
        // Group Pawna receivables by Customer / Party Name
        const groupedReceivablesMap = new Map();
        receivables.forEach(r => {
          const partyKey = (r.party_name || 'Walk-in Customer').trim();
          if (!groupedReceivablesMap.has(partyKey)) {
            groupedReceivablesMap.set(partyKey, {
              party_name: partyKey,
              party_type: r.party_type || 'customer',
              total_amount: 0,
              amount_collected: 0,
              pending_pawna: 0,
              entries: [],
              latest_date: r.created_at || r.due_date,
              sample_id: r.id
            });
          }
          const partyObj = groupedReceivablesMap.get(partyKey);
          const total = Number(r.total_amount || 0);
          const collected = Number(r.amount_collected || 0);

          partyObj.total_amount += total;
          partyObj.amount_collected += collected;
          partyObj.entries.push(r);
          if (new Date(r.created_at) > new Date(partyObj.latest_date)) {
            partyObj.latest_date = r.created_at;
          }
        });

        const consolidatedReceivables = Array.from(groupedReceivablesMap.values()).map(p => ({
          ...p,
          pending_pawna: Math.max(0, p.total_amount - p.amount_collected)
        }));

        return (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Customer & Personal Pawna Dues (পাওনা খাত)</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Consolidated by Customer / Borrower Name. Click History to view complete Pawna addition & collection ledger.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    setAddPawnaForm({ title: '', party_type: 'customer', party_name: '', total_amount: '', due_date: '', notes: '' });
                    setShowAddPawnaModal(true);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ background: 'var(--bg-secondary)', borderColor: '#10b981', color: '#10b981' }}
                >
                  <UserPlus size={15} />
                  <span>+ Add Pawna Profile</span>
                </button>

                <button onClick={() => setShowPawnaModal(true)} className="btn btn-success btn-sm">
                  <Plus size={15} />
                  <span>+ Record New Pawna</span>
                </button>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer / Person Name</th>
                    <th>Type</th>
                    <th>Total Pawna Due</th>
                    <th>Total Collected</th>
                    <th>Pending Pawna</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidatedReceivables.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No Pawna (Receivable) records found.
                      </td>
                    </tr>
                  ) : (
                    consolidatedReceivables.map((r, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{r.party_name}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {r.entries.length} Pawna Record{r.entries.length > 1 ? 's' : ''} (Wholesale / Dhar)
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.party_type}</span>
                        </td>
                        <td style={{ fontWeight: '600' }}>{currency}{r.total_amount.toFixed(2)}</td>
                        <td style={{ color: 'var(--success)' }}>{currency}{r.amount_collected.toFixed(2)}</td>
                        <td style={{ fontWeight: '700', color: r.pending_pawna > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {currency}{r.pending_pawna.toFixed(2)}
                        </td>
                        <td>
                          <span className={`badge ${r.pending_pawna === 0 ? 'badge-success' : 'badge-warning'}`}>
                            {r.pending_pawna === 0 ? 'COLLECTED' : 'PENDING'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleOpenPawnaAudit(r)} className="btn btn-secondary btn-sm" title="View Full History Statement">
                              <Eye size={14} />
                              <span>History</span>
                            </button>

                            <button
                              onClick={() => {
                                setPawnaForm({
                                  title: `Dhar/Due given to ${r.party_name}`,
                                  party_type: r.party_type || 'customer',
                                  party_name: r.party_name,
                                  total_amount: '',
                                  due_date: '',
                                  notes: ''
                                });
                                setShowPawnaModal(true);
                              }}
                              className="btn btn-success btn-sm"
                              title="Add Extra Pawna / Dhar for this person"
                            >
                              <Plus size={14} />
                              <span>+ Add Pawna</span>
                            </button>

                            {r.pending_pawna > 0 && (
                              <button onClick={() => { setShowCollectPawnaModal(r); setCollectPawnaAmt(r.pending_pawna); }} className="btn btn-success btn-sm">
                                Collect Money
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* 3. Dena / Liabilities Section */}
      {activeSubTab === 'dena' && (() => {
        // Group Dena liabilities by Supplier / Party Name
        const groupedLiabilitiesMap = new Map();
        liabilities.forEach(l => {
          const partyKey = (l.party_name || 'General Supplier').trim();
          if (!groupedLiabilitiesMap.has(partyKey)) {
            groupedLiabilitiesMap.set(partyKey, {
              party_name: partyKey,
              party_type: l.party_type || 'supplier',
              total_amount: 0,
              amount_paid: 0,
              pending_dena: 0,
              entries: [],
              latest_date: l.created_at || l.due_date,
              sample_id: l.id
            });
          }
          const partyObj = groupedLiabilitiesMap.get(partyKey);
          const total = Number(l.total_amount || 0);
          const paid = Number(l.amount_paid || 0);

          partyObj.total_amount += total;
          partyObj.amount_paid += paid;
          partyObj.entries.push(l);
          if (new Date(l.created_at) > new Date(partyObj.latest_date)) {
            partyObj.latest_date = l.created_at;
          }
        });

        const consolidatedLiabilities = Array.from(groupedLiabilitiesMap.values()).map(p => ({
          ...p,
          pending_dena: Math.max(0, p.total_amount - p.amount_paid)
        }));

        return (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Supplier & Vendor Dena Liabilities (দেনা খাত)</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Consolidated by Supplier / Party Name. Click History to view complete addition & payment ledger.
                </p>
              </div>
              <button onClick={() => setShowDenaModal(true)} className="btn btn-danger btn-sm">
                <Plus size={15} />
                <span>+ Record New Dena</span>
              </button>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Supplier / Party Name</th>
                    <th>Type</th>
                    <th>Total Dena</th>
                    <th>Total Paid</th>
                    <th>Pending Dena</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidatedLiabilities.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No Dena (Liability) records found.
                      </td>
                    </tr>
                  ) : (
                    consolidatedLiabilities.map((l, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{l.party_name}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {l.entries.length} Dena Bill{l.entries.length > 1 ? 's' : ''} Record
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{l.party_type}</span>
                        </td>
                        <td style={{ fontWeight: '600' }}>{currency}{l.total_amount.toFixed(2)}</td>
                        <td style={{ color: 'var(--success)' }}>{currency}{l.amount_paid.toFixed(2)}</td>
                        <td style={{ fontWeight: '700', color: l.pending_dena > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {currency}{l.pending_dena.toFixed(2)}
                        </td>
                        <td>
                          <span className={`badge ${l.pending_dena === 0 ? 'badge-success' : 'badge-danger'}`}>
                            {l.pending_dena === 0 ? 'PAID' : 'PENDING'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleOpenDenaAudit(l)} className="btn btn-secondary btn-sm" title="View Full Detailed History Statement">
                              <Eye size={14} />
                              <span>History</span>
                            </button>
                            {l.pending_dena > 0 && (
                              <button onClick={() => { setShowPayDenaModal(l); setPayDenaAmt(l.pending_dena); }} className="btn btn-primary btn-sm">
                                Pay Dena
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* 4. Business Investment Section */}
      {activeSubTab === 'investments' && (() => {
        // Group Investments by Investor Name
        const groupedInvestmentsMap = new Map();
        investments.forEach(inv => {
          const invKey = (inv.investor_name || 'General Investor').trim();
          if (!groupedInvestmentsMap.has(invKey)) {
            groupedInvestmentsMap.set(invKey, {
              investor_name: invKey,
              phone: inv.phone || '',
              email: inv.email || '',
              invested_amount: 0,
              returned_amount: 0,
              active_capital: 0,
              entries: [],
              latest_date: inv.created_at,
              sample_id: inv.id
            });
          }
          const invObj = groupedInvestmentsMap.get(invKey);
          const invested = Number(inv.invested_amount || 0);
          const returned = Number(inv.returned_amount || 0);
          invObj.invested_amount += invested;
          invObj.returned_amount += returned;
          invObj.active_capital += Math.max(0, invested - returned);
          if (inv.phone && !invObj.phone) invObj.phone = inv.phone;
          if (inv.email && !invObj.email) invObj.email = inv.email;
          invObj.entries.push(inv);
        });

        const consolidatedInvestments = Array.from(groupedInvestmentsMap.values());

        return (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Business Investments & Investor Capital (বিনিয়োগ খাত)</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Consolidated by Investor Profile. Click History to view complete investment deposit & return ledger.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    setAddInvestorForm({ investor_name: '', phone: '', email: '', invested_amount: '', account_id: '', notes: '' });
                    setShowAddInvestorModal(true);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ background: 'var(--bg-secondary)', borderColor: '#8b5cf6', color: '#8b5cf6' }}
                >
                  <UserPlus size={15} />
                  <span>+ Add Investor Profile</span>
                </button>

                <button onClick={() => setShowInvestModal(true)} className="btn btn-primary btn-sm" style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}>
                  <Plus size={15} />
                  <span>+ Record New Investment</span>
                </button>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Investor Profile Name</th>
                    <th>Contact Info</th>
                    <th>Total Invested</th>
                    <th>Returned Capital</th>
                    <th>Net Active Capital</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidatedInvestments.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No business investments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    consolidatedInvestments.map((inv, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{inv.investor_name}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {inv.entries.length} Capital Deposit{inv.entries.length > 1 ? 's' : ''}
                          </div>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <div>{inv.phone || 'N/A'}</div>
                          <div>{inv.email || ''}</div>
                        </td>
                        <td style={{ fontWeight: '700', color: '#8b5cf6' }}>{currency}{inv.invested_amount.toFixed(2)}</td>
                        <td style={{ color: 'var(--success)' }}>{currency}{inv.returned_amount.toFixed(2)}</td>
                        <td style={{ fontWeight: '800', color: inv.active_capital > 0 ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                          {currency}{inv.active_capital.toFixed(2)}
                        </td>
                        <td>
                          <span className={`badge ${inv.active_capital <= 0 ? 'badge-success' : 'badge-warning'}`}>
                            {inv.active_capital <= 0 ? 'RETURNED' : 'ACTIVE'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleOpenInvestAudit(inv)} className="btn btn-secondary btn-sm" title="View Investment Statement">
                              <Eye size={14} />
                              <span>History</span>
                            </button>

                            <button
                              onClick={() => {
                                setInvestForm({
                                  investor_name: inv.investor_name,
                                  phone: inv.phone || '',
                                  email: inv.email || '',
                                  invested_amount: '',
                                  account_id: (accounts && accounts.length > 0) ? accounts[0].id : '',
                                  notes: ''
                                });
                                setShowInvestModal(true);
                              }}
                              className="btn btn-primary btn-sm"
                              style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}
                              title="Add Investment for this Investor"
                            >
                              <Plus size={14} />
                              <span>+ Add Invest</span>
                            </button>

                            <button
                              onClick={() => {
                                setShowRepayInvestModal({ ...inv, id: inv.sample_id });
                                setRepayInvestAmt(inv.active_capital > 0 ? inv.active_capital : '');
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                              title="Return Capital / Repay Investor"
                            >
                              <ArrowDownRight size={14} />
                              <span>Return Capital</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* 5. Staff Salary & Payroll Section (Master HR OS Sync with Fallback) */}
      {activeSubTab === 'payroll' && (() => {
        const sheetMap = new Map();
        (salarySheetData || []).forEach(s => sheetMap.set(String(s.employee_id), s));

        (allEmployeesList || []).forEach(emp => {
          if (!sheetMap.has(String(emp.id))) {
            const baseSal = Number(emp.base_salary || 0);
            sheetMap.set(String(emp.id), {
              employee_id: emp.id,
              employee_code: emp.employee_code,
              name: emp.name,
              designation: emp.designation,
              phone: emp.phone,
              base_salary: baseSal,
              present_days: 0,
              absent_days: 0,
              overtime_hours: 0,
              overtime_pay: 0,
              absent_penalty: 0,
              bonus_amount: 0,
              loan_deduction: 0,
              pf_deduction: 0,
              net_payable: baseSal,
              total_paid: 0,
              due_amount: baseSal,
              status: 'pending',
              is_paid: false
            });
          }
        });

        const effectiveSalarySheet = Array.from(sheetMap.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        return (
          <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '20px' }}>
            {/* Disburse Salary Form */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Disburse Staff Salary</h3>
                <span className="badge badge-success" style={{ fontSize: '10px' }}>⚡ HR OS Synced</span>
              </div>

              <form onSubmit={handlePaySalarySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Month & Year *</label>
                  <input
                    type="month"
                    className="form-input"
                    required
                    value={payrollMonth}
                    onChange={(e) => {
                      setPayrollMonth(e.target.value);
                      setSelectedStaffId('');
                      setCustomPayAmount('');
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Select Staff Employee *</label>
                  <select
                    className="form-select"
                    required
                    value={selectedStaffId}
                    onChange={(e) => {
                      setSelectedStaffId(e.target.value);
                      const emp = effectiveSalarySheet.find(s => String(s.employee_id) === e.target.value);
                      if (emp) {
                        const due = emp.due_amount !== undefined ? emp.due_amount : emp.net_payable;
                        setCustomPayAmount(due > 0 ? String(due) : '');
                      }
                      setPayType('full');
                    }}
                  >
                    <option value="">Choose Staff...</option>
                    {effectiveSalarySheet.map(s => {
                      const due = s.due_amount !== undefined ? s.due_amount : s.net_payable;
                      let labelStatus = `Net: ${currency}${s.net_payable.toFixed(2)}`;
                      if (s.status === 'paid' || s.is_paid) labelStatus = '🟢 FULL PAID';
                      else if (s.status === 'partial') labelStatus = `🟠 PARTIAL (Due: ${currency}${due.toFixed(2)})`;

                      return (
                        <option key={s.employee_id} value={s.employee_id}>
                          {s.name} ({s.designation}) — {labelStatus}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Selected Employee Salary Breakdown */}
                {(() => {
                  const activeEmp = effectiveSalarySheet.find(s => String(s.employee_id) === String(selectedStaffId));
                  if (!activeEmp) return null;

                  const dueVal = activeEmp.due_amount !== undefined ? activeEmp.due_amount : activeEmp.net_payable;
                  const paidSoFar = activeEmp.total_paid || 0;

                  return (
                    <div style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Base Salary:</span>
                        <strong>{currency}{activeEmp.base_salary.toFixed(2)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Overtime Pay ({activeEmp.overtime_hours || 0}h):</span>
                        <span style={{ color: 'var(--success)' }}>+{currency}{(activeEmp.overtime_pay || 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Bonus & Allowances:</span>
                        <span style={{ color: '#8b5cf6' }}>+{currency}{(activeEmp.bonus_amount || 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Absent Cut ({activeEmp.absent_days || 0}d):</span>
                        <span style={{ color: 'var(--danger)' }}>-{currency}{(activeEmp.absent_penalty || 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Loan / Advance Cut:</span>
                        <span style={{ color: 'var(--danger)' }}>-{currency}{(activeEmp.loan_deduction || 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Provident Fund (PF):</span>
                        <span style={{ color: 'var(--danger)' }}>-{currency}{(activeEmp.pf_deduction || 0).toFixed(2)}</span>
                      </div>
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700' }}>
                        <span>Net Salary Payable:</span>
                        <span>{currency}{activeEmp.net_payable.toFixed(2)}</span>
                      </div>

                      {paidSoFar > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', fontSize: '13px' }}>
                          <span>Paid So Far:</span>
                          <strong>+{currency}{paidSoFar.toFixed(2)}</strong>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: dueVal > 0 ? 'var(--danger)' : 'var(--success)', fontSize: '15px', fontWeight: '800' }}>
                        <span>Current Salary Due:</span>
                        <span>{currency}{dueVal.toFixed(2)}</span>
                      </div>

                      {activeEmp.is_paid && (
                        <div style={{ color: 'var(--success)', fontSize: '12px', fontWeight: 'bold', textAlign: 'center', marginTop: '4px' }}>
                          ✓ Salary 100% Fully Disbursed for {payrollMonth}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Payment Type Selection */}
                {(() => {
                  const activeEmp = effectiveSalarySheet.find(s => String(s.employee_id) === String(selectedStaffId));
                  if (!activeEmp || activeEmp.is_paid) return null;
                  const dueVal = activeEmp.due_amount !== undefined ? activeEmp.due_amount : activeEmp.net_payable;

                  return (
                    <>
                      <div className="form-group">
                        <label className="form-label">Payment Mode *</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <button
                            type="button"
                            className={`btn btn-sm ${payType === 'full' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => {
                              setPayType('full');
                              setCustomPayAmount(String(dueVal));
                            }}
                          >
                            Full ({currency}{dueVal.toFixed(2)})
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${payType === 'partial' ? 'btn-warning' : 'btn-secondary'}`}
                            style={payType === 'partial' ? { background: '#f59e0b', color: '#fff', borderColor: '#f59e0b' } : {}}
                            onClick={() => {
                              setPayType('partial');
                              setCustomPayAmount(customPayAmount || String(dueVal));
                            }}
                          >
                            ⚡ Partial Pay (আংশিক)
                          </button>
                        </div>
                      </div>

                      {payType === 'partial' && (
                        <div className="form-group">
                          <label className="form-label">Paying Amount ({currency}) *</label>
                          <input
                            type="number"
                            step="0.01"
                            max={dueVal}
                            className="form-input"
                            required
                            placeholder="e.g. 5000"
                            value={customPayAmount}
                            onChange={(e) => setCustomPayAmount(e.target.value)}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            * পরিশোধের পর বাকি থাকবে: <strong style={{ color: 'var(--danger)' }}>{currency}{Math.max(0, dueVal - Number(customPayAmount || 0)).toFixed(2)}</strong>
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}

                <div className="form-group">
                  <label className="form-label">Paid From Finance Account *</label>
                  <select
                    className="form-select"
                    required
                    value={selectedPayrollAccId}
                    onChange={(e) => setSelectedPayrollAccId(e.target.value)}
                  >
                    <option value="">Select Account (Passbook)...</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({currency}{Number(a.balance).toFixed(2)})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes / Payment Ref</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Disbursed via Bank Transfer"
                    value={payrollNotes}
                    onChange={(e) => setPayrollNotes(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-success"
                  style={{ marginTop: '8px' }}
                  disabled={(() => {
                    const activeEmp = effectiveSalarySheet.find(s => String(s.employee_id) === String(selectedStaffId));
                    return !activeEmp || activeEmp.is_paid;
                  })()}
                >
                  <CheckCircle size={16} />
                  <span>
                    {payType === 'partial' ? 'Disburse Partial Salary' : 'Disburse & Log Salary'}
                  </span>
                </button>
              </form>
            </div>

            {/* Master Salary Sheet & Disbursal History Table */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Master Salary Sheet ({payrollMonth})</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Live monthly attendance, bonus, loan, PF & partial payment ledger</span>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Staff Employee</th>
                      <th>Base Salary</th>
                      <th>Bonus / OT</th>
                      <th>Deductions</th>
                      <th>Net Payable</th>
                      <th>Paid / Due</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {effectiveSalarySheet.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                          No staff records found in system. Please add employees in Staff & HR OS first.
                        </td>
                      </tr>
                    ) : (
                      effectiveSalarySheet.map(item => {
                        const totalAdditions = (item.overtime_pay || 0) + (item.bonus_amount || 0);
                        const totalDeductions = (item.absent_penalty || 0) + (item.loan_deduction || 0) + (item.pf_deduction || 0);
                        const paid = item.total_paid || 0;
                        const due = item.due_amount !== undefined ? item.due_amount : item.net_payable;

                        return (
                          <tr key={item.employee_id}>
                            <td>
                              <strong>{item.name}</strong>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.designation} ({item.employee_code})</div>
                            </td>
                            <td style={{ fontWeight: '600' }}>{currency}{item.base_salary.toFixed(2)}</td>
                            <td style={{ color: 'var(--success)' }}>+{currency}{totalAdditions.toFixed(2)}</td>
                            <td style={{ color: 'var(--danger)' }}>-{currency}{totalDeductions.toFixed(2)}</td>
                            <td style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '15px' }}>
                              {currency}{item.net_payable.toFixed(2)}
                            </td>
                            <td style={{ fontSize: '12px' }}>
                              <div style={{ color: 'var(--success)', fontWeight: '700' }}>Paid: {currency}{paid.toFixed(2)}</div>
                              <div style={{ color: due > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>Due: {currency}{due.toFixed(2)}</div>
                            </td>
                            <td>
                              {item.status === 'paid' || item.is_paid ? (
                                <span className="badge badge-success">🟢 Full Paid</span>
                              ) : item.status === 'partial' ? (
                                <span className="badge badge-warning" style={{ background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b50' }}>
                                  🟠 Partial Paid
                                </span>
                              ) : (
                                <span className="badge badge-warning">🟡 Pending</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- AUDIT HISTORY & STATEMENT PRINT MODALS --- */}

      {/* 1. Dena Audit History & Statement Modal */}
      {denaAuditData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>
                  Supplier Dena Statement & Audit Trail — {denaAuditData.party_name}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Consolidated Ledger for {denaAuditData.party_name}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handlePrintStatement} className="btn btn-secondary btn-sm">
                  <Printer size={15} />
                  <span>Print Statement</span>
                </button>
                <button onClick={() => setDenaAuditData(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
              </div>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Summary Banner */}
              {(() => {
                const totalDena = (denaAuditData.liabilities || [denaAuditData.liability]).reduce((sum, l) => sum + Number(l.total_amount || 0), 0);
                const totalPaid = (denaAuditData.liabilities || [denaAuditData.liability]).reduce((sum, l) => sum + Number(l.amount_paid || 0), 0);
                const pendingDena = Math.max(0, totalDena - totalPaid);
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px' }}>
                    <div>Supplier Name: <strong style={{ display: 'block', fontSize: '15px' }}>{denaAuditData.party_name}</strong></div>
                    <div>Total Dena Added: <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text-primary)' }}>{currency}{totalDena.toFixed(2)}</strong></div>
                    <div>Total Paid Amount: <strong style={{ display: 'block', fontSize: '15px', color: 'var(--success)' }}>{currency}{totalPaid.toFixed(2)}</strong></div>
                    <div>Pending Dena Due: <strong style={{ display: 'block', fontSize: '15px', color: 'var(--danger)' }}>{currency}{pendingDena.toFixed(2)}</strong></div>
                  </div>
                );
              })()}

              {/* 1. Dena Addition History */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: 'var(--accent-primary)' }}>
                  📌 Dena Addition History (কখন কত টাকা দেনা যোগ হয়েছে)
                </h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date Added</th>
                      <th>Title / Order Description</th>
                      <th>Total Dena</th>
                      <th>Paid</th>
                      <th>Pending</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!denaAuditData.liabilities || denaAuditData.liabilities.length === 0) ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                          No Dena records found.
                        </td>
                      </tr>
                    ) : (
                      denaAuditData.liabilities.map((l, idx) => {
                        const pending = Number(l.total_amount) - Number(l.amount_paid);
                        return (
                          <tr key={idx}>
                            <td style={{ fontSize: '12px' }}>{formatDateTimeBD(l.created_at || l.due_date)}</td>
                            <td>
                              <strong>{l.title}</strong>
                              {l.notes && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.notes}</div>}
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
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* 2. Dena Repayment History */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: 'var(--success)' }}>
                  💳 Dena Repayment History (কখন কত টাকা পরিশোধ/Pay করা হয়েছে)
                </h4>
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
                          No repayments recorded against this supplier yet.
                        </td>
                      </tr>
                    ) : (
                      denaAuditData.payment_logs.map(log => (
                        <tr key={log.id}>
                          <td style={{ fontSize: '12px' }}>{formatDateTimeBD(log.payment_date)}</td>
                          <td style={{ fontWeight: '700', color: 'var(--success)' }}>{currency}{Number(log.amount).toFixed(2)}</td>
                          <td><strong>{log.account_name || 'Cash Box'}</strong></td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{log.notes || 'Dena Repayment'}</td>
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
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Customer Pawna Statement & Audit Trail — {pawnaAuditData.party_name}</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Consolidated Ledger for {pawnaAuditData.party_name}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handlePrintStatement} className="btn btn-secondary btn-sm">
                  <Printer size={15} />
                  <span>Print Statement</span>
                </button>
                <button onClick={() => setPawnaAuditData(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
              </div>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Summary Banner */}
              {(() => {
                const recList = pawnaAuditData.receivables || [pawnaAuditData.receivable];
                const totalPawna = recList.reduce((sum, r) => sum + Number(r.total_amount || 0), 0);
                const totalCollected = recList.reduce((sum, r) => sum + Number(r.amount_collected || 0), 0);
                const pendingPawna = Math.max(0, totalPawna - totalCollected);
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px' }}>
                    <div>Customer / Person Name: <strong style={{ display: 'block', fontSize: '15px' }}>{pawnaAuditData.party_name}</strong></div>
                    <div>Total Pawna Added: <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text-primary)' }}>{currency}{totalPawna.toFixed(2)}</strong></div>
                    <div>Total Amount Collected: <strong style={{ display: 'block', fontSize: '15px', color: 'var(--success)' }}>{currency}{totalCollected.toFixed(2)}</strong></div>
                    <div>Pending Pawna Dues: <strong style={{ display: 'block', fontSize: '15px', color: 'var(--danger)' }}>{currency}{pendingPawna.toFixed(2)}</strong></div>
                  </div>
                );
              })()}

              {/* 1. Pawna Addition History */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: 'var(--success)' }}>
                  📌 Pawna Addition History (কখন কত টাকা পাওনা যোগ হয়েছে - Wholesale / Dhar)
                </h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date Added</th>
                      <th>Title / Order Description</th>
                      <th>Total Pawna</th>
                      <th>Collected</th>
                      <th>Pending</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!(pawnaAuditData.receivables || [pawnaAuditData.receivable]) || (pawnaAuditData.receivables || [pawnaAuditData.receivable]).length === 0) ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                          No Pawna records found.
                        </td>
                      </tr>
                    ) : (
                      (pawnaAuditData.receivables || [pawnaAuditData.receivable]).map((r, idx) => {
                        const pending = Number(r.total_amount) - Number(r.amount_collected);
                        return (
                          <tr key={idx}>
                            <td style={{ fontSize: '12px' }}>{formatDateTimeBD(r.created_at || r.due_date)}</td>
                            <td>
                              <strong>{r.title}</strong>
                              {r.notes && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.notes}</div>}
                            </td>
                            <td style={{ fontWeight: '600' }}>{currency}{Number(r.total_amount).toFixed(2)}</td>
                            <td style={{ color: 'var(--success)' }}>{currency}{Number(r.amount_collected).toFixed(2)}</td>
                            <td style={{ fontWeight: '700', color: pending > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                              {currency}{pending.toFixed(2)}
                            </td>
                            <td>
                              <span className={`badge ${r.status === 'collected' ? 'badge-success' : 'badge-danger'}`}>
                                {r.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* 2. Collection Logs Ledger */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: 'var(--accent-primary)' }}>
                  💳 Pawna Collection History Ledger (টাকা আদায়ের হিসাব)
                </h4>
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
                          No money collected against this customer's Pawna yet.
                        </td>
                      </tr>
                    ) : (
                      pawnaAuditData.collection_logs.map(log => (
                        <tr key={log.id}>
                          <td style={{ fontSize: '12px' }}>{formatDateTimeBD(log.collection_date)}</td>
                          <td style={{ fontWeight: '700', color: 'var(--success)' }}>+{currency}{Number(log.amount).toFixed(2)}</td>
                          <td><strong>{log.account_name || 'Cash Box'}</strong></td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{log.notes || log.receivable_title || 'Pawna Collection'}</td>
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
      {accountStatementData && (() => {
        const rawTxList = accountStatementData.transactions || [];
        const availableCategories = Array.from(new Set(rawTxList.map(t => t.type))).filter(Boolean);

        // Apply Date Range & Category Filter
        const now = new Date();
        const filteredTx = rawTxList.filter(tx => {
          // Category Filter
          if (passbookCategoryFilter !== 'all' && tx.type !== passbookCategoryFilter) {
            return false;
          }

          if (!tx.date) return true;
          const d = new Date(tx.date);
          if (isNaN(d.getTime())) return true;

          // Convert tx date to BD YYYY-MM-DD
          const txBDStr = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Dhaka" })).toISOString().slice(0, 10);
          const nowBDStr = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" })).toISOString().slice(0, 10);

          if (passbookDateFilter === 'today') {
            return txBDStr === nowBDStr;
          }
          if (passbookDateFilter === 'week') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            return d >= sevenDaysAgo;
          }
          if (passbookDateFilter === 'month') {
            const txDateBD = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
            const nowBD = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
            return txDateBD.getMonth() === nowBD.getMonth() && txDateBD.getFullYear() === nowBD.getFullYear();
          }
          if (passbookDateFilter === 'custom') {
            if (passbookStartDate && txBDStr < passbookStartDate) return false;
            if (passbookEndDate && txBDStr > passbookEndDate) return false;
            return true;
          }
          return true; // 'all'
        });

        const totalFilteredDebit = filteredTx.reduce((sum, t) => sum + Number(t.debit || 0), 0);
        const totalFilteredCredit = filteredTx.reduce((sum, t) => sum + Number(t.credit || 0), 0);

        return (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '850px' }}>
              <div className="modal-header">
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{accountStatementData.account.name} Passbook Ledger</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Account #: {accountStatementData.account.account_number || 'Cash Box'}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => exportPassbookToExcel(accountStatementData.account.name, filteredTx)} className="btn btn-success btn-sm" title="Export Filtered Passbook to Excel CSV">
                    <FileSpreadsheet size={15} />
                    <span>Download Excel</span>
                  </button>

                  <button onClick={handlePrintStatement} className="btn btn-secondary btn-sm" title="Print Statement">
                    <Printer size={15} />
                    <span>Print Passbook</span>
                  </button>
                  <button onClick={() => setAccountStatementData(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
                </div>
              </div>

              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Account Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px' }}>
                  <div>Account Name: <strong style={{ display: 'block', fontSize: '14px' }}>{accountStatementData.account.name}</strong></div>
                  <div>Filtered Debit (-): <strong style={{ display: 'block', fontSize: '14px', color: 'var(--danger)' }}>-{currency}{totalFilteredDebit.toFixed(2)}</strong></div>
                  <div>Filtered Credit (+): <strong style={{ display: 'block', fontSize: '14px', color: 'var(--success)' }}>+{currency}{totalFilteredCredit.toFixed(2)}</strong></div>
                  <div>Current Balance: <strong style={{ display: 'block', fontSize: '16px', color: 'var(--success)' }}>{currency}{Number(accountStatementData.account.balance).toFixed(2)}</strong></div>
                </div>

                {/* Date & Category Filter Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {[
                      { key: 'today', label: 'Today' },
                      { key: 'week', label: 'This Week' },
                      { key: 'month', label: 'This Month' },
                      { key: 'all', label: 'All Time' },
                      { key: 'custom', label: 'Custom Date' }
                    ].map(btn => (
                      <button
                        key={btn.key}
                        onClick={() => setPassbookDateFilter(btn.key)}
                        className={`btn btn-sm ${passbookDateFilter === btn.key ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          borderRadius: '20px',
                          padding: '4px 14px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: passbookDateFilter === btn.key ? '#8b5cf6' : 'transparent',
                          borderColor: passbookDateFilter === btn.key ? '#8b5cf6' : 'var(--border-color)',
                          color: passbookDateFilter === btn.key ? '#fff' : 'var(--text-secondary)'
                        }}
                      >
                        {btn.label}
                      </button>
                    ))}

                    {/* Category / Purpose Filter Dropdown */}
                    <div style={{ marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <select
                        className="form-select"
                        style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontWeight: '600' }}
                        value={passbookCategoryFilter}
                        onChange={(e) => setPassbookCategoryFilter(e.target.value)}
                      >
                        <option value="all">🔍 All Categories / Purpose (সকল খাত)</option>
                        {availableCategories.map((cat, i) => (
                          <option key={i} value={cat}>📁 {cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {passbookDateFilter === 'custom' && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="date"
                        className="form-input"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        value={passbookStartDate}
                        onChange={(e) => setPassbookStartDate(e.target.value)}
                      />
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>to</span>
                      <input
                        type="date"
                        className="form-input"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        value={passbookEndDate}
                        onChange={(e) => setPassbookEndDate(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Transaction Type</th>
                        <th>Description / Notes</th>
                        <th>Debit (-৳)</th>
                        <th>Credit (+৳)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTx.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                            No transactions found for the selected date filter range.
                          </td>
                        </tr>
                      ) : (
                        filteredTx.map((tx, idx) => (
                          <tr key={idx}>
                            <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDateTimeBD(tx.date)}</td>
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
        );
      })()}

      {/* 4. Investor Capital Audit Modal */}
      {investAuditData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '820px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Investor Capital Audit — {investAuditData.investor_name}</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Contact: {investAuditData.investment.phone || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handlePrintStatement} className="btn btn-secondary btn-sm">
                  <Printer size={15} />
                  <span>Print Statement</span>
                </button>
                <button onClick={() => setInvestAuditData(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
              </div>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px' }}>
                <div>Total Invested Capital: <strong style={{ display: 'block', fontSize: '16px', color: '#8b5cf6' }}>{currency}{Number(investAuditData.investment.invested_amount).toFixed(2)}</strong></div>
                <div>Returned Capital: <strong style={{ display: 'block', fontSize: '16px', color: 'var(--success)' }}>{currency}{Number(investAuditData.investment.returned_amount).toFixed(2)}</strong></div>
                <div>Net Active Capital: <strong style={{ display: 'block', fontSize: '16px', color: (Number(investAuditData.investment.invested_amount) - Number(investAuditData.investment.returned_amount)) > 0 ? 'var(--accent-primary)' : 'var(--text-muted)' }}>{currency}{(Number(investAuditData.investment.invested_amount) - Number(investAuditData.investment.returned_amount)).toFixed(2)}</strong></div>
              </div>

              {/* 1. Deposit History */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: '#8b5cf6' }}>
                  📌 Investment Deposit History (কখন কত টাকা ইনভেস্ট যোগ হয়েছে)
                </h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Deposit Date</th>
                      <th>Amount Invested</th>
                      <th>Notes / Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!investAuditData.deposits || investAuditData.deposits.length === 0) ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                          No deposit transactions recorded.
                        </td>
                      </tr>
                    ) : (
                      investAuditData.deposits.map((t, idx) => (
                        <tr key={idx}>
                          <td style={{ fontSize: '12px' }}>{formatDateTimeBD(t.transaction_date)}</td>
                          <td style={{ fontWeight: '700', color: '#8b5cf6' }}>+{currency}{Number(t.amount).toFixed(2)}</td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.notes || 'Investment Deposit'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 2. Return History */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: 'var(--success)' }}>
                  💳 Capital Return / Repayment History (কখন কত টাকা ফেরত/Return দেওয়া হয়েছে)
                </h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Return Date</th>
                      <th>Amount Returned</th>
                      <th>Notes / Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!investAuditData.repayments || investAuditData.repayments.length === 0) ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                          No capital repayments recorded against this investor yet.
                        </td>
                      </tr>
                    ) : (
                      investAuditData.repayments.map((t, idx) => (
                        <tr key={idx}>
                          <td style={{ fontSize: '12px' }}>{formatDateTimeBD(t.transaction_date)}</td>
                          <td style={{ fontWeight: '700', color: 'var(--success)' }}>-{currency}{Number(t.amount).toFixed(2)}</td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.notes || 'Capital Repayment'}</td>
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

      {/* 5. Dena Payment Voucher & Receipt Modal */}
      {denaReceiptModalData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={20} color="var(--success)" />
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Dena Payment Receipt (দেনা পেমেন্ট ইনভয়েস)</h3>
              </div>
              <button onClick={() => setDenaReceiptModalData(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="glass-card" style={{ padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                <div style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: '800', color: 'var(--accent-primary)', letterSpacing: '1px' }}>
                  {tenant?.name || 'Profitway Business POS'}
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', marginTop: '4px' }}>Dena Payment Voucher</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Voucher #: {denaReceiptModalData.voucher_no}</div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '14px 0' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Supplier / Party Name:</span>
                    <strong>{denaReceiptModalData.party_name}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Payment Date & Time:</span>
                    <strong>{formatDateTimeBD(denaReceiptModalData.payment_date)}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Paid From Account:</span>
                    <strong>{denaReceiptModalData.account_name}</strong>
                  </div>
                </div>

                <div style={{ marginTop: '16px', background: 'var(--bg-primary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Previous Total Dena (পূর্বের দেনা):</span>
                    <strong style={{ color: 'var(--danger)' }}>{currency}{Number(denaReceiptModalData.previous_due).toFixed(2)}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <span style={{ fontWeight: '700', color: 'var(--success)' }}>Payment Paid (আজকে পরিশোধ):</span>
                    <strong style={{ fontWeight: '800', color: 'var(--success)' }}>-{currency}{Number(denaReceiptModalData.payment_amount).toFixed(2)}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', paddingTop: '6px' }}>
                    <span style={{ fontWeight: '800' }}>Remaining Total Dena (বর্তমান অবশিষ্ট দেনা):</span>
                    <strong style={{ fontWeight: '800', color: Number(denaReceiptModalData.remaining_due) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      {currency}{Number(denaReceiptModalData.remaining_due).toFixed(2)}
                    </strong>
                  </div>
                </div>

                {denaReceiptModalData.notes && (
                  <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Notes: {denaReceiptModalData.notes}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => window.print()} className="btn btn-secondary">
                <Printer size={16} />
                <span>Print Receipt</span>
              </button>
              <button onClick={() => setDenaReceiptModalData(null)} className="btn btn-primary">
                Done / Close
              </button>
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

      {/* Balance Adjustment & Fund Withdraw Modal */}
      {showAdjustModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div>
                <h3>Account Balance Adjustment & Withdraw</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Adjust balance or send money without adding to Expenses, Dena, Pawna, or Investment return.</span>
              </div>
              <button onClick={() => setShowAdjustModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleAdjustSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Select Account *</label>
                  <select
                    className="form-select"
                    required
                    value={adjustForm.account_id}
                    onChange={(e) => setAdjustForm({ ...adjustForm, account_id: e.target.value })}
                  >
                    <option value="">Select Account...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (Available Balance: {currency}{Number(acc.balance).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Adjustment Direction *</label>
                  <select
                    className="form-select"
                    value={adjustForm.adjustment_type}
                    onChange={(e) => setAdjustForm({ ...adjustForm, adjustment_type: e.target.value })}
                  >
                    <option value="debit">🔴 Withdraw / Send Money / Reduce Balance (- Debit)</option>
                    <option value="credit">🟢 Fund Adjustment / Add Balance (+ Credit)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Category / Purpose *</label>
                  <select
                    className="form-select"
                    value={adjustForm.reason_title}
                    onChange={(e) => setAdjustForm({ ...adjustForm, reason_title: e.target.value })}
                  >
                    <option value="Owner Personal Cash Draw / Withdrawal">💸 Owner Personal Cash Draw / Withdrawal (মালিকের ব্যক্তিগত উত্তোলন)</option>
                    <option value="Supplier Payment / Debt Repayment">💳 Supplier Payment / Debt Repayment (সাপ্লায়ারকে টাকা প্রদান)</option>
                    <option value="Direct Shop Operating Expense">⚡ Direct Shop Operating Expense (দোকানের সরাসরি খরচ)</option>
                    <option value="Account Balance Correction / Adjustment">🔁 Account Balance Correction / Adjustment (হিসাব মেলানো)</option>
                    <option value="Bank Fee / Charges">🏦 Bank Fee / Charges (ব্যাংক চার্জ)</option>
                    {customCategories.map((c, i) => (
                      <option key={i} value={c}>📁 {c}</option>
                    ))}
                    <option value="CUSTOM">➕ + Create New Category (নতুন খাত যুক্ত করুন)...</option>
                  </select>

                  {adjustForm.reason_title === 'CUSTOM' && (
                    <div style={{ marginTop: '8px' }}>
                      <input
                        type="text"
                        className="form-input"
                        required
                        placeholder="Enter custom category name (e.g. Office Rent, Electricity, Partner Payment)..."
                        value={adjustForm.custom_category || ''}
                        onChange={(e) => setAdjustForm({ ...adjustForm, custom_category: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Amount ({currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    required
                    placeholder="e.g. 500.00"
                    value={adjustForm.amount}
                    onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes / Details (Recorded in Passbook)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Owner withdrew cash for personal use / Direct transfer to friend"
                    value={adjustForm.notes}
                    onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAdjustModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: adjustForm.adjustment_type === 'debit' ? 'var(--danger)' : 'var(--success)', borderColor: adjustForm.adjustment_type === 'debit' ? 'var(--danger)' : 'var(--success)' }}>
                  {adjustForm.adjustment_type === 'debit' ? 'Save Withdrawal / Adjustment' : 'Save Credit Adjustment'}
                </button>
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

      {/* Add New Pawna Profile Modal */}
      {showAddPawnaModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Create New Pawna Profile (পাওনাদার/কাস্টমার প্রোফাইল তৈরি)</h3>
              <button onClick={() => setShowAddPawnaModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddPawnaProfileSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Customer / Person Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Tanvir Ahmed / MD Sahadat Hossen"
                    value={addPawnaForm.party_name}
                    onChange={(e) => setAddPawnaForm({ ...addPawnaForm, party_name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Party Type</label>
                    <select
                      className="form-select"
                      value={addPawnaForm.party_type}
                      onChange={(e) => setAddPawnaForm({ ...addPawnaForm, party_type: e.target.value })}
                    >
                      <option value="customer">Customer</option>
                      <option value="friend">Friend / Relative</option>
                      <option value="borrower">Personal Loan Borrower</option>
                      <option value="other">Other Party</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Opening Pawna/Dhar ({currency}) (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="0.00"
                      value={addPawnaForm.total_amount}
                      onChange={(e) => setAddPawnaForm({ ...addPawnaForm, total_amount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes / Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Personal Dhar Loan / Wholesale Credit Account"
                    value={addPawnaForm.notes}
                    onChange={(e) => setAddPawnaForm({ ...addPawnaForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddPawnaModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-success">Create Pawna Profile</button>
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
                  <label className="form-label">Select Registered Customer / Pawna Profile</label>
                  <select
                    className="form-select"
                    value=""
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      if (selectedName) {
                        setPawnaForm({
                          ...pawnaForm,
                          party_name: selectedName,
                          title: pawnaForm.title || `Dhar/Due given to ${selectedName}`
                        });
                      }
                    }}
                  >
                    <option value="">Select Existing Pawna Profile (or type name below)...</option>
                    {Array.from(new Set((receivables || []).map(r => r.party_name))).map((name, idx) => (
                      <option key={idx} value={name}>👤 {name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Title / Description</label>
                  <input type="text" className="form-input" required placeholder="e.g. Customer Credit Sale #402 / Personal Loan" value={pawnaForm.title} onChange={(e) => setPawnaForm({ ...pawnaForm, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer / Party Name *</label>
                  <input type="text" className="form-input" required placeholder="e.g. Tanvir Ahmed" value={pawnaForm.party_name} onChange={(e) => setPawnaForm({ ...pawnaForm, party_name: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Total Pawna Amount ({currency}) *</label>
                    <input type="number" step="0.01" className="form-input" required placeholder="4500.00" value={pawnaForm.total_amount} onChange={(e) => setPawnaForm({ ...pawnaForm, total_amount: e.target.value })} />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">📅 Pawna Date (তারিখ)</label>
                    <input
                      type="date"
                      className="form-input"
                      value={pawnaForm.created_at || new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setPawnaForm({ ...pawnaForm, created_at: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">🏦 Deduct from Account (টাকা যে ক্যাশ/ব্যাংক থেকে গেছে - Optional)</label>
                  <select
                    className="form-select"
                    value={pawnaForm.account_id || ''}
                    onChange={(e) => setPawnaForm({ ...pawnaForm, account_id: e.target.value })}
                  >
                    <option value="">No Account Balance Deduction (শুধুমাত্র পাওয়ার হিসাব রাখুন)</option>
                    {(financeData?.accounts || []).map(acc => (
                      <option key={acc.id} value={acc.id}>
                        🏦 {acc.name} ({currency}{Number(acc.balance || 0).toFixed(2)})
                      </option>
                    ))}
                  </select>
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

      {/* Add New Investor Profile Modal */}
      {showAddInvestorModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Create New Investor Profile (ইনভেস্টর প্রোফাইল তৈরি)</h3>
              <button onClick={() => setShowAddInvestorModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddInvestorSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Investor Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. MD TANIM HOSSAN"
                    value={addInvestorForm.investor_name}
                    onChange={(e) => setAddInvestorForm({ ...addInvestorForm, investor_name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="01580852168"
                      value={addInvestorForm.phone}
                      onChange={(e) => setAddInvestorForm({ ...addInvestorForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="tanim@gmail.com"
                      value={addInvestorForm.email}
                      onChange={(e) => setAddInvestorForm({ ...addInvestorForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Opening Capital ({currency}) (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="0.00"
                      value={addInvestorForm.invested_amount}
                      onChange={(e) => setAddInvestorForm({ ...addInvestorForm, invested_amount: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Deposit Target Account</label>
                    <select
                      className="form-select"
                      required={Number(addInvestorForm.invested_amount) > 0}
                      value={addInvestorForm.account_id}
                      onChange={(e) => setAddInvestorForm({ ...addInvestorForm, account_id: e.target.value })}
                    >
                      <option value="">Select Account...</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({currency}{a.balance})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes / Remarks</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Business Equity Partner"
                    value={addInvestorForm.notes}
                    onChange={(e) => setAddInvestorForm({ ...addInvestorForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddInvestorModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}>Create Investor Profile</button>
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
                  <label className="form-label">Select Registered Investor Profile</label>
                  <select
                    className="form-select"
                    value=""
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      if (selectedName) {
                        const invList = (investments || []);
                        const found = invList.find(i => i.investor_name.toLowerCase() === selectedName.toLowerCase());
                        setInvestForm({
                          ...investForm,
                          investor_name: selectedName,
                          phone: found ? found.phone || '' : investForm.phone,
                          email: found ? found.email || '' : investForm.email
                        });
                      }
                    }}
                  >
                    <option value="">Select Existing Investor Profile (or type name below)...</option>
                    {Array.from(new Set((investments || []).map(i => i.investor_name))).map((name, idx) => (
                      <option key={idx} value={name}>👤 {name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Investor Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. MD TANIM HOSSAN"
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
