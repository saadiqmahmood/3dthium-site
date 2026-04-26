# Deployment Guide — 3dthium

## Prerequisites

- Node 20
- A Supabase project (Postgres + Auth + Storage)
- A Stripe account (test + live keys)
- A Shippo account
- A Vercel account linked to this GitHub repo

---

## 1. Environment Variables

Copy `env.example` to `.env.local` and fill in every value. **Never commit `.env.local`.**

Set the same variables in Vercel: Project → Settings → Environment Variables.
Apply them to **Production**, **Preview**, and **Development** environments as appropriate.

| Variable | Scope | Source |
|----------|-------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase → Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Supabase → Settings → API → service_role key |
| `STRIPE_SECRET_KEY` | Server-only | Stripe → Developers → API keys → Secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public | Stripe → Developers → API keys → Publishable key |
| `STRIPE_WEBHOOK_SECRET` | Server-only | Stripe → Developers → Webhooks → signing secret |
| `SHIPPO_API_KEY` | Server-only | Shippo → API → API Keys |
| `SHIPPO_WEBHOOK_SECRET` | Server-only | Self-chosen; configure as custom header in Shippo dashboard |
| `DATABASE_URL` | Server-only | Supabase → Settings → Database → Connection string (URI mode) |
| `NEXT_PUBLIC_BASE_URL` | Public | `https://yourdomain.com` in prod; `http://localhost:3000` locally |

> **Critical**: `NEXT_PUBLIC_BASE_URL` must be set in production. If it is missing, the app will fail to construct absolute URLs for webhooks and email links.

---

## 2. Vercel Project Setup

1. Import the GitHub repo in the Vercel dashboard.
2. Framework is auto-detected as Next.js (`vercel.json` pins it).
3. Node version is pinned to 20.x via `vercel.json`.
4. Set all environment variables above in Vercel before the first deploy.

### Custom Domain

1. Vercel Dashboard → Project → Domains → Add domain.
2. Choose apex (`3dthium.com`) as the canonical domain.
3. Add a `www` redirect: `www.3dthium.com` → `3dthium.com` (Vercel does this automatically if you add both).
4. DNS: add the `A` record (or CNAME for www) Vercel provides at your registrar.
5. SSL is automatic via Vercel.

---

## 3. Supabase Auth — Redirect URLs

In Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://3dthium.com`
- **Redirect URLs** (add all):
  - `https://3dthium.com/**`
  - `http://localhost:3000/**` (for local dev)
  - `https://*.vercel.app/**` (for preview deployments)

---

## 4. Stripe Webhook

1. Stripe Dashboard → Developers → Webhooks → Add endpoint.
2. Endpoint URL: `https://3dthium.com/api/stripe/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
4. After creating, copy the **Signing secret** and set `STRIPE_WEBHOOK_SECRET` in Vercel + `.env.local`.

---

## 5. Shippo Webhook

Shippo uses a shared-secret mechanism rather than a cryptographic signature.

1. Shippo Dashboard → API → Webhooks → Add webhook.
2. URL: `https://3dthium.com/api/shippo/webhook`
3. In the **custom header** field, add: `Authorization: Bearer <your_SHIPPO_WEBHOOK_SECRET>`.
4. Set `SHIPPO_WEBHOOK_SECRET` in Vercel + `.env.local` to the same value.
5. Events: `tracking_updated`

---

## 6. Database Migrations

We use Drizzle migrations. **Do not run raw SQL from the `database/` folder** — use the migration workflow:

```bash
# Generate a new migration after schema changes
npm run db:generate

# Apply pending migrations to production DB
npm run db:migrate

# Local dev only — push schema without migration history
npm run db:push
```

CI runs `npm run typecheck` and `npm run build` but does **not** auto-run migrations against production. Migrations must be applied manually before deploying a schema change.

---

## 7. Secret Rotation Procedure

See `SECURITY_ROTATION.md` for the complete key-by-key rotation procedure with exact dashboard paths.

**General steps:**
1. Rotate the key in the provider dashboard.
2. Update the value in Vercel → Environment Variables.
3. Redeploy (Vercel → Deployments → Redeploy latest).
4. Verify the app is healthy at `/api/health`.

---

## 8. Incident Runbook (stub)

### Site is down / 500 errors

1. Check Vercel → Deployments for a failed build or failed function.
2. Check Supabase → Database → Logs for DB errors.
3. Check Stripe Dashboard for webhook delivery failures.
4. Roll back in Vercel → Deployments → previous deploy → Promote to Production.

### Stripe payments failing

1. Verify `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are set correctly in Vercel env.
2. Check Stripe → Developers → Webhooks → delivery logs.
3. Re-send failed webhook events from the Stripe dashboard.

### Secrets exposed

1. Immediately rotate every key listed in `SECURITY_ROTATION.md`.
2. Update Vercel env vars and redeploy.
3. Review git history for other potential leaks: `git log -p | grep -E 'sk_|whsec_|eyJ'`.

---

## 9. Redirect Strategy

**Canonical domain**: `3dthium.com` (apex).  
`www.3dthium.com` redirects to `3dthium.com` — configured via Vercel domain settings (no code change needed).
