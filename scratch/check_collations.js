require('../backend/node_modules/dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const db = require('../backend/config/db');

async function checkCollations() {
  try {
    console.log('Fixing collations & adding permissions column...');
    try {
      await db.query("ALTER TABLE users ADD COLUMN permissions TEXT NULL");
      console.log('Added permissions column to users table.');
    } catch (e) {
      console.log('Note on permissions column:', e.message);
    }
    await db.query("ALTER TABLE plans MODIFY code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL");
    await db.query("ALTER TABLE tenants MODIFY subscription_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    await db.query("ALTER TABLE employees MODIFY email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    console.log('Collation fix applied successfully.');

    const [rows] = await db.query(`
      SELECT TABLE_NAME, COLUMN_NAME, COLLATION_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND COLLATION_NAME IS NOT NULL
    `);
    console.log('Collations in DB:');
    const collationCounts = {};
    for (const r of rows) {
      collationCounts[r.COLLATION_NAME] = (collationCounts[r.COLLATION_NAME] || 0) + 1;
      if (['code', 'subscription_status', 'email'].includes(r.COLUMN_NAME)) {
        console.log(`${r.TABLE_NAME}.${r.COLUMN_NAME} => ${r.COLLATION_NAME}`);
      }
    }
    console.log('Collation Summary:', collationCounts);
  } catch (err) {
    console.error('Error checking collations:', err);
  } finally {
    process.exit();
  }
}

checkCollations();
