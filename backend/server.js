const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

const path = require('path');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve Uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api', apiRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Stock & Profit Management Software API is running smoothly.',
    status: 'healthy',
    timestamp: new Date()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const autoMigrate = require('./config/initDb');
const { syncCourierOrderStatus } = require('./controllers/courierAccountController');

app.listen(PORT, async () => {
  console.log(`🚀 Stock & Profit Management API running on http://localhost:${PORT}`);
  await autoMigrate();

  // Run initial sync after 10s and then every 15 minutes automatically
  setTimeout(async () => {
    try {
      console.log('⏰ Running initial automatic Courier Status Sync...');
      await syncCourierOrderStatus(null, null);
    } catch (e) {
      console.error('Initial courier sync error:', e.message);
    }
  }, 10000);

  setInterval(async () => {
    try {
      console.log('⏰ Running periodic background Courier Status Sync...');
      await syncCourierOrderStatus(null, null);
    } catch (e) {
      console.error('Background courier sync error:', e.message);
    }
  }, 15 * 60 * 1000);
});
