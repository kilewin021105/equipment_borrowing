const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { db } = require(path.join(__dirname, '../db/database'));

try {
  const updateRes = db.prepare("UPDATE users SET role = 'admin' WHERE email = 'gaperjohnfred83@gmail.com'").run();
  console.log('SQLite updated rows:', updateRes.changes);

  const users = db.prepare('SELECT id, name, email, role FROM users').all();
  console.log('Current SQLite users:', users);

  // Sync to Supabase
  if (process.env.SUPABASE_URL) {
    const { supabase } = require(path.join(__dirname, '../db/supabaseClient'));
    supabase.from('users').update({ role: 'admin' }).eq('email', 'gaperjohnfred83@gmail.com').then(({ data, error }) => {
      if (error) {
        console.error('Supabase update error:', error.message);
      } else {
        console.log('Supabase updated successfully!');
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
} catch (err) {
  console.error('Error:', err);
  process.exit(1);
}
