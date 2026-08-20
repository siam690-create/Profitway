const { execSync } = require('child_process');
const db = require('./config/db');

async function run() {
  console.log('=== Starting Reseller Sales Binlog Recovery ===');
  try {
    const raw = execSync('mysqlbinlog -v --base64-output=DECODE-ROWS /var/lib/mysql/binlog.0000* | grep -E -A 32 "INSERT INTO.*reseller_sales"', { maxBuffer: 100 * 1024 * 1024 }).toString();
    console.log(`Found raw binlog text length: ${raw.length}`);
    
    // Parse binlog rows
    const blocks = raw.split(/### INSERT INTO `profitway_db`\.`reseller_sales`/);
    console.log(`Parsed blocks count: ${blocks.length}`);
    
    for (let i = 1; i < blocks.length; i++) {
      const b = blocks[i];
      console.log(`\n--- Block ${i} ---`);
      console.log(b.substring(0, 1000));
    }
  } catch (err) {
    console.error('Recovery error:', err);
  } finally {
    process.exit(0);
  }
}

run();
