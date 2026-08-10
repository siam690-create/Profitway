import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ResponsiveSubTabs } from '../components/ResponsiveSubTabs';
import { 
  Users, UserPlus, Shield, Trash2, Key, CheckCircle, X, Edit3, Lock, 
  Calendar, Clock, CreditCard, DollarSign, Gift, FileText, Printer, 
  Award, Briefcase, Phone, Mail, QrCode, Plus, Search, Building2, Check, AlertCircle, FileCheck,
  Upload, Image, Eye, ExternalLink, File, Landmark
} from 'lucide-react';

const MODULE_LIST = [
  { id: 'inventory', name: 'Inventory / Stock' },
  { id: 'analytics', name: 'Analytics Breakdown' },
  { id: 'purchases', name: 'Purchases & Suppliers' },
  { id: 'returns', name: 'Courier Returns' },
  { id: 'ads', name: 'Paid Ads Tracker' },
  { id: 'pos', name: 'POS / New Sale' },
  { id: 'wholesale', name: 'Wholesale B2B Sales' },
  { id: 'orders', name: 'Sales & Orders' },
  { id: 'expenses', name: 'Expenses' },
  { id: 'reports', name: 'Profit & Loss Reports' },
  { id: 'finance', name: 'Finance & Dena-Pawna' },
  { id: 'staff', name: 'Staff & Users Management' }
];

