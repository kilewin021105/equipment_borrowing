-- CampusEquip PostgreSQL schema for Supabase.
-- Safe for a NEW, empty Supabase project: this script does not DROP tables or insert demo data.
-- Run once in Supabase SQL Editor. The API will connect through a private PostgreSQL
-- connection string stored only as DATABASE_URL on the backend host.

BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('borrower', 'staff', 'admin')),
  student_id TEXT,
  department TEXT NOT NULL DEFAULT 'Bachelor Science of information technology(BSIT)',
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'Package',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  asset_tag TEXT NOT NULL UNIQUE,
  model_number TEXT,
  description TEXT,
  location TEXT NOT NULL,
  total_quantity INTEGER NOT NULL DEFAULT 1 CHECK (total_quantity >= 1),
  available_quantity INTEGER NOT NULL DEFAULT 1 CHECK (available_quantity >= 0),
  condition TEXT NOT NULL DEFAULT 'excellent'
    CHECK (condition IN ('excellent', 'good', 'fair', 'maintenance')),
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'maintenance', 'retired')),
  image_url TEXT,
  max_borrow_days INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (available_quantity <= total_quantity)
);

CREATE TABLE IF NOT EXISTS borrow_requests (
  id BIGSERIAL PRIMARY KEY,
  reference_code TEXT NOT NULL UNIQUE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  equipment_id BIGINT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  borrow_date DATE NOT NULL,
  return_date DATE NOT NULL,
  actual_return_date TIMESTAMPTZ,
  purpose TEXT NOT NULL,
  course_code TEXT,
  faculty_sponsor TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'dispatched', 'returned', 'rejected', 'cancelled', 'overdue')),
  approver_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  approval_notes TEXT,
  approved_at TIMESTAMPTZ,
  dispatched_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  dispatched_at TIMESTAMPTZ,
  returned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
  return_condition TEXT,
  damage_notes TEXT,
  fine_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (return_date >= borrow_date)
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'danger')),
  is_read SMALLINT NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id BIGINT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_equipment_cat ON equipment(category_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_borrow_user ON borrow_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_borrow_equip ON borrow_requests(equipment_id);
CREATE INDEX IF NOT EXISTS idx_borrow_status ON borrow_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(created_at);

-- No public/anon policies are created. The Express API will use a private
-- PostgreSQL connection string kept in its server-side environment variables.
-- Do not put DATABASE_URL in Vite/client environment variables.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

COMMIT;
