// test-2-matrimony-profile.ts
// Run: npx tsx test-2-matrimony-profile.ts
// Tests: Create profile, validation errors, duplicate profile, approval status

// ── PASTE YOUR TOKENS FROM test-1-auth.ts OUTPUT ────────────────────────────
const TOKEN_A = process.env.TOKEN_A ?? 'PASTE_TOKEN_A_HERE';
const TOKEN_B = process.env.TOKEN_B ?? 'PASTE_TOKEN_B_HERE';
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

// Fake photo URLs (already uploaded — use placeholder S3-style URLs)
const FAKE_PHOTOS = [
  'https://community-api.metromindz.com/api/v1/media/proxy/matrimony%2Ftest1.jpg',
  'https://community-api.metromindz.com/api/v1/media/proxy/matrimony%2Ftest2.jpg',
  'https://community-api.metromindz.com/api/v1/media/proxy/matrimony%2Ftest3.jpg',
  'https://community-api.metromindz.com/api/v1/media/proxy/matrimony%2Ftest4.jpg',
];

const VALID_PROFILE_A = {
  displayName: 'Ravi Kumar',
  gender: 'MALE',
  dateOfBirth: '1995-06-15',
  height: "5'10\"",
  maritalStatus: 'NEVER_MARRIED',
  religion: 'Hindu',
  caste: 'Vokkaliga',
  motherTongue: 'Kannada',
  education: 'BACHELORS',
  educationDetails: 'B.Tech Computer Science',
  occupation: 'Software Engineer',
  annualIncome: '12 LPA',
  city: 'Bengaluru',
  state: 'Karnataka',
  aboutMe: 'I am a software engineer who loves coding and travel.',
  hobbies: ['Reading', 'Travelling', 'Cooking'],
  diet: 'Vegetarian',
  familyType: 'Nuclear',
  partnerMinAge: 22,
  partnerMaxAge: 28,
  partnerReligion: 'Hindu',
  photos: FAKE_PHOTOS,
};

const VALID_PROFILE_B = {
  displayName: 'Priya Sharma',
  gender: 'FEMALE',
  dateOfBirth: '1997-03-20',
  height: "5'4\"",
  maritalStatus: 'NEVER_MARRIED',
  religion: 'Hindu',
  caste: 'Brahmin',
  motherTongue: 'Kannada',
  education: 'MASTERS',
  educationDetails: 'M.Tech Data Science',
  occupation: 'Data Scientist',
  annualIncome: '10 LPA',
  city: 'Mysuru',
  state: 'Karnataka',
  aboutMe: 'Data scientist who loves music and dance.',
  hobbies: ['Music', 'Dance', 'Reading'],
  diet: 'Vegetarian',
  familyType: 'Joint',
  partnerMinAge: 25,
  partnerMaxAge: 32,
  photos: FAKE_PHOTOS,
};

