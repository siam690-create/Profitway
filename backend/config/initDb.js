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

    // 14. Enterprise HR & Employee Directory Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        user_id INT DEFAULT NULL,
        employee_code VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        designation VARCHAR(100) DEFAULT 'Staff',
        department VARCHAR(100) DEFAULT 'General',
        phone VARCHAR(50) DEFAULT NULL,
        email VARCHAR(150) DEFAULT NULL,
        joining_date DATE DEFAULT NULL,
        nid_number VARCHAR(100) DEFAULT NULL,
        blood_group VARCHAR(20) DEFAULT NULL,
        emergency_contact_name VARCHAR(150) DEFAULT NULL,
        emergency_contact_phone VARCHAR(50) DEFAULT NULL,
        photo_url TEXT DEFAULT NULL,
        base_salary DECIMAL(12,2) DEFAULT 0.00,
        hourly_rate DECIMAL(10,2) DEFAULT 0.00,
        overtime_rate DECIMAL(10,2) DEFAULT 0.00,
        payment_method VARCHAR(50) DEFAULT 'Cash',
        account_number VARCHAR(100) DEFAULT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_emp_tenant (tenant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 15. Employee Attendance Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS employee_attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        employee_id INT NOT NULL,
        date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'present',
        in_time TIME DEFAULT NULL,
        out_time TIME DEFAULT NULL,
        overtime_hours DECIMAL(5,2) DEFAULT 0.00,
        late_minutes INT DEFAULT 0,
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_att_tenant (tenant_id),
        INDEX idx_att_emp_date (employee_id, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 16. Employee Leaves Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS employee_leaves (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        employee_id INT NOT NULL,
        leave_type VARCHAR(50) NOT NULL DEFAULT 'casual',
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        total_days INT NOT NULL DEFAULT 1,
        reason TEXT DEFAULT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        approved_by VARCHAR(150) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_lv_tenant (tenant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 17. Employee Loans & Advances Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS employee_loans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        employee_id INT NOT NULL,
        loan_amount DECIMAL(12,2) NOT NULL,
        paid_amount DECIMAL(12,2) DEFAULT 0.00,
        monthly_installment DECIMAL(12,2) DEFAULT 0.00,
        account_id INT DEFAULT NULL,
        disbursement_date DATE DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ln_tenant (tenant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 18. Employee Loan Repayments Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS employee_loan_repayments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        loan_id INT NOT NULL,
        employee_id INT NOT NULL,
        repayment_amount DECIMAL(12,2) NOT NULL,
        repayment_source VARCHAR(50) DEFAULT 'salary_deduction',
        payroll_id INT DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_lr_tenant (tenant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 19. Employee Provident Fund (PF) Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS employee_pf (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        employee_id INT NOT NULL,
        employee_contrib_pct DECIMAL(5,2) DEFAULT 5.00,
        employer_contrib_pct DECIMAL(5,2) DEFAULT 5.00,
        accumulated_balance DECIMAL(12,2) DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pf_tenant (tenant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 20. Employee Bonuses & Allowances Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS employee_bonuses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        employee_id INT DEFAULT NULL,
        title VARCHAR(255) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        bonus_date DATE NOT NULL,
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_bn_tenant (tenant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 21. Staff Task Management System Tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        assigned_to_staff_id INT DEFAULT NULL,
        created_by_user_id INT DEFAULT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        category VARCHAR(100) DEFAULT 'General',
        priority VARCHAR(20) NOT NULL DEFAULT 'medium',
        status VARCHAR(20) NOT NULL DEFAULT 'todo',
        due_date DATETIME DEFAULT NULL,
        completed_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tsk_tenant (tenant_id),
        INDEX idx_tsk_staff (assigned_to_staff_id),
        INDEX idx_tsk_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS task_checklists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        task_id INT NOT NULL,
        item_text VARCHAR(255) NOT NULL,
        is_completed TINYINT(1) DEFAULT 0,
        completed_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_chk_tenant (tenant_id),
        INDEX idx_chk_task (task_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS task_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        task_id INT NOT NULL,
        user_id INT DEFAULT NULL,
        user_name VARCHAR(150) NOT NULL,
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_cm_tenant (tenant_id),
        INDEX idx_cm_task (task_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Retroactive column additions to payroll table
    await addColumnIfNotExists('payroll', 'employee_id', 'INT NULL');
    await addColumnIfNotExists('payroll', 'net_payable', 'DECIMAL(12,2) DEFAULT 0.00');
    await addColumnIfNotExists('payroll', 'net_salary_paid', 'DECIMAL(12,2) DEFAULT 0.00');
    await addColumnIfNotExists('payroll', 'overtime_pay', 'DECIMAL(10,2) DEFAULT 0.00');
    await addColumnIfNotExists('payroll', 'absent_penalty', 'DECIMAL(10,2) DEFAULT 0.00');
    await addColumnIfNotExists('payroll', 'late_penalty', 'DECIMAL(10,2) DEFAULT 0.00');
    await addColumnIfNotExists('payroll', 'loan_deduction', 'DECIMAL(10,2) DEFAULT 0.00');
    await addColumnIfNotExists('payroll', 'pf_deduction', 'DECIMAL(10,2) DEFAULT 0.00');
    await addColumnIfNotExists('payroll', 'payment_status', "VARCHAR(20) DEFAULT 'paid'");
    await addColumnIfNotExists('payroll', 'paid_amount', 'DECIMAL(12,2) DEFAULT 0.00');
    await addColumnIfNotExists('payroll', 'due_amount', 'DECIMAL(12,2) DEFAULT 0.00');

    // Retroactive column additions to returns table
    await addColumnIfNotExists('returns', 'courier_charge', 'DECIMAL(10,2) DEFAULT 0.00');
    await addColumnIfNotExists('returns', 'return_delivery_loss', 'DECIMAL(10,2) DEFAULT 0.00');

    // 22. Reseller Parcels System Tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS reseller_sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        reseller_name VARCHAR(255) NOT NULL,
        customer_name VARCHAR(255) NULL,
        customer_phone VARCHAR(50) NULL,
        invoice_no VARCHAR(100) NOT NULL,
        total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        total_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        gross_profit DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        delivery_fee_charged DECIMAL(10,2) DEFAULT 0.00,
        courier_actual_cost DECIMAL(10,2) DEFAULT 0.00,
        delivery_profit DECIMAL(10,2) DEFAULT 0.00,
        payment_status VARCHAR(50) DEFAULT 'paid',
        account_id INT DEFAULT NULL,
        sale_date DATETIME NULL,
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rs_tenant (tenant_id),
        INDEX idx_rs_reseller (reseller_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS reseller_sale_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        reseller_sale_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        total_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        item_profit DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        INDEX idx_rsi_tenant (tenant_id),
        INDEX idx_rsi_sale (reseller_sale_id),
        INDEX idx_rsi_prod (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS reseller_returns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        reseller_name VARCHAR(255) NULL,
        invoice_no VARCHAR(100) NULL,
        courier_name VARCHAR(100) NULL,
        courier_charge DECIMAL(10,2) DEFAULT 0.00,
        return_delivery_loss DECIMAL(10,2) DEFAULT 0.00,
        return_date DATETIME NULL,
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rr_tenant (tenant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS reseller_return_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        reseller_return_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        restock_condition VARCHAR(100) DEFAULT 'good_restockable',
        INDEX idx_rri_tenant (tenant_id),
        INDEX idx_rri_ret (reseller_return_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Retroactive column additions to reseller returns & employees tables
    await addColumnIfNotExists('reseller_returns', 'returned_profit_reversal', 'DECIMAL(12,2) DEFAULT 0.00');
    await addColumnIfNotExists('reseller_return_items', 'unit_price', 'DECIMAL(10,2) DEFAULT 0.00');
    await addColumnIfNotExists('reseller_return_items', 'unit_cost', 'DECIMAL(10,2) DEFAULT 0.00');
    await addColumnIfNotExists('reseller_return_items', 'returned_profit_reversal', 'DECIMAL(12,2) DEFAULT 0.00');
    await addColumnIfNotExists('employees', 'nid_front_url', 'TEXT DEFAULT NULL');
    await addColumnIfNotExists('employees', 'nid_back_url', 'TEXT DEFAULT NULL');
    await addColumnIfNotExists('employees', 'documents_url', 'TEXT DEFAULT NULL');
    await addColumnIfNotExists('employee_loans', 'type', "VARCHAR(20) DEFAULT 'loan'");
    await addColumnIfNotExists('employee_loans', 'auto_deduct_salary', 'TINYINT(1) DEFAULT 1');

    // Retroactive column type expansion for liabilities & receivables status & party_type column to prevent data truncation
    try {
      await db.query("ALTER TABLE liabilities MODIFY COLUMN status VARCHAR(50) DEFAULT 'pending'");
      await db.query("ALTER TABLE receivables MODIFY COLUMN status VARCHAR(50) DEFAULT 'pending'");
      await db.query("ALTER TABLE liabilities MODIFY COLUMN party_type VARCHAR(100) DEFAULT 'supplier'");
      await db.query("ALTER TABLE receivables MODIFY COLUMN party_type VARCHAR(100) DEFAULT 'customer'");
      await db.query("ALTER TABLE expenses MODIFY COLUMN title VARCHAR(255) DEFAULT 'General Expense'");
    } catch (e) {
      console.warn('Column expansion note:', e.message);
    }

    // Retroactive fix: Auto-insert missing cancellation log for past deleted purchases like #PUR-20260802-516
    try {
      const [accs] = await db.query("SELECT id, tenant_id FROM finance_accounts WHERE name LIKE '%UCB%' LIMIT 1");
      if (accs.length > 0) {
        const ucbId = accs[0].id;
        const tenantId = accs[0].tenant_id;
        await db.query(
          `INSERT INTO account_transactions (tenant_id, account_id, type, debit, credit, reference_no, notes, transaction_date)
           SELECT ?, ?, 'Purchase Order Cancelled', 0.00, 19000.00, 'PUR-20260802-516', 
                  'Reverted payment due to deletion of Purchase Order #PUR-20260802-516 (Supplier: Abdulla)', NOW()
           WHERE NOT EXISTS (
             SELECT 1 FROM account_transactions WHERE reference_no = 'PUR-20260802-516'
           )`,
          [tenantId, ucbId]
        );
      }
    } catch (e) {
      console.warn('Retroactive purchase cancellation log check:', e.message);
    }

    // Retroactive fix: Merge duplicate investor profile rows into 1 single investor row
    try {
      const [dupRows] = await db.query(`
        SELECT tenant_id, LOWER(TRIM(investor_name)) as inv_name, COUNT(*) as cnt 
        FROM investments 
        GROUP BY tenant_id, LOWER(TRIM(investor_name)) 
        HAVING cnt > 1
      `);
      for (const r of dupRows) {
        const [allInvs] = await db.query(
          `SELECT * FROM investments WHERE tenant_id = ? AND LOWER(TRIM(investor_name)) = ? ORDER BY id ASC`,
          [r.tenant_id, r.inv_name]
        );
        if (allInvs.length > 1) {
          const primary = allInvs[0];
          const duplicates = allInvs.slice(1);
          const totalInv = allInvs.reduce((sum, i) => sum + Number(i.invested_amount || 0), 0);
          const totalRet = allInvs.reduce((sum, i) => sum + Number(i.returned_amount || 0), 0);
          const status = (totalInv - totalRet) <= 0 ? 'returned' : 'active';

          await db.query(
            `UPDATE investments SET invested_amount = ?, returned_amount = ?, status = ? WHERE id = ?`,
            [totalInv, totalRet, status, primary.id]
          );

          const dupIds = duplicates.map(i => i.id);
          if (dupIds.length > 0) {
            await db.query(`UPDATE investment_transactions SET investment_id = ? WHERE investment_id IN (?)`, [primary.id, dupIds]);
            await db.query(`DELETE FROM investments WHERE id IN (?)`, [dupIds]);
          }
        }
      }
    } catch (e) {
      console.warn('Investor deduplication check:', e.message);
    }

    console.log('✅ Database schema auto-migration complete! All missing tables created.');
  } catch (err) {
    console.error('⚠️ DB Auto-migration failed:', err.message);
  }
}

module.exports = autoMigrate;
