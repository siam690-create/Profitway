const db = require('./db');

async function autoMigrate() {
  try {
    console.log('🔄 Checking database schema and applying missing column migrations...');

    const addColumnIfNotExists = async (table, column, definition) => {
      try {
        const [cols] = await db.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
        if (cols.length === 0) {
          await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
          console.log(`✅ Added column ${column} to table ${table}`);
        }
      } catch (err) {
        console.warn(`Could not add column ${column} to ${table}:`, err.message);
      }
    };

    // Sales table delivery & custom date columns
    await addColumnIfNotExists('sales', 'delivery_fee_charged', 'DECIMAL(10,2) DEFAULT 0');
    await addColumnIfNotExists('sales', 'courier_actual_cost', 'DECIMAL(10,2) DEFAULT 0');
    await addColumnIfNotExists('sales', 'delivery_profit', 'DECIMAL(10,2) DEFAULT 0');
    await addColumnIfNotExists('sales', 'sale_date', 'DATETIME NULL');
    await addColumnIfNotExists('sales', 'store_api_key_id', 'INT NULL');

    // Wholesale sales table delivery & custom date columns
    await addColumnIfNotExists('wholesale_sales', 'delivery_fee_charged', 'DECIMAL(10,2) DEFAULT 0');
    await addColumnIfNotExists('wholesale_sales', 'courier_actual_cost', 'DECIMAL(10,2) DEFAULT 0');
    await addColumnIfNotExists('wholesale_sales', 'delivery_profit', 'DECIMAL(10,2) DEFAULT 0');
    await addColumnIfNotExists('wholesale_sales', 'sale_date', 'DATETIME NULL');

    // Multi-Store API Keys table
    await db.query(`
      CREATE TABLE IF NOT EXISTS store_api_keys (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        store_name VARCHAR(255) NOT NULL,
        api_key VARCHAR(255) NOT NULL UNIQUE,
        platform VARCHAR(100) DEFAULT 'custom',
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('✅ Database schema auto-migration complete!');
  } catch (err) {
    console.error('⚠️ DB Auto-migration failed:', err.message);
  }
}

module.exports = autoMigrate;
