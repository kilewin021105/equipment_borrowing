const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./db/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

initDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

// Set CLIENT_URL to one or more comma-separated frontend origins.
const allowedOrigins = [
  ...(process.env.CLIENT_URL || '').split(',').map((origin) => origin.trim()).filter(Boolean),
  'http://localhost:5173',
  'http://localhost:5000',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'CampusEquip - College Equipment Borrowing System',
    timestamp: new Date().toISOString(),
    supabaseConnected: !!process.env.SUPABASE_URL,
    version: '1.0.0'
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/equipment', require('./routes/equipmentRoutes'));
app.use('/api/borrow', require('./routes/borrowRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/audit-logs', require('./routes/auditRoutes'));

const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
const fs = require('fs');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.use('/api/*', notFoundHandler);
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CampusEquip API listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
