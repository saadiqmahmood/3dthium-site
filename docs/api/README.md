# API Reference

All server-side routes. Auth requirements are enforced by `lib/auth/requireAdmin.ts`.

Response envelope:
- Success: `{ data: ... }` (via `lib/api/respond.ok`)
- Error: `{ error: { message, details? } }` (via `lib/api/respond.err`)
- Some legacy routes still return flat JSON — being migrated.

---

## Public

### `GET /api/products`
List active products with variants and price ranges.
Auth: none. Cache: `s-maxage=60, stale-while-revalidate=300`.

### `GET /api/products/[slug]`
Product detail with variants, price range, and variant options.
Auth: none. Cache: `s-maxage=60, stale-while-revalidate=300`.
404 if not found or `is_active=false`.

### `GET /api/products/[slug]/variants`
Variants for a product slug with computed `final_price`.
Auth: none. Cache: `s-maxage=60, stale-while-revalidate=300`.

### `POST /api/cart/quote`
Server-authoritative cart totals. Never trust client-computed prices.

Request:
```json
{
  "cart": [{ "product_id": "uuid", "variant_id": "uuid|null", "quantity": 1, "name": "...", "image_url": "..." }],
  "shipping_rate_id": "shippo-rate-id",
  "promo_code": "SAVE10"
}
```
Response: `CartQuote` — `{ items, subtotal, shipping, discount, total, promo_code?, promo_id? }`

### `POST /api/checkout_sessions`
Creates a Stripe Checkout session. Prices are fetched from DB — client prices are ignored.

Request: cart items (without price), email, shipping_rate_id (required for shipping), optional promo_code.
Returns: `{ sessionId, url }`.

### `POST /api/promo_code/validate`
Validates a promo code against a server-provided orderTotal.

Request: `{ code, orderTotal }`. Returns: `{ valid, discountAmount, type, value, code, promoId }`.
**Does not** increment `uses` — that happens in the webhook after payment.

### `POST /api/custom-order`
Submit a custom print order.

Request: `{ name, email, phone?, material, address, width?, height?, depth?, description, file_url }`.
`file_url` must point to Supabase Storage (validated server-side).
Returns: `{ data: { message } }` (201).

### `POST /api/contact`
Submit a contact message (stores in `contact_messages` table).

Request: `{ name, email, subject?, message }`.
Returns: `{ data: { message } }` (201).

### `GET /api/health`
Health check — DB ping. Returns 200 on success.

---

## Auth

### `GET /api/auth/me`
Returns the current user from the Supabase Auth cookie.
Returns: `{ userId, isAdmin, email }` or 401.

---

## Webhooks

### `POST /api/stripe/webhook`
Stripe webhook endpoint. Signature-verified (`STRIPE_WEBHOOK_SECRET`).
Idempotent via `stripe_webhook_events` table.
On `checkout.session.completed`: creates order + order items (server prices), applies promo, creates shipping label.

### `POST /api/shippo/webhook`
Shippo webhook. Requires `SHIPPO_WEBHOOK_SECRET` bearer token.
Updates order status on delivery/shipping events.

---

## Admin (all require admin cookie via `requireAdmin`)

### `GET /api/admin/metrics`
Dashboard metrics: order count, user count, product count, recent orders/users.

### `GET /api/admin/orders`
List all orders ordered by `created_at` desc.

### `GET|PUT|DELETE /api/admin/orders/[id]`
Order detail (with enriched product/variant info), update, or delete.
PUT accepts any order field subset.

### `GET|POST /api/admin/products`
List products (with category join) or create a product.
POST requires: name, description, category_id, slug, images[].

### `GET|PUT|DELETE /api/admin/products/[id]`
Product detail, update (partial), or delete.

### `GET /api/admin/products/[id]/attributes`
Product attributes list.

### `POST /api/admin/products/[id]/variations/generate`
Auto-generate variant combinations from product attributes.

### `GET|POST /api/admin/product-variants/[productId]`
List or create variants for a product.

### `GET|PUT|DELETE /api/admin/product-variants/[productId]/[variantId]`
Variant detail, update, or delete.

### `GET|POST /api/admin/categories`
List categories (with product counts) or create a category.

### `GET|PUT|DELETE /api/admin/categories/[id]`
Category detail, update, or delete. DELETE blocked if category has products or subcategories.

### `GET /api/admin/category-attributes/[categoryId]`
Category attribute definitions.

### `GET /api/admin/users`
List all users.

### `GET|PUT|DELETE /api/admin/users/[id]`
User detail, update, or delete.

### `GET /api/admin/custom-orders`
List all custom orders.

### `GET|PUT /api/admin/custom-orders/[id]`
Custom order detail or update.

### `POST /api/admin/upload-image`
Upload a product image to Supabase Storage. Returns `{ url }`.

### `POST /api/admin/send-order-confirmation`
Re-send order confirmation email for an order.
Request: `{ orderId }`.

### `GET /api/admin/order-items/[id]`
Order item detail.

---

## Shipping

### `POST /api/shipping/rates`
Fetch Shippo rates for an address + parcel.

### `POST /api/shipping/label`
Create a Shippo shipping label and update the order with tracking info.
Request: `{ rate_id, order_id }`.

---

## Stripe session

### `GET /api/stripe/session`
Retrieve a Stripe session by `session_id` query param.
