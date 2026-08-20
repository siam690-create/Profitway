const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Helper to ensure database tables & columns exist
const ensureResellerSchema = async (conn) => {
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS reseller_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        user_id INT DEFAULT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) DEFAULT NULL,
        email VARCHAR(255) DEFAULT NULL,
        password VARCHAR(255) DEFAULT NULL,
        address TEXT DEFAULT NULL,
        bkash_no VARCHAR(50) DEFAULT NULL,
        nagad_no VARCHAR(50) DEFAULT NULL,
        bank_info TEXT DEFAULT NULL,
        status ENUM('active', 'pending', 'suspended') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_reseller_tenant (tenant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Migration for password column if missing
    const [passCols] = await conn.query(`SHOW COLUMNS FROM reseller_profiles LIKE 'password'`);
    if (passCols.length === 0) {
      await conn.query(`ALTER TABLE reseller_profiles ADD COLUMN password VARCHAR(255) DEFAULT NULL`);
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS reseller_payouts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        reseller_id INT DEFAULT NULL,
        reseller_name VARCHAR(255) DEFAULT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'bKash',
        account_id INT DEFAULT NULL,
        transaction_ref VARCHAR(100) DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        payout_date DATE DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_payout_tenant (tenant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS reseller_delivery_zones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        zone_name VARCHAR(255) NOT NULL,
        charge DECIMAL(10,2) NOT NULL DEFAULT 60.00,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_zone_tenant (tenant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Add reseller columns to reseller_sales table if missing
    const [cols] = await conn.query(`SHOW COLUMNS FROM reseller_sales LIKE 'order_status'`);
    if (cols.length === 0) {
      await conn.query(`ALTER TABLE reseller_sales ADD COLUMN order_status VARCHAR(50) DEFAULT 'delivered'`);
    }
    const [pCols] = await conn.query(`SHOW COLUMNS FROM reseller_sales LIKE 'payout_status'`);
    if (pCols.length === 0) {
      await conn.query(`ALTER TABLE reseller_sales ADD COLUMN payout_status VARCHAR(50) DEFAULT 'unpaid'`);
    }
    const [cCols] = await conn.query(`SHOW COLUMNS FROM reseller_sales LIKE 'reseller_wholesale_cost'`);
    if (cCols.length === 0) {
      await conn.query(`ALTER TABLE reseller_sales ADD COLUMN reseller_wholesale_cost DECIMAL(10,2) DEFAULT 0.00`);
    }
    const [prCols] = await conn.query(`SHOW COLUMNS FROM reseller_sales LIKE 'reseller_profit'`);
    if (prCols.length === 0) {
      await conn.query(`ALTER TABLE reseller_sales ADD COLUMN reseller_profit DECIMAL(10,2) DEFAULT 0.00`);
    }
    const [rlCols] = await conn.query(`SHOW COLUMNS FROM reseller_sales LIKE 'return_loss'`);
    if (rlCols.length === 0) {
      await conn.query(`ALTER TABLE reseller_sales ADD COLUMN return_loss DECIMAL(10,2) DEFAULT 0.00`);
    }
    const [addrCols] = await conn.query(`SHOW COLUMNS FROM reseller_sales LIKE 'customer_address'`);
    if (addrCols.length === 0) {
      await conn.query(`ALTER TABLE reseller_sales ADD COLUMN customer_address TEXT DEFAULT NULL`);
    }
    const [distCols] = await conn.query(`SHOW COLUMNS FROM reseller_sales LIKE 'district'`);
    if (distCols.length === 0) {
      await conn.query(`ALTER TABLE reseller_sales ADD COLUMN district VARCHAR(100) DEFAULT NULL`);
    }
    const [thanaCols] = await conn.query(`SHOW COLUMNS FROM reseller_sales LIKE 'thana'`);
    if (thanaCols.length === 0) {
      await conn.query(`ALTER TABLE reseller_sales ADD COLUMN thana VARCHAR(100) DEFAULT NULL`);
    }
    const [courCols] = await conn.query(`SHOW COLUMNS FROM reseller_sales LIKE 'courier_name'`);
    if (courCols.length === 0) {
      await conn.query(`ALTER TABLE reseller_sales ADD COLUMN courier_name VARCHAR(100) DEFAULT NULL`);
    }
    const [rIdCols] = await conn.query(`SHOW COLUMNS FROM reseller_sales LIKE 'reseller_id'`);
    if (rIdCols.length === 0) {
      await conn.query(`ALTER TABLE reseller_sales ADD COLUMN reseller_id INT DEFAULT NULL`);
    }
    const [poIdCols] = await conn.query(`SHOW COLUMNS FROM reseller_sales LIKE 'payout_id'`);
    if (poIdCols.length === 0) {
      await conn.query(`ALTER TABLE reseller_sales ADD COLUMN payout_id INT DEFAULT NULL`);
    }
    const [srcCols] = await conn.query(`SHOW COLUMNS FROM reseller_sales LIKE 'order_source'`);
    if (srcCols.length === 0) {
      await conn.query(`ALTER TABLE reseller_sales ADD COLUMN order_source VARCHAR(50) DEFAULT 'manual'`);
    }
    const [caCols] = await conn.query(`SHOW COLUMNS FROM reseller_sales LIKE 'collected_amount'`);
    if (caCols.length === 0) {
      await conn.query(`ALTER TABLE reseller_sales ADD COLUMN collected_amount DECIMAL(10,2) DEFAULT 0.00`);
    }
    try {
      await conn.query("ALTER TABLE reseller_sales ALTER order_status SET DEFAULT 'new'");
    } catch(e) {}
  } catch (e) {
    console.error('Schema migration error in resellerPortalController:', e);
  }
};

// Helper to resolve tenant ID safely for public or authenticated reseller requests
const resolveTenantId = async (req) => {
  if (req.user && req.user.tenantId) {
    return req.user.tenantId;
  }
  const resellerName = req.query.reseller_name || req.query.reseller_id || req.body.reseller_name || req.body.reseller_id || req.body.identifier;
  if (resellerName) {
    const [pRows] = await db.query(
      `SELECT tenant_id FROM reseller_profiles WHERE id = ? OR name = ? OR email = ? OR phone = ? LIMIT 1`,
      [resellerName, resellerName, resellerName, resellerName]
    );
    if (pRows.length > 0) {
      return pRows[0].tenant_id;
    }
  }
  if (req.query.tenant_id) {
    return Number(req.query.tenant_id);
  }
  // Fallback to primary tenant with inventory products
  const [tRows] = await db.query(`SELECT tenant_id, COUNT(*) as cnt FROM products GROUP BY tenant_id ORDER BY cnt DESC LIMIT 1`);
  if (tRows.length > 0) {
    return tRows[0].tenant_id;
  }
  return 1;
};

// 1. Get Product Catalog with Wholesale Reseller Price
exports.getResellerCatalog = async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);

    const connection = await db.getConnection();
    try {
      await ensureResellerSchema(connection);
    } finally {
      connection.release();
    }

    const [products] = await db.query(
      `SELECT id, name, sku, category_id, cost_price, selling_price, reseller_price, stock_quantity, unit, location, is_combo 
       FROM products 
       WHERE tenant_id = ? 
       ORDER BY name ASC`,
      [tenantId]
    );

    for (let prod of products) {
      if (prod.is_combo) {
        const [comboItems] = await db.query(
          `SELECT ci.*, p.stock_quantity as child_stock
           FROM combo_items ci
           JOIN products p ON ci.child_product_id = p.id
           WHERE ci.combo_product_id = ? AND ci.tenant_id = ?`,
          [prod.id, tenantId]
        );
        if (comboItems.length > 0) {
          let maxComboPossible = Infinity;
          for (const cItem of comboItems) {
            const childAvailable = Number(cItem.child_stock || 0);
            const requiredPerCombo = Number(cItem.quantity || 1);
            const possibleFromThisChild = Math.floor(childAvailable / requiredPerCombo);
            if (possibleFromThisChild < maxComboPossible) {
              maxComboPossible = possibleFromThisChild;
            }
          }
          prod.stock_quantity = maxComboPossible === Infinity ? 0 : maxComboPossible;
        } else {
          prod.stock_quantity = 0;
        }
      }
    }

    const catalog = products.map(p => ({
      id: p.id,
      name: p.name || 'Unnamed Product',
      sku: p.sku || `SKU-${p.id}`,
      stock_quantity: Number(p.stock_quantity || 0),
      unit: p.unit || 'Pcs',
      retail_price: Number(p.selling_price || 0),
      reseller_price: Number(p.reseller_price || p.cost_price || 0),
      is_combo: Boolean(p.is_combo)
    }));

    res.json(catalog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Submit Reseller Customer Order
exports.submitResellerOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = await resolveTenantId(req);
    await connection.beginTransaction();

    await ensureResellerSchema(connection);

    const {
      reseller_name,
      reseller_id,
      customer_name,
      customer_phone,
      customer_address,
      district,
      thana,
      courier_name,
      items,
      customer_total_price,
      delivery_fee_charged,
      notes
    } = req.body;

    if (!reseller_name || !customer_phone || !items || !Array.isArray(items) || items.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Reseller Name, Customer Phone, and at least 1 product item are required.' });
    }

    let calculatedResellerWholesaleCost = 0;

    // Calculate Reseller Wholesale Cost for the items
    for (const item of items) {
      const qty = Number(item.quantity || 1);

      const [pRows] = await connection.query(
        'SELECT reseller_price, cost_price, selling_price, name FROM products WHERE id = ? AND tenant_id = ?',
        [item.product_id, tenantId]
      );

      let unitResellerPrice = 0;
      if (pRows.length > 0) {
        unitResellerPrice = Number(pRows[0].reseller_price || pRows[0].cost_price || 0);
        item.product_name = pRows[0].name;
      } else {
        unitResellerPrice = Number(item.unit_reseller_price || item.unit_price || 0);
      }

      item.unit_cost = unitResellerPrice;
      item.total_cost = unitResellerPrice * qty;
      calculatedResellerWholesaleCost += item.total_cost;
    }

    const customerPrice = Number(customer_total_price || 0);
    const delivFee = Number(delivery_fee_charged || 0);

    // Est Profit = Total COD - (Wholesale Price + Delivery Charge)
    const totalCOD = customerPrice;
    const resellerProfit = Math.max(0, totalCOD - (calculatedResellerWholesaleCost + delivFee));
    const invNo = `RSL-${Date.now().toString().slice(-6)}`;
    const formattedDate = new Date().toISOString().slice(0, 10);

    // Insert into reseller_sales
    const [result] = await connection.query(
      `INSERT INTO reseller_sales 
        (tenant_id, reseller_id, reseller_name, customer_name, customer_phone, customer_address, district, thana, courier_name, invoice_no, total_amount, total_cost, gross_profit, delivery_fee_charged, courier_actual_cost, delivery_profit, order_status, payout_status, reseller_wholesale_cost, reseller_profit, order_source, sale_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, 0.00, 'new', 'unpaid', ?, ?, 'portal', ?, ?)`,
      [
        tenantId,
        reseller_id || null,
        reseller_name.trim(),
        customer_name ? customer_name.trim() : null,
        customer_phone.trim(),
        customer_address || null,
        district || null,
        thana || null,
        courier_name || 'Steadfast',
        invNo,
        customerPrice,
        calculatedResellerWholesaleCost,
        resellerProfit,
        delivFee,
        calculatedResellerWholesaleCost,
        resellerProfit,
        formattedDate,
        notes || null
      ]
    );

    const saleId = result.insertId;

    // Insert items into reseller_sale_items
    for (const item of items) {
      const qty = Number(item.quantity || 1);
      const unitCost = Number(item.unit_cost || 0);
      const unitPrice = Number(item.unit_price || unitCost);
      const totalPrice = qty * unitPrice;
      const itemProfit = qty * (unitPrice - unitCost);

      await connection.query(
        `INSERT INTO reseller_sale_items 
          (tenant_id, reseller_sale_id, product_id, product_name, quantity, unit_cost, unit_price, total_price, item_profit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId,
          saleId,
          item.product_id || null,
          item.product_name || 'Product',
          qty,
          unitCost,
          unitPrice,
          totalPrice,
          itemProfit
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: `Reseller Order #${invNo} submitted successfully! Status: Pending Approval.`,
      orderId: saleId,
      invoice_no: invNo,
      reseller_profit: resellerProfit
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error submitting reseller order:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// 2b. Bulk Submit Reseller Orders via Excel/Batch
exports.bulkSubmitResellerOrders = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = await resolveTenantId(req);
    await connection.beginTransaction();

    await ensureResellerSchema(connection);

    const { reseller_name, reseller_id, orders } = req.body;

    if (!reseller_name || !orders || !Array.isArray(orders) || orders.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Reseller Name and an array of valid order rows are required.' });
    }

    let createdCount = 0;
    let errors = [];

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const customerName = (order.customer_name || 'Customer').trim();
      const customerPhone = (order.customer_phone || order.phone || '').trim();
      const customerAddress = (order.customer_address || order.address || '').trim();
      const district = order.district || 'Dhaka';
      const thana = order.thana || '';
      const courierName = order.courier_name || 'Steadfast';
      const items = order.items || [];
      const customerTotalPrice = Number(order.customer_total_price || order.total_amount || 0);
      const deliveryFeeCharged = Number(order.delivery_fee_charged || 100);
      const notes = order.notes || '';

      if (!customerPhone || items.length === 0) {
        errors.push(`Row ${i + 1}: Missing customer phone or product item.`);
        continue;
      }

      let calculatedResellerWholesaleCost = 0;

      for (const item of items) {
        const qty = Number(item.quantity || 1);

        let pRows = [];
        if (item.product_id) {
          [pRows] = await connection.query(
            'SELECT reseller_price, cost_price, selling_price, name FROM products WHERE id = ? AND tenant_id = ?',
            [item.product_id, tenantId]
          );
        } else if (item.sku) {
          [pRows] = await connection.query(
            'SELECT id, reseller_price, cost_price, selling_price, name FROM products WHERE (sku = ? OR name = ?) AND tenant_id = ?',
            [item.sku, item.sku, tenantId]
          );
          if (pRows.length > 0) item.product_id = pRows[0].id;
        }

        let unitResellerPrice = 0;
        if (pRows.length > 0) {
          unitResellerPrice = Number(pRows[0].reseller_price || pRows[0].cost_price || 0);
          item.product_name = pRows[0].name;
        } else {
          unitResellerPrice = Number(item.unit_reseller_price || item.unit_price || 0);
        }

        item.unit_cost = unitResellerPrice;
        item.total_cost = unitResellerPrice * qty;
        calculatedResellerWholesaleCost += item.total_cost;
      }

      const totalCOD = customerTotalPrice;
      const resellerProfit = Math.max(0, totalCOD - (calculatedResellerWholesaleCost + deliveryFeeCharged));
      const invNo = `RSL-${Date.now().toString().slice(-5)}${i}`;
      const formattedDate = new Date().toISOString().slice(0, 10);

      // Insert into reseller_sales
      const [resellerSaleResult] = await connection.query(
        `INSERT INTO reseller_sales 
          (tenant_id, reseller_id, reseller_name, customer_name, customer_phone, customer_address, district, thana, courier_name, invoice_no, total_amount, total_cost, gross_profit, delivery_fee_charged, courier_actual_cost, delivery_profit, order_status, payout_status, reseller_wholesale_cost, reseller_profit, order_source, sale_date, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, 0.00, 'new', 'unpaid', ?, ?, 'portal_bulk', ?, ?)`,
        [
          tenantId,
          reseller_id || null,
          reseller_name.trim(),
          customerName,
          customerPhone,
          customerAddress,
          district,
          thana,
          courierName,
          invNo,
          totalCOD,
          calculatedResellerWholesaleCost,
          resellerProfit,
          deliveryFeeCharged,
          calculatedResellerWholesaleCost,
          resellerProfit,
          formattedDate,
          notes
        ]
      );

      const resellerSaleId = resellerSaleResult.insertId;

      // Insert item records
      for (const item of items) {
        await connection.query(
          `INSERT INTO reseller_sale_items (tenant_id, reseller_sale_id, product_id, product_name, quantity, unit_cost, total_cost)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            tenantId,
            resellerSaleId,
            item.product_id || null,
            item.product_name || 'Product',
            Number(item.quantity || 1),
            Number(item.unit_cost || 0),
            Number(item.total_cost || 0)
          ]
        );
      }

      createdCount++;
    }

    await connection.commit();

    res.json({
      message: `Successfully created ${createdCount} reseller orders in bulk!`,
      created_count: createdCount,
      errors: errors.length > 0 ? errors : null
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error bulk submitting reseller orders:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// 3. Get Reseller Orders List with Statuses
exports.getResellerOrders = async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);
    const { reseller_name, reseller_id } = req.query;

    let query = `SELECT * FROM reseller_sales WHERE tenant_id = ?`;
    const params = [tenantId];

    if (reseller_id) {
      query += ` AND reseller_id = ?`;
      params.push(reseller_id);
    } else if (reseller_name) {
      query += ` AND reseller_name = ?`;
      params.push(reseller_name);
    }

    query += ` ORDER BY id DESC`;

    const [sales] = await db.query(query, params);

    for (let s of sales) {
      const [items] = await db.query('SELECT * FROM reseller_sale_items WHERE reseller_sale_id = ? AND tenant_id = ?', [s.id, tenantId]);
      s.items = items;
    }

    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Get Reseller Earnings Wallet & P&L Summary
exports.getResellerWallet = async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);
    const { reseller_name, reseller_id } = req.query;

    const connection = await db.getConnection();
    try {
      await ensureResellerSchema(connection);
    } finally {
      connection.release();
    }

    let salesQuery = `SELECT * FROM reseller_sales WHERE tenant_id = ?`;
    const params = [tenantId];

    if (reseller_id) {
      salesQuery += ` AND reseller_id = ?`;
      params.push(reseller_id);
    } else if (reseller_name) {
      salesQuery += ` AND reseller_name = ?`;
      params.push(reseller_name);
    }

    salesQuery += ` ORDER BY id DESC`;

    const [sales] = await db.query(salesQuery, params);

    for (let s of sales) {
      const [items] = await db.query(
        'SELECT * FROM reseller_sale_items WHERE reseller_sale_id = ? AND tenant_id = ?',
        [s.id, tenantId]
      );
      s.items = items;
    }

    let totalDeliveredRevenue = 0;
    let totalDeliveredProfit = 0;
    let totalReturnLoss = 0;
    let totalReturnProfit = 0;
    let deliveredCount = 0;
    let pendingCount = 0;
    let returnedCount = 0;
    let cancelledCount = 0;

    sales.forEach(s => {
      const status = (s.order_status || 'new').toLowerCase();
      const isPartial = status.includes('partial');
      const isDelivered = status === 'delivered' || status === 'completed';
      const isReturned = status === 'returned';
      const isCancelled = status === 'cancelled' || status === 'deleted';

      const totalCOD = Number(s.total_amount || 0);
      const wholesaleCost = Number(s.reseller_wholesale_cost || s.total_cost || 0);
      const delivFee = Number(s.delivery_fee_charged || 0);
      const customerPaidReturn = Number(s.customer_paid_return || 0);
      const collectedAmt = Number(s.collected_amount || s.total_amount || 0);

      if (isDelivered) {
        deliveredCount++;
        totalDeliveredRevenue += totalCOD;
        const profit = Math.max(0, totalCOD - (wholesaleCost + delivFee));
        totalDeliveredProfit += profit;
      } else if (isPartial) {
        deliveredCount++;
        totalDeliveredRevenue += collectedAmt;
        const partialNet = collectedAmt - (wholesaleCost + delivFee);
        if (partialNet < 0) {
          totalReturnLoss += Math.abs(partialNet);
        } else {
          totalDeliveredProfit += partialNet;
        }
      } else if (isReturned) {
        returnedCount++;
        const netReturn = customerPaidReturn - delivFee;
        if (netReturn < 0) {
          totalReturnLoss += Math.abs(netReturn);
        } else {
          totalReturnProfit += netReturn;
        }
      } else if (isCancelled) {
        cancelledCount++;
      } else {
        pendingCount++;
      }
    });

    const netProfit = (totalDeliveredProfit + totalReturnProfit) - totalReturnLoss;

    // Calculate payouts
    let payoutQuery = `SELECT * FROM reseller_payouts WHERE tenant_id = ?`;
    const payoutParams = [tenantId];
    if (reseller_id) {
      payoutQuery += ` AND reseller_id = ?`;
      payoutParams.push(reseller_id);
    } else if (reseller_name) {
      payoutQuery += ` AND reseller_name = ?`;
      payoutParams.push(reseller_name);
    }
    payoutQuery += ` ORDER BY id DESC`;

    const [payouts] = await db.query(payoutQuery, payoutParams);

    const paidAmount = payouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const availableBalance = Math.max(0, netProfit - paidAmount);

    res.json({
      summary: {
        total_delivered_revenue: Number(totalDeliveredRevenue.toFixed(2)),
        total_delivered_profit: Number(totalDeliveredProfit.toFixed(2)),
        total_return_loss: Number(totalReturnLoss.toFixed(2)),
        net_profit: Number(netProfit.toFixed(2)),
        paid_amount: Number(paidAmount.toFixed(2)),
        available_balance: Number(availableBalance.toFixed(2)),
        delivered_count: deliveredCount,
        pending_count: pendingCount,
        returned_count: returnedCount
      },
      payouts,
      orders: sales
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. Admin Reseller Payout Execution
exports.processResellerPayout = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    await connection.beginTransaction();

    await ensureResellerSchema(connection);

    const { reseller_id, reseller_name, amount, payment_method, account_id, notes } = req.body;

    const payoutAmt = Number(amount);
    if (isNaN(payoutAmt) || payoutAmt <= 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Valid payout amount is required.' });
    }

    // 1. If account_id is provided, deduct from store Cash/Bank account
    let accountName = 'Cash / Direct';
    if (account_id) {
      const [accRows] = await connection.query(
        'SELECT balance, name FROM finance_accounts WHERE id = ? AND tenant_id = ? FOR UPDATE',
        [account_id, tenantId]
      );
      if (accRows.length === 0) throw new Error('Selected finance account not found.');
      if (Number(accRows[0].balance) < payoutAmt) {
        throw new Error(`Insufficient funds in "${accRows[0].name}". Available: ৳${accRows[0].balance}, Paying: ৳${payoutAmt}`);
      }

      accountName = accRows[0].name;

      await connection.query(
        'UPDATE finance_accounts SET balance = balance - ? WHERE id = ? AND tenant_id = ?',
        [payoutAmt, account_id, tenantId]
      );
    }

    const txRef = `RSL-PAY-${Date.now()}`;
    const todayDate = new Date().toISOString().slice(0, 10);

    // 2. Insert into reseller_payouts table
    const [payoutRes] = await connection.query(
      `INSERT INTO reseller_payouts (tenant_id, reseller_id, reseller_name, amount, payment_method, account_id, transaction_ref, notes, payout_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        reseller_id || null,
        reseller_name ? reseller_name.trim() : 'Reseller',
        payoutAmt,
        payment_method || 'bKash',
        account_id || null,
        txRef,
        notes || null,
        todayDate
      ]
    );

    // 3. Log into account_transactions for store Passbook Ledger
    if (account_id) {
      await connection.query(
        `INSERT INTO account_transactions (tenant_id, account_id, type, debit, credit, reference_no, notes, transaction_date)
         VALUES (?, ?, 'Reseller Profit Payout', ?, 0.00, ?, ?, NOW())`,
        [tenantId, account_id, payoutAmt, txRef, `Reseller Profit Payout to ${reseller_name || 'Reseller'}${notes ? ` - ${notes}` : ''}`]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: `Successfully paid ৳${payoutAmt.toFixed(2)} payout to reseller "${reseller_name || 'Reseller'}"!`,
      payoutId: payoutRes.insertId,
      txRef
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error processing reseller payout:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// 6. Get all Reseller Profiles
exports.getResellerProfiles = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const connection = await db.getConnection();
    try {
      await ensureResellerSchema(connection);
    } finally {
      connection.release();
    }

    const [profiles] = await db.query(
      `SELECT * FROM reseller_profiles WHERE tenant_id = ? ORDER BY id DESC`,
      [tenantId]
    );

    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 7. Create Reseller Profile
exports.createResellerProfile = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, phone, email, password, address, bkash_no, nagad_no, bank_info, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Reseller Name is required.' });
    }

    const connection = await db.getConnection();
    try {
      await ensureResellerSchema(connection);
    } finally {
      connection.release();
    }

    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password.trim(), 10);
    }

    const [result] = await db.query(
      `INSERT INTO reseller_profiles (tenant_id, name, phone, email, password, address, bkash_no, nagad_no, bank_info, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        name.trim(),
        phone ? phone.trim() : null,
        email ? email.trim() : null,
        hashedPassword,
        address || null,
        bkash_no ? bkash_no.trim() : null,
        nagad_no ? nagad_no.trim() : null,
        bank_info || null,
        status || 'active'
      ]
    );

    res.status(201).json({
      message: `Reseller Profile created for "${name}"! Login email: ${email || phone || name}`,
      profileId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 8. Update Reseller Profile
exports.updateResellerProfile = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { name, phone, email, password, address, bkash_no, nagad_no, bank_info, status } = req.body;

    let hashedPasswordSql = '';
    const params = [
      name ? name.trim() : 'Reseller',
      phone ? phone.trim() : null,
      email ? email.trim() : null,
      address || null,
      bkash_no ? bkash_no.trim() : null,
      nagad_no ? nagad_no.trim() : null,
      bank_info || null,
      status || 'active'
    ];

    if (password && password.trim() !== '') {
      const hp = await bcrypt.hash(password.trim(), 10);
      hashedPasswordSql = `, password = ?`;
      params.push(hp);
    }

    params.push(id, tenantId);

    await db.query(
      `UPDATE reseller_profiles 
       SET name = ?, phone = ?, email = ?, address = ?, bkash_no = ?, nagad_no = ?, bank_info = ?, status = ? ${hashedPasswordSql}
       WHERE id = ? AND tenant_id = ?`,
      params
    );

    res.json({ message: 'Reseller profile updated successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 9. Delete Reseller Profile
exports.deleteResellerProfile = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    await db.query('DELETE FROM reseller_profiles WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    res.json({ message: 'Reseller profile deleted successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 10. Reseller Dedicated Portal Login
exports.resellerLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email, phone, or name

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Please enter Email/Phone and Password.' });
    }

    const connection = await db.getConnection();
    try {
      await ensureResellerSchema(connection);
    } finally {
      connection.release();
    }

    const [profiles] = await db.query(
      `SELECT * FROM reseller_profiles 
       WHERE (email = ? OR phone = ? OR name = ?) AND status = 'active'
       LIMIT 1`,
      [identifier.trim(), identifier.trim(), identifier.trim()]
    );

    if (profiles.length === 0) {
      return res.status(401).json({ error: 'Invalid reseller login credentials or account suspended.' });
    }

    const reseller = profiles[0];

    if (reseller.password) {
      const isMatch = await bcrypt.compare(password.trim(), reseller.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect portal password.' });
      }
    }

    res.json({
      message: `Welcome back, ${reseller.name}!`,
      reseller: {
        id: reseller.id,
        name: reseller.name,
        email: reseller.email,
        phone: reseller.phone,
        status: reseller.status
      }
    });
  } catch (error) {
    console.error('Error logging in reseller:', error);
    res.status(500).json({ error: error.message });
  }
};

// 11. Admin: Get All Reseller Submitted Orders across Profiles for Tenant
exports.getAllResellerOrdersForAdmin = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const connection = await db.getConnection();
    try {
      await ensureResellerSchema(connection);
    } finally {
      connection.release();
    }

    const [sales] = await db.query(
      `SELECT * FROM reseller_sales 
       WHERE tenant_id = ? 
         AND (order_source = 'portal' OR (customer_phone IS NOT NULL AND customer_phone != '' AND reseller_profit > 0))
       ORDER BY id DESC`,
      [tenantId]
    );

    for (let s of sales) {
      const [items] = await db.query(
        'SELECT * FROM reseller_sale_items WHERE reseller_sale_id = ? AND tenant_id = ?',
        [s.id, tenantId]
      );
      s.items = items;
    }

    res.json(sales);
  } catch (error) {
    console.error('Error fetching admin reseller orders:', error);
    res.status(500).json({ error: error.message });
  }
};

// 12. Admin: Update Reseller Order Status (Approve, Ship, Deliver, Return, Cancel)
exports.updateResellerOrderStatusByAdmin = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { order_status, return_loss, notes } = req.body;

    if (!order_status) {
      return res.status(400).json({ error: 'order_status is required.' });
    }

    await connection.beginTransaction();

    const [saleRows] = await connection.query(
      'SELECT * FROM reseller_sales WHERE id = ? AND tenant_id = ? FOR UPDATE',
      [id, tenantId]
    );

    if (saleRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Reseller order not found.' });
    }

    const sale = saleRows[0];
    const prevStatus = (sale.order_status || 'pending').toLowerCase();
    const newStatus = order_status.toLowerCase();

    const [items] = await connection.query(
      'SELECT * FROM reseller_sale_items WHERE reseller_sale_id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    // Stock management logic:
    // If going from 'pending'/'cancelled' -> 'processing'/'shipped'/'delivered': deduct stock if not already deducted!
    // If going to 'returned' or 'cancelled' from an active status: restore stock!

    if ((prevStatus === 'pending' || prevStatus === 'cancelled') && (newStatus === 'processing' || newStatus === 'shipped' || newStatus === 'delivered')) {
      // Deduct stock for ordered items
      for (const item of items) {
        if (item.product_id) {
          await connection.query(
            'UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE id = ? AND tenant_id = ?',
            [item.quantity, item.product_id, tenantId]
          );
        }
      }
    } else if ((prevStatus === 'processing' || prevStatus === 'shipped' || prevStatus === 'delivered') && (newStatus === 'returned' || newStatus === 'cancelled')) {
      // Restore stock for items
      for (const item of items) {
        if (item.product_id) {
          await connection.query(
            'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ? AND tenant_id = ?',
            [item.quantity, item.product_id, tenantId]
          );
        }
      }
    }

    let finalProfit = Number(sale.reseller_profit || 0);
    let finalLoss = Number(sale.return_loss || 0);
    const { customer_paid_return, collected_amount } = req.body;
    let paidReturnAmt = Number(customer_paid_return !== undefined ? customer_paid_return : (sale.customer_paid_return || 0));
    let collectedAmt = Number(collected_amount !== undefined ? collected_amount : (sale.collected_amount || sale.total_amount || 0));

    const totalCOD = Number(sale.total_amount || 0);
    const wholesaleCost = Number(sale.reseller_wholesale_cost || sale.total_cost || 0);
    const delivFee = Number(sale.delivery_fee_charged || 0);

    const statusLower = newStatus.toLowerCase();
    const isPartial = statusLower.includes('partial');
    const isDelivered = statusLower === 'delivered' || statusLower === 'completed';
    const isReturned = statusLower === 'returned';
    const isCancelled = statusLower === 'cancelled' || statusLower === 'deleted';

    if (isDelivered) {
      // Delivered Profit = Total COD - (Wholesale Price + Delivery Charge)
      finalProfit = Math.max(0, totalCOD - (wholesaleCost + delivFee));
      finalLoss = 0;
    } else if (isPartial) {
      // Partial Delivery Profit = Collected Amount - (Delivered Products Wholesale Price + Delivery Charge)
      const partialNet = collectedAmt - (wholesaleCost + delivFee);
      if (partialNet < 0) {
        finalLoss = Math.abs(partialNet);
        finalProfit = 0;
      } else {
        finalLoss = 0;
        finalProfit = partialNet;
      }
    } else if (isReturned) {
      // Paid Return Net Effect = Customer Paid Return - Delivery Charge
      const netReturn = paidReturnAmt - delivFee;
      if (netReturn < 0) {
        finalLoss = Math.abs(netReturn);
        finalProfit = 0;
      } else {
        finalLoss = 0;
        finalProfit = netReturn;
      }
    } else if (isCancelled) {
      // Cancelled / Deleted = 0 Profit, 0 Loss
      finalProfit = 0;
      finalLoss = 0;
    } else {
      // Pending / In Courier / Processing: Est Profit
      finalProfit = Math.max(0, totalCOD - (wholesaleCost + delivFee));
      finalLoss = 0;
    }

    await connection.query(
      `UPDATE reseller_sales 
       SET order_status = ?, reseller_profit = ?, return_loss = ?, customer_paid_return = ?, collected_amount = ?, notes = COALESCE(?, notes)
       WHERE id = ? AND tenant_id = ?`,
      [newStatus, finalProfit, finalLoss, paidReturnAmt, collectedAmt, notes || null, id, tenantId]
    );

    await connection.commit();

    res.json({
      message: `Reseller Order #${sale.invoice_no} status updated to "${newStatus.toUpperCase()}" successfully!`,
      order_status: newStatus,
      reseller_profit: finalProfit,
      return_loss: finalLoss,
      customer_paid_return: paidReturnAmt,
      collected_amount: collectedAmt
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating reseller order status:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// 13. Admin: Delete Reseller Order (Soft Delete -> Status = 'deleted')
exports.deleteResellerOrderForAdmin = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    await connection.beginTransaction();

    const [sales] = await connection.query('SELECT invoice_no FROM reseller_sales WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (sales.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Reseller order not found.' });
    }

    // Soft delete by updating status to 'deleted'
    await connection.query("UPDATE reseller_sales SET order_status = 'deleted' WHERE id = ? AND tenant_id = ?", [id, tenantId]);

    await connection.commit();
    res.json({ message: `Order #${sales[0].invoice_no} moved to Delete status folder!` });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting reseller order:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// 14. Admin: Bulk Update Reseller Orders Status
exports.bulkUpdateResellerOrdersStatus = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { orderIds, order_status } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0 || !order_status) {
      return res.status(400).json({ error: 'orderIds array and order_status are required.' });
    }

    const newStatus = order_status.toLowerCase();
    await connection.beginTransaction();

    for (const id of orderIds) {
      const [saleRows] = await connection.query('SELECT * FROM reseller_sales WHERE id = ? AND tenant_id = ? FOR UPDATE', [id, tenantId]);
      if (saleRows.length === 0) continue;

      const sale = saleRows[0];
      const prevStatus = (sale.order_status || 'pending').toLowerCase();
      const [items] = await connection.query('SELECT * FROM reseller_sale_items WHERE reseller_sale_id = ? AND tenant_id = ?', [id, tenantId]);

      // Stock logic
      if ((prevStatus === 'pending' || prevStatus === 'cancelled' || prevStatus === 'deleted') && (newStatus === 'processing' || newStatus === 'shipped' || newStatus === 'delivered' || newStatus === 'in_courier')) {
        for (const item of items) {
          if (item.product_id) {
            await connection.query('UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE id = ? AND tenant_id = ?', [item.quantity, item.product_id, tenantId]);
          }
        }
      } else if ((prevStatus === 'processing' || prevStatus === 'shipped' || prevStatus === 'delivered' || prevStatus === 'in_courier') && (newStatus === 'returned' || newStatus === 'cancelled' || newStatus === 'deleted')) {
        for (const item of items) {
          if (item.product_id) {
            await connection.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ? AND tenant_id = ?', [item.quantity, item.product_id, tenantId]);
          }
        }
      }

      await connection.query('UPDATE reseller_sales SET order_status = ? WHERE id = ? AND tenant_id = ?', [newStatus, id, tenantId]);
    }

    await connection.commit();
    res.json({ message: `Successfully updated status for ${orderIds.length} orders to "${newStatus.toUpperCase()}"!` });
  } catch (error) {
    await connection.rollback();
    console.error('Error bulk updating reseller orders status:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// 15. Admin: Bulk Delete Reseller Orders (Soft Delete -> Status = 'deleted')
exports.bulkDeleteResellerOrders = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { orderIds } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'orderIds array is required.' });
    }

    await connection.beginTransaction();

    await connection.query("UPDATE reseller_sales SET order_status = 'deleted' WHERE id IN (?) AND tenant_id = ?", [orderIds, tenantId]);

    await connection.commit();
    res.json({ message: `Successfully moved ${orderIds.length} orders to Delete status folder!` });
  } catch (error) {
    await connection.rollback();
    console.error('Error bulk deleting reseller orders:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// 13. Public/Authenticated: Get Current Reseller Delivery Rates & Zones
exports.getDeliveryRates = async (req, res) => {
  try {
    await ensureResellerSchema(db);
    let tenantId = req.user ? req.user.tenantId : null;

    if (!tenantId && req.query.reseller_name) {
      const [rRows] = await db.query('SELECT tenant_id FROM reseller_profiles WHERE name = ? LIMIT 1', [req.query.reseller_name]);
      if (rRows.length > 0) tenantId = rRows[0].tenant_id;
    }

    if (!tenantId) tenantId = req.query.tenant_id || 1;

    let [zones] = await db.query(
      'SELECT id, zone_name, charge, display_order FROM reseller_delivery_zones WHERE tenant_id = ? ORDER BY display_order ASC, id ASC',
      [tenantId]
    );

    // Seed defaults if empty for tenant
    if (zones.length === 0) {
      const defaultZones = [
        { name: 'ঢাকার ভেতরে', charge: 60.00, order: 1 },
        { name: 'সাব ঢাকা (সাভার, গাজীপুর, কেরানীগঞ্জ...)', charge: 100.00, order: 2 },
        { name: 'ঢাকার বাইরে সারা বাংলাদেশ', charge: 120.00, order: 3 }
      ];
      for (const dz of defaultZones) {
        await db.query(
          'INSERT INTO reseller_delivery_zones (tenant_id, zone_name, charge, display_order) VALUES (?, ?, ?, ?)',
          [tenantId, dz.name, dz.charge, dz.order]
        );
      }
      [zones] = await db.query(
        'SELECT id, zone_name, charge, display_order FROM reseller_delivery_zones WHERE tenant_id = ? ORDER BY display_order ASC, id ASC',
        [tenantId]
      );
    }

    const inside = zones.find(z => z.zone_name.includes('ভেতরে'))?.charge || zones[0]?.charge || 60;
    const sub = zones.find(z => z.zone_name.includes('সাব'))?.charge || 100;
    const outside = zones.find(z => z.zone_name.includes('বাইরে'))?.charge || 120;

    res.json({
      zones: zones.map(z => ({ id: z.id, zone_name: z.zone_name, charge: Number(z.charge) })),
      inside_dhaka: Number(inside),
      sub_dhaka: Number(sub),
      outside_dhaka: Number(outside)
    });
  } catch (err) {
    console.error('Error fetching delivery rates:', err);
    res.json({
      zones: [
        { id: 1, zone_name: 'ঢাকার ভেতরে', charge: 60 },
        { id: 2, zone_name: 'সাব ঢাকা (সাভার, গাজীপুর, কেরানীগঞ্জ...)', charge: 100 },
        { id: 3, zone_name: 'ঢাকার বাইরে সারা বাংলাদেশ', charge: 120 }
      ],
      inside_dhaka: 60,
      sub_dhaka: 100,
      outside_dhaka: 120
    });
  }
};

// 14. Merchant Admin: Save Custom Reseller Delivery Zones
exports.saveDeliveryRates = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await ensureResellerSchema(connection);

    const tenantId = req.user.tenantId;
    const { zones } = req.body;

    if (!Array.isArray(zones) || zones.length === 0) {
      return res.status(400).json({ error: 'Please provide at least 1 delivery zone.' });
    }

    // Delete existing zones for this tenant
    await connection.query('DELETE FROM reseller_delivery_zones WHERE tenant_id = ?', [tenantId]);

    // Insert new dynamic zones
    for (let i = 0; i < zones.length; i++) {
      const z = zones[i];
      const name = z.zone_name ? String(z.zone_name).trim() : `Zone ${i + 1}`;
      const charge = !isNaN(Number(z.charge)) ? Number(z.charge) : 60.00;
      await connection.query(
        'INSERT INTO reseller_delivery_zones (tenant_id, zone_name, charge, display_order) VALUES (?, ?, ?, ?)',
        [tenantId, name, charge, i + 1]
      );
    }

    await connection.commit();

    const [updatedZones] = await db.query(
      'SELECT id, zone_name, charge FROM reseller_delivery_zones WHERE tenant_id = ? ORDER BY display_order ASC, id ASC',
      [tenantId]
    );

    res.json({
      message: 'Reseller Delivery Zones updated successfully!',
      zones: updatedZones.map(z => ({ id: z.id, zone_name: z.zone_name, charge: Number(z.charge) }))
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error saving delivery zones:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};
