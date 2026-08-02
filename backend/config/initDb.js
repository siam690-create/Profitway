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

    // Products table is_combo column
    await addColumnIfNotExists('products', 'is_combo', 'TINYINT(1) DEFAULT 0');

    // Combo Items table
    await db.query(`
      CREATE TABLE IF NOT EXISTS combo_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        combo_product_id INT NOT NULL,
        child_product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_combo_tenant (tenant_id),
        INDEX idx_combo_parent (combo_product_id),
        INDEX idx_combo_child (child_product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Stock Movements History & Audit Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        product_id INT NOT NULL,
        movement_type VARCHAR(50) NOT NULL,
        change_qty INT NOT NULL,
        previous_stock INT NOT NULL DEFAULT 0,
        new_stock INT NOT NULL DEFAULT 0,
        reference_no VARCHAR(100) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sm_tenant (tenant_id),
        INDEX idx_sm_prod (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

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
