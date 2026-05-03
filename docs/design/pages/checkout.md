# Page: Checkout (`/checkout`)

## Purpose
Complete a purchase: enter address, choose shipping rate, pay.

---

## Step Indicator

```
  (1) Address  ──  (2) Shipping  ──  (3) Payment
```

```
display: flex; align-items: center; justify-content: center
margin-bottom: space-8
gap: space-4
```

Step circle:
```
width/height: 32px; border-radius: radius-full
font-size: text-sm; font-weight: medium

Completed: bg-brand-primary text-on-dark
Active:    bg-brand-secondary text-on-dark  (border-2 solid brand-secondary)
Upcoming:  bg-surface border-2 border-border text-secondary
```

Connector line:
```
flex: 1; height: 1px; bg: border
(turns brand-primary when step completed)
```

Step label (below circle): `text-xs text-secondary`, `text-xs text-primary font-medium` when active.

---

## Step 1: Delivery Address

### Layout (desktop)

```
┌──────────────────────────────┐  ┌──────────────────────┐
│  [Step indicator]            │  │  Order summary       │
│                              │  │  (collapsed/sticky)  │
│  Delivery address            │  │                      │
│  ─────────────────           │  │  [ProductCard sm]×N  │
│                              │  │  Subtotal: £xx.xx    │
│  First name   Last name      │  └──────────────────────┘
│  Email                       │
│  Phone (optional)            │
│  Address line 1              │
│  Address line 2 (optional)   │
│  City           Postcode     │
│  Country (UK — pre-selected) │
│                              │
│  [Save address] checkbox     │
│  (if signed in)              │
│                              │
│  [Continue to shipping] →    │
└──────────────────────────────┘
```

Mobile: single column, order summary hidden (accessible via "Show summary" toggle at top).

### Fields

| Field | Type | Required |
|-------|------|----------|
| First name | text | Yes |
| Last name | text | Yes |
| Email address | email | Yes |
| Phone | tel | No |
| Address line 1 | text | Yes |
| Address line 2 | text | No |
| Town / City | text | Yes |
| Postcode | text | Yes |
| Country | select (UK only for now) | Yes |

### Validation
All required fields validated on submit (not on blur — validate on blur only for email format).
Field-level errors: red border + error message below field (see Input spec).
If multiple errors: show all simultaneously, move focus to first invalid field.

---

## Step 2: Shipping

### Layout

Same 2-column layout. Left: shipping rates. Right: order summary (persistent).

### Shipping rates

```
<fieldset>
  <legend class="sr-only">Select a delivery option</legend>

  ┌─────────────────────────────────────────────────────────┐
  │  ●  Royal Mail Tracked 48         3–5 days     £3.50   │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │  ○  Royal Mail Tracked 24         1–2 days     £5.00   │
  └─────────────────────────────────────────────────────────┘
```

Each rate: full-width Radio card (see Radio spec, "Shipping Rate Radio" variant).

### Loading state (fetching rates from Shippo)
Show 2 skeleton rate cards with `animate-pulse`.
"Fetching delivery options…" in `text-sm text-secondary` above.

### No rates available
```
ErrorState inline:
heading: "No delivery options available"
body: "Check your address or contact us."
```

### Actions
- Primary: "Continue to payment" (enabled only when a rate is selected)
- Secondary: "← Back to address" (ghost)

---

## Step 3: Payment (Stripe Elements)

### Layout

Left column:
- Order summary (editable — "Edit" link back to cart)
- Promo code (if not already applied)
- Stripe card element (embedded)

Right column: Price breakdown (sticky):
```
Subtotal:   £xx.xx
Shipping:   £x.xx
Discount:   −£x.xx  (if promo applied)
──────────────────
Total:      £xx.xx  ← bold, large
```

### Stripe element container
```
border: 1px solid border (#e4e4e7)
border-radius: radius-md (8px)
padding: space-4
bg: surface
```
The Stripe element injects its own input — do not try to style the inner input fields.

### Pay button
Primary, lg: "Pay £xx.xx" (dynamic amount from server).
Disabled until Stripe element is complete.
Loading state: "Processing your payment…" + spinner.

### Errors
Stripe error → error Toast.
Non-Stripe validation error → field-level or Toast.

---

## Order Summary (sidebar, all steps)

```
┌─────────────────────────────────────────────┐
│  [product thumbnail]  Name               qty │
│                       Variant            £xx │
│                                             │
│  Subtotal                              £xx.xx│
│  Shipping                              £x.xx │
│  Discount (promo)                    −£x.xx  │
│  ──────────────────────────────────────────  │
│  Total                                £xx.xx │
└─────────────────────────────────────────────┘
```

Prices always from server (`/api/cart/quote`). Loading: show `—` with a spinner.

---

## Primary / secondary actions (per step)

| Step | Primary | Secondary |
|------|---------|-----------|
| 1 — Address | "Continue to shipping" | — |
| 2 — Shipping | "Continue to payment" | "← Back" |
| 3 — Payment | "Pay £xx.xx" | "← Back" |

---

## State machine

```
ADDRESS → (submit) → VALIDATING → FETCHING_RATES → SHIPPING
SHIPPING → (select rate) → ENABLED → (continue) → PAYMENT
PAYMENT → (pay) → PROCESSING → SUCCESS (redirect to /success)
PROCESSING → PAYMENT_ERROR (show error, stay on step 3)
```
