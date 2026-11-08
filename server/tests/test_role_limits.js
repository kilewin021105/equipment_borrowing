const http = require('http');

const PORT = 5058;
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

async function runRoleLimitTests() {
  console.log('--- Starting Role Quota & Limitation Enforcement Test Suite ---\n');
  require('../server');

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

  const createdUserIds = [];

  try {
    // 1. Check initial role limits endpoint
    const initialLimits = await makeRequest('GET', '/api/auth/role-limits');
    assert(initialLimits.status === 200 && initialLimits.body.data.admin.max === 5 && initialLimits.body.data.staff.max === 7, 'GET /api/auth/role-limits reports admin max=5 and staff max=7');

    // 2. Register 5 Administrators (Quota Cap)
    let firstAdminToken = null;
    for (let i = 1; i <= 5; i++) {
      const res = await makeRequest('POST', '/api/auth/register', {
        name: `Admin User ${i}`,
        email: `admin.quota.${i}.${Date.now()}@test.edu`,
        password: 'password123',
        role: 'admin',
        department: 'Bachelor Science of information technology(BSIT)'
      });
      assert(res.status === 201, `POST /api/auth/register allows admin account #${i} (within 1-5 limit)`);
      if (res.body && res.body.user) createdUserIds.push(res.body.user.id);
      if (i === 1) firstAdminToken = res.body.token;
    }

    // 3. Attempt 6th Administrator (Should be strictly rejected)
    const sixthAdmin = await makeRequest('POST', '/api/auth/register', {
      name: 'Admin User 6 (Excess)',
      email: `admin.quota.6.${Date.now()}@test.edu`,
      password: 'password123',
      role: 'admin',
      department: 'Bachelor Science of information technology(BSIT)'
    });
    assert(sixthAdmin.status === 400 && sixthAdmin.body.message.includes('maximum quota of 5 Administrator accounts'), 'POST /api/auth/register strictly rejects 6th administrator with 400 error');

    // 4. Register 7 Lab Custodians (Quota Cap)
    for (let i = 1; i <= 7; i++) {
      const res = await makeRequest('POST', '/api/auth/register', {
        name: `Staff Custodian ${i}`,
        email: `staff.quota.${i}.${Date.now()}@test.edu`,
        password: 'password123',
        role: 'staff',
        department: 'Bachelor Science of hospitality Management(BSHM)'
      });
      assert(res.status === 201, `POST /api/auth/register allows staff account #${i} (within 1-7 limit)`);
      if (res.body && res.body.user) createdUserIds.push(res.body.user.id);
    }

    // 5. Attempt 8th Lab Custodian (Should be strictly rejected)
    const eighthStaff = await makeRequest('POST', '/api/auth/register', {
      name: 'Staff Custodian 8 (Excess)',
      email: `staff.quota.8.${Date.now()}@test.edu`,
      password: 'password123',
      role: 'staff',
      department: 'Bachelor Science of hospitality Management(BSHM)'
    });
    assert(eighthStaff.status === 400 && eighthStaff.body.message.includes('maximum quota of 7 Lab Custodian accounts'), 'POST /api/auth/register strictly rejects 8th lab custodian with 400 error');

    // 6. Verify role-limits endpoint reflects full quotas
    const fullLimits = await makeRequest('GET', '/api/auth/role-limits');
    assert(fullLimits.body.data.admin.current === 5 && fullLimits.body.data.admin.isFull === true, 'Role limits endpoint confirms admin isFull=true (5/5)');
    assert(fullLimits.body.data.staff.current === 7 && fullLimits.body.data.staff.isFull === true, 'Role limits endpoint confirms staff isFull=true (7/7)');

    // 7. Student registration remains open without quota blocks
    const studentRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Open Access Student',
      email: `student.open.${Date.now()}@test.edu`,
      password: 'password123',
      role: 'borrower',
      department: 'Bachelor Science of Criminology(BSCRIM)'
    });
    assert(studentRes.status === 201, 'POST /api/auth/register permits student/borrower registration smoothly');
    const studentId = studentRes.body.user.id;
    createdUserIds.push(studentId);

    // 8. Admin attempting to promote a borrower to admin when quota is 5/5
    const promoteAdminAttempt = await makeRequest('PUT', `/api/users/${studentId}`, {
      role: 'admin'
    }, firstAdminToken);
    assert(promoteAdminAttempt.status === 400 && promoteAdminAttempt.body.message.includes('maximum 5'), 'PUT /api/users/:id prevents promoting user to admin when 5/5 quota is reached');

    // 9. Admin attempting to promote a borrower to staff when quota is 7/7
    const promoteStaffAttempt = await makeRequest('PUT', `/api/users/${studentId}`, {
      role: 'staff'
    }, firstAdminToken);
    assert(promoteStaffAttempt.status === 400 && promoteStaffAttempt.body.message.includes('maximum 7'), 'PUT /api/users/:id prevents promoting user to staff when 7/7 quota is reached');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    // Clean up created users in SQLite & Supabase
    console.log('\n--- Cleaning up temporary test accounts ---');
    const { db } = require('../db/database');
    db.exec('PRAGMA foreign_keys = OFF;');
    for (const uid of createdUserIds) {
      db.prepare('DELETE FROM users WHERE id = ?').run(uid);
    }
    db.exec('PRAGMA foreign_keys = ON;');

    console.log(`\n=======================================================`);
    console.log(` ROLE LIMITS TEST RESULTS: ${passed} passed, ${failed} failed`);
    console.log(`=======================================================`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runRoleLimitTests();
