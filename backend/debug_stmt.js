const db = require('./config/db');

async function testStmt() {
  const id = 1;
  const tenantId = 1;

  try {
    const [purchases] = await db.query(
      `SELECT 'Stock Purchase' as type, paid_amount as debit, 0 as credit, CONCAT('Purchase Order #', purchase_no, ' (Supplier: ', supplier_name, ')') as notes, purchase_date as date
       FROM purchases WHERE account_id = ? AND tenant_id = ? AND paid_amount > 0`,
      [id, tenantId]
    );

    const [posSales] = await db.query(
      `SELECT 'POS Retail Sale' as type, 0 as debit, total_amount as credit, CONCAT('POS Checkout #', invoice_no, ' (Customer: ', customer_name, ')') as notes, created_at as date
       FROM sales WHERE account_id = ? AND tenant_id = ? AND total_amount > 0`,
      [id, tenantId]
    );

    const [wholesaleSales] = await db.query(
      `SELECT 'Wholesale Sale' as type, 0 as debit, paid_amount as credit, CONCAT('Wholesale Order #', invoice_no, ' (Buyer: ', customer_name, ')') as notes, sale_date as date
       FROM wholesale_sales WHERE account_id = ? AND tenant_id = ? AND paid_amount > 0`,
      [id, tenantId]
    );

    console.log('Purchases:', purchases.length);
    console.log('POS Sales:', posSales.length);
    console.log('Wholesale Sales:', wholesaleSales.length);

  } catch (err) {
    console.error('STMT Error:', err);
  }
  process.exit();
}

testStmt();
