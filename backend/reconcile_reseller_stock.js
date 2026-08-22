const db = require('./config/db');
const { adjustResellerOrderStock } = require('./controllers/resellerPortalController');

(async () => {
  try {
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
