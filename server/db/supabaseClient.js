const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://mtqedbmgmaazpuatzuue.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_HFzArq2Shslg6nldvh7vVg_2z7ep3GE';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

module.exports = {
  supabase,
  supabaseUrl,
  supabaseKey
};

