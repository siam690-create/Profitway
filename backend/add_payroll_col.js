const db = require('./config/db');

async function run() {
  try {
    await db.query("ALTER TABLE payroll ADD COLUMN account_id INT DEFAULT NULL");
    console.log("Successfully added account_id column to payroll table!");
  } catch (err) {
    if (err.message.includes('Duplicate column')) {
      console.log("account_id column already exists in payroll table.");
    } else {
      console.error(err);
    }
  }
  process.exit();
}

run();
