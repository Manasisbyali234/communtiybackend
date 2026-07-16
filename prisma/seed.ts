import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const existing = await prisma.user.findUnique({ where: { email: 'admin@community.app' } });
  if (existing) {
    console.log('✅ Admin already exists, skipping seed. No data was changed.');
    return;
  }

  const passwordHash = await bcrypt.hash('Admin@1234', 12);

  await prisma.user.create({
    data: {
      email: 'admin@community.app',
      username: 'admin',
      passwordHash,
      displayName: 'Admin User',
      role: Role.ADMIN,
      isVerified: true,
      bio: 'Platform administrator',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`
  📧 Admin credentials:
  - admin@community.app (password: Admin@1234)
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
