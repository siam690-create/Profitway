const db = require('../config/db');

// Get all Reseller Sales
exports.getResellerSales = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { start_date, end_date } = req.query;

    let query = `
      SELECT rs.*, fa.name as account_name
      FROM reseller_sales rs
      LEFT JOIN finance_accounts fa ON rs.account_id = fa.id
      WHERE rs.tenant_id = ?
    `;
    const params = [tenantId];

    if (start_date && end_date) {
      query += ' AND DATE(COALESCE(rs.sale_date, rs.created_at)) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    query += ' ORDER BY rs.id DESC';

    const [sales] = await db.query(query, params);

    // Attach items to sales
    for (let s of sales) {
      const [items] = await db.query('SELECT * FROM reseller_sale_items WHERE reseller_sale_id = ? AND tenant_id = ?', [s.id, tenantId]);
      s.items = items;
    }

    res.json(sales);
  } catch (error) {
    console.error('Error in getResellerSales:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create a Reseller Sale Order
exports.createResellerSale = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const tenantId = req.user.tenantId;
    const {
      reseller_name,
      customer_name,
      customer_phone,
      items,
      delivery_fee_charged,
      courier_actual_cost,
      payment_status,
      account_id,
      sale_date,
      notes
    } = req.body;

    if (!reseller_name || !items || !Array.isArray(items) || items.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Reseller Name and at least 1 product item are required.' });
    }

    const delivCharged = Number(delivery_fee_charged || 0);
    const courierCost = Number(courier_actual_cost || 0);
    const delivProfit = delivCharged - courierCost;

    let totalAmount = 0;
    let totalCost = 0;
    let grossProfit = 0;

    const formattedDate = sale_date || new Date().toISOString().slice(0, 10);
    const invNo = `RSL-${Date.now().toString().slice(-6)}`;

    // 1. Insert Master Reseller Sale Record
    const [result] = await connection.query(
      `INSERT INTO reseller_sales 
        (tenant_id, reseller_name, customer_name, customer_phone, invoice_no, total_amount, total_cost, gross_profit, delivery_fee_charged, courier_actual_cost, delivery_profit, payment_status, account_id, sale_date, notes)
       VALUES (?, ?, ?, ?, ?, 0.00, 0.00, 0.00, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        reseller_name.trim(),
        customer_name ? customer_name.trim() : null,
        customer_phone ? customer_phone.trim() : null,
        invNo,
        delivCharged,
        courierCost,
        delivProfit,
        payment_status || 'paid',
        account_id || null,
        formattedDate,
        notes || null
      ]
    );

    const saleId = result.insertId;

    // 2. Insert Items & Deduct Product Stock
    for (const item of items) {
      const qty = Number(item.quantity || 1);
      const unitPrice = Number(item.unit_wholesale_price || item.unit_price || 0);
      const unitCost = Number(item.unit_cost_price || item.unit_cost || 0);

      const totalPrice = qty * unitPrice;
      const totalCostItem = qty * unitCost;
      const itemProfit = totalPrice - totalCostItem;

      totalAmount += totalPrice;
      totalCost += totalCostItem;
      grossProfit += itemProfit;

      const [pRows] = await connection.query('SELECT name, stock_quantity FROM products WHERE id = ? AND tenant_id = ?', [item.product_id, tenantId]);
      const prodName = pRows.length > 0 ? pRows[0].name : (item.product_name || 'Product');

      await connection.query(
        `INSERT INTO reseller_sale_items 
          (tenant_id, reseller_sale_id, product_id, product_name, quantity, unit_cost, unit_price, total_price, item_profit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [tenantId, saleId, item.product_id, prodName, qty, unitCost, unitPrice, totalPrice, itemProfit]
      );

      // Deduct product stock & log movement
      if (pRows.length > 0) {
        const oldStock = Number(pRows[0].stock_quantity || 0);
        const newStock = Math.max(0, oldStock - qty);

        await connection.query('UPDATE products SET stock_quantity = ? WHERE id = ? AND tenant_id = ?', [newStock, item.product_id, tenantId]);

        await connection.query(
          `INSERT INTO stock_movements (tenant_id, product_id, movement_type, change_qty, previous_stock, new_stock, reference_no, notes)
           VALUES (?, ?, 'Reseller Sale Out', ?, ?, ?, ?, ?)`,
          [tenantId, item.product_id, -qty, oldStock, newStock, invNo, `Reseller Sale #${invNo} (Reseller: ${reseller_name})`]
        );
      }
    }

    // 3. Update Master Totals
    await connection.query(
      `UPDATE reseller_sales SET total_amount = ?, total_cost = ?, gross_profit = ? WHERE id = ? AND tenant_id = ?`,
      [totalAmount, totalCost, grossProfit, saleId, tenantId]
    );

    // 4. Record Finance Account Transaction if Paid & account provided
    if (account_id && totalAmount > 0) {
      await connection.query(
        `UPDATE finance_accounts SET balance = balance + ? WHERE id = ? AND tenant_id = ?`,
        [totalAmount, account_id, tenantId]
      );

      await connection.query(
        `INSERT INTO account_transactions (tenant_id, account_id, type, credit, reference_no, notes, transaction_date)
         VALUES (?, ?, 'Reseller Sale Revenue', ?, ?, ?, NOW())`,
        [tenantId, account_id, totalAmount, invNo, `Reseller Sale Order #${invNo} (Reseller: ${reseller_name})`]
      );
    }

    await connection.commit();
    res.status(201).json({ message: `Reseller Order #${invNo} created successfully!`, saleId, invoice_no: invNo });
  } catch (error) {
    await connection.rollback();
    console.error('Error in createResellerSale:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// Delete Reseller Sale Order & Restore Product Stock
exports.deleteResellerSale = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const [sales] = await connection.query('SELECT * FROM reseller_sales WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (sales.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Reseller sale record not found.' });
    }

    const sale = sales[0];
    const [items] = await connection.query('SELECT * FROM reseller_sale_items WHERE reseller_sale_id = ? AND tenant_id = ?', [id, tenantId]);

    // Restore Stock for each product
    for (const item of items) {
      const [pRows] = await connection.query('SELECT stock_quantity FROM products WHERE id = ? AND tenant_id = ?', [item.product_id, tenantId]);
      if (pRows.length > 0) {
        const oldStock = Number(pRows[0].stock_quantity || 0);
        const newStock = oldStock + Number(item.quantity || 1);

        await connection.query('UPDATE products SET stock_quantity = ? WHERE id = ? AND tenant_id = ?', [newStock, item.product_id, tenantId]);

        await connection.query(
          `INSERT INTO stock_movements (tenant_id, product_id, movement_type, change_qty, previous_stock, new_stock, reference_no, notes)
           VALUES (?, ?, 'Reseller Order Cancel Restock', ?, ?, ?, ?, ?)`,
          [tenantId, item.product_id, item.quantity, oldStock, newStock, sale.invoice_no, `Restocked stock due to deleted Reseller Sale #${sale.invoice_no}`]
        );
      }
    }

    // Revert account cash if account was credited
    if (sale.account_id && Number(sale.total_amount) > 0) {
      await connection.query('UPDATE finance_accounts SET balance = balance - ? WHERE id = ? AND tenant_id = ?', [sale.total_amount, sale.account_id, tenantId]);
      await connection.query(
        `INSERT INTO account_transactions (tenant_id, account_id, type, debit, reference_no, notes, transaction_date)
         VALUES (?, ?, 'Reseller Sale Reversal', ?, ?, ?, NOW())`,
        [tenantId, sale.account_id, sale.total_amount, sale.invoice_no, `Reverted revenue due to deleted Reseller Sale #${sale.invoice_no}`]
      );
    }

    await connection.query('DELETE FROM reseller_sale_items WHERE reseller_sale_id = ? AND tenant_id = ?', [id, tenantId]);
    await connection.query('DELETE FROM reseller_sales WHERE id = ? AND tenant_id = ?', [id, tenantId]);

    await connection.commit();
    res.json({ message: `Reseller Order #${sale.invoice_no} deleted and stock restored!` });
  } catch (error) {
    await connection.rollback();
    console.error('Error in deleteResellerSale:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// Get Reseller Returns
exports.getResellerReturns = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { start_date, end_date } = req.query;

    let query = 'SELECT * FROM reseller_returns WHERE tenant_id = ?';
    const params = [tenantId];

    if (start_date && end_date) {
      query += ' AND DATE(COALESCE(return_date, created_at)) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    query += ' ORDER BY id DESC';

    const [returns] = await db.query(query, params);

    for (let r of returns) {
      const [items] = await db.query(
        `SELECT rri.*, p.name as product_name, p.sku 
         FROM reseller_return_items rri
         JOIN products p ON rri.product_id = p.id AND rri.tenant_id = p.tenant_id
         WHERE rri.reseller_return_id = ? AND rri.tenant_id = ?`,
        [r.id, tenantId]
      );
      r.items = items;
    }

    res.json(returns);
  } catch (error) {
    console.error('Error in getResellerReturns:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create Reseller Return Record & Restock Product
exports.createResellerReturn = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const tenantId = req.user.tenantId;
    const {
      reseller_name,
      invoice_no,
      courier_name,
      courier_charge,
      return_delivery_loss,
      return_date,
      items,
      notes
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'At least 1 returned product item is required.' });
    }

    const cCharge = Number(courier_charge || 0);
    const delivLoss = Number(return_delivery_loss || 0);
    const formattedDate = return_date || new Date().toISOString().slice(0, 10);

    const [result] = await connection.query(
      `INSERT INTO reseller_returns (tenant_id, reseller_name, invoice_no, courier_name, courier_charge, return_delivery_loss, returned_profit_reversal, return_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, 0.00, ?, ?)`,
      [tenantId, reseller_name || null, invoice_no || null, courier_name || null, cCharge, delivLoss, formattedDate, notes || null]
    );

    const returnId = result.insertId;
    let totalReturnedProfitReversal = 0;

    for (const item of items) {
      const cond = item.restock_condition || 'good_restockable';
      const condLower = String(cond).toLowerCase();
      const isGood = condLower.includes('good') || condLower.includes('restock');

      const qty = Number(item.quantity || 1);
      const unitPrice = Number(item.unit_wholesale_price || item.unit_price || 0);
      const unitCost = Number(item.unit_cost_price || item.unit_cost || 0);

      const marginPerUnit = unitPrice > 0 ? (unitPrice - unitCost) : 0;
      const profitReversalItem = qty * marginPerUnit;
      totalReturnedProfitReversal += profitReversalItem;

      await connection.query(
        `INSERT INTO reseller_return_items (tenant_id, reseller_return_id, product_id, quantity, unit_price, unit_cost, returned_profit_reversal, restock_condition)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [tenantId, returnId, item.product_id, qty, unitPrice, unitCost, profitReversalItem, cond]
      );

      // Restock good items back into inventory
      if (isGood) {
        const [pRows] = await connection.query('SELECT stock_quantity FROM products WHERE id = ? AND tenant_id = ?', [item.product_id, tenantId]);
        if (pRows.length > 0) {
          const oldStock = Number(pRows[0].stock_quantity || 0);
          const newStock = oldStock + qty;

          await connection.query('UPDATE products SET stock_quantity = ? WHERE id = ? AND tenant_id = ?', [newStock, item.product_id, tenantId]);

          await connection.query(
            `INSERT INTO stock_movements (tenant_id, product_id, movement_type, change_qty, previous_stock, new_stock, reference_no, notes)
             VALUES (?, ?, 'Reseller Return Restock', ?, ?, ?, ?, ?)`,
            [tenantId, item.product_id, qty, oldStock, newStock, invoice_no || 'RSL-RET', `Reseller Return (Reseller: ${reseller_name || 'N/A'})`]
          );
        }
      }
    }

    // Update master total profit reversal
    await connection.query(
      `UPDATE reseller_returns SET returned_profit_reversal = ? WHERE id = ? AND tenant_id = ?`,
      [totalReturnedProfitReversal, returnId, tenantId]
    );

    await connection.commit();
    res.json({ message: 'Reseller Return recorded and items restocked!' });
  } catch (error) {
    await connection.rollback();
    console.error('Error in createResellerReturn:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};
