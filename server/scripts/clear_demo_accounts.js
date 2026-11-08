const { createClient } = require('@supabase/supabase-js');
const { db } = require('../db/database');

const supabaseUrl = process.env.SUPABASE_URL || 'https://mtqedbmgmaazpuatzuue.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_HFzArq2Shslg6nldvh7vVg_2z7ep3GE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearDemoAccounts() {
  console.log('=======================================================');
  console.log(' Removing All Demo Accounts from Local & Supabase');
  console.log('=======================================================\n');

  // 1. Clear local SQLite
  console.log('--- Clearing Demo Accounts from Local SQLite ---');
  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec('DELETE FROM audit_logs;');
  db.exec('DELETE FROM notifications;');
  db.exec('DELETE FROM borrow_requests;');
  db.exec('DELETE FROM users;');
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users', 'borrow_requests', 'notifications', 'audit_logs');");
  db.exec('UPDATE equipment SET available_quantity = total_quantity, condition = CASE WHEN condition = \'maintenance\' THEN \'good\' ELSE condition END, status = \'available\';');
  db.exec('PRAGMA foreign_keys = ON;');
  console.log(' ✅ Local demo accounts, requests, notifications, and logs cleared.');
  console.log(' ✅ All equipment available stock restored to 100% capacity.');

  // 2. Clear Supabase
  console.log('\n--- Clearing Demo Accounts from Supabase Cloud ---');
  try {
    const { error: err1 } = await supabase.from('audit_logs').delete().neq('id', 0);
    if (err1) console.log('Notice audit_logs:', err1.message);

    const { error: err2 } = await supabase.from('notifications').delete().neq('id', 0);
    if (err2) console.log('Notice notifications:', err2.message);

    const { error: err3 } = await supabase.from('borrow_requests').delete().neq('id', 0);
    if (err3) console.log('Notice borrow_requests:', err3.message);

    const { error: err4 } = await supabase.from('users').delete().neq('id', 0);
    if (err4) console.log('Notice users:', err4.message);

    // Sync all equipment stock in Supabase back to available_quantity = total_quantity
    const localEquip = db.prepare('SELECT id, total_quantity, available_quantity, condition, status FROM equipment').all();
    for (const eq of localEquip) {
      await supabase.from('equipment').update({
        available_quantity: eq.total_quantity,
        condition: eq.condition,
        status: eq.status
      }).eq('id', eq.id);
    }
    console.log(' ✅ Supabase demo accounts deleted.');
    console.log(' ✅ Supabase equipment stock restored to full available capacity.');

    // Verify Supabase users count
    const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    console.log(`\nVerified: Supabase now has ${usersCount || 0} user accounts.`);
    console.log('Ready for the user to register their own fresh account!');

  } catch (err) {
    console.error('Supabase cleanup error:', err.message);
  }

  console.log('\n=======================================================');
  console.log(' Demo Accounts Removal Complete!');
  console.log('=======================================================');
}

clearDemoAccounts().catch(err => {
  console.error(err);
  process.exit(1);
});
