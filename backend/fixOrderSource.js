const db = require('./config/db');

(async () => {
  try {
    console.log('Fixing order_source for portal orders...');
    // Mark RSL-792332 and any order with customer phone & pending/portal as 'portal'
    const [res1] = await db.query(`
      UPDATE reseller_sales 
      SET order_source = 'portal' 
      WHERE invoice_no = 'RSL-792332'
    `);
    
    const [res2] = await db.query(`
      UPDATE reseller_sales 
      SET order_source = 'portal' 
      WHERE customer_phone IS NOT NULL 
        AND customer_phone != '' 
        AND customer_address IS NOT NULL 
        AND customer_address != ''
    `);

    console.log('Updated portal order sources successfully!');
  } catch (err) {
    console.error('Error updating order source:', err);
  } finally {
    process.exit(0);
  }
})();
