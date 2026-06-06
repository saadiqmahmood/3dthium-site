# Wave 5 — Feature Plan

## Feature 1: Two-Level Category Selector (Admin)

### What
Replace the single flat category dropdown on the create-product and edit-product admin pages with two linked dropdowns — Primary (parent categories) and Secondary (children of the selected parent).

### How it works
- **Primary dropdown** shows only top-level categories (`parent_id IS NULL`)
- **Secondary dropdown** appears only after a primary is selected, showing its children (`parent_id = selectedPrimary`)
- If the selected primary has no children, secondary is hidden and the product saves with the primary `category_id` directly
- The value saved to `products.category_id` is always the most specific selection (secondary if chosen, primary otherwise)
- On the **edit page**, the existing `category_id` is resolved back to its parent on load to pre-fill both dropdowns correctly

### Files to change
- `pages/admin/create-product.tsx` — replace single select with two linked dropdowns
- `pages/admin/products/[id].tsx` — same, with reverse-lookup on load to pre-fill parent
- No API or DB changes required — `categories.parent_id` already exists

---

## Feature 2: Search Bar in Nav

### What
A search icon in the navbar that expands into a text input. On submit it navigates to `/products?q=searchterm`. The products page filters results by the query param.

### How it works
- Search icon sits between the nav links and the cart/account icons
- Clicking the icon expands an inline input field; pressing Enter or clicking submit navigates to `/products?q=...`
- `/products` reads `router.query.q` and filters the product list client-side (or passes to the API as a query param)
- Mobile: search input lives in the mobile menu drawer
- No autocomplete — straightforward navigation keeps it reliable and fast

### Files to change
- `components/Navbar.tsx` — add search icon + expandable input
- `pages/products/index.tsx` — read `q` param, filter displayed products
- `pages/api/products.ts` — optionally accept `?q=` for server-side filtering (better for ISR)

---

## Feature 3: Favourites

### What
A heart icon in the navbar and on every product card/detail page. Users can save products to a favourites list. A dedicated `/favourites` page shows all saved products.

### Storage
- **Logged-in users** — persisted in DB via a `user_favourites` table
- **Guest users** — stored in `localStorage`; no sync to DB on login (kept simple)

### DB changes
New table via migration `0010_user_favourites.sql`:
```sql
CREATE TABLE "user_favourites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  UNIQUE ("user_id", "product_id")
);
```

### API endpoints
- `GET /api/favourites` — returns array of product IDs for logged-in user
- `POST /api/favourites` — body `{ product_id }`, adds to favourites
- `DELETE /api/favourites/[productId]` — removes from favourites

### Frontend
- `context/FavouritesContext.tsx` — manages state, handles DB for logged-in users and localStorage for guests, exposes `{ favourites, toggle, isFavourited }`
- `components/ui/FavouriteButton.tsx` — reusable heart icon button (filled/outline toggle), used everywhere
- `components/Navbar.tsx` — heart icon with count badge (logged-in users only)
- `pages/favourites.tsx` — grid of favourited products using existing product card component; empty state with "Browse products" CTA
- Update `components/sections/ProductGrid.tsx` (product cards) — add `<FavouriteButton>` overlay on each card
- Update `pages/products/[slug].tsx` (product detail) — add `<FavouriteButton>` near the add-to-cart button

---

## Feature 4: Sort + Filter on /products

### What
Alongside search, add a sort dropdown and category filter chips to the products listing page. Makes search genuinely useful rather than a partial solution.

### Sort options
- Newest (default)
- Price: low to high
- Price: high to low

### Filter
- Category chips — one per top-level category; clicking one filters to that category and its children
- Chips and sort persist in the URL as query params (`?sort=price_asc&category=vases`) so they are bookmarkable and browser-back works

### Files to change
- `pages/products/index.tsx` — add sort dropdown + category chip row, read params from URL
- `pages/api/products.ts` — accept `?sort=` and `?category=` params

---

## Build order

1. **Feature 1** — category dropdowns (self-contained, no DB changes)
2. **Feature 2** — search bar (no DB changes, builds on products page)
3. **Feature 4** — sort + filter (natural extension of search, same page)
4. **Feature 3** — favourites (requires DB migration, most moving parts — do last)
