// test-1-auth.ts
// Run: npx tsx test-1-auth.ts
// Tests: Register user A, Register user B, Login both, get tokens

const BASE = 'https://community-api.metromindz.com/api/v1';

async function post(url: string, body: any, token?: string) {
  const res = await fetch(`${BASE}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function get(url: string, token?: string) {
  const res = await fetch(`${BASE}${url}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { status: res.status, data };
}

function pass(msg: string) { console.log(`  ✅ PASS: ${msg}`); }
function fail(msg: string, detail?: any) { console.error(`  ❌ FAIL: ${msg}`, detail ?? ''); }
function section(msg: string) { console.log(`\n━━━ ${msg} ━━━`); }

async function run() {
  console.log('=== TEST 1: AUTH (Register + Login) ===\n');

  const ts = Date.now();
  const userA = { email: `testa_${ts}@test.com`, username: `testa_${ts}`, displayName: 'Test User A', password: 'Password123!' };
  const userB = { email: `testb_${ts}@test.com`, username: `testb_${ts}`, displayName: 'Test User B', password: 'Password123!' };

  // ── Register User A ──────────────────────────────────────────────────────
  section('Register User A');
  const regA = await post('/auth/register', userA);
  if (regA.status === 201 && regA.data?.data?.accessToken) {
    pass(`User A registered — id: ${regA.data.data.user?.id}`);
  } else {
    fail('User A registration failed', regA);
  }

  // ── Register User B ──────────────────────────────────────────────────────
  section('Register User B');
  const regB = await post('/auth/register', userB);
  if (regB.status === 201 && regB.data?.data?.accessToken) {
    pass(`User B registered — id: ${regB.data.data.user?.id}`);
  } else {
    fail('User B registration failed', regB);
  }

  // ── Duplicate register (should 409) ─────────────────────────────────────
  section('Duplicate Register (expect 409)');
  const dup = await post('/auth/register', userA);
  if (dup.status === 409) {
    pass('Duplicate email correctly rejected with 409');
  } else {
    fail(`Expected 409, got ${dup.status}`, dup.data);
  }

  // ── Login User A ─────────────────────────────────────────────────────────
  section('Login User A');
  const loginA = await post('/auth/login', { email: userA.email, password: userA.password });
  if (loginA.status === 200 && loginA.data?.data?.accessToken) {
    pass(`User A login OK — token: ${loginA.data.data.accessToken.slice(0, 20)}...`);
  } else {
    fail('User A login failed', loginA);
  }

  // ── Login User B ─────────────────────────────────────────────────────────
  section('Login User B');
  const loginB = await post('/auth/login', { email: userB.email, password: userB.password });
  if (loginB.status === 200 && loginB.data?.data?.accessToken) {
    pass(`User B login OK — token: ${loginB.data.data.accessToken.slice(0, 20)}...`);
  } else {
    fail('User B login failed', loginB);
  }

  // ── Wrong password (should 401) ──────────────────────────────────────────
  section('Wrong Password (expect 401)');
  const bad = await post('/auth/login', { email: userA.email, password: 'wrongpassword' });
  if (bad.status === 401) {
    pass('Wrong password correctly rejected with 401');
  } else {
    fail(`Expected 401, got ${bad.status}`, bad.data);
  }

  // ── Get /me with token ───────────────────────────────────────────────────
  section('GET /users/me with token');
  const tokenA = loginA.data?.data?.accessToken;
  const me = await get('/users/me', tokenA);
  if (me.status === 200 && me.data?.data?.id) {
    pass(`/users/me OK — displayName: ${me.data.data.displayName}`);
  } else {
    fail('GET /users/me failed', me);
  }

  // ── No token (should 401) ────────────────────────────────────────────────
  section('GET /users/me without token (expect 401)');
  const noToken = await get('/users/me');
  if (noToken.status === 401) {
    pass('No token correctly rejected with 401');
  } else {
    fail(`Expected 401, got ${noToken.status}`, noToken.data);
  }

  console.log('\n=== TEST 1 COMPLETE ===');
  console.log('\n📋 Save these tokens for other test scripts:');
  console.log(`TOKEN_A=${loginA.data?.data?.accessToken}`);
  console.log(`TOKEN_B=${loginB.data?.data?.accessToken}`);
  console.log(`USER_A_ID=${loginA.data?.data?.user?.id}`);
  console.log(`USER_B_ID=${loginB.data?.data?.user?.id}`);
}

run().catch(console.error);
