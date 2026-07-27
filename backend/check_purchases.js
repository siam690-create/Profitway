const db = require('./config/db');

async function run() {
  const [cols] = await db.query('DESCRIBE purchases');
  console.log('Purchases columns:', cols.map(c => c.Field));
  process.exit();
}
run();
