# Component: LoadingSpinner

---

## Anatomy

```
  ◌  (spinning arc)
```

A circular arc that rotates continuously. No text by default — only when context requires ("Loading your orders…").

---

## Sizes

| Size | Dimensions | Border width | Use |
|------|-----------|-------------|-----|
| xs | 16px × 16px | 2px | Inline button loading state |
| sm | 24px × 24px | 2.5px | Small inline loaders |
| md (default) | 32px × 32px | 3px | Section loading |
| lg | 48px × 48px | 4px | Page-level loading |

---

## Colours

| Context | Track colour | Arc colour |
|---------|-------------|-----------|
| Default | `border-neutral-200` | `border-t-brand-primary` |
| On dark background | `border-neutral-700` | `border-t-neutral-0` |
| Inside danger button | `border-danger-border` | `border-t-danger` |

---

## Animation

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
animation: spin 0.8s linear infinite;
```

`prefers-reduced-motion`: keep animation (it conveys state), but slow to `animation-duration: 1.5s`.

---

## Page-level loading

When a full page/section is loading (before skeleton is available), center the spinner:

```
┌────────────────────────────────────┐
│                                    │
│                                    │
│               ◌                    │
│         Loading orders…            │
│                                    │
│                                    │
└────────────────────────────────────┘
```

Text below spinner: `text-sm text-secondary`. 8px gap.

**Prefer skeleton loaders over spinners for content-heavy pages** (product list, order list). Spinner is for:
- Button loading states
- Single-item fetch (e.g., product detail on initial load before skeleton exists)
- Form submission

---

## Button loading state

```tsx
<button disabled aria-busy="true">
  <Spinner size="xs" className="mr-2" aria-hidden="true" />
  <span>Saving…</span>
</button>
```

The spinner is `aria-hidden` because `aria-busy="true"` on the button communicates loading to screen readers.

---

## Accessibility

```tsx
<div role="status" aria-label="Loading your orders">
  <Spinner size="lg" />
  <span className="sr-only">Loading your orders…</span>
</div>
```

`role="status"` + `aria-label` announces to screen readers without interrupting.
