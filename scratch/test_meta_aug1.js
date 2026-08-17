const db = require('../backend/config/db');

async function testMetaAug1() {
  try {
    const [rows] = await db.query('SELECT * FROM ad_accounts WHERE account_name LIKE "%Pothoma%"');
    if (rows.length === 0) {
      console.log('No Pothoma account found');
      process.exit(1);
    }

    const acc = rows[0];
    console.log('Account found:', acc.account_name, 'ID:', acc.meta_account_id, 'Token:', acc.access_token ? acc.access_token.slice(0, 15) + '...' : 'NONE');

    const rawId = (acc.meta_account_id || acc.account_id_code).trim();
    const actId = rawId.startsWith('act_') ? rawId : `act_${rawId}`;
    const date = '2026-08-01';

    const dateParam = `time_range=${encodeURIComponent(JSON.stringify({ since: date, until: date }))}`;
    const url = `https://graph.facebook.com/v19.0/${actId}/insights?level=campaign&fields=campaign_id,campaign_name,spend,impressions,clicks&limit=500&${dateParam}&access_token=${encodeURIComponent(acc.access_token.trim())}`;

    console.log('Fetching URL:', url.replace(acc.access_token.trim(), 'TOKEN_HIDDEN'));

    const res = await fetch(url);
    const data = await res.json();

    console.log('Meta API Response:', JSON.stringify(data, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testMetaAug1();
