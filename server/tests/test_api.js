const http = require('http');

let server;
let app;
const PORT = 5055;
process.env.PORT = PORT;

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting CampusEquip Automated Backend API Test Suite ---\n');
  app = require('../server');
  
  // Wait a moment for server to bind
  await new Promise(r => setTimeout(r, 600));

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(` ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(` ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await makeRequest('GET', '/api/health');
    assert(health.status === 200 && health.body.status === 'healthy', 'GET /api/health returns healthy status');

    // 2. Authentication: Student Login
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'student@campusequip.edu',
      password: 'student123'
    });
    assert(loginRes.status === 200 && loginRes.body.token, 'POST /api/auth/login succeeds with valid student credentials');
    const studentToken = loginRes.body.token;

    // 3. Authentication: Staff Login
    const staffLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'custodian@campusequip.edu',
      password: 'staff123'
    });
    assert(staffLogin.status === 200 && staffLogin.body.user.role === 'staff', 'POST /api/auth/login succeeds for lab staff');
    const staffToken = staffLogin.body.token;

    // 4. Authentication: Admin Login
    const adminLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@campusequip.edu',
      password: 'admin123'
    });
    assert(adminLogin.status === 200 && adminLogin.body.user.role === 'admin', 'POST /api/auth/login succeeds for system admin');
    const adminToken = adminLogin.body.token;

    // 5. Auth /me profile & stats
    const meRes = await makeRequest('GET', '/api/auth/me', null, studentToken);
    assert(meRes.status === 200 && meRes.body.user.email === 'student@campusequip.edu', 'GET /api/auth/me returns authenticated user details');

    // 6. Registration of new user
    const testEmail = `test.borrower.${Date.now()}@campusequip.edu`;
    const regRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Test Borrower Account',
      email: testEmail,
      password: 'password123',
      department: 'Bachelor Science of information technology(BSIT)',
      student_id: 'BSIT-TEST-99'
    });
    assert(regRes.status === 201 && regRes.body.token, 'POST /api/auth/register creates user account and issues JWT');

    // 7. Rejection of duplicate registration
    const dupRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Duplicate',
      email: testEmail,
      password: 'password123'
    });
    assert(dupRes.status === 400 && dupRes.body.success === false, 'POST /api/auth/register rejects duplicate email address');

    // 8. Categories retrieval
    const catRes = await makeRequest('GET', '/api/categories');
    assert(catRes.status === 200 && Array.isArray(catRes.body.data) && catRes.body.data.length > 0, 'GET /api/categories returns populated list with item counts');

    // 9. Equipment Catalog Search and Filter
    const equipRes = await makeRequest('GET', '/api/equipment?search=Cisco');
    assert(equipRes.status === 200 && equipRes.body.data.length > 0, 'GET /api/equipment?search=Cisco returns filtered results');

    // 10. Equipment Creation (Admin only)
    const newAssetTag = `EQ-TEST-${Date.now().toString().slice(-4)}`;
    const targetCatId = catRes.body.data && catRes.body.data.length > 0 ? catRes.body.data[0].id : null;
    const createEquipRes = await makeRequest('POST', '/api/equipment', {
      name: 'FLIR E4 Thermal Imaging Camera',
      category_id: targetCatId,
      asset_tag: newAssetTag,
      model_number: 'FLIR-E4-WIFI',
      description: 'Handheld infrared thermal camera with MSX enhancement.',
      location: 'Physics Lab - Rm 204',
      total_quantity: 3,
      condition: 'excellent',
      status: 'available',
      max_borrow_days: 5
    }, adminToken);
    assert(createEquipRes.status === 201 && createEquipRes.body.data.id, 'POST /api/equipment allows admin to create new asset');
    const createdEquipId = createEquipRes.body.data.id;

    // 11. Role enforcement: Student cannot create equipment
    const studentCreate = await makeRequest('POST', '/api/equipment', {
      name: 'Illegal Equipment',
      asset_tag: 'EQ-ILLEGAL-99',
      location: 'Nowhere',
      total_quantity: 1
    }, studentToken);
    assert(studentCreate.status === 403, 'POST /api/equipment blocks borrower role with 403 Forbidden');

    // 12. Submit Borrow Request as newly registered user
    const borrowRes = await makeRequest('POST', '/api/borrow', {
      equipment_id: createdEquipId,
      quantity: 1,
      borrow_date: '2026-11-06',
      return_date: '2026-11-09',
      purpose: 'Heat sink thermal dissipation testing',
      course_code: 'ME-320',
      faculty_sponsor: 'Dr. Marcus Reyes'
    }, regRes.body.token);
    assert(borrowRes.status === 201 && borrowRes.body.data.reference_code, 'POST /api/borrow creates pending borrow request with ref code');
    const borrowReqId = borrowRes.body.data.id;
    const refCode = borrowRes.body.data.reference_code;

    // 13. Staff reviews and approves request
    const approveRes = await makeRequest('PATCH', `/api/borrow/${borrowReqId}/status`, {
      action: 'approve',
      approval_notes: 'Approved for thermal testing. Please collect at counter.'
    }, staffToken);
    assert(approveRes.status === 200 && approveRes.body.success === true, 'PATCH /api/borrow/:id/status allows staff to approve request');

    // 14. Staff dispatches equipment (handover to borrower)
    const dispatchRes = await makeRequest('PATCH', `/api/borrow/${borrowReqId}/status`, {
      action: 'dispatch'
    }, staffToken);
    assert(dispatchRes.status === 200 && dispatchRes.body.success === true, 'PATCH /api/borrow/:id/status allows staff to dispatch equipment');

    // 15. Verify inventory available quantity decreased
    const equipAfterDispatch = await makeRequest('GET', `/api/equipment/${createdEquipId}`);
    assert(equipAfterDispatch.body.data.available_quantity === 2, 'Available inventory decremented from 3 to 2 upon dispatch');

    // 16. Staff returns equipment (check-in and condition inspection)
    const returnRes = await makeRequest('PATCH', `/api/borrow/${borrowReqId}/status`, {
      action: 'return',
      return_condition: 'excellent',
      damage_notes: 'Clean return. Lens and battery verified.',
      fine_amount: 0.0
    }, staffToken);
    assert(returnRes.status === 200 && returnRes.body.success === true, 'PATCH /api/borrow/:id/status successfully processes return & inspection');

    // 17. Verify inventory available quantity restored
    const equipAfterReturn = await makeRequest('GET', `/api/equipment/${createdEquipId}`);
    assert(equipAfterReturn.body.data.available_quantity === 3, 'Available inventory restored back to 3 upon return');

    // 18. Notifications endpoint
    const notifs = await makeRequest('GET', '/api/notifications', null, regRes.body.token);
    assert(notifs.status === 200 && notifs.body.data.length > 0, 'GET /api/notifications returns user alert notifications');

    // 19. Dashboard Summary Stats
    const statsRes = await makeRequest('GET', '/api/stats/summary', null, adminToken);
    assert(statsRes.status === 200 && statsRes.body.data.totalEquipment > 0, 'GET /api/stats/summary returns accurate system metrics');

    // 20. Analytics Charts
    const analyticsRes = await makeRequest('GET', '/api/stats/analytics', null, adminToken);
    assert(analyticsRes.status === 200 && Array.isArray(analyticsRes.body.data.categoryDistribution), 'GET /api/stats/analytics returns visual distribution metrics');

    // Clean up created test equipment
    await makeRequest('DELETE', `/api/equipment/${createdEquipId}`, null, adminToken);

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    console.log(`\n=======================================================`);
    console.log(` TEST RESULTS: ${passed} passed, ${failed} failed`);
    console.log(`=======================================================`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
