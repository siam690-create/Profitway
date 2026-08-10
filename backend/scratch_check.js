const db = require('./config/db');

(async () => {
  try {
    const [cols] = await db.query('SHOW COLUMNS FROM sales');
    console.log('SALES TABLE COLUMNS:', cols.map(c => c.Field));
    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
