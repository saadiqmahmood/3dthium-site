# 3dthium — Pre-Launch Overhaul: Claude Code Role Prompts

**Project**: Next.js 15 (Pages Router) e-commerce site, Supabase (Postgres + Auth + Storage), Drizzle ORM, Stripe, Shippo, Tailwind 4, Biome.
**Status**: Pre-launch. Heavy overhaul authorised.
**Document purpose**: One self-contained prompt per role. Open a separate Claude Code terminal at the repo root for each role and paste the corresponding prompt block. Run them in the **dispatch order** below — some roles depend on the security/DevOps work landing first.

---

## Audit summary (what's wrong)

### Critical — must fix before launch
- **Real secrets committed to repo**. `env.example` contains real Supabase URL + anon key + `SUPABASE_SERVICE_ROLE_KEY` + Stripe test secret + Stripe webhook secret + Shippo test key. `.env.local` additionally has a Supabase DB password, a live Shippo API key, and a live Stripe publishable key in trailing comments.
- **Every `/api/admin/*` route is unauthenticated**. Any internet user can `GET /api/admin/users`, `GET /api/admin/orders`, `PUT/DELETE /api/admin/users/[id]`, mutate products/categories, generate variations, send order-confirmation emails, etc. The only "auth" is `AdminLayout.tsx` doing client-side redirects, which doesn't protect the API.
- **`/api/auth/check-admin` is broadcast IDOR**. It accepts any `userId` from the body (no session check) and returns whether that user is admin. The check itself is also the only thing gating client-side admin UI.
- **Price tampering in checkout**. `pages/api/checkout_sessions.ts` builds Stripe line items from `item.price` sent by the client. A buyer can modify the cart in-browser and pay £0.01 for any product. Same for `shipping_cost`. The Stripe webhook also stores `price_at_purchase` from the same client value.
- **Shippo webhook has no signature verification**. `pages/api/shippo/webhook.ts` will mark any order as `delivered`/`shipped` from anyone who knows a tracking number.
- **Promo-code endpoint is abusable**. `/api/promo_code/validate` takes `orderTotal` from the client and, when called with `apply: true`, increments `uses` without any cart/order linkage or auth — it can be drained or used to inflate counts.
- **Public product API uses the service role key**. `pages/api/products.ts`, `pages/api/products/[slug].ts` and the public variants route all instantiate Supabase with `SUPABASE_SERVICE_ROLE_KEY`. Bypasses RLS for reads that should be anon.
- **Open debug endpoints**. `/api/test`, `/api/test-orders`, `/api/test-product` dump products, orders, and joins to anyone.
- **RLS effectively disabled**. `database/disable_storage_rls.sql`, `nuclear_storage_fix.sql`, and `comprehensive_storage_fix.sql` strip RLS and grant `ALL` to `anon` + `public` on `storage.objects`. The "fix" was never reverted.

### High — architectural / correctness
- **Schema mid-migration is committed half-done**. `products` + `products_new` and `product_variants` + `product_variants_new` coexist; admin order endpoint reads from both, frontend reads from `_new`. 30+ ad-hoc SQL files in `database/` (e.g., `fix_storage_policies.sql`, `nuclear_storage_fix.sql`, `final_storage_test.sql`).
- **Drizzle is set up but barely used**. `drizzle/schema.ts` exists; almost every API route uses raw Supabase client. No type safety on writes, no migrations workflow being honoured (`db:push` is dev-only and the prod migration runner is unused).
- **Contact form is fake**. `pages/contact.tsx` `handleSubmit` does `await new Promise(r => setTimeout(r, 1500))` and shows success. No email is ever sent.
- **No webhook idempotency**. `stripe/webhook.ts` will re-create an order on every replay of `checkout.session.completed`.
- **Auto-label kicks itself via HTTP**. The Stripe webhook calls its own `/api/shipping/label` over HTTP using `process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'` — fragile in serverless and will hit localhost in prod if the env var is missing.
- **Mixed shipping cost source of truth**. `shipping_cost` is collected client-side, sent to checkout, stored in `checkout_carts`, and trusted by the webhook.
- **`SessionDebug` component** appears to ship in prod (verify in `_app.tsx`).

### Medium — code quality / DX
- 99 `console.log` calls (many with emojis) across API routes — noisy in prod and leak internal state.
- Empty stub components: `components/auth/AuthForm.tsx`, `components/sections/AboutPreview.tsx`.
- `pages/admin/products.tsx.backup` committed.
- `tsconfig.tsbuildinfo`, `.DS_Store`, and `.next/` artefacts present despite `.gitignore`.
- `auth.txt` at repo root contains a captured `next build` failure log — committed.
- ESLint config is the default `next/typescript` — no rules tightened; lint already failing per `auth.txt` (`pages/auth.tsx` unused vars).
- 17+ phase / migration / debug `.md` files in `docs/` — much of it stale.
- `tailwindcss.config.js` and `@tailwindcss/postcss` setup look like a half-complete Tailwind 4 migration.
- `next.config.ts` only allow-lists one Supabase host for `next/image`; no security headers, no CSP, no `poweredByHeader: false`.

---

## Dispatch order

Run these roles in this order. Where two roles can run in parallel, it's noted.

| Wave | Role | Why this order |
|------|------|----------------|
| 1 | **Security Engineer** | Rotates secrets, lands the admin auth gate everyone else builds on. |
| 1 | **DevOps / Release Engineer** *(parallel with Security)* | Stops fresh secrets from leaking again, sets up CI gates. |
| 2 | **DBA / Data-Migration Engineer** | Consolidates `products`/`products_new` tables before backend refactors them. |
| 2 | **UI/UX Designer** *(parallel with DBA)* | Produces the design system + flows the frontend role will implement. |
| 3 | **Backend / API Engineer** | Server-side price calc, Stripe webhook hardening, Drizzle adoption — needs Security's auth helper and DBA's consolidated schema. |
| 4 | **Frontend Engineer** | Implements the designer's spec, removes dead code, wires real data — needs Backend's stable APIs. |
| 5 | **QA / Test Engineer** | Writes Playwright + Vitest suites against the now-stable surface. |
| 6 | **Performance / SEO Engineer** | Last — measure and tune the working app. |

