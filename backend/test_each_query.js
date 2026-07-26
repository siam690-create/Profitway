const db = require('./config/db');

async function testEach() {
  const id = 1;
  const tenantId = 1;

  try {
    console.log('1. Testing purchases...');
    await db.query(`SELECT 'Stock Purchase' as type, paid_amount as debit, 0 as credit, CONCAT('Purchase Order #', purchase_no, ' (Supplier: ', supplier_name, ')') as notes, purchase_date as date FROM purchases WHERE (account_id = ? OR account_id IS NULL) AND tenant_id = ? AND paid_amount > 0`, [id, tenantId]);
    console.log('1 OK');
  } catch(e) { console.error('1 ERR:', e.message); }

  try {
    console.log('2. Testing sales...');
    await db.query(`SELECT 'POS Retail Sale' as type, 0 as debit, total_amount as credit, CONCAT('POS Checkout #', invoice_no, ' (Customer: ', customer_name, ')') as notes, created_at as date FROM sales WHERE tenant_id = ? AND total_amount > 0`, [tenantId]);
    console.log('2 OK');
  } catch(e) { console.error('2 ERR:', e.message); }

  try {
    console.log('3. Testing wholesale_sales...');
    await db.query(`SELECT 'Wholesale Sale' as type, 0 as debit, paid_amount as credit, CONCAT('Wholesale Order #', invoice_no, ' (Buyer: ', customer_name, ')') as notes, sale_date as date FROM wholesale_sales WHERE (account_id = ? OR account_id IS NULL) AND tenant_id = ? AND paid_amount > 0`, [id, tenantId]);
    console.log('3 OK');
  } catch(e) { console.error('3 ERR:', e.message); }

  try {
    console.log('4. Testing liability_payments...');
    await db.query(`SELECT 'Dena Repayment' as type, lp.amount as debit, 0 as credit, CONCAT('Dena Repayment to ', l.party_name, ' (', l.title, ')') as notes, lp.payment_date as date FROM liability_payments lp JOIN liabilities l ON l.id = lp.liability_id WHERE lp.account_id = ? AND lp.tenant_id = ?`, [id, tenantId]);
    console.log('4 OK');
  } catch(e) { console.error('4 ERR:', e.message); }

  try {
    console.log('5. Testing receivable_collections...');
    await db.query(`SELECT 'Pawna Collection' as type, 0 as debit, rc.amount as credit, CONCAT('Pawna Collection from ', r.party_name, ' (', r.title, ')') as notes, rc.collection_date as date FROM receivable_collections rc JOIN receivables r ON r.id = rc.receivable_id WHERE rc.account_id = ? AND rc.tenant_id = ?`, [id, tenantId]);
    console.log('5 OK');
  } catch(e) { console.error('5 ERR:', e.message); }

  try {
    console.log('6. Testing payroll...');
    await db.query(`SELECT 'Staff Salary' as type, net_salary_paid as debit, 0 as credit, CONCAT('Salary Disbursal to ', staff_name, ' (', month_year, ')') as notes, payment_date as date FROM payroll WHERE account_id = ? AND tenant_id = ?`, [id, tenantId]);
    console.log('6 OK');
  } catch(e) { console.error('6 ERR:', e.message); }

  try {
    console.log('7. Testing investment_transactions...');
    await db.query(`SELECT CASE WHEN type = 'deposit' THEN 'Investor Capital Deposit' ELSE 'Investment Capital Return' END as type, CASE WHEN type = 'repayment' THEN amount ELSE 0 END as debit, CASE WHEN type = 'deposit' THEN amount ELSE 0 END as credit, CONCAT(CASE WHEN type = 'deposit' THEN 'Capital Raised from ' ELSE 'Capital Returned to ' END, i.investor_name) as notes, it.transaction_date as date FROM investment_transactions it JOIN investments i ON i.id = it.investment_id WHERE it.account_id = ? AND it.tenant_id = ?`, [id, tenantId]);
    console.log('7 OK');
  } catch(e) { console.error('7 ERR:', e.message); }

  process.exit();
}

testEach();
