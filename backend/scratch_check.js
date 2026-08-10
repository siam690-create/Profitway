const db = require('./config/db');

(async () => {
  try {
    const [returns] = await db.query('SELECT * FROM returns WHERE tenant_id = 2');
    console.log('--- RETURNS FOR TENANT 2 (Count: ' + returns.length + ') ---');
    console.log(returns);

    const [items] = await db.query('SELECT * FROM return_items WHERE tenant_id = 2 LIMIT 20');
    console.log('--- RETURN ITEMS FOR TENANT 2 (Sample 20) ---');
    console.log(items);

    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
