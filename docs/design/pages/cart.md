# Page: Cart (`/cart`)

## Purpose
Review items before checkout, adjust quantities, remove items, see price summary.

---

## Layout (desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│  Navbar                                                         │
├─────────────────────────────────────────────────────────────────┤
│  PageHeader: "Your cart"                                        │
│  ──────────────────────────────────────────────────────────     │
│                                                                 │
│  ┌──────────────────────────────────────────┐ ┌─────────────┐  │
│  │  Cart items list                         │ │  Summary    │  │
│  │                                          │ │             │  │
│  │  ┌───────────────────────────────────┐   │ │  Subtotal   │  │
│  │  │ [img] Product name    [qty] [×]   │   │ │  £xx.xx     │  │
│  │  │        Variant: Red / M           │   │ │             │  │
│  │  │        £12.00                     │   │ │  Shipping   │  │
│  │  └───────────────────────────────────┘   │ │  calculated │  │
│  │  ┌───────────────────────────────────┐   │ │  at checkout│  │
│  │  │ ...                               │   │ │             │  │
│  │  └───────────────────────────────────┘   │ │  Total      │  │
│  │                                          │ │  £xx.xx     │  │
│  │  [Promo code input + Apply]              │ │             │  │
│  │                                          │ │  [Go to     │  │
│  └──────────────────────────────────────────┘ │   checkout] │  │
│                                               └─────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Mobile: items list full-width, summary below items.

---

## Cart Item Row

```
┌─────────────────────────────────────────────────────────────────┐
│  [Image 80×80px]   Product name            [qty stepper]  [×]  │
│  rounded-md        Variant: Red, Medium      1             ×    │
│  object-contain    £12.00 / line total                          │
└─────────────────────────────────────────────────────────────────┘
```

```
border-bottom: 1px solid border (#e4e4e7)
padding: space-4 0
display: flex; align-items: center; gap: space-4
```

### Product name
`text-base font-medium text-primary`

### Variant
`text-sm text-secondary`

### Price
`text-base font-semibold text-primary` (line total: qty × price)

### Quantity stepper
Same spec as product-detail quantity stepper. Min 1, max 99.

### Remove button
Icon button (×), `text-tertiary`, `hover:text-danger`.
`aria-label="Remove [product name] from cart"`
On remove: confirm with an undo Toast within 5 seconds ("Removed. Undo"), or remove immediately with no confirm (simpler — choose this).

---

## Price Summary Panel

```
bg: surface-raised (#fafafa)
border: 1px solid border
border-radius: radius-lg
padding: space-6
```

| Row | Style |
|-----|-------|
| "Subtotal" + amount | `text-base` left, `font-semibold` right |
| "Shipping" + "Calculated at checkout" | `text-sm text-secondary` |
| Divider | `border-t border-border my-4` |
| "Total" + amount | `text-lg font-bold` left, `text-lg font-bold` right |

Total comes from server (`POST /api/cart/quote`). Show spinner in the amount cell while loading.

### Promo code
```
[Promo code input]  [Apply]   ← secondary button sm
```
Input style: standard Input sm.
Below: success message ("20% off applied") in `text-success text-sm`, or error ("Invalid code") in `text-danger text-sm`.

---

## Primary / secondary actions

- Primary: "Go to checkout" (full-width on mobile, right-aligned summary panel on desktop)
- Secondary: "Continue shopping" (ghost button, links back to `/products`)

---

## Empty state

```
[ShoppingCartIcon 64px text-tertiary]

Your cart is empty

Add a product to get started.

[Browse products]   ← primary button
```

No summary panel when cart is empty.

---

## Loading state

While `POST /api/cart/quote` is fetching pricing:
- Show skeleton rows (2–3) in the items area.
- Show "—" in price cells while server prices load.
- "Go to checkout" button disabled + `aria-busy="true"` until prices confirm.

---

## Error state

If quote fetch fails:
```
Toast (error): "We couldn't calculate your total. Check your connection and try again."
```
Retry on next interaction.

---

## State machine

```
IDLE (cart has items) → QUOTING (fetching server prices) → READY
READY → UPDATING (qty change) → QUOTING → READY
READY → REMOVING (item remove) → QUOTING → READY (or EMPTY)
READY → CHECKOUT (go to checkout)
```
