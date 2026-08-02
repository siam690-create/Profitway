const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./config/db');

async function fixUtf8mb4Charset() {
  try {
    console.log('🚀 Converting Database & Tables to full UTF8MB4 (Bangla & Emoji support)...');

    const dbName = process.env.DB_NAME || 'profitway_db';

    // 1. Convert Database Character Set
    await db.query(`ALTER DATABASE \`${dbName}\` CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;`);
    console.log(`✅ Converted Database \`${dbName}\` to utf8mb4_unicode_ci.`);

    // 2. Convert Key Tables
    const tables = ['products', 'categories', 'sales', 'sale_items', 'tenants', 'users', 'expenses', 'store_api_keys'];
    for (const table of tables) {
      try {
        await db.query(`ALTER TABLE \`${table}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        console.log(`✅ Converted table \`${table}\` to utf8mb4_unicode_ci.`);
      } catch (err) {
        console.log(`ℹ️ Table \`${table}\` skipped or notice: ${err.message}`);
      }
    }

    console.log('🎉 Full Bangla & Emoji UTF8MB4 support enabled successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration Error:', err);
    process.exit(1);
  }
}

fixUtf8mb4Charset();
