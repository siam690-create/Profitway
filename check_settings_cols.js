const db = require('./backend/config/db');

async function run() {
  const [cols] = await db.query('DESCRIBE shop_settings');
  console.log('shop_settings columns:', cols.map(c => c.Field));
  process.exit();
}
run();
