const db = require('./config/db');

async function run() {
  const [cols] = await db.query('DESCRIBE returns');
  console.log('Returns columns:', cols.map(c => c.Field));
  process.exit();
}
run();
