const { db } = require('../db/database');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://mtqedbmgmaazpuatzuue.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_HFzArq2Shslg6nldvh7vVg_2z7ep3GE';
const supabase = createClient(supabaseUrl, supabaseKey);

const generalItems = [
  {
    category_id: 5,
    name: 'Digital Laser Distance Meter & Rangefinder (100m / 328ft)',
    asset_tag: 'EQ-GEN-0501',
    model_number: 'LEICA-DISTO-D2',
    description: 'Precision laser distance meter with Bluetooth Smart, Pythagoras measuring function, and IP54 dust/water protection for cross-department campus survey and project layouts.',
    location: 'General Campus Equipment Center - Rm 101',
    total_quantity: 6,
    available_quantity: 6,
    condition: 'excellent',
    status: 'available',
    image_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
    max_borrow_days: 5
  },
  {
    category_id: 5,
    name: 'Logitech Spotlight Advanced Presentation Remote & Pointer',
    asset_tag: 'EQ-GEN-0502',
    model_number: 'LOGI-SPOTLIGHT-PRO',
    description: 'Advanced wireless digital presentation pointer with cursor control, magnification, timer vibration alerts, and 30-meter wireless range for institutional events and defense presentations.',
    location: 'Audio-Visual Equipment Desk - Rm 102',
    total_quantity: 8,
    available_quantity: 8,
    condition: 'excellent',
    status: 'available',
    image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80',
    max_borrow_days: 3
  },
  {
    category_id: 5,
    name: "Fluke 117 True-RMS Electrician's Multimeter with Non-Contact Voltage",
    asset_tag: 'EQ-GEN-0503',
    model_number: 'FLUKE-117-RMS',
    description: 'Commercial True-RMS digital multimeter with VoltAlert non-contact voltage detection, low input impedance to prevent false readings, and min/max/average recording.',
    location: 'General Engineering & Maintenance Hub - Rm 104',
    total_quantity: 8,
    available_quantity: 8,
    condition: 'excellent',
    status: 'available',
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    max_borrow_days: 5
  },
  {
    category_id: 5,
    name: 'Anker Nebula Mars II Pro Portable Presentation Projector & Tripod',
    asset_tag: 'EQ-GEN-0504',
    model_number: 'NEBULA-MARS2-PRO',
    description: 'Portable outdoor/indoor cinema projector with 500 ANSI lumens, dual 10W audio drivers, 3-hour built-in battery, and heavy-duty adjustable aluminum tripod for student organizations and events.',
    location: 'Student Affairs & Activity Resource Center',
    total_quantity: 5,
    available_quantity: 5,
    condition: 'good',
    status: 'available',
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
    max_borrow_days: 4
  }
];

async function addGeneralItems() {
  console.log('--- Adding General Campus Laboratory Assets ---');
  
  // Find or verify category 5
  let cat = db.prepare("SELECT id FROM categories WHERE name = 'General Campus Laboratory Assets'").get();
  if (!cat) {
    const res = db.prepare("INSERT INTO categories (name, description, icon) VALUES ('General Campus Laboratory Assets', 'Multi-discipline measurement tools, multimedia presenters, and general campus devices', 'Package')").run();
    cat = { id: Number(res.lastInsertRowid) };
  }
  const categoryId = cat.id;

  const insertStmt = db.prepare(`
    INSERT INTO equipment (
      category_id, name, asset_tag, model_number, description,
      location, total_quantity, available_quantity, condition,
      status, image_url, max_borrow_days
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of generalItems) {
    const existing = db.prepare('SELECT id FROM equipment WHERE asset_tag = ?').get(item.asset_tag);
    let itemId;
    if (!existing) {
      const res = insertStmt.run(
        categoryId,
        item.name,
        item.asset_tag,
        item.model_number,
        item.description,
        item.location,
        item.total_quantity,
        item.available_quantity,
        item.condition,
        item.status,
        item.image_url,
        item.max_borrow_days
      );
      itemId = Number(res.lastInsertRowid);
      console.log(` ✅ Inserted into SQLite: ${item.name} (${item.asset_tag}) [ID: ${itemId}]`);
    } else {
      itemId = existing.id;
      console.log(` ℹ Already in SQLite: ${item.name} [ID: ${itemId}]`);
    }

    // Sync to Supabase
    try {
      const { error } = await supabase.from('equipment').upsert({
        id: itemId,
        category_id: categoryId,
        name: item.name,
        asset_tag: item.asset_tag,
        model_number: item.model_number,
        description: item.description,
        location: item.location,
        total_quantity: item.total_quantity,
        available_quantity: item.available_quantity,
        condition: item.condition,
        status: item.status,
        image_url: item.image_url,
        max_borrow_days: item.max_borrow_days
      });
      if (error) {
        console.warn(`Supabase notice for ${item.asset_tag}:`, error.message);
      } else {
        console.log(` ☁ Synced to Supabase: ${item.name}`);
      }
    } catch (e) {
      console.warn(`Supabase sync error:`, e.message);
    }
  }

  // Summary
  const count = db.prepare('SELECT COUNT(*) as count FROM equipment WHERE category_id = ?').get(categoryId).count;
  console.log(`\nGeneral Campus Laboratory Assets now has: ${count} items.`);
}

addGeneralItems().catch(err => {
  console.error(err);
  process.exit(1);
});
