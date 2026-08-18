const db = require('./config/db');

(async () => {
  try {
    console.log('Fixing account_transactions with 00:00:00 timestamps...');
    const [result] = await db.query(`
      UPDATE account_transactions 
      SET transaction_date = NOW() 
      WHERE TIME(transaction_date) = '00:00:00' 
        AND DATE(transaction_date) = CURDATE()
    `);
    console.log('Updated rows:', result.affectedRows);
  } catch (err) {
    console.error('Error updating transactions:', err);
  } finally {
    process.exit(0);
  }
})();
