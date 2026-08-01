const db = require('../config/db');

// Ingest External Order from WooCommerce, Shopify, or Custom Website
exports.importExternalOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    // 1. Authenticate via X-API-Key or Authorization Bearer token
    const authHeader = req.headers['authorization'] || '';
    const headerApiKey = req.headers['x-api-key'] || '';

    let token = headerApiKey;
    if (!token && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed. Please provide X-API-Key or Authorization Bearer header.'
      });
    }

    // Query active API Key record
    const [keyRows] = await connection.query(
      'SELECT id, tenant_id, store_name, store_domain FROM store_api_keys WHERE api_key = ? AND is_active = 1',
      [token]
    );

    if (keyRows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or inactive Store API Key.'
      });
    }

    const storeKey = keyRows[0];
    const tenantId = storeKey.tenant_id;
    const storeApiKeyId = storeKey.id;
    const sourceWebsite = storeKey.store_name;

    // 2. Payload Validation
    const { 
      external_order_id, 
      customer_name, 
      customer_phone, 
      customer_email, 
      shipping_address, 
      payment_method, 
      customer_note,
      items,
      // Fallback single-item fields
      product_sku,
      product_id,
      quantity,
      unit_price,
      total_amount: payloadTotal
    } = req.body;

    if (!external_order_id || !customer_name || !customer_phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required payload fields: external_order_id, customer_name, and customer_phone are mandatory.'
      });
    }

    // Standardize items array
    let orderItems = [];
    if (items && Array.isArray(items) && items.length > 0) {
      orderItems = items;
    } else if (product_sku || product_id) {
      orderItems = [{
        product_sku,
        product_id,
        quantity: quantity || 1,
        unit_price: unit_price || 0
      }];
    } else {
      return res.status(400).json({
        success: false,
        error: 'Order payload must include an items array or product_sku / product_id with quantity & unit_price.'
      });
    }

    // 3. Idempotency & Duplicate Protection Check
    const [existingOrders] = await connection.query(
      'SELECT id, invoice_no FROM sales WHERE tenant_id = ? AND store_api_key_id = ? AND external_order_id = ?',
      [tenantId, storeApiKeyId, String(external_order_id)]
    );

    if (existingOrders.length > 0) {
      return res.status(200).json({
        success: true,
        already_exists: true,
        message: 'Order has already been ingested into Profitway SaaS.',
        order_id: existingOrders[0].id,
        order_number: existingOrders[0].invoice_no,
        external_order_id: String(external_order_id)
      });
    }

    await connection.beginTransaction();

    // 4. Resolve Products, Deduct Stock & Calculate Totals
    let calculatedTotalCost = 0;
    let calculatedTotalAmount = 0;
    const processedItems = [];

    for (const item of orderItems) {
      const itemSku = item.product_sku || item.sku;
      const itemId = item.product_id || item.id;
      const qty = Math.max(1, Number(item.quantity || 1));
      const price = Number(item.unit_price || item.price || 0);

      let matchedProduct = null;

      // Match product_sku first
      if (itemSku) {
        const [skuRows] = await connection.query(
          'SELECT id, name, cost_price, selling_price, stock_quantity FROM products WHERE tenant_id = ? AND sku = ?',
          [tenantId, String(itemSku).trim()]
        );
        if (skuRows.length > 0) matchedProduct = skuRows[0];
      }

      // Fallback to product_id match
      if (!matchedProduct && itemId) {
        const [idRows] = await connection.query(
          'SELECT id, name, cost_price, selling_price, stock_quantity FROM products WHERE tenant_id = ? AND id = ?',
          [tenantId, Number(itemId)]
        );
        if (idRows.length > 0) matchedProduct = idRows[0];
      }

      const prodName = matchedProduct ? matchedProduct.name : (item.product_name || item.name || 'External Item');
      const unitCost = matchedProduct ? Number(matchedProduct.cost_price) : 0;
      const itemTotalPrice = price * qty;
      const itemTotalCost = unitCost * qty;
      const itemProfit = itemTotalPrice - itemTotalCost;

      calculatedTotalAmount += itemTotalPrice;
      calculatedTotalCost += itemTotalCost;

      // Deduct stock if matched product exists
      if (matchedProduct) {
        const newStock = Math.max(0, Number(matchedProduct.stock_quantity) - qty);
        await connection.query(
          'UPDATE products SET stock_quantity = ? WHERE id = ? AND tenant_id = ?',
          [newStock, matchedProduct.id, tenantId]
        );
      }

      processedItems.push({
        product_id: matchedProduct ? matchedProduct.id : null,
        product_name: prodName,
        quantity: qty,
        unit_cost: unitCost,
        unit_price: price,
        total_price: itemTotalPrice,
        total_cost: itemTotalCost,
        item_profit: itemProfit
      });
    }

    const finalTotalAmount = payloadTotal ? Number(payloadTotal) : calculatedTotalAmount;
    const finalGrossProfit = finalTotalAmount - calculatedTotalCost;

    // 5. Generate Unique Invoice Number (INV-EXT-1001...)
    const [countRows] = await connection.query('SELECT COUNT(id) AS total FROM sales WHERE tenant_id = ?', [tenantId]);
    const extCount = Number(countRows[0].total || 0) + 1;
    const invoiceNo = `INV-EXT-${1000 + extCount}`;

    // Insert Sale Record
    const [saleResult] = await connection.query(
      `INSERT INTO sales 
       (tenant_id, invoice_no, customer_name, customer_phone, customer_email, shipping_address, total_amount, total_cost, gross_profit, payment_method, notes, store_api_key_id, source_website, external_order_id, raw_payload)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        invoiceNo,
        customer_name.trim(),
        customer_phone.trim(),
        customer_email ? customer_email.trim() : null,
        shipping_address ? shipping_address.trim() : null,
        finalTotalAmount,
        calculatedTotalCost,
        finalGrossProfit,
        payment_method || 'Online Order',
        customer_note || `Imported via API from ${sourceWebsite} (Ext ID: ${external_order_id})`,
        storeApiKeyId,
        sourceWebsite,
        String(external_order_id),
        JSON.stringify(req.body)
      ]
    );

    const saleId = saleResult.insertId;

    // Insert Sale Items Records
    for (const pItem of processedItems) {
      await connection.query(
        `INSERT INTO sale_items 
         (tenant_id, sale_id, product_id, product_name, quantity, unit_cost, unit_price, total_price, total_cost, item_profit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId,
          saleId,
          pItem.product_id || 0,
          pItem.product_name,
          pItem.quantity,
          pItem.unit_cost,
          pItem.unit_price,
          pItem.total_price,
          pItem.total_cost,
          pItem.item_profit
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'External order imported successfully.',
      order_id: saleId,
      order_number: invoiceNo,
      external_order_id: String(external_order_id),
      source_website: sourceWebsite,
      total_amount: finalTotalAmount
    });

  } catch (error) {
    await connection.rollback();
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    connection.release();
  }
};
