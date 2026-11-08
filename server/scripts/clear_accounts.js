const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { db } = require(path.join(__dirname, '../db/database'));

async function clearAllAccounts() {
  console.log('--- Cleaning All User Accounts & Associated Records ---');

  // 1. Clear in local SQLite
  db.exec('PRAGMA foreign_keys = OFF;');
  
  const delRequests = db.prepare('DELETE FROM borrow_requests').run();
  console.log('Cleared borrow_requests:', delRequests.changes);

  const delNotifs = db.prepare('DELETE FROM notifications').run();
  console.log('Cleared notifications:', delNotifs.changes);

  const delAudit = db.prepare('DELETE FROM audit_logs').run();
  console.log('Cleared audit_logs:', delAudit.changes);

  const delUsers = db.prepare('DELETE FROM users').run();
  console.log('Cleared users:', delUsers.changes);

  try {
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('users', 'borrow_requests', 'notifications', 'audit_logs')").run();
  } catch (seqErr) {
    // Ignore if sqlite_sequence doesn't exist
  }

  // Restore 100% equipment stock
  const resetEquip = db.prepare("UPDATE equipment SET available_quantity = total_quantity, status = 'available'").run();
  console.log('Restored equipment availability to 100%:', resetEquip.changes);

  db.exec('PRAGMA foreign_keys = ON;');

  // Verify
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  console.log('Remaining SQLite user count:', userCount);

  // 2. Clear in Supabase if configured
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { supabase } = require(path.join(__dirname, '../db/supabaseClient'));
      console.log('Clearing Supabase users & associated tables...');
      await supabase.from('borrow_requests').delete().neq('id', 0);
      await supabase.from('notifications').delete().neq('id', 0);
      await supabase.from('audit_logs').delete().neq('id', 0);
      const { error: sbUserErr } = await supabase.from('users').delete().neq('id', 0);
      if (sbUserErr) {
        console.warn('Supabase user delete warning:', sbUserErr.message);
      } else {
        console.log('Cleared Supabase users successfully!');
      }
    } catch (sbErr) {
      console.warn('Supabase sync notice:', sbErr.message);
    }
  }

  console.log(' All accounts removed. The system is ready for initial Master Admin creation!');
  process.exit(0);
}

clearAllAccounts().catch((err) => {
  console.error('Clear error:', err);
  process.exit(1);
});
