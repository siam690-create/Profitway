const db = require('../config/db');
const mailer = require('../utils/mailer');

// Super Admin Overview
exports.getSuperAdminDashboard = async (req, res) => {
  try {
    const [tenantCounts] = await db.query(`
      SELECT 
        COUNT(id) AS total_tenants,
        SUM(CASE WHEN subscription_status = 'active' THEN 1 ELSE 0 END) AS active_subscriptions,
        SUM(CASE WHEN subscription_status = 'trial' THEN 1 ELSE 0 END) AS trial_tenants,
        SUM(CASE WHEN subscription_status = 'pending_approval' THEN 1 ELSE 0 END) AS pending_tenants,
        SUM(CASE WHEN subscription_status = 'suspended' THEN 1 ELSE 0 END) AS suspended_tenants
      FROM tenants
    `);

    // Calculate Estimated MRR based on active plans
    const [mrrRow] = await db.query(`
      SELECT COALESCE(SUM(p.price_monthly), 0) AS estimated_mrr
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.status = 'active' AND s.billing_cycle = 'monthly'
    `);

    const [latestShops] = await db.query(`
      SELECT t.*, 
        (SELECT COUNT(id) FROM products WHERE tenant_id = t.id) AS total_products,
        (SELECT COUNT(id) FROM sales WHERE tenant_id = t.id) AS total_sales
      FROM tenants t
      ORDER BY t.id DESC LIMIT 10
    `);

    const [plans] = await db.query('SELECT * FROM plans');

    res.json({
      metrics: {
        total_tenants: tenantCounts[0].total_tenants,
        active_subscriptions: tenantCounts[0].active_subscriptions || 0,
        trial_tenants: tenantCounts[0].trial_tenants || 0,
        pending_tenants: tenantCounts[0].pending_tenants || 0,
        suspended_tenants: tenantCounts[0].suspended_tenants || 0,
        estimated_mrr: Number(mrrRow[0].estimated_mrr || 0)
      },
      latest_shops: latestShops,
      plans
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// List all tenants
exports.getTenants = async (req, res) => {
  try {
    const [shops] = await db.query(`
      SELECT t.*, u.name AS owner_user_name,
        (SELECT COUNT(id) FROM products WHERE tenant_id = t.id) AS product_count,
        (SELECT COUNT(id) FROM sales WHERE tenant_id = t.id) AS sales_count
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'owner'
      ORDER BY t.id DESC
    `);
    res.json(shops);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Tenant Subscription Status, Master Shop Name & Unique Shop Code (SUPER ADMIN ONLY)
exports.updateTenantSubscription = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    const { subscription_status, extend_days, shop_name, shop_code } = req.body;

    const [tenantRows] = await db.query('SELECT * FROM tenants WHERE id = ?', [tenant_id]);
    if (tenantRows.length === 0) {
      return res.status(404).json({ error: 'Tenant shop not found.' });
    }
    const tenant = tenantRows[0];

    if (subscription_status) {
      // If approving a pending account, reset trial ends at to 14 days from now
      if (tenant.subscription_status === 'pending_approval' && (subscription_status === 'trial' || subscription_status === 'active')) {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);
        await db.query('UPDATE tenants SET subscription_status = ?, trial_ends_at = ? WHERE id = ?', [subscription_status, trialEndsAt, tenant_id]);
      } else {
        await db.query('UPDATE tenants SET subscription_status = ? WHERE id = ?', [subscription_status, tenant_id]);
      }

      // Send status update notification email to shop owner
      try {
        await mailer.sendMail({
          to: tenant.email,
          subject: `🎉 Profitway Shop Account Approved: ${tenant.shop_name} [${tenant.shop_code}]`,
          text: `Hello ${tenant.owner_name},\n\nGreat news! Your shop account "${tenant.shop_name}" (${tenant.shop_code}) has been APPROVED by Super Admin!\n\nStatus: ${subscription_status.toUpperCase()}\n\nYou can now log in to your dashboard at https://profitway.bd and start managing your inventory and sales.\n\nThank you,\nProfitway Support Team`
        });
      } catch (e) {
        console.error('Email error:', e.message);
      }
    }

    if (shop_name) {
      await db.query('UPDATE tenants SET shop_name = ? WHERE id = ?', [shop_name, tenant_id]);
    }

    if (shop_code) {
      await db.query('UPDATE tenants SET shop_code = ? WHERE id = ?', [shop_code, tenant_id]);
    }

    if (extend_days && !isNaN(extend_days)) {
      await db.query(
        'UPDATE tenants SET trial_ends_at = DATE_ADD(trial_ends_at, INTERVAL ? DAY) WHERE id = ?',
        [Number(extend_days), tenant_id]
      );
    }

    res.json({ message: 'Tenant updated successfully by Super Admin' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
