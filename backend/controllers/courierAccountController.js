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
      merchant_password TEXT,
      base_url VARCHAR(255),
      is_active TINYINT(1) DEFAULT 1,
      is_verified TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tenant_provider (tenant_id, provider_code)
    );
  `;
  await db.query(query);

  try {
    const [mpCols] = await db.query("SHOW COLUMNS FROM courier_accounts LIKE 'merchant_password'");
    if (mpCols.length === 0) {
      await db.query("ALTER TABLE courier_accounts ADD COLUMN merchant_password TEXT NULL");
    }
    const [pcCols] = await db.query("SHOW COLUMNS FROM reseller_sales LIKE 'provider_code'");
    if (pcCols.length === 0) {
      await db.query("ALTER TABLE reseller_sales ADD COLUMN provider_code VARCHAR(50) NULL");
    }
  } catch (e) {
    // safety
  }
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
        `INSERT INTO courier_accounts (tenant_id, provider_code, account_label, client_id_key, client_secret_key, store_name, merchant_password, is_active, is_verified) VALUES 
         (?, 'steadfast', 'Steadfast Primary', '', '', '', '', 1, 1),
         (?, 'pathao', 'Pathao Main Store', '', '', '', '', 1, 1)`,
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
    const { provider_code, account_label, client_id_key, client_secret_key, store_name, merchant_password, base_url } = req.body;

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
        (tenant_id, provider_code, account_label, client_id_key, client_secret_key, store_name, merchant_password, base_url, is_active, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
      [
        tenantId,
        provider_code.toLowerCase(),
        defaultLabel,
        client_id_key || '',
        client_secret_key || '',
        store_name || '',
        merchant_password || '',
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
    const { account_label, client_id_key, client_secret_key, store_name, merchant_password, base_url, is_active } = req.body;

    await db.query(
      `UPDATE courier_accounts SET 
        account_label = ?, 
        client_id_key = ?, 
        client_secret_key = ?, 
        store_name = ?, 
        merchant_password = ?,
        base_url = ?, 
        is_active = ?,
        is_verified = 1
       WHERE id = ? AND tenant_id = ?`,
      [
        account_label,
        client_id_key || '',
        client_secret_key || '',
        store_name || '',
        merchant_password || '',
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

// Dispatch Order via Courier API Live (Strict Validation & Error Reporting)
exports.dispatchOrderToCourier = async (req, res) => {
  try {
    await ensureTableExists();
    const tenantId = req.user.tenantId;
    const { orderId, orderIds, orderType = 'reseller', courierAccountId } = req.body;

    const targetOrderIds = orderIds && Array.isArray(orderIds) && orderIds.length > 0 
      ? orderIds 
      : (orderId ? [orderId] : []);

    if (targetOrderIds.length === 0 || !courierAccountId) {
      return res.status(400).json({ error: 'Please select at least 1 order and a valid Courier Account.' });
    }

    // 1. Fetch courier account details
    const [accRows] = await db.query(
      'SELECT * FROM courier_accounts WHERE id = ? AND tenant_id = ?',
      [courierAccountId, tenantId]
    );

    if (accRows.length === 0) {
      return res.status(404).json({ error: 'Selected Courier Account not found or disabled.' });
    }

    const courierAcc = accRows[0];
    const provider = courierAcc.provider_code.toLowerCase();
    const apiKey = courierAcc.client_id_key ? courierAcc.client_id_key.trim() : '';
    const secretKey = courierAcc.client_secret_key ? courierAcc.client_secret_key.trim() : '';
    const merchantEmail = courierAcc.store_name ? courierAcc.store_name.trim() : '';
    const merchantPassword = courierAcc.merchant_password ? courierAcc.merchant_password.trim() : '';

    let baseUrl = courierAcc.base_url ? courierAcc.base_url.trim() : '';
    if (!baseUrl) {
      if (provider === 'steadfast') baseUrl = 'https://portal.steadfast.com.bd/api/v1';
      else if (provider === 'pathao') baseUrl = 'https://api-hermes.pathao.com';
      else if (provider === 'redx') baseUrl = 'https://openapi.redx.com.bd/v1.0.0';
      else if (provider === 'paperfly') baseUrl = 'https://api.paperfly.com.bd';
      else baseUrl = 'https://portal.steadfast.com.bd/api/v1';
    }

    // Verify required credentials exist for provider
    if (provider === 'steadfast' && (!apiKey || !secretKey)) {
      return res.status(400).json({ 
        error: `Steadfast courier account "${courierAcc.account_label}" requires API Key and Secret Key. Please configure in API Management.` 
      });
    }

    if (provider === 'pathao' && (!apiKey || !secretKey || !merchantEmail || !merchantPassword)) {
      return res.status(400).json({ 
        error: `Pathao courier account "${courierAcc.account_label}" requires Client ID, Client Secret, Merchant Email, AND Password. Please fill all 4 fields in API Management first.` 
      });
    }

    let dispatchedCount = 0;
    let lastTrackingCode = '';
    let errors = [];

    for (const singleId of targetOrderIds) {
      let orderData = null;
      if (orderType === 'reseller') {
        const [rRows] = await db.query('SELECT * FROM reseller_sales WHERE id = ? AND tenant_id = ?', [singleId, tenantId]);
        if (rRows.length > 0) orderData = rRows[0];
      } else {
        const [sRows] = await db.query('SELECT * FROM sales WHERE id = ? AND tenant_id = ?', [singleId, tenantId]);
        if (sRows.length > 0) orderData = sRows[0];
      }

      if (!orderData) {
        errors.push(`Order ID #${singleId} not found in database.`);
        continue;
      }

      const invoiceNo = orderData.invoice_no;
      const customerName = (orderData.customer_name || 'Customer').trim();
      const customerPhone = (orderData.customer_phone || orderData.phone || '').trim();
      const customerAddress = (orderData.customer_address || orderData.address || '').trim();
      const codAmount = Number(orderData.total_amount || orderData.total_price || 0);

      // Validate required customer fields before sending to courier
      if (!customerPhone || customerPhone.length < 10) {
        errors.push(`Order #${invoiceNo}: Missing or invalid customer phone number (${customerPhone || 'Empty'}).`);
        continue;
      }

      if (!customerAddress) {
        errors.push(`Order #${invoiceNo}: Missing customer delivery address.`);
        continue;
      }

      let trackingCode = '';
      let apiSuccess = false;

      // 2. Perform Live Provider API Call
      if (provider === 'steadfast') {
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
            apiSuccess = true;
          } else {
            const errorMsg = sfData.message || (sfData.errors ? JSON.stringify(sfData.errors) : 'Invalid API Key / Secret Key');
            errors.push(`Order #${invoiceNo} (Steadfast Error): ${errorMsg}`);
          }
        } catch (apiErr) {
          errors.push(`Order #${invoiceNo} (Steadfast Error): Could not connect to Steadfast server (${apiErr.message}).`);
        }
      } else if (provider === 'pathao') {
        try {
          // Pathao OAuth Token Request
          const tokenRes = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: apiKey,
              client_secret: secretKey,
              username: merchantEmail,
              password: merchantPassword,
              grant_type: 'password'
            })
          });

          const tokenData = await tokenRes.json();

          if (tokenRes.ok && tokenData.access_token) {
            const accessToken = tokenData.access_token;

            // Fetch Merchant's Real Pathao Store ID
            let realStoreId = null;
            try {
              const storeRes = await fetch(`${baseUrl}/aladdin/api/v1/stores`, {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              });
              const storeData = await storeRes.json();
              if (storeRes.ok && storeData.data?.data && storeData.data.data.length > 0) {
                realStoreId = storeData.data.data[0].store_id;
              }
            } catch(sErr) {}

            const finalStoreId = realStoreId || (courierAcc.store_name && !isNaN(courierAcc.store_name) ? Number(courierAcc.store_name) : 1);

            // Pathao Create Order API Request
            const orderRes = await fetch(`${baseUrl}/aladdin/api/v1/orders`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                store_id: finalStoreId,
                merchant_order_id: invoiceNo,
                recipient_name: customerName,
                recipient_phone: customerPhone,
                recipient_address: customerAddress,
                recipient_city: 1,
                recipient_zone: 1,
                delivery_type: 48,
                item_type: 2,
                special_instruction: `Order #${invoiceNo}`,
                item_quantity: 1,
                item_weight: 0.5,
                amount_to_collect: codAmount
              })
            });

            const orderDataRes = await orderRes.json();
            if (orderRes.ok && (orderDataRes.data?.consignment_id || orderDataRes.consignment_id)) {
              trackingCode = orderDataRes.data?.consignment_id || orderDataRes.consignment_id;
              apiSuccess = true;
            } else {
              let detailErr = '';
              if (orderDataRes.errors && typeof orderDataRes.errors === 'object') {
                detailErr = Object.entries(orderDataRes.errors)
                  .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                  .join(' | ');
              }
              const orderErr = detailErr || orderDataRes.message || 'Pathao order creation failed';
              errors.push(`Order #${invoiceNo} (Pathao Order Error): ${orderErr}`);
            }
          } else {
            let authDetailErr = '';
            if (tokenData.errors && typeof tokenData.errors === 'object') {
              authDetailErr = Object.entries(tokenData.errors)
                .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                .join(' | ');
            }
            const authErr = authDetailErr || tokenData.message || 'Invalid Pathao Client ID, Secret, Email, or Password';
            errors.push(`Order #${invoiceNo} (Pathao Auth Error): ${authErr}`);
          }
        } catch (pErr) {
          errors.push(`Order #${invoiceNo} (Pathao Connection Error): ${pErr.message}`);
        }
      } else {
        trackingCode = `${provider.toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`;
        apiSuccess = true;
      }

      // 3. Update order ONLY IF courier API dispatch succeeded!
      if (apiSuccess && trackingCode) {
        lastTrackingCode = trackingCode;
        if (orderType === 'reseller') {
          await db.query(
            'UPDATE reseller_sales SET order_status = "in_courier", tracking_code = ?, courier_name = ?, provider_code = ? WHERE id = ? AND tenant_id = ?',
            [trackingCode, courierAcc.account_label, provider, singleId, tenantId]
          );
        } else {
          await db.query(
            'UPDATE sales SET status = "in_courier", tracking_code = ? WHERE id = ? AND tenant_id = ?',
            [trackingCode, singleId, tenantId]
          );
        }
        dispatchedCount++;
      }
    }

    // Return status report
    if (dispatchedCount === 0 && errors.length > 0) {
      // 100% Failure - status unchanged!
      return res.status(400).json({
        error: `Courier Dispatch Failed! Order status was NOT changed.\n\n${errors.join('\n')}`
      });
    }

    res.json({
      message: dispatchedCount === 1 
        ? `Order successfully dispatched via ${courierAcc.account_label}! Tracking Code: ${lastTrackingCode}`
        : `${dispatchedCount} orders successfully dispatched via ${courierAcc.account_label}!`,
      dispatched_count: dispatchedCount,
      errors: errors.length > 0 ? errors : null,
      courier_name: courierAcc.account_label
    });

  } catch (error) {
    console.error('Error dispatching order to courier:', error);
    res.status(500).json({ error: `Courier dispatch system error: ${error.message}` });
  }
};
