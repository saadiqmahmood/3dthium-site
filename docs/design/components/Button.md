# Component: Button

## Anatomy

```
┌─────────────────────────────────────────┐
│  [icon?]  Label text                    │
└─────────────────────────────────────────┘
```

Optional leading icon. Label is always required (for icon-only buttons, add `aria-label`).

---

## Variants

### Primary
Dark fill. The single highest-priority action on a view.

```
bg: brand-secondary (#18181b)
text: text-on-dark (#ffffff)
border: none
hover bg: brand-secondary-hover (#27272a)
```

### Secondary
Outline. Secondary action alongside a primary.

```
bg: transparent
text: text-primary (#18181b)
border: 1.5px solid border (#e4e4e7)
hover bg: surface-raised (#fafafa)
hover border: border-strong (#d4d4d8)
```

### Ghost
No border, no fill. Tertiary / utility actions (e.g., "Cancel", "Clear filters").

```
bg: transparent
text: text-secondary (#52525b)
border: none
hover bg: surface-overlay (#f4f4f5)
```

### Danger
Destructive actions only (delete, remove). Always pair with a confirmation step in a modal.

```
bg: danger (#dc2626)
text: text-on-dark (#ffffff)
border: none
hover bg: #b91c1c (red-700)
```

---

## Sizes

| Size | Padding | Font size | Min width | Use |
|------|---------|-----------|-----------|-----|
| sm | `px-3 py-1.5` | `text-sm` | — | Inline actions, table rows, badges |
| md (default) | `px-6 py-3` | `text-base` | 100px | Most buttons |
| lg | `px-8 py-4` | `text-lg` | 140px | Hero CTAs only |

---

## States

### Default
As described per variant above.

### Hover
Colour change as specified. Transition: `transition-fast` (150ms).

### Active / Pressed
Additional `scale(0.98)` + `opacity-90`. `transform` ease-out 100ms.

### Focus
```
outline: none
box-shadow: 0 0 0 3px rgb(16 185 129 / 0.4)  /* brand-primary focus ring */
```
For danger buttons: `box-shadow: 0 0 0 3px rgb(220 38 38 / 0.4)`.

### Disabled
```
opacity: 0.5
cursor: not-allowed
pointer-events: none
aria-disabled="true"
```
Do not use the HTML `disabled` attribute alone — pair with `aria-disabled` for screen readers.

### Loading
Replace label with spinner (16px × 16px, same colour as text) + visually hidden label.
Add `aria-busy="true"`. Button remains same size — no layout shift.

```
[Spinner]  Saving…
```

---

## Usage Rules

- There must be **at most one primary button per view** (or per major content region, e.g., a modal).
- Primary + Secondary is the standard pairing for confirmation dialogs.
- Ghost buttons should not appear in isolation — always alongside another button.
- Never use a `<div>` or `<a>` as a button unless navigation is the purpose. Use `<button type="button">` for actions, `<a>` for links.
- Full-width buttons (`w-full`) are acceptable on mobile and in forms. Avoid on desktop.

---

## Border Radius

`radius-md` (8px) on all sizes.

---

## Icon Buttons

When the button contains only an icon (no text), it must have:
- `aria-label` describing the action
- Minimum touch target: 44 × 44px (use padding to achieve this)

```tsx
<button aria-label="Remove item from cart" className="p-2 ...">
  <TrashIcon />
</button>
```

---

## Tailwind class recipe (reference — do not inline in spec)

```
primary md:
  bg-[--color-brand-secondary] text-[--color-text-on-dark] px-6 py-3 rounded-[--radius-md]
  text-base font-medium
  hover:bg-[--color-brand-secondary-hover]
  focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[--color-brand-primary]/40
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-[background-color,box-shadow] duration-150 ease-out
```
