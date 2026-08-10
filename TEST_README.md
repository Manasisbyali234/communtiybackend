# API Test Scripts

All scripts live in `Backend 2/` and use Node.js `fetch` (Node 18+).
Run from the `Backend 2/` directory.

## Prerequisites

1. Backend server must be running:
   ```
   npm run dev
   ```

2. Database must be migrated:
   ```
   npx prisma migrate dev
   npx prisma db push
   ```

3. An ADMIN user must exist in the database.
   If not, create one via seed or directly in DB with role=ADMIN.

---

## Run Individual Scripts

Each script is independent and self-contained.

### Test 1 — Auth (Register + Login)
```
npx tsx test-1-auth.ts
```
Tests: register, duplicate register, login, wrong password, /users/me

---

### Test 2 — Matrimony Profile Creation & Validation
```
ADMIN_EMAIL=admin@community.app ADMIN_PASS=Admin@123456 \
TOKEN_A=<from test 1> TOKEN_B=<from test 1> \
npx tsx test-2-matrimony-profile.ts
```
Tests: missing fields, too few/many photos, no auth, create profile,
duplicate profile, PENDING status, approval, gender filtering, update

---

### Test 3 — Matrimony Like / Match / Chat
```
TOKEN_A=<...> TOKEN_B=<...> \
PROFILE_A_ID=<...> PROFILE_B_ID=<...> \
ADMIN_TOKEN=<...> \
npx tsx test-3-matrimony-like-match-chat.ts
```
Tests: like without auth, self-like, one-way like, mutual like → match,
conversationId created, GET /like-matches, best matches algorithm

---

### Test 4 — Matrimony Interests
```
TOKEN_A=<...> TOKEN_B=<...> \
PROFILE_A_ID=<...> PROFILE_B_ID=<...> \
npx tsx test-4-matrimony-interests.ts
```
Tests: send interest, self-interest, duplicate, wrong user respond,
invalid status, accept, already-responded

---

### Test 5 — Jobs Module
```
TOKEN_A=<...> TOKEN_B=<...> \
ADMIN_EMAIL=admin@community.app ADMIN_PASS=Admin@123456 \
npx tsx test-5-jobs.ts
```
Tests: create job (admin), missing fields, non-admin blocked,
list jobs, hasApplied flag, apply, duplicate apply, check applied,
admin applicants dashboard, update status, closed job

---

### Test 6 — Admin Matrimony Approval
```
TOKEN_A=<...> TOKEN_B=<...> \
PROFILE_A_ID=<...> PROFILE_B_ID=<...> \
ADMIN_EMAIL=admin@community.app ADMIN_PASS=Admin@123456 \
npx tsx test-6-admin-matrimony.ts
```
Tests: non-admin blocked, list all/pending/approved/rejected,
approve, reject with reason, rejected not visible publicly, delete

---

## Run ALL Tests at Once (Recommended)

```
ADMIN_EMAIL=admin@community.app ADMIN_PASS=Admin@123456 \
npx tsx test-7-run-all.ts
```

This runs all 7 suites in sequence with shared state.
Prints a final summary with pass/fail counts.

Exit code 0 = all passed, Exit code 1 = some failed.

---

## What Each Test Verifies

| # | Suite | Key Checks |
|---|-------|-----------|
| 1 | Auth | Register, login, duplicate, wrong password, /me |
| 2 | Matrimony Profile | Validation, PENDING status, approval, gender filter |
| 3 | Like/Match/Chat | One-way like, mutual match, conversationId, /like-matches |
| 4 | Interests | Send, duplicate, wrong user, accept, already-responded |
| 5 | Jobs | Create, apply, hasApplied flag, duplicate, admin applicants |
| 6 | Admin Matrimony | Approve, reject, delete, visibility rules |
| 7 | All | Full suite with summary |

---

## Expected Output (All Pass)

```
══════════════════════════════════════════════════════════
  FINAL RESULTS
══════════════════════════════════════════════════════════

  Total : 65
  Passed: 65 ✅
  Failed: 0  ❌
```
