-- ==============================================================================
-- CampusEquip | Supabase PostgreSQL Schema & Clean Setup Script
-- Programs: BSIT, BSHM, BSCRIM, Bachelor Science of Education
-- ==============================================================================

-- 1. DROP EXISTING TABLES IF ANY (IN REVERSE DEPENDENCY ORDER)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS borrow_requests CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. CREATE USERS TABLE
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('borrower', 'staff', 'admin')),
    student_id TEXT,
    department TEXT NOT NULL DEFAULT 'Bachelor Science of information technology(BSIT)',
    phone TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE CATEGORIES TABLE
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'Package',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE EQUIPMENT TABLE
CREATE TABLE equipment (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    asset_tag TEXT UNIQUE NOT NULL,
    model_number TEXT,
    description TEXT,
    location TEXT NOT NULL,
    total_quantity INTEGER NOT NULL DEFAULT 1 CHECK (total_quantity >= 1),
    available_quantity INTEGER NOT NULL DEFAULT 1 CHECK (available_quantity >= 0),
    condition VARCHAR(20) NOT NULL DEFAULT 'excellent' CHECK (condition IN ('excellent', 'good', 'fair', 'maintenance')),
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'maintenance', 'retired')),
    image_url TEXT,
    max_borrow_days INTEGER NOT NULL DEFAULT 7,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE BORROW REQUESTS TABLE
CREATE TABLE borrow_requests (
    id BIGSERIAL PRIMARY KEY,
    reference_code TEXT UNIQUE NOT NULL,
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
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'dispatched', 'returned', 'rejected', 'cancelled', 'overdue')),
    approver_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    approval_notes TEXT,
    approved_at TIMESTAMPTZ,
    dispatched_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    dispatched_at TIMESTAMPTZ,
    returned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
    return_condition VARCHAR(30),
    damage_notes TEXT,
    fine_amount NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'danger')),
    is_read SMALLINT NOT NULL DEFAULT 0,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CREATE AUDIT LOGS TABLE
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id BIGINT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. INDEXES FOR QUERY OPTIMIZATION
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_equipment_cat ON equipment(category_id);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_borrow_user ON borrow_requests(user_id);
CREATE INDEX idx_borrow_equip ON borrow_requests(equipment_id);
CREATE INDEX idx_borrow_status ON borrow_requests(status);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- 9. ENABLE ROW LEVEL SECURITY (RLS) & OPEN POLICIES FOR FULL COMPATIBILITY
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow modify users" ON users FOR ALL USING (true);

CREATE POLICY "Allow read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow modify categories" ON categories FOR ALL USING (true);

CREATE POLICY "Allow read equipment" ON equipment FOR SELECT USING (true);
CREATE POLICY "Allow modify equipment" ON equipment FOR ALL USING (true);

CREATE POLICY "Allow read borrow_requests" ON borrow_requests FOR SELECT USING (true);
CREATE POLICY "Allow modify borrow_requests" ON borrow_requests FOR ALL USING (true);

CREATE POLICY "Allow read notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Allow modify notifications" ON notifications FOR ALL USING (true);

CREATE POLICY "Allow read audit_logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow modify audit_logs" ON audit_logs FOR ALL USING (true);

-- ==============================================================================
-- 10. INSERT ACADEMIC CATEGORIES
-- ==============================================================================
INSERT INTO categories (id, name, description, icon) VALUES
(1, 'Information Technology (BSIT)', 'Network switches, server racks, cable testers, virtualization laptops, and embedded IoT kits', 'Laptop'),
(2, 'Hospitality Management (BSHM)', 'Commercial culinary probes, sous-vide circulators, barista tools, and hotel food safety equipment', 'Coffee'),
(3, 'Criminology & Forensics (BSCRIM)', 'Fingerprint kits, alternate light sources, ballistic gauges, and crime scene investigation apparatus', 'Shield'),
(4, 'Education & Instructional Media', 'Smart document cameras, interactive projectors, wireless lapel PA systems, and teaching kits', 'BookOpen'),
(5, 'General Campus Laboratory Assets', 'Multi-discipline measurement tools, multimedia presenters, and general campus devices', 'Package');

SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));

