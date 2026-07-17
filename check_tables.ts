import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const tables = await p.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log('TABLES:', JSON.stringify(tables, null, 2));
  const userCount = await p.user.count();
  const postCount = await p.post.count();
  const communityCount = await p.community.count();
  console.log('Users:', userCount, '| Posts:', postCount, '| Communities:', communityCount);
}
main().catch(console.error).finally(() => p.$disconnect());
