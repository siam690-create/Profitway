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

    // Calculate aggregated metrics
    const totalLiquidBalance = accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
    
    const totalDena = liabilities.reduce((sum, l) => {
      const pending = Number(l.total_amount) - Number(l.amount_paid);
      return sum + (pending > 0 ? pending : 0);
    }, 0);

    const totalPawna = receivables.reduce((sum, r) => {
      const pending = Number(r.total_amount) - Number(r.amount_collected);
      return sum + (pending > 0 ? pending : 0);
    }, 0);

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

    res.json({ message: 'Fund transfer executed successfully' });
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
    const { payment_amount, account_id, notes } = req.body;

    const payAmt = Number(payment_amount);
    if (isNaN(payAmt) || payAmt <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required.' });
    }

    await connection.beginTransaction();

    const [liabilities] = await connection.query(
      'SELECT * FROM liabilities WHERE id = ? AND tenant_id = ? FOR UPDATE',
      [id, tenantId]
    );

    if (liabilities.length === 0) throw new Error('Liability record not found.');
    const l = liabilities[0];

    const currentPaid = Number(l.amount_paid || 0);
    const newPaid = currentPaid + payAmt;
    const totalAmt = Number(l.total_amount);

    let newStatus = 'partially_paid';
    if (newPaid >= totalAmt) {
      newStatus = 'paid';
    }

    // 1. Update Liability Record
    await connection.query(
      'UPDATE liabilities SET amount_paid = ?, status = ? WHERE id = ? AND tenant_id = ?',
      [newPaid, newStatus, id, tenantId]
    );

    // 2. Deduct Amount from Selected Account
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

    // 3. Insert Payment Log
    await connection.query(
      `INSERT INTO liability_payments (tenant_id, liability_id, amount, account_id, notes, payment_date)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [tenantId, id, payAmt, account_id || null, notes || 'Dena Repayment']
    );

    await connection.commit();

    res.json({ message: 'Liability payment processed successfully' });
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

    if (!title || !party_name || !total_amount) {
      return res.status(400).json({ error: 'Title, Party Name, and Total Amount are required.' });
    }

    const [result] = await db.query(
      `INSERT INTO receivables (tenant_id, title, party_type, party_name, total_amount, amount_collected, status, due_date, notes)
       VALUES (?, ?, ?, ?, ?, 0.00, 'pending', ?, ?)`,
      [
        tenantId,
        title,
        party_type || 'customer',
        party_name,
        Number(total_amount),
        due_date || null,
        notes || null
      ]
    );

    res.status(201).json({
      message: 'Receivable (Pawna) record created successfully',
      receivableId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Collect Pawna (Receivable Collection)
exports.collectReceivable = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { collection_amount, account_id, notes } = req.body;

    const collectAmt = Number(collection_amount);
    if (isNaN(collectAmt) || collectAmt <= 0) {
      return res.status(400).json({ error: 'Valid collection amount is required.' });
    }

    await connection.beginTransaction();

    const [receivables] = await connection.query(
      'SELECT * FROM receivables WHERE id = ? AND tenant_id = ? FOR UPDATE',
      [id, tenantId]
    );

    if (receivables.length === 0) throw new Error('Receivable record not found.');
    const r = receivables[0];

    const currentCollected = Number(r.amount_collected || 0);
    const newCollected = currentCollected + collectAmt;
    const totalAmt = Number(r.total_amount);

    let newStatus = 'partially_collected';
    if (newCollected >= totalAmt) {
      newStatus = 'collected';
    }

    // 1. Update Receivable Record
    await connection.query(
      'UPDATE receivables SET amount_collected = ?, status = ? WHERE id = ? AND tenant_id = ?',
      [newCollected, newStatus, id, tenantId]
    );

    // 2. Deposit Amount into Selected Account
    if (account_id) {
      await connection.query(
        'UPDATE finance_accounts SET balance = balance + ? WHERE id = ? AND tenant_id = ?',
        [collectAmt, account_id, tenantId]
      );
    }

    // 3. Insert Collection Log
    await connection.query(
      `INSERT INTO receivable_collections (tenant_id, receivable_id, amount, account_id, notes, collection_date)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [tenantId, id, collectAmt, account_id || null, notes || 'Pawna Collection Deposit']
    );

    await connection.commit();

    res.json({ message: 'Receivable collection processed successfully' });
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

