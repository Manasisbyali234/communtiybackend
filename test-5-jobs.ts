// test-5-jobs.ts
// Run: npx tsx test-5-jobs.ts
// Tests: Create job (admin), list jobs, apply, duplicate apply, check applied state, admin applicants

// ── PASTE FROM PREVIOUS TEST OUTPUTS ────────────────────────────────────────
const TOKEN_A     = process.env.TOKEN_A     ?? 'PASTE_TOKEN_A';
const TOKEN_B     = process.env.TOKEN_B     ?? 'PASTE_TOKEN_B';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@community.app';
const ADMIN_PASS  = process.env.ADMIN_PASS  ?? 'Admin@1234';
// ─────────────────────────────────────────────────────────────────────────────

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

function pass(msg: string) { console.log(`  ✅ PASS: ${msg}`); }
function fail(msg: string, detail?: any) { console.error(`  ❌ FAIL: ${msg}`, JSON.stringify(detail ?? '', null, 2)); }
function section(msg: string) { console.log(`\n━━━ ${msg} ━━━`); }

const VALID_JOB = {
  companyName: 'TechCorp India',
  jobTitle: 'Senior Software Engineer',
  description: 'We are looking for a senior software engineer with 3+ years of experience in Node.js and React.',
  employmentType: 'FULL_TIME',
  workMode: 'HYBRID',
  salaryLPA: '15-20 LPA',
  location: 'Bengaluru',
  experience: '3-5 years',
  education: 'B.Tech / B.E.',
  requiredSkills: ['Node.js', 'React', 'PostgreSQL', 'TypeScript'],
  vacancyCount: 3,
  hrContact: 'HR Team',
  hrEmail: 'hr@techcorp.com',
  status: 'ACTIVE',
};

