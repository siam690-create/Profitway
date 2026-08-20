const db = require('../config/db');

// Ensure table exists
const ensureTableExists = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS api_integrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenant_id INT NOT NULL,
      
      -- Courier API
      courier_provider VARCHAR(50) DEFAULT 'steadfast',
      courier_api_key TEXT,
      courier_secret_key TEXT,
      courier_base_url VARCHAR(255) DEFAULT 'https://portal.steadfast.com.bd/api/v1',
      courier_is_enabled TINYINT(1) DEFAULT 0,

      -- SMS API
      sms_provider VARCHAR(50) DEFAULT 'bulksmsbd',
      sms_api_key TEXT,
      sms_sender_id VARCHAR(100),
      sms_client_id VARCHAR(100),
      sms_is_enabled TINYINT(1) DEFAULT 0,

      -- Fraud Check API
      fraud_provider VARCHAR(50) DEFAULT 'courier_check',
      fraud_api_key TEXT,
      fraud_is_enabled TINYINT(1) DEFAULT 0,

      -- Payment Gateway API
      payment_provider VARCHAR(50) DEFAULT 'bkash',
      payment_merchant_id VARCHAR(100),
      payment_app_key TEXT,
      payment_app_secret TEXT,
      payment_environment VARCHAR(20) DEFAULT 'sandbox',
      payment_is_enabled TINYINT(1) DEFAULT 0,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY tenant_api_unique (tenant_id)
    );
  `;
  await db.query(query);
};

exports.getApiIntegrations = async (req, res) => {
  try {
    await ensureTableExists();
    const tenantId = req.user.tenantId;

    const [rows] = await db.query('SELECT * FROM api_integrations WHERE tenant_id = ?', [tenantId]);
    if (rows.length === 0) {
      await db.query(
        'INSERT INTO api_integrations (tenant_id, courier_provider, sms_provider, fraud_provider, payment_provider) VALUES (?, "steadfast", "bulksmsbd", "courier_check", "bkash")',
        [tenantId]
      );
      const [newRows] = await db.query('SELECT * FROM api_integrations WHERE tenant_id = ?', [tenantId]);
      return res.json(newRows[0]);
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching API integrations:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateApiIntegrations = async (req, res) => {
  try {
    await ensureTableExists();
    const tenantId = req.user.tenantId;

    const {
      courier_provider,
      courier_api_key,
      courier_secret_key,
      courier_base_url,
      courier_is_enabled,

      sms_provider,
      sms_api_key,
      sms_sender_id,
      sms_client_id,
      sms_is_enabled,

      fraud_provider,
      fraud_api_key,
      fraud_is_enabled,

      payment_provider,
      payment_merchant_id,
      payment_app_key,
      payment_app_secret,
      payment_environment,
      payment_is_enabled
    } = req.body;

    const query = `
      INSERT INTO api_integrations (
        tenant_id,
        courier_provider, courier_api_key, courier_secret_key, courier_base_url, courier_is_enabled,
        sms_provider, sms_api_key, sms_sender_id, sms_client_id, sms_is_enabled,
        fraud_provider, fraud_api_key, fraud_is_enabled,
        payment_provider, payment_merchant_id, payment_app_key, payment_app_secret, payment_environment, payment_is_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        courier_provider = VALUES(courier_provider),
        courier_api_key = VALUES(courier_api_key),
        courier_secret_key = VALUES(courier_secret_key),
        courier_base_url = VALUES(courier_base_url),
        courier_is_enabled = VALUES(courier_is_enabled),
        sms_provider = VALUES(sms_provider),
        sms_api_key = VALUES(sms_api_key),
        sms_sender_id = VALUES(sms_sender_id),
        sms_client_id = VALUES(sms_client_id),
        sms_is_enabled = VALUES(sms_is_enabled),
        fraud_provider = VALUES(fraud_provider),
        fraud_api_key = VALUES(fraud_api_key),
        fraud_is_enabled = VALUES(fraud_is_enabled),
        payment_provider = VALUES(payment_provider),
        payment_merchant_id = VALUES(payment_merchant_id),
        payment_app_key = VALUES(payment_app_key),
        payment_app_secret = VALUES(payment_app_secret),
        payment_environment = VALUES(payment_environment),
        payment_is_enabled = VALUES(payment_is_enabled);
    `;

    await db.query(query, [
      tenantId,
      courier_provider || 'steadfast',
      courier_api_key || '',
      courier_secret_key || '',
      courier_base_url || 'https://portal.steadfast.com.bd/api/v1',
      courier_is_enabled ? 1 : 0,

      sms_provider || 'bulksmsbd',
      sms_api_key || '',
      sms_sender_id || '',
      sms_client_id || '',
      sms_is_enabled ? 1 : 0,

      fraud_provider || 'courier_check',
      fraud_api_key || '',
      fraud_is_enabled ? 1 : 0,

      payment_provider || 'bkash',
      payment_merchant_id || '',
      payment_app_key || '',
      payment_app_secret || '',
      payment_environment || 'sandbox',
      payment_is_enabled ? 1 : 0
    ]);

    res.json({ message: 'API Integrations updated successfully!' });
  } catch (error) {
    console.error('Error updating API integrations:', error);
    res.status(500).json({ error: error.message });
  }
};
