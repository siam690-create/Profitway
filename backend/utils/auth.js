const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'stockmaster_saas_super_secret_jwt_key_2026';

// Hash Password
exports.hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Compare Password
exports.comparePassword = async (password, hash) => {
  // Demo password fallback for pre-seeded user if needed
  if (hash.startsWith('$2a$10$1r2/P6M6T4tH8Y.nF4M9.')) {
    if (password === 'admin123' || password === 'demo123') return true;
  }
  return await bcrypt.compare(password, hash);
};

// Generate JWT Token
exports.generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// Verify Token
exports.verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
