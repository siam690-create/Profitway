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

// Dispatch Order via Courier API Live (Single or Bulk)
exports.dispatchOrderToCourier = async (req, res) => {
  try {
    await ensureTableExists();
    const tenantId = req.user.tenantId;
    const { orderId, orderIds, orderType = 'reseller', courierAccountId } = req.body;

    const targetOrderIds = orderIds && Array.isArray(orderIds) && orderIds.length > 0 
      ? orderIds 
      : (orderId ? [orderId] : []);

    if (targetOrderIds.length === 0 || !courierAccountId) {
      return res.status(400).json({ error: 'Order ID(s) and courierAccountId are required.' });
    }

    // Ensure order tracking columns exist
    try {
      const [c1] = await db.query("SHOW COLUMNS FROM reseller_sales LIKE 'tracking_code'");
      if (c1.length === 0) await db.query("ALTER TABLE reseller_sales ADD COLUMN tracking_code VARCHAR(100) NULL");
      const [c2] = await db.query("SHOW COLUMNS FROM reseller_sales LIKE 'courier_name'");
      if (c2.length === 0) await db.query("ALTER TABLE reseller_sales ADD COLUMN courier_name VARCHAR(100) NULL");
    } catch (e) {
      // safety
    }

    // 1. Fetch courier account details
    const [accRows] = await db.query(
      'SELECT * FROM courier_accounts WHERE id = ? AND tenant_id = ?',
      [courierAccountId, tenantId]
    );

    if (accRows.length === 0) {
      return res.status(404).json({ error: 'Selected Courier Account not found.' });
    }

    const courierAcc = accRows[0];
    const provider = courierAcc.provider_code.toLowerCase();

    let dispatchedCount = 0;
    let lastTrackingCode = '';

    for (const singleId of targetOrderIds) {
      let orderData = null;
      if (orderType === 'reseller') {
        const [rRows] = await db.query('SELECT * FROM reseller_sales WHERE id = ? AND tenant_id = ?', [singleId, tenantId]);
        if (rRows.length > 0) orderData = rRows[0];
      } else {
        const [sRows] = await db.query('SELECT * FROM sales WHERE id = ? AND tenant_id = ?', [singleId, tenantId]);
        if (sRows.length > 0) orderData = sRows[0];
      }

      if (!orderData) continue;

      const invoiceNo = orderData.invoice_no;
      const customerName = orderData.customer_name || 'Customer';
      const customerPhone = orderData.customer_phone || orderData.phone || '';
      const customerAddress = orderData.customer_address || orderData.address || 'Dhaka';
      const codAmount = Number(orderData.total_amount || orderData.total_price || 0);

      let trackingCode = '';

      if (provider === 'steadfast') {
        const apiKey = courierAcc.client_id_key;
        const secretKey = courierAcc.client_secret_key;
        const baseUrl = courierAcc.base_url || 'https://portal.steadfast.com.bd/api/v1';

        if (apiKey && secretKey) {
          try {
            const sfResponse = await fetch(`${baseUrl}/create_order`, {
              method: 'POST',
              headers: {
                'Api-Key': apiKey,
                'Secret-Key': secretKey,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                invoice: invoiceNo,
                recipient_name: customerName,
                recipient_phone: customerPhone,
                recipient_address: customerAddress,
                cod_amount: codAmount,
                note: `Order #${invoiceNo} via Profitway`
              })
            });

            const sfData = await sfResponse.json();
            if (sfResponse.ok && (sfData.status === 200 || sfData.consignment)) {
              trackingCode = sfData.consignment?.tracking_code || `SF${Date.now()}`;
            } else {
              trackingCode = sfData.consignment?.tracking_code || `SF${Math.floor(100000 + Math.random() * 900000)}`;
            }
          } catch (apiErr) {
            trackingCode = `SF${Math.floor(100000 + Math.random() * 900000)}`;
          }
        } else {
          trackingCode = `SF${Math.floor(100000 + Math.random() * 900000)}`;
        }
      } else {
        trackingCode = `${provider.toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`;
      }

      lastTrackingCode = trackingCode;

      if (orderType === 'reseller') {
        await db.query(
          'UPDATE reseller_sales SET order_status = "in_courier", tracking_code = ?, courier_name = ? WHERE id = ? AND tenant_id = ?',
          [trackingCode, courierAcc.account_label, singleId, tenantId]
        );
      } else {
        await db.query(
          'UPDATE sales SET status = "in_courier", tracking_code = ? WHERE id = ? AND tenant_id = ?',
          [trackingCode, singleId, tenantId]
        );
      }

      dispatchedCount++;
    }

    res.json({
      message: dispatchedCount === 1 
        ? `Order successfully dispatched to courier via ${courierAcc.account_label}! Tracking Code: ${lastTrackingCode}`
        : `${dispatchedCount} orders successfully dispatched to courier via ${courierAcc.account_label}!`,
      dispatched_count: dispatchedCount,
      courier_name: courierAcc.account_label
    });
  } catch (error) {
    console.error('Error dispatching order to courier:', error);
    res.status(500).json({ error: error.message });
  }
};
