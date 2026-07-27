const db = require('./backend/config/db');

async function run() {
  await db.query("UPDATE users SET email = 'admin@profitway.bd' WHERE role = 'superadmin'");
  console.log('Superadmin email updated to admin@profitway.bd');
  process.exit();
}
run();
