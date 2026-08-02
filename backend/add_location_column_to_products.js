const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./config/db');

async function addLocationColumn() {
  try {
    console.log('🚀 Running Products Table Schema Update (Fixing name column length, location & is_combo)...');

    const columnExists = async (table, column) => {
      const [rows] = await db.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
      );
      return rows.length > 0;
    };

    // 1. Expand `name` column to TEXT so long product titles & Unicode names are never truncated
    await db.query(`ALTER TABLE \`products\` MODIFY COLUMN \`name\` TEXT NOT NULL;`);
    console.log('✅ Expanded `products.name` column to TEXT type.');

    await db.query(`ALTER TABLE \`products\` MODIFY COLUMN \`sku\` VARCHAR(100) NOT NULL;`);
    console.log('✅ Expanded `products.sku` column to VARCHAR(100).');

    await db.query(`ALTER TABLE \`categories\` MODIFY COLUMN \`name\` VARCHAR(255) NOT NULL;`);
    console.log('✅ Expanded `categories.name` column to VARCHAR(255).');

    // 2. Ensure `location` and `is_combo` columns exist
    if (!await columnExists('products', 'location')) {
      await db.query(`ALTER TABLE \`products\` ADD COLUMN \`location\` VARCHAR(150) DEFAULT NULL;`);
      console.log('✅ Added column `location` to `products` table.');
    }

    if (!await columnExists('products', 'is_combo')) {
      await db.query(`ALTER TABLE \`products\` ADD COLUMN \`is_combo\` TINYINT(1) DEFAULT 0;`);
      console.log('✅ Added column `is_combo` to `products` table.');
    }

    console.log('🎉 Schema update completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration Error:', err);
    process.exit(1);
  }
}

addLocationColumn();
