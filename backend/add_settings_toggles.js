const db = require('./config/db');

async function run() {
  const [cols] = await db.query('DESCRIBE shop_settings');
  const existingCols = cols.map(c => c.Field);

  const newCols = [
    { name: 'show_shop_name', type: 'TINYINT(1) DEFAULT 1' },
    { name: 'show_address', type: 'TINYINT(1) DEFAULT 1' },
    { name: 'show_phone_email', type: 'TINYINT(1) DEFAULT 1' },
    { name: 'show_vat_no', type: 'TINYINT(1) DEFAULT 1' },
    { name: 'show_invoice_no', type: 'TINYINT(1) DEFAULT 1' },
    { name: 'show_invoice_date', type: 'TINYINT(1) DEFAULT 1' },
    { name: 'show_customer_info', type: 'TINYINT(1) DEFAULT 1' }
  ];

  for (const col of newCols) {
    if (!existingCols.includes(col.name)) {
      await db.query(`ALTER TABLE shop_settings ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Added column ${col.name} to shop_settings table.`);
    }
  }

  console.log('shop_settings columns updated successfully!');
  process.exit();
}

run().catch(err => {
  console.error('Error updating shop_settings:', err);
  process.exit(1);
});
