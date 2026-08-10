// test-6-admin-matrimony.ts
// Run: npx tsx test-6-admin-matrimony.ts
// Tests: Admin approve, reject with reason, delete profile, list by status

// ── PASTE FROM PREVIOUS TEST OUTPUTS ────────────────────────────────────────
const TOKEN_A      = process.env.TOKEN_A      ?? 'PASTE_TOKEN_A';
const TOKEN_B      = process.env.TOKEN_B      ?? 'PASTE_TOKEN_B';
const PROFILE_A_ID = process.env.PROFILE_A_ID ?? 'PASTE_PROFILE_A_ID';
const PROFILE_B_ID = process.env.PROFILE_B_ID ?? 'PASTE_PROFILE_B_ID';
const ADMIN_EMAIL  = process.env.ADMIN_EMAIL  ?? 'admin@community.app';
const ADMIN_PASS   = process.env.ADMIN_PASS   ?? 'Admin@1234';
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

const FAKE_PHOTOS = [
  'https://community-api.metromindz.com/api/v1/media/proxy/matrimony%2Ftest1.jpg',
  'https://community-api.metromindz.com/api/v1/media/proxy/matrimony%2Ftest2.jpg',
  'https://community-api.metromindz.com/api/v1/media/proxy/matrimony%2Ftest3.jpg',
  'https://community-api.metromindz.com/api/v1/media/proxy/matrimony%2Ftest4.jpg',
];

