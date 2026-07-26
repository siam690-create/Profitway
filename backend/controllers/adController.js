const db = require('../config/db');

// Record a new Paid Ad Expense (USD & BDT Conversion)
exports.createAd = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const tenantId = req.user.tenantId;
    const { product_id, platform, amount_usd, exchange_rate, ad_date, notes } = req.body;

    if (!amount_usd || Number(amount_usd) <= 0) {
      return res.status(400).json({ error: 'Please enter a valid USD ad cost amount.' });
    }

    const usdVal = Number(amount_usd);
    const rateVal = Number(exchange_rate || 120.00);
    const totalBdtCost = Number((usdVal * rateVal).toFixed(2));
    const selectedAdDate = ad_date || new Date().toISOString().slice(0, 10);

    let productName = 'General Shop Campaign';

    if (product_id) {
      const [prodRows] = await connection.query(
        'SELECT name FROM products WHERE id = ? AND tenant_id = ?',
        [product_id, tenantId]
      );
      if (prodRows.length > 0) {
        productName = prodRows[0].name;
      }
    }

    await connection.beginTransaction();

    // 1. Insert Paid Ad Log Record
    const [adResult] = await connection.query(
      `INSERT INTO paid_ads (tenant_id, product_id, product_name, platform, amount_usd, exchange_rate, total_bdt_cost, ad_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        product_id || null,
        productName,
        platform || 'Facebook Ads',
        usdVal,
        rateVal,
        totalBdtCost,
        selectedAdDate,
        notes || null
      ]
    );

    const ad_id = adResult.insertId;

    // 2. Automatically log an Operating Expense entry under "Marketing" category
    await connection.query(
      `INSERT INTO expenses (tenant_id, title, category, amount, expense_date, notes)
       VALUES (?, ?, 'Marketing', ?, ?, ?)`,
      [
        tenantId,
        `Paid Ad (${platform || 'Meta Ads'}) - ${productName}`,
        totalBdtCost,
        selectedAdDate,
        `Ad Spend: $${usdVal.toFixed(2)} @ ${rateVal} BDT/$ (Ad ID: #${ad_id}) ${notes ? `- ${notes}` : ''}`
      ]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Paid Ad expense logged successfully and synced with operating expenses.',
      ad: {
        id: ad_id,
        product_id,
        product_name: productName,
        platform: platform || 'Facebook Ads',
        amount_usd: usdVal,
        exchange_rate: rateVal,
        total_bdt_cost: totalBdtCost,
        ad_date: selectedAdDate,
        notes
      }
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
    const [ads] = await db.query(
      'SELECT * FROM paid_ads WHERE tenant_id = ? ORDER BY ad_date DESC, id DESC LIMIT 100',
      [tenantId]
    );
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
