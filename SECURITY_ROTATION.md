# Security Rotation Checklist

**CRITICAL — complete this BEFORE deploying to production.**

All secrets listed below were committed to the git repository in `env.example`.
They must be rotated immediately. Rotating a key invalidates the old one; do
not skip any step or the old (exposed) credential will still work.

---

## 1. Supabase — Rotate Service Role Key

The `SUPABASE_SERVICE_ROLE_KEY` bypasses all Row Level Security. It was
committed to the repository and is now public.

**Steps:**
1. Open [https://app.supabase.com](https://app.supabase.com) and select your project.
2. Go to **Settings → API**.
3. Under **Project API keys**, click **Reveal** next to `service_role`.
4. Click **Reset** (or **Regenerate**) to issue a new key.
5. Copy the new key.
6. Update `SUPABASE_SERVICE_ROLE_KEY` in your Vercel environment variables:
   - Vercel Dashboard → Project → Settings → Environment Variables.
7. Update your local `.env.local`.
8. Redeploy the application.

---

## 2. Supabase — Rotate Anon Key (optional but recommended)

The anon key was also in the repo. It is lower-risk (only grants public-role
access) but should be rotated for hygiene.

**Steps:**
1. Same path as above: **Settings → API → anon key → Reset**.
2. Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel and `.env.local`.
3. Redeploy.

---

## 3. Stripe — Rotate Secret Key

`STRIPE_SECRET_KEY` (`sk_test_...`) was committed.

**Steps:**
1. Open [https://dashboard.stripe.com](https://dashboard.stripe.com).
2. Go to **Developers → API keys**.
3. Click **Roll key** next to the secret key, confirm.
4. Copy the new key.
5. Update `STRIPE_SECRET_KEY` in Vercel and `.env.local`.
6. Redeploy.

> Note: The old `sk_test_...` key becomes invalid immediately after rolling.
> Any existing Stripe sessions created with the old key will continue to work
> but new API calls using the old key will fail.

---

## 4. Stripe — Rotate Webhook Secret

`STRIPE_WEBHOOK_SECRET` (`whsec_...`) was committed.

**Steps:**
1. Stripe Dashboard → **Developers → Webhooks**.
2. Click your webhook endpoint.
3. Click **Roll signing secret**.
4. Copy the new `whsec_...` value.
5. Update `STRIPE_WEBHOOK_SECRET` in Vercel and `.env.local`.
6. Redeploy.

---

## 5. Shippo — Rotate API Key

`SHIPPO_API_KEY` (`shippo_test_...`) was committed.

**Steps:**
1. Open [https://app.goshippo.com](https://app.goshippo.com).
2. Go to **API** (left sidebar).
3. Find the key and click **Regenerate** or **Delete** the old key and create a new one.
4. Update `SHIPPO_API_KEY` in Vercel and `.env.local`.
5. Redeploy.

---

## 6. Shippo — Configure Webhook Secret

A new `SHIPPO_WEBHOOK_SECRET` env var was added. You must set this up.

**Steps:**
1. Choose a strong random string (e.g., `openssl rand -hex 32`).
2. Set `SHIPPO_WEBHOOK_SECRET=<your-value>` in Vercel and `.env.local`.
3. In Shippo Dashboard → **Webhooks**, edit your webhook endpoint.
4. Add a custom header: `Authorization: Bearer <your-value>`.
5. Redeploy.

> The 3dthium webhook handler (`pages/api/shippo/webhook.ts`) now verifies
> this header and returns 401 for any request missing it.

---

## 7. Git History

The secrets were committed in `env.example`. Even after the file is cleaned,
they remain in git history.

**Required action before making this repository public (if ever):**
```bash
# Install git-filter-repo
pip install git-filter-repo

# Remove all historical versions of env.example from history
git filter-repo --path env.example --invert-paths

# Force-push (coordinate with all team members — they must re-clone)
git push origin --force --all
git push origin --force --tags
```

If you do not run `git filter-repo`, anyone with access to the repo's git
history can recover the exposed secrets even after the file is cleaned.

Because the repo is private and you are rotating all keys anyway, the
immediate risk is low — but the history should be cleaned before the repo
is ever shared or made public.

---

## Post-rotation Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` rotated in Supabase + Vercel + .env.local
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` rotated (optional but recommended)
- [ ] `STRIPE_SECRET_KEY` rolled in Stripe + Vercel + .env.local
- [ ] `STRIPE_WEBHOOK_SECRET` rolled in Stripe + Vercel + .env.local
- [ ] `SHIPPO_API_KEY` regenerated in Shippo + Vercel + .env.local
- [ ] `SHIPPO_WEBHOOK_SECRET` set and configured in Shippo dashboard
- [ ] Application redeployed and smoke-tested (checkout, webhooks, image uploads)
- [ ] Git history cleaned with `git filter-repo` (schedule for before any repo sharing)
