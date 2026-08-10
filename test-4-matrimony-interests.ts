// test-4-matrimony-interests.ts
// Run: npx tsx test-4-matrimony-interests.ts
// Tests: Send interest, duplicate interest, respond accept/reject

// ── PASTE FROM PREVIOUS TEST OUTPUTS ────────────────────────────────────────
const TOKEN_A      = process.env.TOKEN_A      ?? 'PASTE_TOKEN_A';
const TOKEN_B      = process.env.TOKEN_B      ?? 'PASTE_TOKEN_B';
const PROFILE_A_ID = process.env.PROFILE_A_ID ?? 'PASTE_PROFILE_A_ID';
const PROFILE_B_ID = process.env.PROFILE_B_ID ?? 'PASTE_PROFILE_B_ID';
const ADMIN_TOKEN  = process.env.ADMIN_TOKEN  ?? 'PASTE_ADMIN_TOKEN';
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

async function run() {
  console.log('=== TEST 4: MATRIMONY INTERESTS ===\n');

  let resolvedAdminToken = ADMIN_TOKEN;
  let interestId = '';

  // ── Admin login ──────────────────────────────────────────────────────────
  if (!resolvedAdminToken || resolvedAdminToken === 'PASTE_ADMIN_TOKEN') {
    const adminLogin = await req('POST', '/admin-auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASS });
    if (adminLogin.status === 200) {
      resolvedAdminToken = adminLogin.data.data.token;
    }
  }

  // ── Ensure profiles are approved ─────────────────────────────────────────
  section('Ensure Profiles Approved');
  if (resolvedAdminToken && PROFILE_A_ID !== 'PASTE_PROFILE_A_ID') {
    await req('PATCH', `/matrimony/admin/${PROFILE_A_ID}/approve`, undefined, resolvedAdminToken);
    await req('PATCH', `/matrimony/admin/${PROFILE_B_ID}/approve`, undefined, resolvedAdminToken);
    pass('Both profiles approved');
  }

  // ── Send interest without auth (expect 401) ───────────────────────────────
  section('Send Interest — No Auth (expect 401)');
  const noAuth = await req('POST', '/matrimony/interests', { toProfileId: PROFILE_B_ID });
  if (noAuth.status === 401) {
    pass('Unauthenticated interest correctly rejected with 401');
  } else {
    fail(`Expected 401, got ${noAuth.status}`, noAuth.data);
  }

  // ── Send interest to self (expect 400) ───────────────────────────────────
  section('Send Interest to Self (expect 400)');
  const selfInterest = await req('POST', '/matrimony/interests', { toProfileId: PROFILE_A_ID }, TOKEN_A);
  if (selfInterest.status === 400) {
    pass('Self-interest correctly rejected with 400');
  } else {
    fail(`Expected 400, got ${selfInterest.status}`, selfInterest.data);
  }

  // ── Missing toProfileId (expect 400) ─────────────────────────────────────
  section('Send Interest — Missing toProfileId (expect 400)');
  const missing = await req('POST', '/matrimony/interests', {}, TOKEN_A);
  if (missing.status === 400) {
    pass('Missing toProfileId correctly rejected with 400');
  } else {
    fail(`Expected 400, got ${missing.status}`, missing.data);
  }

  // ── Send interest A → B ──────────────────────────────────────────────────
  section('User A Sends Interest to User B');
  const sendInterest = await req('POST', '/matrimony/interests', {
    toProfileId: PROFILE_B_ID,
    message: 'Hi Priya, I liked your profile. Would love to connect!',
  }, TOKEN_A);
  if (sendInterest.status === 201 && sendInterest.data?.data?.id) {
    interestId = sendInterest.data.data.id;
    pass(`Interest sent — id: ${interestId}, status: ${sendInterest.data.data.status}`);
  } else if (sendInterest.status === 409) {
    pass('Interest already sent (409 — idempotent check passed)');
    // Fetch existing interest id
    const interests = await req('GET', '/matrimony/interests', undefined, TOKEN_A);
    const existing = (interests.data?.data ?? []).find((i: any) =>
      i.fromProfileId === PROFILE_A_ID && i.toProfileId === PROFILE_B_ID
    );
    if (existing) interestId = existing.id;
  } else {
    fail('Send interest failed', sendInterest.data);
  }

  // ── Duplicate interest (expect 409) ──────────────────────────────────────
  section('Send Duplicate Interest (expect 409)');
  const dup = await req('POST', '/matrimony/interests', { toProfileId: PROFILE_B_ID }, TOKEN_A);
  if (dup.status === 409) {
    pass('Duplicate interest correctly rejected with 409');
  } else {
    fail(`Expected 409, got ${dup.status}`, dup.data);
  }

  // ── Get interests for User A ──────────────────────────────────────────────
  section('GET /matrimony/interests for User A');
  const interestsA = await req('GET', '/matrimony/interests', undefined, TOKEN_A);
  if (interestsA.status === 200) {
    const list = interestsA.data?.data ?? [];
    pass(`User A has ${list.length} interest(s)`);
    if (list.length > 0) {
      pass(`First interest: from=${list[0].fromProfile?.displayName}, to=${list[0].toProfile?.displayName}, status=${list[0].status}`);
    }
  } else {
    fail('GET /interests for A failed', interestsA.data);
  }

  // ── Get interests for User B ──────────────────────────────────────────────
  section('GET /matrimony/interests for User B');
  const interestsB = await req('GET', '/matrimony/interests', undefined, TOKEN_B);
  if (interestsB.status === 200) {
    const list = interestsB.data?.data ?? [];
    pass(`User B has ${list.length} interest(s)`);
  } else {
    fail('GET /interests for B failed', interestsB.data);
  }

  // ── Respond to interest — wrong user (expect 403) ────────────────────────
  section('Respond to Interest — Wrong User (expect 403)');
  if (interestId) {
    const wrongUser = await req('PATCH', `/matrimony/interests/${interestId}`, { status: 'ACCEPTED' }, TOKEN_A);
    if (wrongUser.status === 403) {
      pass('Wrong user correctly rejected with 403');
    } else {
      fail(`Expected 403, got ${wrongUser.status}`, wrongUser.data);
    }
  } else {
    console.log('  ⚠️  SKIP: No interestId');
  }

  // ── Respond to interest — invalid status (expect 400) ────────────────────
  section('Respond to Interest — Invalid Status (expect 400)');
  if (interestId) {
    const badStatus = await req('PATCH', `/matrimony/interests/${interestId}`, { status: 'MAYBE' }, TOKEN_B);
    if (badStatus.status === 400) {
      pass('Invalid status correctly rejected with 400');
    } else {
      fail(`Expected 400, got ${badStatus.status}`, badStatus.data);
    }
  }

  // ── User B accepts interest ───────────────────────────────────────────────
  section('User B Accepts Interest from User A');
  if (interestId) {
    const accept = await req('PATCH', `/matrimony/interests/${interestId}`, { status: 'ACCEPTED' }, TOKEN_B);
    if (accept.status === 200 && accept.data?.data?.status === 'ACCEPTED') {
      pass(`Interest accepted — status: ${accept.data.data.status}`);
    } else {
      fail('Accept interest failed', accept.data);
    }
  } else {
    console.log('  ⚠️  SKIP: No interestId');
  }

  // ── Respond again (already responded — expect 400) ───────────────────────
  section('Respond to Already-Responded Interest (expect 400)');
  if (interestId) {
    const again = await req('PATCH', `/matrimony/interests/${interestId}`, { status: 'REJECTED' }, TOKEN_B);
    if (again.status === 400) {
      pass('Already-responded interest correctly rejected with 400');
    } else {
      fail(`Expected 400, got ${again.status}`, again.data);
    }
  }

  console.log('\n=== TEST 4 COMPLETE ===');
}

run().catch(console.error);
