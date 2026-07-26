const db = require('./config/db');

async function run() {
  const [pCols] = await db.query('DESCRIBE products');
  console.log('Products columns:', pCols.map(c => c.Field));
  const [uCols] = await db.query('DESCRIBE users');
  console.log('Users columns:', uCols.map(c => c.Field));
  process.exit();
}
run();
