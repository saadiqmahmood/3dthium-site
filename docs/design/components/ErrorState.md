# Component: ErrorState

Used when a data fetch fails or a page-level error occurs. Replaces `alert()` calls and raw error strings.

---

## Anatomy

```
       [⚠ Icon]

    Something went wrong

  We couldn't load your orders.
  Check your connection and try again.

       [Try again]    [Go home]
```

---

## Styles

Same layout structure as **EmptyState**, but with danger colouring on the icon.

```
Icon:
  width/height: 48px
  color: danger (#dc2626)
  icon: ExclamationTriangleIcon

Heading:
  text-lg, font-medium, text-primary

Body:
  text-base, text-secondary

Actions:
  [Try again] — primary button (calls the fetch retry)
  [Go home] — ghost button (optional, only when retry is insufficient)
```

---

## Variants

### Inline (within a card)
```
padding: space-8 space-4
icon: 32px
heading: text-base
body: text-sm
```
Used inside a single card or table cell.

### Full-section / page
```
min-height: 50vh
padding: space-16 space-6
icon: 64px
heading: text-xl
```

---

## When to use

| Situation | Component |
|-----------|-----------|
| API fetch returns error | ErrorState (full section or page) |
| Form submit fails | Toast (error) + field-level errors |
| Page-level 500 | `pages/_error.tsx` (custom Next.js error page) |
| Not found | `pages/404.tsx` |
| Partial load (some data OK, one section failed) | ErrorState inline in that section only |

---

## Accessibility

```tsx
<section aria-label="Error loading orders" role="alert">
  <ExclamationTriangleIcon aria-hidden="true" />
  <h2>Something went wrong</h2>
  <p>We couldn't load your orders. Check your connection and try again.</p>
  <button onClick={retry}>Try again</button>
</section>
```

Use `role="alert"` only when the error appeared after user action. For errors present on initial page load, `role="alert"` is not needed (it's not a surprise to the user — the page just doesn't have content).
