# Admin Page: Products (`/admin/products`)

See `admin-layout.md` for chrome and table/filter bar patterns.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  PageHeader: "Products" (24)          [+ Add product]            │
│  ──────────────────────────────────────────────────────         │
│                                                                  │
│  [Filter bar]                                                    │
│  [Search: "Search products…"]  [Category: All ▾]  [Status: All] │
│  [Clear filters — ghost sm]                                      │
│                                                                  │
│  [Product table]                                                 │
│  Name            Category    Price     Stock    Status  Actions  │
│  Product A       Widgets     £12.00    12       Active   [E][D]  │
│  Product B       Gadgets     £8.00 –   0        Inactive [E][D]  │
│                              £15.00                              │
│  ...                                                             │
│                                                                  │
│  [Pagination — page numbers]                                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## Table Columns

| Column | Content | Notes |
|--------|---------|-------|
| Name | Thumbnail (32px) + product name link | Link → `/admin/products/[id]` |
| Category | Text | |
| Price | `£min – £max` or `£price` | |
| Variants | Count | "3 variants" |
| Status | Badge — Active (brand) / Inactive (neutral) | |
| Actions | [Edit] [Delete] | Icon buttons |

Thumbnail: 32×32px, `rounded-sm`, `object-contain`, `bg-surface-raised`.

---

## Actions

### Edit
Icon button (pencil, 16px). → `/admin/products/[id]`

### Delete
Icon button (trash, 16px, `text-tertiary hover:text-danger`).
On click: open confirmation modal:
```
"Delete [product name]?"
"This product will be removed from the store. This action cannot be undone."
[Cancel] (ghost)  [Delete] (danger)
```

---

## Filter bar

Search: Input sm, `placeholder="Search products…"`, filters on keypress (300ms debounce).
Category: Select sm, options from API.
Status: Select sm — All / Active / Inactive.
Clear filters: ghost button sm, shown only when a filter is active.

---

## Empty state

No products:
```
[CubeIcon, text-tertiary]
No products yet
Add your first product to get started.
[+ Add product]   ← primary button
```

No results for filter/search:
```
[MagnifyingGlassIcon, text-tertiary]
No products found
Try a different search term or category.
[Clear filters]   ← ghost button
```

---

## Loading state

Skeleton table: 8 rows × 6 columns.

---

## Create Product action

"+ Add product" → `/admin/create-product` (or open as full-page — not a modal, too much form).

---

## Pagination

Page-number pagination (admin tables benefit from jumping). 20 products per page.
