# DevOps Progress Tracker

**Role**: DevOps / Release Engineer  
**Branch**: dev (working here directly for now)  
**Started**: 2026-04-26

## Task Checklist

| # | Item | Status |
|---|------|--------|
| 1 | Repo hygiene | 🔄 In Progress |
| 2 | Environment management (lib/env.ts + env.example cleanup) | ⏳ Pending |
| 3 | Logging strategy (lib/log.ts + replace console.log) | ⏳ Pending |
| 4 | CI pipeline (.github/workflows/ci.yml) | ⏳ Pending |
| 5 | Pre-commit guard (husky + lint-staged) | ⏳ Pending |
| 6 | Deploy config (vercel.json + DEPLOY.md) | ⏳ Pending |
| 7 | Database operational scripts | ⏳ Pending |
| 8 | Observability minimum (/api/health) | ⏳ Pending |

---

## Item 1 — Repo Hygiene

**Findings:**
- `auth.txt` — stray build log, tracked in git → `git rm --cached` + delete
- `tsconfig.tsbuildinfo` — tracked despite being in .gitignore → `git rm --cached`
- `.DS_Store` — tracked at root → `git rm --cached`; found in 8+ locations in working tree
- `pages/admin/products.tsx.backup` — backup file in git history → delete + untrack
- `components/auth/AuthForm.tsx` — 0 bytes, no imports anywhere → delete
- `components/sections/AboutPreview.tsx` — 0 bytes, no imports anywhere → delete
- `.gitignore` missing explicit `auth.txt` rule
- `SessionDebug` is rendered in `components/Layout.tsx` unconditionally (ships to prod)

**Actions taken:**
- `git rm --cached` for auth.txt, tsconfig.tsbuildinfo, .DS_Store, products.tsx.backup
- Deleted auth.txt, products.tsx.backup, AuthForm.tsx, AboutPreview.tsx from disk
- Added `auth.txt` to .gitignore
- Gated SessionDebug in Layout.tsx behind `NODE_ENV !== 'production'`

---

## Item 2 — Environment Management

**Findings:**
- `env.example` contains real Supabase URL, anon key, service role key, Stripe test keys, Shippo test key — all live credentials
- No startup env validator exists
- `process.env` accessed directly throughout API routes

**Actions taken:**
- Replaced all real values in `env.example` with placeholder strings + added comments
- Created `lib/env.ts` with zod validation for all required server + public vars
- Added `npm run typecheck` script (`tsc --noEmit`)

---

## Item 3 — Logging Strategy

**Findings:**
- 216 `console.*` calls across `pages/api/` — many with emoji prefixes
- No structured logging; everything raw console in prod

**Actions taken:**
- Created `lib/log.ts` with `log.debug`, `log.info`, `log.warn`, `log.error`
- In production: debug is a no-op, others emit JSON lines
- Replaced all `console.log` → `log.debug`, `console.error` → `log.error` across pages/api/

---

## Item 4 — CI Pipeline

**Actions taken:**
- Created `.github/workflows/ci.yml` with: npm ci, biome check, tsc --noEmit, next build
- Added gitleaks secret-scanning job
- npm cache + .next/cache configured

---

## Item 5 — Pre-commit Guard

**Actions taken:**
- Added husky + lint-staged
- On commit: biome check --write on staged files

---

## Item 6 — Deploy Config

**Actions taken:**
- Created `vercel.json` (framework: nextjs, Node 20)
- Created `DEPLOY.md` covering env setup, Vercel, Supabase Auth, Stripe webhook, Shippo webhook

---

## Item 7 — Database Operational Scripts

**Status**: Deferred to DBA role. Added `npm run db:check` script pointing at drizzle/migrate.ts.

---

## Item 8 — Observability Minimum

**Actions taken:**
- Created `pages/api/health.ts` — DB ping + 200, no secrets exposed

---

## Open Items / Hand-offs

- **Security role**: rotate all keys listed in SECURITY_ROTATION.md before launch; the env.example real values are now replaced but the keys themselves are still live
- **Backend role**: wire `lib/env.ts` imports into all routes that still use `process.env` directly
- **DBA role**: coordinate on `npm run db:migrate` CI step once migrations folder is clean
