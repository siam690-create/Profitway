const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./config/db');

async function addLocationColumn() {
  try {
    console.log('🚀 Running Products Table Schema Update (Adding `location` & `is_combo` columns)...');

    const columnExists = async (table, column) => {
      const [rows] = await db.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
      );
      return rows.length > 0;
    };

    if (!await columnExists('products', 'location')) {
      await db.query(`ALTER TABLE \`products\` ADD COLUMN \`location\` VARCHAR(150) DEFAULT NULL;`);
      console.log('✅ Added column `location` to `products` table.');
    } else {
      console.log('ℹ️ Column `location` already exists in `products` table.');
    }

    if (!await columnExists('products', 'is_combo')) {
      await db.query(`ALTER TABLE \`products\` ADD COLUMN \`is_combo\` TINYINT(1) DEFAULT 0;`);
      console.log('✅ Added column `is_combo` to `products` table.');
    } else {
      console.log('ℹ️ Column `is_combo` already exists in `products` table.');
    }

    console.log('🎉 Schema update completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration Error:', err);
    process.exit(1);
  }
}

addLocationColumn();
