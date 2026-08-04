const db = require('../config/db');

// Get Finance Master Summary & Overview
exports.getFinanceSummary = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    // 1. Liquid Cash & Bank Accounts
    const [accounts] = await db.query(
      'SELECT * FROM finance_accounts WHERE tenant_id = ? ORDER BY id ASC',
      [tenantId]
    );

    // 2. Liabilities (Dena / Payables)
    const [liabilities] = await db.query(
      'SELECT * FROM liabilities WHERE tenant_id = ? ORDER BY created_at DESC',
      [tenantId]
    );

    // 3. Receivables (Pawna / Dues to Collect)
    const [receivables] = await db.query(
      'SELECT * FROM receivables WHERE tenant_id = ? ORDER BY created_at DESC',
      [tenantId]
    );

    // 4. Payroll Records
    const [payroll] = await db.query(
      'SELECT * FROM payroll WHERE tenant_id = ? ORDER BY payment_date DESC LIMIT 50',
      [tenantId]
    );

    // Calculate aggregated metrics consolidated by supplier/party to handle negative adjustments correctly
    const totalLiquidBalance = accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
    
    const denaMap = {};
    liabilities.forEach(l => {
      const party = (l.party_name || 'General Supplier').trim();
      if (!denaMap[party]) denaMap[party] = 0;
      denaMap[party] += (Number(l.total_amount || 0) - Number(l.amount_paid || 0));
    });
    const totalDena = Object.values(denaMap).reduce((sum, val) => sum + Math.max(0, val), 0);

    const pawnaMap = {};
    receivables.forEach(r => {
      const party = (r.party_name || 'General Customer').trim();
      if (!pawnaMap[party]) pawnaMap[party] = 0;
      pawnaMap[party] += (Number(r.total_amount || 0) - Number(r.amount_collected || 0));
    });
    const totalPawna = Object.values(pawnaMap).reduce((sum, val) => sum + Math.max(0, val), 0);

    const netCapital = (totalLiquidBalance + totalPawna) - totalDena;

    res.json({
      summary: {
        total_liquid_balance: Number(totalLiquidBalance.toFixed(2)),
        total_pawna: Number(totalPawna.toFixed(2)),
        total_dena: Number(totalDena.toFixed(2)),
        net_capital: Number(netCapital.toFixed(2))
      },
      accounts,
      liabilities,
      receivables,
      payroll
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create Financial Account (e.g. Bank / bKash)
exports.createAccount = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, account_type, account_number, initial_balance } = req.body;

    if (!name) return res.status(400).json({ error: 'Account name is required.' });

    const balance = Number(initial_balance || 0);

    const [result] = await db.query(
      `INSERT INTO finance_accounts (tenant_id, name, account_type, account_number, balance)
       VALUES (?, ?, ?, ?, ?)`,
      [tenantId, name, account_type || 'bank', account_number || null, balance]
    );

    res.status(201).json({
      message: 'Financial account created successfully',
      accountId: result.insertId,
      name,
      balance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Manually Add / Deposit Funds to Account (Non-Sales Deposit)
exports.depositFund = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { account_id, amount, source_title, notes } = req.body;

    const depAmount = Number(amount);
    if (!account_id || isNaN(depAmount) || depAmount <= 0 || !source_title) {
      return res.status(400).json({ error: 'Valid account, deposit amount, and source description are required.' });
    }

    await connection.beginTransaction();

    const [accRows] = await connection.query(
      'SELECT balance, name FROM finance_accounts WHERE id = ? AND tenant_id = ? FOR UPDATE',
      [account_id, tenantId]
    );

    if (accRows.length === 0) throw new Error('Account not found.');

    // 1. Update Account Balance
    await connection.query(
      'UPDATE finance_accounts SET balance = balance + ? WHERE id = ? AND tenant_id = ?',
      [depAmount, account_id, tenantId]
    );

    // 2. Insert Manual Deposit Log
    const [depRes] = await connection.query(
      `INSERT INTO manual_deposits (tenant_id, account_id, amount, source_title, notes, deposit_date)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [tenantId, account_id, depAmount, source_title, notes || null]
    );

    await connection.commit();

    res.status(201).json({
      message: `Successfully deposited ৳${depAmount.toFixed(2)} into ${accRows[0].name}!`,
      depositId: depRes.insertId,
      new_balance: Number(accRows[0].balance) + depAmount
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// Transfer Funds Between Accounts
exports.transferFunds = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { from_account_id, to_account_id, amount } = req.body;

    const transferAmount = Number(amount);
    if (!from_account_id || !to_account_id || isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ error: 'Valid source account, destination account, and amount are required.' });
    }

    if (String(from_account_id) === String(to_account_id)) {
      return res.status(400).json({ error: 'Source and destination accounts must be different.' });
    }

    await connection.beginTransaction();

    const [fromAcc] = await connection.query(
      'SELECT balance, name FROM finance_accounts WHERE id = ? AND tenant_id = ? FOR UPDATE',
      [from_account_id, tenantId]
    );

    if (fromAcc.length === 0) throw new Error('Source account not found.');
    if (Number(fromAcc[0].balance) < transferAmount) {
      throw new Error(`Insufficient funds in "${fromAcc[0].name}". Available: ৳${fromAcc[0].balance}, Transfer: ৳${transferAmount}`);
    }

    await connection.query(
      'UPDATE finance_accounts SET balance = balance - ? WHERE id = ? AND tenant_id = ?',
      [transferAmount, from_account_id, tenantId]
    );

    await connection.query(
      'UPDATE finance_accounts SET balance = balance + ? WHERE id = ? AND tenant_id = ?',
      [transferAmount, to_account_id, tenantId]
    );

    await connection.commit();

    res.status(200).json({
      message: `Successfully transferred ৳${transferAmount.toFixed(2)} from "${fromAcc[0].name}" to destination account!`
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// Adjust Account Balance / Manual Fund Withdrawal / Send Money (Non-Expense)
exports.adjustAccountBalance = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { account_id, adjustment_type, amount, reason_title, notes } = req.body;

    const adjAmount = Number(amount);
    if (!account_id || isNaN(adjAmount) || adjAmount <= 0) {
      return res.status(400).json({ error: 'Valid Account ID and Amount are required.' });
    }

    const type = adjustment_type || 'debit'; // 'debit' (withdraw/reduce) or 'credit' (add/increase)

    await connection.beginTransaction();

    const [accRows] = await connection.query(
      'SELECT id, name, balance FROM finance_accounts WHERE id = ? AND tenant_id = ? FOR UPDATE',
      [account_id, tenantId]
    );

    if (accRows.length === 0) {
      return res.status(404).json({ error: 'Selected account not found.' });
    }
    const acc = accRows[0];

    let newBalance = Number(acc.balance);
    let txType = '';
    let debitAmt = 0;
    let creditAmt = 0;

    if (type === 'debit') {
      if (Number(acc.balance) < adjAmount) {
        throw new Error(`Insufficient funds in "${acc.name}". Available balance: ৳${Number(acc.balance).toFixed(2)}, Withdrawal request: ৳${adjAmount.toFixed(2)}`);
      }
      newBalance = newBalance - adjAmount;
      txType = reason_title || 'Balance Adjustment (-)';
      debitAmt = adjAmount;
    } else {
      newBalance = newBalance + adjAmount;
      txType = reason_title || 'Balance Adjustment (+)';
      creditAmt = adjAmount;
    }

    // 1. Update Account Balance
    await connection.query(
      'UPDATE finance_accounts SET balance = ? WHERE id = ? AND tenant_id = ?',
      [newBalance, account_id, tenantId]
    );

    // 2. Insert Transaction Record into account_transactions so it logs in Passbook
    await connection.query(
      `INSERT INTO account_transactions (tenant_id, account_id, type, debit, credit, reference_no, notes, transaction_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        tenantId,
        account_id,
        txType,
        debitAmt,
        creditAmt,
        `ADJ-${Date.now()}`,
        notes || (type === 'debit' ? `Withdrawal / Balance Adjustment from ${acc.name}` : `Balance Adjustment added to ${acc.name}`)
      ]
    );

    await connection.commit();

    res.status(200).json({
      message: type === 'debit'
        ? `Successfully adjusted/withdrew ৳${adjAmount.toFixed(2)} from "${acc.name}"!`
        : `Successfully added ৳${adjAmount.toFixed(2)} adjustment to "${acc.name}"!`,
      new_balance: newBalance
    });

  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// Create Dena (Liability / Payable)
exports.createLiability = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { title, party_type, party_name, total_amount, due_date, notes } = req.body;

    if (!title || !party_name || !total_amount) {
      return res.status(400).json({ error: 'Title, Party Name, and Total Amount are required.' });
    }

    const [result] = await db.query(
      `INSERT INTO liabilities (tenant_id, title, party_type, party_name, total_amount, amount_paid, status, due_date, notes)
       VALUES (?, ?, ?, ?, ?, 0.00, 'pending', ?, ?)`,
      [
        tenantId,
        title,
        party_type || 'supplier',
        party_name,
        Number(total_amount),
        due_date || null,
        notes || null
      ]
    );

    res.status(201).json({
      message: 'Liability (Dena) record created successfully',
      liabilityId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Pay Dena (Liability Repayment)
exports.payLiability = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { payment_amount, account_id, notes, party_name } = req.body;

    let payAmt = Number(payment_amount);
    if (isNaN(payAmt) || payAmt <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required.' });
    }

    await connection.beginTransaction();

    // Fetch pending liabilities for party or by ID
    let pendingLiabilities = [];
    if (party_name) {
      const [rows] = await connection.query(
        `SELECT * FROM liabilities WHERE tenant_id = ? AND party_name = ? AND status != 'paid' ORDER BY created_at ASC FOR UPDATE`,
        [tenantId, party_name]
      );
      pendingLiabilities = rows;
    }

    if (pendingLiabilities.length === 0 && id) {
      const [rows] = await connection.query(
        'SELECT * FROM liabilities WHERE id = ? AND tenant_id = ? FOR UPDATE',
        [id, tenantId]
      );
      pendingLiabilities = rows;
    }

    if (pendingLiabilities.length === 0) throw new Error('No pending Dena liability record found.');

    // 1. Deduct Amount from Selected Account
    if (account_id) {
      const [accRows] = await connection.query(
        'SELECT balance, name FROM finance_accounts WHERE id = ? AND tenant_id = ? FOR UPDATE',
        [account_id, tenantId]
      );
      if (accRows.length === 0) throw new Error('Selected account not found.');
      if (Number(accRows[0].balance) < payAmt) {
        throw new Error(`Insufficient funds in "${accRows[0].name}". Available: ৳${accRows[0].balance}, Paying: ৳${payAmt}`);
      }

      await connection.query(
        'UPDATE finance_accounts SET balance = balance - ? WHERE id = ? AND tenant_id = ?',
        [payAmt, account_id, tenantId]
      );
    }

    // 2. Distribute payment across pending liabilities
    let remainingToPay = payAmt;
    for (const l of pendingLiabilities) {
      if (remainingToPay <= 0) break;

      const currentPaid = Number(l.amount_paid || 0);
      const totalAmt = Number(l.total_amount);
      const dueOnThis = Math.max(0, totalAmt - currentPaid);

      const allocation = Math.min(remainingToPay, dueOnThis);
      const newPaid = currentPaid + allocation;
      const newStatus = newPaid >= totalAmt ? 'paid' : 'partially_paid';

      await connection.query(
        'UPDATE liabilities SET amount_paid = ?, status = ? WHERE id = ? AND tenant_id = ?',
        [newPaid, newStatus, l.id, tenantId]
      );

      // Insert payment log
      await connection.query(
        `INSERT INTO liability_payments (tenant_id, liability_id, amount, account_id, notes, payment_date)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [tenantId, l.id, allocation, account_id || null, notes || null]
      );

      remainingToPay -= allocation;
    }

    await connection.commit();

    res.json({
      message: `Dena payment of ৳${payAmt.toFixed(2)} processed successfully!`
    });

  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// Create Pawna (Receivable / Due to Collect)
exports.createReceivable = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { title, party_type, party_name, total_amount, due_date, notes } = req.body;

    if (!party_name) {
      return res.status(400).json({ error: 'Party/Customer Name is required.' });
    }

    const amt = Number(total_amount || 0);

    const [result] = await db.query(
      `INSERT INTO receivables (tenant_id, title, party_type, party_name, total_amount, amount_collected, status, due_date, notes)
       VALUES (?, ?, ?, ?, ?, 0.00, ?, ?, ?)`,
      [
        tenantId,
        title || `Pawna Profile: ${party_name}`,
        party_type || 'customer',
        party_name.trim(),
        amt,
        'pending',
        due_date || null,
        notes || null
      ]
    );

    res.status(201).json({
      message: amt > 0 
        ? `৳${amt.toFixed(2)} Pawna record created for "${party_name}"!`
        : `Pawna Profile created for "${party_name}"!`,
      receivableId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Collect Pawna (Receivable Collection) by ID or Party Name
exports.collectReceivable = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { collection_amount, account_id, notes, party_name } = req.body;

    let collectAmt = Number(collection_amount);
    if (isNaN(collectAmt) || collectAmt <= 0) {
      return res.status(400).json({ error: 'Valid collection amount is required.' });
    }

    await connection.beginTransaction();

    // Fetch pending receivables for party or by ID
    let pendingReceivables = [];
    if (party_name) {
      const [rows] = await connection.query(
        `SELECT * FROM receivables WHERE tenant_id = ? AND party_name = ? AND status != 'collected' ORDER BY created_at ASC FOR UPDATE`,
        [tenantId, party_name]
      );
      pendingReceivables = rows;
    }

    if (pendingReceivables.length === 0 && id) {
      const [rows] = await connection.query(
        'SELECT * FROM receivables WHERE id = ? AND tenant_id = ? FOR UPDATE',
        [id, tenantId]
      );
      pendingReceivables = rows;
    }

    if (pendingReceivables.length === 0) throw new Error('No pending Pawna receivable record found.');

    // 1. Deposit Amount into Selected Account
    if (account_id) {
      await connection.query(
        'UPDATE finance_accounts SET balance = balance + ? WHERE id = ? AND tenant_id = ?',
        [collectAmt, account_id, tenantId]
      );
    }

    // 2. Distribute collection across pending receivables
    let remainingToCollect = collectAmt;
    for (const r of pendingReceivables) {
      if (remainingToCollect <= 0) break;

      const currentCollected = Number(r.amount_collected || 0);
      const totalAmt = Number(r.total_amount);
      const dueOnThis = Math.max(0, totalAmt - currentCollected);

      const allocation = Math.min(remainingToCollect, dueOnThis);
      const newCollected = currentCollected + allocation;
      const newStatus = newCollected >= totalAmt ? 'collected' : 'partially_collected';

      await connection.query(
        'UPDATE receivables SET amount_collected = ?, status = ? WHERE id = ? AND tenant_id = ?',
        [newCollected, newStatus, r.id, tenantId]
      );

      // Insert collection log
      await connection.query(
        `INSERT INTO receivable_collections (tenant_id, receivable_id, amount, account_id, notes, collection_date)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [tenantId, r.id, allocation, account_id || null, notes || null]
      );

      remainingToCollect -= allocation;
    }

    await connection.commit();

    res.json({
      message: `Pawna collection of ৳${collectAmt.toFixed(2)} processed successfully!`
    });

  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// Disburse Staff Salary & Log into Operating Expenses
exports.paySalary = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { staff_id, staff_name, month_year, base_salary, bonus, advance_deduction, payment_method, account_id, notes } = req.body;

    const base = Number(base_salary || 0);
    const bn = Number(bonus || 0);
    const adv = Number(advance_deduction || 0);
    const netPaid = (base + bn) - adv;

    if (!staff_name || !month_year || isNaN(netPaid) || netPaid <= 0) {
      return res.status(400).json({ error: 'Valid staff name, month, and salary calculation required.' });
    }

    await connection.beginTransaction();

    // 1. Deduct Net Salary from Liquid Account if selected
    if (account_id) {
      const [accRows] = await connection.query(
        'SELECT balance, name FROM finance_accounts WHERE id = ? AND tenant_id = ? FOR UPDATE',
        [account_id, tenantId]
      );
      if (accRows.length === 0) throw new Error('Selected payment account not found.');
      if (Number(accRows[0].balance) < netPaid) {
        throw new Error(`Insufficient funds in "${accRows[0].name}". Available: ৳${accRows[0].balance}, Salary: ৳${netPaid}`);
      }

      await connection.query(
        'UPDATE finance_accounts SET balance = balance - ? WHERE id = ? AND tenant_id = ?',
        [netPaid, account_id, tenantId]
      );
    }

    // 2. Insert Payroll Disbursal Record
    const [pRes] = await connection.query(
      `INSERT INTO payroll (tenant_id, staff_id, staff_name, month_year, base_salary, bonus, advance_deduction, net_salary_paid, payment_method, account_id, notes, payment_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        tenantId,
        staff_id || null,
        staff_name,
        month_year,
        base,
        bn,
        adv,
        netPaid,
        payment_method || 'Cash',
        account_id || null,
        notes || null
      ]
    );

    // 3. Auto-Log into Operating Expenses under 'Salaries & Wages'
    await connection.query(
      `INSERT INTO expenses (tenant_id, title, category, amount, payment_method, notes, expense_date)
       VALUES (?, ?, 'Salaries & Wages', ?, ?, ?, NOW())`,
      [
        tenantId,
        `Staff Salary: ${staff_name} (${month_year})`,
        netPaid,
        payment_method || 'Cash',
        notes || `Base: ৳${base}, Bonus: ৳${bn}, Advance Cut: ৳${adv}`
      ]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Staff salary disbursed successfully! Account deducted & expense logged.',
      payroll_id: pRes.insertId,
      net_salary_paid: netPaid
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// ------------------------------------------------------------------
// AUDIT HISTORY & LEDGER STATEMENT APIS
// ------------------------------------------------------------------

// Get Detailed Dena (Liability) Audit History for Supplier / Party
exports.getDenaAudit = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { party_name } = req.query;

    let targetPartyName = party_name;

    if (!targetPartyName && id) {
      const [rows] = await db.query(
        'SELECT party_name FROM liabilities WHERE id = ? AND tenant_id = ?',
        [id, tenantId]
      );
      if (rows.length > 0) targetPartyName = rows[0].party_name;
    }

    let liabilities = [];
    if (targetPartyName) {
      const [rows] = await db.query(
        'SELECT * FROM liabilities WHERE party_name = ? AND tenant_id = ? ORDER BY created_at DESC',
        [targetPartyName, tenantId]
      );
      liabilities = rows;
    } else {
      const [rows] = await db.query(
        'SELECT * FROM liabilities WHERE id = ? AND tenant_id = ?',
        [id, tenantId]
      );
      liabilities = rows;
    }

    if (liabilities.length === 0) return res.status(404).json({ error: 'Dena liability record not found.' });

    const partyName = targetPartyName || liabilities[0].party_name;
    const liabIds = liabilities.map(l => l.id);

    // 1. Fetch Payment Logs made against this Supplier / Party
    let paymentLogs = [];
    if (liabIds.length > 0) {
      const [logs] = await db.query(
        `SELECT lp.*, fa.name as account_name, l.title as liability_title 
         FROM liability_payments lp
         LEFT JOIN finance_accounts fa ON fa.id = lp.account_id
         JOIN liabilities l ON l.id = lp.liability_id
         WHERE lp.liability_id IN (?) AND lp.tenant_id = ?
         ORDER BY lp.payment_date DESC`,
        [liabIds, tenantId]
      );
      paymentLogs = logs;
    }

    // 2. Fetch Linked Purchase Orders & Items for this Supplier
    const [purchases] = await db.query(
      'SELECT * FROM purchases WHERE tenant_id = ? AND supplier_name = ? ORDER BY purchase_date DESC',
      [tenantId, partyName]
    );

    res.json({
      party_name: partyName,
      liability: liabilities[0],
      liabilities,
      purchases,
      payment_logs: paymentLogs
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Detailed Pawna (Receivable) Audit History for Customer / Party
exports.getPawnaAudit = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { party_name } = req.query;

    let targetPartyName = party_name;

    if (!targetPartyName && id) {
      const [rows] = await db.query(
        'SELECT party_name FROM receivables WHERE id = ? AND tenant_id = ?',
        [id, tenantId]
      );
      if (rows.length > 0) targetPartyName = rows[0].party_name;
    }

    let receivables = [];
    if (targetPartyName) {
      const [rows] = await db.query(
        'SELECT * FROM receivables WHERE party_name = ? AND tenant_id = ? ORDER BY created_at DESC',
        [targetPartyName, tenantId]
      );
      receivables = rows;
    } else {
      const [rows] = await db.query(
        'SELECT * FROM receivables WHERE id = ? AND tenant_id = ?',
        [id, tenantId]
      );
      receivables = rows;
    }

    if (receivables.length === 0) return res.status(404).json({ error: 'Pawna receivable record not found.' });

    const partyName = targetPartyName || receivables[0].party_name;
    const recIds = receivables.map(r => r.id);

    // 1. Fetch Collection Logs
    let collectionLogs = [];
    if (recIds.length > 0) {
      const [logs] = await db.query(
        `SELECT rc.*, fa.name as account_name, r.title as receivable_title 
         FROM receivable_collections rc
         LEFT JOIN finance_accounts fa ON fa.id = rc.account_id
         JOIN receivables r ON r.id = rc.receivable_id
         WHERE rc.receivable_id IN (?) AND rc.tenant_id = ?
         ORDER BY rc.collection_date DESC`,
        [recIds, tenantId]
      );
      collectionLogs = logs;
    }

    // 2. Fetch Linked Wholesale Sales for this Customer
    const [wsSales] = await db.query(
      'SELECT * FROM wholesale_sales WHERE tenant_id = ? AND customer_name = ? ORDER BY sale_date DESC',
      [tenantId, partyName]
    );

    res.json({
      party_name: partyName,
      receivable: receivables[0],
      receivables,
      sales: wsSales,
      collection_logs: collectionLogs
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Full Account Passbook / Ledger Statement (Complete Cash & Bank Audit Trail)
exports.getAccountStatement = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const [accounts] = await db.query(
      'SELECT * FROM finance_accounts WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    if (accounts.length === 0) return res.status(404).json({ error: 'Account not found.' });

    const account = accounts[0];
    const accTypeKey = (account.account_type || '').toLowerCase();
    const accNameKey = (account.name || '').toLowerCase();

    let purchases = [];
    try {
      const [rows] = await db.query(
        `SELECT 'Stock Purchase' as type, paid_amount as debit, 0 as credit, CONCAT('Purchase Order #', purchase_no, ' (Supplier: ', supplier_name, ')') as notes, purchase_date as date
         FROM purchases WHERE (account_id = ? OR account_id IS NULL) AND tenant_id = ? AND paid_amount > 0`,
        [id, tenantId]
      );
      purchases = rows;
    } catch (e) { console.error('Statement purchases error:', e.message); }

    let posSales = [];
    try {
      const [rows] = await db.query(
        `SELECT 'POS Retail Sale' as type, 0 as debit, total_amount as credit, CONCAT('POS Checkout #', invoice_no, ' (Customer: ', customer_name, ')') as notes, created_at as date
         FROM sales WHERE tenant_id = ? AND total_amount > 0 AND (
           LOWER(payment_method) LIKE CONCAT('%', ?, '%') OR 
           (? = 'cash' AND (LOWER(payment_method) LIKE '%cash%' OR payment_method IS NULL)) OR
           (? LIKE CONCAT('%', LOWER(payment_method), '%'))
         )`,
        [tenantId, accTypeKey, accTypeKey, accNameKey]
      );
      posSales = rows;
    } catch (e) { console.error('Statement posSales error:', e.message); }

    let wholesaleSales = [];
    try {
      const [rows] = await db.query(
        `SELECT 'Wholesale Sale' as type, 0 as debit, paid_amount as credit, CONCAT('Wholesale Order #', invoice_no, ' (Buyer: ', customer_name, ')') as notes, sale_date as date
         FROM wholesale_sales WHERE (account_id = ? OR account_id IS NULL) AND tenant_id = ? AND paid_amount > 0`,
        [id, tenantId]
      );
      wholesaleSales = rows;
    } catch (e) { console.error('Statement wholesaleSales error:', e.message); }

    let denaPayments = [];
    try {
      const [rows] = await db.query(
        `SELECT 'Dena Repayment' as type, lp.amount as debit, 0 as credit, CONCAT('Dena Repayment to ', l.party_name, ' (', l.title, ')') as notes, lp.payment_date as date
         FROM liability_payments lp
         JOIN liabilities l ON l.id = lp.liability_id
         WHERE lp.account_id = ? AND lp.tenant_id = ?`,
        [id, tenantId]
      );
      denaPayments = rows;
    } catch (e) { console.error('Statement denaPayments error:', e.message); }

    let pawnaCollections = [];
    try {
      const [rows] = await db.query(
        `SELECT 'Pawna Collection' as type, 0 as debit, rc.amount as credit, CONCAT('Pawna Collection from ', r.party_name, ' (', r.title, ')') as notes, rc.collection_date as date
         FROM receivable_collections rc
         JOIN receivables r ON r.id = rc.receivable_id
         WHERE rc.account_id = ? AND rc.tenant_id = ?`,
        [id, tenantId]
      );
      pawnaCollections = rows;
    } catch (e) { console.error('Statement pawnaCollections error:', e.message); }

    let salaries = [];
    try {
      const [rows] = await db.query(
        `SELECT 'Staff Salary' as type, net_salary_paid as debit, 0 as credit, CONCAT('Salary Disbursal to ', staff_name, ' (', month_year, ')') as notes, payment_date as date
         FROM payroll WHERE account_id = ? AND tenant_id = ?`,
        [id, tenantId]
      );
      salaries = rows;
    } catch (e) { console.error('Statement salaries error:', e.message); }

    let investments = [];
    try {
      const [rows] = await db.query(
        `SELECT CASE WHEN type = 'deposit' THEN 'Investor Capital Deposit' ELSE 'Investment Capital Return' END as type,
                CASE WHEN type = 'repayment' THEN amount ELSE 0 END as debit,
                CASE WHEN type = 'deposit' THEN amount ELSE 0 END as credit,
                CONCAT(CASE WHEN type = 'deposit' THEN 'Capital Raised from ' ELSE 'Capital Returned to ' END, i.investor_name) as notes,
                it.transaction_date as date
         FROM investment_transactions it
         JOIN investments i ON i.id = it.investment_id
         WHERE it.account_id = ? AND it.tenant_id = ?`,
        [id, tenantId]
      );
      investments = rows;
    } catch (e) { console.error('Statement investments error:', e.message); }

    let manualDeposits = [];
    try {
      const [rows] = await db.query(
        `SELECT 'Manual Cash Deposit' as type, 0 as debit, amount as credit, CONCAT('Direct Fund Deposit: ', source_title, IF(notes IS NOT NULL AND notes != '', CONCAT(' - ', notes), '')) as notes, deposit_date as date
         FROM manual_deposits WHERE account_id = ? AND tenant_id = ?`,
        [id, tenantId]
      );
      manualDeposits = rows;
    } catch (e) { console.error('Statement manualDeposits error:', e.message); }

    let accountTx = [];
    try {
      const [rows] = await db.query(
        `SELECT type, debit, credit, notes, transaction_date as date
         FROM account_transactions WHERE account_id = ? AND tenant_id = ?`,
        [id, tenantId]
      );
      accountTx = rows;
    } catch (e) { console.error('Statement accountTx error:', e.message); }

    const allTransactions = [
      ...purchases,
      ...posSales,
      ...wholesaleSales,
      ...denaPayments,
      ...pawnaCollections,
      ...salaries,
      ...investments,
      ...manualDeposits,
      ...accountTx
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      account,
      transactions: allTransactions
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
