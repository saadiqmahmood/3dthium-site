# Page: Products (`/products`)

## Purpose
Browse all products, filter by category, find and navigate to a specific product.

---

## Layout (desktop)

```
┌─────────────────────────────────────────────────────────────┐
│  Navbar                                                     │
├─────────────────────────────────────────────────────────────┤
│  pt-[64px]                                                  │
│                                                             │
│  PageHeader: "Products"                                     │
│  ─────────────────────────────────────────────             │
│                                                             │
│  [Category filter chips — horizontal scroll on mobile]      │
│  All  |  Category A  |  Category B  |  Category C          │
│                                                             │
│  [Product grid — 4 col desktop, 2 col mobile]              │
│  [ProductCard] [ProductCard] [ProductCard] [ProductCard]   │
│  [ProductCard] [ProductCard] [ProductCard] [ProductCard]   │
│  ...                                                        │
│                                                             │
│  [Load More button — centred]                               │
│  Showing 24 of 143 products                                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Footer                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Category Filter Chips

```
display: flex; flex-wrap: wrap; gap: space-2
margin-bottom: space-6
```

### Chip styles
Default:
```
bg: surface-overlay (#f4f4f5)
border: 1px solid border (#e4e4e7)
text: text-secondary (#52525b)
border-radius: radius-full (pill)
padding: px-4 py-1.5
font-size: text-sm; font-weight: medium
hover: border-strong; bg: surface-raised
```

Active (selected):
```
bg: brand-primary (#10b981)
border-color: brand-primary
text: text-on-dark (#ffffff)
```

### "All" chip
Always present. Selected by default. Deselecting any category chip returns to "All".

### Loading
Show last-known chips while products refetch. Do not remove chips on category switch.

---

## Product Grid

```
grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
gap-4
```

### Loading state (initial or category change)
Show 8 skeleton ProductCards. Chips remain visible and active.

### Empty state
No products match the selected category:

```
[CubeIcon 48px, text-tertiary]

No products in this category

Try a different category or check back soon.

[Clear filter]  ← ghost button
```

### Error state
Fetch failed:

```
ErrorState component (full section)
heading: "Couldn't load products"
body: "Check your connection and try again."
CTA: "Try again"
```

---

## Load More

Show 24 products per page. Load More appends the next 24.

```
[Load more]                     ← secondary button md
Showing 24 of 143 products      ← text-sm text-secondary, below button
```

When loading more: button shows spinner, label "Loading…".

When all loaded: hide button, show "All 143 products loaded" in `text-sm text-secondary`.

---

## Primary / secondary actions

- Primary: click a ProductCard → `/products/[slug]`
- Secondary: category filter

---

## State machine per product grid

```
IDLE → LOADING (on mount or category change)
LOADING → SUCCESS (data arrives)
LOADING → ERROR (fetch fails)
SUCCESS → LOADING (category change or load more)
ERROR → LOADING (retry)
```

---

## Meta

```
<title>Products | 3dthium</title>
<meta name="description" content="Browse our full range of precision 3D-printed products. Filter by category and order direct." />
```
