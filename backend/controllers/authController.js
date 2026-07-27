const db = require('../config/db');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
const mailer = require('../utils/mailer');

// Register New Tenant Shop (Requires Super Admin Approval)
exports.registerTenant = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { shop_name, owner_name, email, password, phone, currency } = req.body;

    if (!shop_name || !owner_name || !email || !password) {
      return res.status(400).json({ error: 'Shop Name, Owner Name, Email, and Password are required.' });
    }

    // Check if email already exists
    const [existingUsers] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    await connection.beginTransaction();

    // Create unique slug
    const baseSlug = shop_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const slug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;

    // Set 14-Day Trial Expiry Date (activates upon Super Admin approval)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // 1. Create Tenant in 'pending_approval' status
    const [tenantResult] = await connection.query(
      `INSERT INTO tenants (shop_name, slug, owner_name, email, phone, currency, subscription_status, trial_ends_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending_approval', ?)`,
      [
        shop_name,
        slug,
        owner_name,
        email,
        phone || null,
        currency || '৳',
        trialEndsAt
      ]
    );

    const tenantId = tenantResult.insertId;
    const shopCode = `SHOP-${1000 + tenantId}`;
    await connection.query('UPDATE tenants SET shop_code = ? WHERE id = ?', [shopCode, tenantId]);

    // 2. Hash Password and Create Owner User
    const hashedPassword = await hashPassword(password);
    const [userResult] = await connection.query(
      `INSERT INTO users (tenant_id, name, email, password_hash, role)
       VALUES (?, ?, ?, ?, 'owner')`,
      [tenantId, owner_name, email, hashedPassword]
    );

    const userId = userResult.insertId;

    // 3. Seed Default Categories for the New Shop
    const defaultCategories = ['Electronics', 'General', 'Clothing', 'Groceries'];
    for (const catName of defaultCategories) {
      await connection.query(
        'INSERT INTO categories (tenant_id, name, description) VALUES (?, ?, ?)',
        [tenantId, catName, `Default ${catName} category`]
      );
    }

    await connection.commit();

    // Send email alert to Super Admin about new signup
    try {
      await mailer.sendMail({
        to: 'admin@profitway.bd',
        subject: `🚨 New Shop Registration Signup: ${shop_name} [${shopCode}]`,
        text: `New Shop Signup Request:\nShop Name: ${shop_name}\nOwner: ${owner_name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nShop Code: ${shopCode}\n\nPlease log in to Super Admin Portal to Review & Approve this account.`
      });
    } catch (e) {
      console.error('Email notify error:', e.message);
    }

    res.status(201).json({
      message: 'Shop registration submitted successfully! Your account is pending Super Admin approval. You will receive access once approved.',
      requires_approval: true,
      shop_name,
      shop_code: shopCode
    });

  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find User
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];

    // Check Password
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    let tenant = null;
    if (user.tenant_id) {
      const [tenants] = await db.query('SELECT * FROM tenants WHERE id = ?', [user.tenant_id]);
      if (tenants.length > 0) tenant = tenants[0];
    }

    // Block non-superadmin logins if pending approval or suspended
    if (user.role !== 'superadmin' && tenant) {
      if (tenant.subscription_status === 'pending_approval') {
        return res.status(403).json({
          error: 'Your shop registration is pending Super Admin approval. Please wait for approval before logging in.'
        });
      }
      if (tenant.subscription_status === 'suspended') {
        return res.status(403).json({
          error: 'Your shop account has been suspended by Super Admin. Please contact support.'
        });
      }
    }

    const token = generateToken({
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role,
      email: user.email,
      name: user.name
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions ? JSON.parse(user.permissions) : null
      },
      tenant
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Current User Profile and Tenant Status
exports.getMe = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role, permissions, tenant_id FROM users WHERE id = ?', [req.user.userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = users[0];
    user.permissions = user.permissions ? JSON.parse(user.permissions) : null;

    let tenant = null;
    if (user.tenant_id) {
      const [tenants] = await db.query('SELECT * FROM tenants WHERE id = ?', [user.tenant_id]);
      if (tenants.length > 0) tenant = tenants[0];
    }

    res.json({
      user,
      tenant
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
