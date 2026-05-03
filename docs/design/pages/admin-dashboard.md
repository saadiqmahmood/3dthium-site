# Admin Page: Dashboard (`/admin`)

See `admin-layout.md` for chrome (sidebar, main area, filter bar, table patterns).

---

## Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  PageHeader: "Dashboard"                                         │
│  ─────────────────────────────────────────────────             │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Orders   │  │ Revenue  │  │ Products │  │ Users    │        │
│  │ 143      │  │ £8,320   │  │ 24       │  │ 312      │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
│  ┌──────────────────────────────────────┐                        │
│  │  Recent orders                       │                        │
│  │  (last 10, table — abridged version) │                        │
│  │  [View all orders →]                 │                        │
│  └──────────────────────────────────────┘                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Stat Cards

4-column grid (desktop). 2-column (mobile). Gap: `space-6`.

Each Stat Card (see Card spec):
```
Label (top): text-sm font-medium text-secondary
Value (large): text-4xl font-light text-primary
```

Icons (optional, top-right corner of each card, 20px, text-tertiary).

---

## Recent Orders Table

Abridged table (no filters, no pagination). Columns:
- Order # (text-sm font-medium, link to full order)
- Customer email (text-sm text-secondary, truncated)
- Date (text-sm text-secondary)
- Total (text-sm font-semibold)
- Status (Badge)

"View all orders" — ghost button sm, below table. → `/admin/orders`

---

## Loading state

Skeleton Stat Cards (4) — grey blocks. Skeleton table (10 rows, 5 columns).

---

## Error state

If metrics fetch fails: ErrorState inline within the stats grid area. Recent orders table shows ErrorState separately.
