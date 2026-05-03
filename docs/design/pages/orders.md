# Page: Orders (`/orders`)

## Purpose
Let users see all their past orders and track status.

---

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Navbar                                                      │
├──────────────────────────────────────────────────────────────┤
│  PageHeader: "My Orders"                                     │
│  ──────────────────────────────────────────────             │
│                                                              │
│  [Order card] ×N                                             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Order #1234 · 12 Jan 2025               [Shipped]   │    │
│  │                                                      │    │
│  │  [img][img][img]  +2 more                            │    │
│  │                                                      │    │
│  │  Total: £24.00           [Track shipment]            │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Order Card

Standard Card (clickable variant).

```
padding: space-5 (20px)
display: flex; justify-content: space-between
```

### Header row
- Left: "Order #[order_number]" (`text-base font-medium`) · "[date]" (`text-sm text-secondary`)
- Right: Badge (status — see Badge spec)

### Image row (middle)
Thumbnails of ordered items (max 3 shown, "+N more" text):
- Each thumbnail: 48×48px, `rounded-md`, `border 1px border`
- `object-contain`, `bg: surface-raised`
- gap: `space-2`

### Footer row
- Left: "Total: £xx.xx" (`text-base font-semibold`)
- Right: "Track shipment" link → tracking URL (if available, otherwise hidden)

---

## Status Badges

See Badge spec. Order statuses:

| Status | Badge variant |
|--------|--------------|
| pending | Warning |
| confirmed | Success |
| printing | Warning |
| shipped | Info |
| delivered | Success |
| cancelled | Danger |

---

## Track Shipment Link

Ghost button sm or plain text link: "Track shipment →"
Opens tracking URL in new tab. `target="_blank" rel="noreferrer"`.
Only shown when `tracking_url` is not null.

---

## Order Detail

On click of Order Card → expand inline (accordion-style) or navigate to `/orders/[id]` (prefer accordion for mobile UX).

Expanded detail:

```
┌──────────────────────────────────────────────────────────────┐
│  Items                                                       │
│  [img] Product name    Variant      Qty    £price            │
│  ...                                                         │
│                                                              │
│  Delivery address                                            │
│  [address block]                                             │
│                                                              │
│  Shipping method                                             │
│  Royal Mail Tracked 48                                       │
│                                                              │
│  Subtotal: £xx.xx                                            │
│  Shipping: £x.xx                                             │
│  Total:    £xx.xx                                            │
└──────────────────────────────────────────────────────────────┘
```

---

## Loading state

Show 3 skeleton Order Cards.

---

## Empty state

```
[ClipboardListIcon 48px, text-tertiary]

No orders yet

When you place an order, it'll appear here.

[Browse products]   ← primary button
```

---

## Error state

```
ErrorState (full section):
heading: "Couldn't load your orders"
body: "Check your connection and try again."
CTA: "Try again"
```

---

## Authentication

Redirect unauthenticated users to `/auth?redirect=/orders`.

---

## Meta

```
<title>My Orders | 3dthium</title>
```
`noindex`.
