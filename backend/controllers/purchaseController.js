const db = require('../config/db');

// Record a new Product Purchase / Stock Restock with Payment & Dena Link
exports.createPurchase = async (req, res) => {
  const { items, supplier_id, supplier_name, notes, payment_status, paid_amount, due_amount, account_id, purchase_date, date } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Purchase order must contain at least one product.' });
  }

  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;

    await connection.beginTransaction();

    let total_amount = 0;
    let preparedItems = [];

    for (const item of items) {
      const [productRows] = await connection.query(
        'SELECT id, name, cost_price, selling_price, stock_quantity FROM products WHERE id = ? AND tenant_id = ? FOR UPDATE',
        [item.product_id, tenantId]
      );

      if (productRows.length === 0) {
        throw new Error(`Product ID ${item.product_id} not found in your inventory.`);
      }

      const product = productRows[0];
      const buyQty = Number(item.quantity);
      const unitBuyPrice = Number(item.unit_buy_price);
      const itemTotalCost = buyQty * unitBuyPrice;

      total_amount += itemTotalCost;

      const currentStock = Number(product.stock_quantity || 0);
      const currentCost = Number(product.cost_price || 0);
      const totalNewStock = currentStock + buyQty;
      let newWeightedCost = currentCost;
      
      if (totalNewStock > 0) {
        newWeightedCost = Number((((currentStock * currentCost) + (buyQty * unitBuyPrice)) / totalNewStock).toFixed(2));
      }

      const newSellingPrice = item.new_selling_price ? Number(item.new_selling_price) : Number(product.selling_price);

      await connection.query(
        `UPDATE products 
         SET stock_quantity = stock_quantity + ?,
             cost_price = ?,
             selling_price = ?
         WHERE id = ? AND tenant_id = ?`,
        [buyQty, newWeightedCost, newSellingPrice, product.id, tenantId]
      );

      preparedItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: buyQty,
        unit_buy_price: unitBuyPrice,
        item_total_cost: itemTotalCost
      });
    }

    // Process Payment Split
    const status = payment_status || 'paid';
    let paidAmt = status === 'paid' ? total_amount : (status === 'due' ? 0 : Number(paid_amount || 0));
    let dueAmt = total_amount - paidAmt;
    if (dueAmt < 0) dueAmt = 0;

    // 1. Insert Purchase Header
    const purchaseNo = `PUR-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(100 + Math.random() * 900)}`;

    const rawDate = purchase_date || date;
    let formattedDate = null;
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        const timePart = new Date().toTimeString().slice(0, 8);
        formattedDate = `${d.toISOString().slice(0, 10)} ${timePart}`;
      }
    }

    const [purchaseResult] = await connection.query(
      `INSERT INTO purchases (tenant_id, purchase_no, supplier_id, supplier_name, total_amount, payment_status, paid_amount, due_amount, account_id, notes, purchase_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${formattedDate ? '?' : 'NOW()'})`,
      formattedDate ? [
        tenantId,
        purchaseNo,
        supplier_id || null,
        supplier_name || 'General Supplier',
        total_amount,
        status,
        paidAmt,
        dueAmt,
        account_id || null,
        notes || null,
        formattedDate
      ] : [
        tenantId,
        purchaseNo,
        supplier_id || null,
        supplier_name || 'General Supplier',
        total_amount,
        status,
        paidAmt,
        dueAmt,
        account_id || null,
        notes || null
      ]
    );

    const purchaseId = purchaseResult.insertId;

    // 2. Insert Purchase Line Items
    for (const item of preparedItems) {
      await connection.query(
        `INSERT INTO purchase_items (tenant_id, purchase_id, product_id, product_name, quantity, unit_buy_price, total_cost)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [tenantId, purchaseId, item.product_id, item.product_name, item.quantity, item.unit_buy_price, item.item_total_cost]
      );
    }

    // 3. Financial Integration: Deduct paid_amount from selected account
    if (paidAmt > 0 && account_id) {
      await connection.query(
        'UPDATE finance_accounts SET balance = GREATEST(0, balance - ?) WHERE id = ? AND tenant_id = ?',
        [paidAmt, account_id, tenantId]
      );

      const transDate = formattedDate || new Date();
      await connection.query(
        `INSERT INTO account_transactions (tenant_id, account_id, type, debit, credit, reference_no, notes, transaction_date)
         VALUES (?, ?, 'Stock Purchase', ?, 0.00, ?, ?, ?)`,
        [tenantId, account_id, paidAmt, purchaseNo, `Payment for Purchase #${purchaseNo}`, transDate]
      );
    }

    // 4. Financial Integration: Auto-create Dena (Liability) for remaining due_amount
    if (dueAmt > 0) {
      await connection.query(
        `INSERT INTO liabilities (tenant_id, title, party_type, party_name, total_amount, amount_paid, status, notes)
         VALUES (?, ?, 'supplier', ?, ?, 0.00, 'pending', ?)`,
        [
          tenantId,
          `Purchase Order Dues #${purchaseNo}`,
          supplier_name || 'General Supplier',
          dueAmt,
          `Auto-logged due from Stock Restock Purchase #${purchaseNo}`
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: 'Stock purchase recorded successfully! Inventory, financial accounts, and supplier dues updated.',
      purchase_id: purchaseId,
      purchase_no: purchaseNo,
      total_amount,
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

// Fetch Purchases
exports.getPurchases = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const [purchases] = await db.query(
      `SELECT * FROM purchases WHERE tenant_id = ? ORDER BY purchase_date DESC`,
      [tenantId]
    );

    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Purchase Details
exports.getPurchaseById = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const [purchases] = await db.query(
      `SELECT * FROM purchases WHERE id = ? AND tenant_id = ?`,
      [id, tenantId]
    );

    if (purchases.length === 0) return res.status(404).json({ error: 'Purchase order not found.' });

    const [items] = await db.query(
      `SELECT * FROM purchase_items WHERE purchase_id = ?`,
      [id]
    );

    res.json({
      ...purchases[0],
      items
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Purchase
exports.updatePurchase = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { supplier_name, notes } = req.body;

    await db.query(
      `UPDATE purchases SET supplier_name = ?, notes = ? WHERE id = ? AND tenant_id = ?`,
      [supplier_name, notes, id, tenantId]
    );

    res.json({ message: 'Purchase record updated.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Purchase Order & Revert Stock & Financial Accounts
exports.deletePurchase = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const [purchases] = await connection.query(
      'SELECT * FROM purchases WHERE id = ? AND tenant_id = ? FOR UPDATE',
      [id, tenantId]
    );

    if (purchases.length === 0) {
      return res.status(404).json({ error: 'Purchase order record not found.' });
    }

    const purchase = purchases[0];

    await connection.beginTransaction();

    // 1. Fetch purchase items to revert stock
    const [pItems] = await connection.query(
      'SELECT * FROM purchase_items WHERE purchase_id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    for (const item of pItems) {
      const [prodRows] = await connection.query(
        'SELECT stock_quantity FROM products WHERE id = ? AND tenant_id = ? FOR UPDATE',
        [item.product_id, tenantId]
      );

      if (prodRows.length > 0) {
        const prevStock = Number(prodRows[0].stock_quantity || 0);
        const changeQty = Number(item.quantity || 0);
        const newStock = Math.max(0, prevStock - changeQty);

        // Deduct purchased stock
        await connection.query(
          'UPDATE products SET stock_quantity = ? WHERE id = ? AND tenant_id = ?',
          [newStock, item.product_id, tenantId]
        );

        // Log stock movement audit
        await connection.query(
          `INSERT INTO stock_movements (tenant_id, product_id, movement_type, change_qty, previous_stock, new_stock, reference_no, notes)
           VALUES (?, ?, 'purchase_deletion', ?, ?, ?, ?, ?)`,
          [
            tenantId,
            item.product_id,
            -changeQty,
            prevStock,
            newStock,
            purchase.purchase_no,
            `Reverted stock due to deletion of Purchase Order #${purchase.purchase_no}`
          ]
        );
      }
    }

    // 2. Refund paid_amount back to financial account if applicable and log Passbook Reversal Entry
    if (Number(purchase.paid_amount || 0) > 0 && purchase.account_id) {
      const refundAmt = Number(purchase.paid_amount);
      await connection.query(
        'UPDATE finance_accounts SET balance = balance + ? WHERE id = ? AND tenant_id = ?',
        [refundAmt, purchase.account_id, tenantId]
      );

      // Insert Account Transaction Ledger Record for Passbook Reversal Entry
      await connection.query(
        `INSERT INTO account_transactions (tenant_id, account_id, type, debit, credit, reference_no, notes, transaction_date)
         VALUES (?, ?, 'Purchase Order Cancelled', 0.00, ?, ?, ?, NOW())`,
        [
          tenantId,
          purchase.account_id,
          refundAmt,
          purchase.purchase_no,
          `Reverted payment due to deletion of Purchase Order #${purchase.purchase_no} (Supplier: ${purchase.supplier_name || 'General Supplier'})`
        ]
      );
    }

    // 3. Remove auto-created Dena (Liability) if created for this purchase order
    await connection.query(
      `DELETE FROM liabilities WHERE tenant_id = ? AND (title LIKE ? OR notes LIKE ?)`,
      [tenantId, `%${purchase.purchase_no}%`, `%${purchase.purchase_no}%`]
    );

    // 4. Delete purchase items and purchase order
    await connection.query('DELETE FROM purchase_items WHERE purchase_id = ? AND tenant_id = ?', [id, tenantId]);
    await connection.query('DELETE FROM purchases WHERE id = ? AND tenant_id = ?', [id, tenantId]);

    await connection.commit();

    res.json({ message: `Purchase Order #${purchase.purchase_no} deleted successfully and inventory stock reverted!` });

  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

