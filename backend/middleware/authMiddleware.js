const { verifyToken } = require('../utils/auth');
const db = require('../config/db');

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    req.user = decoded; // { userId, tenantId, role, email, name }

    // If user belongs to a tenant shop, verify tenant status
    if (req.user.tenantId) {
      const [tenantRows] = await db.query(
        'SELECT id, shop_name, slug, currency, subscription_status, trial_ends_at FROM tenants WHERE id = ?',
        [req.user.tenantId]
      );

      if (tenantRows.length === 0) {
        return res.status(401).json({ error: 'Tenant shop account no longer exists.' });
      }

      const tenant = tenantRows[0];
      req.tenant = tenant;

      // Check trial expiry
      const now = new Date();
      const trialEnds = new Date(tenant.trial_ends_at);
      const isTrialActive = tenant.subscription_status === 'trial' && trialEnds > now;
      const isActiveSub = tenant.subscription_status === 'active';

      if (!isTrialActive && !isActiveSub && req.user.role !== 'superadmin') {
        req.subscriptionExpired = true;
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
};

exports.requireSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Super Admin privilege required.' });
  }
};

exports.checkActiveSubscription = (req, res, next) => {
  if (req.subscriptionExpired) {
    return res.status(402).json({
      error: 'Subscription Expired',
      message: 'Your 14-day free trial or subscription has expired. Please upgrade your plan to continue writing data.'
    });
  }
  next();
};
