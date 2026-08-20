const { execSync } = require('child_process');
const db = require('./config/db');

async function restoreAllResellerSales() {
  console.log('=== FULL AUTOMATIC RESELLER SALES RESTORATION FROM BINLOGS ===');
  
  const raw = execSync('mysqlbinlog -v --base64-output=DECODE-ROWS /var/lib/mysql/binlog.0000*', { maxBuffer: 100 * 1024 * 1024 }).toString();

  // Extract all reseller_sales insert statements
  const salesMap = {};
  const saleRegex = /### INSERT INTO `profitway_db`\.`reseller_sales`([\s\S]*?)(?=(### INSERT|COMMIT|# at |\/\*!|\Z))/g;
  let match;

  while ((match = saleRegex.exec(raw)) !== null) {
    const content = match[1];
    const lines = content.split('\n');
    const row = {};
    for (const l of lines) {
      const m = l.match(/###\s+@(\d+)=([\s\S]+)/);
      if (m) {
        const colIdx = parseInt(m[1], 10);
        let val = m[2].trim();
        if (val === 'NULL') {
          val = null;
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, "\\");
        } else {
          val = Number(val);
        }
        row[colIdx] = val;
      }
    }

    if (row[1] && row[2]) { // Has id and tenant_id
      const id = row[1];
      const createdTime = row[17] ? (typeof row[17] === 'number' && row[17] > 1000000000 ? new Date(row[17] * 1000).toISOString().slice(0, 19).replace('T', ' ') : row[17]) : new Date().toISOString().slice(0, 19).replace('T', ' ');

      salesMap[id] = {
        id: id,
        tenant_id: row[2],
        reseller_name: row[3] || 'Sellway',
        customer_name: row[4] || null,
        customer_phone: row[5] || null,
        invoice_no: row[6] || `RSL-${id}`,
        total_amount: Number(row[7] || 0),
        total_cost: Number(row[8] || 0),
        gross_profit: Number(row[9] || 0),
        delivery_fee_charged: Number(row[10] || 0),
        courier_actual_cost: Number(row[11] || 0),
        delivery_profit: Number(row[12] || 0),
        payment_status: row[13] || 'paid',
        account_id: row[14] || null,
        sale_date: row[15] || null,
        notes: row[16] || null,
        created_at: createdTime,
        order_status: row[18] || 'delivered',
        payout_status: row[19] || 'paid',
        reseller_wholesale_cost: Number(row[20] || row[8] || 0),
        reseller_profit: Number(row[21] || row[9] || 0),
        return_loss: Number(row[22] || 0),
        customer_address: row[23] || null,
        district: row[24] || null,
        thana: row[25] || null,
        courier_name: row[26] || null,
        reseller_id: row[27] || null,
        payout_id: row[28] || null,
        order_source: row[29] || 'manual'
      };
    }
  }

  // Extract all reseller_sale_items
  const itemsMap = {};
  const itemRegex = /### INSERT INTO `profitway_db`\.`reseller_sale_items`([\s\S]*?)(?=(### INSERT|COMMIT|# at |\/\*!|\Z))/g;
  while ((match = itemRegex.exec(raw)) !== null) {
    const content = match[1];
    const lines = content.split('\n');
    const row = {};
    for (const l of lines) {
      const m = l.match(/###\s+@(\d+)=([\s\S]+)/);
      if (m) {
        const colIdx = parseInt(m[1], 10);
        let val = m[2].trim();
        if (val === 'NULL') val = null;
        else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, "\\");
        else val = Number(val);
        row[colIdx] = val;
      }
    }

    if (row[1] && row[3]) { // Has id and reseller_sale_id
      const id = row[1];
      const saleId = row[3];
      if (!itemsMap[saleId]) itemsMap[saleId] = [];
      
      // Avoid duplicate item IDs
      if (!itemsMap[saleId].some(i => i.id === id)) {
        itemsMap[saleId].push({
          id: id,
          tenant_id: row[2],
          reseller_sale_id: saleId,
          product_id: row[4] || null,
          product_name: row[5] || 'Product',
          quantity: Number(row[6] || 1),
          unit_cost: Number(row[7] || 0),
          unit_price: Number(row[8] || 0),
          total_price: Number(row[9] || 0)
        });
      }
    }
  }

  console.log(`Found ${Object.keys(salesMap).length} sales to restore.`);

  // Insert/Restore into Database
  let restoredCount = 0;
  for (const id in salesMap) {
    const s = salesMap[id];
    
    // Insert into reseller_sales with INSERT IGNORE or ON DUPLICATE KEY UPDATE
    await db.query(`
      INSERT INTO reseller_sales 
        (id, tenant_id, reseller_name, customer_name, customer_phone, invoice_no, total_amount, total_cost, gross_profit, delivery_fee_charged, courier_actual_cost, delivery_profit, payment_status, account_id, sale_date, notes, created_at, order_status, payout_status, reseller_wholesale_cost, reseller_profit, return_loss, customer_address, district, thana, courier_name, reseller_id, payout_id, order_source)
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        reseller_name = VALUES(reseller_name),
        sale_date = VALUES(sale_date),
        delivery_fee_charged = VALUES(delivery_fee_charged),
        courier_actual_cost = VALUES(courier_actual_cost),
        delivery_profit = VALUES(delivery_profit),
        order_status = VALUES(order_status)
    `, [
      s.id, s.tenant_id, s.reseller_name, s.customer_name, s.customer_phone, s.invoice_no,
      s.total_amount, s.total_cost, s.gross_profit, s.delivery_fee_charged, s.courier_actual_cost, s.delivery_profit,
      s.payment_status, s.account_id, s.sale_date, s.notes, s.created_at, s.order_status, s.payout_status,
      s.reseller_wholesale_cost, s.reseller_profit, s.return_loss, s.customer_address, s.district, s.thana,
      s.courier_name, s.reseller_id, s.payout_id, s.order_source
    ]);

    // Insert items
    if (itemsMap[id]) {
      for (const item of itemsMap[id]) {
        await db.query(`
          INSERT INTO reseller_sale_items
            (id, tenant_id, reseller_sale_id, product_id, product_name, quantity, unit_cost, unit_price, total_price)
          VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            product_name = VALUES(product_name),
            quantity = VALUES(quantity),
            unit_cost = VALUES(unit_cost),
            unit_price = VALUES(unit_price),
            total_price = VALUES(total_price)
        `, [
          item.id, item.tenant_id, item.reseller_sale_id, item.product_id, item.product_name,
          item.quantity, item.unit_cost, item.unit_price, item.total_price
        ]);
      }
    }

    restoredCount++;
  }

  console.log(`✅ Successfully restored all ${restoredCount} reseller sales & items into database!`);
  
  // Print current list
  const [rows] = await db.query('SELECT id, invoice_no, reseller_name, sale_date, delivery_fee_charged, courier_actual_cost, delivery_profit FROM reseller_sales ORDER BY id ASC');
  console.table(rows);

  process.exit(0);
}

restoreAllResellerSales().catch(err => {
  console.error('Fatal restore error:', err);
  process.exit(1);
});
