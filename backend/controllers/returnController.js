const db = require('../config/db');

exports.createReturn = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { invoice_no, courier_name, courier_charge, return_delivery_loss, reason, notes, items, return_date } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one returned item must be specified.' });
    }

    await connection.beginTransaction();

    const finalReturnDate = return_date ? new Date(return_date).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
    const dateStr = finalReturnDate.slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(100 + Math.random() * 900);
    const return_no = `RET-${dateStr}-${randomNum}`;
    const courierFee = Number(courier_charge || 0);
    const delivLoss = Number(return_delivery_loss || 0);

    const [returnResult] = await connection.query(
      `INSERT INTO returns (tenant_id, return_no, invoice_no, courier_name, courier_charge, return_delivery_loss, reason, notes, return_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        return_no,
        invoice_no || null,
        courier_name || 'General Courier',
        courierFee,
        delivLoss,
        reason || 'Customer Refused',
        notes || null,
        finalReturnDate
      ]
    );

    const return_id = returnResult.insertId;

    for (const item of items) {
      const [prodRows] = await connection.query(
        'SELECT id, name, is_combo FROM products WHERE id = ? AND tenant_id = ?',
        [item.product_id, tenantId]
      );

      if (prodRows.length === 0) {
        throw new Error(`Product ID ${item.product_id} not found.`);
      }

      const product = prodRows[0];
      const restockCond = item.restock_condition || 'Good';
      const qty = Number(item.quantity || 1);

      await connection.query(
        `INSERT INTO return_items (tenant_id, return_id, product_id, product_name, quantity, restock_condition)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [tenantId, return_id, product.id, product.name, qty, restockCond]
      );

      // If condition is Good, restock stock back!
      if (restockCond === 'Good') {
        if (product.is_combo) {
          const [comboChildItems] = await connection.query(
            'SELECT child_product_id, quantity FROM combo_items WHERE combo_product_id = ? AND tenant_id = ?',
            [product.id, tenantId]
          );

          for (const child of comboChildItems) {
            const totalChildRestockQty = qty * child.quantity;
            await connection.query(
              `UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ? AND tenant_id = ?`,
              [totalChildRestockQty, child.child_product_id, tenantId]
            );
          }
        } else {
          await connection.query(
            `UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ? AND tenant_id = ?`,
            [qty, product.id, tenantId]
          );
        }
      }
    }

    // Automatically log courier charge as expense under category 'Transport' if > 0
    if (courierFee > 0) {
      await connection.query(
        `INSERT INTO expenses (tenant_id, category, amount, notes, expense_date)
         VALUES (?, 'Transport', ?, ?, ?)`,
        [tenantId, courierFee, `Courier Return Delivery Fee for Return #${return_no}`, finalReturnDate]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: 'Courier return processed successfully',
      return_data: {
        id: return_id,
        return_no,
        invoice_no,
        courier_name,
        courier_charge: courierFee,
        return_delivery_loss: delivLoss,
        reason,
        return_date: finalReturnDate,
        items
      }
    });

  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
};

exports.getReturns = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [returnsList] = await db.query(
      `SELECT r.*, 
              (SELECT COUNT(*) FROM return_items WHERE return_id = r.id) as item_count
       FROM returns r
       WHERE r.tenant_id = ?
       ORDER BY r.return_date DESC, r.created_at DESC`,
      [tenantId]
    );
    res.json(returnsList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getReturnById = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const [returnsList] = await db.query('SELECT * FROM returns WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (returnsList.length === 0) return res.status(404).json({ error: 'Return log not found' });

    const [items] = await db.query('SELECT * FROM return_items WHERE return_id = ? AND tenant_id = ?', [id, tenantId]);

    res.json({
      ...returnsList[0],
      items
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Edit / Update Return Log (RESTRICTED TO SHOP OWNER)
exports.updateReturn = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userRole = req.user.role;
    const { id } = req.params;

    if (userRole !== 'owner' && userRole !== 'superadmin') {
      return res.status(403).json({ error: 'Permission Denied. Only Shop Owners can edit return records.' });
    }

    const { courier_name, courier_charge, return_delivery_loss, reason, notes, return_date } = req.body;

    const [existing] = await db.query('SELECT * FROM returns WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (existing.length === 0) return res.status(404).json({ error: 'Return record not found' });

    const ret = existing[0];
    const newCourierCharge = courier_charge !== undefined ? Number(courier_charge) : Number(ret.courier_charge);
    const newDelivLoss = return_delivery_loss !== undefined ? Number(return_delivery_loss || 0) : Number(ret.return_delivery_loss || 0);
    const newReturnDate = return_date ? new Date(return_date).toISOString().slice(0, 19).replace('T', ' ') : ret.return_date;

    await db.query(
      `UPDATE returns 
       SET courier_name = ?, courier_charge = ?, return_delivery_loss = ?, reason = ?, notes = ?, return_date = ?
       WHERE id = ? AND tenant_id = ?`,
      [
        courier_name || ret.courier_name,
        newCourierCharge,
        newDelivLoss,
        reason || ret.reason,
        notes !== undefined ? notes : ret.notes,
        newReturnDate,
        id,
        tenantId
      ]
    );

    res.json({ message: 'Return record updated successfully by shop owner' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
