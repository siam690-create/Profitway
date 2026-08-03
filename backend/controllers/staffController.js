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
      photo_url, base_salary, hourly_rate, overtime_rate, payment_method, account_number
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Employee name is required.' });

    // Generate unique code EMP-101
    const [last] = await db.query('SELECT id FROM employees WHERE tenant_id = ? ORDER BY id DESC LIMIT 1', [tenantId]);
    const empCode = `EMP-${(last[0]?.id || 0) + 101}`;

    const [result] = await db.query(
      `INSERT INTO employees (
        tenant_id, employee_code, name, designation, department, phone, email,
        joining_date, nid_number, blood_group, emergency_contact_name, emergency_contact_phone,
        photo_url, base_salary, hourly_rate, overtime_rate, payment_method, account_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId, empCode, name, designation || 'Staff', department || 'General', phone || null, email || null,
        joining_date || null, nid_number || null, blood_group || null, emergency_contact_name || null, emergency_contact_phone || null,
        photo_url || null, Number(base_salary || 0), Number(hourly_rate || 0), Number(overtime_rate || 0),
        payment_method || 'Cash', account_number || null
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
      photo_url, base_salary, hourly_rate, overtime_rate, payment_method, account_number, is_active
    } = req.body;

    await db.query(
      `UPDATE employees SET
        name = ?, designation = ?, department = ?, phone = ?, email = ?,
        joining_date = ?, nid_number = ?, blood_group = ?, emergency_contact_name = ?, emergency_contact_phone = ?,
        photo_url = ?, base_salary = ?, hourly_rate = ?, overtime_rate = ?, payment_method = ?, account_number = ?, is_active = ?
      WHERE id = ? AND tenant_id = ?`,
      [
        name, designation, department, phone, email,
        joining_date, nid_number, blood_group, emergency_contact_name, emergency_contact_phone,
        photo_url, Number(base_salary || 0), Number(hourly_rate || 0), Number(overtime_rate || 0), payment_method, account_number, is_active ? 1 : 0,
        id, tenantId
      ]
    );

    res.json({ message: 'Employee profile updated successfully' });
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
      `SELECT a.*, e.name as employee_name, e.employee_code, e.designation
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
    const { employee_id, leave_type, start_date, end_date, total_days, reason } = req.body;

    if (!employee_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'Employee ID, Start Date, and End Date are required.' });
    }

    const [result] = await db.query(
      `INSERT INTO employee_leaves (tenant_id, employee_id, leave_type, start_date, end_date, total_days, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')`,
      [tenantId, employee_id, leave_type || 'casual', start_date, end_date, Number(total_days || 1), reason || null]
    );

    res.status(201).json({ message: 'Leave application recorded successfully', leaveId: result.insertId });
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
      [status, approved_by || req.user.name || 'Admin', id, tenantId]
    );

    res.json({ message: `Leave application status updated to ${status}` });
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
    const { employee_id, loan_amount, monthly_installment, account_id, notes } = req.body;

    if (!employee_id || !loan_amount || !account_id) {
      return res.status(400).json({ error: 'Employee, Loan Amount, and Disbursement Account are required.' });
    }

    const amount = Number(loan_amount);

    // Check account balance
    const [accRows] = await db.query('SELECT name, balance FROM finance_accounts WHERE id = ? AND tenant_id = ?', [account_id, tenantId]);
    if (accRows.length === 0) return res.status(400).json({ error: 'Selected account not found.' });

    if (Number(accRows[0].balance) < amount) {
      return res.status(400).json({ error: `Insufficient account balance in ${accRows[0].name}` });
    }

    // Insert loan
    const [emp] = await db.query('SELECT name FROM employees WHERE id = ?', [employee_id]);
    const empName = emp[0]?.name || 'Employee';

    const [result] = await db.query(
      `INSERT INTO employee_loans (tenant_id, employee_id, loan_amount, paid_amount, monthly_installment, account_id, disbursement_date, notes, status)
       VALUES (?, ?, ?, 0.00, ?, ?, CURDATE(), ?, 'active')`,
      [tenantId, employee_id, amount, Number(monthly_installment || 0), account_id, notes || null]
    );

    // Deduct from finance account
    await db.query('UPDATE finance_accounts SET balance = balance - ? WHERE id = ?', [amount, account_id]);

    // Record Passbook entry
    await db.query(
      `INSERT INTO account_transactions (tenant_id, account_id, type, debit, credit, reference_no, notes, transaction_date)
       VALUES (?, ?, 'Employee Loan Disbursement', ?, 0.00, ?, ?, NOW())`,
      [tenantId, account_id, amount, `EMP-LOAN-${result.insertId}`, `Personal Loan Disbursed to Staff: ${empName} (${notes || 'Loan/Advance'})`]
    );

    res.status(201).json({ message: 'Employee loan issued successfully and recorded in Passbook Ledger.' });
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
    const { employee_id, title, amount, bonus_date, notes } = req.body;

    if (!title || !amount) {
      return res.status(400).json({ error: 'Bonus title and amount are required.' });
    }

    await db.query(
      `INSERT INTO employee_bonuses (tenant_id, employee_id, title, amount, bonus_date, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tenantId, employee_id || null, title, Number(amount), bonus_date || new Date().toISOString().slice(0, 10), notes || null]
    );

    res.status(201).json({ message: 'Bonus recorded successfully' });
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

      // 3. Active Loans EMI
      const [loanRows] = await db.query(
        `SELECT COALESCE(SUM(monthly_installment), 0) as total_emi
         FROM employee_loans
         WHERE tenant_id = ? AND employee_id = ? AND status = 'active'`,
        [tenantId, emp.id]
      );

      // 4. Existing disbursement record if already paid
      const [paidRows] = await db.query(
        'SELECT * FROM payroll WHERE tenant_id = ? AND (employee_id = ? OR staff_id = ?) AND month_year = ?',
        [tenantId, emp.id, emp.id, month_year]
      );

      const baseSalary = Number(emp.base_salary || 0);
      const overtimePay = Number(attRows[0]?.total_overtime_hours || 0) * Number(emp.overtime_rate || 0);
      const absentDays = Number(attRows[0]?.absent_days || 0);
      const perDaySalary = baseSalary / 30;
      const absentPenalty = absentDays * perDaySalary;
      const bonusAmt = Number(bonusRows[0]?.total_bonus || 0);
      const loanDeduction = Number(loanRows[0]?.total_emi || 0);
      const pfDeduction = baseSalary * 0.05; // 5% PF

      const netPayable = Math.max(0, baseSalary + bonusAmt + overtimePay - (absentPenalty + loanDeduction + pfDeduction));

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
        overtime_hours: Number(attRows[0]?.total_overtime_hours || 0),
        overtime_pay: overtimePay,
        absent_penalty: absentPenalty,
        bonus_amount: bonusAmt,
        loan_deduction: loanDeduction,
        pf_deduction: pfDeduction,
        net_payable: netPayable,
        is_paid: paidRows.length > 0,
        paid_details: paidRows[0] || null
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
    const { employee_id, month_year, base_salary, bonus, overtime_pay, absent_penalty, loan_deduction, pf_deduction, net_payable, account_id, payment_method, notes } = req.body;

    if (!employee_id || !month_year || !account_id) {
      return res.status(400).json({ error: 'Employee, Month/Year, and Payment Account are required.' });
    }

    const amount = Number(net_payable || 0);

    // Check account balance
    const [accRows] = await db.query('SELECT name, balance FROM finance_accounts WHERE id = ? AND tenant_id = ?', [account_id, tenantId]);
    if (accRows.length === 0) return res.status(400).json({ error: 'Selected payment account not found.' });

    if (Number(accRows[0].balance) < amount) {
      return res.status(400).json({ error: `Insufficient account balance in ${accRows[0].name}` });
    }

    // Get employee details
    const [emp] = await db.query('SELECT name, employee_code FROM employees WHERE id = ?', [employee_id]);
    const empName = emp[0]?.name || 'Employee';

    // 1. Insert Payroll Record
    const [payResult] = await db.query(
      `INSERT INTO payroll (
        tenant_id, staff_id, employee_id, staff_name, month_year, base_salary, bonus,
        overtime_pay, absent_penalty, loan_deduction, pf_deduction, net_payable,
        payment_method, account_id, notes, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid')`,
      [
        tenantId, employee_id, employee_id, empName, month_year, Number(base_salary || 0), Number(bonus || 0),
        Number(overtime_pay || 0), Number(absent_penalty || 0), Number(loan_deduction || 0), Number(pf_deduction || 0), amount,
        payment_method || 'Cash', account_id, notes || null
      ]
    );

    // 2. Deduct Net Salary from Finance Account
    await db.query('UPDATE finance_accounts SET balance = balance - ? WHERE id = ?', [amount, account_id]);

    // 3. Write Passbook Ledger entry
    await db.query(
      `INSERT INTO account_transactions (tenant_id, account_id, type, debit, credit, reference_no, notes, transaction_date)
       VALUES (?, ?, 'Staff Salary Disbursement', ?, 0.00, ?, ?, NOW())`,
      [tenantId, account_id, amount, `PAYROLL-${payResult.insertId}`, `Staff Salary Paid to ${empName} (${month_year})`]
    );

    // 4. Write Expenses Entry under 'Payroll'
    await db.query(
      `INSERT INTO expenses (tenant_id, title, category, amount, expense_date, notes)
       VALUES (?, ?, 'Payroll', ?, CURDATE(), ?)`,
      [tenantId, `Salary - ${empName} (${month_year})`, amount, `Net Salary Disbursed via ${payment_method}`]
    );

    // 5. Update Provident Fund balance
    if (Number(pf_deduction) > 0) {
      const totalPfAddition = Number(pf_deduction) * 2; // Employee 5% + Employer 5%
      await db.query(
        'UPDATE employee_pf SET accumulated_balance = accumulated_balance + ? WHERE tenant_id = ? AND employee_id = ?',
        [totalPfAddition, tenantId, employee_id]
      );
    }

    // 6. Update Employee Loan Repayment Ledger
    if (Number(loan_deduction) > 0) {
      const [loans] = await db.query('SELECT id, loan_amount, paid_amount FROM employee_loans WHERE tenant_id = ? AND employee_id = ? AND status = \'active\' LIMIT 1', [tenantId, employee_id]);
      if (loans.length > 0) {
        const loan = loans[0];
        const newPaid = Number(loan.paid_amount) + Number(loan_deduction);
        const newStatus = newPaid >= Number(loan.loan_amount) ? 'cleared' : 'active';

        await db.query('UPDATE employee_loans SET paid_amount = ?, status = ? WHERE id = ?', [newPaid, newStatus, loan.id]);
        await db.query(
          'INSERT INTO employee_loan_repayments (tenant_id, loan_id, employee_id, repayment_amount, repayment_source, payroll_id, notes) VALUES (?, ?, ?, ?, \'salary_deduction\', ?, ?)',
          [tenantId, loan.id, employee_id, Number(loan_deduction), payResult.insertId, `Auto EMI Deduction from Salary (${month_year})`]
        );
      }
    }

    res.status(201).json({ message: 'Salary disbursed successfully with Passbook & Expense integration.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