// Get Detailed Dena (Liability) Audit History (Product Purchase Breakdown + Payment Logs)
exports.getDenaAudit = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const [liabilities] = await db.query(
      'SELECT * FROM liabilities WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    if (liabilities.length === 0) return res.status(404).json({ error: 'Dena liability record not found.' });

    const liability = liabilities[0];

    // 1. Fetch Payment Logs made against this Dena
    const [paymentLogs] = await db.query(
      `SELECT lp.*, fa.name as account_name 
       FROM liability_payments lp
       LEFT JOIN finance_accounts fa ON fa.id = lp.account_id
       WHERE lp.liability_id = ? AND lp.tenant_id = ?
       ORDER BY lp.payment_date DESC`,
      [id, tenantId]
    );

    // 2. Fetch Linked Purchase Order & Items if title contains purchase code or matches supplier
    let purchaseDetails = null;
    let purchaseItems = [];

    // Extract code like #PUR-20260726-186
    const codeMatch = liability.title.match(/#PUR-[A-Za-z0-9-]+/);
    const purchaseCode = codeMatch ? codeMatch[0].replace('#', '') : null;

    let purchaseQuery = 'SELECT * FROM purchases WHERE tenant_id = ? AND (purchase_no = ? OR supplier_name = ? OR notes LIKE ?)';
    let [purchases] = await db.query(purchaseQuery, [tenantId, purchaseCode, liability.party_name, `%${liability.title}%`]);

    if (purchases.length > 0) {
      purchaseDetails = purchases[0];
      const [items] = await db.query(
        'SELECT * FROM purchase_items WHERE purchase_id = ?',
        [purchaseDetails.id]
      );
      purchaseItems = items;
    }

    res.json({
      liability,
      purchase: purchaseDetails,
      items: purchaseItems,
      payment_logs: paymentLogs
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Detailed Pawna (Receivable) Audit History (Sale Items Breakdown + Collection Logs)
exports.getPawnaAudit = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const [receivables] = await db.query(
      'SELECT * FROM receivables WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    if (receivables.length === 0) return res.status(404).json({ error: 'Pawna receivable record not found.' });

    const receivable = receivables[0];

    // 1. Fetch Collection Logs
    const [collectionLogs] = await db.query(
      `SELECT rc.*, fa.name as account_name 
       FROM receivable_collections rc
       LEFT JOIN finance_accounts fa ON fa.id = rc.account_id
       WHERE rc.receivable_id = ? AND rc.tenant_id = ?
       ORDER BY rc.collection_date DESC`,
      [id, tenantId]
    );

    // 2. Fetch Linked Wholesale Sale & Items
    let saleDetails = null;
    let saleItems = [];

    const codeMatch = receivable.title.match(/#WS-[A-Za-z0-9-]+/);
    const invoiceCode = codeMatch ? codeMatch[0].replace('#', '') : null;

    let [wsSales] = await db.query(
      'SELECT * FROM wholesale_sales WHERE tenant_id = ? AND (invoice_no = ? OR customer_name = ? OR notes LIKE ?)',
      [tenantId, invoiceCode, receivable.party_name, `%${receivable.title}%`]
    );

    if (wsSales.length > 0) {
      saleDetails = wsSales[0];
      const [items] = await db.query(
        'SELECT * FROM wholesale_sale_items WHERE sale_id = ?',
        [saleDetails.id]
      );
      saleItems = items;
    }

    res.json({
      receivable,
      sale: saleDetails,
      items: saleItems,
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

    const allTransactions = [
      ...purchases,
      ...posSales,
      ...wholesaleSales,
      ...denaPayments,
      ...pawnaCollections,
      ...salaries,
      ...investments,
      ...manualDeposits
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      account,
      transactions: allTransactions
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
