require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');
const { db } = require('../db/database');

async function transfer() {
  console.log('=======================================================');
  console.log(' CampusEquip | Automated Transfer to Supabase');
  console.log('=======================================================\n');

  // Accept credentials from environment or command line args
  const supabaseUrl = process.argv[2] || process.env.SUPABASE_URL;
  const supabaseKey = process.argv[3] || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase Credentials!\n');
    console.log('Usage:');
    console.log('  node server/scripts/transfer_to_supabase.js <SUPABASE_URL> <SUPABASE_SERVICE_ROLE_KEY>\n');
    console.log('Or define in server/.env:');
    console.log('  SUPABASE_URL=https://your-project.supabase.co');
    console.log('  SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key\n');
    console.log('Tip: You can also open the Supabase SQL Editor and run:');
    console.log('  c:\\borrow_system\\supabase_schema_and_data.sql');
    console.log('which will create all tables and insert all data in 1 click!');
    process.exit(1);
  }

  console.log(`Connecting to Supabase at: ${supabaseUrl}...`);
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  try {
    // 1. Categories
    console.log('\n[1/6] Transferring Categories...');
    const localCategories = db.prepare('SELECT id, name, description, icon, created_at FROM categories').all();
    if (localCategories.length > 0) {
      const { data, error } = await supabase.from('categories').upsert(localCategories, { onConflict: 'id' });
      if (error) throw new Error(`Categories transfer failed: ${error.message} (${error.hint || ''})`);
      console.log(` ✅ Transferred ${localCategories.length} categories.`);
    }

    // 2. Users
    console.log('\n[2/6] Transferring Users (with academic programs: BSIT, BSHM, BSCRIM, BSED)...');
    const localUsers = db.prepare('SELECT id, name, email, password, role, student_id, department, phone, status, created_at FROM users').all();
    if (localUsers.length > 0) {
      const { data, error } = await supabase.from('users').upsert(localUsers, { onConflict: 'id' });
      if (error) throw new Error(`Users transfer failed: ${error.message} (${error.hint || ''})`);
      console.log(` ✅ Transferred ${localUsers.length} users.`);
    }

    // 3. Equipment
    console.log('\n[3/6] Transferring Equipment Inventory...');
    const localEquip = db.prepare(`
      SELECT id, category_id, name, asset_tag, model_number, description,
             location, total_quantity, available_quantity, condition, status,
             image_url, max_borrow_days, created_at, updated_at
      FROM equipment
    `).all();
    if (localEquip.length > 0) {
      const { data, error } = await supabase.from('equipment').upsert(localEquip, { onConflict: 'id' });
      if (error) throw new Error(`Equipment transfer failed: ${error.message} (${error.hint || ''})`);
      console.log(` ✅ Transferred ${localEquip.length} equipment assets.`);
    }

    // 4. Borrow Requests
    console.log('\n[4/6] Transferring Borrow Requests & Loans...');
    const localRequests = db.prepare(`
      SELECT id, reference_code, user_id, equipment_id, quantity, borrow_date,
             return_date, actual_return_date, purpose, course_code, faculty_sponsor,
             notes, status, approver_id, approval_notes, approved_at, dispatched_by,
             dispatched_at, returned_to, return_condition, damage_notes, fine_amount,
             created_at, updated_at
      FROM borrow_requests
    `).all();
    if (localRequests.length > 0) {
      const { data, error } = await supabase.from('borrow_requests').upsert(localRequests, { onConflict: 'id' });
      if (error) throw new Error(`Borrow requests transfer failed: ${error.message} (${error.hint || ''})`);
      console.log(` ✅ Transferred ${localRequests.length} borrow records.`);
    }

    // 5. Notifications
    console.log('\n[5/6] Transferring Notifications...');
    const localNotifs = db.prepare('SELECT id, user_id, title, message, type, is_read, link, created_at FROM notifications').all();
    if (localNotifs.length > 0) {
      const { data, error } = await supabase.from('notifications').upsert(localNotifs, { onConflict: 'id' });
      if (error) throw new Error(`Notifications transfer failed: ${error.message} (${error.hint || ''})`);
      console.log(` ✅ Transferred ${localNotifs.length} notifications.`);
    }

    // 6. Audit Logs
    console.log('\n[6/6] Transferring Audit Logs...');
    const localAudit = db.prepare('SELECT id, user_id, action, entity_type, entity_id, details, created_at FROM audit_logs').all();
    if (localAudit.length > 0) {
      const { data, error } = await supabase.from('audit_logs').upsert(localAudit, { onConflict: 'id' });
      if (error) throw new Error(`Audit logs transfer failed: ${error.message} (${error.hint || ''})`);
      console.log(` ✅ Transferred ${localAudit.length} audit log entries.`);
    }

    console.log('\n=======================================================');
    console.log(' 🎉 ALL DATA TRANSFERRED TO SUPABASE SUCCESSFULLY!');
    console.log('=======================================================');
    console.log('Summary of Transferred Records:');
    console.log(` - Categories:      ${localCategories.length}`);
    console.log(` - Users:           ${localUsers.length} (BSIT, BSHM, BSCRIM, BSED)`);
    console.log(` - Equipment:       ${localEquip.length}`);
    console.log(` - Borrow Records:  ${localRequests.length}`);
    console.log(` - Notifications:   ${localNotifs.length}`);
    console.log(` - Audit Logs:      ${localAudit.length}`);
    console.log('=======================================================');

  } catch (err) {
    console.error('\n❌ Transfer Error:', err.message);
    console.log('\nNote: If the tables do not exist in your Supabase project yet,');
    console.log('please run the SQL script in your Supabase SQL Editor first:');
    console.log('  supabase_schema_and_data.sql');
    process.exit(1);
  }
}

transfer();
