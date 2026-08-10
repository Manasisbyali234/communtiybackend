// setup-admin.ts
// Creates admin user on hosted server
// Run: npx tsx setup-admin.ts

const BASE = 'https://community-api.metromindz.com/api/v1';

async function api(method: string, url: string, body?: any, token?: string) {
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

async function run() {
  console.log('Setting up admin user on hosted server...\n');

  // Step 1: Register admin user
  const reg = await api('POST', '/auth/register', {
    email: 'admin@community.app',
    username: 'adminuser',
    displayName: 'Admin User',
    password: 'Admin@1234',
  });

  let adminUserToken = '';
  let adminUserId = '';

  if (reg.status === 201) {
    adminUserToken = reg.data.data.accessToken;
    adminUserId = reg.data.data.user.id;
    console.log(`✅ Admin user registered — id: ${adminUserId}`);
  } else if (reg.status === 409) {
    console.log('ℹ️  Admin user already exists, logging in...');
    const login = await api('POST', '/auth/login', {
      email: 'admin@community.app',
      password: 'Admin@1234',
    });
    if (login.status === 200) {
      adminUserToken = login.data.data.accessToken;
      adminUserId = login.data.data.user.id;
      console.log(`✅ Admin user logged in — id: ${adminUserId}`);
    } else {
      console.error('❌ Login failed:', login.data);
      return;
    }
  } else {
    console.error('❌ Registration failed:', reg.data);
    return;
  }

  // Step 2: We need an existing admin to promote this user.
  // Since no admin exists, we need to use the /admin/users/:id/role endpoint
  // which requires ADMIN role. This is a chicken-and-egg problem.
  // Solution: Use the JWT token directly — the user has USER role.
  // We need to check if there's a superadmin endpoint or use DB directly.

  // Try using the user's own token to call admin promote (will fail if not admin)
  const promote = await api('PUT', `/admin/users/${adminUserId}/role`, { role: 'ADMIN' }, adminUserToken);
  if (promote.status === 200) {
    console.log('✅ User promoted to ADMIN via API');
  } else {
    console.log(`⚠️  Cannot self-promote via API (expected) — status: ${promote.status}`);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ACTION REQUIRED: Run this SQL on your hosted PostgreSQL DB:');
    console.log('');
    console.log(`UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@community.app';`);
    console.log('');
    console.log('OR connect to your server and run:');
    console.log('  npx prisma db seed');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('After promoting, re-run this script to verify admin login.');
    return;
  }

  // Step 3: Verify admin login
  const adminLogin = await api('POST', '/admin-auth/login', {
    email: 'admin@community.app',
    password: 'Admin@1234',
  });

  if (adminLogin.status === 200) {
    console.log(`\n✅ Admin login verified!`);
    console.log(`ADMIN_TOKEN=${adminLogin.data.data.token}`);
    console.log('\nYou can now run: npx tsx test-7-run-all.ts');
  } else {
    console.error('❌ Admin login failed after promotion:', adminLogin.data);
  }
}

run().catch(console.error);
