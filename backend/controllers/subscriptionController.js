const db = require('../config/db');

exports.getMySubscription = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    // Fetch tenant details
    const [tenants] = await db.query('SELECT * FROM tenants WHERE id = ?', [tenantId]);
    if (tenants.length === 0) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }

    const tenant = tenants[0];

    // Fetch current active subscription if any
    const [subRows] = await db.query(
      `SELECT s.*, p.name AS plan_name, p.code AS plan_code, p.price_monthly, p.price_yearly, p.max_products, p.max_staff, p.features_json
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.tenant_id = ? AND s.status = 'active'
       ORDER BY s.id DESC LIMIT 1`,
      [tenantId]
    );

    // Fetch usage counts
    const [prodCountRow] = await db.query('SELECT COUNT(id) AS count FROM products WHERE tenant_id = ?', [tenantId]);
    const [staffCountRow] = await db.query('SELECT COUNT(id) AS count FROM users WHERE tenant_id = ?', [tenantId]);
    const [salesCountRow] = await db.query('SELECT COUNT(id) AS count FROM sales WHERE tenant_id = ?', [tenantId]);

    const totalProducts = prodCountRow[0].count || 0;
    const totalStaff = staffCountRow[0].count || 0;
    const totalSales = salesCountRow[0].count || 0;

    // Calculate remaining trial / subscription days
    const now = new Date();
    const expiryDate = tenant.subscription_ends_at 
      ? new Date(tenant.subscription_ends_at) 
      : (tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : (subRows[0] ? new Date(subRows[0].ends_at) : new Date()));
    
    const diffTime = expiryDate - now;
    const remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Total period days for progress percentage (14 days for trial, 30 days for monthly)
    const totalPeriodDays = tenant.subscription_status === 'trial' ? 14 : 30;
    const usedDays = Math.min(totalPeriodDays, totalPeriodDays - remainingDays);
    const progressPercentage = Math.min(100, Math.max(0, (usedDays / totalPeriodDays) * 100));

    // Current Plan object (prioritize tenant.plan_name and limits set by Super Admin)
    let currentPlan = null;
    if (subRows.length > 0) {
      currentPlan = {
        ...subRows[0],
        plan_name: tenant.plan_name || subRows[0].plan_name,
        max_products: tenant.max_products || subRows[0].max_products,
        max_staff: tenant.max_staff || subRows[0].max_staff
      };
    } else {
      currentPlan = {
        plan_name: tenant.plan_name || (tenant.subscription_status === 'trial' ? '14-Day Free Trial Plan' : 'Active Subscription Plan'),
        plan_code: tenant.plan_id ? `plan-${tenant.plan_id}` : (tenant.subscription_status === 'trial' ? 'trial' : 'active'),
        price_monthly: '0.00',
        max_products: tenant.max_products || (tenant.subscription_status === 'trial' ? 300 : 99999),
        max_staff: tenant.max_staff || (tenant.subscription_status === 'trial' ? 5 : 99),
        features_json: JSON.stringify({ pos: true, inventory: true, analytics: true, wholesale: true, finance: true, ads: true })
      };
    }

    // Fetch all active plans for upgrade/renewal catalog
    const [plans] = await db.query('SELECT * FROM plans WHERE is_active = 1');

    res.json({
      subscription_status: tenant.subscription_status,
      shop_name: tenant.shop_name,
      shop_code: tenant.shop_code || `SHOP-${1000 + tenant.id}`,
      expiry_date: expiryDate,
      remaining_days: remainingDays,
      used_days: usedDays,
      total_period_days: totalPeriodDays,
      progress_percentage: Math.round(progressPercentage),
      usage: {
        products: totalProducts,
        max_products: currentPlan.max_products || 300,
        staff: totalStaff,
        max_staff: currentPlan.max_staff || 5,
        sales: totalSales
      },
      current_plan: currentPlan,
      available_plans: plans
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.requestPlanUpgrade = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { plan_id, billing_cycle } = req.body;

    const [plans] = await db.query('SELECT * FROM plans WHERE id = ?', [plan_id]);
    if (plans.length === 0) {
      return res.status(404).json({ error: 'Plan not found.' });
    }

    const plan = plans[0];
    const ticketNo = `SUB-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create a support ticket automatically for the subscription upgrade request
    const subject = `Subscription Renewal & Upgrade Request: [${plan.name} (${billing_cycle || 'monthly'})]`;
    const message = `Hello Admin, I would like to upgrade/renew our subscription to ${plan.name} (${billing_cycle === 'yearly' ? 'Yearly' : 'Monthly'} Billing @ ৳${billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly}). Please activate our plan.`;

    await db.query(
      `INSERT INTO support_tickets (ticket_no, tenant_id, user_id, category, subject, priority, status)
       VALUES (?, ?, ?, 'Subscription & Billing', ?, 'High', 'Open')`,
      [ticketNo, tenantId, req.user.userId, subject]
    );

    res.json({
      message: `Upgrade request for ${plan.name} submitted successfully! Support Ticket #${ticketNo} generated for Super Admin.`
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