async function run() {
  console.log('=== TEST 2: MATRIMONY PROFILE CREATION & VALIDATION ===\n');

  let profileAId = '';
  let profileBId = '';
  let adminToken = '';

  // ── Admin Login ──────────────────────────────────────────────────────────
  section('Admin Login');
  const adminLogin = await req('POST', '/admin-auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASS });
  if (adminLogin.status === 200 && adminLogin.data?.data?.token) {
    adminToken = adminLogin.data.data.token;
    pass(`Admin logged in — token: ${adminToken.slice(0, 20)}...`);
  } else {
    fail('Admin login failed — some approval tests will be skipped', adminLogin.data);
  }

  // ── Missing required fields (expect 400) ─────────────────────────────────
  section('Create Profile — Missing Required Fields (expect 400)');
  const missing = await req('POST', '/matrimony/profiles', { displayName: 'Test' }, TOKEN_A);
  if (missing.status === 400) {
    pass(`Correctly rejected missing fields — message: "${missing.data?.message}"`);
  } else {
    fail(`Expected 400, got ${missing.status}`, missing.data);
  }

  // ── Too few photos (expect 400) ──────────────────────────────────────────
  section('Create Profile — Too Few Photos (expect 400)');
  const fewPhotos = await req('POST', '/matrimony/profiles', {
    ...VALID_PROFILE_A,
    photos: FAKE_PHOTOS.slice(0, 2),
  }, TOKEN_A);
  if (fewPhotos.status === 400) {
    pass(`Correctly rejected < 4 photos — message: "${fewPhotos.data?.message}"`);
  } else {
    fail(`Expected 400, got ${fewPhotos.status}`, fewPhotos.data);
  }

  // ── Too many photos (expect 400) ─────────────────────────────────────────
  section('Create Profile — Too Many Photos (expect 400)');
  const manyPhotos = await req('POST', '/matrimony/profiles', {
    ...VALID_PROFILE_A,
    photos: [...FAKE_PHOTOS, ...FAKE_PHOTOS, 'extra.jpg'],
  }, TOKEN_A);
  if (manyPhotos.status === 400) {
    pass(`Correctly rejected > 5 photos — message: "${manyPhotos.data?.message}"`);
  } else {
    fail(`Expected 400, got ${manyPhotos.status}`, manyPhotos.data);
  }

  // ── No auth token (expect 401) ───────────────────────────────────────────
  section('Create Profile — No Auth Token (expect 401)');
  const noAuth = await req('POST', '/matrimony/profiles', VALID_PROFILE_A);
  if (noAuth.status === 401) {
    pass('Correctly rejected unauthenticated request with 401');
  } else {
    fail(`Expected 401, got ${noAuth.status}`, noAuth.data);
  }

  // ── Create Profile A (MALE) ──────────────────────────────────────────────
  section('Create Profile A — Valid MALE Profile');
  const createA = await req('POST', '/matrimony/profiles', VALID_PROFILE_A, TOKEN_A);
  if (createA.status === 201 && createA.data?.data?.id) {
    profileAId = createA.data.data.id;
    const status = createA.data.data.approvalStatus;
    pass(`Profile A created — id: ${profileAId}`);
    if (status === 'PENDING') {
      pass(`approvalStatus = PENDING ✓`);
    } else {
      fail(`Expected approvalStatus=PENDING, got ${status}`);
    }
  } else {
    fail('Profile A creation failed', createA.data);
  }

  // ── Duplicate profile (expect 409) ───────────────────────────────────────
  section('Create Profile A Again — Duplicate (expect 409)');
  const dup = await req('POST', '/matrimony/profiles', VALID_PROFILE_A, TOKEN_A);
  if (dup.status === 409) {
    pass('Duplicate profile correctly rejected with 409');
  } else {
    fail(`Expected 409, got ${dup.status}`, dup.data);
  }

  // ── Create Profile B (FEMALE) ────────────────────────────────────────────
  section('Create Profile B — Valid FEMALE Profile');
  const createB = await req('POST', '/matrimony/profiles', VALID_PROFILE_B, TOKEN_B);
  if (createB.status === 201 && createB.data?.data?.id) {
    profileBId = createB.data.data.id;
    pass(`Profile B created — id: ${profileBId}, status: ${createB.data.data.approvalStatus}`);
  } else {
    fail('Profile B creation failed', createB.data);
  }

  // ── Get My Profile ───────────────────────────────────────────────────────
  section('GET /matrimony/my-profile');
  const myProfile = await req('GET', '/matrimony/my-profile', undefined, TOKEN_A);
  if (myProfile.status === 200 && myProfile.data?.data?.id) {
    pass(`My profile fetched — displayName: ${myProfile.data.data.displayName}, age: ${myProfile.data.data.age}`);
  } else {
    fail('GET /my-profile failed', myProfile.data);
  }

  // ── Profiles not visible before approval ─────────────────────────────────
  section('List Profiles — PENDING profiles should NOT appear');
  const listBefore = await req('GET', '/matrimony/profiles', undefined, TOKEN_A);
  if (listBefore.status === 200) {
    const profiles = listBefore.data?.data ?? [];
    const hasPending = profiles.some((p: any) => p.approvalStatus === 'PENDING');
    if (!hasPending) {
      pass(`No PENDING profiles in public list ✓ (${profiles.length} profiles shown)`);
    } else {
      fail('PENDING profiles are visible in public list — should be hidden');
    }
  } else {
    fail('List profiles failed', listBefore.data);
  }

  // ── Admin: Approve Profile A ─────────────────────────────────────────────
  section('Admin: Approve Profile A');
  if (adminToken && profileAId) {
    const approve = await req('PATCH', `/matrimony/admin/${profileAId}/approve`, undefined, adminToken);
    if (approve.status === 200) {
      pass('Profile A approved by admin');
    } else {
      fail('Admin approve failed', approve.data);
    }
  } else {
    console.log('  ⚠️  SKIP: No admin token or profileAId');
  }

  // ── Admin: Approve Profile B ─────────────────────────────────────────────
  section('Admin: Approve Profile B');
  if (adminToken && profileBId) {
    const approve = await req('PATCH', `/matrimony/admin/${profileBId}/approve`, undefined, adminToken);
    if (approve.status === 200) {
      pass('Profile B approved by admin');
    } else {
      fail('Admin approve failed', approve.data);
    }
  } else {
    console.log('  ⚠️  SKIP: No admin token or profileBId');
  }

  // ── Profiles visible after approval ──────────────────────────────────────
  section('List Profiles — APPROVED profiles should appear');
  const listAfter = await req('GET', '/matrimony/profiles', undefined, TOKEN_A);
  if (listAfter.status === 200) {
    const profiles = listAfter.data?.data ?? [];
    pass(`${profiles.length} approved profiles visible after approval`);
    if (profiles.length > 0) {
      pass(`First profile: ${profiles[0].displayName}, gender: ${profiles[0].gender}`);
    }
  } else {
    fail('List profiles after approval failed', listAfter.data);
  }

  // ── Gender-based filtering (MALE sees FEMALE) ─────────────────────────────
  section('Gender Filtering — MALE user should see FEMALE profiles');
  const genderFilter = await req('GET', '/matrimony/profiles', undefined, TOKEN_A);
  if (genderFilter.status === 200) {
    const profiles = genderFilter.data?.data ?? [];
    const allFemale = profiles.every((p: any) => p.gender === 'FEMALE');
    if (allFemale || profiles.length === 0) {
      pass(`Gender filter correct — all ${profiles.length} profiles are FEMALE`);
    } else {
      const males = profiles.filter((p: any) => p.gender === 'MALE');
      fail(`Found ${males.length} MALE profiles in MALE user's feed — should be 0`);
    }
  } else {
    fail('Gender filter test failed', genderFilter.data);
  }

  // ── Admin: List All Profiles ─────────────────────────────────────────────
  section('Admin: List All Profiles');
  if (adminToken) {
    const adminList = await req('GET', '/matrimony/admin/all', undefined, adminToken);
    if (adminList.status === 200) {
      pass(`Admin sees ${adminList.data?.data?.length ?? 0} total profiles`);
    } else {
      fail('Admin list profiles failed', adminList.data);
    }

    const pendingList = await req('GET', '/matrimony/admin/all?status=PENDING', undefined, adminToken);
    if (pendingList.status === 200) {
      pass(`Admin sees ${pendingList.data?.data?.length ?? 0} PENDING profiles`);
    } else {
      fail('Admin list PENDING profiles failed', pendingList.data);
    }
  } else {
    console.log('  ⚠️  SKIP: No admin token');
  }

  // ── Admin: Reject a profile ──────────────────────────────────────────────
  section('Admin: Reject Profile (create temp profile first)');
  if (adminToken) {
    // We need a 3rd token for this — skip if not available
    console.log('  ⚠️  SKIP: Need a 3rd user token to test rejection (run test-1-auth.ts for a 3rd user)');
  }

  // ── Update Profile ───────────────────────────────────────────────────────
  section('Update Profile A');
  if (profileAId) {
    const update = await req('PUT', `/matrimony/profiles/${profileAId}`, {
      aboutMe: 'Updated: I love hiking and photography.',
      city: 'Bengaluru',
    }, TOKEN_A);
    if (update.status === 200) {
      const newStatus = update.data?.data?.approvalStatus;
      pass(`Profile updated — new approvalStatus: ${newStatus}`);
      if (newStatus === 'PENDING') {
        pass('Re-submitted for approval after update ✓');
      } else {
        fail(`Expected PENDING after update, got ${newStatus}`);
      }
    } else {
      fail('Profile update failed', update.data);
    }
  }

  console.log('\n=== TEST 2 COMPLETE ===');
  console.log('\n📋 Save these for other test scripts:');
  console.log(`PROFILE_A_ID=${profileAId}`);
  console.log(`PROFILE_B_ID=${profileBId}`);
  console.log(`ADMIN_TOKEN=${adminToken}`);
}

run().catch(console.error);
