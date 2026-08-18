/**
 * Test: Community creation flow against hosted backend
 * Run: node test-community-creation.js
 * Requires Node 18+ (built-in fetch)
 */

const BASE_URL = 'https://community-api.metromindz.com/api/v1';

// ── UPDATE THESE before running ───────────────────────────────────────────────
const TEST_PHONE = '+919999999999'; // real registered phone
const TEST_OTP   = '123456';        // OTP received on phone
// ─────────────────────────────────────────────────────────────────────────────

let token = '';

function log(label, data) {
  console.log(`\n✅ ${label}:`);
  console.log(JSON.stringify(data, null, 2));
}

function fail(label, data) {
  console.error(`\n❌ ${label}:`);
  console.error(JSON.stringify(data, null, 2));
}

async function api(method, path, body, isFormData = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (isFormData) delete headers['Content-Type']; // let fetch set multipart boundary

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.data = json;
    throw err;
  }
  return json;
}

async function checkHealth() {
  const res = await api('GET', '/health');
  log('Health', res);
}

async function sendOtp() {
  const res = await api('POST', '/auth/send-otp', { phone: TEST_PHONE });
  log('Send OTP', res);
}

async function verifyOtp() {
  const res = await api('POST', '/auth/verify-otp', { phone: TEST_PHONE, otp: TEST_OTP });
  token = res?.data?.accessToken;
  log('Login', { accessToken: token ? token.slice(0, 40) + '...' : null });
  return token;
}

async function uploadCommunityImage() {
  // 1x1 white PNG pixel — no external deps needed
  const pixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  const boundary = '----FormBoundary' + Date.now();
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`),
    pixel,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length,
  };

  const res = await fetch(`${BASE_URL}/media/upload-community`, {
    method: 'POST',
    headers,
    body,
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.data = json;
    throw err;
  }

  const url = json?.data?.url;
  log('Upload community image', { status: res.status, url });
  return url;
}

async function createCommunity(avatarUrl) {
  const body = {
    name: `Test Community ${Date.now()}`,
    description: 'Automated test community',
    category: 'Tech',
    isPrivate: false,
  };
  if (avatarUrl) body.avatarUrl = avatarUrl;

  const res = await api('POST', '/communities', body);
  log('Create community', res);
  return res?.data?.id;
}

async function addRule(communityId) {
  const res = await api('POST', `/communities/${communityId}/rules`, {
    title: 'Be respectful',
    description: 'Treat everyone with respect.',
  });
  log('Add rule', res);
}

async function addFeedPost(communityId) {
  const res = await api('POST', '/posts', {
    content: 'Welcome to the community!',
    communityId,
  });
  log('Add feed post', res);
}

(async () => {
  console.log('🚀 Testing against:', BASE_URL);
  console.log('='.repeat(60));

  try { await checkHealth(); }
  catch (err) { fail('Health check', err.data ?? err.message); process.exit(1); }

  try { await sendOtp(); }
  catch (err) { fail('Send OTP', err.data ?? err.message); process.exit(1); }

  try { await verifyOtp(); }
  catch (err) { fail('Verify OTP', err.data ?? err.message); process.exit(1); }

  if (!token) {
    console.error('\n❌ No token — update TEST_PHONE / TEST_OTP at the top of this file.');
    process.exit(1);
  }

  let avatarUrl;
  try { avatarUrl = await uploadCommunityImage(); }
  catch (err) { fail('Upload community image', err.data ?? err.message); }

  let communityId;
  try { communityId = await createCommunity(avatarUrl); }
  catch (err) { fail('Create community', err.data ?? err.message); process.exit(1); }

  if (!communityId) { console.log('\n⚠️  No community ID returned.'); process.exit(1); }

  try { await addRule(communityId); }
  catch (err) { fail('Add rule', err.data ?? err.message); }

  try { await addFeedPost(communityId); }
  catch (err) { fail('Add feed post', err.data ?? err.message); }

  console.log('\n🎉 Done! Community ID:', communityId);
})();
