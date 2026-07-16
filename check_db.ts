import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const db = await p.$queryRaw`SELECT current_database(), current_user, inet_server_port()`;
  console.log('Connected to:', JSON.stringify(db));
  const users = await p.user.findMany({ select: { id: true, email: true, username: true } });
  console.log('Users:', JSON.stringify(users));
}
main().catch(console.error).finally(() => p.$disconnect());
