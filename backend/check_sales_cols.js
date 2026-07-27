const db = require('./config/db');

async function run() {
  const [cols] = await db.query('DESCRIBE sales');
  console.log('Sales columns:', cols.map(c => c.Field));
  process.exit();
}
run();
