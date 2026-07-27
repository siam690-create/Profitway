const db = require('./backend/config/db');

async function run() {
  const [plans] = await db.query('SELECT * FROM plans');
  console.log('Plans:', plans);

  const [subscriptions] = await db.query('SELECT * FROM subscriptions');
  console.log('Subscriptions:', subscriptions);

  process.exit();
}
run();
