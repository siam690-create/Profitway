const db = require('../config/db');

// Fetch all suppliers for tenant with outstanding dues summary
exports.getSuppliers = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const [suppliers] = await db.query(
      `SELECT s.id, s.tenant_id, s.name, s.phone, s.email, s.company_name, s.address, s.notes, s.created_at,
              COALESCE(SUM(CASE WHEN l.status != 'paid' THEN (l.total_amount - l.amount_paid) ELSE 0 END), 0) AS total_due
       FROM suppliers s
       LEFT JOIN liabilities l ON l.party_name COLLATE utf8mb4_general_ci = s.name COLLATE utf8mb4_general_ci AND l.tenant_id = s.tenant_id
       WHERE s.tenant_id = ?
       GROUP BY s.id, s.tenant_id, s.name, s.phone, s.email, s.company_name, s.address, s.notes, s.created_at
       ORDER BY s.id DESC`,
      [tenantId]
    );

    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new supplier
exports.createSupplier = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, phone, email, company_name, address, notes } = req.body;

    if (!name) return res.status(400).json({ error: 'Supplier name is required.' });

    const [result] = await db.query(
      `INSERT INTO suppliers (tenant_id, name, phone, email, company_name, address, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, name, phone || null, email || null, company_name || null, address || null, notes || null]
    );

    res.status(201).json({
      message: 'Supplier created successfully',
      supplier_id: result.insertId,
      name
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update supplier info
exports.updateSupplier = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { name, phone, email, company_name, address, notes } = req.body;

    await db.query(
      `UPDATE suppliers 
       SET name = ?, phone = ?, email = ?, company_name = ?, address = ?, notes = ?
       WHERE id = ? AND tenant_id = ?`,
      [name, phone, email, company_name, address, notes, id, tenantId]
    );

    res.json({ message: 'Supplier updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete supplier
exports.deleteSupplier = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    await db.query('DELETE FROM suppliers WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
