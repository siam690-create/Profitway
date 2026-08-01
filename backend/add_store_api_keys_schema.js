const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./config/db');

async function applyStoreApiKeysMigration() {
  try {
    console.log('🚀 Running Store API Keys & External Order Ingestion Migration...');

    // 1. Create store_api_keys table
    await db.query(`
      CREATE TABLE IF NOT EXISTS \`store_api_keys\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`tenant_id\` INT NOT NULL,
        \`store_name\` VARCHAR(150) NOT NULL,
        \`store_domain\` VARCHAR(255) DEFAULT NULL,
        \`api_key\` VARCHAR(100) NOT NULL UNIQUE,
        \`is_active\` TINYINT(1) DEFAULT 1,
        \`notes\` TEXT DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ Created table `store_api_keys` successfully.');

    // 2. Helper function to check if column exists
    const columnExists = async (table, column) => {
      const [rows] = await db.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
      );
      return rows.length > 0;
    };

    // 3. Add columns to `sales` table
    if (!await columnExists('sales', 'store_api_key_id')) {
      await db.query(`ALTER TABLE \`sales\` ADD COLUMN \`store_api_key_id\` INT DEFAULT NULL;`);
      await db.query(`ALTER TABLE \`sales\` ADD CONSTRAINT \`fk_sales_store_api_key\` FOREIGN KEY (\`store_api_key_id\`) REFERENCES \`store_api_keys\`(\`id\`) ON DELETE SET NULL;`);
      console.log('✅ Added column `store_api_key_id` to `sales`.');
    }

    if (!await columnExists('sales', 'source_website')) {
      await db.query(`ALTER TABLE \`sales\` ADD COLUMN \`source_website\` VARCHAR(150) DEFAULT NULL;`);
      console.log('✅ Added column `source_website` to `sales`.');
    }

    if (!await columnExists('sales', 'external_order_id')) {
      await db.query(`ALTER TABLE \`sales\` ADD COLUMN \`external_order_id\` VARCHAR(100) DEFAULT NULL;`);
      console.log('✅ Added column `external_order_id` to `sales`.');
    }

    if (!await columnExists('sales', 'customer_phone')) {
      await db.query(`ALTER TABLE \`sales\` ADD COLUMN \`customer_phone\` VARCHAR(50) DEFAULT NULL;`);
      console.log('✅ Added column `customer_phone` to `sales`.');
    }

    if (!await columnExists('sales', 'customer_email')) {
      await db.query(`ALTER TABLE \`sales\` ADD COLUMN \`customer_email\` VARCHAR(150) DEFAULT NULL;`);
      console.log('✅ Added column `customer_email` to `sales`.');
    }

    if (!await columnExists('sales', 'shipping_address')) {
      await db.query(`ALTER TABLE \`sales\` ADD COLUMN \`shipping_address\` TEXT DEFAULT NULL;`);
      console.log('✅ Added column `shipping_address` to `sales`.');
    }

    if (!await columnExists('sales', 'raw_payload')) {
      await db.query(`ALTER TABLE \`sales\` ADD COLUMN \`raw_payload\` JSON DEFAULT NULL;`);
      console.log('✅ Added column `raw_payload` to `sales`.');
    }

    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration Error:', err);
    process.exit(1);
  }
}

applyStoreApiKeysMigration();
