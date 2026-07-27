const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, 'settings_schema.sql'), 'utf8');
  await db.query(sql);
  console.log('shop_settings table created/verified successfully!');
  process.exit();
}

run().catch(err => {
  console.error('Error applying settings schema:', err);
  process.exit(1);
});
