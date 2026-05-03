# Page: Product Detail (`/products/[slug]`)

## Purpose
Show full product information, allow variant selection, and add to cart.

---

## Layout (desktop)

```
┌──────────────────────────────────────────────────────────────┐
│  Navbar                                                      │
├──────────────────────────────────────────────────────────────┤
│  pt-[64px]                                                   │
│                                                              │
│  [Breadcrumb: Home / Products / Category / Product name]     │
│                                                              │
│  ┌──────────────────────┐  ┌────────────────────────────┐   │
│  │                      │  │  Product name              │   │
│  │   [Product image]    │  │                            │   │
│  │   aspect-square      │  │  [Category badge]          │   │
│  │                      │  │                            │   │
│  │   [Thumbnail strip]  │  │  £12.00 – £18.00           │   │
│  │   if multiple images │  │                            │   │
│  │                      │  │  [Variant selectors]       │   │
│  └──────────────────────┘  │                            │   │
│                             │  [Qty stepper]             │   │
│                             │                            │   │
│                             │  [Add to cart]  ← primary │   │
│                             │                            │   │
│                             │  [Custom order CTA — opt] │   │
│                             │                            │   │
│                             │  ── Description ──        │   │
│                             │  Body copy                 │   │
│                             └────────────────────────────┘   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Footer                                                      │
└──────────────────────────────────────────────────────────────┘
```

Mobile: image full-width, info stacked below.

---

## Product Image

```
Main image:
  aspect-square (1:1)
  object-contain
  bg: surface-raised (#fafafa)
  border-radius: radius-lg
  border: 1px solid border

Thumbnail strip (if 2+ images):
  display: flex; gap: space-2; margin-top: space-3
  Each thumbnail: 64×64px, rounded-md, border 1.5px
  Active thumbnail: border-brand-primary
  Click thumbnail → swap main image
```

---

## Product Info Panel

### Name
`<h1>`: `text-4xl font-bold text-primary` (desktop), `text-3xl` (mobile)

### Category badge
Badge, brand variant. Links to `/products?category=[slug]`.

### Price
`text-3xl font-semibold text-primary`
- Single price: `£12.00`
- Range: `£12.00 – £18.00` — updates when a variant is selected to show that variant's price.

### Customisable note (if `product.customizable`)
Inline text: "This product is customisable — contact us for bespoke options."
Link: → `/custom-order`
Font: `text-sm text-secondary`

---

## Variant Selectors

If the product has variants, display each attribute as a row:

```
Colour
  [Red]  [Blue]  [Green]    ← pill-style buttons

Size
  [Small]  [Medium]  [Large]
```

Pill button (unselected):
```
border: 1px solid border; border-radius: radius-full
padding: px-4 py-1.5; font-size: text-sm; font-weight: medium
color: text-primary; bg: surface
hover: border-strong
```

Pill button (selected):
```
bg: brand-primary; border-color: brand-primary; text: text-on-dark
```

Pill button (unavailable variant):
```
opacity: 0.4; cursor: not-allowed; text-decoration: line-through
```

If a variant combination has no stock, show:
`text-sm text-danger: "This combination is out of stock. Choose a different option."`

---

## Quantity Stepper

```
[−]  [  1  ]  [+]
```

```
Stepper container:
  display: flex; align-items: center; gap: space-2
  margin: space-4 0

[−] and [+]:
  32×32px icon button, border: 1px solid border, radius: radius-md
  hover: bg-surface-raised
  disabled (at min=1 or max=stock): opacity-0.4, cursor-not-allowed

Quantity display:
  width: 48px; text-align: center; font-size: text-base; font-weight: medium
  border: 1px solid border; border-radius: radius-md; padding: py-1
```

Min: 1. Max: either `in_stock_count` or 99.

---

## Add to Cart Button

Full-width on mobile. Fits content width on desktop (min 200px).
Primary button, lg size: "Add to cart"

When adding (loading state): "Adding…" + spinner.
After add (success): brief Toast "Added to cart." + button returns to default.

---

## Description

Below the main info panel on mobile. In a tab or accordion on desktop if description is long.

```
<h2 class="text-2xl font-medium mt-8 mb-4">Description</h2>
<div class="prose text-base text-secondary leading-relaxed">
  {description rendered as Markdown}
</div>
```

---

## Loading state

Show skeleton:
```
Left column: grey aspect-square block
Right column:
  h1 skeleton: w-2/3 h-10
  price skeleton: w-1/3 h-8
  variant row skeleton: 3 pill skeletons
  button skeleton: w-full h-12 rounded-md
```

---

## Error state

If product not found (404) → redirect to `/404` or show:
```
ErrorState
heading: "Product not found"
body: "This product may have been removed."
CTA: "Browse products"
```

If fetch error:
```
ErrorState
heading: "Couldn't load this product"
CTA: "Try again"
```

---

## State machine

```
IDLE → LOADING → SUCCESS
LOADING → ERROR
SUCCESS + add to cart → ADDING → ADDED (2s) → SUCCESS
```

---

## Meta

```
<title>{product.name} | 3dthium</title>
<meta name="description" content={product.description.slice(0, 160)} />
<meta property="og:title" content={product.name} />
<meta property="og:image" content={product.thumbnail_url} />
```

JSON-LD: `Product` schema (see ACCESSIBILITY.md / Performance role).

---

## Primary / secondary actions

- Primary: "Add to cart"
- Secondary: "Request custom order" (only for customisable products)
