const db = require('./config/db');

(async () => {
  try {
    console.log('Fixing order RSL-792332...');
    await db.query(`UPDATE reseller_sales SET total_amount = 500.00 WHERE invoice_no = 'RSL-792332'`);
    
    // Check if items already inserted
    const [existing] = await db.query(`
      SELECT * FROM reseller_sale_items 
      WHERE reseller_sale_id = (SELECT id FROM reseller_sales WHERE invoice_no = 'RSL-792332' LIMIT 1)
    `);

    if (existing.length === 0) {
      await db.query(`
        INSERT INTO reseller_sale_items 
          (tenant_id, reseller_sale_id, product_id, product_name, quantity, unit_cost, unit_price, total_price, item_profit)
        SELECT tenant_id, id, 1, 'Vintage T9 Type C Trimmer-চুল দাড়ি কাটুনীখন ঘরে বসে', 1, 265.00, 500.00, 500.00, 235.00 
        FROM reseller_sales 
        WHERE invoice_no = 'RSL-792332'
      `);
      console.log('Item inserted!');
    }
    console.log('Order RSL-792332 fixed successfully!');
  } catch (err) {
    console.error('Error fixing order:', err);
  } finally {
    process.exit(0);
  }
})();
