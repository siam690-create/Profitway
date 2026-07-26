const db = require('../config/db');

exports.createSale = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { items, customer_name, payment_method, notes, customer_delivery_fee, courier_fee } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart must contain at least one product.' });
    }

    await connection.beginTransaction();

    let total_amount = 0;
    let total_cost = 0;
    let preparedItems = [];

    for (const item of items) {
      const [productRows] = await connection.query(
        'SELECT id, name, cost_price, selling_price, stock_quantity, is_combo FROM products WHERE id = ? AND tenant_id = ? FOR UPDATE',
        [item.product_id, tenantId]
      );

      if (productRows.length === 0) {
        throw new Error(`Product ID ${item.product_id} not found in your inventory.`);
      }

      const product = productRows[0];

      if (!product.is_combo && product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for product "${product.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
      }

      const unit_cost = Number(product.cost_price);
      const unit_price = Number(item.unit_price || product.selling_price);
      const qty = Number(item.quantity);

      const item_total_price = unit_price * qty;
      const item_total_cost = unit_cost * qty;
      const item_profit = item_total_price - item_total_cost;

      total_amount += item_total_price;
      total_cost += item_total_cost;

      preparedItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: qty,
        unit_cost,
        unit_price,
        total_price: item_total_price,
        total_cost: item_total_cost,
        item_profit,
        is_combo: product.is_combo
      });
    }

    const gross_profit = total_amount - total_cost;
    const deliveryFeeCharged = Number(customer_delivery_fee || 0);
    const courierActualCost = Number(courier_fee || 0);
    const deliveryProfit = deliveryFeeCharged - courierActualCost;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(100 + Math.random() * 900);
    const invoice_no = `INV-${dateStr}-${randomNum}`;

    const [saleResult] = await connection.query(
      `INSERT INTO sales (tenant_id, invoice_no, customer_name, total_amount, total_cost, gross_profit, payment_method, notes, delivery_fee_charged, courier_actual_cost, delivery_profit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        invoice_no,
        customer_name || 'Walk-in Customer',
        total_amount,
        total_cost,
        gross_profit,
        payment_method || 'Cash',
        notes || null,
        deliveryFeeCharged,
        courierActualCost,
        deliveryProfit
      ]
    );

    const sale_id = saleResult.insertId;

    for (const pItem of preparedItems) {
      await connection.query(
        `INSERT INTO sale_items (tenant_id, sale_id, product_id, product_name, quantity, unit_cost, unit_price, total_price, total_cost, item_profit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId,
          sale_id,
          pItem.product_id,
          pItem.product_name,
          pItem.quantity,
          pItem.unit_cost,
          pItem.unit_price,
          pItem.total_price,
          pItem.total_cost,
          pItem.item_profit
        ]
      );

      if (pItem.is_combo) {
        const [comboChildItems] = await connection.query(
          'SELECT child_product_id, quantity FROM combo_items WHERE combo_product_id = ? AND tenant_id = ?',
          [pItem.product_id, tenantId]
        );

        for (const child of comboChildItems) {
          const totalChildDeductQty = pItem.quantity * child.quantity;
          await connection.query(
            `UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE id = ? AND tenant_id = ?`,
            [totalChildDeductQty, child.child_product_id, tenantId]
          );
        }
      } else {
        await connection.query(
          `UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE id = ? AND tenant_id = ?`,
          [pItem.quantity, pItem.product_id, tenantId]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      message: 'Sale completed successfully',
      sale: {
        id: sale_id,
        invoice_no,
        customer_name: customer_name || 'Walk-in Customer',
        total_amount,
        total_cost,
        gross_profit,
        payment_method: payment_method || 'Cash',
        delivery_fee_charged: deliveryFeeCharged,
        courier_actual_cost: courierActualCost,
        delivery_profit: deliveryProfit,
        sale_date: new Date(),
        items: preparedItems
      }
    });

  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
};

exports.getSales = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { start_date, end_date, search } = req.query;
    let query = `SELECT * FROM sales WHERE tenant_id = ?`;
    const params = [tenantId];

    if (start_date && end_date) {
      query += ` AND DATE(sale_date) BETWEEN ? AND ?`;
      params.push(start_date, end_date);
    }

    if (search) {
      query += ` AND (invoice_no LIKE ? OR customer_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY sale_date DESC LIMIT 100`;

    const [sales] = await db.query(query, params);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSaleById = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const [sales] = await db.query('SELECT * FROM sales WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (sales.length === 0) return res.status(404).json({ error: 'Sale not found' });

    const [items] = await db.query('SELECT * FROM sale_items WHERE sale_id = ? AND tenant_id = ?', [id, tenantId]);

    res.json({
      ...sales[0],
      items
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Edit / Update Sale Order Info (RESTRICTED TO SHOP OWNER)
exports.updateSale = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userRole = req.user.role;
    const { id } = req.params;

    if (userRole !== 'owner' && userRole !== 'superadmin') {
      return res.status(403).json({ error: 'Permission Denied. Only Shop Owners can edit sales orders.' });
    }

    const { customer_name, payment_method, notes, customer_delivery_fee, courier_fee } = req.body;

    const [existing] = await db.query('SELECT * FROM sales WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (existing.length === 0) return res.status(404).json({ error: 'Sales order not found' });

    const saleOrder = existing[0];
    const deliveryFeeCharged = customer_delivery_fee !== undefined ? Number(customer_delivery_fee) : Number(saleOrder.delivery_fee_charged || 0);
    const courierActualCost = courier_fee !== undefined ? Number(courier_fee) : Number(saleOrder.courier_actual_cost || 0);
    const deliveryProfit = deliveryFeeCharged - courierActualCost;

    await db.query(
      `UPDATE sales 
       SET customer_name = ?, payment_method = ?, notes = ?, delivery_fee_charged = ?, courier_actual_cost = ?, delivery_profit = ?
       WHERE id = ? AND tenant_id = ?`,
      [
        customer_name || saleOrder.customer_name,
        payment_method || saleOrder.payment_method,
        notes !== undefined ? notes : saleOrder.notes,
        deliveryFeeCharged,
        courierActualCost,
        deliveryProfit,
        id,
        tenantId
      ]
    );

    res.json({ message: 'Sales order updated successfully by shop owner' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
