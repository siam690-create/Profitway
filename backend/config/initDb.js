const db = require('./db');

async function autoMigrate() {
  try {
    console.log('🔄 Checking database schema and applying missing column/table migrations...');

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

    // 1. Products table is_combo column
    await addColumnIfNotExists('products', 'is_combo', 'TINYINT(1) DEFAULT 0');

    // 2. Combo Items table
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

    // 3. Stock Movements History & Audit Table
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

    // 4. Sales table delivery & custom date columns
    await addColumnIfNotExists('sales', 'delivery_fee_charged', 'DECIMAL(10,2) DEFAULT 0');
    await addColumnIfNotExists('sales', 'courier_actual_cost', 'DECIMAL(10,2) DEFAULT 0');
    await addColumnIfNotExists('sales', 'delivery_profit', 'DECIMAL(10,2) DEFAULT 0');
    await addColumnIfNotExists('sales', 'sale_date', 'DATETIME NULL');
    await addColumnIfNotExists('sales', 'store_api_key_id', 'INT NULL');

    // 5. Wholesale sales table delivery & custom date columns
    await addColumnIfNotExists('wholesale_sales', 'delivery_fee_charged', 'DECIMAL(10,2) DEFAULT 0');
    await addColumnIfNotExists('wholesale_sales', 'courier_actual_cost', 'DECIMAL(10,2) DEFAULT 0');
    await addColumnIfNotExists('wholesale_sales', 'delivery_profit', 'DECIMAL(10,2) DEFAULT 0');
    await addColumnIfNotExists('wholesale_sales', 'sale_date', 'DATETIME NULL');

    // 6. Multi-Store API Keys table
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

    // 7. Finance Accounts Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS finance_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        account_type VARCHAR(50) DEFAULT 'bank',
        account_number VARCHAR(100) DEFAULT NULL,
        balance DECIMAL(12,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_fa_tenant (tenant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 8. Manual Deposits Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS manual_deposits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        account_id INT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        source_title VARCHAR(255) NOT NULL,
        notes TEXT DEFAULT NULL,
        deposit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_md_tenant (tenant_id),
        INDEX idx_md_acc (account_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 8b. General Account Transactions Audit Ledger Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS account_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        account_id INT NOT NULL,
        type VARCHAR(100) NOT NULL,
        debit DECIMAL(12,2) DEFAULT 0.00,
        credit DECIMAL(12,2) DEFAULT 0.00,
        reference_no VARCHAR(100) NULL,
        notes TEXT NULL,
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_at_tenant (tenant_id),
        INDEX idx_at_acc (account_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 9. Liabilities (Dena / Payables) Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS liabilities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        party_type VARCHAR(50) NOT NULL DEFAULT 'supplier',
        party_name VARCHAR(255) NOT NULL,
        total_amount DECIMAL(12,2) NOT NULL,
        amount_paid DECIMAL(12,2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'pending',
        due_date DATE DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_liab_tenant (tenant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 10. Receivables (Pawna / Dues) Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS receivables (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        party_type VARCHAR(50) NOT NULL DEFAULT 'customer',
        party_name VARCHAR(255) NOT NULL,
        total_amount DECIMAL(12,2) NOT NULL,
        amount_collected DECIMAL(12,2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'pending',
        due_date DATE DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rec_tenant (tenant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 10b. Liability Payments & Receivable Collections Audit Tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS liability_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        liability_id INT NOT NULL,
        account_id INT DEFAULT NULL,
        amount DECIMAL(12,2) NOT NULL,
        notes TEXT DEFAULT NULL,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_lp_tenant (tenant_id),
        INDEX idx_lp_liab (liability_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS receivable_collections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        receivable_id INT NOT NULL,
        account_id INT DEFAULT NULL,
        amount DECIMAL(12,2) NOT NULL,
        notes TEXT DEFAULT NULL,
        collection_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rc_tenant (tenant_id),
        INDEX idx_rc_rec (receivable_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 11. Investments & Investment Transactions
    await db.query(`
      CREATE TABLE IF NOT EXISTS investments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        investor_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) DEFAULT NULL,
        email VARCHAR(255) DEFAULT NULL,
        total_invested DECIMAL(12,2) DEFAULT 0.00,
        total_repaid DECIMAL(12,2) DEFAULT 0.00,
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_inv_tenant (tenant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS investment_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        investment_id INT NOT NULL,
        type VARCHAR(20) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        account_id INT DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_it_tenant (tenant_id),
        INDEX idx_it_invest (investment_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 12. Paid Ads Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS paid_ads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        product_id INT DEFAULT NULL,
        platform VARCHAR(100) NOT NULL DEFAULT 'Facebook Ads',
        amount_usd DECIMAL(10,2) NOT NULL,
        exchange_rate DECIMAL(10,2) NOT NULL DEFAULT 120.00,
        total_bdt_cost DECIMAL(12,2) NOT NULL,
        ad_date DATE NOT NULL,
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pa_tenant (tenant_id),
        INDEX idx_pa_prod (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 13. Payroll Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS payroll (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        staff_id INT NOT NULL,
        staff_name VARCHAR(255) NOT NULL,
        month_year VARCHAR(20) NOT NULL,
        base_salary DECIMAL(10,2) NOT NULL,
        bonus DECIMAL(10,2) DEFAULT 0.00,
        advance_deduction DECIMAL(10,2) DEFAULT 0.00,
        net_payable DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'Cash',
        account_id INT DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pay_tenant (tenant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('✅ Database schema auto-migration complete! All missing tables created.');
  } catch (err) {
    console.error('⚠️ DB Auto-migration failed:', err.message);
  }
}

module.exports = autoMigrate;
