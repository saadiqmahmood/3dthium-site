# Component: Pagination

---

## Anatomy

```
← Previous    1  2  [3]  4  5  …  12    Next →
```

---

## Styles

```
display: flex; align-items: center; justify-content: center; gap: space-1
margin-top: space-8 (32px)
```

### Page number button
Default:
```
width: 36px; height: 36px
border-radius: radius-md (8px)
font-size: text-sm
font-weight: medium
color: text-secondary
bg: transparent
border: none
hover: bg-surface-overlay
transition: transition-fast
```

Active (current page):
```
bg: brand-primary (#10b981)
color: text-on-dark (#ffffff)
```

### Prev / Next buttons
```
padding: px-4 py-2
border-radius: radius-md
font-size: text-sm
font-weight: medium
color: text-primary
bg: surface
border: 1px solid border
hover: border-strong bg-surface-raised
```

Disabled (on first/last page):
```
opacity: 0.4
cursor: not-allowed
pointer-events: none
```

### Ellipsis `…`
```
width: 36px; height: 36px
display: flex; align-items: center; justify-content: center
color: text-tertiary
font-size: text-sm
cursor: default
```

---

## Page count label (optional)

Below or above the pagination controls:
```
text-sm text-secondary text-center
"Showing 1–24 of 143 products"
```

---

## Load More pattern (alternative)

For the products grid on `/products`, prefer **Load More** over pagination:

```
                 [Load more]
           Showing 24 of 143 products
```

Button: secondary md.
Text below: `text-sm text-secondary text-center`.

Use pagination (page numbers) for admin tables where jumping to a specific page is useful.
Use Load More for the customer product grid where linear browsing is the expected pattern.

---

## Keyboard navigation

Each page number button is a `<button>` or `<a>`. Tab moves between buttons. `Enter` activates.

---

## Accessibility

```tsx
<nav aria-label="Product list pages">
  <button aria-label="Go to previous page" disabled={page === 1}>← Previous</button>
  {pages.map(p => (
    <button
      key={p}
      aria-label={`Page ${p}`}
      aria-current={p === currentPage ? 'page' : undefined}
    >
      {p}
    </button>
  ))}
  <button aria-label="Go to next page" disabled={page === totalPages}>Next →</button>
</nav>
```
