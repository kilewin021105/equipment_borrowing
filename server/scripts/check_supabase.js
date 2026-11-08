const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { supabase } = require(path.join(__dirname, '../db/supabaseClient'));

async function checkSupabase() {
  console.log('Testing connection to Supabase:', process.env.SUPABASE_URL);

  const tables = ['categories', 'users', 'equipment', 'borrow_requests', 'notifications', 'audit_logs'];

  for (const table of tables) {
    try {
      const { data, count, error } = await supabase.from(table).select('*', { count: 'exact' });
      if (error) {
        console.log(`Table [${table}]: Error -> ${error.message} (Code: ${error.code})`);
      } else {
        console.log(`Table [${table}]: Connected! Row count = ${count !== null ? count : (data ? data.length : 0)}`);
      }
    } catch (e) {
      console.log(`Table [${table}]: Exception -> ${e.message}`);
    }
  }
}

checkSupabase().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
