const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./config/db');

async function fixTenantStatusCol() {
  try {
    await db.query("ALTER TABLE tenants MODIFY COLUMN subscription_status VARCHAR(50) DEFAULT 'pending_approval'");
    console.log('✅ Successfully updated tenants.subscription_status column type to VARCHAR(50).');
    process.exit(0);
  } catch (err) {
    console.error('Error altering tenants subscription_status:', err);
    process.exit(1);
  }
}

fixTenantStatusCol();
