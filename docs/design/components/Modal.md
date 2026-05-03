# Component: Modal

---

## Anatomy

```
┌── Backdrop (full screen) ─────────────────────────────────────────────┐
│                                                                        │
│   ┌── Dialog ──────────────────────────────────────────────────────┐  │
│   │  Heading                                        [×]            │  │
│   │  ─────────────────────────────────────────────────────────     │  │
│   │                                                                │  │
│   │  Content area                                                  │  │
│   │                                                                │  │
│   │  ─────────────────────────────────────────────────────────     │  │
│   │                         [Secondary]   [Primary action]        │  │
│   └────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Backdrop

```
position: fixed inset-0
bg: rgba(0, 0, 0, 0.5)   ← 50% black, not zinc tint
z-index: z-overlay (400)
display: flex; align-items: center; justify-content: center
padding: space-4 (sides — so dialog doesn't edge-butt on mobile)
```

Click backdrop → close modal.

---

## Dialog

```
position: relative
bg: surface (#ffffff)
border-radius: radius-xl (16px)
shadow: shadow-xl
z-index: z-modal (500)
width: 100%
max-width: 32rem (512px) — default
max-height: 90vh
overflow-y: auto
padding: space-6 (24px)
```

### Size variants

| Variant | max-width | Use |
|---------|----------|-----|
| sm | 24rem (384px) | Confirmation dialogs |
| md (default) | 32rem (512px) | Forms, detail views |
| lg | 48rem (768px) | Image preview, complex forms |
| full | 100% - 2rem | Admin: product edit |

---

## Header

```
display: flex; justify-content: space-between; align-items: flex-start
margin-bottom: space-4 (16px)
padding-bottom: space-4
border-bottom: 1px solid border (#e4e4e7)
```

Heading: `text-2xl font-bold text-primary` (h2 inside dialog).

Close button (`×`):
- Icon button, 32×32px touch target
- `text-tertiary` default, `hover:text-primary`
- Focus ring: standard brand-primary

---

## Content Area

```
padding: space-2 0   ← light vertical breathing room
```

No overflow scroll on this area — the dialog itself scrolls.

---

## Footer

```
display: flex; justify-content: flex-end; gap: space-3
margin-top: space-6
padding-top: space-4
border-top: 1px solid border
```

Button order: Secondary (left), Primary (right).

---

## States & Transitions

### Opening
- Backdrop: fade in, `opacity: 0 → 1`, 200ms
- Dialog: slide up + fade in, `translateY(16px) → translateY(0)` + `opacity: 0 → 1`, 200ms

### Closing
Reverse of opening. 150ms.

With `prefers-reduced-motion`: no translate, only opacity fade.

---

## Focus Management

- On open: focus the first focusable element (close button or first input).
- Trap focus inside modal while open (tab cycles within).
- On close: return focus to the element that triggered the modal.

```tsx
<dialog
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  open={isOpen}
>
  <h2 id="modal-title">...</h2>
  ...
</dialog>
```

Consider using the native `<dialog>` element for built-in focus trapping in modern browsers (with a polyfill or fallback).

---

## Confirmation Modal (specific pattern)

Used for destructive actions:

```
Heading: "Delete product?"
Body: "This action cannot be undone."
Actions: [Cancel] (ghost)  [Delete] (danger)
```

Never auto-confirm — always require an explicit click.

---

## Usage Rules

- Only one modal open at a time. No stacked modals.
- `Escape` key always closes the modal.
- Clicking the backdrop always closes the modal.
- The page behind the modal must not scroll while modal is open: `overflow: hidden` on `<body>`.
