# Open Issues

## 1. Room filter not showing on shop page
- **Status**: Fixed
- **Problem**: `getStaticProps` in `pages/products/index.tsx` hardcoded `rooms: []` and `room_option_ids: []` — never fetched from DB.
- **Fix**: Added `room_options` and `product_room_options` queries to `getStaticProps`. Room filter now renders when rooms exist in DB and are assigned to products.
- **Related**: Admin product edit page also lacked a UI to assign rooms to products — added a "Filter options" section to `pages/admin/products/[id].tsx`.

## 2. Emails (order confirmation, tracking, newsletter, replies)
- **Status**: Partially done — wired in code, waiting on RESEND_API_KEY
- **Problem**: `sendOrderConfirmation` had a TODO stub; contact reply already used Resend. No tracking or newsletter emails existed.
- **Fix**: Integrated Resend into `sendOrderConfirmation`. Tracking email logic added as `sendTrackingUpdate`.
- **Pending**: Client needs to set `RESEND_API_KEY` in Vercel env vars (and `.env.local` for dev). Newsletter email design TBD when subscription provider is chosen.
- **From domain**: Emails sent `from: noreply@3dthium.com` — domain must be verified in Resend dashboard before live sends work.

## 3. File upload on custom orders not working
- **Status**: Fixed
- **Problem**: Form required a file before submission even though the page copy said "No file yet? Describe your idea in the form". API also rejected requests without `file_url`.
- **Fix**: Made file upload optional in both form (`components/sections/CustomOrderForm.tsx`) and API (`pages/api/custom-order.ts`). Submissions with no file are accepted; `file_url` is omitted from the DB row.

## 4. Saved address not showing at checkout
- **Status**: Fixed
- **Problem**: Address API (`/api/user/addresses`) existed but checkout page never fetched or displayed saved addresses for logged-in users.
- **Fix**: Added saved-address picker to the address step in `pages/checkout.tsx`. Logged-in users see their saved addresses and can click one to auto-fill the form.
