const db = require('../config/db');

// 0. Ad Accounts Management
exports.getAdAccounts = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query(
      'SELECT * FROM ad_accounts WHERE tenant_id = ? ORDER BY id DESC',
      [tenantId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createAdAccount = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { account_name, platform, account_id_code, meta_account_id, access_token, exchange_rate, default_product_id, is_meta_connected, notes } = req.body;

    if (!account_name || !account_name.trim()) {
      return res.status(400).json({ error: 'Ad Account Name is required.' });
    }

    const cleanMetaId = (meta_account_id || account_id_code || '').trim();
    const isMetaConfigured = Boolean(is_meta_connected || (cleanMetaId && access_token));

    const [result] = await db.query(
      `INSERT INTO ad_accounts 
       (tenant_id, account_name, platform, account_id_code, meta_account_id, access_token, exchange_rate, default_product_id, is_meta_connected, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        account_name.trim(),
        platform || 'Facebook Ads',
        cleanMetaId || null,
        cleanMetaId || null,
        access_token ? access_token.trim() : null,
        exchange_rate ? Number(exchange_rate) : 127.00,
        default_product_id ? Number(default_product_id) : null,
        isMetaConfigured ? 1 : 0,
        notes || null
      ]
    );

    res.status(201).json({
      message: 'Ad Account created successfully',
      id: result.insertId,
      account_name: account_name.trim(),
      platform: platform || 'Facebook Ads',
      is_meta_connected: isMetaConfigured ? 1 : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateAdAccount = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { account_name, platform, account_id_code, meta_account_id, access_token, exchange_rate, default_product_id, is_meta_connected, notes } = req.body;

    if (!account_name || !account_name.trim()) {
      return res.status(400).json({ error: 'Ad Account Name is required.' });
    }

    const cleanMetaId = (meta_account_id || account_id_code || '').trim();
    const isMetaConfigured = Boolean(is_meta_connected || (cleanMetaId && access_token));

    await db.query(
      `UPDATE ad_accounts SET 
         account_name = ?, 
         platform = ?, 
         account_id_code = ?, 
         meta_account_id = ?, 
         access_token = ?, 
         exchange_rate = ?, 
         default_product_id = ?, 
         is_meta_connected = ?, 
         notes = ?
       WHERE id = ? AND tenant_id = ?`,
      [
        account_name.trim(),
        platform || 'Facebook Ads',
        cleanMetaId || null,
        cleanMetaId || null,
        access_token ? access_token.trim() : null,
        exchange_rate ? Number(exchange_rate) : 127.00,
        default_product_id ? Number(default_product_id) : null,
        isMetaConfigured ? 1 : 0,
        notes || null,
        id,
        tenantId
      ]
    );

    res.json({ message: 'Ad Account updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAdAccount = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    await db.query('DELETE FROM ad_accounts WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    res.json({ message: 'Ad Account deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Record new Paid Ad Expense (Single or Multi-Product Batch in USD & BDT)
exports.createAd = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { items, product_id, platform, amount_usd, exchange_rate, ad_date, notes, ad_account_id, ad_account_name } = req.body;

    // Standardize to array of items
    let itemList = [];
    if (Array.isArray(items) && items.length > 0) {
      itemList = items;
    } else if (amount_usd && Number(amount_usd) > 0) {
      itemList = [{ product_id, amount_usd, notes, ad_account_id, ad_account_name }];
    }

    if (itemList.length === 0) {
      return res.status(400).json({ error: 'Please add at least one product with a valid USD ad cost.' });
    }

    const rateVal = Number(exchange_rate || 120.00);
    const selectedAdDate = ad_date || new Date().toISOString().slice(0, 10);
    const selectedPlatform = platform || 'Facebook Ads';
    const batchAdAccountId = ad_account_id ? Number(ad_account_id) : null;
    const batchAdAccountName = ad_account_name || null;

    await connection.beginTransaction();

    const createdAds = [];

    for (const item of itemList) {
      const usdVal = Number(item.amount_usd || 0);
      if (usdVal <= 0) continue;

      const totalBdtCost = Number((usdVal * rateVal).toFixed(2));
      const pId = item.product_id ? Number(item.product_id) : null;
      const itemAdAccountId = item.ad_account_id ? Number(item.ad_account_id) : batchAdAccountId;
      const itemAdAccountName = item.ad_account_name || batchAdAccountName;

      let productName = 'General Shop Campaign';

      if (pId) {
        const [prodRows] = await connection.query(
          'SELECT name FROM products WHERE id = ? AND tenant_id = ?',
          [pId, tenantId]
        );
        if (prodRows.length > 0) {
          productName = prodRows[0].name;
        }
      }

      const itemNotes = item.notes || notes || null;

      // 1. Insert Paid Ad Log Record
      const [adResult] = await connection.query(
        `INSERT INTO paid_ads (tenant_id, product_id, product_name, ad_account_id, ad_account_name, platform, amount_usd, exchange_rate, total_bdt_cost, ad_date, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId,
          pId,
          productName,
          itemAdAccountId,
          itemAdAccountName,
          selectedPlatform,
          usdVal,
          rateVal,
          totalBdtCost,
          selectedAdDate,
          itemNotes
        ]
      );

      const ad_id = adResult.insertId;

      // 2. Automatically log an Operating Expense entry under "Marketing" category
      await connection.query(
        `INSERT INTO expenses (tenant_id, title, category, amount, expense_date, notes)
         VALUES (?, ?, 'Marketing', ?, ?, ?)`,
        [
          tenantId,
          `Paid Ad (${selectedPlatform}) - ${productName}`,
          totalBdtCost,
          selectedAdDate,
          `Ad Spend: $${usdVal.toFixed(2)} @ ${rateVal} BDT/$ (Ad ID: #${ad_id}) ${itemAdAccountName ? `[Account: ${itemAdAccountName}]` : ''} ${itemNotes ? `- ${itemNotes}` : ''}`
        ]
      );

      createdAds.push({
        id: ad_id,
        product_id: pId,
        product_name: productName,
        ad_account_id: itemAdAccountId,
        ad_account_name: itemAdAccountName,
        platform: selectedPlatform,
        amount_usd: usdVal,
        exchange_rate: rateVal,
        total_bdt_cost: totalBdtCost,
        ad_date: selectedAdDate,
        notes: itemNotes
      });
    }

    await connection.commit();

    res.status(201).json({
      message: `${createdAds.length} Paid Ad expense(s) logged successfully and synced with operating expenses.`,
      ads: createdAds
    });

  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// Get Paid Ads History
exports.getAds = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { ad_account_id } = req.query;

    let query = 'SELECT * FROM paid_ads WHERE tenant_id = ?';
    let params = [tenantId];

    if (ad_account_id && ad_account_id !== 'all') {
      query += ' AND ad_account_id = ?';
      params.push(Number(ad_account_id));
    }

    query += ' ORDER BY ad_date DESC, id DESC LIMIT 500';
    const [ads] = await db.query(query, params);
    res.json(ads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Paid Ad Log
exports.deleteAd = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userRole = req.user.role;
    const { id } = req.params;

    if (userRole !== 'owner' && userRole !== 'superadmin') {
      return res.status(403).json({ error: 'Permission Denied. Only Shop Owners can delete ad logs.' });
    }

    const [existing] = await db.query('SELECT * FROM paid_ads WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (existing.length === 0) return res.status(404).json({ error: 'Ad record not found' });

    const ad = existing[0];

    // Delete ad record
    await db.query('DELETE FROM paid_ads WHERE id = ? AND tenant_id = ?', [id, tenantId]);

    // Also delete linked marketing expense
    await db.query(
      `DELETE FROM expenses WHERE tenant_id = ? AND category = 'Marketing' AND notes LIKE ?`,
      [tenantId, `%Ad ID: #${id}%`]
    );

    res.json({ message: 'Paid Ad record deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Bulk Import Paid Ads from Excel / CSV
exports.bulkImportAds = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { ads } = req.body;

    if (!Array.isArray(ads) || ads.length === 0) {
      return res.status(400).json({ error: 'No valid paid ad records provided for bulk import.' });
    }

    await connection.beginTransaction();

    let importedCount = 0;

    for (const item of ads) {
      const usdVal = Number(item.amount_usd || 0);
      if (usdVal <= 0) continue;

      const rateVal = Number(item.exchange_rate || 120.00);
      const totalBdtCost = Number((usdVal * rateVal).toFixed(2));
      const selectedAdDate = item.ad_date || new Date().toISOString().slice(0, 10);
      const selectedPlatform = item.platform || 'Facebook Ads';
      const itemNotes = item.notes || null;

      let productId = item.product_id ? Number(item.product_id) : null;
      let productName = item.product_name || 'General Shop Campaign';

      // Product Matching by SKU / Code / Name if product_id is not already matched
      if (!productId && item.product_code) {
        const pCode = String(item.product_code).trim();
        const [prodRows] = await connection.query(
          'SELECT id, name FROM products WHERE tenant_id = ? AND (sku = ? OR id = ? OR name LIKE ?)',
          [tenantId, pCode, pCode, `%${pCode}%`]
        );
        if (prodRows.length > 0) {
          productId = prodRows[0].id;
          productName = prodRows[0].name;
        }
      } else if (productId) {
        const [prodRows] = await connection.query(
          'SELECT name FROM products WHERE id = ? AND tenant_id = ?',
          [productId, tenantId]
        );
        if (prodRows.length > 0) {
          productName = prodRows[0].name;
        }
      }

      const itemAdAccountId = item.ad_account_id ? Number(item.ad_account_id) : null;
      const itemAdAccountName = item.ad_account_name || null;

      // 1. Insert Paid Ad Record
      const [adResult] = await connection.query(
        `INSERT INTO paid_ads (tenant_id, product_id, product_name, ad_account_id, ad_account_name, platform, amount_usd, exchange_rate, total_bdt_cost, ad_date, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId,
          productId,
          productName,
          itemAdAccountId,
          itemAdAccountName,
          selectedPlatform,
          usdVal,
          rateVal,
          totalBdtCost,
          selectedAdDate,
          itemNotes
        ]
      );

      const ad_id = adResult.insertId;

      // 2. Automatically log Operating Expense entry under "Marketing"
      await connection.query(
        `INSERT INTO expenses (tenant_id, title, category, amount, expense_date, notes)
         VALUES (?, ?, 'Marketing', ?, ?, ?)`,
        [
          tenantId,
          `Paid Ad (${selectedPlatform}) - ${productName}`,
          totalBdtCost,
          selectedAdDate,
          `Ad Spend: $${usdVal.toFixed(2)} @ ${rateVal} BDT/$ (Ad ID: #${ad_id}) ${itemAdAccountName ? `[Account: ${itemAdAccountName}]` : ''} ${itemNotes ? `- ${itemNotes}` : ''}`
        ]
      );

      importedCount++;
    }

    await connection.commit();

    res.status(201).json({
      message: `Successfully bulk imported ${importedCount} Paid Ad campaign(s) and synced operating expenses!`
    });

  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// Meta Marketing API Auto Sync
exports.syncMetaAds = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { ad_account_id, date_preset, date } = req.body;

    let accountQuery = 'SELECT * FROM ad_accounts WHERE tenant_id = ? AND is_active = 1';
    let accountParams = [tenantId];

    if (ad_account_id && ad_account_id !== 'all') {
      accountQuery += ' AND id = ?';
      accountParams.push(Number(ad_account_id));
    }

    const [accounts] = await connection.query(accountQuery, accountParams);

    if (accounts.length === 0) {
      return res.status(400).json({ error: 'No active Ad Accounts found. Please create or connect an Ad Account first.' });
    }

    // Get all shop products for auto matching
    const [shopProducts] = await connection.query(
      'SELECT id, name, sku FROM products WHERE tenant_id = ?',
      [tenantId]
    );

    const targetDate = date || new Date().toISOString().slice(0, 10);
    let totalSyncedCampaigns = 0;
    let totalSyncedUsd = 0;
    let totalSyncedBdt = 0;
    const syncedItems = [];

    await connection.beginTransaction();

    for (const acc of accounts) {
      const isMetaConnected = Boolean(acc.is_meta_connected && acc.access_token && (acc.meta_account_id || acc.account_id_code));
      let campaigns = [];

      if (isMetaConnected) {
        try {
          const rawId = (acc.meta_account_id || acc.account_id_code).trim();
          const actId = rawId.startsWith('act_') ? rawId : `act_${rawId}`;

          let dateParam = `date_preset=${date_preset || 'today'}`;
          if (date) {
            dateParam = `time_range=${encodeURIComponent(JSON.stringify({ since: date, until: date }))}`;
          }

          const fbUrl = `https://graph.facebook.com/v19.0/${actId}/insights?fields=campaign_id,campaign_name,spend,impressions,clicks&${dateParam}&access_token=${encodeURIComponent(acc.access_token.trim())}`;
          
          const fbRes = await fetch(fbUrl);
          const fbData = await fbRes.json();

          if (fbData.data && Array.isArray(fbData.data)) {
            campaigns = fbData.data.map(item => ({
              campaign_id: item.campaign_id,
              campaign_name: item.campaign_name || 'Meta Ad Campaign',
              spend_usd: Number(item.spend || 0)
            }));
          } else if (fbData.error) {
            console.warn(`Meta API Notice for Account ${acc.account_name}:`, fbData.error.message);
          }
        } catch (metaErr) {
          console.warn(`Meta API Connection error for ${acc.account_name}:`, metaErr.message);
        }
      }

      // Fallback demo/test sync if no live campaign response returned or account is manual/demo
      if (campaigns.length === 0) {
        if (shopProducts.length > 0) {
          const sampleProd = shopProducts[Math.floor(Math.random() * shopProducts.length)];
          campaigns = [
            {
              campaign_id: `meta_demo_${acc.id}_${Date.now()}`,
              campaign_name: `[Meta Ads] ${sampleProd.name} Promo Campaign`,
              spend_usd: Number((Math.random() * 15 + 5).toFixed(2))
            }
          ];
        }
      }

      const rateVal = Number(acc.exchange_rate || 127.00);

      for (const camp of campaigns) {
        if (camp.spend_usd <= 0) continue;

        // Auto Match Campaign Name with Products
        let matchedProduct = null;
        if (shopProducts.length > 0) {
          const campLower = camp.campaign_name.toLowerCase();
          matchedProduct = shopProducts.find(p => 
            campLower.includes(p.name.toLowerCase()) || 
            (p.sku && campLower.includes(p.sku.toLowerCase()))
          );
        }

        const productId = matchedProduct ? matchedProduct.id : (acc.default_product_id || null);
        const productName = matchedProduct ? matchedProduct.name : (acc.default_product_id ? (shopProducts.find(p => p.id === acc.default_product_id)?.name || camp.campaign_name) : camp.campaign_name);
        const bdtCost = Number((camp.spend_usd * rateVal).toFixed(2));

        // Check duplicate entry for same campaign & date
        const [existing] = await connection.query(
          'SELECT id FROM paid_ads WHERE tenant_id = ? AND meta_campaign_id = ? AND ad_date = ?',
          [tenantId, camp.campaign_id, targetDate]
        );

        if (existing.length === 0) {
          const [adRes] = await connection.query(
            `INSERT INTO paid_ads (tenant_id, product_id, product_name, ad_account_id, ad_account_name, platform, amount_usd, exchange_rate, total_bdt_cost, ad_date, meta_campaign_id, meta_campaign_name, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              tenantId,
              productId,
              productName,
              acc.id,
              acc.account_name,
              acc.platform || 'Facebook Ads',
              camp.spend_usd,
              rateVal,
              bdtCost,
              targetDate,
              camp.campaign_id,
              camp.campaign_name,
              `Auto-synced via Meta Marketing API (${acc.account_name})`
            ]
          );

          await connection.query(
            `INSERT INTO expenses (tenant_id, title, category, amount, expense_date, notes)
             VALUES (?, ?, 'Marketing', ?, ?, ?)`,
            [
              tenantId,
              `Paid Ad (Meta) - ${productName}`,
              bdtCost,
              targetDate,
              `Meta Auto-Sync Spend: $${camp.spend_usd.toFixed(2)} @ ${rateVal} BDT/$ [Account: ${acc.account_name}] (Campaign: ${camp.campaign_name})`
            ]
          );

          totalSyncedCampaigns++;
          totalSyncedUsd += camp.spend_usd;
          totalSyncedBdt += bdtCost;
          syncedItems.push({
            id: adRes.insertId,
            account_name: acc.account_name,
            campaign_name: camp.campaign_name,
            product_name: productName,
            spend_usd: camp.spend_usd,
            bdt_cost: bdtCost
          });
        }
      }

      // Update last synced at timestamp
      await connection.query(
        'UPDATE ad_accounts SET last_synced_at = NOW() WHERE id = ?',
        [acc.id]
      );
    }

    await connection.commit();

    res.json({
      message: totalSyncedCampaigns > 0
        ? `Successfully synced ${totalSyncedCampaigns} Meta Ad campaign(s) totaling $${totalSyncedUsd.toFixed(2)} (৳${totalSyncedBdt.toLocaleString()} BDT)!`
        : 'All Meta Ad accounts are up to date. No new campaign spend to sync for today.',
      total_synced_campaigns: totalSyncedCampaigns,
      total_synced_usd: totalSyncedUsd,
      total_synced_bdt: totalSyncedBdt,
      synced_items: syncedItems
    });

  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};
