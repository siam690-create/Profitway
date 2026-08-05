import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, UserPlus, Shield, Trash2, Key, CheckCircle, X, Edit3, Lock, 
  Calendar, Clock, CreditCard, DollarSign, Gift, FileText, Printer, 
  Award, Briefcase, Phone, Mail, QrCode, Plus, Search, Building2, Check, AlertCircle, FileCheck,
  Upload, Image, Eye, ExternalLink, File
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
    base_salary: '', hourly_rate: '', overtime_rate: '', payment_method: 'Cash', account_number: ''
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

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ employee_id: '', leave_type: 'casual', start_date: new Date().toISOString().slice(0, 10), end_date: new Date().toISOString().slice(0, 10), total_days: 1, reason: '' });

  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanForm, setLoanForm] = useState({ employee_id: '', loan_amount: '', monthly_installment: '', account_id: '', notes: '' });

  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusForm, setBonusForm] = useState({ employee_id: '', title: 'Eid Festival Bonus', amount: '', bonus_date: new Date().toISOString().slice(0, 10), notes: '' });

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
    if (activeTab === 'salary-sheet' || activeTab === 'payroll') fetchSalarySheet();
  }, [activeTab, attendanceDate, selectedMonth]);

  // Handlers
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    try {
      const url = editingEmp ? `/api/staff/employees/${editingEmp.id}` : '/api/staff/employees';
      const method = editingEmp ? 'PUT' : 'POST';
      const res = await authFetch(url, { method, body: JSON.stringify(empForm) });
      const data = await res.json();
      if (res.ok) {
        setShowEmpModal(false);
        fetchEmployees();
        alert(data.message || 'Employee profile saved successfully!');
      } else alert(`Error: ${data.error}`);
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleMarkAttendance = async (empId, status, inTime, outTime, otHours) => {
    try {
      const payload = {
        date: attendanceDate,
        attendanceList: [{ employee_id: empId, status, in_time: inTime, out_time: outTime, overtime_hours: otHours }]
      };
      const res = await authFetch('/api/staff/attendance/batch', { method: 'POST', body: JSON.stringify(payload) });
      if (res.ok) fetchAttendance();
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleCreateLeave = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/staff/leaves', { method: 'POST', body: JSON.stringify(leaveForm) });
      const data = await res.json();
      if (res.ok) {
        setShowLeaveModal(false);
        fetchLeaves();
        alert('Leave recorded successfully!');
      } else alert(`Error: ${data.error}`);
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
        alert(data.message || 'Loan disbursed successfully!');
      } else alert(`Error: ${data.error}`);
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleCreateBonus = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/staff/bonuses', { method: 'POST', body: JSON.stringify(bonusForm) });
      const data = await res.json();
      if (res.ok) {
        setShowBonusModal(false);
        fetchBonuses();
        alert('Bonus recorded successfully!');
      } else alert(`Error: ${data.error}`);
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

      {/* Navigation Sub-Tabs Bar */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => setActiveTab('employees')} className={`btn btn-sm ${activeTab === 'employees' ? 'btn-primary' : 'btn-secondary'}`}>
          👤 Employees ({employeesList.length})
        </button>
        <button onClick={() => setActiveTab('attendance')} className={`btn btn-sm ${activeTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}>
          📅 Attendance Log
        </button>
        <button onClick={() => setActiveTab('leaves')} className={`btn btn-sm ${activeTab === 'leaves' ? 'btn-primary' : 'btn-secondary'}`}>
          🏖️ Leave Manager
        </button>
        <button onClick={() => setActiveTab('salary-sheet')} className={`btn btn-sm ${activeTab === 'salary-sheet' ? 'btn-primary' : 'btn-secondary'}`}>
          📄 Master Salary Sheet
        </button>
        <button onClick={() => setActiveTab('payroll')} className={`btn btn-sm ${activeTab === 'payroll' ? 'btn-primary' : 'btn-secondary'}`}>
          💳 Payroll Disbursement
        </button>
        <button onClick={() => setActiveTab('bonuses')} className={`btn btn-sm ${activeTab === 'bonuses' ? 'btn-primary' : 'btn-secondary'}`}>
          🎁 Bonuses & Allowances
        </button>
        <button onClick={() => setActiveTab('loans')} className={`btn btn-sm ${activeTab === 'loans' ? 'btn-primary' : 'btn-secondary'}`}>
          💸 Loans & Advances
        </button>
        <button onClick={() => setActiveTab('pf')} className={`btn btn-sm ${activeTab === 'pf' ? 'btn-primary' : 'btn-secondary'}`}>
          🏦 Provident Fund (PF)
        </button>
        <button onClick={() => setActiveTab('idcards')} className={`btn btn-sm ${activeTab === 'idcards' ? 'btn-primary' : 'btn-secondary'}`}>
          🎴 Employee ID Cards
        </button>
        <button onClick={() => setActiveTab('users')} className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}>
          🔐 System Roles ({usersList.length})
        </button>
      </div>

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
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
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
                              setEditingEmp(emp);
                              setEmpForm({
                                ...emp,
                                joining_date: emp.joining_date ? new Date(emp.joining_date).toISOString().slice(0, 10) : '',
                                nid_number: emp.nid_number || '',
                                photo_url: emp.photo_url || '',
                                nid_front_url: emp.nid_front_url || '',
                                nid_back_url: emp.nid_back_url || '',
                                documents_url: emp.documents_url || ''
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
      {activeTab === 'attendance' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Daily Attendance Log</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Attendance Date:</label>
              <input
                type="date"
                className="form-input"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                style={{ width: '160px' }}
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th>Attendance Status</th>
                  <th>In Time</th>
                  <th>Out Time</th>
                  <th>Overtime Hours</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {employeesList.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>No active employees found.</td></tr>
                ) : (
                  employeesList.map(emp => {
                    const att = attendanceList.find(a => Number(a.employee_id) === Number(emp.id)) || {};
                    const currentStatus = att.status || 'present';

                    return (
                      <tr key={emp.id}>
                        <td>
                          <strong>{emp.name}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.employee_code}</div>
                        </td>
                        <td>{emp.designation}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleMarkAttendance(emp.id, 'present', att.in_time, att.out_time, att.overtime_hours)}
                              className={`btn btn-sm ${currentStatus === 'present' ? 'btn-success' : 'btn-secondary'}`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(emp.id, 'absent', att.in_time, att.out_time, att.overtime_hours)}
                              className={`btn btn-sm ${currentStatus === 'absent' ? 'btn-danger' : 'btn-secondary'}`}
                            >
                              Absent
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(emp.id, 'late', att.in_time, att.out_time, att.overtime_hours)}
                              className={`btn btn-sm ${currentStatus === 'late' ? 'btn-warning' : 'btn-secondary'}`}
                            >
                              Late
                            </button>
                          </div>
                        </td>
                        <td>
                          <input
                            type="time"
                            className="form-input"
                            style={{ padding: '2px 6px', fontSize: '12px' }}
                            defaultValue={att.in_time || '09:00'}
                            onBlur={(e) => handleMarkAttendance(emp.id, currentStatus, e.target.value, att.out_time, att.overtime_hours)}
                          />
                        </td>
                        <td>
                          <input
                            type="time"
                            className="form-input"
                            style={{ padding: '2px 6px', fontSize: '12px' }}
                            defaultValue={att.out_time || '18:00'}
                            onBlur={(e) => handleMarkAttendance(emp.id, currentStatus, att.in_time, e.target.value, att.overtime_hours)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.5"
                            className="form-input"
                            style={{ width: '80px', padding: '2px 6px', fontSize: '12px' }}
                            defaultValue={att.overtime_hours || 0}
                            onBlur={(e) => handleMarkAttendance(emp.id, currentStatus, att.in_time, att.out_time, e.target.value)}
                          />
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{att.notes || 'Recorded'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leavesList.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>No leave applications recorded.</td></tr>
                ) : (
                  leavesList.map(l => (
                    <tr key={l.id}>
                      <td><strong>{l.employee_name}</strong> ({l.employee_code})</td>
                      <td style={{ textTransform: 'capitalize' }}>{l.leave_type} Leave</td>
                      <td>{new Date(l.start_date).toLocaleDateString()}</td>
                      <td>{new Date(l.end_date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: '700' }}>{l.total_days} Days</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{l.reason || 'Personal'}</td>
                      <td>
                        <span className="badge badge-success" style={{ textTransform: 'capitalize' }}>{l.status}</span>
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
                  <th>Present / Absent</th>
                  <th>Overtime Pay</th>
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
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.designation}</div>
                      </td>
                      <td style={{ fontWeight: '700' }}>{currency}{item.base_salary.toFixed(2)}</td>
                      <td style={{ fontSize: '12px' }}>
                        <span style={{ color: 'var(--success)' }}>{item.present_days}P</span> / <span style={{ color: 'var(--danger)' }}>{item.absent_days}A</span>
                      </td>
                      <td style={{ color: 'var(--success)' }}>+{currency}{item.overtime_pay.toFixed(2)}</td>
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
                  <th>Bonus Date</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {bonusesList.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>No bonuses issued.</td></tr>
                ) : (
                  bonusesList.map(b => (
                    <tr key={b.id}>
                      <td><strong>{b.title}</strong></td>
                      <td>{b.employee_name}</td>
                      <td style={{ fontWeight: '700', color: '#8b5cf6' }}>+{currency}{Number(b.amount).toFixed(2)}</td>
                      <td>{new Date(b.bonus_date).toLocaleDateString()}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{b.notes || 'Festival Allowance'}</td>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Employee Loans & Advance Ledger</h3>
            <button onClick={() => setShowLoanModal(true)} className="btn btn-primary">
              <DollarSign size={15} />
              <span>+ Disburse Employee Loan</span>
            </button>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Loan Amount</th>
                  <th>Repaid Amount</th>
                  <th>Pending Loan Due</th>
                  <th>Monthly EMI</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loansList.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>No employee loans active.</td></tr>
                ) : (
                  loansList.map(l => {
                    const pending = Number(l.loan_amount) - Number(l.paid_amount || 0);

                    return (
                      <tr key={l.id}>
                        <td><strong>{l.employee_name}</strong></td>
                        <td style={{ fontWeight: '700' }}>{currency}{Number(l.loan_amount).toFixed(2)}</td>
                        <td style={{ color: 'var(--success)' }}>{currency}{Number(l.paid_amount || 0).toFixed(2)}</td>
                        <td style={{ fontWeight: '800', color: pending > 0 ? 'var(--danger)' : 'var(--success)' }}>
                          {currency}{pending.toFixed(2)}
                        </td>
                        <td>{currency}{Number(l.monthly_installment || 0).toFixed(2)} / month</td>
                        <td>
                          <span className={`badge ${l.status === 'cleared' ? 'badge-success' : 'badge-danger'}`}>
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
        </div>
      )}

      {/* 8. PROVIDENT FUND (PF) TAB */}
      {activeTab === 'pf' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Provident Fund (PF) Treasury Ledger</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            5% Employee Contribution + 5% Employer Contribution accumulated monthly during salary disbursement.
          </p>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th>Monthly PF Contribution</th>
                  <th>Total Accumulated Treasury Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {employeesList.map(emp => {
                  const monthlyPf = Number(emp.base_salary || 0) * 0.05;
                  const estAccum = monthlyPf * 2 * 12; // Example 12-month accumulated treasury balance

                  return (
                    <tr key={emp.id}>
                      <td><strong>{emp.name}</strong> ({emp.employee_code})</td>
                      <td>{emp.designation}</td>
                      <td>{currency}{monthlyPf.toFixed(2)} / month (5%)</td>
                      <td style={{ fontWeight: '800', color: 'var(--success)', fontSize: '15px' }}>
                        {currency}{estAccum.toFixed(2)}
                      </td>
                      <td><span className="badge badge-success">ACTIVE FUND</span></td>
                    </tr>
                  );
                })}
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
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Shop Admin & Staff Logins</h3>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Module Permissions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td><span className="badge badge-primary">{u.role.toUpperCase()}</span></td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {u.permissions ? u.permissions.join(', ') : 'Full Access'}
                    </td>
                  </tr>
                ))}
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

                  {/* Other Documents */}
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px' }}>Other Certificates / CV / Contract (অন্যান্য ডকুমেন্ট)</label>
                    <input type="file" accept="image/*,application/pdf,.doc,.docx" className="form-input" style={{ fontSize: '11px', padding: '6px' }} onChange={(e) => handleFileUpload(e, 'documents_url')} />
                    {empForm.documents_url && (
                      <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--success)' }}>
                        ✓ Document Uploaded (<a href={empForm.documents_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)' }}>View File</a>)
                      </div>
                    )}
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

              {/* Other Documents */}
              <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>📄 Certificates & CV Documents</h4>
                {selectedEmpForDocs.documents_url ? (
                  <a href={selectedEmpForDocs.documents_url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <ExternalLink size={14} /> View Attached Document / Certificate
                  </a>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No additional documents attached.</div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setSelectedEmpForDocs(null)} className="btn btn-secondary">Close</button>
            </div>
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

      {/* MODAL 3: ISSUE LOAN */}
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
                  <label className="form-label">Loan Amount ({currency}) *</label>
                  <input type="number" step="0.01" className="form-input" required placeholder="5000" value={loanForm.loan_amount} onChange={(e) => setLoanForm({ ...loanForm, loan_amount: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Monthly EMI Deduction ({currency})</label>
                  <input type="number" step="0.01" className="form-input" placeholder="1000" value={loanForm.monthly_installment} onChange={(e) => setLoanForm({ ...loanForm, monthly_installment: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Source Cash Account *</label>
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
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowLoanModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Disburse Loan</button>
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
    </div>
  );
};
