const db = require('./config/db');

async function run() {
  const [cols] = await db.query('DESCRIBE wholesale_sales');
  console.log('Wholesale sales columns:', cols.map(c => c.Field));
  process.exit();
}
run();
