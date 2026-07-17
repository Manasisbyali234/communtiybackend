import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const cols = await p.$queryRaw`
    SELECT table_name, column_name, udt_name 
    FROM information_schema.columns 
    WHERE table_name IN ('Post','Event') AND column_name = 'status'
  ` as any[];
  console.log('Status columns:', JSON.stringify(cols, null, 2));

  const enums = await p.$queryRaw`
    SELECT typname FROM pg_type WHERE typname IN ('PostStatus','EventStatus')
  ` as any[];
  console.log('Enums:', JSON.stringify(enums, null, 2));
}
main().catch(console.error).finally(() => p.$disconnect());
