const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./db/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Initialize database schema and indexes
initDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & utility middleware
// CORS: allow the Vercel frontend origin (set via CLIENT_URL env var) + local dev
const allowedOrigins = [
  process.env.CLIENT_URL,       // e.g. https://campusequip.vercel.app
  'http://localhost:5173',       // Vite dev server
  'http://localhost:5000',       // Unified local preview
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'CampusEquip - College Equipment Borrowing System',
    timestamp: new Date().toISOString(),
    supabaseConnected: !!process.env.SUPABASE_URL,
    supabaseUrl: process.env.SUPABASE_URL || null,
    version: '1.0.0'
  });
});

// Mount modular API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/equipment', require('./routes/equipmentRoutes'));
app.use('/api/borrow', require('./routes/borrowRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/audit-logs', require('./routes/auditRoutes'));

// Serve client build if available (Production unified deployment)
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
const fs = require('fs');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 & Error handlers
app.use('/api/*', notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(` CampusEquip API Server running on http://localhost:${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.SUPABASE_URL) {
    console.log(` Supabase Cloud: ${process.env.SUPABASE_URL}`);
  }
  console.log(`=======================================================`);
});

module.exports = app;