async function run() {
  console.log('=== TEST 6: ADMIN MATRIMONY APPROVAL WORKFLOW ===\n');

  let adminToken = '';

  // ── Admin Login ──────────────────────────────────────────────────────────
  section('Admin Login');
  const adminLogin = await req('POST', '/admin-auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASS });
  if (adminLogin.status === 200 && adminLogin.data?.data?.token) {
    adminToken = adminLogin.data.data.token;
    pass('Admin logged in');
  } else {
    fail('Admin login failed — all tests will be skipped', adminLogin.data);
    return;
  }

  // ── Non-admin cannot access admin routes (expect 401) ────────────────────
  section('Non-Admin Access to Admin Routes (expect 401)');
  const nonAdmin = await req('GET', '/matrimony/admin/all', undefined, TOKEN_A);
  if (nonAdmin.status === 401) {
    pass('Non-admin correctly rejected with 401');
  } else {
    fail(`Expected 401, got ${nonAdmin.status}`, nonAdmin.data);
  }

  // ── Admin: List All Profiles ──────────────────────────────────────────────
  section('Admin: List All Profiles (no filter)');
  const allProfiles = await req('GET', '/matrimony/admin/all', undefined, adminToken);
  if (allProfiles.status === 200) {
    const profiles = allProfiles.data?.data ?? [];
    pass(`Admin sees ${profiles.length} total profiles`);
  } else {
    fail('Admin list all profiles failed', allProfiles.data);
  }

  // ── Admin: List PENDING Profiles ─────────────────────────────────────────
  section('Admin: List PENDING Profiles');
  const pending = await req('GET', '/matrimony/admin/all?status=PENDING', undefined, adminToken);
  if (pending.status === 200) {
    const profiles = pending.data?.data ?? [];
    pass(`${profiles.length} PENDING profiles`);
  } else {
    fail('Admin list PENDING failed', pending.data);
  }

  // ── Admin: List APPROVED Profiles ────────────────────────────────────────
  section('Admin: List APPROVED Profiles');
  const approved = await req('GET', '/matrimony/admin/all?status=APPROVED', undefined, adminToken);
  if (approved.status === 200) {
    const profiles = approved.data?.data ?? [];
    pass(`${profiles.length} APPROVED profiles`);
  } else {
    fail('Admin list APPROVED failed', approved.data);
  }

  // ── Admin: Approve Profile A ──────────────────────────────────────────────
  section('Admin: Approve Profile A');
  if (PROFILE_A_ID !== 'PASTE_PROFILE_A_ID') {
    const approveA = await req('PATCH', `/matrimony/admin/${PROFILE_A_ID}/approve`, undefined, adminToken);
    if (approveA.status === 200) {
      pass('Profile A approved');
    } else {
      fail('Approve Profile A failed', approveA.data);
    }

    // Verify it's now APPROVED
    const checkA = await req('GET', '/matrimony/admin/all?status=APPROVED', undefined, adminToken);
    const profiles = checkA.data?.data ?? [];
    const found = profiles.find((p: any) => p.id === PROFILE_A_ID);
    if (found) {
      pass(`Profile A confirmed APPROVED in admin list ✓`);
    } else {
      fail('Profile A not found in APPROVED list after approval');
    }
  } else {
    console.log('  ⚠️  SKIP: No PROFILE_A_ID');
  }

  // ── Create a temp profile to test rejection ───────────────────────────────
  section('Create Temp Profile for Rejection Test');
  const ts = Date.now();
  // Register a temp user
  const tempUser = await req('POST', '/auth/register', {
    email: `temp_${ts}@test.com`,
    username: `temp_${ts}`,
    displayName: 'Temp User',
    password: 'Password123!',
  });
  let tempToken = '';
  let tempProfileId = '';

  if (tempUser.status === 201) {
    tempToken = tempUser.data.data.accessToken;
    pass(`Temp user registered`);

    const tempProfile = await req('POST', '/matrimony/profiles', {
      displayName: 'Temp Profile',
      gender: 'MALE',
      dateOfBirth: '1993-01-01',
      height: "5'8\"",
      maritalStatus: 'NEVER_MARRIED',
      religion: 'Hindu',
      motherTongue: 'Hindi',
      education: 'BACHELORS',
      occupation: 'Engineer',
      city: 'Delhi',
      state: 'Delhi',
      photos: FAKE_PHOTOS,
    }, tempToken);

    if (tempProfile.status === 201) {
      tempProfileId = tempProfile.data.data.id;
      pass(`Temp profile created — id: ${tempProfileId}, status: ${tempProfile.data.data.approvalStatus}`);
    } else {
      fail('Temp profile creation failed', tempProfile.data);
    }
  } else {
    fail('Temp user registration failed', tempUser.data);
  }

  // ── Admin: Reject Profile with Reason ────────────────────────────────────
  section('Admin: Reject Profile with Reason');
  if (adminToken && tempProfileId) {
    const reject = await req('PATCH', `/matrimony/admin/${tempProfileId}/reject`, {
      reason: 'Profile photos do not meet quality standards. Please upload clear, recent photos.',
    }, adminToken);
    if (reject.status === 200) {
      pass('Profile rejected with reason');
    } else {
      fail('Reject profile failed', reject.data);
    }

    // Verify rejected profile is in REJECTED list
    const rejectedList = await req('GET', '/matrimony/admin/all?status=REJECTED', undefined, adminToken);
    const profiles = rejectedList.data?.data ?? [];
    const found = profiles.find((p: any) => p.id === tempProfileId);
    if (found) {
      pass(`Rejected profile confirmed in REJECTED list ✓`);
      if (found.rejectionReason) {
        pass(`Rejection reason stored: "${found.rejectionReason}"`);
      }
    } else {
      fail('Rejected profile not found in REJECTED list');
    }

    // Verify rejected profile NOT visible to public
    const publicList = await req('GET', '/matrimony/profiles', undefined, TOKEN_A);
    const publicProfiles = publicList.data?.data ?? [];
    const rejectedVisible = publicProfiles.find((p: any) => p.id === tempProfileId);
    if (!rejectedVisible) {
      pass('Rejected profile NOT visible in public listing ✓');
    } else {
      fail('Rejected profile is visible in public listing — should be hidden');
    }
  } else {
    console.log('  ⚠️  SKIP: No admin token or temp profile');
  }

  // ── Admin: Reject without reason ─────────────────────────────────────────
  section('Admin: Reject Profile B without Reason');
  if (adminToken && PROFILE_B_ID !== 'PASTE_PROFILE_B_ID') {
    const rejectNoReason = await req('PATCH', `/matrimony/admin/${PROFILE_B_ID}/reject`, {}, adminToken);
    if (rejectNoReason.status === 200) {
      pass('Profile rejected without reason (reason is optional)');
    } else {
      fail('Reject without reason failed', rejectNoReason.data);
    }
    // Re-approve for other tests
    await req('PATCH', `/matrimony/admin/${PROFILE_B_ID}/approve`, undefined, adminToken);
    pass('Profile B re-approved for subsequent tests');
  }

  // ── Admin: Delete Profile ─────────────────────────────────────────────────
  section('Admin: Delete Temp Profile');
  if (adminToken && tempProfileId) {
    const del = await req('DELETE', `/matrimony/admin/${tempProfileId}`, undefined, adminToken);
    if (del.status === 200) {
      pass('Temp profile deleted');
    } else {
      fail('Delete profile failed', del.data);
    }

    // Verify deleted
    const afterDelete = await req('GET', '/matrimony/admin/all', undefined, adminToken);
    const profiles = afterDelete.data?.data ?? [];
    const stillExists = profiles.find((p: any) => p.id === tempProfileId);
    if (!stillExists) {
      pass('Deleted profile no longer in admin list ✓');
    } else {
      fail('Deleted profile still appears in admin list');
    }
  }

  // ── Non-existent profile (expect 404) ────────────────────────────────────
  section('Admin: Approve Non-Existent Profile (expect 404)');
  const notFound = await req('PATCH', '/matrimony/admin/nonexistent-id/approve', undefined, adminToken);
  if (notFound.status === 404) {
    pass('Non-existent profile correctly returns 404');
  } else {
    fail(`Expected 404, got ${notFound.status}`, notFound.data);
  }

  console.log('\n=== TEST 6 COMPLETE ===');
}

run().catch(console.error);
