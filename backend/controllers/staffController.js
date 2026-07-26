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
