# Page: Home (`/`)

## Purpose
Introduce 3dthium, showcase featured products, and drive customers to browse and order.

---

## Layout (desktop)

```
┌─────────────────────────────────────────────────────────────┐
│  Navbar (fixed, 64px)                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Hero Section]                                             │
│  — Full viewport height (100vh - 64px)                     │
│  — Headline, sub-copy, two CTAs                            │
│  — Subtle geometric background pattern (decorative)         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Featured Products — horizontal scroll or 3-col grid]     │
│  — Section title: "Featured prints"                        │
│  — 3 featured ProductCards at Featured Card size           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Custom Prints CTA]                                        │
│  — Gradient container, headline, body, CTA button          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Gallery strip — optional, if images available]            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Footer                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Hero Section

### Heading hierarchy
- `<h1>`: Main tagline — `text-5xl` (desktop), `text-3xl` (mobile). `font-bold`. Line 1: plain text. Line 2: gradient text (decorative, see ACCESSIBILITY.md).
- `<p>`: Sub-copy — `text-lg text-secondary`. Max width: 520px.

### CTAs
- Primary: "Explore products" → `/products`
- Secondary: "Request custom order" → `/custom-order`

### Background
- Decorative pattern: opacity 5%, `aria-hidden="true"`.
- Glow blobs: `aria-hidden="true"`.

### Scroll indicator
- Animated bounce arrow, below CTAs.
- `aria-hidden="true"` (purely decorative).

---

## Featured Products Section

### Section heading
`<h2>`: "Featured prints" — `text-3xl font-medium`. Centred or left-aligned (pick one — left-aligned recommended for scannability).

### Layout
3-column grid, desktop. 2-column, tablet. 1-column, mobile.

### Empty state
If no featured products exist (admin hasn't flagged any): hide the entire section. Do not show an empty grid.

### Loading state
3 skeleton ProductCards.

---

## Custom Prints CTA Section

Gradient container (`brand-primary-subtle` to `surface`) with:
- `<h2>`: "Need something unique?" — `text-3xl font-medium`
- `<p>`: short description — `text-base text-secondary`
- Single CTA: "Start custom order" → `/custom-order`

No loading or empty state needed — static copy.

---

## Copy direction

| Element | Copy |
|---------|------|
| h1 line 1 | "Printed to order." |
| h1 line 2 | "Built to last." |
| Sub-copy | "Precision 3D prints, made in the UK. Browse our catalogue or request something custom." |
| Hero primary CTA | "Explore products" |
| Hero secondary CTA | "Request custom order" |
| Featured section title | "Featured prints" |
| CTA section heading | "Need something unique?" |
| CTA body | "Send us your file or describe what you need. We'll handle the rest." |
| CTA button | "Start custom order" |

---

## Primary action
"Explore products" — largest CTA on the page.

## Secondary action
"Request custom order".

---

## Meta

```
<title>3dthium — Precision 3D Prints, Made to Order</title>
<meta name="description" content="Browse our catalogue of precision 3D-printed products or request a custom order. Made in the UK." />
<meta property="og:title" content="3dthium — Precision 3D Prints" />
<meta property="og:image" content="/og-home.jpg" />
```
