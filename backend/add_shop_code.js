const db = require('./config/db');

async function run() {
  const [cols] = await db.query('DESCRIBE tenants');
  const existingCols = cols.map(c => c.Field);

  if (!existingCols.includes('shop_code')) {
    await db.query('ALTER TABLE tenants ADD COLUMN shop_code VARCHAR(50) UNIQUE AFTER shop_name');
    console.log('Added shop_code column to tenants table.');
  }

  // Populate shop_code for existing tenants
  const [tenants] = await db.query('SELECT id, shop_code FROM tenants');
  for (const t of tenants) {
    if (!t.shop_code) {
      const code = `SHOP-${1000 + t.id}`;
      await db.query('UPDATE tenants SET shop_code = ? WHERE id = ?', [code, t.id]);
      console.log(`Updated tenant #${t.id} with shop_code ${code}`);
    }
  }

  console.log('Shop code migration completed successfully!');
  process.exit();
}

run().catch(err => {
  console.error('Error adding shop_code:', err);
  process.exit(1);
});
