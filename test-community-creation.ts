/**
 * Test script: Community creation flow against hosted backend
 * Run: npx ts-node test-community-creation.ts
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const axios = require('axios');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FormData = require('form-data');

const BASE_URL = 'https://community-api.metromindz.com/api/v1';

// ── CONFIG: fill in a valid test user ────────────────────────────────────────
const TEST_PHONE = '+919999999999'; // replace with a real registered phone
const TEST_OTP   = '123456';        // replace with actual OTP or use a seeded test user

let token = '';
const http = axios.create({ baseURL: BASE_URL, timeout: 15000 });

function log(label: string, data: any) {
  console.log(`\n✅ ${label}:`);
  console.log(JSON.stringify(data, null, 2));
}

function fail(label: string, err: any) {
  const detail = err?.response?.data ?? err?.message ?? err;
  console.error(`\n❌ ${label}:`);
  console.error(JSON.stringify(detail, null, 2));
}

// ── 1. Health check ───────────────────────────────────────────────────────────
async function checkHealth() {
  const res = await http.get('/health');
  log('Health check', res.data);
}

// ── 2. Login (OTP flow) ───────────────────────────────────────────────────────
async function login() {
  // Step 1: request OTP
  try {
    await http.post('/auth/send-otp', { phone: TEST_PHONE });
    console.log('\n📱 OTP sent to', TEST_PHONE);
  } catch (err: any) {
    fail('send-otp', err);
    throw err;
  }

  // Step 2: verify OTP
  try {
    const res = await http.post('/auth/verify-otp', { phone: TEST_PHONE, otp: TEST_OTP });
    token = res.data?.data?.accessToken;
    http.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    log('Login', { accessToken: token?.slice(0, 30) + '...' });
  } catch (err: any) {
    fail('verify-otp', err);
    throw err;
  }
}

// ── 3. Upload community image ─────────────────────────────────────────────────
async function uploadCommunityImage(): Promise<string | null> {
  // Use a small placeholder image (1x1 white pixel PNG)
  const pixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  const form = new FormData();
  form.append('file', pixel, { filename: 'test.png', contentType: 'image/png' });

  try {
    const res = await http.post('/media/upload-community', form, {
      headers: { ...form.getHeaders() },
    });
    const url: string = res.data?.data?.url;
    log('Upload community image', { url });
    return url;
  } catch (err: any) {
    fail('upload-community image', err);
    return null;
  }
}

// ── 4. Create community ───────────────────────────────────────────────────────
async function createCommunity(avatarUrl?: string) {
  const body: Record<string, any> = {
    name: `Test Community ${Date.now()}`,
    description: 'Automated test community',
    category: 'Tech',
    isPrivate: false,
  };
  if (avatarUrl) body.avatarUrl = avatarUrl;

  try {
    const res = await http.post('/communities', body);
    log('Create community', res.data);
    return res.data?.data?.id as string;
  } catch (err: any) {
    fail('create community', err);
    return null;
  }
}

// ── 5. Add a rule ─────────────────────────────────────────────────────────────
async function addRule(communityId: string) {
  try {
    const res = await http.post(`/communities/${communityId}/rules`, {
      title: 'Be respectful',
      description: 'Treat everyone with respect.',
    });
    log('Add rule', res.data);
  } catch (err: any) {
    fail('add rule', err);
  }
}

// ── 6. Add a feed post ────────────────────────────────────────────────────────
async function addFeedPost(communityId: string) {
  try {
    const res = await http.post('/posts', {
      content: 'Welcome to the community!',
      communityId,
    });
    log('Add feed post', res.data);
  } catch (err: any) {
    fail('add feed post', err);
  }
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('🚀 Testing community creation against:', BASE_URL);
  console.log('='.repeat(60));

  try {
    await checkHealth();
  } catch {
    console.error('Server unreachable — aborting.');
    process.exit(1);
  }

  try {
    await login();
  } catch {
    console.error('Login failed — aborting. Update TEST_PHONE / TEST_OTP at the top of this file.');
    process.exit(1);
  }

  const avatarUrl = await uploadCommunityImage();
  const communityId = await createCommunity(avatarUrl ?? undefined);

  if (communityId) {
    await addRule(communityId);
    await addFeedPost(communityId);
    console.log('\n🎉 All steps completed. Community ID:', communityId);
  } else {
    console.log('\n⚠️  Community creation failed — see errors above.');
  }
})();