-- ==============================================================================
-- 11. INSERT EQUIPMENT ACROSS THE ACADEMIC PROGRAMS (100% AVAILABLE STOCK)
-- ==============================================================================
INSERT INTO equipment (id, category_id, name, asset_tag, model_number, description, location, total_quantity, available_quantity, condition, status, image_url, max_borrow_days) VALUES
-- BSIT
(1, 1, 'Cisco Catalyst 2960-X 24-Port Gigabit Managed Switch', 'EQ-IT-0101', 'WS-C2960X-24TS-L', 'Enterprise L2/L3 switch with 24 Gigabit Ethernet ports and 4x 1G SFP uplinks for CCNA routing and switching labs.', 'IT Networking & Cyber Lab - Rm 402', 8, 8, 'excellent', 'available', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80', 7),
(2, 1, 'Fluke Networks MicroScanner2 Cable Verifier Kit', 'EQ-IT-0102', 'MS2-KIT', 'Streamlines voice, data, and video cable testing with wiremap display, cable length, distance to fault, and IntelliTone toning.', 'IT Networking & Cyber Lab - Rm 402', 6, 6, 'excellent', 'available', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80', 5),
(3, 1, 'Dell Precision 7770 Mobile Workstation (RTX A4500, 64GB)', 'EQ-IT-0103', 'PREC-7770', 'Intel Core i9, 64GB DDR5, Nvidia RTX A4500 16GB GPU. Dedicated for systems development, virtualization, and machine learning.', 'IT Innovation Lab - Counter Desk', 10, 10, 'excellent', 'available', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80', 7),
(4, 1, 'Raspberry Pi 4 Model B (8GB) Embedded IoT Lab Bundle', 'EQ-IT-0104', 'RPI4-8GB-KIT', 'Complete IoT bundle with breadboard, GPIO breakout, ultrasonic sensors, relay modules, and 64GB microSD.', 'IoT & Embedded Systems Lab - Bay 2', 15, 15, 'good', 'available', 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=600&q=80', 14),

-- BSHM
(5, 2, 'Commercial Sous Vide Precision Immersion Circulator & Bath', 'EQ-HM-0201', 'SV-PRO-1200', 'Professional 1200W commercial immersion circulator with digital PID temperature stability (+/- 0.05C) for culinary arts practicals.', 'Culinary Laboratory - Station 4', 5, 5, 'excellent', 'available', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80', 3),
(6, 2, 'Professional Barista Espresso Calibration Kit & Tamper', 'EQ-HM-0202', 'BARISTA-CAL-58', '58mm precision calibrated tamper, VST precision baskets, digital shot timer scale, and milk steaming thermistor.', 'Hospitality Beverage & Bar Lab - Counter 1', 6, 6, 'excellent', 'available', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80', 4),
(7, 2, 'HACCP Dual Infrared & Penetration Probe Food Thermometer', 'EQ-HM-0203', 'FLUKE-FOODPRO-PLUS', 'Non-contact infrared surface scan and folding internal probe for monitoring critical food holding and cooking temperatures.', 'Food Safety & Sanitation Hub - Cabinet A', 8, 8, 'good', 'available', 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80', 3),
(8, 2, 'Brix Sugar Refractometer & Wine Specific Gravity Gauge', 'EQ-HM-0204', 'ATC-BRIX-32', 'Optical handheld refractometer with automatic temperature compensation for beverage management and syrup testing.', 'Hospitality Beverage & Bar Lab - Counter 1', 7, 7, 'good', 'available', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80', 5),

-- BSCRIM
(9, 3, 'Forensic Latent Fingerprint Developing & Magnetic Powder Kit', 'EQ-CRIM-0301', 'SIRCHIE-LP-400', 'Standard forensic latent print kit: bichromatic powders, magnetic wands, lifting tape, backing cards, and 10x ridge magnifier.', 'Forensic Science & Dactyloscopy Lab - Rm 201', 10, 10, 'excellent', 'available', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80', 5),
(10, 3, 'Crime Scene Alternate Light Source (ALS / UV Luminescence Kit)', 'EQ-CRIM-0302', 'FORENSIC-ALS-455', 'High-intensity multi-wavelength forensic flashlight (UV 365nm, Blue 455nm) with yellow and orange contrast goggles for biological evidence.', 'Criminalistics Evidence Room - Locker 2', 4, 4, 'excellent', 'available', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80', 3),
(11, 3, 'Mitutoyo Digital Caliper & Bullet Ballistic Measuring Gauge', 'EQ-CRIM-0303', 'MIT-500-196', '6-inch digital caliper with 0.01mm resolution for measuring cartridge casing dimensions, bullet diameters, and toolmark impressions.', 'Forensic Ballistics Range & Workshop', 6, 6, 'excellent', 'available', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80', 7),
(12, 3, 'Nikon D7500 Crime Scene Evidence Photography Kit with Scales', 'EQ-CRIM-0304', 'NIK-D7500-CSI', '20.9MP DSLR with AF-S DX 18-140mm VR lens, macro ring flash, L-shaped photomacrographic scale markers, and evidence number placards.', 'Crime Scene Simulation Bay - Cage C', 5, 5, 'good', 'available', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80', 4),

-- Bachelor Science of Education
(13, 4, 'IPEVO V4K Ultra HD 8MP USB Document Camera', 'EQ-ED-0401', 'V4K-UHD-8MP', 'Multi-jointed stand document camera with 8MP Sony sensor, fast autofocus, and noise-reduction microphone for demonstration teaching.', 'Micro-Teaching Center - Rm 105', 8, 8, 'excellent', 'available', 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=600&q=80', 7),
(14, 4, 'Epson PowerLite 2250U Full HD Presentation Projector', 'EQ-ED-0402', 'EPSON-2250U', '5,000 lumens Full HD 1080p 3LCD projector with HDMI/VGA and wireless screen mirroring for student teacher presentations.', 'Instructional Media Store - Shelf 3', 6, 6, 'good', 'available', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80', 5),
(15, 4, 'Wireless Dual Lavalier Lapel Mic & Portable PA Speaker System', 'EQ-ED-0403', 'PA-VOICE-PRO', 'Dual wireless UHF lapel bodypack transmitters with rechargeable 80W portable speaker for field demonstration and classroom teaching.', 'Instructional Media Store - Shelf 3', 7, 7, 'excellent', 'available', 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80', 4),
(16, 4, 'General Science Teaching Demonstration Glassware & Balance Set', 'EQ-ED-0404', 'SCI-ED-SET-10', 'Standard science education demonstration apparatus: spring balances, optical lenses, prism, graduated cylinders, and beaker set.', 'Science Education Laboratory - Rm 108', 10, 10, 'good', 'available', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80', 7),

-- General Campus Laboratory Assets
(17, 5, 'Digital Laser Distance Meter & Rangefinder (100m / 328ft)', 'EQ-GEN-0501', 'LEICA-DISTO-D2', 'Precision laser distance meter with Bluetooth Smart, Pythagoras measuring function, and IP54 dust/water protection for cross-department campus survey and project layouts.', 'General Campus Equipment Center - Rm 101', 6, 6, 'excellent', 'available', 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80', 5),
(18, 5, 'Logitech Spotlight Advanced Presentation Remote & Pointer', 'EQ-GEN-0502', 'LOGI-SPOTLIGHT-PRO', 'Advanced wireless digital presentation pointer with cursor control, magnification, timer vibration alerts, and 30-meter wireless range for institutional events and defense presentations.', 'Audio-Visual Equipment Desk - Rm 102', 8, 8, 'excellent', 'available', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80', 3),
(19, 5, 'Fluke 117 True-RMS Electrician''s Multimeter with Non-Contact Voltage', 'EQ-GEN-0503', 'FLUKE-117-RMS', 'Commercial True-RMS digital multimeter with VoltAlert non-contact voltage detection, low input impedance to prevent false readings, and min/max/average recording.', 'General Engineering & Maintenance Hub - Rm 104', 8, 8, 'excellent', 'available', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80', 5),
(20, 5, 'Anker Nebula Mars II Pro Portable Presentation Projector & Tripod', 'EQ-GEN-0504', 'NEBULA-MARS2-PRO', 'Portable outdoor/indoor cinema projector with 500 ANSI lumens, dual 10W audio drivers, 3-hour built-in battery, and heavy-duty adjustable aluminum tripod for student organizations and events.', 'Student Affairs & Activity Resource Center', 5, 5, 'good', 'available', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80', 4);

SELECT setval('equipment_id_seq', (SELECT MAX(id) FROM equipment));

-- Notice: Demo accounts, borrow records, notifications, and audit logs are left clean
-- Users can register their own accounts directly via the Registration screen (/register)!
