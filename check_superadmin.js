const db = require('./backend/config/db');

async function run() {
  const [users] = await db.query("SELECT id, name, email, role FROM users WHERE role = 'superadmin'");
  console.log('Superadmin users:', users);
  process.exit();
}
run();
