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
  try {
    const tenantId = req.user.tenantId;
    const { title, category, amount, expense_date, notes } = req.body;

    if (!title || !category || amount === undefined) {
      return res.status(400).json({ error: 'Title, category, and amount are required.' });
    }

    const [result] = await db.query(
      `INSERT INTO expenses (tenant_id, title, category, amount, expense_date, notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        title,
        category,
        Number(amount),
        expense_date || new Date().toISOString().slice(0, 10),
        notes || null
      ]
    );

    res.status(201).json({ id: result.insertId, message: 'Expense logged successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    await db.query('DELETE FROM expenses WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    res.json({ message: 'Expense record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
