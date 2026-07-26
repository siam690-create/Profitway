const db = require('../config/db');

exports.getCategories = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query('SELECT * FROM categories WHERE tenant_id = ? ORDER BY name ASC', [tenantId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });

    const [result] = await db.query(
      'INSERT INTO categories (tenant_id, name, description) VALUES (?, ?, ?)',
      [tenantId, name, description || null]
    );

    res.status(201).json({ id: result.insertId, name, description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    await db.query('DELETE FROM categories WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
