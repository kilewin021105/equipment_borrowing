const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { supabase } = require(path.join(__dirname, '../db/supabaseClient'));
const { db } = require(path.join(__dirname, '../db/database'));

async function testInsert() {
  const users = db.prepare('SELECT * FROM users').all();
  console.log('Users from SQLite to sync:', users);

  for (const u of users) {
    const payload = {
      id: u.id,
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role,
      student_id: u.student_id,
      department: u.department,
      phone: u.phone,
      status: u.status
    };
    console.log('Sending payload to Supabase:', payload);
    const { data, error } = await supabase.from('users').upsert(payload);
    if (error) {
      console.error('Supabase error for user ' + u.email + ':', error);
    } else {
      console.log('Supabase success for user ' + u.email + ':', data);
    }
  }

  // Check what is in Supabase now
  const { data: currentUsers, error: fetchErr } = await supabase.from('users').select('*');
  console.log('Current Supabase users:', currentUsers, 'Fetch error:', fetchErr);
}

testInsert().then(() => process.exit(0)).catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
