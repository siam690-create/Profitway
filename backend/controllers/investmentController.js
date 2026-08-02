const db = require('../config/db');

// Fetch all investments and transactions for tenant
exports.getInvestments = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const [investments] = await db.query(
      `SELECT * FROM investments WHERE tenant_id = ? ORDER BY id DESC`,
      [tenantId]
    );

    const [summaryRows] = await db.query(
      `SELECT COALESCE(SUM(invested_amount), 0) AS total_invested,
              COALESCE(SUM(returned_amount), 0) AS total_returned,
              COALESCE(SUM(invested_amount - returned_amount), 0) AS active_capital
       FROM investments WHERE tenant_id = ?`,
      [tenantId]
    );

    const [transactions] = await db.query(
      `SELECT t.*, i.investor_name 
       FROM investment_transactions t
       JOIN investments i ON i.id = t.investment_id
       WHERE t.tenant_id = ?
       ORDER BY t.transaction_date DESC`,
      [tenantId]
    );

    res.json({
      summary: summaryRows[0] || { total_invested: 0, total_returned: 0, active_capital: 0 },
      investments,
      transactions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Record New Investment (Deposit Capital into Investor Profile)
exports.createInvestment = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { investor_name, phone, email, invested_amount, account_id, notes } = req.body;

    const amountNum = Number(invested_amount);
    if (!investor_name || isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Investor name and valid investment amount are required.' });
    }

    await connection.beginTransaction();

    const cleanName = investor_name.trim();

    // Check if Investor Profile already exists for this tenant
    const [existing] = await connection.query(
      'SELECT * FROM investments WHERE tenant_id = ? AND LOWER(TRIM(investor_name)) = LOWER(?) FOR UPDATE',
      [tenantId, cleanName]
    );

    let investmentId;
    if (existing.length > 0) {
      investmentId = existing[0].id;
      const newInvested = Number(existing[0].invested_amount || 0) + amountNum;
      const newReturned = Number(existing[0].returned_amount || 0);
      const newStatus = (newInvested - newReturned) > 0 ? 'active' : 'returned';

      await connection.query(
        `UPDATE investments 
         SET invested_amount = ?, 
             phone = COALESCE(?, phone), 
             email = COALESCE(?, email), 
             status = ?
         WHERE id = ? AND tenant_id = ?`,
        [newInvested, phone || null, email || null, newStatus, investmentId, tenantId]
      );
    } else {
      const [invResult] = await connection.query(
        `INSERT INTO investments (tenant_id, investor_name, phone, email, invested_amount, returned_amount, status, account_id, notes, created_at)
         VALUES (?, ?, ?, ?, ?, 0.00, 'active', ?, ?, NOW())`,
        [tenantId, cleanName, phone || null, email || null, amountNum, account_id || null, notes || null]
      );
      investmentId = invResult.insertId;
    }

    // 2. Deposit Funds into Selected Liquid Account
    if (account_id) {
      await connection.query(
        'UPDATE finance_accounts SET balance = balance + ? WHERE id = ? AND tenant_id = ?',
        [amountNum, account_id, tenantId]
      );
    }

    // 3. Log Deposit Transaction
    await connection.query(
      `INSERT INTO investment_transactions (tenant_id, investment_id, type, amount, account_id, notes, transaction_date)
       VALUES (?, ?, 'deposit', ?, ?, ?, NOW())`,
      [tenantId, investmentId, amountNum, account_id || null, notes || 'Capital Investment Deposit']
    );

    await connection.commit();

    res.status(201).json({
      message: `৳${amountNum.toFixed(2)} investment capital recorded for "${cleanName}"! Liquid account balance updated.`,
      investment_id: investmentId
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// Repay Investment Capital back to Investor
exports.repayInvestment = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { repayment_amount, account_id, notes } = req.body;

    const repayNum = Number(repayment_amount);
    if (isNaN(repayNum) || repayNum <= 0) {
      return res.status(400).json({ error: 'Valid repayment amount is required.' });
    }

    await connection.beginTransaction();

    const [invRows] = await connection.query(
      'SELECT * FROM investments WHERE id = ? AND tenant_id = ? FOR UPDATE',
      [id, tenantId]
    );

    if (invRows.length === 0) throw new Error('Investment record not found.');
    const inv = invRows[0];

    const currentReturned = Number(inv.returned_amount || 0);
    const newReturned = currentReturned + repayNum;
    const totalInvested = Number(inv.invested_amount);

    let newStatus = 'partially_returned';
    if (newReturned >= totalInvested) {
      newStatus = 'returned';
    }

    // 1. Update Investment Record
    await connection.query(
      'UPDATE investments SET returned_amount = ?, status = ? WHERE id = ? AND tenant_id = ?',
      [newReturned, newStatus, id, tenantId]
    );

    // 2. Deduct Repayment Amount from Selected Liquid Account
    if (account_id) {
      const [accRows] = await connection.query(
        'SELECT balance FROM finance_accounts WHERE id = ? AND tenant_id = ? FOR UPDATE',
        [account_id, tenantId]
      );

      if (accRows.length === 0) throw new Error('Selected payment account not found.');
      if (Number(accRows[0].balance) < repayNum) {
        throw new Error(`Insufficient account balance. Available: ৳${accRows[0].balance}, Required: ৳${repayNum}`);
      }

      await connection.query(
        'UPDATE finance_accounts SET balance = balance - ? WHERE id = ? AND tenant_id = ?',
        [repayNum, account_id, tenantId]
      );
    }

    // 3. Log Repayment Transaction
    await connection.query(
      `INSERT INTO investment_transactions (tenant_id, investment_id, type, amount, account_id, notes, transaction_date)
       VALUES (?, ?, 'repayment', ?, ?, ?, NOW())`,
      [tenantId, id, repayNum, account_id || null, notes || 'Investor Capital Repayment']
    );

    await connection.commit();

    res.json({
      message: 'Investment capital repayment processed successfully! Liquid balance updated.',
      investment_id: id,
      new_returned_amount: newReturned,
      status: newStatus
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};
