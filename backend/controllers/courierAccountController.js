const db = require('../config/db');

// Ensure table exists
const ensureTableExists = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS courier_accounts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenant_id INT NOT NULL,
      provider_code VARCHAR(50) NOT NULL,
      account_label VARCHAR(100) NOT NULL,
      client_id_key TEXT,
      client_secret_key TEXT,
      store_name VARCHAR(100),
      base_url VARCHAR(255),
      is_active TINYINT(1) DEFAULT 1,
      is_verified TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tenant_provider (tenant_id, provider_code)
    );
  `;
  await db.query(query);
};

// Get All Courier Accounts for Tenant
exports.getCourierAccounts = async (req, res) => {
  try {
    await ensureTableExists();
    const tenantId = req.user.tenantId;

    const [rows] = await db.query(
      'SELECT * FROM courier_accounts WHERE tenant_id = ? ORDER BY id ASC',
      [tenantId]
    );

    // If no accounts exist yet, seed default accounts for Steadfast & Pathao
    if (rows.length === 0) {
      await db.query(
        `INSERT INTO courier_accounts (tenant_id, provider_code, account_label, client_id_key, client_secret_key, is_active, is_verified) VALUES 
         (?, 'steadfast', 'Steadfast Primary', '', '', 1, 1),
         (?, 'pathao', 'Pathao Main Store', '', '', 1, 1)`,
        [tenantId, tenantId]
      );
      const [newRows] = await db.query(
        'SELECT * FROM courier_accounts WHERE tenant_id = ? ORDER BY id ASC',
        [tenantId]
      );
      return res.json(newRows);
    }

    res.json(rows);
  } catch (error) {
    console.error('Error getting courier accounts:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create New Courier Account
exports.createCourierAccount = async (req, res) => {
  try {
    await ensureTableExists();
    const tenantId = req.user.tenantId;
    const { provider_code, account_label, client_id_key, client_secret_key, store_name, base_url } = req.body;

    if (!provider_code) {
      return res.status(400).json({ error: 'provider_code is required.' });
    }

    // Count existing accounts for default label
    const [existing] = await db.query(
      'SELECT COUNT(*) as count FROM courier_accounts WHERE tenant_id = ? AND provider_code = ?',
      [tenantId, provider_code]
    );

    const defaultLabel = account_label || `${provider_code.toUpperCase()} Account-${existing[0].count + 1}`;

    const [result] = await db.query(
      `INSERT INTO courier_accounts 
        (tenant_id, provider_code, account_label, client_id_key, client_secret_key, store_name, base_url, is_active, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)`,
      [
        tenantId,
        provider_code.toLowerCase(),
        defaultLabel,
        client_id_key || '',
        client_secret_key || '',
        store_name || '',
        base_url || ''
      ]
    );

    res.json({ message: 'New courier account added successfully!', id: result.insertId });
  } catch (error) {
    console.error('Error creating courier account:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update Existing Courier Account
exports.updateCourierAccount = async (req, res) => {
  try {
    await ensureTableExists();
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { account_label, client_id_key, client_secret_key, store_name, base_url, is_active } = req.body;

    await db.query(
      `UPDATE courier_accounts SET 
        account_label = ?, 
        client_id_key = ?, 
        client_secret_key = ?, 
        store_name = ?, 
        base_url = ?, 
        is_active = ?,
        is_verified = 1
       WHERE id = ? AND tenant_id = ?`,
      [
        account_label,
        client_id_key || '',
        client_secret_key || '',
        store_name || '',
        base_url || '',
        is_active ? 1 : 0,
        id,
        tenantId
      ]
    );

    res.json({ message: 'Courier account updated and verified!' });
  } catch (error) {
    console.error('Error updating courier account:', error);
    res.status(500).json({ error: error.message });
  }
};

// Toggle Active Status
exports.toggleCourierAccount = async (req, res) => {
  try {
    await ensureTableExists();
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const [rows] = await db.query('SELECT is_active FROM courier_accounts WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Courier account not found.' });
    }

    const newActive = rows[0].is_active ? 0 : 1;
    await db.query('UPDATE courier_accounts SET is_active = ? WHERE id = ? AND tenant_id = ?', [newActive, id, tenantId]);

    res.json({ message: `Account status updated!`, is_active: Boolean(newActive) });
  } catch (error) {
    console.error('Error toggling courier account:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete Courier Account
exports.deleteCourierAccount = async (req, res) => {
  try {
    await ensureTableExists();
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    await db.query('DELETE FROM courier_accounts WHERE id = ? AND tenant_id = ?', [id, tenantId]);

    res.json({ message: 'Courier account deleted successfully.' });
  } catch (error) {
    console.error('Error deleting courier account:', error);
    res.status(500).json({ error: error.message });
  }
};
