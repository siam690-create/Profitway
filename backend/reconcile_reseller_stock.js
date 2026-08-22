const db = require('./config/db');
const { adjustResellerOrderStock, ensureResellerSchema } = require('./controllers/resellerPortalController');

(async () => {
  try {
    const conn = await db.getConnection();
    try {
      const [sdCols] = await conn.query("SHOW COLUMNS FROM reseller_sales LIKE 'stock_deducted'");
      if (sdCols.length === 0) {
        await conn.query("ALTER TABLE reseller_sales ADD COLUMN stock_deducted TINYINT(1) DEFAULT 0");
        console.log("Added stock_deducted column to reseller_sales table.");
      }
    } finally {
      conn.release();
    }

    const [orders] = await db.query(`
      SELECT id, tenant_id, invoice_no, order_status 
      FROM reseller_sales 
      WHERE order_status IN ('in_courier', 'ready', 'confirmed', 'processing', 'shipped', 'delivered', 'partially_delivered', 'complete', 'paid') 
        AND (stock_deducted = 0 OR stock_deducted IS NULL)
    `);
    console.log(`Found ${orders.length} active reseller orders needing stock deduction.`);
    for (const o of orders) {
      await adjustResellerOrderStock(db, o.id, o.tenant_id, 'deduct');
      console.log(`Deducted stock for Order #${o.invoice_no}`);
    }
    console.log('✅ Stock reconciliation finished successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Reconciliation error:', err);
    process.exit(1);
  }
})();
