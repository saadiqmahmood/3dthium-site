# Component: ProductCard

Extends **Card** (base). Used in product grids on `/products` and the homepage featured section.

---

## Anatomy

```
┌───────────────────────────────────┐
│                                   │
│         [Product image]           │  ← aspect-square, object-contain
│                                   │
├───────────────────────────────────┤
│  [Customisable badge]             │  ← optional
│                                   │
│  Product name                     │  ← text-sm, font-medium, 2 line clamp
│  £12.00 – £18.00                  │  ← text-base, font-semibold
└───────────────────────────────────┘
```

The entire card is a `<Link>` to `/products/[slug]`.

---

## Dimensions

- Width: fluid (determined by grid column)
- Image: `aspect-square` (1:1)
- Min width: 160px (prevents images becoming unusably small)

---

## Styles

```
Card base:
  bg: surface (#ffffff)
  border: 1px solid border (#e4e4e7)
  border-radius: radius-lg (12px)
  overflow: hidden
  shadow: none (default)
  transition: transition-base

Hover:
  border-color: border-strong (#d4d4d8)
  shadow: shadow-sm

Image container:
  bg: surface-raised (#fafafa)
  aspect-ratio: 1 / 1
  width: 100%

Body:
  padding: px-4 py-3 (space-4 horizontal, space-3 vertical)
```

---

## Text

| Element | Font size | Weight | Colour |
|---------|-----------|--------|--------|
| Product name | `text-sm` | `font-medium` | `text-primary` |
| Price | `text-base` | `font-semibold` | `text-primary` |
| Category (if shown) | `text-xs` | `font-regular` | `text-secondary` |

Product name clamps at **2 lines** (`-webkit-line-clamp: 2`).

---

## Customisable Badge

Shown only when `product.customizable === true`.

```
position: top-right of the image, absolute
bg: brand-primary-subtle (#d1fae5)
text: brand-primary-hover (#059669)
border: 1px solid brand-primary-muted (#6ee7b7)
border-radius: radius-sm (4px)
padding: px-2 py-0.5
font-size: text-xs
font-weight: medium
label: "Custom"
```

---

## Price Display

- Single price: `£12.00`
- Price range: `£12.00 – £18.00` (en-dash)
- "From £12.00" — do NOT use this pattern; always show the range.

---

## Loading State

While the product list is loading, render skeleton ProductCards:

```
Image area: bg-neutral-100 animate-pulse rounded-t-lg
Name line: h-4 bg-neutral-100 animate-pulse rounded w-3/4 mb-2
Price line: h-4 bg-neutral-100 animate-pulse rounded w-1/3
```

Render 8 skeleton cards in the grid.

---

## Focus (keyboard)

The entire card `<Link>` receives focus:
```
focus-visible:ring-3 focus-visible:ring-brand-primary/40 focus-visible:rounded-[radius-lg]
```

---

## Grid layout

Use in a responsive grid:
```
grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
gap-4
```

On mobile (< 640px), 2 columns keeps cards large enough to read.
