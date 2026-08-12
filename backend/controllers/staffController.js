const db = require('../config/db');
const { hashPassword } = require('../utils/auth');

// Get all staff members for current tenant shop
exports.getStaff = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query(
      'SELECT id, tenant_id, name, email, role, permissions, is_active, created_at FROM users WHERE tenant_id = ? ORDER BY id ASC',
      [tenantId]
    );

    const parsedRows = rows.map(u => ({
      ...u,
      permissions: u.permissions ? JSON.parse(u.permissions) : null
    }));

    res.json(parsedRows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new staff account for current tenant shop with custom permissions
exports.createStaff = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, email, password, role, permissions } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, Email, Password, and Role are required.' });
    }

    if (!['manager', 'cashier'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either Manager or Cashier.' });
    }

    // Check if tenant reached max staff limit for their plan
    const [tenantRows] = await db.query(
      `SELECT t.*, p.max_staff 
       FROM tenants t
       LEFT JOIN plans p ON p.code = t.subscription_status
       WHERE t.id = ?`,
      [tenantId]
    );

    const maxStaffAllowed = tenantRows[0]?.max_staff || 5;
    const [currentStaff] = await db.query('SELECT COUNT(id) AS count FROM users WHERE tenant_id = ?', [tenantId]);

    if (currentStaff[0].count >= maxStaffAllowed) {
      return res.status(400).json({
        error: `Staff limit reached. Your subscription plan allows up to ${maxStaffAllowed} staff registers.`
      });
    }

    // Check email uniqueness
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const hashedPassword = await hashPassword(password);
    const permString = (permissions && Array.isArray(permissions)) ? JSON.stringify(permissions) : null;

    const [result] = await db.query(
      'INSERT INTO users (tenant_id, name, email, password_hash, role, permissions) VALUES (?, ?, ?, ?, ?, ?)',
      [tenantId, name, email, hashedPassword, role, permString]
    );

    res.status(201).json({
      message: 'Staff account created successfully',
      staffId: result.insertId,
      name,
      email,
      role
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Toggle active status or update staff role & permissions
exports.updateStaff = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { role, is_active, permissions } = req.body;

    const [existing] = await db.query('SELECT id, role FROM users WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Staff account not found.' });
    }

    if (existing[0].role === 'owner') {
      return res.status(400).json({ error: 'Shop owner account cannot be edited or deactivated.' });
    }

    const permString = (permissions && Array.isArray(permissions)) ? JSON.stringify(permissions) : undefined;

    if (permissions !== undefined && role) {
      await db.query(
        'UPDATE users SET role = ?, permissions = ?, is_active = ? WHERE id = ? AND tenant_id = ?',
        [role, permString, is_active !== undefined ? (is_active ? 1 : 0) : 1, id, tenantId]
      );
    } else if (is_active !== undefined) {
      await db.query(
        'UPDATE users SET is_active = ? WHERE id = ? AND tenant_id = ?',
        [is_active ? 1 : 0, id, tenantId]
      );
    }

    res.json({ message: 'Staff status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete staff account
exports.deleteStaff = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const [existing] = await db.query('SELECT id, role FROM users WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Staff account not found.' });
    }

    if (existing[0].role === 'owner') {
      return res.status(400).json({ error: 'Shop owner account cannot be deleted.' });
    }

    await db.query('DELETE FROM users WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    res.json({ message: 'Staff account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// ENTERPRISE HR & PAYROLL OS MODULES
// ==========================================

// 1. Employee Directory & Profiles
exports.getEmployees = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query(
      'SELECT * FROM employees WHERE tenant_id = ? ORDER BY id DESC',
      [tenantId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      name, designation, department, phone, email, joining_date,
      nid_number, blood_group, emergency_contact_name, emergency_contact_phone,
      photo_url, nid_front_url, nid_back_url, documents_url,
      base_salary, hourly_rate, overtime_rate, payment_method, account_number,
      weekly_off_day, holiday_duty_allowance
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Employee name is required.' });

    // Format date string safely for MySQL DATE column
    const formattedJoiningDate = joining_date ? new Date(joining_date).toISOString().slice(0, 10) : null;

    // Generate unique code EMP-101
    const [last] = await db.query('SELECT id FROM employees WHERE tenant_id = ? ORDER BY id DESC LIMIT 1', [tenantId]);
    const empCode = `EMP-${(last[0]?.id || 0) + 101}`;

    const [result] = await db.query(
      `INSERT INTO employees (
        tenant_id, employee_code, name, designation, department, phone, email,
        joining_date, nid_number, blood_group, emergency_contact_name, emergency_contact_phone,
        photo_url, nid_front_url, nid_back_url, documents_url,
        base_salary, hourly_rate, overtime_rate, payment_method, account_number,
        weekly_off_day, holiday_duty_allowance
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId, empCode, name, designation || 'Staff', department || 'General', phone || null, email || null,
        formattedJoiningDate, nid_number || null, blood_group || null, emergency_contact_name || null, emergency_contact_phone || null,
        photo_url || null, nid_front_url || null, nid_back_url || null, documents_url || null,
        Number(base_salary || 0), Number(hourly_rate || 0), Number(overtime_rate || 0),
        payment_method || 'Cash', account_number || null,
        weekly_off_day || 'Friday', Number(holiday_duty_allowance || 0)
      ]
    );

    // Initialize Provident Fund entry
    await db.query(
      'INSERT INTO employee_pf (tenant_id, employee_id, employee_contrib_pct, employer_contrib_pct, accumulated_balance) VALUES (?, ?, 5.00, 5.00, 0.00)',
      [tenantId, result.insertId]
    );

    res.status(201).json({ message: 'Employee profile created successfully', employeeId: result.insertId, employee_code: empCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const {
      name, designation, department, phone, email, joining_date,
      nid_number, blood_group, emergency_contact_name, emergency_contact_phone,
      photo_url, nid_front_url, nid_back_url, documents_url,
      base_salary, hourly_rate, overtime_rate, payment_method, account_number, is_active,
      weekly_off_day, holiday_duty_allowance, status, termination_date, termination_reason
    } = req.body;

    const formattedJoiningDate = joining_date ? new Date(joining_date).toISOString().slice(0, 10) : null;
    const formattedTermDate = termination_date ? new Date(termination_date).toISOString().slice(0, 10) : null;
    const finalStatus = status || (is_active ? 'active' : 'inactive');

    await db.query(
      `UPDATE employees SET
        name = ?, designation = ?, department = ?, phone = ?, email = ?,
        joining_date = ?, nid_number = ?, blood_group = ?, emergency_contact_name = ?, emergency_contact_phone = ?,
        photo_url = ?, nid_front_url = ?, nid_back_url = ?, documents_url = ?,
        base_salary = ?, hourly_rate = ?, overtime_rate = ?, payment_method = ?, account_number = ?, is_active = ?,
        weekly_off_day = ?, holiday_duty_allowance = ?, status = ?, termination_date = ?, termination_reason = ?
      WHERE id = ? AND tenant_id = ?`,
      [
        name, designation, department, phone, email,
        formattedJoiningDate, nid_number, blood_group, emergency_contact_name, emergency_contact_phone,
        photo_url, nid_front_url, nid_back_url, documents_url,
        Number(base_salary || 0), Number(hourly_rate || 0), Number(overtime_rate || 0), payment_method, account_number, is_active ? 1 : 0,
        weekly_off_day || 'Friday', Number(holiday_duty_allowance || 0),
        finalStatus, formattedTermDate, termination_reason || null,
        id, tenantId
      ]
    );

    res.json({ message: 'Employee profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.terminateEmployee = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { status, termination_date, termination_reason, deactivate_login } = req.body;

    const [empRows] = await db.query('SELECT id, email, name FROM employees WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (empRows.length === 0) {
      return res.status(404).json({ error: 'Employee not found.' });
    }
    const emp = empRows[0];

    const finalStatus = status || 'terminated';
    const termDate = termination_date ? new Date(termination_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

    // 1. Update Employee record to terminated/resigned & inactive
    await db.query(
      `UPDATE employees SET status = ?, is_active = 0, termination_date = ?, termination_reason = ? WHERE id = ? AND tenant_id = ?`,
      [finalStatus, termDate, termination_reason || null, id, tenantId]
    );

    // 2. Deactivate login credentials if requested
    if (deactivate_login && emp.email) {
      await db.query(
        'UPDATE users SET is_active = 0 WHERE email = ? AND tenant_id = ? AND role != "owner"',
        [emp.email, tenantId]
      );
    }

    res.json({
      message: `Employee "${emp.name}" marked as ${finalStatus === 'resigned' ? 'Resigned' : 'Terminated'} & deactivated successfully.`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    await db.query('DELETE FROM employees WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    res.json({ message: 'Employee profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Attendance Management
exports.getAttendance = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { date, employee_id } = req.query;

    let whereClause = 'WHERE a.tenant_id = ?';
    let params = [tenantId];

    if (date) {
      whereClause += ' AND a.date = ?';
      params.push(date);
    }
    if (employee_id) {
      whereClause += ' AND a.employee_id = ?';
      params.push(employee_id);
    }

    const [rows] = await db.query(
      `SELECT a.*, e.name as employee_name, e.employee_code, e.designation, e.weekly_off_day, e.holiday_duty_allowance
       FROM employee_attendance a
       JOIN employees e ON e.id = a.employee_id
       ${whereClause}
       ORDER BY a.date DESC, e.name ASC`,
      params
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markAttendanceBatch = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { date, attendanceList } = req.body;

    if (!date || !Array.isArray(attendanceList)) {
      return res.status(400).json({ error: 'Date and attendanceList array are required.' });
    }

    for (const item of attendanceList) {
      const { employee_id, status, in_time, out_time, overtime_hours, late_minutes, notes } = item;

      // Upsert attendance record for that employee and date
      const [existing] = await db.query(
        'SELECT id FROM employee_attendance WHERE tenant_id = ? AND employee_id = ? AND date = ?',
        [tenantId, employee_id, date]
      );

      if (existing.length > 0) {
        await db.query(
          `UPDATE employee_attendance SET
            status = ?, in_time = ?, out_time = ?, overtime_hours = ?, late_minutes = ?, notes = ?
          WHERE id = ?`,
          [status || 'present', in_time || null, out_time || null, Number(overtime_hours || 0), Number(late_minutes || 0), notes || null, existing[0].id]
        );
      } else {
        await db.query(
          `INSERT INTO employee_attendance (tenant_id, employee_id, date, status, in_time, out_time, overtime_hours, late_minutes, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [tenantId, employee_id, date, status || 'present', in_time || null, out_time || null, Number(overtime_hours || 0), Number(late_minutes || 0), notes || null]
        );
      }
    }

    res.json({ message: 'Attendance records saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Leave Management
exports.getLeaves = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query(
      `SELECT l.*, e.name as employee_name, e.employee_code, e.designation
       FROM employee_leaves l
       JOIN employees e ON e.id = l.employee_id
       WHERE l.tenant_id = ?
       ORDER BY l.id DESC`,
      [tenantId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createLeave = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { employee_id, leave_type, leave_category, start_date, end_date, total_days, reason, status } = req.body;

    if (!employee_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'Employee, Start Date, and End Date are required.' });
    }

    const [result] = await db.query(
      `INSERT INTO employee_leaves (tenant_id, employee_id, leave_type, leave_category, start_date, end_date, total_days, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, employee_id, leave_type || 'casual', leave_category || 'paid', start_date, end_date, Number(total_days || 1), reason || null, status || 'approved']
    );

    res.status(201).json({ message: 'Leave record added successfully', leaveId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { status, approved_by } = req.body;

    await db.query(
      'UPDATE employee_leaves SET status = ?, approved_by = ? WHERE id = ? AND tenant_id = ?',
      [status, approved_by || 'Admin', id, tenantId]
    );

    res.json({ message: `Leave status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteLeave = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    await db.query('DELETE FROM employee_leaves WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    res.json({ message: 'Leave record deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Employee Loans & Advances
exports.getLoans = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query(
      `SELECT l.*, e.name as employee_name, e.employee_code, fa.name as account_name
       FROM employee_loans l
       JOIN employees e ON e.id = l.employee_id
       LEFT JOIN finance_accounts fa ON fa.id = l.account_id
       WHERE l.tenant_id = ?
       ORDER BY l.id DESC`,
      [tenantId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.disburseLoan = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { employee_id, type, loan_amount, auto_deduct_salary, monthly_installment, account_id, notes } = req.body;

    if (!employee_id || !loan_amount || !account_id) {
      return res.status(400).json({ error: 'Employee, Amount, and Disbursement Account are required.' });
    }

    const amount = Number(loan_amount);
    const loanType = type === 'advance' ? 'advance' : 'loan';
    const autoDeduct = auto_deduct_salary !== undefined ? (auto_deduct_salary ? 1 : 0) : 1;

    // Check account balance
    const [accRows] = await db.query('SELECT name, balance FROM finance_accounts WHERE id = ? AND tenant_id = ?', [account_id, tenantId]);
    if (accRows.length === 0) return res.status(400).json({ error: 'Selected account not found.' });

    if (Number(accRows[0].balance) < amount) {
      return res.status(400).json({ error: `Insufficient account balance in ${accRows[0].name}` });
    }

    // Insert loan / advance
    const [emp] = await db.query('SELECT name FROM employees WHERE id = ?', [employee_id]);
    const empName = emp[0]?.name || 'Employee';

    const [result] = await db.query(
      `INSERT INTO employee_loans (tenant_id, employee_id, type, loan_amount, paid_amount, auto_deduct_salary, monthly_installment, account_id, disbursement_date, notes, status)
       VALUES (?, ?, ?, ?, 0.00, ?, ?, ?, CURDATE(), ?, 'active')`,
      [tenantId, employee_id, loanType, amount, autoDeduct, Number(monthly_installment || 0), account_id, notes || null]
    );

    // Deduct from finance account
    await db.query('UPDATE finance_accounts SET balance = balance - ? WHERE id = ?', [amount, account_id]);

    const titlePrefix = loanType === 'advance' ? 'Salary Advance' : 'Personal Loan';

    // Record Passbook entry
    await db.query(
      `INSERT INTO account_transactions (tenant_id, account_id, type, debit, credit, reference_no, notes, transaction_date)
       VALUES (?, ?, 'Staff Loan Disbursement', ?, 0.00, ?, ?, NOW())`,
      [tenantId, account_id, amount, `EMP-LOAN-${result.insertId}`, `${titlePrefix} Disbursed to Staff: ${empName} (${notes || titlePrefix})`]
    );

    res.status(201).json({ message: `${titlePrefix} issued successfully and recorded in Passbook Ledger.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteLoan = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const [loans] = await db.query('SELECT * FROM employee_loans WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (loans.length === 0) return res.status(404).json({ error: 'Record not found.' });

    await db.query('DELETE FROM employee_loans WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    res.json({ message: 'Loan/Advance record deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. Bonuses & Allowances
exports.getBonuses = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query(
      `SELECT b.*, COALESCE(e.name, 'All Employees') as employee_name
       FROM employee_bonuses b
       LEFT JOIN employees e ON e.id = b.employee_id
       WHERE b.tenant_id = ?
       ORDER BY b.id DESC`,
      [tenantId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createBonus = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { title, employee_id, amount, month_year, bonus_date, notes } = req.body;

    if (!title || !amount) {
      return res.status(400).json({ error: 'Bonus title and amount are required.' });
    }

    const finalBonusDate = month_year ? `${month_year}-01` : (bonus_date || new Date().toISOString().slice(0, 10));

    const [result] = await db.query(
      `INSERT INTO employee_bonuses (tenant_id, employee_id, title, amount, bonus_date, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tenantId, employee_id || null, title, Number(amount), finalBonusDate, notes || null]
    );

    res.status(201).json({ message: 'Bonus/Allowance recorded successfully', bonusId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBonus = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const [existing] = await db.query('SELECT * FROM employee_bonuses WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Bonus record not found.' });
    }

    await db.query('DELETE FROM employee_bonuses WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    res.json({ message: 'Bonus/Allowance record deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 6. Master Monthly Salary Sheet & Payroll Disbursement
exports.getMonthlySalarySheet = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { month_year } = req.query; // format '2026-08'

    if (!month_year) return res.status(400).json({ error: 'Month & Year (e.g. 2026-08) is required.' });

    // Fetch active employees
    const [employees] = await db.query(
      'SELECT * FROM employees WHERE tenant_id = ? AND is_active = 1 ORDER BY name ASC',
      [tenantId]
    );

    const sheet = [];

    for (const emp of employees) {
      // 1. Attendance stats for month
      const [attRows] = await db.query(
        `SELECT 
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
          SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
          SUM(CASE WHEN status = 'half_day' THEN 1 ELSE 0 END) as half_days,
          SUM(CASE WHEN status = 'holiday_duty' THEN 1 ELSE 0 END) as holiday_duty_days,
          SUM(CASE WHEN status = 'weekly_off' THEN 1 ELSE 0 END) as weekly_off_days,
          SUM(COALESCE(overtime_hours, 0)) as total_overtime_hours
         FROM employee_attendance
         WHERE tenant_id = ? AND employee_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?`,
        [tenantId, emp.id, month_year]
      );

      // 2. Active Bonuses for month
      const [bonusRows] = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as total_bonus
         FROM employee_bonuses
         WHERE tenant_id = ? AND (employee_id = ? OR employee_id IS NULL) AND DATE_FORMAT(bonus_date, '%Y-%m') = ?`,
        [tenantId, emp.id, month_year]
      );

      // 3. Active Loans & Advances EMI (if auto_deduct_salary is not 0, and disbursed on or before this month)
      const [loanRows] = await db.query(
        `SELECT id, type, loan_amount, paid_amount, monthly_installment, auto_deduct_salary, disbursement_date
         FROM employee_loans
         WHERE tenant_id = ? AND employee_id = ? AND status = 'active'
           AND (auto_deduct_salary IS NULL OR auto_deduct_salary = 1)
           AND (disbursement_date IS NULL OR DATE_FORMAT(disbursement_date, '%Y-%m') <= ?)`,
        [tenantId, emp.id, month_year]
      );

      let loanDeduction = 0;
      let advanceDeduction = 0;

      for (const l of loanRows) {
        const remaining = Number(l.loan_amount) - Number(l.paid_amount);
        if (remaining > 0) {
          const emi = Number(l.monthly_installment);
          const deductAmt = emi > 0 ? Math.min(emi, remaining) : remaining;
          if (l.type === 'advance') {
            advanceDeduction += deductAmt;
          } else {
            loanDeduction += deductAmt;
          }
        }
      }

      const totalLoanAndAdvanceDeduction = loanDeduction + advanceDeduction;

      // 4. Existing disbursement records if already paid
      const [paidRows] = await db.query(
        'SELECT SUM(COALESCE(paid_amount, net_payable)) as total_paid FROM payroll WHERE tenant_id = ? AND (employee_id = ? OR staff_id = ?) AND month_year = ?',
        [tenantId, emp.id, emp.id, month_year]
      );

      const baseSalary = Number(emp.base_salary || 0);
      const perDaySalary = baseSalary / 30;

      // Overtime Pay
      const overtimePay = Number(attRows[0]?.total_overtime_hours || 0) * Number(emp.overtime_rate || 0);

      // Holiday / Extra Duty Pay
      const holidayDutyDays = Number(attRows[0]?.holiday_duty_days || 0);
      const holidayRate = Number(emp.holiday_duty_allowance || 0) > 0 ? Number(emp.holiday_duty_allowance) : (perDaySalary * 1.5);
      const holidayDutyPay = holidayDutyDays * holidayRate;

      // Absent & Half-day deductions
      const absentDays = Number(attRows[0]?.absent_days || 0);
      const halfDays = Number(attRows[0]?.half_days || 0);
      const absentPenalty = (absentDays * perDaySalary) + (halfDays * (perDaySalary * 0.5));

      const bonusAmt = Number(bonusRows[0]?.total_bonus || 0);

      // 5. Active Provident Fund (PF) contribution (only if PF is active for this employee)
      const [pfRows] = await db.query(
        "SELECT employee_contrib_pct FROM employee_pf WHERE tenant_id = ? AND employee_id = ? AND status = 'active'",
        [tenantId, emp.id]
      );
      const pfPct = pfRows.length > 0 ? Number(pfRows[0].employee_contrib_pct || 0) : 0;
      const pfDeduction = baseSalary * (pfPct / 100);

      const netPayable = Math.max(0, baseSalary + bonusAmt + overtimePay + holidayDutyPay - (absentPenalty + totalLoanAndAdvanceDeduction + pfDeduction));
      const totalPaid = Number(paidRows[0]?.total_paid || 0);
      const remainingDue = Math.max(0, netPayable - totalPaid);

      let status = 'pending';
      if (totalPaid > 0) {
        status = remainingDue <= 0.05 ? 'paid' : 'partial';
      }

      sheet.push({
        employee_id: emp.id,
        employee_code: emp.employee_code,
        name: emp.name,
        designation: emp.designation,
        phone: emp.phone,
        payment_method: emp.payment_method,
        account_number: emp.account_number,
        base_salary: baseSalary,
        present_days: Number(attRows[0]?.present_days || 0),
        absent_days: absentDays,
        half_days: halfDays,
        holiday_duty_days: holidayDutyDays,
        holiday_duty_pay: holidayDutyPay,
        weekly_off_day: emp.weekly_off_day || 'Friday',
        overtime_hours: Number(attRows[0]?.total_overtime_hours || 0),
        overtime_pay: overtimePay,
        absent_penalty: absentPenalty,
        bonus_amount: bonusAmt,
        loan_deduction: totalLoanAndAdvanceDeduction,
        personal_loan_deduction: loanDeduction,
        advance_salary_deduction: advanceDeduction,
        pf_deduction: pfDeduction,
        net_payable: netPayable,
        total_paid: totalPaid,
        due_amount: remainingDue,
        status: status,
        is_paid: status === 'paid'
      });
    }

    res.json(sheet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.disburseSalary = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { employee_id, month_year, base_salary, bonus, overtime_pay, absent_penalty, loan_deduction, pf_deduction, net_payable, paid_amount, account_id, payment_method, notes } = req.body;

    if (!employee_id || !month_year || !account_id) {
      return res.status(400).json({ error: 'Employee, Month/Year, and Payment Account are required.' });
    }

    const netPayableVal = Number(net_payable || 0);
    let amountToPay = Number(paid_amount !== undefined ? paid_amount : netPayableVal);

    if (amountToPay <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than 0.' });
    }

    // Previous payments check
    const [prevRows] = await db.query(
      'SELECT COALESCE(SUM(COALESCE(paid_amount, net_payable)), 0) as total_paid FROM payroll WHERE tenant_id = ? AND (employee_id = ? OR staff_id = ?) AND month_year = ?',
      [tenantId, employee_id, employee_id, month_year]
    );

    const prevPaid = Number(prevRows[0]?.total_paid || 0);
    const currentDue = Math.max(0, netPayableVal - prevPaid);

    if (amountToPay > currentDue + 0.05) {
      return res.status(400).json({ error: `Payment amount (৳${amountToPay.toFixed(2)}) exceeds remaining due salary (৳${currentDue.toFixed(2)}).` });
    }

    // Check account balance
    const [accRows] = await db.query('SELECT name, balance FROM finance_accounts WHERE id = ? AND tenant_id = ?', [account_id, tenantId]);
    if (accRows.length === 0) return res.status(400).json({ error: 'Selected payment account not found.' });

    if (Number(accRows[0].balance) < amountToPay) {
      return res.status(400).json({ error: `Insufficient account balance in ${accRows[0].name}` });
    }

    // Get employee details
    const [emp] = await db.query('SELECT name, employee_code FROM employees WHERE id = ?', [employee_id]);
    const empName = emp[0]?.name || 'Employee';

    const newTotalPaid = prevPaid + amountToPay;
    const newDueAmount = Math.max(0, netPayableVal - newTotalPaid);
    const paymentStatus = newDueAmount <= 0.05 ? 'paid' : 'partial';

    // Auto-migration fallback check for account_id column on payroll table
    try {
      await db.query('ALTER TABLE payroll ADD COLUMN account_id INT DEFAULT NULL');
    } catch (e) {}

    // 1. Insert Payroll Record
    const [payResult] = await db.query(
      `INSERT INTO payroll (
        tenant_id, staff_id, employee_id, staff_name, month_year, base_salary, bonus,
        overtime_pay, absent_penalty, loan_deduction, pf_deduction, net_payable, net_salary_paid,
        paid_amount, due_amount, payment_method, account_id, notes, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId, employee_id, employee_id, empName, month_year, Number(base_salary || 0), Number(bonus || 0),
        Number(overtime_pay || 0), Number(absent_penalty || 0), Number(loan_deduction || 0), Number(pf_deduction || 0), netPayableVal, netPayableVal,
        amountToPay, newDueAmount, payment_method || 'Cash', account_id, notes || null, paymentStatus
      ]
    );

    // 2. Deduct Paid Amount from Finance Account
    await db.query('UPDATE finance_accounts SET balance = balance - ? WHERE id = ?', [amountToPay, account_id]);

    // 3. Write Passbook Ledger entry
    await db.query(
      `INSERT INTO account_transactions (tenant_id, account_id, type, debit, credit, reference_no, notes, transaction_date)
       VALUES (?, ?, 'Staff Salary Disbursement', ?, 0.00, ?, ?, NOW())`,
      [tenantId, account_id, amountToPay, `PAYROLL-${payResult.insertId}`, `Staff Salary Paid to ${empName} (${month_year}) [${paymentStatus.toUpperCase()}]`]
    );

    // 4. Write Expenses Entry under 'Payroll'
    await db.query(
      `INSERT INTO expenses (tenant_id, title, category, amount, expense_date, notes)
       VALUES (?, ?, 'Payroll', ?, CURDATE(), ?)`,
      [tenantId, `Salary - ${empName} (${month_year})`, amountToPay, `Salary Disbursed via ${payment_method} (${paymentStatus.toUpperCase()})`]
    );

    // 5. Update Provident Fund balance (on first payment)
    if (prevPaid === 0 && Number(pf_deduction) > 0) {
      const [pfRows] = await db.query(
        "SELECT id, employer_contrib_pct FROM employee_pf WHERE tenant_id = ? AND employee_id = ? AND status = 'active'",
        [tenantId, employee_id]
      );
      if (pfRows.length > 0) {
        const companyPct = Number(pfRows[0].employer_contrib_pct || 5);
        const companyContrib = Number(base_salary || 0) * (companyPct / 100);
        const totalPfAddition = Number(pf_deduction) + companyContrib;
        await db.query(
          'UPDATE employee_pf SET accumulated_balance = accumulated_balance + ? WHERE id = ?',
          [totalPfAddition, pfRows[0].id]
        );
      }
    }

    // 6. Update Employee Loan & Advance Repayment Ledgers (on first payment)
    if (prevPaid === 0) {
      const [loans] = await db.query(
        'SELECT id, loan_amount, paid_amount, monthly_installment FROM employee_loans WHERE tenant_id = ? AND employee_id = ? AND status = \'active\' AND auto_deduct_salary = 1',
        [tenantId, employee_id]
      );

      for (const loan of loans) {
        const remaining = Number(loan.loan_amount) - Number(loan.paid_amount);
        if (remaining > 0) {
          const emi = Number(loan.monthly_installment);
          const deductAmt = emi > 0 ? Math.min(emi, remaining) : remaining;
          const newPaid = Number(loan.paid_amount) + deductAmt;
          const newStatus = newPaid >= Number(loan.loan_amount) ? 'cleared' : 'active';

          await db.query('UPDATE employee_loans SET paid_amount = ?, status = ? WHERE id = ?', [newPaid, newStatus, loan.id]);
          await db.query(
            'INSERT INTO employee_loan_repayments (tenant_id, loan_id, employee_id, repayment_amount, repayment_source, payroll_id, notes) VALUES (?, ?, ?, ?, \'salary_deduction\', ?, ?)',
            [tenantId, loan.id, employee_id, deductAmt, payResult.insertId, `Auto Deduction from Salary (${month_year})`]
          );
        }
      }
    }

    res.status(201).json({
      message: `Salary disbursement of ৳${amountToPay.toFixed(2)} logged successfully (${paymentStatus.toUpperCase()}).`,
      payment_status: paymentStatus,
      paid_amount: amountToPay,
      due_amount: newDueAmount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 7. Provident Fund (PF) Management
exports.getPF = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query(
      `SELECT e.id as employee_id, e.name, e.employee_code, e.designation, e.base_salary,
              pf.id as pf_id,
              COALESCE(pf.employee_contrib_pct, 5.00) as employee_contrib_pct,
              COALESCE(pf.employer_contrib_pct, 5.00) as employer_contrib_pct,
              COALESCE(pf.accumulated_balance, 0.00) as accumulated_balance,
              COALESCE(pf.status, 'inactive') as status
       FROM employees e
       LEFT JOIN employee_pf pf ON pf.employee_id = e.id AND pf.tenant_id = e.tenant_id
       WHERE e.tenant_id = ? AND e.is_active = 1
       ORDER BY e.name ASC`,
      [tenantId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePF = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { employee_id, status, employee_contrib_pct, employer_contrib_pct } = req.body;

    if (!employee_id) {
      return res.status(400).json({ error: 'Employee ID is required.' });
    }

    const pfStatus = status === 'active' ? 'active' : 'inactive';
    const empPct = Number(employee_contrib_pct !== undefined ? employee_contrib_pct : 5.00);
    const companyPct = Number(employer_contrib_pct !== undefined ? employer_contrib_pct : 5.00);

    const [existing] = await db.query(
      'SELECT id FROM employee_pf WHERE tenant_id = ? AND employee_id = ?',
      [tenantId, employee_id]
    );

    if (existing.length > 0) {
      await db.query(
        'UPDATE employee_pf SET status = ?, employee_contrib_pct = ?, employer_contrib_pct = ? WHERE id = ?',
        [pfStatus, empPct, companyPct, existing[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO employee_pf (tenant_id, employee_id, employee_contrib_pct, employer_contrib_pct, accumulated_balance, status) VALUES (?, ?, ?, ?, 0.00, ?)',
        [tenantId, employee_id, empPct, companyPct, pfStatus]
      );
    }

    res.json({ message: `Provident Fund settings updated for staff (${pfStatus.toUpperCase()})` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 8. Self-Service Attendance Punch In / Clock Out
exports.punchIn = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const userName = req.user.name;
    const todayStr = new Date().toISOString().slice(0, 10);
    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false });

    const [empRows] = await db.query(
      'SELECT id, name, weekly_off_day FROM employees WHERE tenant_id = ? AND (user_id = ? OR email = ?) LIMIT 1',
      [tenantId, userId, req.user.email || '']
    );

    let empId = empRows[0]?.id;
    if (!empId) {
      const [byName] = await db.query(
        'SELECT id FROM employees WHERE tenant_id = ? AND name LIKE ? LIMIT 1',
        [tenantId, `%${userName}%`]
      );
      empId = byName[0]?.id;
    }

    if (!empId) {
      return res.status(400).json({ error: 'Your user account is not linked to an employee profile in Staff Directory.' });
    }

    const [att] = await db.query(
      'SELECT * FROM employee_attendance WHERE tenant_id = ? AND employee_id = ? AND date = ?',
      [tenantId, empId, todayStr]
    );

    if (att.length > 0 && att[0].in_time) {
      return res.status(400).json({ error: `You have already punched in today at ${att[0].in_time}.` });
    }

    if (att.length > 0) {
      await db.query(
        "UPDATE employee_attendance SET status = 'present', in_time = ? WHERE id = ?",
        [nowTimeStr, att[0].id]
      );
    } else {
      await db.query(
        "INSERT INTO employee_attendance (tenant_id, employee_id, date, status, in_time, notes) VALUES (?, ?, ?, 'present', ?, 'Self Punch-In')",
        [tenantId, empId, todayStr, nowTimeStr]
      );
    }

    res.json({ message: `Punch In successful at ${nowTimeStr}! Have a great working day.`, in_time: nowTimeStr });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.punchOut = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const userName = req.user.name;
    const todayStr = new Date().toISOString().slice(0, 10);
    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false });

    const [empRows] = await db.query(
      'SELECT id FROM employees WHERE tenant_id = ? AND (user_id = ? OR email = ?) LIMIT 1',
      [tenantId, userId, req.user.email || '']
    );

    let empId = empRows[0]?.id;
    if (!empId) {
      const [byName] = await db.query('SELECT id FROM employees WHERE tenant_id = ? AND name LIKE ? LIMIT 1', [tenantId, `%${userName}%`]);
      empId = byName[0]?.id;
    }

    if (!empId) return res.status(400).json({ error: 'Employee profile not linked.' });

    const [att] = await db.query(
      'SELECT * FROM employee_attendance WHERE tenant_id = ? AND employee_id = ? AND date = ?',
      [tenantId, empId, todayStr]
    );

    if (att.length === 0 || !att[0].in_time) {
      return res.status(400).json({ error: 'You have not punched in today yet.' });
    }

    await db.query(
      'UPDATE employee_attendance SET out_time = ? WHERE id = ?',
      [nowTimeStr, att[0].id]
    );

    res.json({ message: `Clock Out recorded at ${nowTimeStr}. Thank you for your work!`, out_time: nowTimeStr });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyAttendanceStatus = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const userName = req.user.name;
    const todayStr = new Date().toISOString().slice(0, 10);

    const [empRows] = await db.query(
      'SELECT id, name, employee_code, designation, weekly_off_day FROM employees WHERE tenant_id = ? AND (user_id = ? OR email = ?) LIMIT 1',
      [tenantId, userId, req.user.email || '']
    );

    let emp = empRows[0];
    if (!emp) {
      const [byName] = await db.query('SELECT id, name, employee_code, designation, weekly_off_day FROM employees WHERE tenant_id = ? AND name LIKE ? LIMIT 1', [tenantId, `%${userName}%`]);
      emp = byName[0];
    }

    if (!emp) {
      return res.json({ punched_in: false, attendance: null, employee: null });
    }

    const [att] = await db.query(
      'SELECT * FROM employee_attendance WHERE tenant_id = ? AND employee_id = ? AND date = ?',
      [tenantId, emp.id, todayStr]
    );

    res.json({
      punched_in: att.length > 0 && !!att[0].in_time,
      punched_out: att.length > 0 && !!att[0].out_time,
      attendance: att[0] || null,
      employee: emp
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 9. Team Chat & Internal Messaging
exports.getTeamMessages = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query(
      `SELECT tm.*, u.role as user_role, u.name as u_name
       FROM team_messages tm
       LEFT JOIN users u ON u.id = tm.user_id
       WHERE tm.tenant_id = ?
       ORDER BY tm.id ASC
       LIMIT 150`,
      [tenantId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createTeamMessage = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const senderName = req.user.name || 'Staff Member';
    const senderRole = req.user.role || 'staff';
    const { message, attachment_url } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const [result] = await db.query(
      'INSERT INTO team_messages (tenant_id, user_id, sender_name, sender_role, message, attachment_url) VALUES (?, ?, ?, ?, ?, ?)',
      [tenantId, userId, senderName, senderRole, message.trim(), attachment_url || null]
    );

    res.status(201).json({
      id: result.insertId,
      tenant_id: tenantId,
      user_id: userId,
      sender_name: senderName,
      sender_role: senderRole,
      message: message.trim(),
      attachment_url: attachment_url || null,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
