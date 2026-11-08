const { createClient } = require('@supabase/supabase-js');
const { db } = require('../db/database');

const supabaseUrl = 'https://mtqedbmgmaazpuatzuue.supabase.co';
const supabaseKey = 'sb_publishable_HFzArq2Shslg6nldvh7vVg_2z7ep3GE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncAndVerify() {
  console.log('=======================================================');
  console.log(' CampusEquip | Full Supabase Inspection & Sync');
  console.log(' Target:', supabaseUrl);
  console.log('=======================================================\n');

  const tables = ['categories', 'users', 'equipment', 'borrow_requests', 'notifications', 'audit_logs'];

  for (const table of tables) {
    console.log(`--- Checking table: ${table} ---`);
    const { data: remoteData, error: remoteError, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' });

    if (remoteError) {
      console.error(` ❌ Error reading ${table}:`, remoteError.message);
      continue;
    }

    const localRows = db.prepare(`SELECT * FROM ${table}`).all();
    console.log(` Supabase count: ${remoteData.length} records`);
    console.log(` Local SQLite count: ${localRows.length} records`);

    // If local has records that remote doesn't have, or if we need to sync:
    if (localRows.length > remoteData.length) {
      console.log(` Upserting ${localRows.length} local records into Supabase ${table}...`);
      
      let rowsToUpsert = localRows;
      if (table === 'audit_logs') {
        const existingUsers = db.prepare('SELECT id FROM users').all();
        const validUserIds = new Set(existingUsers.map(u => u.id));
        rowsToUpsert = localRows.map(a => ({
          ...a,
          user_id: validUserIds.has(a.user_id) ? a.user_id : null
        }));
      }

      const { error: upsertError } = await supabase.from(table).upsert(rowsToUpsert, { onConflict: 'id' });
      if (upsertError) {
        console.error(` ❌ Upsert error on ${table}:`, upsertError.message);
      } else {
        console.log(` ✅ Synchronized ${rowsToUpsert.length} records to Supabase ${table}!`);
      }
    } else {
      console.log(` ✅ Table ${table} is fully populated in Supabase!`);
    }

    if (remoteData.length > 0) {
      console.log(` Sample remote row from ${table}:`, JSON.stringify(remoteData[0], null, 2).slice(0, 200) + '...');
    }
    console.log('');
  }

  console.log('=======================================================');
  console.log(' Verification Complete!');
  console.log('=======================================================');
}

syncAndVerify().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});

