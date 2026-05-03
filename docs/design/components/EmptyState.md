# Component: EmptyState

Used when a list, page, or data region has no content to display.

---

## Anatomy

```
            [Icon]

         Heading text

    Descriptive body copy.

        [Primary CTA]
```

Centred horizontally. Vertically centred within its container.

---

## Styles

```
display: flex; flex-direction: column; align-items: center; justify-content: center
text-align: center
padding: space-12 space-6 (48px top/bottom, 24px sides)
gap: space-3 (12px) between icon, heading, body
```

### Icon
```
width/height: 48px (3rem)
color: text-tertiary (#a1a1aa)
```
Use a contextually appropriate outline icon (Heroicons or similar). Examples:
- Cart empty → `ShoppingCartIcon`
- No orders → `ClipboardListIcon`
- No products → `CubeIcon`
- No results → `MagnifyingGlassIcon`
- No files → `DocumentIcon`

### Heading
```
font-size: text-lg (1.2rem)
font-weight: medium (500)
color: text-primary (#18181b)
```

### Body copy
```
font-size: text-base (1rem)
color: text-secondary (#52525b)
max-width: 320px
```

### Primary CTA
Standard Button, primary variant, md size. Optional — omit for admin views where the action is obvious from context.

---

## Variants

### Inline (within a card or table)
Smaller version — used when a section within a page is empty but the page itself has other content.
```
padding: space-8 space-4
icon: 32px
heading: text-base
body: text-sm
```

### Full page
Used when the entire page has no content (e.g., orders page with no orders placed yet).
```
min-height: 50vh
centered vertically on the page
icon: 64px
heading: text-xl
```

---

## Copy

See `VOICE.md` for the empty state copy for each page. Always:
1. A short heading stating what's missing
2. Optional body explaining why or what to do
3. CTA that helps the user escape the empty state

Do not use apologetic copy ("Sorry, nothing here."). Be helpful and direct.

---

## Accessibility

```tsx
<section aria-label="No orders found">
  <p role="status">No orders yet. When you place an order, it'll appear here.</p>
  <Link href="/products">Browse products</Link>
</section>
```

The empty state container should be a `<section>` or `<div>` with an accessible name. The status message should be a `<p>` (or `<p role="status">` if dynamically inserted).
