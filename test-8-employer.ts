// test-8-employer.ts
// Run: npx tsx test-8-employer.ts
// Tests: Admin create, list, get, update, delete employer + post job under employer

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@community.app';
const ADMIN_PASS  = process.env.ADMIN_PASS  ?? 'Admin@1234';

const BASE = 'https://community-api.metromindz.com/api/v1';

async function req(method: string, url: string, body?: any, token?: string) {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  return { status: res.status, data };
}

function pass(msg: string)                  { console.log(`  ✅ PASS: ${msg}`); }
function fail(msg: string, detail?: any)    { console.error(`  ❌ FAIL: ${msg}`, JSON.stringify(detail ?? '', null, 2)); }
function section(msg: string)               { console.log(`\n━━━ ${msg} ━━━`); }

async function run() {
  console.log('=== TEST 8: EMPLOYER PROFILE CRUD + JOB POSTING ===\n');

  let adminToken = '';
  let employerId = '';
  let jobId      = '';

  // ── Admin Login ────────────────────────────────────────────────────────────
  section('Admin Login');
  const login = await req('POST', '/admin-auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASS });
  if (login.status === 200 && login.data?.data?.token) {
    adminToken = login.data.data.token;
    pass('Admin logged in');
  } else {
    fail('Admin login failed — aborting all tests', login.data);
    return;
  }

  // ── Create Employer ────────────────────────────────────────────────────────
  section('Create Employer');
  const create = await req('POST', '/jobs/employers', {
    name:        'Test Tech Pvt Ltd',
    website:     'https://testtech.example.com',
    industry:    'Technology',
    description: 'A test technology company for automated testing.',
    email:       'hr@testtech.example.com',
    phone:       '+91 98765 43210',
    city:        'Bangalore',
    state:       'Karnataka',
  }, adminToken);

  if (create.status === 201 && create.data?.data?.id) {
    employerId = create.data.data.id;
    pass(`Employer created — id: ${employerId}, name: ${create.data.data.name}`);
  } else {
    fail('Employer creation failed', create.data);
    return; // can't continue without an employer
  }

  // ── List Employers ─────────────────────────────────────────────────────────
  section('List Employers');
  const list = await req('GET', '/jobs/employers', undefined, adminToken);
  if (list.status === 200) {
    const employers = list.data?.data ?? list.data ?? [];
    const found = employers.find((e: any) => e.id === employerId);
    if (found) {
      pass(`Employer appears in list (${employers.length} total) — jobCount: ${found.jobCount ?? 0}`);
    } else {
      fail('Created employer not found in list', list.data);
    }
  } else {
    fail('List employers failed', list.data);
  }

  // ── Get Single Employer ────────────────────────────────────────────────────
  section('Get Single Employer');
  const get = await req('GET', `/jobs/employers/${employerId}`, undefined, adminToken);
  if (get.status === 200 && get.data?.data?.id === employerId) {
    pass(`Employer fetched — name: ${get.data.data.name}, city: ${get.data.data.city}`);
  } else {
    fail('Get employer failed', get.data);
  }

  // ── Update Employer ────────────────────────────────────────────────────────
  section('Update Employer');
  const update = await req('PUT', `/jobs/employers/${employerId}`, {
    description: 'Updated description for Test Tech Pvt Ltd.',
    phone:       '+91 91234 56789',
  }, adminToken);
  if (update.status === 200 && update.data?.data?.description?.includes('Updated')) {
    pass(`Employer updated — description: "${update.data.data.description}"`);
  } else {
    fail('Update employer failed', update.data);
  }

  // ── Post Job Under Employer ────────────────────────────────────────────────
  section('Post Job Under Employer');
  const jobCreate = await req('POST', '/jobs', {
    employerId,
    jobTitle:       'Senior Backend Engineer',
    description:    'Build and maintain scalable backend services.',
    employmentType: 'FULL_TIME',
    workMode:       'HYBRID',
    salaryLPA:      '12-18 LPA',
    location:       'Bangalore, Karnataka',
    experience:     '3-5 years',
    education:      'B.Tech / B.E.',
    requiredSkills: ['Node.js', 'PostgreSQL', 'Docker'],
    vacancyCount:   3,
    hrEmail:        'hr@testtech.example.com',
    status:         'ACTIVE',
  }, adminToken);

  if (jobCreate.status === 201 && jobCreate.data?.data?.id) {
    jobId = jobCreate.data.data.id;
    pass(`Job posted — id: ${jobId}`);
    pass(`  companyName: ${jobCreate.data.data.companyName}`);
    pass(`  companyLogo: ${jobCreate.data.data.companyLogo ?? '(none — no logo uploaded)'}`);
    pass(`  employerId:  ${jobCreate.data.data.employerId}`);

    // Verify companyName was auto-resolved from employer
    if (jobCreate.data.data.companyName === 'Test Tech Pvt Ltd') {
      pass('companyName correctly auto-resolved from employer ✓');
    } else {
      fail(`companyName mismatch — expected "Test Tech Pvt Ltd", got "${jobCreate.data.data.companyName}"`);
    }

    // Verify employerId is linked
    if (jobCreate.data.data.employerId === employerId) {
      pass('employerId correctly linked to job ✓');
    } else {
      fail('employerId not linked correctly', jobCreate.data.data);
    }
  } else {
    fail('Job creation under employer failed', jobCreate.data);
  }

  // ── List Jobs — verify job appears ────────────────────────────────────────
  section('List Jobs (public) — verify job appears');
  const jobs = await req('GET', '/jobs');
  if (jobs.status === 200) {
    const all = jobs.data?.data ?? jobs.data ?? [];
    const found = all.find((j: any) => j.id === jobId);
    if (found) {
      pass(`Job visible in public listing — companyName: ${found.companyName}`);
    } else {
      fail('Job not found in public listing');
    }
  } else {
    fail('List jobs failed', jobs.data);
  }

  // ── Employer list shows updated jobCount ───────────────────────────────────
  section('Employer jobCount after posting job');
  const listAfter = await req('GET', '/jobs/employers', undefined, adminToken);
  if (listAfter.status === 200) {
    const employers = listAfter.data?.data ?? listAfter.data ?? [];
    const emp = employers.find((e: any) => e.id === employerId);
    if (emp && emp.jobCount >= 1) {
      pass(`Employer jobCount updated — jobCount: ${emp.jobCount} ✓`);
    } else {
      fail(`jobCount not updated — got: ${emp?.jobCount}`, emp);
    }
  }

  // ── Non-existent employer (expect 404) ────────────────────────────────────
  section('Get Non-Existent Employer (expect 404)');
  const notFound = await req('GET', '/jobs/employers/nonexistent-id-xyz', undefined, adminToken);
  if (notFound.status === 404) {
    pass('Non-existent employer correctly returns 404 ✓');
  } else {
    fail(`Expected 404, got ${notFound.status}`, notFound.data);
  }

  // ── Post job with invalid employerId (expect 404) ─────────────────────────
  section('Post Job with Invalid employerId (expect 404)');
  const badJob = await req('POST', '/jobs', {
    employerId:     'invalid-employer-id',
    jobTitle:       'Ghost Job',
    description:    'Should not be created.',
    employmentType: 'FULL_TIME',
    workMode:       'REMOTE',
    salaryLPA:      '5 LPA',
    location:       'Mumbai',
    experience:     '1 year',
  }, adminToken);
  if (badJob.status === 404) {
    pass('Invalid employerId correctly returns 404 ✓');
  } else {
    fail(`Expected 404, got ${badJob.status}`, badJob.data);
  }

  // ── Cleanup: Delete Job ────────────────────────────────────────────────────
  section('Cleanup: Delete Test Job');
  if (jobId) {
    const delJob = await req('DELETE', `/jobs/${jobId}`, undefined, adminToken);
    if (delJob.status === 200) {
      pass('Test job deleted');
    } else {
      fail('Delete job failed', delJob.data);
    }
  }

  // ── Cleanup: Delete Employer ───────────────────────────────────────────────
  section('Cleanup: Delete Test Employer');
  const delEmp = await req('DELETE', `/jobs/employers/${employerId}`, undefined, adminToken);
  if (delEmp.status === 200) {
    pass('Test employer deleted');
  } else {
    fail('Delete employer failed', delEmp.data);
  }

  // Verify employer gone
  const gone = await req('GET', `/jobs/employers/${employerId}`, undefined, adminToken);
  if (gone.status === 404) {
    pass('Employer confirmed deleted (404) ✓');
  } else {
    fail(`Employer still exists after delete — status: ${gone.status}`);
  }

  console.log('\n=== TEST 8 COMPLETE ===');
}

run().catch(console.error);
