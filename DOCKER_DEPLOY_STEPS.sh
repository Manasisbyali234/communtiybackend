#!/bin/bash
# ============================================================
# DOCKER DEPLOYMENT STEPS
# Run on: root@srv1814128:/var/www/communtiybackend
# ============================================================

# STEP 1: Copy deploy-all-migrations.sql to server (run from your LOCAL machine)
# scp "d:\Community backend\Backend 2\deploy-all-migrations.sql" root@srv1814128:/var/www/communtiybackend/

# ─────────────────────────────────────────────────────────────
# STEP 2: Run SQL migrations inside the running postgres container
# Find your postgres container name first:
docker ps

# Then run the SQL (replace 'postgres_container_name' with actual name):
docker exec -i $(docker ps --filter "name=postgres" --filter "name=db" -q | head -1) \
  psql -U postgres -d community_db < deploy-all-migrations.sql

# OR if DATABASE_URL is set in .env:
# docker compose exec db psql -U postgres -d community_db < deploy-all-migrations.sql

# ─────────────────────────────────────────────────────────────
# STEP 3: Regenerate Prisma client inside the api container
docker compose exec api npx prisma generate

# ─────────────────────────────────────────────────────────────
# STEP 4: Rebuild and restart containers
docker compose down
docker compose build --no-cache api
docker compose up -d

# OR if using docker-compose.prod.yml:
# docker compose -f docker-compose.prod.yml down
# docker compose -f docker-compose.prod.yml build --no-cache api
# docker compose -f docker-compose.prod.yml up -d

# ─────────────────────────────────────────────────────────────
# STEP 5: Check logs to confirm server started
docker compose logs -f api --tail=50

# ─────────────────────────────────────────────────────────────
# STEP 6: Verify admin login
curl -s https://community-api.metromindz.com/api/v1/admin-auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@community.app","password":"Admin@1234"}'
# Expected: {"success":true,...,"token":"..."}

# ─────────────────────────────────────────────────────────────
# STEP 7: Verify new routes exist
curl -s https://community-api.metromindz.com/api/v1/matrimony/like \
  -X POST -H "Content-Type: application/json" -d '{}'
# Expected: 401 Unauthorized (NOT 404 Route not found)
