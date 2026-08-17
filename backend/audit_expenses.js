require('dotenv').config();
const db = require('./config/db');

async function auditExpenses() {
  try {
    const [expRows] = await db.query(
      `SELECT category, SUM(amount) as total_amt, COUNT(*) as cnt 
       FROM expenses 
       GROUP BY category`
    );
    console.log('=== EXPENSES TABLE GROUP BY CATEGORY ===');
    console.table(expRows);

    const [transRows] = await db.query(
      `SELECT * FROM expenses WHERE category = 'Transport' ORDER BY id DESC LIMIT 10`
    );
    console.log('=== TRANSPORT EXPENSES LIST ===');
    console.table(transRows);

    const [retSummary] = await db.query(
      `SELECT COUNT(*) as ret_cnt, SUM(courier_charge) as total_courier_charge, SUM(return_delivery_loss) as total_delivery_loss FROM returns`
    );
    console.log('=== RETURNS TABLE SUMMARY ===');
    console.table(retSummary);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

auditExpenses();
