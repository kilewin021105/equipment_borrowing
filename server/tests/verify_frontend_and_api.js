const http = require('http');

const PORT = 5060;
process.env.PORT = PORT;

function fetchUrl(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${PORT}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function verify() {
  console.log('--- Verifying Production Unified Server & Frontend Integration ---');
  require('../server');

  await new Promise(r => setTimeout(r, 600));

  let passed = 0;
  let failed = 0;

  function assert(cond, name) {
    if (cond) {
      console.log(` ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(` ❌ FAIL: ${name}`);
      failed++;
    }
  }

  try {
    // 1. Verify Root index.html serving
    const rootRes = await fetchUrl('/');
    assert(rootRes.status === 200, 'GET / returns 200 OK');
    assert(rootRes.body.includes('CampusEquip') || rootRes.body.includes('<div id="root"></div>'), 'GET / delivers React single-page application entry HTML');

    // 2. Verify SPA fallback routing
    const spaRes = await fetchUrl('/dashboard');
    assert(spaRes.status === 200, 'GET /dashboard resolves SPA HTML fallback');

    // 3. Verify API Health check
    const apiRes = await fetchUrl('/api/health');
    assert(apiRes.status === 200, 'GET /api/health returns 200 OK');
    const apiJson = JSON.parse(apiRes.body);
    assert(apiJson.status === 'healthy', 'API health status is healthy');

    // 4. Verify Categories
    const catRes = await fetchUrl('/api/categories');
    assert(catRes.status === 200, 'GET /api/categories returns 200 OK');
    const catJson = JSON.parse(catRes.body);
    assert(catJson.data.length >= 5, 'All academic laboratory categories present');

    // 5. Verify Equipment Catalog
    const equipRes = await fetchUrl('/api/equipment');
    assert(equipRes.status === 200, 'GET /api/equipment returns 200 OK');
    const equipJson = JSON.parse(equipRes.body);
    assert(equipJson.data.length >= 10, 'All initial academic equipment items accessible');

  } catch (err) {
    console.error('Verification error:', err);
    failed++;
  } finally {
    console.log(`\n=======================================================`);
    console.log(` PRODUCTION VERIFICATION: ${passed} passed, ${failed} failed`);
    console.log(`=======================================================`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

verify();

