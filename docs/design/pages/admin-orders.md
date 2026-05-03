# Admin Page: Orders (`/admin/orders`)

The largest admin page (1004 lines). This spec pins down a consistent structure.
See `admin-layout.md` for chrome and table patterns.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  PageHeader: "Orders" (143)                                      │
│  ──────────────────────────────────────────────────────         │
│                                                                  │
│  [Stats row: 4 stat cards]                                       │
│  Today: 3  |  Pending: 12  |  Revenue (month): £1,240  |  ...  │
│                                                                  │
│  [Filter bar]                                                    │
│  [Search]  [Status: All ▾]  [Date range]  [Clear]               │
│                                                                  │
│  [Orders table]                                                  │
│  Order #   Customer        Date         Total    Status  Actions │
│  #1234      jane@…         12 Jan 25    £24.00   Shipped [View] │
│  #1233      bob@…          11 Jan 25    £8.50    Pending [View] │
│  ...                                                             │
│                                                                  │
│  [Pagination]                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Stats Row

4 Stat Cards (same as dashboard):
- Today's orders
- Pending orders (links to status=pending filter)
- Revenue (current month) — `£ formatted`
- Total orders

---

## Filter bar

| Control | Type | Options |
|---------|------|---------|
| Search | Input sm | Searches order # or customer email |
| Status | Select sm | All / Pending / Confirmed / Printing / Shipped / Delivered / Cancelled |
| Date from | Input sm (type=date) | |
| Date to | Input sm (type=date) | |
| Clear filters | Ghost button sm | Visible when any filter active |

---

## Table columns

| Column | Content | Notes |
|--------|---------|-------|
| Order # | `#1234` link | Open order detail |
| Customer | Email address (truncated) | `text-sm text-secondary` |
| Date | `12 Jan 2025` | |
| Total | `£xx.xx` | `font-semibold` |
| Status | Badge | |
| Actions | [View] button sm | → order detail modal |

---

## Order Detail (modal lg)

On clicking "View" or the order number:

```
┌──────────────────────────────────────────────────────────────────┐
│  Order #1234                                        [×]         │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  [Status badge]  ·  12 Jan 2025  ·  jane@example.com           │
│                                                                  │
│  Items                                                           │
│  [img]  Product name  Variant  Qty  £price                      │
│  ...                                                             │
│                                                                  │
│  Delivery address                                                │
│  [address block]                                                 │
│                                                                  │
│  Shipping                                                        │
│  Royal Mail Tracked 48 · [tracking number] [Track →]            │
│                                                                  │
│  Payment                                                         │
│  Subtotal: £xx   Shipping: £x   Discount: −£x   Total: £xx     │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  Update status:  [Status select]  [Update] ← primary sm        │
│  [Resend confirmation email] ← ghost sm                         │
│  [Print label] ← ghost sm (if label not yet generated)          │
│                                                                  │
│                                           [Close] (ghost)       │
└──────────────────────────────────────────────────────────────────┘
```

### Status update
Select: all valid status transitions (not a free-for-all — ideally constrained, e.g., can't move backwards from Delivered to Printing). For v1, allow any status select.
"Update" primary button sm.

---

## Empty state

No orders:
```
[ClipboardListIcon]
No orders yet
```

No results for filter:
```
[MagnifyingGlassIcon]
No orders match your filters
[Clear filters]
```

---

## Loading

Skeleton: stats row (4 grey blocks) + 10-row skeleton table.

---

## Pagination

Page-number pagination. 20 per page.
