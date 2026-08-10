#!/bin/bash
# ============================================================
# RUN THESE COMMANDS ON YOUR HOSTED SERVER
# root@srv1814128:/var/www/communtiybackend#
# ============================================================

# STEP 1: Apply all missing DB migrations
# Copy deploy-all-migrations.sql to server first, then:
psql $DATABASE_URL -f deploy-all-migrations.sql

# OR if DATABASE_URL is not set, use:
# psql "postgresql://USER:PASS@HOST:PORT/DBNAME" -f deploy-all-migrations.sql

# ─────────────────────────────────────────────────────────────
# STEP 2: Regenerate Prisma client (picks up new schema)
npx prisma generate

# ─────────────────────────────────────────────────────────────
# STEP 3: Build the project (should now succeed)
npm run build

# ─────────────────────────────────────────────────────────────
# STEP 4: Restart the server
pm2 restart all
# OR: systemctl restart community-backend
# OR: node dist/server.js

# ─────────────────────────────────────────────────────────────
# STEP 5: Verify admin login works
curl -s https://community-api.metromindz.com/api/v1/admin-auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@community.app","password":"Admin@1234"}'
# Expected: {"success":true,...,"token":"..."}
