// test-7-run-all.ts
// Run: npx tsx test-7-run-all.ts
// Runs all tests in sequence with shared state, prints final pass/fail summary

const BASE = 'https://community-api.metromindz.com/api/v1';

// ── Config ───────────────────────────────────────────────────────────────────
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@community.app';
const ADMIN_PASS  = process.env.ADMIN_PASS  ?? 'Admin@1234';

const FAKE_PHOTOS = [
  'https://community-api.metromindz.com/api/v1/media/proxy/matrimony%2Ftest1.jpg',
  'https://community-api.metromindz.com/api/v1/media/proxy/matrimony%2Ftest2.jpg',
  'https://community-api.metromindz.com/api/v1/media/proxy/matrimony%2Ftest3.jpg',
  'https://community-api.metromindz.com/api/v1/media/proxy/matrimony%2Ftest4.jpg',
];

// ── Shared state ─────────────────────────────────────────────────────────────
const state: Record<string, string> = {};

// ── Helpers ──────────────────────────────────────────────────────────────────
const results: { name: string; passed: boolean; detail?: string }[] = [];

function check(name: string, condition: boolean, detail?: string) {
  results.push({ name, passed: condition, detail });
  if (condition) {
    console.log(`  ✅ ${name}`);
  } else {
    console.error(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function section(title: string) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(60));
}

async function api(method: string, url: string, body?: any, token?: string) {
  try {
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
  } catch (e: any) {
    return { status: 0, data: { error: e.message } };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SUITE 1 — AUTH
// ════════════════════════════════════════════════════════════════════════════
async function suiteAuth() {
  section('SUITE 1: AUTH');
  const ts = Date.now();

  const userA = { email: `testa_${ts}@test.com`, username: `testa_${ts}`, displayName: 'Test User A', password: 'Password123!' };
  const userB = { email: `testb_${ts}@test.com`, username: `testb_${ts}`, displayName: 'Test User B', password: 'Password123!' };

  const regA = await api('POST', '/auth/register', userA);
  check('Register User A', regA.status === 201 && !!regA.data?.data?.accessToken);

  const regB = await api('POST', '/auth/register', userB);
  check('Register User B', regB.status === 201 && !!regB.data?.data?.accessToken);

  const dup = await api('POST', '/auth/register', userA);
  check('Duplicate register → 409', dup.status === 409);

  const loginA = await api('POST', '/auth/login', { email: userA.email, password: userA.password });
  check('Login User A', loginA.status === 200 && !!loginA.data?.data?.accessToken);

  const loginB = await api('POST', '/auth/login', { email: userB.email, password: userB.password });
  check('Login User B', loginB.status === 200 && !!loginB.data?.data?.accessToken);

  const badLogin = await api('POST', '/auth/login', { email: userA.email, password: 'wrongpass' });
  check('Wrong password → 401', badLogin.status === 401);

  state.TOKEN_A = loginA.data?.data?.accessToken ?? '';
  state.TOKEN_B = loginB.data?.data?.accessToken ?? '';
  state.USER_A_ID = loginA.data?.data?.user?.id ?? '';
  state.USER_B_ID = loginB.data?.data?.user?.id ?? '';

  const me = await api('GET', '/users/me', undefined, state.TOKEN_A);
  check('GET /users/me with token', me.status === 200 && !!me.data?.data?.id);

  const noToken = await api('GET', '/users/me');
  check('GET /users/me without token → 401', noToken.status === 401);
}

// ════════════════════════════════════════════════════════════════════════════
// SUITE 2 — ADMIN LOGIN
// ════════════════════════════════════════════════════════════════════════════
async function suiteAdminLogin() {
  section('SUITE 2: ADMIN LOGIN');

  const adminLogin = await api('POST', '/admin-auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASS });
  check('Admin login', adminLogin.status === 200 && !!adminLogin.data?.data?.token);
  state.ADMIN_TOKEN = adminLogin.data?.data?.token ?? '';

  const badAdmin = await api('POST', '/admin-auth/login', { email: ADMIN_EMAIL, password: 'wrongpass' });
  check('Admin wrong password → 401', badAdmin.status === 401);
}

// ════════════════════════════════════════════════════════════════════════════
// SUITE 3 — MATRIMONY PROFILE
// ════════════════════════════════════════════════════════════════════════════
async function suiteMatrimonyProfile() {
  section('SUITE 3: MATRIMONY PROFILE CREATION');

  const profileA = {
    displayName: 'Ravi Kumar', gender: 'MALE', dateOfBirth: '1995-06-15',
    height: "5'10\"", maritalStatus: 'NEVER_MARRIED', religion: 'Hindu',
    caste: 'Vokkaliga', motherTongue: 'Kannada', education: 'BACHELORS',
    occupation: 'Software Engineer', annualIncome: '12 LPA',
    city: 'Bengaluru', state: 'Karnataka',
    aboutMe: 'I love coding and travel.',
    partnerMinAge: 22, partnerMaxAge: 28,
    photos: FAKE_PHOTOS,
  };

  const profileB = {
    displayName: 'Priya Sharma', gender: 'FEMALE', dateOfBirth: '1997-03-20',
    height: "5'4\"", maritalStatus: 'NEVER_MARRIED', religion: 'Hindu',
    motherTongue: 'Kannada', education: 'MASTERS',
    occupation: 'Data Scientist', city: 'Mysuru', state: 'Karnataka',
    photos: FAKE_PHOTOS,
  };

  // Validation checks
  const noAuth = await api('POST', '/matrimony/profiles', profileA);
  check('Create profile without auth → 401', noAuth.status === 401);

  const missingFields = await api('POST', '/matrimony/profiles', { displayName: 'Test' }, state.TOKEN_A);
  check('Create profile missing fields → 400', missingFields.status === 400);

  const fewPhotos = await api('POST', '/matrimony/profiles', { ...profileA, photos: FAKE_PHOTOS.slice(0, 2) }, state.TOKEN_A);
  check('Create profile < 4 photos → 400', fewPhotos.status === 400);

  const manyPhotos = await api('POST', '/matrimony/profiles', { ...profileA, photos: [...FAKE_PHOTOS, ...FAKE_PHOTOS] }, state.TOKEN_A);
  check('Create profile > 5 photos → 400', manyPhotos.status === 400);

  // Valid creation
  const createA = await api('POST', '/matrimony/profiles', profileA, state.TOKEN_A);
  check('Create Profile A (MALE)', createA.status === 201 && !!createA.data?.data?.id);
  check('Profile A status = PENDING', createA.data?.data?.approvalStatus === 'PENDING');
  state.PROFILE_A_ID = createA.data?.data?.id ?? '';

  const createB = await api('POST', '/matrimony/profiles', profileB, state.TOKEN_B);
  check('Create Profile B (FEMALE)', createB.status === 201 && !!createB.data?.data?.id);
  check('Profile B status = PENDING', createB.data?.data?.approvalStatus === 'PENDING');
  state.PROFILE_B_ID = createB.data?.data?.id ?? '';

  const dup = await api('POST', '/matrimony/profiles', profileA, state.TOKEN_A);
  check('Duplicate profile → 409', dup.status === 409);

  const myProfile = await api('GET', '/matrimony/my-profile', undefined, state.TOKEN_A);
  check('GET /my-profile', myProfile.status === 200 && !!myProfile.data?.data?.id);
  check('Age calculated in response', typeof myProfile.data?.data?.age === 'number');

  // PENDING profiles not visible publicly
  const listBefore = await api('GET', '/matrimony/profiles', undefined, state.TOKEN_A);
  const pendingVisible = (listBefore.data?.data ?? []).some((p: any) => p.approvalStatus === 'PENDING');
  check('PENDING profiles hidden from public list', !pendingVisible);
}

// ════════════════════════════════════════════════════════════════════════════
// SUITE 4 — ADMIN APPROVAL
// ════════════════════════════════════════════════════════════════════════════
async function suiteAdminApproval() {
  section('SUITE 4: ADMIN APPROVAL WORKFLOW');

  if (!state.ADMIN_TOKEN) { console.log('  ⚠️  SKIP: No admin token'); return; }

  const nonAdminAccess = await api('GET', '/matrimony/admin/all', undefined, state.TOKEN_A);
  check('Non-admin cannot access admin routes → 401', nonAdminAccess.status === 401);

  const allProfiles = await api('GET', '/matrimony/admin/all', undefined, state.ADMIN_TOKEN);
  check('Admin: list all profiles', allProfiles.status === 200);

  const pendingList = await api('GET', '/matrimony/admin/all?status=PENDING', undefined, state.ADMIN_TOKEN);
  check('Admin: list PENDING profiles', pendingList.status === 200);

  if (state.PROFILE_A_ID) {
    const approveA = await api('PATCH', `/matrimony/admin/${state.PROFILE_A_ID}/approve`, undefined, state.ADMIN_TOKEN);
    check('Admin: approve Profile A', approveA.status === 200);
  }

  if (state.PROFILE_B_ID) {
    const approveB = await api('PATCH', `/matrimony/admin/${state.PROFILE_B_ID}/approve`, undefined, state.ADMIN_TOKEN);
    check('Admin: approve Profile B', approveB.status === 200);
  }

  // Profiles visible after approval
  const listAfter = await api('GET', '/matrimony/profiles', undefined, state.TOKEN_A);
  check('Approved profiles visible in public list', listAfter.status === 200 && (listAfter.data?.data?.length ?? 0) > 0);

  // Gender filter: MALE user sees FEMALE profiles only
  const genderList = listAfter.data?.data ?? [];
  const allFemale = genderList.every((p: any) => p.gender === 'FEMALE');
  check('MALE user sees only FEMALE profiles', allFemale || genderList.length === 0);

  // Reject test with temp profile
  const ts = Date.now();
  const tempReg = await api('POST', '/auth/register', {
    email: `temp_${ts}@test.com`, username: `temp_${ts}`,
    displayName: 'Temp', password: 'Password123!',
  });
  const tempToken = tempReg.data?.data?.accessToken ?? '';
  const tempProfile = await api('POST', '/matrimony/profiles', {
    displayName: 'Temp', gender: 'MALE', dateOfBirth: '1993-01-01',
    height: "5'8\"", maritalStatus: 'NEVER_MARRIED', religion: 'Hindu',
    motherTongue: 'Hindi', education: 'BACHELORS', occupation: 'Engineer',
    city: 'Delhi', state: 'Delhi', photos: FAKE_PHOTOS,
  }, tempToken);
  const tempId = tempProfile.data?.data?.id ?? '';

  if (tempId) {
    const reject = await api('PATCH', `/matrimony/admin/${tempId}/reject`, { reason: 'Poor photo quality' }, state.ADMIN_TOKEN);
    check('Admin: reject profile with reason', reject.status === 200);

    const rejectedList = await api('GET', '/matrimony/admin/all?status=REJECTED', undefined, state.ADMIN_TOKEN);
    const found = (rejectedList.data?.data ?? []).find((p: any) => p.id === tempId);
    check('Rejected profile in REJECTED list', !!found);
    check('Rejection reason stored', !!found?.rejectionReason);

    const publicList = await api('GET', '/matrimony/profiles', undefined, state.TOKEN_A);
    const rejectedVisible = (publicList.data?.data ?? []).find((p: any) => p.id === tempId);
    check('Rejected profile NOT in public list', !rejectedVisible);

    const del = await api('DELETE', `/matrimony/admin/${tempId}`, undefined, state.ADMIN_TOKEN);
    check('Admin: delete profile', del.status === 200);
  }

  const notFound = await api('PATCH', '/matrimony/admin/nonexistent/approve', undefined, state.ADMIN_TOKEN);
  check('Approve non-existent profile → 404', notFound.status === 404);
}

// ════════════════════════════════════════════════════════════════════════════
// SUITE 5 — MATRIMONY INTERESTS
// ════════════════════════════════════════════════════════════════════════════
async function suiteInterests() {
  section('SUITE 5: MATRIMONY INTERESTS');

  const noAuth = await api('POST', '/matrimony/interests', { toProfileId: state.PROFILE_B_ID });
  check('Send interest without auth → 401', noAuth.status === 401);

  const selfInterest = await api('POST', '/matrimony/interests', { toProfileId: state.PROFILE_A_ID }, state.TOKEN_A);
  check('Send interest to self → 400', selfInterest.status === 400);

  const missing = await api('POST', '/matrimony/interests', {}, state.TOKEN_A);
  check('Send interest missing toProfileId → 400', missing.status === 400);

  const send = await api('POST', '/matrimony/interests', {
    toProfileId: state.PROFILE_B_ID,
    message: 'Hi, I liked your profile!',
  }, state.TOKEN_A);
  const isOk = send.status === 201 || send.status === 409;
  check('Send interest A → B', isOk);
  state.INTEREST_ID = send.data?.data?.id ?? '';

  if (send.status === 409) {
    const interests = await api('GET', '/matrimony/interests', undefined, state.TOKEN_A);
    const existing = (interests.data?.data ?? []).find((i: any) =>
      i.fromProfileId === state.PROFILE_A_ID && i.toProfileId === state.PROFILE_B_ID
    );
    state.INTEREST_ID = existing?.id ?? '';
  }

  const dup = await api('POST', '/matrimony/interests', { toProfileId: state.PROFILE_B_ID }, state.TOKEN_A);
  check('Duplicate interest → 409', dup.status === 409);

  const interestsA = await api('GET', '/matrimony/interests', undefined, state.TOKEN_A);
  check('GET /interests for User A', interestsA.status === 200);

  if (state.INTEREST_ID) {
    const wrongUser = await api('PATCH', `/matrimony/interests/${state.INTEREST_ID}`, { status: 'ACCEPTED' }, state.TOKEN_A);
    check('Respond to interest as wrong user → 403', wrongUser.status === 403);

    const badStatus = await api('PATCH', `/matrimony/interests/${state.INTEREST_ID}`, { status: 'MAYBE' }, state.TOKEN_B);
    check('Respond with invalid status → 400', badStatus.status === 400);

    const accept = await api('PATCH', `/matrimony/interests/${state.INTEREST_ID}`, { status: 'ACCEPTED' }, state.TOKEN_B);
    check('User B accepts interest', accept.status === 200 && accept.data?.data?.status === 'ACCEPTED');

    const again = await api('PATCH', `/matrimony/interests/${state.INTEREST_ID}`, { status: 'REJECTED' }, state.TOKEN_B);
    check('Respond to already-responded interest → 400', again.status === 400);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SUITE 6 — LIKE / MATCH / CHAT
// ════════════════════════════════════════════════════════════════════════════
async function suiteLikeMatch() {
  section('SUITE 6: LIKE / MATCH / CHAT');

  const noAuth = await api('POST', '/matrimony/like', { toProfileId: state.PROFILE_B_ID });
  check('Like without auth → 401', noAuth.status === 401);

  const selfLike = await api('POST', '/matrimony/like', { toProfileId: state.PROFILE_A_ID }, state.TOKEN_A);
  check('Like self → 400', selfLike.status === 400);

  const missingId = await api('POST', '/matrimony/like', {}, state.TOKEN_A);
  check('Like missing toProfileId → 400', missingId.status === 400);

  const likeAtoB = await api('POST', '/matrimony/like', { toProfileId: state.PROFILE_B_ID }, state.TOKEN_A);
  check('User A likes User B', likeAtoB.status === 200 || likeAtoB.status === 201);
  const alreadyMatched = likeAtoB.data?.data?.matched === true;

  const likeAgain = await api('POST', '/matrimony/like', { toProfileId: state.PROFILE_B_ID }, state.TOKEN_A);
  check('Duplicate like is idempotent (no error)', likeAgain.status === 200 || likeAgain.status === 201);

  const likeBtoA = await api('POST', '/matrimony/like', { toProfileId: state.PROFILE_A_ID }, state.TOKEN_B);
  check('User B likes User A (mutual)', likeBtoA.status === 200 || likeBtoA.status === 201);
  check('Mutual like creates match', likeBtoA.data?.data?.matched === true || alreadyMatched);
  state.CONVERSATION_ID = likeBtoA.data?.data?.conversationId ?? '';

  const matchesA = await api('GET', '/matrimony/like-matches', undefined, state.TOKEN_A);
  check('GET /like-matches for User A', matchesA.status === 200);
  const matches = matchesA.data?.data ?? [];
  check('At least 1 like-match found', matches.length > 0);
  check('Match has conversationId', matches.length > 0 && !!matches[0].conversationId);

  const matchesB = await api('GET', '/matrimony/like-matches', undefined, state.TOKEN_B);
  check('GET /like-matches for User B', matchesB.status === 200);

  const bestMatches = await api('GET', '/matrimony/matches', undefined, state.TOKEN_A);
  check('GET /matrimony/matches (algorithm)', bestMatches.status === 200);
}

// ════════════════════════════════════════════════════════════════════════════
// SUITE 7 — JOBS
// ════════════════════════════════════════════════════════════════════════════
async function suiteJobs() {
  section('SUITE 7: JOBS MODULE');

  const VALID_JOB = {
    companyName: 'TechCorp India', jobTitle: 'Senior Software Engineer',
    description: 'Looking for a senior engineer with Node.js experience.',
    employmentType: 'FULL_TIME', workMode: 'HYBRID',
    salaryLPA: '15-20 LPA', location: 'Bengaluru', experience: '3-5 years',
    requiredSkills: ['Node.js', 'React', 'TypeScript'],
    vacancyCount: 3, status: 'ACTIVE',
  };

  const missingFields = await api('POST', '/jobs', { companyName: 'Test' }, state.ADMIN_TOKEN);
  check('Create job missing fields → 400', missingFields.status === 400);

  const nonAdmin = await api('POST', '/jobs', VALID_JOB, state.TOKEN_A);
  check('Non-admin create job → 401/403', nonAdmin.status === 401 || nonAdmin.status === 403);

  const createJob = await api('POST', '/jobs', VALID_JOB, state.ADMIN_TOKEN);
  check('Admin creates job', createJob.status === 201 && !!createJob.data?.data?.id);
  state.JOB_ID = createJob.data?.data?.id ?? '';

  const listPublic = await api('GET', '/jobs');
  check('List jobs (public)', listPublic.status === 200);
  const publicJobs = listPublic.data?.data ?? [];
  check('Public jobs have hasApplied field', publicJobs.length === 0 || 'hasApplied' in publicJobs[0]);

  const listAuth = await api('GET', '/jobs', undefined, state.TOKEN_A);
  check('List jobs (authenticated)', listAuth.status === 200);
  const authJobs = listAuth.data?.data ?? [];
  check('Authenticated jobs have hasApplied field', authJobs.length === 0 || 'hasApplied' in authJobs[0]);

  if (state.JOB_ID) {
    const getJob = await api('GET', `/jobs/${state.JOB_ID}`);
    check('GET /jobs/:id', getJob.status === 200 && getJob.data?.data?.id === state.JOB_ID);

    const checkBefore = await api('GET', `/jobs/${state.JOB_ID}/applied`, undefined, state.TOKEN_A);
    check('Check applied before applying → false', checkBefore.status === 200 && checkBefore.data?.data?.applied === false);

    const noAuthApply = await api('POST', `/jobs/${state.JOB_ID}/apply`);
    check('Apply without auth → 401', noAuthApply.status === 401);

    const applyA = await api('POST', `/jobs/${state.JOB_ID}/apply`, undefined, state.TOKEN_A);
    check('User A applies for job', applyA.status === 201 && !!applyA.data?.data?.id);
    state.APPLICATION_ID = applyA.data?.data?.id ?? '';

    const checkAfter = await api('GET', `/jobs/${state.JOB_ID}/applied`, undefined, state.TOKEN_A);
    check('Check applied after applying → true', checkAfter.status === 200 && checkAfter.data?.data?.applied === true);

    const dupApply = await api('POST', `/jobs/${state.JOB_ID}/apply`, undefined, state.TOKEN_A);
    check('Duplicate apply → 409', dupApply.status === 409);

    await api('POST', `/jobs/${state.JOB_ID}/apply`, undefined, state.TOKEN_B);

    const listAfterApply = await api('GET', '/jobs', undefined, state.TOKEN_A);
    const appliedJob = (listAfterApply.data?.data ?? []).find((j: any) => j.id === state.JOB_ID);
    check('Job list shows hasApplied:true after applying', !appliedJob || appliedJob.hasApplied === true);

    const myApps = await api('GET', '/jobs/my-applications', undefined, state.TOKEN_A);
    check('GET /jobs/my-applications', myApps.status === 200 && (myApps.data?.data?.length ?? 0) > 0);

    const adminJobs = await api('GET', '/jobs/admin/all', undefined, state.ADMIN_TOKEN);
    check('Admin: list all jobs', adminJobs.status === 200);

    const applicants = await api('GET', `/jobs/${state.JOB_ID}/applicants`, undefined, state.ADMIN_TOKEN);
    check('Admin: GET /jobs/:id/applicants', applicants.status === 200);
    const apps = applicants.data?.data?.applications ?? [];
    check('Applicants list has entries', apps.length > 0);
    check('Applicant has user.email', apps.length > 0 && !!apps[0].user?.email);
    check('Applicant has user.displayName', apps.length > 0 && !!apps[0].user?.displayName);

    if (state.APPLICATION_ID) {
      const updateStatus = await api('PATCH', `/jobs/applications/${state.APPLICATION_ID}/status`, { status: 'SHORTLISTED' }, state.ADMIN_TOKEN);
      check('Admin: update application status to SHORTLISTED', updateStatus.status === 200 && updateStatus.data?.data?.status === 'SHORTLISTED');
    }

    await api('PUT', `/jobs/${state.JOB_ID}`, { status: 'CLOSED' }, state.ADMIN_TOKEN);
    const applyClosed = await api('POST', `/jobs/${state.JOB_ID}/apply`, undefined, state.TOKEN_B);
    check('Apply to closed job → 400/409', applyClosed.status === 400 || applyClosed.status === 409);
    await api('PUT', `/jobs/${state.JOB_ID}`, { status: 'ACTIVE' }, state.ADMIN_TOKEN);
  }

  const notFound = await api('POST', '/jobs/nonexistent-id/apply', undefined, state.TOKEN_A);
  check('Apply to non-existent job → 404', notFound.status === 404);
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('  FULL TEST SUITE — Community App API');
  console.log('  Base URL:', BASE);
  console.log('═'.repeat(60));

  await suiteAuth();
  await suiteAdminLogin();
  await suiteMatrimonyProfile();
  await suiteAdminApproval();
  await suiteInterests();
  await suiteLikeMatch();
  await suiteJobs();

  // ── Final Summary ─────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  FINAL RESULTS');
  console.log('═'.repeat(60));

  const passed = results.filter(r => r.passed);
  const failed = results.filter(r => !r.passed);

  console.log(`\n  Total : ${results.length}`);
  console.log(`  Passed: ${passed.length} ✅`);
  console.log(`  Failed: ${failed.length} ❌`);

  if (failed.length > 0) {
    console.log('\n  Failed Tests:');
    failed.forEach(r => console.error(`    ❌ ${r.name}${r.detail ? ` — ${r.detail}` : ''}`));
  }

  console.log('\n  Collected State:');
  Object.entries(state).forEach(([k, v]) => {
    const display = v.length > 40 ? v.slice(0, 40) + '...' : v;
    console.log(`    ${k}=${display}`);
  });

  console.log('\n' + '═'.repeat(60));
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
