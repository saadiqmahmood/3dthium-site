# Component: Radio

Radio buttons are always used in groups. Use when selecting exactly one option from 2–5 choices.

For 6+ options, use **Select** instead.

---

## Anatomy

```
Group label
●  Option A        ← selected
○  Option B
○  Option C
```

---

## States

### Default (unselected)
```
width/height: 18px × 18px
border: 1.5px solid border (#e4e4e7)
border-radius: radius-full (50%)
bg: surface (#ffffff)
```

### Selected
```
border: 2px solid brand-primary (#10b981)
inner dot: 8px × 8px circle, bg brand-primary
```

### Hover (unselected)
```
border-color: border-strong (#d4d4d8)
```

### Hover (selected)
```
border-color: brand-primary-hover (#059669)
inner dot: brand-primary-hover
```

### Focus
```
box-shadow: 0 0 0 3px rgb(16 185 129 / 0.4)
outline: none
```

### Disabled
```
opacity: 0.5
cursor: not-allowed
```

---

## Label

Same as Checkbox label spec.

---

## Group

Always use `<fieldset>` + `<legend>`:

```
<fieldset>
  <legend>Delivery speed</legend>
  [radio]  Standard — 3–5 business days  £3.50
  [radio]  Express — 1–2 business days   £8.00
</fieldset>
```

`<legend>` is styled identically to the Input label.

Spacing between options: `space-y-3` (12px).

---

## Shipping Rate Radio (checkout-specific)

This is a richer radio pattern used in the checkout rates step:

```
┌────────────────────────────────────────────────────────────┐
│  ●  Royal Mail Tracked 48          3–5 days         £3.50  │
├────────────────────────────────────────────────────────────┤
│  ○  Royal Mail Tracked 24          1–2 days         £5.00  │
└────────────────────────────────────────────────────────────┘
```

Each option is a full-width card with:
- `border border-border rounded-lg p-4` (default)
- `border-brand-primary bg-brand-primary-subtle` (selected)
- Carrier name (medium), delivery estimate (secondary, sm), price (semibold, right-aligned)

The radio input is visually hidden (sr-only) but functional; clicking anywhere on the card selects the option.

---

## Accessibility

```tsx
<fieldset>
  <legend>Select a delivery option</legend>
  {rates.map(rate => (
    <label key={rate.id} htmlFor={`rate-${rate.id}`}>
      <input type="radio" id={`rate-${rate.id}`} name="rate" value={rate.id} />
      <span>{rate.provider} — {rate.days}</span>
      <span>£{rate.amount}</span>
    </label>
  ))}
</fieldset>
```
