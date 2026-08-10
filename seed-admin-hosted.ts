// seed-admin-hosted.ts
// Seeds admin user directly into hosted DB
// Usage: DATABASE_URL="postgresql://user:pass@host:port/dbname" npx tsx seed-admin-hosted.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('Usage: DATABASE_URL="postgresql://..." npx tsx seed-admin-hosted.ts');
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

async function main() {
  console.log('🌱 Seeding admin user into hosted DB...');
  console.log(`   DB: ${dbUrl!.replace(/:([^:@]+)@/, ':****@')}\n`);

  const existing = await prisma.user.findUnique({ where: { email: 'admin@community.app' } });

  const passwordHash = await bcrypt.hash('Admin@1234', 12);

  if (existing) {
    // Update password and ensure ADMIN role
    await prisma.user.update({
      where: { email: 'admin@community.app' },
      data: { passwordHash, role: 'ADMIN', isVerified: true, isActive: true },
    });
    console.log('✅ Admin user updated — password reset to Admin@1234, role set to ADMIN');
  } else {
    await prisma.user.create({
      data: {
        email: 'admin@community.app',
        username: 'adminuser',
        passwordHash,
        displayName: 'Admin User',
        role: 'ADMIN',
        isVerified: true,
        isActive: true,
        bio: 'Platform administrator',
      },
    });
    console.log('✅ Admin user created');
  }

  console.log('\n📋 Admin credentials:');
  console.log('   Email   : admin@community.app');
  console.log('   Password: Admin@1234');
  console.log('\nNow run: npx tsx test-7-run-all.ts');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
