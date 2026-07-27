const db = require('./config/db');

async function run() {
  const [cols] = await db.query('DESCRIBE tenants');
  console.log('Tenants columns:', cols.map(c => c.Field));
  process.exit();
}
run();
