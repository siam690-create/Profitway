const db = require('../config/db');

// Get all products for logged-in tenant (with calculated profit margin & combo items)
exports.getProducts = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [products] = await db.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.tenant_id = ? 
       ORDER BY p.created_at DESC`,
      [tenantId]
    );

    for (let prod of products) {
      const cost = Number(prod.cost_price || 0);
      const sell = Number(prod.selling_price || 0);
      const profit = sell - cost;
      const marginPercent = cost > 0 ? ((profit / cost) * 100) : (sell > 0 ? 100 : 0);

      prod.unit_profit = Number(profit.toFixed(2));
      prod.profit_margin = Number(marginPercent.toFixed(1));

      // Attach combo child items if product is a combo bundle
      if (prod.is_combo) {
        const [comboItems] = await db.query(
          `SELECT ci.*, p.name as child_name, p.cost_price as child_cost, p.selling_price as child_selling, p.stock_quantity as child_stock
           FROM combo_items ci
           JOIN products p ON ci.child_product_id = p.id
           WHERE ci.combo_product_id = ? AND ci.tenant_id = ?`,
          [prod.id, tenantId]
        );
        prod.combo_items = comboItems;
      }
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new Product or Combo Bundle
exports.createProduct = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { name, sku, category_id, cost_price, selling_price, stock_quantity, min_stock_alert, low_stock_threshold, unit, location, is_combo, combo_items } = req.body;

    if (!name || !selling_price) {
      return res.status(400).json({ error: 'Product name and selling price are required.' });
    }

    await connection.beginTransaction();

    let computedCostPrice = Number(cost_price || 0);
    const isCombo = is_combo ? 1 : 0;
    const alertThreshold = Number(low_stock_threshold || min_stock_alert || 5);

    if (isCombo && combo_items && Array.isArray(combo_items) && combo_items.length > 0) {
      computedCostPrice = 0;
      for (const item of combo_items) {
        const [childRows] = await connection.query(
          'SELECT cost_price FROM products WHERE id = ? AND tenant_id = ?',
          [item.child_product_id, tenantId]
        );
        if (childRows.length > 0) {
          computedCostPrice += Number(childRows[0].cost_price) * Number(item.quantity);
        }
      }
    }

    const [result] = await connection.query(
      `INSERT INTO products 
       (tenant_id, name, sku, category_id, cost_price, selling_price, stock_quantity, low_stock_threshold, unit, location, is_combo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        name,
        sku || `SKU-${Date.now().toString().slice(-6)}`,
        category_id || null,
        computedCostPrice,
        Number(selling_price),
        Number(stock_quantity || 0),
        alertThreshold,
        unit || 'Pcs',
        location || null,
        isCombo
      ]
    );

    const productId = result.insertId;

    if (isCombo && combo_items && Array.isArray(combo_items)) {
      for (const item of combo_items) {
        await connection.query(
          `INSERT INTO combo_items (tenant_id, combo_product_id, child_product_id, quantity)
           VALUES (?, ?, ?, ?)`,
          [tenantId, productId, item.child_product_id, Number(item.quantity)]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      message: isCombo ? 'Combo bundle product created with auto-calculated cost price.' : 'Product created successfully',
      productId,
      cost_price: computedCostPrice
    });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'A product with this SKU already exists.' });
    }
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// Update an existing product
exports.updateProduct = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { name, sku, category_id, cost_price, selling_price, stock_quantity, min_stock_alert, low_stock_threshold, unit, location, is_combo, combo_items } = req.body;

    await connection.beginTransaction();

    let computedCostPrice = Number(cost_price || 0);
    const isCombo = is_combo ? 1 : 0;
    const alertThreshold = Number(low_stock_threshold || min_stock_alert || 5);

    if (isCombo && combo_items && Array.isArray(combo_items) && combo_items.length > 0) {
      computedCostPrice = 0;
      for (const item of combo_items) {
        const [childRows] = await connection.query(
          'SELECT cost_price FROM products WHERE id = ? AND tenant_id = ?',
          [item.child_product_id, tenantId]
        );
        if (childRows.length > 0) {
          computedCostPrice += Number(childRows[0].cost_price) * Number(item.quantity);
        }
      }
    }

    await connection.query(
      `UPDATE products 
       SET name = ?, sku = ?, category_id = ?, cost_price = ?, selling_price = ?, stock_quantity = ?, low_stock_threshold = ?, unit = ?, location = ?, is_combo = ?
       WHERE id = ? AND tenant_id = ?`,
      [
        name,
        sku,
        category_id || null,
        computedCostPrice,
        Number(selling_price),
        Number(stock_quantity || 0),
        alertThreshold,
        unit || 'Pcs',
        location || null,
        isCombo,
        id,
        tenantId
      ]
    );

    if (isCombo) {
      await connection.query('DELETE FROM combo_items WHERE combo_product_id = ? AND tenant_id = ?', [id, tenantId]);
      if (combo_items && Array.isArray(combo_items)) {
        for (const item of combo_items) {
          await connection.query(
            `INSERT INTO combo_items (tenant_id, combo_product_id, child_product_id, quantity)
             VALUES (?, ?, ?, ?)`,
            [tenantId, id, item.child_product_id, Number(item.quantity)]
          );
        }
      }
    }

    await connection.commit();

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// Adjust stock quantity manually
exports.adjustStock = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { adjustment_type, quantity } = req.body;

    const qty = Number(quantity);
    if (!adjustment_type || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Valid adjustment type and quantity required.' });
    }

    const [rows] = await db.query('SELECT stock_quantity FROM products WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found.' });

    let currentStock = Number(rows[0].stock_quantity);
    let newStock = adjustment_type === 'add' ? (currentStock + qty) : (currentStock - qty);
    if (newStock < 0) newStock = 0;

    await db.query('UPDATE products SET stock_quantity = ? WHERE id = ? AND tenant_id = ?', [newStock, id, tenantId]);

    res.json({ message: 'Stock quantity adjusted successfully', new_stock: newStock });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    await db.query('DELETE FROM products WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
