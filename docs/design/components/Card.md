# Component: Card

The base Card is a generic content container. Variants extend it for specific use cases.

---

## Anatomy

```
┌────────────────────────────────────────────┐
│  [Image slot — optional]                   │
│  ─────────────────────────────────────────  │
│  [Badge — optional]                        │
│                                            │
│  Heading                                   │
│  Body copy / description                   │
│                                            │
│  [Actions — optional]                      │
└────────────────────────────────────────────┘
```

---

## Base Styles

```
bg: surface (#ffffff)
border: 1px solid border (#e4e4e7)
border-radius: radius-lg (12px)
padding: space-6 (24px)
shadow: shadow-xs
overflow: hidden
```

---

## Variants

### Default Card
Plain container. No hover interaction.

### Clickable Card
Entire card is a link or has an action. Add:
```
cursor: pointer
hover border-color: border-strong (#d4d4d8)
hover shadow: shadow-sm
transition: transition-base (200ms)
```

### Featured Card (marketing sections)
Used in the homepage featured products row.
```
bg: surface-raised (#fafafa)
border-radius: radius-xl (16px)
padding: space-8 (32px)
```

### Stat Card (admin dashboard)
```
bg: surface (#ffffff)
border-radius: radius-lg (12px)
padding: space-6 (24px)
shadow: shadow-xs
border: 1px solid border (#e4e4e7)
```

Layout inside stat card:
```
Row 1: icon (top-right, 20px, text-secondary) | label (text-sm, text-secondary)
Row 2: value (text-4xl, font-light, text-primary)
Row 3: trend indicator (optional)
```

---

## Image Slot

When a card has a leading image (product, gallery):
- Image fills full width of card, no horizontal padding.
- `aspect-square` for product images, `aspect-video` for article/gallery images.
- `object-contain` for product images, `object-cover` for editorial images.
- No border radius on the image itself — the parent `overflow: hidden` provides rounding.

---

## Spacing Inside Card

The card `padding: space-6` applies to all sides. The image slot breaks out of padding via negative margin or being a sibling outside the padded inner div:

```
<div class="card">           ← border + radius + overflow:hidden
  <div class="image-slot">   ← w-full, no horizontal padding, aspect-square
    <Image />
  </div>
  <div class="card-body p-6"> ← space-6 padding on the text area only
    ...
  </div>
</div>
```

---

## States

Standard Card: no hover state.
Clickable Card: hover border + shadow (above).

Focus (when the entire card is a link):
```
focus-visible: ring-3 ring-brand-primary/40
```

---

## Usage Rules

- Do not nest cards.
- Max 2 levels of visual depth per section (e.g., page → card — not page → section card → inner card → sub-card).
- Admin table rows are not cards — use the Table spec.
