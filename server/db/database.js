const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'campusequip.db');
const db = new DatabaseSync(dbPath);

// Enable Foreign Keys and WAL mode for high performance and integrity
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

function initDatabase() {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('borrower', 'staff', 'admin')),
      student_id TEXT,
      department TEXT NOT NULL DEFAULT 'Bachelor Science of information technology(BSIT)',
      phone TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Categories table
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT DEFAULT 'Package',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Equipment inventory table
    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      asset_tag TEXT UNIQUE NOT NULL,
      model_number TEXT,
      description TEXT,
      location TEXT NOT NULL,
      total_quantity INTEGER NOT NULL DEFAULT 1,
      available_quantity INTEGER NOT NULL DEFAULT 1,
      condition TEXT NOT NULL DEFAULT 'excellent' CHECK(condition IN ('excellent', 'good', 'fair', 'maintenance')),
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'maintenance', 'retired')),
      image_url TEXT,
      max_borrow_days INTEGER NOT NULL DEFAULT 7,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Borrow Requests table
    CREATE TABLE IF NOT EXISTS borrow_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_code TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      borrow_date TEXT NOT NULL,
      return_date TEXT NOT NULL,
      actual_return_date TEXT,
      purpose TEXT NOT NULL,
      course_code TEXT,
      faculty_sponsor TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'dispatched', 'returned', 'rejected', 'cancelled', 'overdue')),
      approver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      approval_notes TEXT,
      approved_at DATETIME,
      dispatched_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      dispatched_at DATETIME,
      returned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
      return_condition TEXT,
      damage_notes TEXT,
      fine_amount REAL DEFAULT 0.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info' CHECK(type IN ('info', 'success', 'warning', 'danger')),
      is_read INTEGER NOT NULL DEFAULT 0,
      link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Audit Logs table
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_equipment_cat ON equipment(category_id);
    CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
    CREATE INDEX IF NOT EXISTS idx_borrow_user ON borrow_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_borrow_equip ON borrow_requests(equipment_id);
    CREATE INDEX IF NOT EXISTS idx_borrow_status ON borrow_requests(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(created_at);
  `);
}

// Audit logger helper
function logAudit(userId, action, entityType, entityId, details) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(userId || null, action, entityType, entityId || null, typeof details === 'object' ? JSON.stringify(details) : details || null);
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

// Notification helper
function createNotification(userId, title, message, type = 'info', link = null) {
  try {
    const stmt = db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, is_read, link)
      VALUES (?, ?, ?, ?, 0, ?)
    `);
    stmt.run(userId, title, message, type, link);
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
}

module.exports = {
  db,
  initDatabase,
  logAudit,
  createNotification
};

