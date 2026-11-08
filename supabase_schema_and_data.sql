-- ==============================================================================
-- CampusEquip | Supabase PostgreSQL Schema & Data Migration Script
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
-- 10. INSERT CATEGORIES
-- ==============================================================================
INSERT INTO categories (id, name, description, icon) VALUES
(1, 'Information Technology (BSIT)', 'Network switches, server racks, cable testers, virtualization laptops, and embedded IoT kits', 'Laptop'),
(2, 'Hospitality Management (BSHM)', 'Commercial culinary probes, sous-vide circulators, barista tools, and hotel food safety equipment', 'Coffee'),
(3, 'Criminology & Forensics (BSCRIM)', 'Fingerprint kits, alternate light sources, ballistic gauges, and crime scene investigation apparatus', 'Shield'),
(4, 'Education & Instructional Media', 'Smart document cameras, interactive projectors, wireless lapel PA systems, and teaching kits', 'BookOpen'),
(5, 'General Campus Laboratory Assets', 'Multi-discipline measurement tools, multimedia presenters, and general campus devices', 'Package');

SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));

-- ==============================================================================
-- 11. INSERT USERS (PASSWORDS HASHED WITH BCRYPT, COST 10)
-- Passwords:
--   admin@campusequip.edu     -> admin123
--   custodian@campusequip.edu -> staff123
--   student@campusequip.edu   -> student123
--   maria.santos@campusequip.edu -> student123
--   gabriel.ramos@campusequip.edu -> student123
--   claire.mendoza@campusequip.edu -> student123
--   dr.reyes@campusequip.edu  -> password123
-- ==============================================================================
INSERT INTO users (id, name, email, password, role, student_id, department, phone, status) VALUES
(1, 'Engr. Alexander Vance', 'admin@campusequip.edu', '$2a$10$f66sYc9vOa85Z.5pfnL6o.cM057o52t7g8.r9e/g5u8s/5q0t0o2G', 'admin', 'ADM-001', 'Campus Technology & Facilities', '+1 (555) 234-5678', 'active'),
(2, 'Prof. Eleanor Hawthorne', 'custodian@campusequip.edu', '$2a$10$w3UeN8y1UvQ9L7zY4P3xJ.xQ3f6K8p2T5y9r4e/m2w1s/7q8t9u0A', 'staff', 'STF-104', 'Central Campus Laboratory Custody', '+1 (555) 345-6789', 'active'),
(3, 'Julian Davies', 'student@campusequip.edu', '$2a$10$J5n2z5c5R8m1q4w7y0t3u.e8f1l4p7t0y3r6e/m9w2s/4q1t8u3B', 'borrower', 'BSIT-2024-8821', 'Bachelor Science of information technology(BSIT)', '+1 (555) 456-7890', 'active'),
(4, 'Maria Santos', 'maria.santos@campusequip.edu', '$2a$10$J5n2z5c5R8m1q4w7y0t3u.e8f1l4p7t0y3r6e/m9w2s/4q1t8u3B', 'borrower', 'BSCRIM-2024-9102', 'Bachelor Science of Criminology(BSCRIM)', '+1 (555) 567-8901', 'active'),
(5, 'Gabriel Ramos', 'gabriel.ramos@campusequip.edu', '$2a$10$J5n2z5c5R8m1q4w7y0t3u.e8f1l4p7t0y3r6e/m9w2s/4q1t8u3B', 'borrower', 'BSHM-2024-4412', 'Bachelor Science of hospitality Management(BSHM)', '+1 (555) 678-1122', 'active'),
(6, 'Claire Mendoza', 'claire.mendoza@campusequip.edu', '$2a$10$J5n2z5c5R8m1q4w7y0t3u.e8f1l4p7t0y3r6e/m9w2s/4q1t8u3B', 'borrower', 'BSED-2024-1189', 'Bachelor Science of Education', '+1 (555) 789-3344', 'active'),
(7, 'Dr. Marcus Reyes', 'dr.reyes@campusequip.edu', '$2a$10$m6N3x8v1P4r7w9y2t5u8e.f2l5p8t1y4r7e/m0w3s/5q2t9u4C', 'borrower', 'FAC-IT-0412', 'Bachelor Science of information technology(BSIT)', '+1 (555) 678-9012', 'active');

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- ==============================================================================
-- 12. INSERT EQUIPMENT ACROSS THE ACADEMIC PROGRAMS
-- ==============================================================================
INSERT INTO equipment (id, category_id, name, asset_tag, model_number, description, location, total_quantity, available_quantity, condition, status, image_url, max_borrow_days) VALUES
-- BSIT
(1, 1, 'Cisco Catalyst 2960-X 24-Port Gigabit Managed Switch', 'EQ-IT-0101', 'WS-C2960X-24TS-L', 'Enterprise L2/L3 switch with 24 Gigabit Ethernet ports and 4x 1G SFP uplinks for CCNA routing and switching labs.', 'IT Networking & Cyber Lab - Rm 402', 8, 7, 'excellent', 'available', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80', 7),
(2, 1, 'Fluke Networks MicroScanner2 Cable Verifier Kit', 'EQ-IT-0102', 'MS2-KIT', 'Streamlines voice, data, and video cable testing with wiremap display, cable length, distance to fault, and IntelliTone toning.', 'IT Networking & Cyber Lab - Rm 402', 6, 5, 'excellent', 'available', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80', 5),
(3, 1, 'Dell Precision 7770 Mobile Workstation (RTX A4500, 64GB)', 'EQ-IT-0103', 'PREC-7770', 'Intel Core i9, 64GB DDR5, Nvidia RTX A4500 16GB GPU. Dedicated for systems development, virtualization, and machine learning.', 'IT Innovation Lab - Counter Desk', 10, 8, 'excellent', 'available', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80', 7),
(4, 1, 'Raspberry Pi 4 Model B (8GB) Embedded IoT Lab Bundle', 'EQ-IT-0104', 'RPI4-8GB-KIT', 'Complete IoT bundle with breadboard, GPIO breakout, ultrasonic sensors, relay modules, and 64GB microSD.', 'IoT & Embedded Systems Lab - Bay 2', 15, 12, 'good', 'available', 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=600&q=80', 14),

-- BSHM
(5, 2, 'Commercial Sous Vide Precision Immersion Circulator & Bath', 'EQ-HM-0201', 'SV-PRO-1200', 'Professional 1200W commercial immersion circulator with digital PID temperature stability (+/- 0.05C) for culinary arts practicals.', 'Culinary Laboratory - Station 4', 5, 4, 'excellent', 'available', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80', 3),
(6, 2, 'Professional Barista Espresso Calibration Kit & Tamper', 'EQ-HM-0202', 'BARISTA-CAL-58', '58mm precision calibrated tamper, VST precision baskets, digital shot timer scale, and milk steaming thermistor.', 'Hospitality Beverage & Bar Lab - Counter 1', 6, 5, 'excellent', 'available', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80', 4),
(7, 2, 'HACCP Dual Infrared & Penetration Probe Food Thermometer', 'EQ-HM-0203', 'FLUKE-FOODPRO-PLUS', 'Non-contact infrared surface scan and folding internal probe for monitoring critical food holding and cooking temperatures.', 'Food Safety & Sanitation Hub - Cabinet A', 8, 8, 'good', 'available', 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80', 3),
(8, 2, 'Brix Sugar Refractometer & Wine Specific Gravity Gauge', 'EQ-HM-0204', 'ATC-BRIX-32', 'Optical handheld refractometer with automatic temperature compensation for beverage management and syrup testing.', 'Hospitality Beverage & Bar Lab - Counter 1', 7, 7, 'good', 'available', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80', 5),

-- BSCRIM
(9, 3, 'Forensic Latent Fingerprint Developing & Magnetic Powder Kit', 'EQ-CRIM-0301', 'SIRCHIE-LP-400', 'Standard forensic latent print kit: bichromatic powders, magnetic wands, lifting tape, backing cards, and 10x ridge magnifier.', 'Forensic Science & Dactyloscopy Lab - Rm 201', 10, 8, 'excellent', 'available', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80', 5),
(10, 3, 'Crime Scene Alternate Light Source (ALS / UV Luminescence Kit)', 'EQ-CRIM-0302', 'FORENSIC-ALS-455', 'High-intensity multi-wavelength forensic flashlight (UV 365nm, Blue 455nm) with yellow and orange contrast goggles for biological evidence.', 'Criminalistics Evidence Room - Locker 2', 4, 3, 'excellent', 'available', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80', 3),
(11, 3, 'Mitutoyo Digital Caliper & Bullet Ballistic Measuring Gauge', 'EQ-CRIM-0303', 'MIT-500-196', '6-inch digital caliper with 0.01mm resolution for measuring cartridge casing dimensions, bullet diameters, and toolmark impressions.', 'Forensic Ballistics Range & Workshop', 6, 5, 'excellent', 'available', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80', 7),
(12, 3, 'Nikon D7500 Crime Scene Evidence Photography Kit with Scales', 'EQ-CRIM-0304', 'NIK-D7500-CSI', '20.9MP DSLR with AF-S DX 18-140mm VR lens, macro ring flash, L-shaped photomacrographic scale markers, and evidence number placards.', 'Crime Scene Simulation Bay - Cage C', 5, 3, 'good', 'available', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80', 4),

-- Bachelor Science of Education
(13, 4, 'IPEVO V4K Ultra HD 8MP USB Document Camera', 'EQ-ED-0401', 'V4K-UHD-8MP', 'Multi-jointed stand document camera with 8MP Sony sensor, fast autofocus, and noise-reduction microphone for demonstration teaching.', 'Micro-Teaching Center - Rm 105', 8, 7, 'excellent', 'available', 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=600&q=80', 7),
(14, 4, 'Epson PowerLite 2250U Full HD Presentation Projector', 'EQ-ED-0402', 'EPSON-2250U', '5,000 lumens Full HD 1080p 3LCD projector with HDMI/VGA and wireless screen mirroring for student teacher presentations.', 'Instructional Media Store - Shelf 3', 6, 5, 'good', 'available', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80', 5),
(15, 4, 'Wireless Dual Lavalier Lapel Mic & Portable PA Speaker System', 'EQ-ED-0403', 'PA-VOICE-PRO', 'Dual wireless UHF lapel bodypack transmitters with rechargeable 80W portable speaker for field demonstration and classroom teaching.', 'Instructional Media Store - Shelf 3', 7, 6, 'excellent', 'available', 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80', 4),
(16, 4, 'General Science Teaching Demonstration Glassware & Balance Set', 'EQ-ED-0404', 'SCI-ED-SET-10', 'Standard science education demonstration apparatus: spring balances, optical lenses, prism, graduated cylinders, and beaker set.', 'Science Education Laboratory - Rm 108', 10, 9, 'good', 'available', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80', 7);

SELECT setval('equipment_id_seq', (SELECT MAX(id) FROM equipment));

-- ==============================================================================
-- 13. INSERT BORROW REQUESTS
-- ==============================================================================
INSERT INTO borrow_requests (
    id, reference_code, user_id, equipment_id, quantity, borrow_date, return_date, 
    actual_return_date, purpose, course_code, faculty_sponsor, notes, status, 
    approver_id, approval_notes, approved_at, dispatched_by, dispatched_at, 
    returned_to, return_condition, damage_notes, fine_amount, created_at
) VALUES
(1, 'BRW-2026-IT01A', 3, 2, 1, CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '2 days', NULL, 'Structured Cabling and Rack Patch Termination Practical Exam', 'IT-221', 'Dr. Marcus Reyes', 'Need tone generator probe for server room tracing.', 'dispatched', 2, 'Approved. Return with complete RJ45 adapter patch cord.', NOW() - INTERVAL '3 days', 2, NOW() - INTERVAL '3 days', NULL, NULL, NULL, 0.00, NOW() - INTERVAL '3 days'),
(2, 'BRW-2026-HM02B', 5, 5, 1, CURRENT_DATE, CURRENT_DATE + INTERVAL '5 days', NULL, 'Molecular Gastronomy & Vacuum Cooking Practical Assessment', 'HM-310', 'Chef Instructor A. Gomez', 'Clean sanitized food-grade water container ready.', 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NOW()),
(3, 'BRW-2026-ED03C', 6, 13, 1, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days', NULL, 'Demonstration Teaching in Science & Math Micro-Session', 'EDUC-401', 'Prof. Eleanor Hawthorne', 'Will use with laptop HDMI presentation.', 'approved', 2, 'Approved. Collect at Instructional Media Desk Locker #3.', NOW(), NULL, NULL, NULL, NULL, NULL, 0.00, NOW()),
(4, 'BRW-2026-CR04D', 4, 12, 1, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '1 day', NULL, 'Crime Scene Simulation: Homicide Investigation Documentation & Photomacrography', 'CRIM-315', 'Atty. R. Valderama', 'Photographed evidence scales in simulated indoor scene.', 'dispatched', 2, 'Standard release with battery and 64GB SD card.', NOW() - INTERVAL '10 days', 2, NOW() - INTERVAL '10 days', NULL, NULL, NULL, 0.00, NOW() - INTERVAL '10 days'),
(5, 'BRW-2026-IT05E', 7, 1, 1, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '5 days', 'Faculty Network Security Demo: VLAN Trunking & Access List Configuration', 'IT-405', 'Self / IT Program Head', 'All console cables and power cord returned.', 'returned', 2, 'Approved for faculty demonstration.', NOW() - INTERVAL '10 days', 2, NOW() - INTERVAL '10 days', 2, 'excellent', 'Console cable, rack brackets, and power cable verified. Clean return.', 0.00, NOW() - INTERVAL '10 days');

SELECT setval('borrow_requests_id_seq', (SELECT MAX(id) FROM borrow_requests));

-- ==============================================================================
-- 14. INSERT NOTIFICATIONS
-- ==============================================================================
INSERT INTO notifications (user_id, title, message, type, is_read, link) VALUES
(3, 'Active Loan Reminder (BSIT)', 'Your loan for Fluke Networks MicroScanner2 (Ref: BRW-2026-IT01A) is due in 2 days.', 'info', 0, '/dashboard'),
(6, 'Borrow Request Approved! (BSED) 🎉', 'Your request for IPEVO V4K Document Camera (Ref: BRW-2026-ED03C) is approved and ready for pickup at Media Desk Locker #3.', 'success', 0, '/dashboard'),
(4, 'OVERDUE NOTICE ⚠️ (BSCRIM)', 'Nikon D7500 Evidence Camera (Ref: BRW-2026-CR04D) is past due. Please return to Central Lab Custody immediately.', 'danger', 0, '/dashboard');

-- ==============================================================================
-- 15. INSERT AUDIT LOGS
-- ==============================================================================
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES
(1, 'INITIAL_SEED', 'system', 0, '{"note":"CampusEquip populated for BSIT, BSHM, BSCRIM, BSED"}'),
(2, 'APPROVE_REQUEST', 'borrow_requests', 1, '{"ref":"BRW-2026-IT01A"}'),
(2, 'DISPATCH_EQUIPMENT', 'borrow_requests', 1, '{"ref":"BRW-2026-IT01A","qty":1}'),
(2, 'RETURN_EQUIPMENT', 'borrow_requests', 5, '{"ref":"BRW-2026-IT05E","condition":"excellent"}');

