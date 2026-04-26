# DevOps Progress Tracker

**Role**: DevOps / Release Engineer  
**Branch**: dev (working here directly for now)  
**Started**: 2026-04-26

## Task Checklist

| # | Item | Status |
|---|------|--------|
| 1 | Repo hygiene | ✅ Done — commit cb9cc0a |
| 2 | Environment management (lib/env.ts + env.example cleanup) | ✅ Done — commit 7afb3c4 |
| 3 | Logging strategy (lib/log.ts + replace console.log) | ✅ Done — commit 7afb3c4 |
| 4 | CI pipeline (.github/workflows/ci.yml) | ✅ Done — commit c192a46 |
| 5 | Pre-commit guard (husky + lint-staged) | ✅ Done — commit c192a46 |
| 6 | Deploy config (vercel.json + DEPLOY.md) | ✅ Done — commit c192a46 |
| 7 | Database operational scripts | ⏳ Deferred to DBA role |
| 8 | Observability minimum (/api/health) | ✅ Done — commit c192a46 |

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

**Status**: Deferred to DBA role.  
`npm run db:check` added, pointing at `drizzle/migrate.ts`. The CI will not auto-run DB migrations — that must be done manually before deploying schema changes.

---

## Item 8 — Observability Minimum

**Actions taken:**
- Created `pages/api/health.ts` — DB ping + 200, no secrets exposed
- Note: Sentry was deferred (backend role). Document it as open item.

---

## Open Items / Hand-offs

- **CRITICAL: Key rotation required** — see `SECURITY_ROTATION.md`. The real credentials that were in `env.example` are now placeholders, but the actual keys are still live in Supabase/Stripe/Shippo dashboards and must be rotated before launch.
- **Backend role**: wire `lib/env.ts` imports into routes still using `process.env` directly. Also remove the `noNonNullAssertion` warnings by using `env.VARIABLE` instead of `process.env.VARIABLE!`.
- **DBA role**: once `drizzle/migrations/` baseline is committed, wire `npm run db:migrate` as a CI pre-check (dry-run mode).
- **Frontend role**: 276 pre-existing Biome a11y errors in `components/admin/**` and `pages/` must be fixed before CI `biome ci .` can be widened to the full project. Primary issues: SVGs without `<title>`, buttons without `type`, `<a>` without valid `href`, missing `label` associations.
- **Sentry (observability)**: not yet wired. Backend role to add `@sentry/nextjs` in API routes + scrub PII in `beforeSend`.
- **CI biome scope**: currently set to `lib/ pages/api/` only. Expand to `.` once frontend fixes pre-existing errors.
