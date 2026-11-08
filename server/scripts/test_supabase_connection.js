const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mtqedbmgmaazpuatzuue.supabase.co';
const supabaseKey = 'sb_publishable_HFzArq2Shslg6nldvh7vVg_2z7ep3GE';

async function testConnection() {
  console.log('Testing connection to Supabase project...');
  console.log('URL:', supabaseUrl);
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Try to query categories
    console.log('\nChecking table "categories"...');
    const { data: catData, error: catError } = await supabase.from('categories').select('*').limit(1);
    if (catError) {
      console.log('categories error:', catError);
    } else {
      console.log('categories found:', catData);
    }

    // 2. Try to query users
    console.log('\nChecking table "users"...');
    const { data: userData, error: userError } = await supabase.from('users').select('*').limit(1);
    if (userError) {
      console.log('users error:', userError);
    } else {
      console.log('users found:', userData);
    }

    // 3. Try to check OpenAPI schema / REST root
    console.log('\nChecking PostgREST OpenAPI schema...');
    const fetchRes = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`);
    console.log('Status:', fetchRes.status);
    const text = await fetchRes.text();
    console.log('OpenAPI schema preview (first 300 chars):', text.slice(0, 300));

  } catch (err) {
    console.error('Fatal connection error:', err);
  }
}

testConnection();

