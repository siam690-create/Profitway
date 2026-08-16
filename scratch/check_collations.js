require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const db = require('../backend/config/db');

async function checkCollations() {
  try {
    const [rows] = await db.query(`
      SELECT TABLE_NAME, COLUMN_NAME, COLLATION_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND COLLATION_NAME IS NOT NULL
    `);
    console.log('Collations in DB:');
    const collationCounts = {};
    for (const r of rows) {
      collationCounts[r.COLLATION_NAME] = (collationCounts[r.COLLATION_NAME] || 0) + 1;
      if (r.COLUMN_NAME === 'code' || r.COLUMN_NAME === 'subscription_status' || r.COLUMN_NAME === 'email') {
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
