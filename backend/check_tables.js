const db = require('./config/db');

async function run() {
  const [tables] = await db.query("SHOW TABLES");
  console.log('Tables:', tables.map(t => Object.values(t)[0]));

  const [lCols] = await db.query('DESCRIBE liabilities');
  console.log('\nliabilities:', lCols.map(c => c.Field));

  const [rCols] = await db.query('DESCRIBE receivables');
  console.log('\nreceivables:', rCols.map(c => c.Field));
  process.exit();
}
run();
