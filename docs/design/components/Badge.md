# Component: Badge

Small inline label used for status indicators, category tags, and attribute chips.

---

## Anatomy

```
[ Label text ]   or   [ ● Label text ]   (with status dot)
```

---

## Variants

### Neutral (default)
```
bg: surface-overlay (#f4f4f5)
text: text-secondary (#52525b)
border: none
```

### Brand
```
bg: brand-primary-subtle (#d1fae5)
text: brand-primary-hover (#059669)
border: 1px solid brand-primary-muted (#6ee7b7)
```
Use for "Customisable", "New", "Featured".

### Success
```
bg: success-subtle (#f0fdf4)
text: success (#16a34a)
border: 1px solid success-border (#bbf7d0)
```
Order status: "Delivered", "Confirmed".

### Warning
```
bg: warning-subtle (#fefce8)
text: warning (#ca8a04)
border: 1px solid warning-border (#fde68a)
```
Order status: "Pending", "Processing", "Printing".

### Danger
```
bg: danger-subtle (#fef2f2)
text: danger (#dc2626)
border: 1px solid danger-border (#fecaca)
```
Order status: "Cancelled", "Failed". Admin: "Out of stock".

### Info
```
bg: info-subtle (#eff6ff)
text: info (#2563eb)
border: 1px solid info-border (#bfdbfe)
```
Order status: "Shipped".

---

## Sizes

| Size | Padding | Font size | Use |
|------|---------|-----------|-----|
| sm (default) | `px-2 py-0.5` | `text-xs` | Order status in table rows |
| md | `px-3 py-1` | `text-sm` | Category filter chips on products page |

---

## Border radius

`radius-sm` (4px) for rectangular badges (status).
`radius-full` for pill-style category chips.

---

## Status Dot variant

For order status in the orders table, use a dot prefix:

```
● Delivered     ← 8px circle, success colour
● Pending       ← warning colour
● Cancelled     ← danger colour
```

```
dot: width/height 8px, border-radius 50%, display inline-block
margin-right: space-1.5 (6px)
colour: matches text colour
```

---

## Order Status Map

| Status | Variant | Label |
|--------|---------|-------|
| `pending` | Warning | Pending |
| `confirmed` | Success | Confirmed |
| `printing` | Warning | Printing |
| `shipped` | Info | Shipped |
| `delivered` | Success | Delivered |
| `cancelled` | Danger | Cancelled |
| `failed` | Danger | Payment failed |

---

## Usage Rules

- Never use colour alone to convey status — always include the text label.
- Badges are inline and non-interactive. If a badge needs to be clickable (filter chip), use the Button ghost variant with badge-like styling instead.
- Maximum 1 badge per card (product card). Tables may have 1 per row (order status).