Each prompt below is **self-contained**: paste the entire fenced block into a fresh `claude` session at the repo root.

---

## 1. Security Engineer — P0, run first

```
You are a senior application security engineer joining the 3dthium project (Next.js 15 Pages Router, Supabase Postgres + Auth + Storage, Drizzle ORM, Stripe Checkout, Shippo). The site is pre-launch. Your job is to close every critical security hole before any other refactor work begins. Treat all findings below as confirmed during a manual audit; verify each one in code before fixing.

Scope and priorities (do them in this order, commit per item):

1) Rotate and remove leaked credentials.
   - `env.example` contains real values for NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, SHIPPO_API_KEY. Replace with placeholder strings and document each in a comment.
   - `.env.local` has a DB password and live Shippo + Stripe publishable keys in trailing comments. Strip the comments. Confirm `.env.local` is gitignored (it is, but verify it is not in git history; if it is, add a section to the deliverable below telling the operator to do `git filter-repo` and rotate).
   - `auth.txt` at repo root is a build log committed by mistake — delete it.
   - Produce `SECURITY_ROTATION.md` listing every key that must be rotated in Supabase / Stripe / Shippo dashboards before launch, in order, with the exact dashboard paths.

2) Add a server-side admin authorization helper and apply it to every admin route.
   - Create `lib/auth/requireAdmin.ts` exporting `requireAdmin(req, res): Promise<{ userId, dbUserId } | null>`. It must: read the Supabase auth cookie via `@supabase/ssr` (look at `utils/supabase/server.ts` for the pattern but you'll need a Pages Router variant — use `createServerClient` with `req.cookies` / `res.setHeader`), call `supabase.auth.getUser()` (NOT `getSession`, which trusts the cookie), then look up the corresponding row in `public.users` by `auth_user_id` and check `is_admin`. On failure, send 401 or 403 and return null.
   - Apply it as the first line of every handler in `pages/api/admin/**`. There are ~15 routes — list them all and confirm each one is gated. Files include but are not limited to: `pages/api/admin/products.ts`, `pages/api/admin/products/[id].ts`, `pages/api/admin/products/[id]/attributes.ts`, `pages/api/admin/products/[id]/variations/generate.ts`, `pages/api/admin/categories.ts`, `pages/api/admin/categories/[id].ts`, `pages/api/admin/category-attributes/[categoryId].ts`, `pages/api/admin/orders.ts`, `pages/api/admin/orders/[id].ts`, `pages/api/admin/order-items/[id].ts`, `pages/api/admin/users.ts`, `pages/api/admin/users/[id].ts`, `pages/api/admin/custom-orders.ts`, `pages/api/admin/custom-orders/[id].ts`, `pages/api/admin/upload-image.ts`, `pages/api/admin/metrics.ts`, `pages/api/admin/product-variants/[productId].ts`, `pages/api/admin/product-variants/[productId]/[variantId].ts`, `pages/api/admin/send-order-confirmation.ts`. Use `find pages/api/admin -name "*.ts"` to confirm.

3) Replace `pages/api/auth/check-admin.ts`.
   - Today it accepts `{ userId }` from the body and looks up admin status for ARBITRARY users. Rewrite it as `GET /api/auth/me` that uses the cookie-based session, returns `{ userId, isAdmin, email }`, and never accepts a userId in the body. Update `context/AuthContext.tsx` to call the new endpoint.

4) Remove the public debug endpoints.
   - Delete `pages/api/test.ts`, `pages/api/test-orders.ts`, `pages/api/test-product.ts`. They expose orders, products, and DB joins.

5) Stop using SUPABASE_SERVICE_ROLE_KEY for public reads.
   - In `pages/api/products.ts`, `pages/api/products/[slug].ts`, `pages/api/products/[slug]/variants.ts`, and `pages/api/promo_code/validate.ts`, switch to a client created with the anon key and `auth: { persistSession: false }`. Add a server-only helper `lib/supabase/anon.ts` so the service role import is impossible from public-read paths.
   - Audit the remaining service-role usages and document each one (must be admin-gated or webhook-gated).

6) Verify Stripe webhook signature handling and add idempotency.
   - `pages/api/stripe/webhook.ts` already verifies signatures — confirm `STRIPE_WEBHOOK_SECRET` cannot be undefined at request time (fail closed if missing).
   - Add idempotency: persist `event.id` to a new `stripe_webhook_events` table on first handle and short-circuit if the row already exists. The handler currently re-creates orders on retries.

7) Add Shippo webhook signature verification.
   - `pages/api/shippo/webhook.ts` accepts any POST. Implement Shippo's signature header check (consult Shippo docs — do not invent a scheme). Reject unsigned requests with 401. If Shippo's signing scheme is uncertain, instead require a shared-secret bearer token from env (`SHIPPO_WEBHOOK_SECRET`) and document the dashboard config needed.

8) Lock down the storage RLS situation.
   - Read every file in `database/*storage*.sql`. The repo currently includes `disable_storage_rls.sql`, `nuclear_storage_fix.sql`, `comprehensive_storage_fix.sql` — all of which strip RLS and grant ALL to anon. Author a single replacement `database/storage_rls.sql` that re-enables RLS on `storage.objects` and only allows the `service_role` to write to the `products` bucket while granting public read on `products`. Delete the old "nuclear" files.

9) Lock down general RLS on data tables.
   - Read `database/setup_public_rls_policies.sql` and `database/fix_products_rls.sql`. Confirm policies are SELECT-only for `anon` on the public-readable tables (`products_new`, `product_variants_new`, `categories`, `category_attributes`). No anon writes anywhere. Document the final policy set in `database/rls_final.sql` and mark all other RLS files DEPRECATED in their first line so the DBA role can clean them up.

10) Add minimal security headers.
    - In `next.config.ts`: `poweredByHeader: false`, plus `headers()` returning `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. Don't add CSP yet (it'll fight Stripe + Supabase) — leave a TODO.

Constraints:
- Do not change product/database business logic. Auth and signature work only.
- Don't migrate Drizzle in this pass — that's the backend role's job.
- Every change must compile. After each item, run `npm run build` (or `npx tsc --noEmit` if build is too slow) and `npm run lint`.

Deliverables:
- All code changes committed in small, reviewable commits.
- `SECURITY_ROTATION.md` listing every key to rotate and the exact dashboard steps.
- A short `SECURITY_AUDIT_RESULTS.md` summarising what you found, what you fixed, and what is still open for other roles (e.g., "price tampering: see backend role").

Start by running `find pages/api -name "*.ts"` and `grep -rn "SERVICE_ROLE_KEY\|service_role" pages/api`, confirming the route inventory, then proceed item by item.
```

---

## 2. DevOps / Release Engineer — P0, run in parallel with Security

```
You are a senior platform / release engineer on the 3dthium project (Next.js 15 Pages Router on Vercel, Supabase, Stripe, Shippo, Biome lint, no tests yet). The site is pre-launch. Your job is to make it impossible for the kinds of mistakes already in this repo to happen again, and to set up the deploy + CI scaffolding the team needs before launch.

Scope (in priority order, commit per item):

1) Repo hygiene.
   - Verify `.gitignore` covers `.env*`, `*.tsbuildinfo`, `.DS_Store`, `.next/`, `node_modules/`. It currently does, but `tsconfig.tsbuildinfo` and `.DS_Store` are tracked. Remove them with `git rm --cached` and add an explicit `auth.txt` rule (it's a stray build log).
   - Delete `pages/admin/products.tsx.backup`. Backups belong in git history.
   - Remove the empty stubs `components/auth/AuthForm.tsx` and `components/sections/AboutPreview.tsx` (verify no imports first with `grep -rn "AuthForm\|AboutPreview" pages components context`).

2) Environment management.
   - Replace `env.example` so it has placeholder values only (the security engineer is doing the value scrubbing — coordinate; if they haven't yet, do it). Add a comment block explaining each variable, which scope it has (public/secret), and the dashboard each one comes from.
   - Add a startup env validator: `lib/env.ts` using `zod` (add as dep) that parses `process.env` into a typed object at module load. Required server vars: `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SHIPPO_API_KEY`, `NEXT_PUBLIC_BASE_URL`. Required public vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_BASE_URL`. Export `env` from this module and refactor `lib/db.ts`, `lib/supabaseClient.ts`, `lib/shippoClient.ts`, all `pages/api/**` to import `env` instead of touching `process.env` directly. Fail loudly at boot if anything is missing.
   - Add `DATABASE_URL_DEV` as a required-in-development env var pointing at the Supabase agent branch (the DBA role is provisioning it). Refuse to start `next dev` if `NODE_ENV !== 'production'` and `DATABASE_URL_DEV` is unset — this prevents an agent from accidentally running against the prod DB.

3) Logging strategy.
   - There are 99 `console.log` calls across `pages/api/**`, many with emojis. Add `lib/log.ts` exporting `log.debug`, `log.info`, `log.warn`, `log.error`. In production (`NODE_ENV === 'production'`), `debug` is a no-op and others go to `console` as JSON lines. Do a project-wide replace: `console.log` → `log.debug`, `console.error` → `log.error`. Strip the emoji prefixes during the swap.

4) CI pipeline.
   - Add `.github/workflows/ci.yml` running on PRs and main: install with `npm ci`, run `npm run check` (Biome), `npx tsc --noEmit`, `npm run build`. Cache `~/.npm` and `.next/cache`.
   - Add a second job that scans for committed secrets using `gitleaks` (free, GH-action). Fail the build if anything matches the Stripe/Supabase/Shippo patterns.
   - Add `npm run typecheck` script: `tsc --noEmit`.

5) Pre-commit guard.
   - Add `husky` + `lint-staged`. On commit: `biome check --write` on staged files plus `tsc --noEmit` on the whole project (or `tsc -p tsconfig.json --incremental`).

6) Deploy config.
   - Add `vercel.json` that sets `framework: "nextjs"` and pins Node 20.
   - Document the production `NEXT_PUBLIC_BASE_URL` requirement in `env.example`. Today the Stripe webhook auto-label code falls back to `http://localhost:3000` when the env var is missing — that bug is on the backend role, but make sure ops never deploys without the var set: add it to the `lib/env.ts` required list (item 2).
   - Decide the redirect strategy: `www` → apex or vice versa. Document in `DEPLOY.md` along with custom-domain steps for Vercel + Supabase Auth redirect URLs + Stripe webhook endpoint URL + Shippo webhook URL.

7) Database operational scripts.
   - The 30+ files in `database/*.sql` are not a migration system. Coordinate with the DBA role: your job is to wire `npm run db:migrate` into CI as a "verify migrations are clean" step (no destructive run). Drizzle's `migrate.ts` exists in `drizzle/migrate.ts` — confirm it actually runs against `DATABASE_URL` and add a `npm run db:check` script that lists pending migrations.

8) Observability minimum.
   - Add Sentry (or document a chosen alternative) wiring for both the Next.js client and API routes. Capture only `error` and `warn`. Scrub PII (cart contents, addresses, emails) in `beforeSend`.
   - Add a `/api/health` returning DB ping + `200`. No secrets in the response.

Constraints:
- Do not change product/business logic. Don't migrate routes to Drizzle (backend role).
- Coordinate with the security engineer on the `env.example` rewrite — don't undo their secret scrubbing.

Deliverables:
- All scripts and config committed.
- `DEPLOY.md` covering: env setup, Vercel project setup, custom domain, Supabase Auth redirect URLs, Stripe webhook config, Shippo webhook config, secret rotation procedure (cross-link `SECURITY_ROTATION.md`), incident runbook stub.
- A passing `npm run ci` locally.

Start by running `git status`, `git ls-files | grep -E '\.DS_Store|tsbuildinfo|\.backup$|auth\.txt'`, and `cat .gitignore`. Then move through items in order.
```

---

## 3. DBA / Data-Migration Engineer — P1, run after Wave 1 lands

```
You are a database engineer responsible for cleaning up the 3dthium Postgres schema (Supabase-managed) before launch. The site uses Drizzle ORM (`drizzle/schema.ts`) for typing but most code still hits Supabase directly with raw queries. The schema is mid-migration: legacy `products` + `product_variants` tables coexist with new `products_new` + `product_variants_new` tables, and `database/` contains 30+ ad-hoc SQL files of varying quality (including several that disable RLS).

Scope (in priority order, commit per item):

1) Inventory.
   - Open `drizzle/schema.ts`, `database/schema.sql`, and every `database/*.sql` file. Produce `docs/db/CURRENT_STATE.md` that lists: every table (with column types and FKs), every RLS policy currently active, every storage policy currently active, and which `database/*.sql` files are still relevant vs. obsolete.
   - Cross-reference with code: `grep -rn "from('products'\|from('product_variants'\|from('products_new'\|from('product_variants_new')" pages components`. List every file that reads or writes each table.

2) Pick the canonical schema.
   - The new schema (`products_new`, `product_variants_new`) is the target. Confirm by reading `drizzle/schema.ts` (it only defines the `_new` versions) and `pages/api/products.ts` (reads `products_new`).
   - Decide what to do with `pages/api/admin/orders/[id].ts` which currently joins BOTH `products` AND `products_new`. Document the data fix needed: backfill any old `order_items.product_id` referencing `products` into `products_new` equivalents, or accept that historical orders may show legacy joins.

3) Rename, don't keep "_new" forever.
   - Plan a migration to rename `products_new` → `products` and `product_variants_new` → `product_variants`. This requires (a) draining or archiving the legacy tables, (b) updating every code reference, (c) rewriting Drizzle schema. Coordinate with the backend engineer: write the rename as a Drizzle migration so the backend can pick up the renamed tables when they refactor.
   - If draining legacy data is too risky, stop the rename, just freeze the legacy tables as `products_legacy`/`product_variants_legacy` and lock them down with a SELECT-only RLS policy.

4) Migration system.
   - Move from "throw SQL at Supabase studio" to Drizzle migrations.
   - Make sure `drizzle/migrate.ts` actually applies migrations from a `drizzle/migrations/` folder. Generate a baseline migration (`drizzle-kit generate`) capturing the current schema. Commit it.
   - Document `npm run db:generate`, `db:migrate`, `db:push`, `db:studio` in `docs/db/WORKFLOW.md` with which one to use when (push for local dev, generate+migrate for prod).

5) Consolidate the SQL graveyard.
   - In `database/`, KEEP only: a `_archive/` folder containing every existing file (so history is preserved), and a single `database/README.md` that explains the directory is deprecated and points at `drizzle/migrations/`.
   - The security engineer is producing a final RLS policy file (`database/rls_final.sql`) and storage policy file (`database/storage_rls.sql`). Convert those into Drizzle migrations as well so they're version-controlled.

6) Constraints and integrity.
   - Read `drizzle/schema.ts`. Several FK relationships are declared via `relations()` but there are no actual FK constraints on columns like `productVariantsNew.productId`, `categoryAttributes.categoryId`. Add proper `references()` declarations and a migration that adds the FK constraints with ON DELETE behaviour (CASCADE for variants→product, SET NULL for category_attributes→category).
   - Add a unique index on `products_new(slug)` if not already (it's marked unique in Drizzle, verify it's unique in the DB).
   - Add a unique index on `categories(slug)`.
   - Add `created_at` indexes on `orders`, `order_items`, `checkout_carts` for the admin list views.

7) Stripe webhook idempotency table.
   - Coordinate with the security engineer / backend engineer who are adding idempotency. Provide the migration: `stripe_webhook_events (id text primary key, type text, payload jsonb, received_at timestamptz default now())`.

8) Document.
   - `docs/db/SCHEMA.md` — current canonical schema as a list of tables, columns, FKs, indexes.
   - `docs/db/RLS.md` — final policy intent for every public-facing table.

9) Set up a non-prod database branch for agent work.
- Use Supabase database branching (Supabase Dashboard → Branches, or `supabase db branch create agent-dev`) to create an isolated copy of the production schema + a small seeded dataset.
- Add `DATABASE_URL_DEV` to `env.example` and `lib/env.ts` (coordinate with DevOps). Document that any Claude Code session doing schema or data work MUST point at `DATABASE_URL_DEV`, never `DATABASE_URL`.
- Add an npm script `db:branch:reset` that drops the agent branch and recreates it from the latest migration set + seed.
- Document the workflow in `docs/db/AGENT_SAFETY.md`: agents work on the branch; migrations are reviewed in PR; only a human merges to the production branch.

Constraints:
- Do not refactor application code. That's the backend engineer's job.
- Do not destructively drop legacy `products`/`product_variants` until the backend engineer confirms no remaining reads. Until then, lock them down.
- Every schema change must be a Drizzle migration committed to `drizzle/migrations/`. No more "paste this in Supabase SQL editor" instructions.

Deliverables:
- `docs/db/CURRENT_STATE.md`, `docs/db/SCHEMA.md`, `docs/db/RLS.md`, `docs/db/WORKFLOW.md`.
- A clean `drizzle/migrations/` folder with a baseline + your changes.
- `database/_archive/` containing all the old files.

Start by running `ls database/` and `wc -l database/*.sql`, then read `drizzle/schema.ts` end-to-end, then build the inventory.
```

---

## 4. UI/UX Designer — P1, run in parallel with DBA

```
You are a senior product designer joining 3dthium pre-launch. The codebase is a Next.js 15 e-commerce site for a multi-category 3D-print store: hero, featured products, custom-order CTA, product listing, product detail, cart, checkout (with Shippo shipping selection and Stripe), account, orders, contact, custom-order form, plus a full admin panel (products, categories, orders, users, custom orders). The team has been shipping code without a consistent design system. Your output is design specs and tokens that the frontend engineer will implement — you should not be touching any code yourself except a single `styles/tokens.css` and an `mdx`/`md` design doc.

Scope (in priority order):

1) Audit the current visual surface.
   - Read every file in `pages/` and `components/`. Note inconsistencies in: spacing scale, typography scale (currently `font-light` is everywhere, no consistent heading hierarchy), colour usage (emerald, cyan, zinc all used ad-hoc with `/5`, `/10`, `/20` opacity values scattered), button styles, form input styles, card patterns, empty states, error states, loading states, focus states.
   - Take screenshots / describe each page state in a `docs/design/AUDIT.md`. Group findings by issue type.

2) Design tokens.
   - Author `styles/tokens.css` defining CSS custom properties for: colour (brand primary/secondary/accent, neutrals, semantic success/warn/danger/info), spacing scale (4-px base), radius scale, shadow scale, typography scale (font-family, sizes, line-heights, weights — pick max 3 weights). Map them to Tailwind 4 `@theme` block as well (`tailwindcss.config.js` is currently minimal — coordinate with frontend on whether to inline `@theme` in `globals.css` or keep the JS config).
   - Document the tokens in `docs/design/TOKENS.md` with usage rules ("brand-primary on dark, brand-primary-on-light variant for light backgrounds", etc.).

3) Component specs.
   - For each of these primitives, write a one-page spec (`docs/design/components/<name>.md`) covering states (default/hover/active/disabled/loading/error), spacing, anatomy, and usage rules: Button, Input, Textarea, Select, Checkbox, Radio, FileUpload, Card, ProductCard, Modal, Toast (already exists — refine it), Badge, EmptyState, ErrorState, LoadingSpinner, PageHeader, Breadcrumb, Pagination.
   - Specify focus rings explicitly — the current site has no consistent keyboard focus treatment.

4) Page-level redlines.
   - For the customer pages, produce `docs/design/pages/<page>.md` describing the layout, copy direction, primary/secondary actions, and empty/loading/error variants for: Home (`/`), Products (`/products`), Product Detail (`/products/[slug]`), Cart, Checkout (3 steps: address → rates → payment — current implementation), Success, Account, Orders, Custom Order, Contact, Auth (sign in / sign up / reset).
   - For the admin pages, produce specs for: Dashboard (currently `pages/admin/index.tsx`), Products list, Create Product, Categories, Orders list, Order detail, Users, Custom Orders. The admin pages today are 200–1000 lines of JSX each with no consistent layout pattern — your spec should pin down list/detail/form layouts.

5) Empty / loading / error states.
   - Catalogue every place in the app where data is fetched and define the state machine: skeleton → empty → error → success. Currently many pages just render nothing on error or show an `alert()` — those need replacing.

6) Brand voice + microcopy.
   - The product is "3dthium". Define a one-pager `docs/design/VOICE.md` covering tone, do/don't word lists, error message style, success message style, button verb conventions ("Add to bag" vs "Add to cart" — pick one).

7) Accessibility baseline.
   - Document the contrast requirements, focus-visible expectations, semantic landmarks, and keyboard nav rules the frontend engineer must hit. Reference WCAG 2.2 AA. Note any current colour pairs that fail (the emerald/cyan on white can be borderline at small sizes).

Constraints:
- Do not edit React components, page files, or anything outside `styles/tokens.css`, `tailwindcss.config.js`, and `docs/design/**`. The frontend engineer will implement.
- Use plain Markdown for all specs. ASCII layout diagrams are fine; no Figma export needed.
- Be opinionated. The frontend engineer will follow your spec literally.

Deliverables:
- `styles/tokens.css` (or `@theme` block — pick one).
- `docs/design/AUDIT.md`, `TOKENS.md`, `VOICE.md`, `ACCESSIBILITY.md`.
- `docs/design/components/*.md` (15+ component specs).
- `docs/design/pages/*.md` (every page).

Start by running `find pages components -name "*.tsx" | xargs wc -l | sort -n` to size the surface, then read the customer-facing pages first (Home, Products, Product Detail, Cart, Checkout).
```

---

## 5. Backend / API Engineer — P2, run after Wave 1 + DBA migrations

```
You are a senior backend engineer on 3dthium (Next.js 15 Pages Router, Supabase Postgres, Drizzle ORM, Stripe Checkout, Shippo). The security engineer has already (a) gated `pages/api/admin/**` behind `requireAdmin`, (b) added Stripe webhook idempotency, (c) added Shippo webhook signature verification, (d) replaced `check-admin` with cookie-based `/api/auth/me`, (e) deleted `/api/test*`. The DBA has produced a clean Drizzle schema and migrations. Your job is to fix the remaining server-side bugs and adopt Drizzle properly.

Scope (in priority order, commit per item):

1) Stop trusting client-supplied prices.
   - File: `pages/api/checkout_sessions.ts`. Today it calls Stripe with `unit_amount: Math.round(item.price * 100)` and `shipping_cost` from the request body. Both must come from the server.
   - For each cart item, look up `products_new.base_price` and (if `variant_id` is present) `product_variants_new.price_adjustment` from the DB inside a single Drizzle query. Compute `unit_amount = (basePrice + priceAdjustment) * 100`. Reject the request with 400 if any product is `is_active = false` or any variant is `is_available = false`.
   - For shipping: do NOT accept `shipping_cost` from the body. Instead, accept only `shipping_rate_id`, then re-fetch the rate from Shippo (`shippo.rates.get(rate_id)`) and use that amount. Persist the resolved rate in `checkout_carts`.
   - Apply the same "lookup, don't trust" rule in the Stripe webhook handler when it inserts `order_items.price_at_purchase`.

2) Promo-code endpoint hardening.
   - File: `pages/api/promo_code/validate.ts`. Today: accepts arbitrary `orderTotal`, increments `uses` on `apply: true` without an order linkage. Rewrite to ONLY validate (return `discountAmount` given a server-computed cart total) — do not increment `uses` here. Add `pages/api/promo_code/apply.ts` that the Stripe webhook calls after a successful payment to bump `uses` atomically (use `UPDATE … SET uses = uses + 1 WHERE id = ? AND (max_uses IS NULL OR uses < max_uses)` and check rowcount). Move the discount math from the client to a shared `lib/pricing/applyPromo.ts`.

3) Server-side cart pricing helper.
   - Create `lib/pricing/quoteCart.ts` exporting `quoteCart(cart, opts): Promise<{ items, subtotal, shipping, discount, total }>`. Used by checkout sessions and by a new `POST /api/cart/quote` that the frontend uses to render totals (so totals always come from the server).
   - The frontend currently computes `subtotal = cart.reduce(...)` and `total = subtotal + shippingCost - discount` itself — that's fine for display but the source of truth is the server.

4) Stripe webhook robustness.
   - File: `pages/api/stripe/webhook.ts`.
   - Stop the in-process HTTP self-call to `/api/shipping/label`. Refactor `pages/api/shipping/label.ts` to export `createLabelForOrder(orderId, rateId)` and call it directly. Delete the `process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'` fallback.
   - Wrap order creation + items insert + label creation in a single Drizzle transaction. If any step fails, log to Sentry (DevOps role added it) and return 500 so Stripe retries.
   - Use the `stripe_webhook_events` table the DBA created for idempotency: insert event.id at the top; if it already exists, return 200 immediately.
   - Send the customer order-confirmation email here (today there's `pages/api/admin/send-order-confirmation.ts` that's manually triggered — port its logic into a `lib/email/sendOrderConfirmation.ts` and call it from the webhook).

5) Adopt Drizzle in API routes.
   - Replace raw Supabase client usage in the following routes with Drizzle queries (server-side only — keep Supabase Auth + Storage for those use cases): `pages/api/admin/products.ts`, `pages/api/admin/products/[id].ts`, `pages/api/admin/categories.ts`, `pages/api/admin/categories/[id].ts`, `pages/api/admin/orders.ts`, `pages/api/admin/orders/[id].ts`, `pages/api/admin/users.ts`, `pages/api/admin/users/[id].ts`, `pages/api/admin/custom-orders.ts`, `pages/api/admin/custom-orders/[id].ts`, `pages/api/admin/metrics.ts`, `pages/api/admin/product-variants/**`, `pages/api/products.ts`, `pages/api/products/[slug].ts`, `pages/api/products/[slug]/variants.ts`, `pages/api/promo_code/validate.ts`, `pages/api/custom-order.ts`.
   - Keep `getSupabaseAdmin()` only for the storage upload (`pages/api/admin/upload-image.ts`) and the auth-cookie reads.

6) Input validation everywhere.
   - Add `zod` schemas for every request body and query in `pages/api/**`. Reject with 400 + the validation error on parse failure. Co-locate schemas in `lib/api/schemas/`.

7) Error envelope.
   - Standardise responses: success → `{ data: ... }`; error → `{ error: { code, message, details? } }`. Update the frontend's fetch helpers (coordinate with frontend engineer).

8) Custom-order endpoint fix.
   - `pages/api/custom-order.ts` accepts any `file_url` from the body. Restrict to URLs under your Supabase Storage public domain, or require the caller to upload via a signed-upload flow you control. Add rate-limiting (use `@upstash/ratelimit` or document a Redis-based plan if Upstash isn't available).

9) Contact form.
   - The frontend's `pages/contact.tsx` currently fakes a submission. Add a real `pages/api/contact.ts` that validates input and either writes to a `contact_messages` table (DBA migration) or sends via your email provider. Coordinate with frontend on the wire format.

10) Remove dead code.
    - Delete `pages/api/test*.ts` if Security hasn't already.
    - Delete `pages/admin/products.tsx.backup` if DevOps hasn't.
    - Decide what to do with `pages/api/admin/send-order-confirmation.ts` — if the webhook now sends automatically, demote this to an "admin re-send" action.

Constraints:
- Do not touch authentication code paths the security engineer wrote (`requireAdmin`, `/api/auth/me`, webhook signature checks).
- Use the Drizzle schema produced by the DBA — do not re-define tables.
- Every PR/commit must `npm run check && npx tsc --noEmit && npm run build` cleanly.

Deliverables:
- Refactored API routes.
- `lib/pricing/`, `lib/email/`, `lib/api/schemas/`, `lib/api/respond.ts`.
- A short `docs/api/README.md` listing every endpoint with method, auth requirement, request schema, response schema.

Start by listing the API routes (`find pages/api -name "*.ts"`) and reading the security engineer's `SECURITY_AUDIT_RESULTS.md` and the DBA's `docs/db/SCHEMA.md`. Then tackle (1) — it's the biggest correctness bug.
```

---

## 6. Frontend Engineer — P3, run after Backend stable + Designer specs

```
You are a senior frontend engineer on 3dthium (Next.js 15 Pages Router, React 19, Tailwind 4, TypeScript). The backend has been refactored: every admin route now requires admin auth, prices are server-computed, `/api/auth/me` replaces `/api/auth/check-admin`, `/api/cart/quote` returns server-authoritative totals, and a real `/api/contact` endpoint exists. The UI/UX designer has produced `docs/design/**` with tokens and component specs. Your job is to implement the design system, eliminate dead/legacy code, and make every page robust against loading/error/empty states.

Scope (in priority order, commit per item):

1) Adopt the design tokens.
   - Read `styles/tokens.css` and `docs/design/TOKENS.md`. Wire tokens into Tailwind 4 (either inline `@theme` in `styles/globals.css` or via `tailwindcss.config.js` — match what the designer chose). Replace the ad-hoc colour usages (`emerald-500/5`, `cyan-500/10`, `zinc-900`, etc.) with token-backed classes. Goal: a global find/replace that ends with no hard-coded brand-coloured Tailwind classes outside the token definitions.

2) Build the primitive components.
   - Create `components/ui/Button.tsx`, `Input.tsx`, `Textarea.tsx`, `Select.tsx`, `Checkbox.tsx`, `Radio.tsx`, `FileUpload.tsx`, `Card.tsx`, `Modal.tsx`, `Badge.tsx`, `EmptyState.tsx`, `ErrorState.tsx`, `Spinner.tsx`, `PageHeader.tsx`, `Breadcrumb.tsx`, `Pagination.tsx`, refining the existing `Toast.tsx` and `ProductCard.tsx`. Match the designer's specs in `docs/design/components/*.md` exactly. Every component must support a `disabled` and `loading` state where applicable, and have a visible focus ring.
   - Replace every native `<button>`, `<input>`, `<select>`, `<textarea>` in `pages/**` and `components/**` with these primitives. Use `grep -rn "<input\|<button\|<select\|<textarea" pages components` to enumerate.

3) Replace `alert()` calls.
   - The codebase uses `alert(...)` for errors (e.g., `pages/checkout.tsx`). Replace every `alert` with a toast via the existing `Toast.tsx` (refined). Use `grep -rn "alert(" pages components`.

4) Loading / empty / error states everywhere data is fetched.
   - For each page that fetches: `/`, `/products`, `/products/[slug]`, `/cart`, `/checkout`, `/account`, `/orders`, every admin page. Implement the four states (`idle/loading/empty/error/success`) per the designer's spec. Use a small `useFetch` hook in `lib/hooks/useFetch.ts` (TanStack Query is overkill given the shape; a custom hook is fine — coordinate if you'd rather adopt RQ).

5) Wire to server-authoritative pricing.
   - On `pages/cart.tsx` and `pages/checkout.tsx`, call `POST /api/cart/quote` whenever the cart changes and render the returned `subtotal/shipping/discount/total`. Stop computing totals client-side. The `CartContext` still holds the items as the source of truth for quantity/variant choice; pricing is always server-side.
   - Display the per-line price the server returned, not what's stored in `CartContext` — this also fixes a bug where stale prices stick if the admin edits a product mid-session.

6) Real contact form.
   - `pages/contact.tsx` currently does `await new Promise(r => setTimeout(r, 1500))` and shows fake success. Wire it to `POST /api/contact`. Add field validation, error toast, success state.

7) Auth flows.
   - `components/auth/AuthForm.tsx` is empty. Build it per the designer's spec for sign-in / sign-up / reset. Check `pages/auth/index.tsx` and `pages/auth/reset.tsx` — wire them to use the new component. Also fix the lint errors in `pages/auth.tsx` (`resetMode`, `handlePasswordReset` unused — see `auth.txt` from the previous failing build).

8) Admin UI cleanup.
   - The admin pages are 200–1000 lines each. Extract reusable list/detail/form patterns per the designer's `docs/design/pages/admin/*` specs. Don't rewrite functionality — refactor for consistency. The biggest wins: `pages/admin/orders.tsx` (1004 lines), `pages/admin/create-product.tsx` (740 lines).
   - Replace `AdminLayout`'s client-side redirect-on-not-admin with a server-side check using `getServerSideProps` calling `/api/auth/me`. Client-side gating still stays as a belt-and-braces but the page should not flash content.

9) Strip dead code.
   - Delete empty `components/auth/AuthForm.tsx` and `components/sections/AboutPreview.tsx` after moving real implementations in (or repurposing).
   - Remove `components/SessionDebug.tsx` from `pages/_app.tsx` in production (gate on `NODE_ENV !== 'production'`).
   - Run `npx ts-prune` and remove genuinely-unused exports.

10) Image optimisation pass.
    - Audit every `<img>` and `<Image>` usage. The cart and product pages use `<Image>` correctly; some admin components may use raw `<img>`. Set proper `sizes` on every responsive image so Next.js generates the right srcset.
    - `next.config.ts` `images.domains` is deprecated → use `images.remotePatterns` with the Supabase storage host.

11) Form ergonomics.
   - Adopt `react-hook-form` + `zod` resolvers in: checkout address form, custom order form, contact form, admin create-product form, admin category form.

12) i18n / currency.
    - The site shows `£` everywhere with hardcoded `gbp`. Centralise in `lib/format/money.ts`. (Don't add full i18n unless the designer's spec calls for it.)

Constraints:
- Don't change API contracts. If you need a new field, ask the backend engineer.
- Don't introduce new state libraries beyond what's already there + react-hook-form. No Zustand/Jotai/Redux unless explicitly justified in the design spec.
- Maintain Pages Router. Do not migrate to App Router in this pass.

Deliverables:
- All UI components in `components/ui/**`.
- Refactored pages.
- A `docs/frontend/COMPONENTS.md` index listing every primitive and where to import it from.
- Lighthouse score must not regress (Performance role will measure separately).

Start by reading `docs/design/TOKENS.md` end-to-end, then build the primitives in `components/ui/`, then sweep the pages.
```

---

## 7. QA / Test Engineer — P4, after Backend + Frontend stabilise

```
You are a senior QA engineer setting up the test harness for 3dthium pre-launch. The codebase has zero tests today. You'll add unit tests, API integration tests, and end-to-end tests covering the highest-risk flows: payments, admin auth, and price tampering attempts.

Stack to set up:
- Vitest for unit + API tests (works with Next.js Pages Router via `next-test-api-route-handler`).
- Playwright for end-to-end browser tests.
- MSW for mocking Stripe/Shippo at the network layer in non-E2E tests.
- A seeded test Supabase project (or local Postgres via the existing `docker-compose.yml`) for integration tests.

Scope (in priority order, commit per item):

1) Test scaffolding.
   - Add `vitest.config.ts`, `playwright.config.ts`, `.github/workflows/ci.yml` jobs for both. Coordinate with DevOps — they own CI; you contribute the steps.
   - Add npm scripts: `test`, `test:unit`, `test:e2e`, `test:e2e:ui`.
   - Configure Vitest with `@testing-library/react` for component tests.

2) Critical-path E2E (Playwright).
   - **Guest checkout happy path**: home → product → add to cart → cart → checkout → enter address → pick rate → mock Stripe redirect → success page. Assert order is created in DB. Assert order-confirmation email is queued.
   - **Authenticated checkout happy path**: same, with a logged-in user.
   - **Price tampering attempt** (regression test for the now-fixed bug): seed a £100 product. Submit `POST /api/checkout_sessions` with `cart[0].price = 0.01`. Assert the Stripe session line item is £100, not £0.01.
   - **Shipping cost tampering**: same idea — assert the server uses Shippo's resolved rate, not the body.
   - **Promo code abuse**: call `/api/promo_code/validate` 100x with `apply: true` and verify `uses` is not incremented (the new design only increments after a successful Stripe payment).
   - **Custom order**: submit valid form, verify row exists in `custom_orders`. Submit with an off-domain `file_url`, verify rejection.
   - **Contact form**: submit, verify row in `contact_messages` (or queued email).

3) Admin auth E2E.
   - Anonymous user hitting `/admin` is redirected to `/auth`.
   - Non-admin authenticated user hitting `/admin` is redirected to `/`.
   - Admin user can list users, products, orders.
   - **Direct API access without admin cookie**: `curl POST /api/admin/products` returns 401. (Run as a Vitest test, not Playwright — easier.)
   - **Direct API access with non-admin cookie**: returns 403.

4) Stripe webhook tests.
   - Replay the same `checkout.session.completed` event twice; assert only one `orders` row created (idempotency).
   - Send an event with an invalid signature; assert 400 and no DB writes.
   - Send a `payment_intent.succeeded` standalone; assert no order created.

5) Shippo webhook tests.
   - Send unsigned request → 401.
   - Send signed request with valid tracking → order status updated.
   - Send signed request with unknown tracking → 404.

6) Unit tests for pricing.
   - `lib/pricing/quoteCart.ts`: empty cart, single item, item with variant adjustment, item + shipping, item + shipping + percentage promo, item + shipping + fixed promo, promo can't make total negative.

7) Component smoke tests.
   - One test per primitive in `components/ui/**`: renders default state without throwing, fires the correct callback. This guards against regressions during the design-system rollout.

8) Test data.
   - Add `tests/fixtures/seed.ts` that resets the test DB to a known state (categories, 3 products, 1 admin, 1 regular user). Run before each E2E test.

9) Documentation.
   - `docs/testing/README.md`: how to run tests locally, how the test DB is set up, how to add new tests, naming conventions.

Constraints:
- Do not modify application code to make tests pass. If a test fails because of a real bug, file it as an issue, don't paper over it.
- Tests must be deterministic. No random sleeps; use Playwright's auto-wait.
- E2E tests run against a local dev server, not production.

Deliverables:
- A passing test suite.
- CI green.
- `docs/testing/README.md`.

Start by adding the scaffolding (`vitest.config.ts`, `playwright.config.ts`), then write the price-tampering regression test first — it's the highest-leverage one.
```

---

## 8. Performance / SEO Engineer — P5, last

```
You are a senior performance + SEO engineer giving the 3dthium site a final polish before launch. The application is functionally complete and tested. Your job is measurable wins on Core Web Vitals + organic discoverability.

Scope (in priority order, commit per item):

1) Baseline measurement.
   - Run Lighthouse on every public page: `/`, `/products`, `/products/[slug]` (pick top product), `/cart`, `/checkout`, `/about`, `/contact`, `/custom-order`, `/auth`, `/orders`. Capture LCP, CLS, INP, TBT, total bundle size, Total Blocking Time.
   - Output `docs/perf/BASELINE.md` with a table of scores.

2) Image strategy.
   - Verify every `next/image` use has explicit `width`/`height` or `fill` + a parent with size — CLS cuts come from here.
   - Set `sizes` correctly on responsive images.
   - Ensure Supabase Storage images are served as WebP (or AVIF) — set `images.formats: ['image/avif', 'image/webp']` in `next.config.ts`.
   - Add `priority` to the LCP image on each page (likely the hero on `/`, the main product image on `/products/[slug]`).
   - Compress / regenerate the existing static assets in `public/` if any are oversized.

3) Bundle optimisation.
   - Run `next build` and inspect the route bundle sizes. Target: every public page under 200 kB JS first-load.
   - Find heaviest deps with `npm ls --depth=0` cross-referenced against the bundle analyzer (`@next/bundle-analyzer`).
   - Convert client-only components that don't need to be client to RSC-style — though Pages Router limits this, use `dynamic(() => import(...), { ssr: false })` for heavy client widgets (e.g., variant picker if it has a big dependency).
   - Consider replacing any heavy-handed deps (`lodash` if used; check `formidable` if any client bundle pulls it in by accident).

4) Caching headers.
   - Public APIs (`/api/products`, `/api/products/[slug]`): set `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` (already done in `/api/products`; verify the rest).
   - Static assets are handled by Next/Vercel automatically; verify no overrides.
   - Add `Cache-Control: no-store` to all `/api/admin/*` and `/api/auth/*` and `/api/checkout_sessions`.

5) ISR / SSG where it pays off.
   - `/products` (list) and `/products/[slug]` are ideal for `getStaticProps` + `revalidate`. Convert them, with on-demand revalidation triggered from the admin product create/update routes (the backend engineer can expose a small revalidation endpoint).
   - Home page if it's mostly static blocks.

6) Metadata + Open Graph.
   - Audit every page's `<Head>`. Add per-page `<title>`, `<meta name="description">`, `<meta property="og:*">` and `<meta name="twitter:card">`.
   - For product detail pages, generate dynamic OG images using `@vercel/og` showing product name + thumbnail.

7) Structured data.
   - Add JSON-LD `Product` schema on `/products/[slug]` (name, image, offer, price, availability).
   - Add `BreadcrumbList` on category/product pages.
   - Add `Organization` + `WebSite` on `/`.

8) `robots.txt` + sitemap.
   - Add `public/robots.txt` allowing the public pages and disallowing `/admin*`, `/account`, `/orders`, `/api/*`.
   - Add `pages/sitemap.xml.ts` generating a sitemap from active products + static pages.

9) Fonts.
   - The site currently uses `Inter` via Tailwind config. Use `next/font/google` for self-hosted, FOIT-free loading.

10) Final pass.
    - Re-run Lighthouse. Update `docs/perf/RESULTS.md` with before/after table. Open issues for anything that didn't hit target.

Constraints:
- Do not regress any test. CI must stay green.
- Do not change API behaviour or design. UX changes go back to the designer.

Deliverables:
- `docs/perf/BASELINE.md`, `docs/perf/RESULTS.md`.
- All optimisations committed.
- Updated `next.config.ts`, `public/robots.txt`, `pages/sitemap.xml.ts`.

Start by running `npm run build && npx @next/bundle-analyzer` and a Lighthouse run on `/` and `/products`. Capture the baseline before making changes.
```

---

## How to use this document

1. Open eight Claude Code sessions in eight terminals, all at the repo root (`/Users/saadiqmahmood/Documents/3dthium`).
2. Run them roughly in the dispatch order. Wave 1 (Security + DevOps) **must** finish first. Wave 2 (DBA + Designer) can start as soon as Wave 1 is in. Wave 3+ depend on the earlier waves landing.
3. Each prompt block tells its agent what other roles have already done — keep that accurate as work lands by editing the prompt before pasting (e.g., if Security skipped item 6, mention it).
4. Have each agent open a separate git branch (`security/...`, `devops/...`, `db/...`, `backend/...`, `frontend/...`, `qa/...`, `perf/...`) and merge in waves. The designer's branch is mostly docs and can merge any time.

— Audit complete.
