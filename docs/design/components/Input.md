# Component: Input

## Anatomy

```
Label text  *
┌──────────────────────────────────────┐
│  [leading icon?]  placeholder text   │
└──────────────────────────────────────┘
Helper text or error message
```

- Label is always above the field.
- `*` appears when required (`aria-required="true"`).
- Helper text is optional, grey.
- Error message replaces helper text when in error state.

---

## States

### Default
```
border: 1px solid border (#e4e4e7)
bg: surface (#ffffff)
text: text-primary (#18181b)
placeholder: text-tertiary (#a1a1aa)
radius: radius-md (8px)
padding: px-4 py-3
font-size: text-base (18px)
```

### Hover
```
border-color: border-strong (#d4d4d8)
```

### Focus
```
border-color: brand-primary (#10b981)
box-shadow: 0 0 0 3px rgb(16 185 129 / 0.4)
outline: none
```

### Disabled
```
bg: surface-overlay (#f4f4f5)
border-color: border (#e4e4e7)
text: text-tertiary (#a1a1aa)
cursor: not-allowed
opacity: 1 (do not dim — colour change is sufficient)
aria-disabled="true"
```

### Error
```
border-color: danger (#dc2626)
bg: danger-subtle (#fef2f2)
```
Error message below field:
```
text: danger (#dc2626)
font-size: text-sm
margin-top: space-1 (4px)
role="alert"  (so screen readers announce it)
```

### Read-only
```
bg: surface-raised (#fafafa)
border-color: border (#e4e4e7)
cursor: default
```

---

## Label

```
display: block
font-size: text-sm
font-weight: medium (500)
color: text-primary (#18181b)
margin-bottom: space-1 (4px)
```

Required marker `*`:
```
color: danger (#dc2626)
margin-left: space-1 (4px)
```

---

## Helper Text

```
font-size: text-sm
color: text-secondary (#52525b)
margin-top: space-1 (4px)
```

---

## Sizes

| Size | Padding | Font size | Use |
|------|---------|-----------|-----|
| sm | `px-3 py-2` | `text-sm` | Compact admin filters |
| md (default) | `px-4 py-3` | `text-base` | All forms |

---

## Leading / Trailing Adornments

For inputs with an icon (e.g., search, currency prefix):
- Icon is 16 × 16px, `text-tertiary` colour.
- Adjust horizontal padding to prevent text overlapping icon: `pl-10` with icon at `left-3`.

Example — search field:
```
[🔍]  Search products…
```

Example — currency prefix:
```
£  [          12.00          ]
```
Use a `<span>` inside a `<div>` wrapper rather than padding tricks when the prefix is text.

---

## Usage Rules

- Never use placeholder text as a substitute for a label. Labels must always be visible.
- Inputs that accept numbers: `type="number"` with `inputMode="decimal"` for prices.
- Email fields: `type="email"` `autoComplete="email"`.
- Password fields: `type="password"` `autoComplete="current-password"` (sign-in) or `autoComplete="new-password"` (registration).
- All inputs must have `id` and `name` attributes.
- Link label to input via `htmlFor` / `id`.

---

## Accessibility

```tsx
<label htmlFor="email">
  Email address <span aria-hidden="true">*</span>
</label>
<input
  id="email"
  type="email"
  aria-required="true"
  aria-describedby={error ? "email-error" : undefined}
  aria-invalid={!!error}
/>
{error && (
  <p id="email-error" role="alert" className="...">
    {error}
  </p>
)}
```

---

## Full-width by default

Inputs are always `w-full` within their container. Width is controlled by the parent layout, not the input itself.
