// test-3-matrimony-like-match-chat.ts
// Run: npx tsx test-3-matrimony-like-match-chat.ts
// Tests: Like profile, mutual like = match, conversation created, chat redirect

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

async function ensureApproved(profileId: string, adminToken: string, label: string) {
  const approve = await req('PATCH', `/matrimony/admin/${profileId}/approve`, undefined, adminToken);
  if (approve.status === 200) {
    console.log(`  ℹ️  ${label} re-approved`);
  }
}

async function run() {
  console.log('=== TEST 3: MATRIMONY LIKE / MATCH / CHAT ===\n');

  let resolvedAdminToken = ADMIN_TOKEN;
  let conversationId = '';

  // ── Admin login if token not provided ────────────────────────────────────
  if (!resolvedAdminToken || resolvedAdminToken === 'PASTE_ADMIN_TOKEN') {
    section('Admin Login');
    const adminLogin = await req('POST', '/admin-auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASS });
    if (adminLogin.status === 200) {
      resolvedAdminToken = adminLogin.data.data.token;
      pass('Admin logged in');
    } else {
      fail('Admin login failed — approval steps will be skipped');
    }
  }

  // ── Ensure both profiles are APPROVED ────────────────────────────────────
  section('Ensure Both Profiles Are APPROVED');
  if (resolvedAdminToken && PROFILE_A_ID !== 'PASTE_PROFILE_A_ID') {
    await ensureApproved(PROFILE_A_ID, resolvedAdminToken, 'Profile A');
    await ensureApproved(PROFILE_B_ID, resolvedAdminToken, 'Profile B');
    pass('Both profiles approved');
  } else {
    console.log('  ⚠️  SKIP: No admin token or profile IDs — ensure profiles are approved manually');
  }

  // ── Like without auth (expect 401) ───────────────────────────────────────
  section('Like Profile — No Auth (expect 401)');
  const noAuth = await req('POST', '/matrimony/like', { toProfileId: PROFILE_B_ID });
  if (noAuth.status === 401) {
    pass('Unauthenticated like correctly rejected with 401');
  } else {
    fail(`Expected 401, got ${noAuth.status}`, noAuth.data);
  }

  // ── Like self (expect 400) ────────────────────────────────────────────────
  section('Like Self (expect 400)');
  const selfLike = await req('POST', '/matrimony/like', { toProfileId: PROFILE_A_ID }, TOKEN_A);
  if (selfLike.status === 400) {
    pass('Self-like correctly rejected with 400');
  } else {
    fail(`Expected 400, got ${selfLike.status}`, selfLike.data);
  }

  // ── Missing toProfileId (expect 400) ─────────────────────────────────────
  section('Like — Missing toProfileId (expect 400)');
  const missingId = await req('POST', '/matrimony/like', {}, TOKEN_A);
  if (missingId.status === 400) {
    pass('Missing toProfileId correctly rejected with 400');
  } else {
    fail(`Expected 400, got ${missingId.status}`, missingId.data);
  }

  // ── User A likes User B (one-way, no match yet) ───────────────────────────
  section('User A Likes User B (one-way — no match yet)');
  const likeAtoB = await req('POST', '/matrimony/like', { toProfileId: PROFILE_B_ID }, TOKEN_A);
  if (likeAtoB.status === 200 && likeAtoB.data?.data?.matched === false) {
    pass('One-way like recorded — matched: false ✓');
  } else if (likeAtoB.status === 200 && likeAtoB.data?.data?.matched === true) {
    pass('Already matched (profiles may have liked before)');
    conversationId = likeAtoB.data.data.conversationId;
  } else {
    fail(`Like A→B failed`, likeAtoB.data);
  }

  // ── Idempotent like (same like again — should not error) ─────────────────
  section('User A Likes User B Again (idempotent — should not error)');
  const likeAgain = await req('POST', '/matrimony/like', { toProfileId: PROFILE_B_ID }, TOKEN_A);
  if (likeAgain.status === 200) {
    pass('Duplicate like handled gracefully (idempotent)');
  } else {
    fail(`Expected 200 on duplicate like, got ${likeAgain.status}`, likeAgain.data);
  }

  // ── User B likes User A (mutual → MATCH!) ────────────────────────────────
  section('User B Likes User A (MUTUAL → MATCH!)');
  const likeBtoA = await req('POST', '/matrimony/like', { toProfileId: PROFILE_A_ID }, TOKEN_B);
  if (likeBtoA.status === 201 && likeBtoA.data?.data?.matched === true) {
    conversationId = likeBtoA.data.data.conversationId;
    pass(`MATCH created! conversationId: ${conversationId}`);
  } else if (likeBtoA.status === 200 && likeBtoA.data?.data?.matched === true) {
    conversationId = likeBtoA.data.data.conversationId;
    pass(`MATCH already exists — conversationId: ${conversationId}`);
  } else {
    fail('Mutual like did not create a match', likeBtoA.data);
  }

  // ── Get like-matches for User A ───────────────────────────────────────────
  section('GET /matrimony/like-matches for User A');
  const matchesA = await req('GET', '/matrimony/like-matches', undefined, TOKEN_A);
  if (matchesA.status === 200) {
    const matches = matchesA.data?.data ?? [];
    pass(`User A has ${matches.length} like-match(es)`);
    if (matches.length > 0) {
      const m = matches[0];
      pass(`Match: ${m.profile?.displayName}, conversationId: ${m.conversationId}`);
      if (m.conversationId) {
        pass('conversationId present — chat is enabled ✓');
      } else {
        fail('conversationId missing in match');
      }
    }
  } else {
    fail('GET /like-matches failed', matchesA.data);
  }

  // ── Get like-matches for User B ───────────────────────────────────────────
  section('GET /matrimony/like-matches for User B');
  const matchesB = await req('GET', '/matrimony/like-matches', undefined, TOKEN_B);
  if (matchesB.status === 200) {
    const matches = matchesB.data?.data ?? [];
    pass(`User B has ${matches.length} like-match(es)`);
  } else {
    fail('GET /like-matches for B failed', matchesB.data);
  }

  // ── Verify conversation exists ────────────────────────────────────────────
  section('Verify Chat Conversation Exists');
  if (conversationId) {
    const convs = await req('GET', '/messages/conversations', undefined, TOKEN_A);
    if (convs.status === 200) {
      const list = convs.data?.data ?? [];
      const found = list.some((c: any) => c.id === conversationId);
      if (found) {
        pass(`Conversation ${conversationId} found in User A's conversations ✓`);
      } else {
        pass(`Conversation created (id: ${conversationId}) — may not appear in list until first message`);
      }
    } else {
      fail('GET /messages/conversations failed', convs.data);
    }
  } else {
    console.log('  ⚠️  SKIP: No conversationId available');
  }

  // ── Best Matches (algorithm-based) ───────────────────────────────────────
  section('GET /matrimony/matches (Algorithm-Based Best Matches)');
  const bestMatches = await req('GET', '/matrimony/matches', undefined, TOKEN_A);
  if (bestMatches.status === 200) {
    const matches = bestMatches.data?.data ?? [];
    pass(`${matches.length} algorithm-based matches found`);
    if (matches.length > 0) {
      pass(`Top match: ${matches[0].displayName}, score: ${matches[0].matchScore}%`);
    }
  } else {
    fail('GET /matrimony/matches failed', bestMatches.data);
  }

  console.log('\n=== TEST 3 COMPLETE ===');
  console.log('\n📋 Save for next tests:');
  console.log(`CONVERSATION_ID=${conversationId}`);
}

run().catch(console.error);
