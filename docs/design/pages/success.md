# Page: Order Confirmation (`/success`)

## Purpose
Confirm that the order was placed successfully, set expectations, and give a clear next step.

---

## Layout

```
┌─────────────────────────────────────────────────────────┐
│  Navbar                                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│            [CheckCircle icon — 64px, success colour]    │
│                                                         │
│            Order confirmed                              │
│                                                         │
│            Thank you, [First name].                     │
│            Order #[order_id] · Confirmation sent to     │
│            [email]                                      │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │  Order summary                                  │   │
│   │  [item]  name   variant  qty   £price           │   │
│   │  ...                                            │   │
│   │  ──────────────────────────────────             │   │
│   │  Total: £xx.xx                                  │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
│            [Continue shopping]  [View orders]           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Centred layout. Max-width: 640px. `pt-[navbar-height]`.

---

## Content

### Icon
`CheckCircle` — 64px, `color: success (#16a34a)`.

### Heading
`<h1>`: "Order confirmed" — `text-4xl font-bold`. Centred.

### Sub-copy
`<p>`: "Thank you, [First name]. We've sent your receipt to [email]. You'll receive a tracking number once your order ships."
`text-base text-secondary`. Centred. Max-width: 480px.

### Order number
`text-sm text-secondary`: "Order #[order_id]"

### Order summary card
Standard Card, max-width 560px.

Header: `text-lg font-medium "Order summary"`

Items: simple list — thumbnail (48px), product name, variant, quantity, line price.

Divider, then total: `text-base font-bold "Total: £xx.xx"`.

---

## Actions

```
[Continue shopping]     [View your orders]
  (ghost button)          (secondary button)
```

On mobile: stack vertically, full width, secondary above ghost.

---

## Loading state

If the page loads before the order is confirmed in the DB (webhook delay):

```
[Spinner lg]
Confirming your order…
```

Poll `/api/orders?recent=true` every 2s for up to 10s. If still not confirmed after 10s:

```
"Your payment was processed. Your order should appear in your account within a few minutes."
[View orders]
```

---

## Error state (no session ID in URL)

If user navigates to `/success` without a valid `session_id` param:

Redirect to `/orders` or show:
```
"No order found. If you've just completed a payment, it should appear in your orders shortly."
[View orders]
```

---

## Meta

```
<title>Order confirmed | 3dthium</title>
```

No OG tags — this page should not be indexed (`noindex`).
