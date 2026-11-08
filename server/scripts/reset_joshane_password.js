const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { db } = require(path.join(__dirname, '../db/database'));
const { supabase } = require(path.join(__dirname, '../db/supabaseClient'));

async function resetPassword(newPassword = 'staff123') {
  const hash = await bcrypt.hash(newPassword, 10);

  // Update SQLite
  const res = db.prepare("UPDATE users SET password = ? WHERE email = 'joshane124@gmail.com'").run(hash);
  console.log('SQLite updated rows:', res.changes);

  // Update Supabase
  if (supabase) {
    const { data, error } = await supabase.from('users').update({ password: hash }).eq('email', 'joshane124@gmail.com');
    if (error) {
      console.error('Supabase update error:', error.message);
    } else {
      console.log('Supabase updated successfully!');
    }
  }

  console.log(`Password for joshane124@gmail.com successfully set to: ${newPassword}`);
}

resetPassword().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