export const StaffManager = () => {
  const { authFetch, currency, user, shopSettings } = useApp();
  const [activeTab, setActiveTab] = useState('employees'); // employees, attendance, leaves, payroll, salary-sheet, bonuses, loans, pf, idcards, users

  // Data States
  const [employeesList, setEmployeesList] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [leavesList, setLeavesList] = useState([]);
  const [loansList, setLoansList] = useState([]);
  const [bonusesList, setBonusesList] = useState([]);
  const [accountsList, setAccountsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [salarySheet, setSalarySheet] = useState([]);

  // Filter States
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // '2026-08'
  const [selectedEmpForCard, setSelectedEmpForCard] = useState(null);
  const [selectedEmpForPayslip, setSelectedEmpForPayslip] = useState(null);
  const [selectedEmpForDocs, setSelectedEmpForDocs] = useState(null);

  // Modals & Forms
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [empForm, setEmpForm] = useState({
    name: '', designation: 'Staff', department: 'General', phone: '', email: '', joining_date: new Date().toISOString().slice(0, 10),
    nid_number: '', blood_group: 'B+', emergency_contact_name: '', emergency_contact_phone: '',
    photo_url: '', nid_front_url: '', nid_back_url: '', documents_url: '',
    documents_list: [{ title: '', url: '' }],
    base_salary: '', hourly_rate: '', overtime_rate: '', payment_method: 'Cash', account_number: '',
    weekly_off_day: 'Friday', holiday_duty_allowance: ''
  });

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds 15MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const payload = { filename: file.name, filedata: reader.result };
        const res = await authFetch('/api/upload', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          setEmpForm(prev => ({ ...prev, [fieldName]: data.url }));
        } else {
          alert(`Upload failed: ${data.error}`);
        }
      } catch (err) {
        alert(`Upload error: ${err.message}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDocItemUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds 15MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const payload = { filename: file.name, filedata: reader.result };
        const res = await authFetch('/api/upload', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          setEmpForm(prev => {
            const list = [...(prev.documents_list || [])];
            list[index] = {
              title: list[index]?.title || file.name.split('.')[0],
              url: data.url
            };
            return { ...prev, documents_list: list };
          });
        } else {
          alert(`Upload failed: ${data.error}`);
        }
      } catch (err) {
        alert(`Upload error: ${err.message}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddDocRow = () => {
    setEmpForm(prev => ({
      ...prev,
      documents_list: [...(prev.documents_list || []), { title: '', url: '' }]
    }));
  };

  const handleRemoveDocRow = (index) => {
    setEmpForm(prev => ({
      ...prev,
      documents_list: (prev.documents_list || []).filter((_, i) => i !== index)
    }));
  };

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    employee_id: '',
    leave_type: 'casual',
    leave_category: 'paid',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    total_days: 1,
    reason: ''
  });

  const [loanTypeFilter, setLoanTypeFilter] = useState('all'); // 'all', 'loan', 'advance'
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanForm, setLoanForm] = useState({
    employee_id: '',
    type: 'loan',
    loan_amount: '',
    auto_deduct_salary: true,
    monthly_installment: '',
    account_id: '',
    notes: ''
  });

  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusForm, setBonusForm] = useState({ employee_id: '', title: 'Eid Festival Bonus', amount: '', month_year: new Date().toISOString().slice(0, 7), notes: '' });

  const [showDisburseModal, setShowDisburseModal] = useState(null);
  const [disburseAccount, setDisburseAccount] = useState('');

  // User Accounts State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({ name: '', email: '', password: '', role: 'cashier', permissions: ['inventory', 'pos', 'orders'] });

  // Fetch HR & System Data
  const fetchEmployees = async () => {
    try {
      const res = await authFetch('/api/staff/employees');
      const data = await res.json();
      if (res.ok) setEmployeesList(data);
    } catch (e) { console.error(e); }
  };

  const fetchAttendance = async () => {
    try {
      const res = await authFetch(`/api/staff/attendance?date=${attendanceDate}`);
      const data = await res.json();
      if (res.ok) setAttendanceList(data);
    } catch (e) { console.error(e); }
  };

  const fetchLeaves = async () => {
    try {
      const res = await authFetch('/api/staff/leaves');
      const data = await res.json();
      if (res.ok) setLeavesList(data);
    } catch (e) { console.error(e); }
  };

  const fetchLoans = async () => {
    try {
      const res = await authFetch('/api/staff/loans');
      const data = await res.json();
      if (res.ok) setLoansList(data);
    } catch (e) { console.error(e); }
  };

  const fetchBonuses = async () => {
    try {
      const res = await authFetch('/api/staff/bonuses');
      const data = await res.json();
      if (res.ok) setBonusesList(data);
    } catch (e) { console.error(e); }
  };

  const fetchAccounts = async () => {
    try {
      const res = await authFetch('/api/finance/summary');
      const data = await res.json();
      if (res.ok) setAccountsList(data.accounts || []);
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try {
      const res = await authFetch('/api/staff');
      const data = await res.json();
      if (res.ok) setUsersList(data);
    } catch (e) { console.error(e); }
  };

  const fetchSalarySheet = async () => {
    try {
      const res = await authFetch(`/api/staff/salary-sheet?month_year=${selectedMonth}`);
      const data = await res.json();
      if (res.ok) setSalarySheet(data);
    } catch (e) { console.error(e); }
  };

  const [pfList, setPfList] = useState([]);
  const [editingPf, setEditingPf] = useState(null);
  const [pfForm, setPfForm] = useState({
    employee_id: '',
    status: 'inactive',
    employee_contrib_pct: 5,
    employer_contrib_pct: 5
  });

  const fetchPF = async () => {
    try {
      const res = await authFetch('/api/staff/pf');
      const data = await res.json();
      if (res.ok) setPfList(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchEmployees();
    fetchAccounts();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') fetchAttendance();
    if (activeTab === 'leaves') fetchLeaves();
    if (activeTab === 'loans') fetchLoans();
    if (activeTab === 'bonuses') fetchBonuses();
    if (activeTab === 'pf') fetchPF();
    if (activeTab === 'salary-sheet' || activeTab === 'payroll') fetchSalarySheet();
  }, [activeTab, attendanceDate, selectedMonth]);

  const handleTogglePFStatus = async (item) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await authFetch('/api/staff/pf', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: item.employee_id,
          status: newStatus,
          employee_contrib_pct: item.employee_contrib_pct,
          employer_contrib_pct: item.employer_contrib_pct
        })
      });
      if (res.ok) {
        fetchPF();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleSavePF = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/staff/pf', {
        method: 'POST',
        body: JSON.stringify(pfForm)
      });
      const data = await res.json();
      if (res.ok) {
        setEditingPf(null);
        fetchPF();
        alert(data.message);
      } else alert(`Error: ${data.error}`);
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  // Handlers
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    try {
      const url = editingEmp ? `/api/staff/employees/${editingEmp.id}` : '/api/staff/employees';
      const method = editingEmp ? 'PUT' : 'POST';

      const validDocs = (empForm.documents_list || []).filter(d => d.url || (d.title && d.title.trim()));
      const payload = {
        ...empForm,
        documents_url: JSON.stringify(validDocs)
      };

      const res = await authFetch(url, { method, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) {
        setShowEmpModal(false);
        fetchEmployees();
        alert(data.message || 'Employee profile saved successfully!');
      } else alert(`Error: ${data.error}`);
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleMarkAttendance = async (empId, status, inTime, outTime, otHours, notes) => {
    try {
      const payload = {
        date: attendanceDate,
        attendanceList: [{ employee_id: empId, status, in_time: inTime, out_time: outTime, overtime_hours: otHours, notes: notes || null }]
      };
      const res = await authFetch('/api/staff/attendance/batch', { method: 'POST', body: JSON.stringify(payload) });
      if (res.ok) fetchAttendance();
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleMarkAllPresent = async () => {
    if (!employeesList.length) return;
    try {
      const list = employeesList.map(emp => {
        const att = attendanceList.find(a => Number(a.employee_id) === Number(emp.id)) || {};
        return {
          employee_id: emp.id,
          status: 'present',
          in_time: att.in_time || '09:00',
          out_time: att.out_time || '18:00',
          overtime_hours: att.overtime_hours || 0,
          notes: att.notes || null
        };
      });
      const res = await authFetch('/api/staff/attendance/batch', {
        method: 'POST',
        body: JSON.stringify({ date: attendanceDate, attendanceList: list })
      });
      if (res.ok) {
        fetchAttendance();
        alert('All active staff marked as Present for ' + attendanceDate);
      }
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleAutoMarkWeeklyOffs = async () => {
    if (!employeesList.length) return;
    const selectedDateObj = new Date(attendanceDate);
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = daysOfWeek[selectedDateObj.getDay()];

    const offEmployees = employeesList.filter(e => (e.weekly_off_day || 'Friday').toLowerCase() === currentDayName.toLowerCase());

    if (offEmployees.length === 0) {
      alert(`No employees have their weekly off scheduled on ${currentDayName}.`);
      return;
    }

    try {
      const list = offEmployees.map(emp => ({
        employee_id: emp.id,
        status: 'weekly_off',
        in_time: null,
        out_time: null,
        overtime_hours: 0,
        notes: `Weekly Off (${currentDayName})`
      }));

      const res = await authFetch('/api/staff/attendance/batch', {
        method: 'POST',
        body: JSON.stringify({ date: attendanceDate, attendanceList: list })
      });
      if (res.ok) {
        fetchAttendance();
        alert(`Auto-marked ${offEmployees.length} staff member(s) as Weekly Off for ${currentDayName} (${attendanceDate}).`);
      }
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleCreateLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.employee_id) return alert('Please select an employee.');
    try {
      const res = await authFetch('/api/staff/leaves', { method: 'POST', body: JSON.stringify(leaveForm) });
      const data = await res.json();
      if (res.ok) {
        setShowLeaveModal(false);
        fetchLeaves();
        fetchSalarySheet();
        alert('Leave record added successfully!');
      } else alert(`Error: ${data.error}`);
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleUpdateLeaveStatus = async (id, newStatus) => {
    try {
      const res = await authFetch(`/api/staff/leaves/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchLeaves();
        fetchSalarySheet();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleDeleteLeave = async (id) => {
    if (!window.confirm('Are you sure you want to delete this leave record?')) return;
    try {
      const res = await authFetch(`/api/staff/leaves/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLeaves();
        fetchSalarySheet();
        alert('Leave record deleted successfully.');
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleDisburseLoan = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/staff/loans/disburse', { method: 'POST', body: JSON.stringify(loanForm) });
      const data = await res.json();
      if (res.ok) {
        setShowLoanModal(false);
        fetchLoans();
        alert(data.message || 'Disbursed successfully!');
      } else alert(`Error: ${data.error}`);
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleDeleteLoan = async (id) => {
    if (!window.confirm('Are you sure you want to delete this loan/advance record?')) return;
    try {
      const res = await authFetch(`/api/staff/loans/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLoans();
        alert('Record deleted successfully.');
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCreateBonus = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...bonusForm,
        bonus_date: bonusForm.month_year ? `${bonusForm.month_year}-01` : new Date().toISOString().slice(0, 10)
      };
      const res = await authFetch('/api/staff/bonuses', { method: 'POST', body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) {
        setShowBonusModal(false);
        fetchBonuses();
        fetchSalarySheet();
        alert('Bonus/Allowance recorded successfully!');
      } else alert(`Error: ${data.error}`);
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleDeleteBonus = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bonus/allowance record?')) return;
    try {
      const res = await authFetch(`/api/staff/bonuses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchBonuses();
        fetchSalarySheet();
        alert('Bonus record deleted successfully.');
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleDisburseSalary = async (e) => {
    e.preventDefault();
    if (!showDisburseModal || !disburseAccount) return alert('Select payment account');
    try {
      const payload = {
        ...showDisburseModal,
        month_year: selectedMonth,
        account_id: disburseAccount
      };
      const res = await authFetch('/api/staff/salary-sheet/disburse', { method: 'POST', body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) {
        setShowDisburseModal(null);
        fetchSalarySheet();
        alert(data.message || 'Salary disbursed and logged in Passbook!');
      } else alert(`Error: ${data.error}`);
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleCreateUserAccount = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/staff', {
        method: 'POST',
        body: JSON.stringify(userFormData)
      });
      const data = await res.json();
      if (res.ok) {
        setShowUserModal(false);
        setUserFormData({ name: '', email: '', password: '', role: 'cashier', permissions: ['inventory', 'pos', 'orders', 'chat', 'attendance', 'tasks'] });
        fetchUsers();
        alert('Staff login account created successfully!');
      } else alert(`Error: ${data.error}`);
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleToggleUserPermission = async (userObj, permKey) => {
    let currentPerms = Array.isArray(userObj.permissions) ? [...userObj.permissions] : ['inventory', 'pos', 'orders', 'chat', 'attendance', 'tasks'];
    if (currentPerms.includes(permKey)) {
      currentPerms = currentPerms.filter(p => p !== permKey);
    } else {
      currentPerms.push(permKey);
    }
    try {
      const res = await authFetch(`/api/staff/${userObj.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: userObj.role, permissions: currentPerms })
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const handlePrintIDCard = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Briefcase size={26} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '22px', fontWeight: '800' }}>Enterprise HR, Payroll & Attendance OS</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Manage staff profiles, daily attendance, leave approvals, monthly salary sheets, festival bonuses, loans, PF, and ID card badges
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setActiveTab('users');
              setShowUserModal(true);
            }}
            className="btn btn-secondary"
            style={{ color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}
          >
            <Key size={16} />
            <span>🔑 Staff Logins & Permissions</span>
          </button>

          <button
            onClick={() => {
              setEditingEmp(null);
              setEmpForm({
                name: '', designation: 'Staff', department: 'General', phone: '', email: '', joining_date: new Date().toISOString().slice(0, 10),
                nid_number: '', blood_group: 'B+', emergency_contact_name: '', emergency_contact_phone: '',
                photo_url: '', nid_front_url: '', nid_back_url: '', documents_url: '',
                base_salary: '', hourly_rate: '', overtime_rate: '', payment_method: 'Cash', account_number: ''
              });
              setShowEmpModal(true);
            }}
            className="btn btn-primary"
          >
            <UserPlus size={16} />
            <span>+ Add Employee Profile</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <ResponsiveSubTabs
        tabs={[
          { id: 'employees', label: `Employees (${employeesList.length})`, icon: Users },
          { id: 'users', label: `Staff Logins & Permissions (${usersList.length})`, icon: Key },
          { id: 'attendance', label: 'Attendance Log', icon: Calendar },
          { id: 'leaves', label: 'Leave Manager', icon: Clock },
          { id: 'salary-sheet', label: 'Master Salary Sheet', icon: FileText },
          { id: 'payroll', label: 'Payroll Disbursement', icon: CreditCard },
          { id: 'bonuses', label: 'Bonuses & Allowances', icon: Gift },
          { id: 'loans', label: 'Loans & Advances', icon: DollarSign },
          { id: 'pf', label: 'Provident Fund (PF)', icon: Landmark },
          { id: 'idcards', label: 'Employee Badges / Cards', icon: Printer },
        ]}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* 1. EMPLOYEE DIRECTORY & PROFILES TAB */}
      {activeTab === 'employees' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Staff Employee Directory</h3>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Employee Name</th>
                  <th>Designation / Dept</th>
                  <th>Weekly Off Day</th>
                  <th>Contact Info</th>
                  <th>Base Salary</th>
                  <th>Joining Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employeesList.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No employee profiles created yet. Click "+ Add Employee Profile" to add one.
                    </td>
                  </tr>
                ) : (
                  employeesList.map(emp => (
                    <tr key={emp.id}>
                      <td><strong style={{ color: 'var(--accent-primary)' }}>{emp.employee_code}</strong></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {emp.photo_url ? (
                            <img src={emp.photo_url} alt={emp.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <strong>{emp.name}</strong>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>NID: {emp.nid_number || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>{emp.designation}</div>
                        <span className="badge badge-secondary" style={{ fontSize: '10px' }}>{emp.department}</span>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          style={{ fontSize: '12px', padding: '4px 8px', background: 'var(--bg-secondary)', cursor: 'pointer', width: '120px' }}
                          value={emp.weekly_off_day || 'Friday'}
                          onChange={async (e) => {
                            const newOff = e.target.value;
                            try {
                              const res = await authFetch(`/api/staff/employees/${emp.id}`, {
                                method: 'PUT',
                                body: JSON.stringify({ ...emp, weekly_off_day: newOff })
                              });
                              if (res.ok) {
                                fetchEmployees();
                                alert(`Updated ${emp.name}'s weekly off day to ${newOff}!`);
                              }
                            } catch (err) { alert(`Error: ${err.message}`); }
                          }}
                        >
                          <option value="Friday">🏖️ Friday</option>
                          <option value="Saturday">🏖️ Saturday</option>
                          <option value="Sunday">🏖️ Sunday</option>
                          <option value="Monday">🏖️ Monday</option>
                          <option value="Tuesday">🏖️ Tuesday</option>
                          <option value="Wednesday">🏖️ Wednesday</option>
                          <option value="Thursday">🏖️ Thursday</option>
                          <option value="None">None</option>
                        </select>
                      </td>
                      <td style={{ fontSize: '13px' }}>
                        <div><Phone size={12} style={{ inlineSize: '12px' }} /> {emp.phone || 'N/A'}</div>
                        <div style={{ color: 'var(--text-muted)' }}>{emp.email || ''}</div>
                      </td>
                      <td style={{ fontWeight: '700', color: 'var(--success)' }}>{currency}{Number(emp.base_salary).toFixed(2)}</td>
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{emp.joining_date ? new Date(emp.joining_date).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <span className={`badge ${emp.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {emp.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => setSelectedEmpForDocs(emp)}
                            className="btn btn-secondary btn-icon btn-sm"
                            title="View NID Cards & Documents"
                            style={{ color: '#6366f1' }}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEmpForCard(emp);
                              setActiveTab('idcards');
                            }}
                            className="btn btn-secondary btn-icon btn-sm"
                            title="Generate ID Card Badge"
                          >
                            <QrCode size={14} />
                          </button>
                          <button
                            onClick={() => {
                              let docsList = [];
                              try {
                                docsList = emp.documents_url ? JSON.parse(emp.documents_url) : [];
                              } catch (e) {
                                if (emp.documents_url) docsList = [{ title: 'Attached Document', url: emp.documents_url }];
                              }
                              if (!Array.isArray(docsList) || docsList.length === 0) {
                                docsList = [{ title: '', url: '' }];
                              }

                              setEditingEmp(emp);
                              setEmpForm({
                                ...emp,
                                joining_date: emp.joining_date ? new Date(emp.joining_date).toISOString().slice(0, 10) : '',
                                weekly_off_day: emp.weekly_off_day || 'Friday',
                                holiday_duty_allowance: emp.holiday_duty_allowance || '',
                                nid_number: emp.nid_number || '',
                                photo_url: emp.photo_url || '',
                                nid_front_url: emp.nid_front_url || '',
                                nid_back_url: emp.nid_back_url || '',
                                documents_url: emp.documents_url || '',
                                documents_list: docsList
                              });
                              setShowEmpModal(true);
                            }}
                            className="btn btn-secondary btn-icon btn-sm"
                            title="Edit Bio-data"
                          >
                            <Edit3 size={14} />
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
      )}

      {/* 2. DAILY ATTENDANCE TAB */}
      {activeTab === 'attendance' && (() => {
        const selectedDateObj = new Date(attendanceDate);
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayName = daysOfWeek[selectedDateObj.getDay()];

        return (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Daily Attendance Log & Shift Management</span>
                  <span className="badge badge-info" style={{ fontSize: '12px' }}>
                    📅 {currentDayName} ({attendanceDate})
                  </span>
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Manage attendance, weekly off days, overtime hours, and extra holiday duty allowances.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button type="button" onClick={handleMarkAllPresent} className="btn btn-success btn-sm" style={{ fontSize: '12px' }}>
                  ⚡ Mark All Present
                </button>
                <button type="button" onClick={handleAutoMarkWeeklyOffs} className="btn btn-secondary btn-sm" style={{ fontSize: '12px', color: '#3b82f6', borderColor: '#3b82f6' }}>
                  🏖️ Auto-Mark Weekly Offs ({currentDayName})
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Date:</label>
                  <input
                    type="date"
                    className="form-input"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    style={{ width: '160px' }}
                  />
                </div>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Weekly Off</th>
                    <th>Attendance Status</th>
                    <th>In Time</th>
                    <th>Out Time</th>
                    <th>Overtime (Hrs)</th>
                    <th>Notes / Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {employeesList.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>No active employees found.</td></tr>
                  ) : (
                    employeesList.map(emp => {
                      const att = attendanceList.find(a => Number(a.employee_id) === Number(emp.id)) || {};
                      const currentStatus = att.status || 'present';
                      const empOffDay = emp.weekly_off_day || 'Friday';
                      const isTodayOffDay = empOffDay.toLowerCase() === currentDayName.toLowerCase();

                      return (
                        <tr key={emp.id} style={{ background: isTodayOffDay ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }}>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <strong>{emp.name}</strong>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.employee_code} • {emp.designation}</span>
                            </div>
                          </td>
                          <td>
                            {isTodayOffDay ? (
                              <span className="badge badge-warning" style={{ fontSize: '11px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
                                🔥 Today Off ({empOffDay})
                              </span>
                            ) : (
                              <span className="badge badge-secondary" style={{ fontSize: '11px' }}>
                                🏖️ {empOffDay}
                              </span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => handleMarkAttendance(emp.id, 'present', att.in_time, att.out_time, att.overtime_hours, att.notes)}
                                className={`btn btn-xs ${currentStatus === 'present' ? 'btn-success' : 'btn-secondary'}`}
                                style={{ fontSize: '11px', padding: '4px 8px' }}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkAttendance(emp.id, 'absent', att.in_time, att.out_time, att.overtime_hours, att.notes)}
                                className={`btn btn-xs ${currentStatus === 'absent' ? 'btn-danger' : 'btn-secondary'}`}
                                style={{ fontSize: '11px', padding: '4px 8px' }}
                              >
                                Absent
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkAttendance(emp.id, 'late', att.in_time, att.out_time, att.overtime_hours, att.notes)}
                                className={`btn btn-xs ${currentStatus === 'late' ? 'btn-warning' : 'btn-secondary'}`}
                                style={{ fontSize: '11px', padding: '4px 8px' }}
                              >
                                Late
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkAttendance(emp.id, 'half_day', att.in_time, att.out_time, att.overtime_hours, att.notes)}
                                className={`btn btn-xs ${currentStatus === 'half_day' ? 'btn-warning' : 'btn-secondary'}`}
                                style={{ fontSize: '11px', padding: '4px 8px', background: currentStatus === 'half_day' ? '#f97316' : '', color: currentStatus === 'half_day' ? '#fff' : '' }}
                              >
                                Half Day
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkAttendance(emp.id, 'weekly_off', att.in_time, att.out_time, att.overtime_hours, att.notes)}
                                className={`btn btn-xs ${currentStatus === 'weekly_off' ? 'btn-info' : 'btn-secondary'}`}
                                style={{ fontSize: '11px', padding: '4px 8px' }}
                              >
                                Weekly Off
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkAttendance(emp.id, 'holiday_duty', att.in_time, att.out_time, att.overtime_hours, att.notes || 'Holiday Extra Duty')}
                                className={`btn btn-xs ${currentStatus === 'holiday_duty' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ fontSize: '11px', padding: '4px 8px', background: currentStatus === 'holiday_duty' ? '#8b5cf6' : '', color: currentStatus === 'holiday_duty' ? '#fff' : '' }}
                                title="Worked on Weekly Off / Holiday - Extra Duty Allowance Added to Salary"
                              >
                                🌟 Holiday Duty (Extra)
                              </button>
                            </div>
                          </td>
                          <td>
                            <input
                              type="time"
                              className="form-input"
                              style={{ padding: '2px 6px', fontSize: '12px', width: '100px' }}
                              defaultValue={att.in_time || '09:00'}
                              onBlur={(e) => handleMarkAttendance(emp.id, currentStatus, e.target.value, att.out_time, att.overtime_hours, att.notes)}
                            />
                          </td>
                          <td>
                            <input
                              type="time"
                              className="form-input"
                              style={{ padding: '2px 6px', fontSize: '12px', width: '100px' }}
                              defaultValue={att.out_time || '18:00'}
                              onBlur={(e) => handleMarkAttendance(emp.id, currentStatus, att.in_time, e.target.value, att.overtime_hours, att.notes)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.5"
                              className="form-input"
                              style={{ width: '70px', padding: '2px 6px', fontSize: '12px' }}
                              defaultValue={att.overtime_hours || 0}
                              onBlur={(e) => handleMarkAttendance(emp.id, currentStatus, att.in_time, att.out_time, e.target.value, att.notes)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-input"
                              style={{ padding: '2px 6px', fontSize: '11px' }}
                              placeholder="Notes..."
                              defaultValue={att.notes || ''}
                              onBlur={(e) => handleMarkAttendance(emp.id, currentStatus, att.in_time, att.out_time, att.overtime_hours, e.target.value)}
                            />
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

      {/* 3. LEAVE MANAGEMENT TAB */}
      {activeTab === 'leaves' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Leave Applications & Quota</h3>
            <button onClick={() => setShowLeaveModal(true)} className="btn btn-primary">
              <Plus size={15} />
              <span>+ Record Employee Leave</span>
            </button>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Duration (Dates)</th>
                  <th>Total Days</th>
                  <th>Pay Category</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leavesList.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>No leave applications recorded. Click "+ Record Employee Leave" to add one.</td></tr>
                ) : (
                  leavesList.map(l => (
                    <tr key={l.id}>
                      <td>
                        <strong>{l.employee_name}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.employee_code} • {l.designation}</div>
                      </td>
                      <td style={{ textTransform: 'capitalize', fontWeight: '600' }}>{l.leave_type} Leave</td>
                      <td style={{ fontSize: '12px' }}>
                        {new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>{l.total_days} Days</td>
                      <td>
                        <span className={`badge ${l.leave_category === 'unpaid' ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '11px' }}>
                          {l.leave_category === 'unpaid' ? '❌ Unpaid Leave (বেতনহীন)' : '✓ Paid Leave (বেতনসহ)'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{l.reason || 'Personal / Official'}</td>
                      <td>
                        <span className={`badge ${l.status === 'approved' ? 'badge-success' : l.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`} style={{ textTransform: 'capitalize' }}>
                          {l.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {l.status !== 'approved' && (
                            <button
                              onClick={() => handleUpdateLeaveStatus(l.id, 'approved')}
                              className="btn btn-success btn-xs"
                              style={{ fontSize: '11px', padding: '3px 6px' }}
                              title="Approve Leave"
                            >
                              Approve
                            </button>
                          )}
                          {l.status !== 'rejected' && (
                            <button
                              onClick={() => handleUpdateLeaveStatus(l.id, 'rejected')}
                              className="btn btn-warning btn-xs"
                              style={{ fontSize: '11px', padding: '3px 6px' }}
                              title="Reject Leave"
                            >
                              Reject
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteLeave(l.id)}
                            className="btn btn-danger btn-icon btn-xs"
                            style={{ padding: '3px 6px' }}
                            title="Delete Record"
                          >
                            <Trash2 size={12} />
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
      )}

      {/* 4. MASTER SALARY SHEET TAB */}
      {activeTab === 'salary-sheet' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Monthly Master Salary Sheet</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Auto-calculated Net Payable after Overtime, Absent deduction, Loan EMI & PF</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="month"
                className="form-input"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ width: '160px' }}
              />
              <button onClick={() => window.print()} className="btn btn-secondary">
                <Printer size={15} />
                <span>Print Master Sheet</span>
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Base Salary</th>
                  <th>Attendance Summary</th>
                  <th>Overtime & Extra Duty</th>
                  <th>Bonus</th>
                  <th>Deductions (Loan/PF/Absent)</th>
                  <th>Net Payable</th>
                  <th>Status</th>
                  <th>Payslip</th>
                </tr>
              </thead>
              <tbody>
                {salarySheet.length === 0 ? (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>No salary data for selected month.</td></tr>
                ) : (
                  salarySheet.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{item.name}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.designation} ({item.weekly_off_day || 'Friday'} Off)</div>
                      </td>
                      <td style={{ fontWeight: '700' }}>{currency}{item.base_salary.toFixed(2)}</td>
                      <td style={{ fontSize: '12px' }}>
                        <span style={{ color: 'var(--success)' }}>{item.present_days}P</span> / <span style={{ color: 'var(--danger)' }}>{item.absent_days}A</span>
                        {item.half_days > 0 && <span style={{ color: '#f97316' }}> / {item.half_days}Half</span>}
                        {item.holiday_duty_days > 0 && <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}> / {item.holiday_duty_days}Extra Duty</span>}
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--success)' }}>
                          +{currency}{(item.overtime_pay + (item.holiday_duty_pay || 0)).toFixed(2)}
                        </div>
                        {(item.overtime_hours > 0 || item.holiday_duty_days > 0) && (
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {item.overtime_hours > 0 ? `OT: ${item.overtime_hours}h ` : ''}
                            {item.holiday_duty_days > 0 ? `Extra: ${item.holiday_duty_days}d` : ''}
                          </div>
                        )}
                      </td>
                      <td style={{ color: '#8b5cf6' }}>+{currency}{item.bonus_amount.toFixed(2)}</td>
                      <td style={{ color: 'var(--danger)', fontSize: '12px' }}>
                        -{currency}{(item.absent_penalty + item.loan_deduction + item.pf_deduction).toFixed(2)}
                      </td>
                      <td style={{ fontWeight: '800', fontSize: '15px', color: 'var(--success)' }}>
                        {currency}{item.net_payable.toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge ${item.is_paid ? 'badge-success' : 'badge-warning'}`}>
                          {item.is_paid ? '🟢 Disbursed' : '🟡 Pending'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedEmpForPayslip(item)}
                          className="btn btn-secondary btn-sm"
                        >
                          <FileText size={13} />
                          <span>Payslip</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. PAYROLL DISBURSEMENT TAB */}
      {activeTab === 'payroll' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Payroll Disbursement & Passbook Integration</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Disburse net salary directly from liquid finance accounts with automatic expense logging.</span>
            </div>
            <input
              type="month"
              className="form-input"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ width: '160px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {salarySheet.map((item, idx) => (
              <div key={idx} className="glass-card" style={{ padding: '16px', borderLeft: item.is_paid ? '4px solid var(--success)' : '4px solid var(--warning)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong>{item.name}</strong>
                  <span className={`badge ${item.is_paid ? 'badge-success' : 'badge-warning'}`}>
                    {item.is_paid ? 'PAID' : 'DUE'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.designation} ({item.employee_code})</div>
                <div style={{ margin: '10px 0', fontSize: '20px', fontWeight: '800', color: 'var(--success)' }}>
                  {currency}{item.net_payable.toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Base: {currency}{item.base_salary} | Bonus: +{currency}{item.bonus_amount} | Loan/PF: -{currency}{(item.loan_deduction + item.pf_deduction).toFixed(2)}
                </div>

                {!item.is_paid ? (
                  <button
                    onClick={() => {
                      setDisburseAccount((accountsList[0] && accountsList[0].id) ? accountsList[0].id : '');
                      setShowDisburseModal(item);
                    }}
                    className="btn btn-success btn-sm"
                    style={{ width: '100%' }}
                  >
                    <CreditCard size={14} />
                    <span>Disburse Net Salary</span>
                  </button>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '600' }}>
                    <Check size={14} /> Salary Disbursed & Passbook Logged
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. BONUSES & ALLOWANCES TAB */}
      {activeTab === 'bonuses' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Festival Bonuses & Allowances</h3>
            <button onClick={() => setShowBonusModal(true)} className="btn btn-primary">
              <Gift size={15} />
              <span>+ Issue Bonus / Allowance</span>
            </button>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Target Employee</th>
                  <th>Bonus Amount</th>
                  <th>Target Salary Month</th>
                  <th>Issued Date</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bonusesList.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>No bonuses issued.</td></tr>
                ) : (
                  bonusesList.map(b => (
                    <tr key={b.id}>
                      <td><strong>{b.title}</strong></td>
                      <td>{b.employee_name}</td>
                      <td style={{ fontWeight: '700', color: '#8b5cf6' }}>+{currency}{Number(b.amount).toFixed(2)}</td>
                      <td>
                        <span className="badge badge-primary" style={{ fontSize: '11px' }}>
                          📅 {b.bonus_date ? new Date(b.bonus_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{b.bonus_date ? new Date(b.bonus_date).toLocaleDateString() : 'N/A'}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{b.notes || 'Festival Allowance'}</td>
                      <td>
                        <button
                          onClick={() => handleDeleteBonus(b.id)}
                          className="btn btn-danger btn-icon btn-xs"
                          title="Delete Bonus Record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. LOANS & ADVANCES TAB */}
      {activeTab === 'loans' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Employee Loans & Salary Advance Ledger</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Manage staff personal loans and monthly advance salary disbursements
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px' }}>
                <button
                  onClick={() => setLoanTypeFilter('all')}
                  className={`btn btn-xs ${loanTypeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '12px' }}
                >
                  All ({loansList.length})
                </button>
                <button
                  onClick={() => setLoanTypeFilter('loan')}
                  className={`btn btn-xs ${loanTypeFilter === 'loan' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '12px' }}
                >
                  💰 Loans ({loansList.filter(x => (x.type || 'loan') === 'loan').length})
                </button>
                <button
                  onClick={() => setLoanTypeFilter('advance')}
                  className={`btn btn-xs ${loanTypeFilter === 'advance' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '12px' }}
                >
                  ⚡ Advances ({loansList.filter(x => x.type === 'advance').length})
                </button>
              </div>

              <button
                onClick={() => {
                  setLoanForm({
                    employee_id: '',
                    type: 'loan',
                    loan_amount: '',
                    auto_deduct_salary: true,
                    monthly_installment: '',
                    account_id: '',
                    notes: ''
                  });
                  setShowLoanModal(true);
                }}
                className="btn btn-primary"
              >
                <DollarSign size={15} />
                <span>+ Disburse Loan / Advance</span>
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Category</th>
                  <th>Total Disbursed</th>
                  <th>Repaid</th>
                  <th>Pending Balance</th>
                  <th>Auto Salary Deduct</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filteredLoans = loansList.filter(l => {
                    if (loanTypeFilter === 'loan') return (l.type || 'loan') === 'loan';
                    if (loanTypeFilter === 'advance') return l.type === 'advance';
                    return true;
                  });

                  if (filteredLoans.length === 0) {
                    return (
                      <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>No active loans or salary advances found.</td></tr>
                    );
                  }

                  return filteredLoans.map(l => {
                    const pending = Number(l.loan_amount) - Number(l.paid_amount || 0);
                    const isAdvance = l.type === 'advance';
                    const autoDeduct = l.auto_deduct_salary === 1 || l.auto_deduct_salary === true || l.auto_deduct_salary === undefined;
                    const emi = Number(l.monthly_installment || 0);

                    return (
                      <tr key={l.id}>
                        <td><strong>{l.employee_name}</strong></td>
                        <td>
                          {isAdvance ? (
                            <span className="badge badge-warning" style={{ background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b50' }}>
                              ⚡ Salary Advance
                            </span>
                          ) : (
                            <span className="badge badge-primary">
                              💰 Personal Loan
                            </span>
                          )}
                        </td>
                        <td style={{ fontWeight: '700' }}>{currency}{Number(l.loan_amount).toFixed(2)}</td>
                        <td style={{ color: 'var(--success)' }}>{currency}{Number(l.paid_amount || 0).toFixed(2)}</td>
                        <td style={{ fontWeight: '800', color: pending > 0 ? 'var(--danger)' : 'var(--success)' }}>
                          {currency}{pending.toFixed(2)}
                        </td>
                        <td style={{ fontSize: '13px' }}>
                          {autoDeduct ? (
                            <div style={{ color: 'var(--success)', fontWeight: '600' }}>
                              ✓ Yes {emi > 0 ? `(${currency}${emi.toFixed(0)}/mo)` : '(Full Deduct)'}
                            </div>
                          ) : (
                            <div style={{ color: 'var(--text-muted)' }}>❌ No (Manual)</div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${l.status === 'cleared' ? 'badge-success' : 'badge-danger'}`}>
                            {l.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleDeleteLoan(l.id)}
                            className="btn btn-secondary btn-icon btn-sm"
                            title="Delete Record"
                            style={{ color: 'var(--danger)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. PROVIDENT FUND (PF) TAB */}
      {activeTab === 'pf' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Provident Fund (PF) Treasury Ledger & Settings</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Enable/Disable Provident Fund (PF) and configure custom contribution percentages per staff member.
              </p>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th>Base Salary</th>
                  <th>PF Status (ON / OFF)</th>
                  <th>Staff Contribution</th>
                  <th>Company Contribution</th>
                  <th>Total Accumulated Treasury</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pfList.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>No employees found.</td></tr>
                ) : (
                  pfList.map(item => {
                    const isActive = item.status === 'active';
                    const baseSalary = Number(item.base_salary || 0);
                    const empPct = Number(item.employee_contrib_pct || 5);
                    const compPct = Number(item.employer_contrib_pct || 5);
                    const staffMonthly = isActive ? baseSalary * (empPct / 100) : 0;
                    const compMonthly = isActive ? baseSalary * (compPct / 100) : 0;

                    return (
                      <tr key={item.employee_id}>
                        <td>
                          <strong>{item.name}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.employee_code}</div>
                        </td>
                        <td>{item.designation}</td>
                        <td style={{ fontWeight: '600' }}>{currency}{baseSalary.toFixed(2)}</td>
                        <td>
                          <button
                            onClick={() => handleTogglePFStatus(item)}
                            className={`btn btn-sm ${isActive ? 'btn-success' : 'btn-secondary'}`}
                            style={{ padding: '4px 10px', fontSize: '12px', minWidth: '90px' }}
                            title="Click to toggle PF ON/OFF"
                          >
                            {isActive ? '🟢 PF ON' : '🔴 PF OFF'}
                          </button>
                        </td>
                        <td style={{ fontSize: '13px' }}>
                          {isActive ? (
                            <span>{currency}{staffMonthly.toFixed(2)} / mo ({empPct}%)</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>0% (Inactive)</span>
                          )}
                        </td>
                        <td style={{ fontSize: '13px' }}>
                          {isActive ? (
                            <span>{currency}{compMonthly.toFixed(2)} / mo ({compPct}%)</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>0% (Inactive)</span>
                          )}
                        </td>
                        <td style={{ fontWeight: '800', color: 'var(--success)', fontSize: '15px' }}>
                          {currency}{Number(item.accumulated_balance || 0).toFixed(2)}
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              setEditingPf(item);
                              setPfForm({
                                employee_id: item.employee_id,
                                status: item.status || 'inactive',
                                employee_contrib_pct: item.employee_contrib_pct || 5,
                                employer_contrib_pct: item.employer_contrib_pct || 5
                              });
                            }}
                            className="btn btn-secondary btn-icon btn-sm"
                            title="Configure PF Settings"
                          >
                            <Edit3 size={14} />
                          </button>
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

      {/* 9. EMPLOYEE ID CARD BADGES TAB */}
      {activeTab === 'idcards' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Employee ID Card Badge Generator</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Select an employee to render a corporate printable ID badge</span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <select
                className="form-select"
                value={selectedEmpForCard ? selectedEmpForCard.id : ''}
                onChange={(e) => {
                  const emp = employeesList.find(x => String(x.id) === e.target.value);
                  setSelectedEmpForCard(emp || null);
                }}
                style={{ width: '220px' }}
              >
                <option value="">Select Employee...</option>
                {employeesList.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.employee_code})</option>
                ))}
              </select>

              <button onClick={handlePrintIDCard} className="btn btn-primary">
                <Printer size={15} />
                <span>Print Badge</span>
              </button>
            </div>
          </div>

          {selectedEmpForCard ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
              {/* Printable ID Card Container */}
              <div style={{
                width: '320px',
                height: '500px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
                border: '2px solid rgba(139, 92, 246, 0.4)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                color: '#fff',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative'
              }}>
                {/* Header Logo */}
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#a78bfa', letterSpacing: '1px' }}>
                  {shopSettings?.name || 'PROFITWAY SAAS'}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '20px' }}>
                  OFFICIAL EMPLOYEE BADGE
                </div>

                {/* Photo Placeholder */}
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  border: '3px solid #8b5cf6',
                  background: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  marginBottom: '14px'
                }}>
                  {selectedEmpForCard.name.charAt(0).toUpperCase()}
                </div>

                {/* Name & Title */}
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0' }}>{selectedEmpForCard.name}</h3>
                <span className="badge badge-primary" style={{ fontSize: '11px', textTransform: 'uppercase', marginBottom: '16px' }}>
                  {selectedEmpForCard.designation}
                </span>

                {/* Details Grid */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '10px', textAlign: 'left' }}>
                  <div><strong>EMP ID:</strong> {selectedEmpForCard.employee_code}</div>
                  <div><strong>Department:</strong> {selectedEmpForCard.department}</div>
                  <div><strong>Phone:</strong> {selectedEmpForCard.phone || 'N/A'}</div>
                  <div><strong>Blood Group:</strong> <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{selectedEmpForCard.blood_group || 'B+'}</span></div>
                </div>

                {/* Footer Bar */}
                <div style={{ marginTop: 'auto', fontSize: '10px', color: '#64748b' }}>
                  Authorized Signature • Profitway SaaS OS
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              Choose an employee from the dropdown above to generate & preview ID Card.
            </div>
          )}
        </div>
      )}

      {/* 10. SYSTEM USERS & ROLES TAB */}
      {activeTab === 'users' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Shop Admin & Staff Login Accounts</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Manage logins and toggle individual feature access permissions per staff member.</p>
            </div>
            <button onClick={() => setShowUserModal(true)} className="btn btn-primary">
              <UserPlus size={15} />
              <span>+ Create Staff Login Account</span>
            </button>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Login Email</th>
                  <th>Role</th>
                  <th>Granular Module Permissions</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => {
                  const uPerms = Array.isArray(u.permissions) ? u.permissions : ['inventory', 'pos', 'orders', 'chat', 'attendance', 'tasks'];
                  const isOwner = u.role === 'owner' || u.role === 'superadmin';

                  return (
                    <tr key={u.id}>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${isOwner ? 'badge-primary' : 'badge-secondary'}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {isOwner ? (
                          <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '700' }}>👑 Full Admin Access (All Permissions Granted)</span>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11px' }}>
                            {[
                              { key: 'inventory', label: '📦 Stock' },
                              { key: 'pos', label: '🛒 POS' },
                              { key: 'orders', label: '🚚 Orders' },
                              { key: 'chat', label: '💬 Team Chat' },
                              { key: 'attendance', label: '⏱️ Punch In' },
                              { key: 'tasks', label: '📋 Tasks' },
                              { key: 'finance', label: '💵 Passbook' }
                            ].map(p => {
                              const checked = uPerms.includes(p.key);
                              return (
                                <label key={p.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: checked ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '6px', border: `1px solid ${checked ? 'var(--accent-primary)' : 'var(--border-color)'}`, cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handleToggleUserPermission(u, p.key)}
                                  />
                                  <span>{p.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-success">Active</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD/EDIT EMPLOYEE PROFILE */}
      {showEmpModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>{editingEmp ? 'Edit Employee Bio-Data' : 'Create New Employee Profile'}</h3>
              <button onClick={() => setShowEmpModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveEmployee}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-input" required placeholder="e.g. Tanvir Hossain" value={empForm.name} onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input type="text" className="form-input" placeholder="e.g. Senior Executive / Cashier" value={empForm.designation} onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input type="text" className="form-input" placeholder="Sales / Inventory" value={empForm.department} onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="text" className="form-input" placeholder="01711000000" value={empForm.phone} onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-input" placeholder="staff@gmail.com" value={empForm.email} onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Base Monthly Salary ({currency})</label>
                  <input type="number" step="0.01" className="form-input" placeholder="25000" value={empForm.base_salary} onChange={(e) => setEmpForm({ ...empForm, base_salary: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Overtime Rate / Hour ({currency})</label>
                  <input type="number" step="0.01" className="form-input" placeholder="150" value={empForm.overtime_rate} onChange={(e) => setEmpForm({ ...empForm, overtime_rate: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Weekly Off Day (সাপ্তাহিক ছুটির দিন)</label>
                  <select
                    className="form-select"
                    value={empForm.weekly_off_day || 'Friday'}
                    onChange={(e) => setEmpForm({ ...empForm, weekly_off_day: e.target.value })}
                  >
                    <option value="Friday">Friday (শুক্রবার)</option>
                    <option value="Saturday">Saturday (শনিবার)</option>
                    <option value="Sunday">Sunday (রবিবার)</option>
                    <option value="Monday">Monday (সোমবার)</option>
                    <option value="Tuesday">Tuesday (মঙ্গলবার)</option>
                    <option value="Wednesday">Wednesday (বুধবার)</option>
                    <option value="Thursday">Thursday (বৃহস্পতিবার)</option>
                    <option value="None">None (কোনো নির্দিষ্ট ছুটি নেই)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Holiday Extra Duty Allowance / Day ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="e.g. 1000 (খালি রাখলে 1.5x রেট কাউন্ট হবে)"
                    value={empForm.holiday_duty_allowance || ''}
                    onChange={(e) => setEmpForm({ ...empForm, holiday_duty_allowance: e.target.value })}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                    * ছুটির দিনে কাজ করলে অতিরিক্ত ডিউটি ভাতা/হাজিরা। 0 রাখলে মূল বেতনের ১.৫ গুণ কাউন্ট হবে।
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select className="form-select" value={empForm.blood_group} onChange={(e) => setEmpForm({ ...empForm, blood_group: e.target.value })}>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">NID Card Number</label>
                  <input type="text" className="form-input" placeholder="e.g. 1995123456789" value={empForm.nid_number} onChange={(e) => setEmpForm({ ...empForm, nid_number: e.target.value })} />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Joining Date</label>
                  <input type="date" className="form-input" value={empForm.joining_date} onChange={(e) => setEmpForm({ ...empForm, joining_date: e.target.value })} />
                </div>

                {/* Identity & Document Upload Section */}
                <div style={{ gridColumn: 'span 2', padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileCheck size={16} />
                    <span>NID Cards & Profile Document Uploads (এনআইডি ও ডকুমেন্টস)</span>
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    {/* Staff Photo */}
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '12px' }}>Staff Photo (ছবি)</label>
                      <input type="file" accept="image/*" className="form-input" style={{ fontSize: '11px', padding: '6px' }} onChange={(e) => handleFileUpload(e, 'photo_url')} />
                      {empForm.photo_url && (
                        <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--success)' }}>
                          ✓ Photo Uploaded (<a href={empForm.photo_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)' }}>View</a>)
                        </div>
                      )}
                    </div>

                    {/* NID Front */}
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '12px' }}>NID Front (সামনের অংশ)</label>
                      <input type="file" accept="image/*,application/pdf" className="form-input" style={{ fontSize: '11px', padding: '6px' }} onChange={(e) => handleFileUpload(e, 'nid_front_url')} />
                      {empForm.nid_front_url && (
                        <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--success)' }}>
                          ✓ NID Front Uploaded (<a href={empForm.nid_front_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)' }}>View</a>)
                        </div>
                      )}
                    </div>

                    {/* NID Back */}
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '12px' }}>NID Back (পেছনের অংশ)</label>
                      <input type="file" accept="image/*,application/pdf" className="form-input" style={{ fontSize: '11px', padding: '6px' }} onChange={(e) => handleFileUpload(e, 'nid_back_url')} />
                      {empForm.nid_back_url && (
                        <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--success)' }}>
                          ✓ NID Back Uploaded (<a href={empForm.nid_back_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)' }}>View</a>)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Multi-Document Section with Titles */}
                  <div className="form-group" style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label className="form-label" style={{ fontSize: '12px', margin: 0 }}>Other Certificates / CV / Contract (শিরোনামসহ অন্যান্য ডকুমেন্ট)</label>
                      <button type="button" onClick={handleAddDocRow} className="btn btn-secondary btn-sm" style={{ fontSize: '11px', padding: '4px 8px' }}>
                        <Plus size={12} /> + Add Document
                      </button>
                    </div>

                    {(empForm.documents_list || []).map((doc, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 30px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '11px', padding: '6px' }}
                          placeholder="Document Title (e.g. CV / Certificate)"
                          value={doc.title || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEmpForm(prev => {
                              const list = [...(prev.documents_list || [])];
                              list[idx] = { ...list[idx], title: val };
                              return { ...prev, documents_list: list };
                            });
                          }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="file"
                            accept="image/*,application/pdf,.doc,.docx"
                            className="form-input"
                            style={{ fontSize: '11px', padding: '4px' }}
                            onChange={(e) => handleDocItemUpload(e, idx)}
                          />
                          {doc.url && (
                            <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--success)', whiteSpace: 'nowrap' }}>
                              ✓ View
                            </a>
                          )}
                        </div>
                        <button type="button" onClick={() => handleRemoveDocRow(idx)} className="btn btn-danger btn-icon btn-sm" style={{ padding: '4px' }}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowEmpModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DOCUMENTS & NID CARDS MODAL */}
      {selectedEmpForDocs && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>Employee Identity & Attached Documents</h3>
              <button onClick={() => setSelectedEmpForDocs(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px' }}>
                {selectedEmpForDocs.photo_url ? (
                  <img src={selectedEmpForDocs.photo_url} alt={selectedEmpForDocs.name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)' }} />
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                    {selectedEmpForDocs.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{selectedEmpForDocs.name}</h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Code: {selectedEmpForDocs.employee_code} | Dept: {selectedEmpForDocs.department}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>NID Number: <strong>{selectedEmpForDocs.nid_number || 'N/A'}</strong></div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* NID Front */}
                <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>🪪 NID Card Front (সামনের অংশ)</h4>
                  {selectedEmpForDocs.nid_front_url ? (
                    selectedEmpForDocs.nid_front_url.endsWith('.pdf') ? (
                      <a href={selectedEmpForDocs.nid_front_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={14} /> Open NID PDF
                      </a>
                    ) : (
                      <a href={selectedEmpForDocs.nid_front_url} target="_blank" rel="noreferrer">
                        <img src={selectedEmpForDocs.nid_front_url} alt="NID Front" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '6px' }} />
                      </a>
                    )
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No NID Front image uploaded.</div>
                  )}
                </div>

                {/* NID Back */}
                <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>🪪 NID Card Back (পেছনের অংশ)</h4>
                  {selectedEmpForDocs.nid_back_url ? (
                    selectedEmpForDocs.nid_back_url.endsWith('.pdf') ? (
                      <a href={selectedEmpForDocs.nid_back_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={14} /> Open NID PDF
                      </a>
                    ) : (
                      <a href={selectedEmpForDocs.nid_back_url} target="_blank" rel="noreferrer">
                        <img src={selectedEmpForDocs.nid_back_url} alt="NID Back" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '6px' }} />
                      </a>
                    )
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No NID Back image uploaded.</div>
                  )}
                </div>
              </div>

              {/* Other Documents List with Custom Titles */}
              <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px' }}>📄 Certificates & Profile Documents</h4>
                {(() => {
                  let docItems = [];
                  try {
                    docItems = selectedEmpForDocs.documents_url ? JSON.parse(selectedEmpForDocs.documents_url) : [];
                  } catch (e) {
                    if (selectedEmpForDocs.documents_url) docItems = [{ title: 'Attached Document', url: selectedEmpForDocs.documents_url }];
                  }

                  if (!Array.isArray(docItems) || docItems.length === 0 || !docItems.some(d => d.url)) {
                    return <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No additional documents attached.</div>;
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {docItems.map((doc, i) => doc.url && (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600' }}>
                            • {doc.title || `Document ${i + 1}`}
                          </span>
                          <a href={doc.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <ExternalLink size={12} /> View File
                          </a>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setSelectedEmpForDocs(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECORD EMPLOYEE LEAVE */}
      {showLeaveModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Record Employee Leave Application</h3>
              <button onClick={() => setShowLeaveModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateLeave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Select Employee *</label>
                  <select
                    className="form-select"
                    required
                    value={leaveForm.employee_id}
                    onChange={(e) => setLeaveForm({ ...leaveForm, employee_id: e.target.value })}
                  >
                    <option value="">Select Staff...</option>
                    {employeesList.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.employee_code})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Leave Type (ছুটির ধরন) *</label>
                  <select
                    className="form-select"
                    value={leaveForm.leave_type}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                  >
                    <option value="casual">🌴 Casual Leave (সাধারণ ছুটি)</option>
                    <option value="sick">🩺 Sick Leave (অসুস্থতাজনিত ছুটি)</option>
                    <option value="earned">⭐ Earned Leave (অর্জিত ছুটি)</option>
                    <option value="unpaid">❌ Unpaid Leave (বেতনহীন ছুটি)</option>
                    <option value="maternity">🤱 Maternity Leave (মাতৃত্বকালীন ছুটি)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Pay Category (বেতন ক্যাটাগরি) *</label>
                  <select
                    className="form-select"
                    value={leaveForm.leave_category}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leave_category: e.target.value })}
                  >
                    <option value="paid">✓ Paid Leave (বেতনসহ ছুটি - সেলারি কাটবে না)</option>
                    <option value="unpaid">❌ Unpaid Leave (বেতনহীন ছুটি - স্যালারি শিটে অটো টাকা কর্তন হবে)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={leaveForm.start_date}
                      onChange={(e) => {
                        const start = e.target.value;
                        const end = leaveForm.end_date || start;
                        const days = Math.max(1, Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1);
                        setLeaveForm({ ...leaveForm, start_date: start, total_days: days });
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">End Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={leaveForm.end_date}
                      onChange={(e) => {
                        const end = e.target.value;
                        const start = leaveForm.start_date || end;
                        const days = Math.max(1, Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1);
                        setLeaveForm({ ...leaveForm, end_date: end, total_days: days });
                      }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Total Days (মোট ছুটির দিন)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={leaveForm.total_days}
                    onChange={(e) => setLeaveForm({ ...leaveForm, total_days: Number(e.target.value || 1) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reason / Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Family emergency / Personal travel"
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowLeaveModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Submit & Record Leave</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DISBURSE SALARY WITH PASSBOOK SELECTION */}
      {showDisburseModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3>Disburse Net Salary ({selectedMonth})</h3>
              <button onClick={() => setShowDisburseModal(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleDisburseSalary}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                  <div>Employee: <strong>{showDisburseModal.name}</strong></div>
                  <div>Net Payable: <strong style={{ color: 'var(--success)', fontSize: '16px' }}>{currency}{showDisburseModal.net_payable.toFixed(2)}</strong></div>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Payment Account (Passbook Sync) *</label>
                  <select
                    className="form-select"
                    required
                    value={disburseAccount}
                    onChange={(e) => setDisburseAccount(e.target.value)}
                  >
                    <option value="">Select Account...</option>
                    {accountsList.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({currency}{a.balance})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowDisburseModal(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-success">Confirm Disbursement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ISSUE LOAN / ADVANCE */}
      {showLoanModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Disburse Employee Loan / Advance</h3>
              <button onClick={() => setShowLoanModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleDisburseLoan}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Select Employee *</label>
                  <select
                    className="form-select"
                    required
                    value={loanForm.employee_id}
                    onChange={(e) => setLoanForm({ ...loanForm, employee_id: e.target.value })}
                  >
                    <option value="">Select Staff...</option>
                    {employeesList.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employee_code})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Category / Type *</label>
                  <select
                    className="form-select"
                    value={loanForm.type}
                    onChange={(e) => setLoanForm({ ...loanForm, type: e.target.value })}
                  >
                    <option value="loan">💰 Personal Loan (পার্সোনাল লোন)</option>
                    <option value="advance">⚡ Salary Advance (অগ্রিম বেতন)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Total Disbursed Amount ({currency}) *</label>
                  <input type="number" step="0.01" className="form-input" required placeholder="e.g. 5000" value={loanForm.loan_amount} onChange={(e) => setLoanForm({ ...loanForm, loan_amount: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Auto Deduct from Monthly Salary Sheet? *</label>
                  <select
                    className="form-select"
                    value={loanForm.auto_deduct_salary ? '1' : '0'}
                    onChange={(e) => setLoanForm({ ...loanForm, auto_deduct_salary: e.target.value === '1' })}
                  >
                    <option value="1">✓ Yes (মাসিক বেতন থেকে অটো কর্তন হবে)</option>
                    <option value="0">❌ No (অটো কর্তন হবে না - ম্যানুয়াল পরিশোধ)</option>
                  </select>
                </div>

                {loanForm.auto_deduct_salary && (
                  <div className="form-group">
                    <label className="form-label">Monthly Deduction / EMI Amount ({currency})</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="e.g. 1000 (খালি রাখলে পুরোটা একসাথে কাটবে)"
                      value={loanForm.monthly_installment}
                      onChange={(e) => setLoanForm({ ...loanForm, monthly_installment: e.target.value })}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      * খালি রাখলে বা 0 দিলে পরবর্তী মাসের বেতনের দিন সম্পূর্ণ টাকা একসাথে কর্তন হবে। অথবা কিস্তির পরিমাণ (যেমন 1000) লিখুন।
                    </span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Source Cash / Bank Account *</label>
                  <select
                    className="form-select"
                    required
                    value={loanForm.account_id}
                    onChange={(e) => setLoanForm({ ...loanForm, account_id: e.target.value })}
                  >
                    <option value="">Select Account...</option>
                    {accountsList.map(a => <option key={a.id} value={a.id}>{a.name} ({currency}{a.balance})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes / Reason</label>
                  <input type="text" className="form-input" placeholder="e.g. Medical emergency advance" value={loanForm.notes} onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowLoanModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Disburse Amount</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ISSUE BONUS */}
      {showBonusModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Issue Bonus or Allowance</h3>
              <button onClick={() => setShowBonusModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateBonus}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Bonus Title *</label>
                  <input type="text" className="form-input" required placeholder="e.g. Eid Festival Bonus" value={bonusForm.title} onChange={(e) => setBonusForm({ ...bonusForm, title: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Applicable Salary Month (কোন মাসের বেতনের সাথে যুক্ত হবে) *</label>
                  <input
                    type="month"
                    className="form-input"
                    required
                    value={bonusForm.month_year || new Date().toISOString().slice(0, 7)}
                    onChange={(e) => setBonusForm({ ...bonusForm, month_year: e.target.value })}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '2px', display: 'block' }}>
                    * সিলেক্টকৃত মাসের সেলারি শিটের বোনাস কলামে টাকাটি স্বয়ংক্রিয়ভাবে যোগ হয়ে যাবে।
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Employee (Leave blank for All Staff)</label>
                  <select
                    className="form-select"
                    value={bonusForm.employee_id}
                    onChange={(e) => setBonusForm({ ...bonusForm, employee_id: e.target.value })}
                  >
                    <option value="">All Active Employees</option>
                    {employeesList.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employee_code})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Bonus Amount ({currency}) *</label>
                  <input type="number" step="0.01" className="form-input" required placeholder="2000" value={bonusForm.amount} onChange={(e) => setBonusForm({ ...bonusForm, amount: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowBonusModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Record Bonus</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INDIVIDUAL PAYSLIP MODAL */}
      {selectedEmpForPayslip && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>Employee Salary Payslip</h3>
              <button onClick={() => setSelectedEmpForPayslip(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ background: '#fff', color: '#000', padding: '24px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>{shopSettings?.name || 'PROFITWAY SAAS'}</h2>
                  <div style={{ fontSize: '12px', color: '#555' }}>Monthly Salary Payslip</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px' }}>
                  <div><strong>Month:</strong> {selectedMonth}</div>
                  <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', marginBottom: '16px' }}>
                <div><strong>Employee:</strong> {selectedEmpForPayslip.name}</div>
                <div><strong>EMP ID:</strong> {selectedEmpForPayslip.employee_code}</div>
                <div><strong>Designation:</strong> {selectedEmpForPayslip.designation}</div>
                <div><strong>Phone:</strong> {selectedEmpForPayslip.phone || 'N/A'}</div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #ccc' }}>
                    <th style={{ textAlign: 'left', padding: '6px' }}>Earnings / Deductions</th>
                    <th style={{ textAlign: 'right', padding: '6px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style={{ padding: '6px' }}>Base Monthly Salary</td><td style={{ textAlign: 'right', padding: '6px' }}>{currency}{selectedEmpForPayslip.base_salary.toFixed(2)}</td></tr>
                  <tr><td style={{ padding: '6px' }}>Overtime Pay</td><td style={{ textAlign: 'right', padding: '6px' }}>+{currency}{selectedEmpForPayslip.overtime_pay.toFixed(2)}</td></tr>
                  <tr><td style={{ padding: '6px' }}>Bonus & Allowances</td><td style={{ textAlign: 'right', padding: '6px' }}>+{currency}{selectedEmpForPayslip.bonus_amount.toFixed(2)}</td></tr>
                  <tr><td style={{ padding: '6px', color: 'red' }}>Absent Deduction ({selectedEmpForPayslip.absent_days} days)</td><td style={{ textAlign: 'right', padding: '6px', color: 'red' }}>-{currency}{selectedEmpForPayslip.absent_penalty.toFixed(2)}</td></tr>
                  <tr><td style={{ padding: '6px', color: 'red' }}>Loan EMI Deduction</td><td style={{ textAlign: 'right', padding: '6px', color: 'red' }}>-{currency}{selectedEmpForPayslip.loan_deduction.toFixed(2)}</td></tr>
                  <tr><td style={{ padding: '6px', color: 'red' }}>Provident Fund (5% PF)</td><td style={{ textAlign: 'right', padding: '6px', color: 'red' }}>-{currency}{selectedEmpForPayslip.pf_deduction.toFixed(2)}</td></tr>
                  <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold' }}>
                    <td style={{ padding: '8px 6px', fontSize: '15px' }}>NET PAYABLE SALARY</td>
                    <td style={{ textAlign: 'right', padding: '8px 6px', fontSize: '15px' }}>{currency}{selectedEmpForPayslip.net_payable.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', fontSize: '11px' }}>
                <div>____________________<br />Employee Signature</div>
                <div>____________________<br />Authorized Signature</div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => window.print()} className="btn btn-primary"><Printer size={15} /> Print Payslip</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: CONFIGURE PROVIDENT FUND (PF) */}
      {editingPf && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>Configure Provident Fund (PF) Settings</h3>
              <button onClick={() => setEditingPf(null)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleSavePF}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                  <div>Staff: <strong>{editingPf.name} ({editingPf.employee_code})</strong></div>
                  <div>Base Salary: <strong>{currency}{Number(editingPf.base_salary).toFixed(2)}</strong></div>
                </div>

                <div className="form-group">
                  <label className="form-label">Provident Fund (PF) Status *</label>
                  <select
                    className="form-select"
                    value={pfForm.status}
                    onChange={(e) => setPfForm({ ...pfForm, status: e.target.value })}
                  >
                    <option value="active">🟢 ON - Active (স্যালারি থেকে কর্তন হবে)</option>
                    <option value="inactive">🔴 OFF - Inactive (কোনো কর্তন হবে না)</option>
                  </select>
                </div>

                {pfForm.status === 'active' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Staff Contribution (%) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        required
                        placeholder="e.g. 5"
                        value={pfForm.employee_contrib_pct}
                        onChange={(e) => setPfForm({ ...pfForm, employee_contrib_pct: e.target.value })}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        * স্যালারি শিটে কর্মী বেতন থেকে কর্তন: {currency}{((Number(editingPf.base_salary || 0) * Number(pfForm.employee_contrib_pct || 0)) / 100).toFixed(2)} / মাস
                      </span>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Company Contribution (%) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        required
                        placeholder="e.g. 5"
                        value={pfForm.employer_contrib_pct}
                        onChange={(e) => setPfForm({ ...pfForm, employer_contrib_pct: e.target.value })}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        * প্রতিষ্ঠান থেকে যুক্ত হবে: {currency}{((Number(editingPf.base_salary || 0) * Number(pfForm.employer_contrib_pct || 0)) / 100).toFixed(2)} / মাস
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setEditingPf(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save PF Settings</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE STAFF LOGIN ACCOUNT */}
      {showUserModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3>Create Staff Login Credentials</h3>
              <button onClick={() => setShowUserModal(false)} className="btn btn-secondary btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateUserAccount}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Select Employee (স্টাফ সিলেক্ট করুন) *</label>
                  <select
                    className="form-select"
                    value={userFormData.employee_id || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedEmp = employeesList.find(emp => Number(emp.id) === Number(selectedId));
                      if (selectedEmp) {
                        setUserFormData(prev => ({
                          ...prev,
                          employee_id: selectedEmp.id,
                          name: selectedEmp.name,
                          email: selectedEmp.email || prev.email
                        }));
                      } else {
                        setUserFormData(prev => ({ ...prev, employee_id: '' }));
                      }
                    }}
                  >
                    <option value="">Choose Staff Profile from Directory...</option>
                    {employeesList.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.employee_code} - {e.designation})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Adiat Rahman"
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Login Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    required
                    placeholder="staff@shop.com"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    required
                    placeholder="At least 6 characters"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select
                    className="form-select"
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  >
                    <option value="cashier">Cashier (ক্যাশিয়ার / বিক্রয়কর্মী)</option>
                    <option value="manager">Manager (ম্যানেজার)</option>
                  </select>
                </div>

                {/* Granular Permissions Checkbox Box */}
                <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: '700', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={16} />
                    <span>Module Access & Permissions (স্টাফকে কী কী অনুমতি দেওয়া হবে)</span>
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      { key: 'inventory', label: '📦 Stock & Inventory', desc: 'স্টক দেখা ও আপডেট করা' },
                      { key: 'pos', label: '🛒 POS / Counter Sale', desc: 'কাউন্টারে কাস্টমারের বিক্রি করা' },
                      { key: 'orders', label: '🚚 Sales & Courier Orders', desc: 'অর্ডার লিস্ট ও কুরিয়ার রিটার্ন' },
                      { key: 'chat', label: '💬 Team Chat System', desc: 'টিম চ্যাটে কথা বলা' },
                      { key: 'attendance', label: '⏱️ Punch In / Attendance', desc: 'নিজের অফিসে ঢোকা ও বের হওয়া' },
                      { key: 'tasks', label: '📋 Task Manager', desc: 'অ্যাসাইনকৃত কাজ দেখা ও সম্পন্ন করা' },
                      { key: 'finance', label: '💵 Finance & Passbook', desc: 'ব্যাংক অ্যাকাউন্ট ও খরচ দেখা' }
                    ].map(p => {
                      const isChecked = (userFormData.permissions || []).includes(p.key);
                      return (
                        <label key={p.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: isChecked ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-primary)', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isChecked ? 'var(--accent-primary)' : 'var(--border-color)'}`, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            style={{ marginTop: '2px' }}
                            onChange={() => {
                              let current = Array.isArray(userFormData.permissions) ? [...userFormData.permissions] : ['inventory', 'pos', 'orders', 'chat', 'attendance', 'tasks'];
                              if (current.includes(p.key)) {
                                current = current.filter(k => k !== p.key);
                              } else {
                                current.push(p.key);
                              }
                              setUserFormData({ ...userFormData, permissions: current });
                            }}
                          />
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '700' }}>{p.label}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{p.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowUserModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Staff Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
