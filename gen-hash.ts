// gen-hash.ts — generates bcrypt hash for admin password
// Run: npx tsx gen-hash.ts
import bcrypt from 'bcryptjs';

async function main() {
  const password = 'Admin@1234';
  const hash = await bcrypt.hash(password, 12);
  console.log('\nPassword:', password);
  console.log('Hash    :', hash);
  console.log('\nSQL to update admin on hosted DB:');
  console.log(`UPDATE "User" SET "passwordHash" = '${hash}', "role" = 'ADMIN', "isVerified" = true WHERE email = 'admin@community.app';`);
  console.log('\nSQL to insert admin if not exists:');
  console.log(`INSERT INTO "User" ("id","email","username","passwordHash","displayName","role","isVerified","isActive","isBanned","createdAt","updatedAt")`);
  console.log(`VALUES (gen_random_uuid()::text,'admin@community.app','adminuser','${hash}','Admin User','ADMIN',true,true,false,NOW(),NOW())`);
  console.log(`ON CONFLICT ("email") DO UPDATE SET "passwordHash"='${hash}',"role"='ADMIN',"isVerified"=true,"updatedAt"=NOW();`);
}

main().catch(console.error);
