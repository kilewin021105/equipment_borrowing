const bcrypt = require('bcryptjs');
const { db, initDatabase } = require('./database');

async function seed() {
  console.log('--- Initializing Database Schema ---');
  initDatabase();

  console.log('--- Cleaning Existing Data ---');
  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec('DELETE FROM audit_logs;');
  db.exec('DELETE FROM notifications;');
  db.exec('DELETE FROM borrow_requests;');
  db.exec('DELETE FROM equipment;');
  db.exec('DELETE FROM categories;');
  db.exec('DELETE FROM users;');
  db.exec('PRAGMA foreign_keys = ON;');

  console.log('--- Seeding Categories for College Programs ---');
  const categories = [
    { 
      name: 'Information Technology (BSIT)', 
      description: 'Network switches, server racks, cable testers, virtualization laptops, and embedded IoT kits', 
      icon: 'Laptop' 
    },
    { 
      name: 'Hospitality Management (BSHM)', 
      description: 'Commercial culinary probes, sous-vide circulators, barista tools, and hotel food safety equipment', 
      icon: 'Coffee' 
    },
    { 
      name: 'Criminology & Forensics (BSCRIM)', 
      description: 'Fingerprint kits, alternate light sources, ballistic gauges, and crime scene investigation apparatus', 
      icon: 'Shield' 
    },
    { 
      name: 'Education & Instructional Media', 
      description: 'Smart document cameras, interactive projectors, wireless lapel PA systems, and teaching kits', 
      icon: 'BookOpen' 
    },
    { 
      name: 'General Campus Laboratory Assets', 
      description: 'Multi-discipline measurement tools, multimedia presenters, and general campus devices', 
      icon: 'Package' 
    }
  ];

  const catInsert = db.prepare('INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)');
  const catMap = {};
  for (const cat of categories) {
    const res = catInsert.run(cat.name, cat.description, cat.icon);
    catMap[cat.name] = Number(res.lastInsertRowid);
  }

  console.log('--- Seeding Users Across BSIT, BSHM, BSCRIM, BSED ---');
  const userInsert = db.prepare(`
    INSERT INTO users (name, email, password, role, student_id, department, phone, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const passwordHash = await bcrypt.hash('password123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);
  const staffHash = await bcrypt.hash('staff123', 10);
  const studentHash = await bcrypt.hash('student123', 10);

  // Admin
  const adminRes = userInsert.run(
    'Engr. Alexander Vance',
    'admin@campusequip.edu',
    adminHash,
    'admin',
    'ADM-001',
    'Campus Technology & Facilities',
    '+1 (555) 234-5678',
    'active'
  );
  const adminId = Number(adminRes.lastInsertRowid);

  // Staff / Lab Custodian
  const staffRes = userInsert.run(
    'Prof. Eleanor Hawthorne',
    'custodian@campusequip.edu',
    staffHash,
    'staff',
    'STF-104',
    'Central Campus Laboratory Custody',
    '+1 (555) 345-6789',
    'active'
  );
  const staffId = Number(staffRes.lastInsertRowid);

  // BSIT Student
  const student1Res = userInsert.run(
    'Julian Davies',
    'student@campusequip.edu',
    studentHash,
    'borrower',
    'BSIT-2024-8821',
    'Bachelor Science of information technology(BSIT)',
    '+1 (555) 456-7890',
    'active'
  );
  const student1Id = Number(student1Res.lastInsertRowid);

  // BSCRIM Student
  const student2Res = userInsert.run(
    'Maria Santos',
    'maria.santos@campusequip.edu',
    studentHash,
    'borrower',
    'BSCRIM-2024-9102',
    'Bachelor Science of Criminology(BSCRIM)',
    '+1 (555) 567-8901',
    'active'
  );
  const student2Id = Number(student2Res.lastInsertRowid);

  // BSHM Student
  const student3Res = userInsert.run(
    'Gabriel Ramos',
    'gabriel.ramos@campusequip.edu',
    studentHash,
    'borrower',
    'BSHM-2024-4412',
    'Bachelor Science of hospitality Management(BSHM)',
    '+1 (555) 678-1122',
    'active'
  );
  const student3Id = Number(student3Res.lastInsertRowid);

  // Education Student
  const student4Res = userInsert.run(
    'Claire Mendoza',
    'claire.mendoza@campusequip.edu',
    studentHash,
    'borrower',
    'BSED-2024-1189',
    'Bachelor Science of Education',
    '+1 (555) 789-3344',
    'active'
  );
  const student4Id = Number(student4Res.lastInsertRowid);

  // BSIT Faculty
  const facultyRes = userInsert.run(
    'Dr. Marcus Reyes',
    'dr.reyes@campusequip.edu',
    passwordHash,
    'borrower',
    'FAC-IT-0412',
    'Bachelor Science of information technology(BSIT)',
    '+1 (555) 678-9012',
    'active'
  );
  const facultyId = Number(facultyRes.lastInsertRowid);

  console.log('--- Seeding Equipment Inventory ---');
  const equipInsert = db.prepare(`
    INSERT INTO equipment (
      category_id, name, asset_tag, model_number, description,
      location, total_quantity, available_quantity, condition,
      status, image_url, max_borrow_days
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const equipmentList = [
    // 1. BSIT Equipment
    {
      category: 'Information Technology (BSIT)',
      name: 'Cisco Catalyst 2960-X 24-Port Gigabit Managed Switch',
      asset_tag: 'EQ-IT-0101',
      model_number: 'WS-C2960X-24TS-L',
      description: 'Enterprise L2/L3 switch with 24 Gigabit Ethernet ports and 4x 1G SFP uplinks for CCNA routing and switching labs.',
      location: 'IT Networking & Cyber Lab - Rm 402',
      total: 8,
      available: 7,
      condition: 'excellent',
      status: 'available',
      image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
      max_days: 7
    },
    {
      category: 'Information Technology (BSIT)',
      name: 'Fluke Networks MicroScanner2 Cable Verifier Kit',
      asset_tag: 'EQ-IT-0102',
      model_number: 'MS2-KIT',
      description: 'Streamlines voice, data, and video cable testing with wiremap display, cable length, distance to fault, and IntelliTone toning.',
      location: 'IT Networking & Cyber Lab - Rm 402',
      total: 6,
      available: 5,
      condition: 'excellent',
      status: 'available',
      image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      max_days: 5
    },
    {
      category: 'Information Technology (BSIT)',
      name: 'Dell Precision 7770 Mobile Workstation (RTX A4500, 64GB)',
      asset_tag: 'EQ-IT-0103',
      model_number: 'PREC-7770',
      description: 'Intel Core i9, 64GB DDR5, Nvidia RTX A4500 16GB GPU. Dedicated for systems development, virtualization, and machine learning.',
      location: 'IT Innovation Lab - Counter Desk',
      total: 10,
      available: 8,
      condition: 'excellent',
      status: 'available',
      image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80',
      max_days: 7
    },
    {
      category: 'Information Technology (BSIT)',
      name: 'Raspberry Pi 4 Model B (8GB) Embedded IoT Lab Bundle',
      asset_tag: 'EQ-IT-0104',
      model_number: 'RPI4-8GB-KIT',
      description: 'Complete IoT bundle with breadboard, GPIO breakout, ultrasonic sensors, relay modules, and 64GB microSD.',
      location: 'IoT & Embedded Systems Lab - Bay 2',
      total: 15,
      available: 12,
      condition: 'good',
      status: 'available',
      image_url: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=600&q=80',
      max_days: 14
    },

    // 2. BSHM Equipment
    {
      category: 'Hospitality Management (BSHM)',
      name: 'Commercial Sous Vide Precision Immersion Circulator & Bath',
      asset_tag: 'EQ-HM-0201',
      model_number: 'SV-PRO-1200',
      description: 'Professional 1200W commercial immersion circulator with digital PID temperature stability (+/- 0.05C) for culinary arts practicals.',
      location: 'Culinary Laboratory - Station 4',
      total: 5,
      available: 4,
      condition: 'excellent',
      status: 'available',
      image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
      max_days: 3
    },
    {
      category: 'Hospitality Management (BSHM)',
      name: 'Professional Barista Espresso Calibration Kit & Tamper',
      asset_tag: 'EQ-HM-0202',
      model_number: 'BARISTA-CAL-58',
      description: '58mm precision calibrated tamper, VST precision baskets, digital shot timer scale, and milk steaming thermistor.',
      location: 'Hospitality Beverage & Bar Lab - Counter 1',
      total: 6,
      available: 5,
      condition: 'excellent',
      status: 'available',
      image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
      max_days: 4
    },
    {
      category: 'Hospitality Management (BSHM)',
      name: 'HACCP Dual Infrared & Penetration Probe Food Thermometer',
      asset_tag: 'EQ-HM-0203',
      model_number: 'FLUKE-FOODPRO-PLUS',
      description: 'Non-contact infrared surface scan and folding internal probe for monitoring critical food holding and cooking temperatures.',
      location: 'Food Safety & Sanitation Hub - Cabinet A',
      total: 8,
      available: 8,
      condition: 'good',
      status: 'available',
      image_url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
      max_days: 3
    },
    {
      category: 'Hospitality Management (BSHM)',
      name: 'Brix Sugar Refractometer & Wine Specific Gravity Gauge',
      asset_tag: 'EQ-HM-0204',
      model_number: 'ATC-BRIX-32',
      description: 'Optical handheld refractometer with automatic temperature compensation for beverage management and syrup testing.',
      location: 'Hospitality Beverage & Bar Lab - Counter 1',
      total: 7,
      available: 7,
      condition: 'good',
      status: 'available',
      image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
      max_days: 5
    },

    // 3. BSCRIM Equipment
    {
      category: 'Criminology & Forensics (BSCRIM)',
      name: 'Forensic Latent Fingerprint Developing & Magnetic Powder Kit',
      asset_tag: 'EQ-CRIM-0301',
      model_number: 'SIRCHIE-LP-400',
      description: 'Standard forensic latent print kit: bichromatic powders, magnetic wands, lifting tape, backing cards, and 10x ridge magnifier.',
      location: 'Forensic Science & Dactyloscopy Lab - Rm 201',
      total: 10,
      available: 8,
      condition: 'excellent',
      status: 'available',
      image_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      max_days: 5
    },
    {
      category: 'Criminology & Forensics (BSCRIM)',
      name: 'Crime Scene Alternate Light Source (ALS / UV Luminescence Kit)',
      asset_tag: 'EQ-CRIM-0302',
      model_number: 'FORENSIC-ALS-455',
      description: 'High-intensity multi-wavelength forensic flashlight (UV 365nm, Blue 455nm) with yellow and orange contrast goggles for biological evidence.',
      location: 'Criminalistics Evidence Room - Locker 2',
      total: 4,
      available: 3,
      condition: 'excellent',
      status: 'available',
      image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
      max_days: 3
    },
    {
      category: 'Criminology & Forensics (BSCRIM)',
      name: 'Mitutoyo Digital Caliper & Bullet Ballistic Measuring Gauge',
      asset_tag: 'EQ-CRIM-0303',
      model_number: 'MIT-500-196',
      description: '6-inch digital caliper with 0.01mm resolution for measuring cartridge casing dimensions, bullet diameters, and toolmark impressions.',
      location: 'Forensic Ballistics Range & Workshop',
      total: 6,
      available: 5,
      condition: 'excellent',
      status: 'available',
      image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80',
      max_days: 7
    },
    {
      category: 'Criminology & Forensics (BSCRIM)',
      name: 'Nikon D7500 Crime Scene Evidence Photography Kit with Scales',
      asset_tag: 'EQ-CRIM-0304',
      model_number: 'NIK-D7500-CSI',
      description: '20.9MP DSLR with AF-S DX 18-140mm VR lens, macro ring flash, L-shaped photomacrographic scale markers, and evidence number placards.',
      location: 'Crime Scene Simulation Bay - Cage C',
      total: 5,
      available: 3,
      condition: 'good',
      status: 'available',
      image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
      max_days: 4
    },

    // 4. Bachelor Science of Education Equipment
    {
      category: 'Education & Instructional Media',
      name: 'IPEVO V4K Ultra HD 8MP USB Document Camera',
      asset_tag: 'EQ-ED-0401',
      model_number: 'V4K-UHD-8MP',
      description: 'Multi-jointed stand document camera with 8MP Sony sensor, fast autofocus, and noise-reduction microphone for demonstration teaching.',
      location: 'Micro-Teaching Center - Rm 105',
      total: 8,
      available: 7,
      condition: 'excellent',
      status: 'available',
      image_url: 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=600&q=80',
      max_days: 7
    },
    {
      category: 'Education & Instructional Media',
      name: 'Epson PowerLite 2250U Full HD Presentation Projector',
      asset_tag: 'EQ-ED-0402',
      model_number: 'EPSON-2250U',
      description: '5,000 lumens Full HD 1080p 3LCD projector with HDMI/VGA and wireless screen mirroring for student teacher presentations.',
      location: 'Instructional Media Store - Shelf 3',
      total: 6,
      available: 5,
      condition: 'good',
      status: 'available',
      image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
      max_days: 5
    },
    {
      category: 'Education & Instructional Media',
      name: 'Wireless Dual Lavalier Lapel Mic & Portable PA Speaker System',
      asset_tag: 'EQ-ED-0403',
      model_number: 'PA-VOICE-PRO',
      description: 'Dual wireless UHF lapel bodypack transmitters with rechargeable 80W portable speaker for field demonstration and classroom teaching.',
      location: 'Instructional Media Store - Shelf 3',
      total: 7,
      available: 6,
      condition: 'excellent',
      status: 'available',
      image_url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80',
      max_days: 4
    },
    {
      category: 'Education & Instructional Media',
      name: 'General Science Teaching Demonstration Glassware & Balance Set',
      asset_tag: 'EQ-ED-0404',
      model_number: 'SCI-ED-SET-10',
      description: 'Standard science education demonstration apparatus: spring balances, optical lenses, prism, graduated cylinders, and beaker set.',
      location: 'Science Education Laboratory - Rm 108',
      total: 10,
      available: 9,
      condition: 'good',
      status: 'available',
      image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
      max_days: 7
    }
  ];

  const equipMap = {};
  for (const item of equipmentList) {
    const catId = catMap[item.category] || null;
    const res = equipInsert.run(
      catId,
      item.name,
      item.asset_tag,
      item.model_number,
      item.description,
      item.location,
      item.total,
      item.available,
      item.condition,
      item.status,
      item.image_url,
      item.max_days
    );
    equipMap[item.asset_tag] = Number(res.lastInsertRowid);
  }

  console.log('--- Seeding Borrow Requests in Various Lifecycle States ---');
  const reqInsert = db.prepare(`
    INSERT INTO borrow_requests (
      reference_code, user_id, equipment_id, quantity, borrow_date,
      return_date, actual_return_date, purpose, course_code, faculty_sponsor,
      notes, status, approver_id, approval_notes, approved_at,
      dispatched_by, dispatched_at, returned_to, return_condition,
      damage_notes, fine_amount, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const today = new Date();
  const formatYMD = (d) => d.toISOString().split('T')[0];

  const dMinus10 = new Date(today); dMinus10.setDate(today.getDate() - 10);
  const dMinus5 = new Date(today); dMinus5.setDate(today.getDate() - 5);
  const dMinus3 = new Date(today); dMinus3.setDate(today.getDate() - 3);
  const dMinus1 = new Date(today); dMinus1.setDate(today.getDate() - 1);
  const dPlus2 = new Date(today); dPlus2.setDate(today.getDate() + 2);
  const dPlus5 = new Date(today); dPlus5.setDate(today.getDate() + 5);

  // 1. Dispatched / Active Loan (BSIT Student Julian Davies has Fluke Cable Verifier)
  reqInsert.run(
    'BRW-2026-IT01A',
    student1Id,
    equipMap['EQ-IT-0102'],
    1,
    formatYMD(dMinus3),
    formatYMD(dPlus2),
    null,
    'Structured Cabling and Rack Patch Termination Practical Exam',
    'IT-221',
    'Dr. Marcus Reyes',
    'Need tone generator probe for server room tracing.',
    'dispatched',
    staffId,
    'Approved. Return with complete RJ45 adapter patch cord.',
    dMinus3.toISOString(),
    staffId,
    dMinus3.toISOString(),
    null,
    null,
    null,
    0.0,
    dMinus3.toISOString()
  );

  // 2. Pending Request (BSHM Student Gabriel Ramos requesting Sous Vide Immersion Circulator)
  reqInsert.run(
    'BRW-2026-HM02B',
    student3Id,
    equipMap['EQ-HM-0201'],
    1,
    formatYMD(today),
    formatYMD(dPlus5),
    null,
    'Molecular Gastronomy & Vacuum Cooking Practical Assessment',
    'HM-310',
    'Chef Instructor A. Gomez',
    'Clean sanitized food-grade water container ready.',
    'pending',
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    0.0,
    today.toISOString()
  );

  // 3. Approved / Ready for Pickup (Education Student Claire Mendoza has Document Camera)
  reqInsert.run(
    'BRW-2026-ED03C',
    student4Id,
    equipMap['EQ-ED-0401'],
    1,
    formatYMD(today),
    formatYMD(dPlus2),
    null,
    'Demonstration Teaching in Science & Math Micro-Session',
    'EDUC-401',
    'Prof. Eleanor Hawthorne',
    'Will use with laptop HDMI presentation.',
    'approved',
    staffId,
    'Approved. Collect at Instructional Media Desk Locker #3.',
    today.toISOString(),
    null,
    null,
    null,
    null,
    null,
    0.0,
    today.toISOString()
  );

  // 4. Overdue Loan (BSCRIM Student Maria Santos has Evidence Camera overdue)
  reqInsert.run(
    'BRW-2026-CR04D',
    student2Id,
    equipMap['EQ-CRIM-0304'],
    1,
    formatYMD(dMinus10),
    formatYMD(dMinus1),
    null,
    'Crime Scene Simulation: Homicide Investigation Documentation & Photomacrography',
    'CRIM-315',
    'Atty. R. Valderama',
    'Photographed evidence scales in simulated indoor scene.',
    'dispatched',
    staffId,
    'Standard release with battery and 64GB SD card.',
    dMinus10.toISOString(),
    staffId,
    dMinus10.toISOString(),
    null,
    null,
    null,
    0.0,
    dMinus10.toISOString()
  );

  // 5. Completed / Returned Loan (BSIT Faculty Dr. Marcus Reyes returned Cisco Switch)
  reqInsert.run(
    'BRW-2026-IT05E',
    facultyId,
    equipMap['EQ-IT-0101'],
    1,
    formatYMD(dMinus10),
    formatYMD(dMinus5),
    formatYMD(dMinus5),
    'Faculty Network Security Demo: VLAN Trunking & Access List Configuration',
    'IT-405',
    'Self / IT Program Head',
    'All console cables and power cord returned.',
    'returned',
    staffId,
    'Approved for faculty demonstration.',
    dMinus10.toISOString(),
    staffId,
    dMinus10.toISOString(),
    staffId,
    'excellent',
    'Console cable, rack brackets, and power cable verified. Clean return.',
    0.0,
    dMinus10.toISOString()
  );

  console.log('--- Seeding Notifications ---');
  const notifInsert = db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, is_read, link)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  notifInsert.run(
    student1Id,
    'Active Loan Reminder (BSIT)',
    'Your loan for Fluke Networks MicroScanner2 (Ref: BRW-2026-IT01A) is due in 2 days.',
    'info',
    0,
    '/dashboard'
  );

  notifInsert.run(
    student4Id,
    'Borrow Request Approved! (BSED) 🎉',
    'Your request for IPEVO V4K Document Camera (Ref: BRW-2026-ED03C) is approved and ready for pickup at Media Desk Locker #3.',
    'success',
    0,
    '/dashboard'
  );

  notifInsert.run(
    student2Id,
    'OVERDUE NOTICE ⚠️ (BSCRIM)',
    'Nikon D7500 Evidence Camera (Ref: BRW-2026-CR04D) is past due. Please return to Central Lab Custody immediately.',
    'danger',
    0,
    '/dashboard'
  );

  console.log('--- Seeding System Audit Trail ---');
  const auditInsert = db.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  auditInsert.run(adminId, 'INITIAL_SEED', 'system', 0, JSON.stringify({ note: 'CampusEquip populated for BSIT, BSHM, BSCRIM, BSED' }), dMinus10.toISOString());
  auditInsert.run(staffId, 'APPROVE_REQUEST', 'borrow_requests', 1, JSON.stringify({ ref: 'BRW-2026-IT01A' }), dMinus3.toISOString());
  auditInsert.run(staffId, 'DISPATCH_EQUIPMENT', 'borrow_requests', 1, JSON.stringify({ ref: 'BRW-2026-IT01A', qty: 1 }), dMinus3.toISOString());
  auditInsert.run(staffId, 'RETURN_EQUIPMENT', 'borrow_requests', 5, JSON.stringify({ ref: 'BRW-2026-IT05E', condition: 'excellent' }), dMinus5.toISOString());

  console.log('=======================================================');
  console.log(' Database seeded successfully for Academic Programs!');
  console.log(' Academic Departments Configured:');
  console.log('   1. Bachelor Science of information technology(BSIT)');
  console.log('   2. Bachelor Science of hospitality Management(BSHM)');
  console.log('   3. Bachelor Science of Criminology(BSCRIM)');
  console.log('   4. Bachelor Science of Education');
  console.log(' Demo Accounts Created:');
  console.log('   1. Admin:      admin@campusequip.edu     / admin123');
  console.log('   2. Custodian:  custodian@campusequip.edu / staff123');
  console.log('   3. BSIT Stu:   student@campusequip.edu   / student123');
  console.log('   4. BSCRIM Stu: maria.santos@campusequip.edu / student123');
  console.log('   5. BSHM Stu:   gabriel.ramos@campusequip.edu / student123');
  console.log('   6. BSED Stu:   claire.mendoza@campusequip.edu / student123');
  console.log('   7. Faculty:    dr.reyes@campusequip.edu   / password123');
  console.log('=======================================================');
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
