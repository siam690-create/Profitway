const db = require('../config/db');

// Fetch all wholesale buyers for tenant with outstanding Pawna dues summary
exports.getWholesaleCustomers = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const [buyers] = await db.query(
      `SELECT c.id, c.tenant_id, c.name, c.phone, c.email, c.company_name, c.address, c.notes, c.created_at,
              COALESCE(SUM(CASE WHEN r.status != 'collected' THEN (r.total_amount - r.amount_collected) ELSE 0 END), 0) AS total_pawna_due,
              (SELECT COUNT(*) FROM wholesale_sales WHERE customer_id = c.id OR customer_name = c.name) AS order_count
       FROM wholesale_customers c
       LEFT JOIN receivables r ON r.party_name COLLATE utf8mb4_general_ci = c.name COLLATE utf8mb4_general_ci AND r.tenant_id = c.tenant_id
       WHERE c.tenant_id = ?
       GROUP BY c.id, c.tenant_id, c.name, c.phone, c.email, c.company_name, c.address, c.notes, c.created_at
       ORDER BY c.id DESC`,
      [tenantId]
    );

    res.json(buyers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new wholesale buyer profile
exports.createWholesaleCustomer = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, phone, email, company_name, address, notes } = req.body;

    if (!name) return res.status(400).json({ error: 'Buyer name is required.' });

    const [result] = await db.query(
      `INSERT INTO wholesale_customers (tenant_id, name, phone, email, company_name, address, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, name, phone || null, email || null, company_name || null, address || null, notes || null]
    );

    res.status(201).json({
      message: 'Wholesale buyer profile created successfully',
      customer_id: result.insertId,
      name
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update buyer profile
exports.updateWholesaleCustomer = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { name, phone, email, company_name, address, notes } = req.body;

    await db.query(
      `UPDATE wholesale_customers 
       SET name = ?, phone = ?, email = ?, company_name = ?, address = ?, notes = ?
       WHERE id = ? AND tenant_id = ?`,
      [name, phone, email, company_name, address, notes, id, tenantId]
    );

    res.json({ message: 'Buyer profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete buyer profile
exports.deleteWholesaleCustomer = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    await db.query('DELETE FROM wholesale_customers WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    res.json({ message: 'Buyer profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create Wholesale Sales Order
exports.createWholesaleSale = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { items, customer_id, customer_name, notes, payment_status, paid_amount, due_amount, account_id } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Wholesale order must contain at least one product.' });
    }

    await connection.beginTransaction();

    let total_amount = 0;
    let total_cost = 0;
    let preparedItems = [];

    for (const item of items) {
      const [productRows] = await connection.query(
        'SELECT id, name, cost_price, stock_quantity FROM products WHERE id = ? AND tenant_id = ? FOR UPDATE',
        [item.product_id, tenantId]
      );

      if (productRows.length === 0) {
        throw new Error(`Product ID ${item.product_id} not found in inventory.`);
      }

      const product = productRows[0];
      const sellQty = Number(item.quantity);
      const unitCost = Number(product.cost_price || 0);
      const unitWholesalePrice = Number(item.unit_wholesale_price);

      if (sellQty <= 0) throw new Error(`Invalid quantity for product ${product.name}`);
      if (Number(product.stock_quantity) < sellQty) {
        throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, Requested: ${sellQty}`);
      }

      const itemTotalCost = sellQty * unitCost;
      const itemTotalPrice = sellQty * unitWholesalePrice;
      const itemProfit = itemTotalPrice - itemTotalCost;

      total_cost += itemTotalCost;
      total_amount += itemTotalPrice;

      // Deduct Stock Quantity
      await connection.query(
        `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND tenant_id = ?`,
        [sellQty, product.id, tenantId]
      );

      preparedItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: sellQty,
        unit_cost_price: unitCost,
        unit_wholesale_price: unitWholesalePrice,
        total_item_price: itemTotalPrice,
        item_profit: itemProfit
      });
    }

    const gross_profit = total_amount - total_cost;
    const status = payment_status || 'paid';
    let paidAmt = status === 'paid' ? total_amount : (status === 'due' ? 0 : Number(paid_amount || 0));
    let dueAmt = total_amount - paidAmt;
    if (dueAmt < 0) dueAmt = 0;

    const invoiceNo = `WS-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Insert Wholesale Sale Header
    const [saleResult] = await connection.query(
      `INSERT INTO wholesale_sales (tenant_id, invoice_no, customer_id, customer_name, total_amount, total_cost, gross_profit, payment_status, paid_amount, due_amount, account_id, notes, sale_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        tenantId,
        invoiceNo,
        customer_id || null,
        customer_name || 'General Buyer',
        total_amount,
        total_cost,
        gross_profit,
        status,
        paidAmt,
        dueAmt,
        account_id || null,
        notes || null
      ]
    );

    const saleId = saleResult.insertId;

    // 2. Insert Wholesale Line Items
    for (const item of preparedItems) {
      await connection.query(
        `INSERT INTO wholesale_sale_items (tenant_id, sale_id, product_id, product_name, quantity, unit_cost_price, unit_wholesale_price, total_item_price, item_profit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [tenantId, saleId, item.product_id, item.product_name, item.quantity, item.unit_cost_price, item.unit_wholesale_price, item.total_item_price, item.item_profit]
      );
    }

    // 3. Financial Integration: Deposit paid_amount into selected liquid account
    if (paidAmt > 0 && account_id) {
      await connection.query(
        'UPDATE finance_accounts SET balance = balance + ? WHERE id = ? AND tenant_id = ?',
        [paidAmt, account_id, tenantId]
      );
    }

    // 4. Financial Integration: Auto-create Pawna (Receivable) for remaining due_amount
    if (dueAmt > 0) {
      await connection.query(
        `INSERT INTO receivables (tenant_id, title, party_type, party_name, total_amount, amount_collected, status, notes)
         VALUES (?, ?, 'customer', ?, ?, 0.00, 'pending', ?)`,
        [
          tenantId,
          `Wholesale B2B Dues #${invoiceNo}`,
          customer_name || 'General Buyer',
          dueAmt,
          `Auto-logged credit sale due from Wholesale Invoice #${invoiceNo}`
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: 'Wholesale sales order created successfully! Inventory stock deducted, liquid balance & Pawna dues updated.',
      sale_id: saleId,
      invoice_no: invoiceNo,
      total_amount,
      gross_profit,
      paid_amount: paidAmt,
      due_amount: dueAmt
    });

  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// Fetch Wholesale Sales
exports.getWholesaleSales = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const [sales] = await db.query(
      `SELECT * FROM wholesale_sales WHERE tenant_id = ? ORDER BY sale_date DESC`,
      [tenantId]
    );

    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Wholesale Sale Details
exports.getWholesaleSaleById = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const [sales] = await db.query(
      `SELECT * FROM wholesale_sales WHERE id = ? AND tenant_id = ?`,
      [id, tenantId]
    );

    if (sales.length === 0) return res.status(404).json({ error: 'Wholesale sale order not found.' });

    const [items] = await db.query(
      `SELECT * FROM wholesale_sale_items WHERE sale_id = ?`,
      [id]
    );

    res.json({
      ...sales[0],
      items
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
