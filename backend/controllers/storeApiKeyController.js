const db = require('../config/db');
const crypto = require('crypto');

// Get all Store API Keys for logged-in shop
exports.getStoreApiKeys = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [keys] = await db.query(`
      SELECT sak.*, 
        (SELECT COUNT(id) FROM sales WHERE store_api_key_id = sak.id AND tenant_id = sak.tenant_id) AS total_ingested_orders
      FROM store_api_keys sak
      WHERE sak.tenant_id = ?
      ORDER BY sak.id DESC
    `, [tenantId]);

    res.json(keys);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new Store API Key
exports.createStoreApiKey = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { store_name, store_domain, notes } = req.body;

    if (!store_name) {
      return res.status(400).json({ error: 'Store name is required.' });
    }

    // Generate unique secure API key token (e.g. pw_store_8f3a2b1c...)
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const apiKey = `pw_store_${randomBytes}`;

    const [result] = await db.query(
      `INSERT INTO store_api_keys (tenant_id, store_name, store_domain, api_key, is_active, notes)
       VALUES (?, ?, ?, ?, 1, ?)`,
      [tenantId, store_name.trim(), store_domain ? store_domain.trim() : null, apiKey, notes || null]
    );

    res.status(201).json({
      message: 'Store API Key generated successfully.',
      key: {
        id: result.insertId,
        store_name,
        store_domain,
        api_key: apiKey,
        is_active: 1,
        notes
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Toggle Enable/Disable API Key
exports.toggleStoreApiKey = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { is_active } = req.body;

    await db.query(
      'UPDATE store_api_keys SET is_active = ? WHERE id = ? AND tenant_id = ?',
      [is_active ? 1 : 0, id, tenantId]
    );

    res.json({ message: 'Store API Key status updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Store API Key
exports.deleteStoreApiKey = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    await db.query('DELETE FROM store_api_keys WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    res.json({ message: 'Store API Key deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
