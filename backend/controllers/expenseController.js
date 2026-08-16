const db = require('../config/db');

exports.getExpenses = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { start_date, end_date, category } = req.query;
    let query = `SELECT * FROM expenses WHERE tenant_id = ?`;
    const params = [tenantId];

    if (start_date && end_date) {
      query += ` AND expense_date BETWEEN ? AND ?`;
      params.push(start_date, end_date);
    }

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    query += ` ORDER BY expense_date DESC`;

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createExpense = async (req, res) => {
  const { title, category, amount, expense_date, notes, account_id } = req.body;

  if (!title || !category || amount === undefined) {
    return res.status(400).json({ error: 'Title, category, and amount are required.' });
  }

  const expAmount = Number(amount);
  if (isNaN(expAmount) || expAmount <= 0) {
    return res.status(400).json({ error: 'Valid expense amount is required.' });
  }

  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;

    await connection.beginTransaction();

    let accName = null;
    if (account_id) {
      const [accRows] = await connection.query(
        'SELECT id, name, balance FROM finance_accounts WHERE id = ? AND tenant_id = ? FOR UPDATE',
        [account_id, tenantId]
      );
      if (accRows.length > 0) {
        const acc = accRows[0];
        accName = acc.name;

        // Deduct from account balance
        const newBalance = Number(acc.balance) - expAmount;
        await connection.query(
          'UPDATE finance_accounts SET balance = ? WHERE id = ? AND tenant_id = ?',
          [newBalance, account_id, tenantId]
        );

        // Insert into account_transactions for passbook ledger
        await connection.query(
          `INSERT INTO account_transactions (tenant_id, account_id, type, debit, credit, reference_no, notes, transaction_date)
           VALUES (?, ?, ?, ?, 0.00, ?, ?, ?)`,
          [
            tenantId,
            account_id,
            `⚡ Operating Expense (${category})`,
            expAmount,
            `EXP-${Date.now()}`,
            `Expense: ${title} (${category})${notes ? ' - ' + notes : ''}`,
            expense_date || new Date().toISOString().slice(0, 19).replace('T', ' ')
          ]
        );
      }
    }

    const [result] = await connection.query(
      `INSERT INTO expenses (tenant_id, title, category, amount, expense_date, notes, account_id, account_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        title,
        category,
        expAmount,
        expense_date || new Date().toISOString().slice(0, 10),
        notes || null,
        account_id || null,
        accName
      ]
    );

    await connection.commit();
    res.status(201).json({ id: result.insertId, message: 'Expense logged & account debited successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

exports.deleteExpense = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    await connection.beginTransaction();

    const [expRows] = await connection.query(
      'SELECT * FROM expenses WHERE id = ? AND tenant_id = ? FOR UPDATE',
      [id, tenantId]
    );

    if (expRows.length > 0) {
      const exp = expRows[0];
      if (exp.account_id) {
        // Refund amount back to account
        await connection.query(
          'UPDATE finance_accounts SET balance = balance + ? WHERE id = ? AND tenant_id = ?',
          [Number(exp.amount), exp.account_id, tenantId]
        );
      }
    }

    await connection.query('DELETE FROM expenses WHERE id = ? AND tenant_id = ?', [id, tenantId]);

    await connection.commit();
    res.json({ message: 'Expense record deleted & account refunded successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};