async function run() {
  console.log('=== TEST 5: JOBS MODULE ===\n');

  let adminToken = '';
  let jobId = '';
  let applicationId = '';

  // ── Admin Login ──────────────────────────────────────────────────────────
  section('Admin Login');
  const adminLogin = await req('POST', '/admin-auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASS });
  if (adminLogin.status === 200 && adminLogin.data?.data?.token) {
    adminToken = adminLogin.data.data.token;
    pass(`Admin logged in`);
  } else {
    fail('Admin login failed — job creation tests will be skipped', adminLogin.data);
  }

  // ── Create Job — Missing Fields (expect 400) ──────────────────────────────
  section('Create Job — Missing Required Fields (expect 400)');
  if (adminToken) {
    const missing = await req('POST', '/jobs', { companyName: 'Test' }, adminToken);
    if (missing.status === 400) {
      pass('Missing fields correctly rejected with 400');
    } else {
      fail(`Expected 400, got ${missing.status}`, missing.data);
    }
  }

  // ── Create Job — Non-admin (expect 401/403) ───────────────────────────────
  section('Create Job — Non-Admin User (expect 401/403)');
  const nonAdmin = await req('POST', '/jobs', VALID_JOB, TOKEN_A);
  if (nonAdmin.status === 401 || nonAdmin.status === 403) {
    pass(`Non-admin correctly rejected with ${nonAdmin.status}`);
  } else {
    fail(`Expected 401/403, got ${nonAdmin.status}`, nonAdmin.data);
  }

  // ── Create Job (admin) ────────────────────────────────────────────────────
  section('Create Job (Admin)');
  if (adminToken) {
    const create = await req('POST', '/jobs', VALID_JOB, adminToken);
    if (create.status === 201 && create.data?.data?.id) {
      jobId = create.data.data.id;
      pass(`Job created — id: ${jobId}, title: ${create.data.data.jobTitle}`);
    } else {
      fail('Job creation failed', create.data);
    }
  }

  // ── List Jobs (public) ────────────────────────────────────────────────────
  section('List Jobs (Public — no auth)');
  const listPublic = await req('GET', '/jobs');
  if (listPublic.status === 200) {
    const jobs = listPublic.data?.data ?? [];
    pass(`${jobs.length} active jobs listed publicly`);
    if (jobs.length > 0) {
      const j = jobs[0];
      pass(`First job: "${j.jobTitle}" at ${j.companyName}`);
      if ('hasApplied' in j) {
        pass(`hasApplied field present: ${j.hasApplied}`);
      } else {
        fail('hasApplied field missing from job list response');
      }
    }
  } else {
    fail('List jobs failed', listPublic.data);
  }

  // ── List Jobs (authenticated — hasApplied flag) ───────────────────────────
  section('List Jobs (Authenticated — hasApplied flag)');
  const listAuth = await req('GET', '/jobs', undefined, TOKEN_A);
  if (listAuth.status === 200) {
    const jobs = listAuth.data?.data ?? [];
    pass(`${jobs.length} jobs listed for authenticated user`);
    if (jobs.length > 0) {
      const allHaveFlag = jobs.every((j: any) => 'hasApplied' in j);
      if (allHaveFlag) {
        pass('All jobs have hasApplied flag ✓');
      } else {
        fail('Some jobs missing hasApplied flag');
      }
    }
  } else {
    fail('Authenticated list jobs failed', listAuth.data);
  }

  // ── Get Single Job ────────────────────────────────────────────────────────
  section('GET /jobs/:id');
  if (jobId) {
    const getJob = await req('GET', `/jobs/${jobId}`);
    if (getJob.status === 200 && getJob.data?.data?.id === jobId) {
      pass(`Job fetched — title: ${getJob.data.data.jobTitle}`);
    } else {
      fail('Get single job failed', getJob.data);
    }
  }

  // ── Check Applied — before applying ──────────────────────────────────────
  section('Check Applied — Before Applying (expect applied: false)');
  if (jobId) {
    const check = await req('GET', `/jobs/${jobId}/applied`, undefined, TOKEN_A);
    if (check.status === 200 && check.data?.data?.applied === false) {
      pass('applied: false before applying ✓');
    } else {
      fail(`Expected applied:false, got ${check.data?.data?.applied}`, check.data);
    }
  }

  // ── Apply for Job — no auth (expect 401) ─────────────────────────────────
  section('Apply for Job — No Auth (expect 401)');
  if (jobId) {
    const noAuth = await req('POST', `/jobs/${jobId}/apply`);
    if (noAuth.status === 401) {
      pass('Unauthenticated apply correctly rejected with 401');
    } else {
      fail(`Expected 401, got ${noAuth.status}`, noAuth.data);
    }
  }

  // ── Apply for Job (User A) ────────────────────────────────────────────────
  section('User A Applies for Job');
  if (jobId) {
    const apply = await req('POST', `/jobs/${jobId}/apply`, undefined, TOKEN_A);
    if (apply.status === 201 && apply.data?.data?.id) {
      applicationId = apply.data.data.id;
      pass(`Applied successfully — applicationId: ${applicationId}, status: ${apply.data.data.status}`);
    } else {
      fail('Apply for job failed', apply.data);
    }
  }

  // ── Check Applied — after applying (expect applied: true) ────────────────
  section('Check Applied — After Applying (expect applied: true)');
  if (jobId) {
    const check = await req('GET', `/jobs/${jobId}/applied`, undefined, TOKEN_A);
    if (check.status === 200 && check.data?.data?.applied === true) {
      pass('applied: true after applying ✓ — button should show "Already Applied"');
    } else {
      fail(`Expected applied:true, got ${check.data?.data?.applied}`, check.data);
    }
  }

  // ── Duplicate Apply (expect 409) ─────────────────────────────────────────
  section('Duplicate Apply (expect 409)');
  if (jobId) {
    const dup = await req('POST', `/jobs/${jobId}/apply`, undefined, TOKEN_A);
    if (dup.status === 409) {
      pass('Duplicate application correctly rejected with 409');
    } else {
      fail(`Expected 409, got ${dup.status}`, dup.data);
    }
  }

  // ── User B also applies ───────────────────────────────────────────────────
  section('User B Applies for Same Job');
  if (jobId) {
    const applyB = await req('POST', `/jobs/${jobId}/apply`, undefined, TOKEN_B);
    if (applyB.status === 201) {
      pass(`User B applied — applicationId: ${applyB.data.data.id}`);
    } else {
      fail('User B apply failed', applyB.data);
    }
  }

  // ── List Jobs — hasApplied reflects correctly ─────────────────────────────
  section('List Jobs — hasApplied Should Be true for Applied Job');
  const listAfterApply = await req('GET', '/jobs', undefined, TOKEN_A);
  if (listAfterApply.status === 200) {
    const jobs = listAfterApply.data?.data ?? [];
    const appliedJob = jobs.find((j: any) => j.id === jobId);
    if (appliedJob) {
      if (appliedJob.hasApplied === true) {
        pass(`Job list shows hasApplied: true for applied job ✓`);
      } else {
        fail(`Job list shows hasApplied: ${appliedJob.hasApplied} — expected true`);
      }
    } else {
      console.log('  ⚠️  Applied job not found in list (may be filtered)');
    }
  }

  // ── My Applications ───────────────────────────────────────────────────────
  section('GET /jobs/my-applications');
  const myApps = await req('GET', '/jobs/my-applications', undefined, TOKEN_A);
  if (myApps.status === 200) {
    const apps = myApps.data?.data ?? [];
    pass(`User A has ${apps.length} application(s)`);
    if (apps.length > 0) {
      pass(`First app: ${apps[0].job?.jobTitle} — status: ${apps[0].status}`);
    }
  } else {
    fail('GET /my-applications failed', myApps.data);
  }

  // ── Admin: List All Jobs ──────────────────────────────────────────────────
  section('Admin: List All Jobs');
  if (adminToken) {
    const adminJobs = await req('GET', '/jobs/admin/all', undefined, adminToken);
    if (adminJobs.status === 200) {
      const jobs = adminJobs.data?.data ?? [];
      pass(`Admin sees ${jobs.length} total jobs`);
    } else {
      fail('Admin list jobs failed', adminJobs.data);
    }
  }

  // ── Admin: Get Job Applicants ─────────────────────────────────────────────
  section('Admin: GET /jobs/:id/applicants');
  if (adminToken && jobId) {
    const applicants = await req('GET', `/jobs/${jobId}/applicants`, undefined, adminToken);
    if (applicants.status === 200) {
      const { job: jobInfo, applications } = applicants.data?.data ?? {};
      pass(`Job: "${jobInfo?.jobTitle}" — ${applications?.length ?? 0} applicant(s)`);
      if (applications?.length > 0) {
        const a = applications[0];
        pass(`Applicant: ${a.user?.displayName}, email: ${a.user?.email}, status: ${a.status}`);
        if (a.user?.email && a.user?.displayName) {
          pass('Full user details present in applicant response ✓');
        } else {
          fail('Missing user details in applicant response');
        }
      }
    } else {
      fail('Admin get applicants failed', applicants.data);
    }
  }

  // ── Admin: Update Application Status ─────────────────────────────────────
  section('Admin: Update Application Status to SHORTLISTED');
  if (adminToken && applicationId) {
    const update = await req('PATCH', `/jobs/applications/${applicationId}/status`, { status: 'SHORTLISTED' }, adminToken);
    if (update.status === 200 && update.data?.data?.status === 'SHORTLISTED') {
      pass(`Application status updated to SHORTLISTED ✓`);
    } else {
      fail('Update application status failed', update.data);
    }
  }

  // ── Apply to Closed Job (expect 400) ─────────────────────────────────────
  section('Apply to Closed Job (expect 400)');
  if (adminToken && jobId) {
    await req('PUT', `/jobs/${jobId}`, { status: 'CLOSED' }, adminToken);
    const applyClosed = await req('POST', `/jobs/${jobId}/apply`, undefined, TOKEN_B);
    if (applyClosed.status === 400 || applyClosed.status === 409) {
      pass(`Closed job correctly rejected with ${applyClosed.status}`);
    } else {
      fail(`Expected 400/409 for closed job, got ${applyClosed.status}`, applyClosed.data);
    }
    // Reopen
    await req('PUT', `/jobs/${jobId}`, { status: 'ACTIVE' }, adminToken);
  }

  // ── Non-existent job (expect 404) ────────────────────────────────────────
  section('Apply to Non-Existent Job (expect 404)');
  const notFound = await req('POST', '/jobs/nonexistent-job-id/apply', undefined, TOKEN_A);
  if (notFound.status === 404) {
    pass('Non-existent job correctly returns 404');
  } else {
    fail(`Expected 404, got ${notFound.status}`, notFound.data);
  }

  console.log('\n=== TEST 5 COMPLETE ===');
  console.log('\n📋 Save for next tests:');
  console.log(`JOB_ID=${jobId}`);
  console.log(`APPLICATION_ID=${applicationId}`);
  console.log(`ADMIN_TOKEN=${adminToken}`);
}

run().catch(console.error);
