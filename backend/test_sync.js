require('dotenv').config();
const db = require('./config/db');

async function testMetaSync() {
  try {
    const [accs] = await db.query('SELECT * FROM ad_accounts WHERE is_meta_connected = 1');
    console.log('Connected accounts count:', accs.length);

    for (const acc of accs) {
      console.log(`Account ${acc.id}: ${acc.account_name}, Meta ID: ${acc.meta_account_id || acc.account_id_code}`);
      const rawId = (acc.meta_account_id || acc.account_id_code).trim();
      const actId = rawId.startsWith('act_') ? rawId : `act_${rawId}`;
      const token = acc.access_token.trim();

      const timeRange = JSON.stringify({ since: '2026-08-10', until: '2026-08-10' });
      
      // Test format 1: time_range JSON string
      const url1 = `https://graph.facebook.com/v19.0/${actId}/insights?level=campaign&fields=campaign_id,campaign_name,spend,impressions,clicks&limit=500&time_range=${encodeURIComponent(timeRange)}&access_token=${encodeURIComponent(token)}`;
      console.log('Testing URL 1:', url1.replace(token, 'TOKEN'));
      const res1 = await fetch(url1);
      const data1 = await res1.json();
      console.log('Result 1 data count:', data1.data ? data1.data.length : 'NO DATA');
      if (data1.error) console.log('Result 1 Error:', data1.error);

      // Test format 2: time_range[since]=2026-08-10&time_range[until]=2026-08-10
      const url2 = `https://graph.facebook.com/v19.0/${actId}/insights?level=campaign&fields=campaign_id,campaign_name,spend,impressions,clicks&limit=500&time_range[since]=2026-08-10&time_range[until]=2026-08-10&access_token=${encodeURIComponent(token)}`;
      console.log('Testing URL 2:', url2.replace(token, 'TOKEN'));
      const res2 = await fetch(url2);
      const data2 = await res2.json();
      console.log('Result 2 data count:', data2.data ? data2.data.length : 'NO DATA');
      if (data2.error) console.log('Result 2 Error:', data2.error);
      if (data2.data) {
        const totalSpend = data2.data.reduce((sum, i) => sum + Number(i.spend || 0), 0);
        console.log('Result 2 Total Spend USD:', totalSpend);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Test script error:', err);
    process.exit(1);
  }
}

testMetaSync();
