const db = require('./config/db');
const { hashPassword } = require('./utils/auth');

async function seedSuperAdmin() {
  try {
    const email = 'admin@profitway.bd';
    const password = 'admin123';
    const hashedPassword = await hashPassword(password);

    // Check if superadmin exists
    const [existing] = await db.query("SELECT id FROM users WHERE role = 'superadmin'");

    if (existing.length > 0) {
      await db.query(
        "UPDATE users SET email = ?, password_hash = ? WHERE role = 'superadmin'",
        [email, hashedPassword]
      );
      console.log('Super Admin user updated successfully: admin@profitway.bd / admin123');
    } else {
      await db.query(
        "INSERT INTO users (name, email, password_hash, role) VALUES ('Super Administrator', ?, ?, 'superadmin')",
        [email, hashedPassword]
      );
      console.log('Super Admin user created successfully: admin@profitway.bd / admin123');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error seeding superadmin:', err);
    process.exit(1);
  }
}

seedSuperAdmin();
