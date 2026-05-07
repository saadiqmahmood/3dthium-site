# Admin Page: Edit Product (`/admin/products/[id]`)

See `admin-layout.md` for chrome and admin form/table patterns.
See `admin-create-product.md` for the Create flow (single-page form, no tabs).

---

## Overview

Edit Product uses a **2-tab layout**:
- **Tab 1 — Details**: all product fields + images (same fields as Create, pre-populated)
- **Tab 2 — Variants**: variant table + collapsible generator panel

The tab bar is sticky below the PageHeader so it stays visible while scrolling through long forms.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  PageHeader: "Edit: Articulated Dragon"                         │
│  ──────────────────────────────────────────────────────         │
│                                                                  │
│  [Details]   [Variants]          ← tab bar, sticky              │
│  ─────────────────────────────────────────────                  │
│                                                                  │
│  [Tab content — see below]                                       │
│                                                                  │
│  ┌─ sticky footer ──────────────────────────────────────────┐   │
│  │  [Delete product]         [Cancel]   [Save changes]      │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Tab Bar

```
border-bottom: 1px solid border (#e4e4e7)
padding: 0 (tabs flush with border)
position: sticky; top: 0; z-index: z-sticky
bg: surface-raised (#fafafa)  (the admin content background)
```

Each tab:
```
padding: space-3 space-5
font-size: text-sm; font-weight: medium
color: text-secondary

Active tab:
  color: text-primary
  border-bottom: 2px solid brand-primary (#10b981)
  margin-bottom: -1px  (sits on top of the section border)

Hover:
  color: text-primary
  bg: surface-overlay (#f4f4f5)
```

Tab labels:
- "Details"
- "Variants" + count badge: `(3)` — neutral badge xs, showing current variant count. Helps admin see at a glance whether variants exist.

---

## Tab 1: Details

Identical field layout to Create Product. All fields pre-populated from API response.

**Differences from Create:**
- No post-save nudge banner.
- Slug validation checks uniqueness excluding the current product's own slug.
- "Active" / "Customisable" checkboxes reflect saved state.
- Images section shows existing images; new uploads append.

Sticky footer shows:
- Left: **"Delete product"** — danger button sm. Opens confirmation modal (see below).
- Right: **"Cancel"** (ghost) · **"Save changes"** (primary).

"Cancel" discards unsaved changes and redirects to `/admin/products`. If form is dirty: confirm modal.

---

## Tab 2: Variants

```
┌──────────────────────────────────────────────────────────────────┐
│  [Variant generator panel — collapsible]                        │
│                                                                  │
│  [Variant table]                                                 │
└──────────────────────────────────────────────────────────────────┘
```

### Empty state (no variants yet)

When the product has no variants and the generator panel is collapsed:

```
[CubeTransparentIcon 40px, text-tertiary]

No variants yet

Use the generator to create size, colour, or material options,
or add a single variant manually.

[Generate variants]   ← primary button sm — expands the generator panel
[Add variant]         ← ghost button sm — adds a blank row to the table
```

### Variant table (when variants exist)

Standard admin table.

| Column | Content | Notes |
|--------|---------|-------|
| Combination | "Red / Medium" (attribute values joined by ` / `) | `text-sm font-medium` |
| SKU | Optional, editable inline | `text-sm font-mono text-secondary` |
| Price adjustment | `± £0.00` | Editable inline Input sm; signed (positive or negative) |
| Available | Checkbox | Unchecked = out of stock |
| Actions | [×] remove | Icon button xs, `hover:text-danger` |

Inline editing: clicking a price or SKU cell makes it an Input in place. Tab/Enter confirms. Esc cancels. The entire row does not need to enter an "edit mode" — only the clicked cell.

"+ Add variant manually" ghost button sm below the table — appends a blank row.

Sticky footer on Variants tab:
- Right: **"Save variants"** (primary) — saves all variant changes at once (not auto-save per cell).
- Left: **"Generate variants"** button (secondary sm) — expands/toggles the generator panel.

---

## Variant Generator Panel

The prime design element on the Edit page. Collapsible section above the variant table.

### Collapsed state (default)

```
┌──────────────────────────────────────────────────────────────────┐
│  Generate variants from a template                          ▶   │
└──────────────────────────────────────────────────────────────────┘
```

```
bg: surface-raised (#fafafa)
border: 1px solid border (#e4e4e7)
border-radius: radius-lg
padding: space-4 space-5
cursor: pointer
display: flex; justify-content: space-between; align-items: center
font-size: text-sm; font-weight: medium; color: text-primary
```

Chevron `▶` (right, 16px, `text-secondary`) rotates 90° to `▼` on expand. Transition: `transition-fast`.

Clicking anywhere on the header row toggles open/closed.

---

### Expanded state — Step 1: Define attributes

```
┌──────────────────────────────────────────────────────────────────┐
│  Generate variants from a template                          ▼   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1 of 2 — Define attributes                                │
│  ─────────────────────────────────                              │
│                                                                  │
│  Each attribute becomes a dimension of your variants.           │
│  (e.g. Colour + Size → Red/S, Red/M, Blue/S, Blue/M…)          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Attribute name        Values                      [×]  │    │
│  │  [Colour__________]    [Red] [Blue] [Green] [+]         │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Attribute name        Values                      [×]  │    │
│  │  [Size____________]    [S] [M] [L] [XL] [+]            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [+ Add attribute]                                              │
│                                                                  │
│  ────────────────────────────────────────────────────────────   │
│                       [Cancel]   [Preview combinations →]       │
└──────────────────────────────────────────────────────────────────┘
```

#### Attribute row

```
display: grid; grid-template-columns: 180px 1fr auto; gap: space-4; align-items: start
padding: space-3 space-4
bg: surface (#ffffff)
border: 1px solid border; border-radius: radius-md; margin-bottom: space-3
```

**Attribute name**: Input sm, `placeholder="Colour"`. Required.

**Values**: tag input — each value is a removable pill:
```
Pill:
  bg: brand-primary-subtle (#d1fae5)
  text: brand-primary-hover (#059669)
  border: 1px solid brand-primary-muted (#6ee7b7)
  border-radius: radius-sm (4px)
  padding: px-2 py-0.5
  font-size: text-xs; font-weight: medium
  [×] remove icon inside pill, same colour

Input within the tag area:
  borderless, inline with the pills
  placeholder: "Add value…"
  On Enter or comma: converts input text to a new pill
  On Backspace when input is empty: removes last pill
```

**[×] remove row**: icon button xs at the end of the grid row. Removes the entire attribute row. Hover: `text-danger`.

**"+ Add attribute"** ghost button sm, below all rows.

#### Validation (step 1)

- Each attribute must have a name and at least one value.
- Attribute names must be unique within the list.
- Validation fires on "Preview combinations" click, not inline.
- Errors appear below the offending attribute row: `text-xs text-danger`.

#### "Preview combinations" button

Primary sm. Disabled if any attribute has 0 values or no name. Advances to Step 2.

---

### Expanded state — Step 2: Preview and generate

```
┌──────────────────────────────────────────────────────────────────┐
│  Generate variants from a template                          ▼   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 2 of 2 — Preview combinations                             │
│  ──────────────────────────────────                             │
│                                                                  │
│  Colour (3) × Size (4) = 12 variants                           │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Red / S     Red / M     Red / L     Red / XL           │    │
│  │  Blue / S    Blue / M    Blue / L    Blue / XL           │    │
│  │  Green / S   Green / M   Green / L   Green / XL          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ⚠  This will replace your 5 existing variants.                 │
│     Their price adjustments and stock status will be reset.     │
│                                                                  │
│  ────────────────────────────────────────────────────────────   │
│  [← Back to attributes]           [Generate 12 variants]        │
└──────────────────────────────────────────────────────────────────┘
```

#### Combination summary line

```
font-size: text-2xl; font-weight: bold; color: text-primary
margin-bottom: space-4
```

Format: `Colour (3) × Size (4) = 12 variants`

- Attribute name + value count in each factor: `Attribute (N)`.
- Multiple attributes joined by `×` (multiplication sign, not `x`).
- Total after `=`: `N variants`.
- If only one attribute: `Colour (3) = 3 variants` (no `×`).

#### Combination grid

All resulting combinations displayed as pills in a wrapping flex grid:

```
display: flex; flex-wrap: wrap; gap: space-2
padding: space-4
bg: surface-raised (#fafafa)
border: 1px solid border; border-radius: radius-md
max-height: 160px; overflow-y: auto
```

Each pill:
```
bg: surface (#ffffff)
border: 1px solid border-strong (#d4d4d8)
border-radius: radius-sm (4px)
padding: px-3 py-1
font-size: text-xs; font-weight: medium; color: text-secondary
```

Format: `Red / S`, `Blue / M` (values joined by ` / `).

If 50+ combinations: show first 50 pills + `+N more` in `text-xs text-tertiary`.

#### Existing variants warning

Shown only when the product already has variants:

```
display: flex; align-items: flex-start; gap: space-2
bg: warning-subtle (#fefce8)
border: 1px solid warning-border (#fde68a)
border-radius: radius-md; padding: space-3 space-4
margin: space-4 0
```

Icon: `ExclamationTriangleIcon` 16px, `color: warning (#ca8a04)`.
Text: `text-sm text-primary`.

Line 1: `"This will replace your [N] existing variants."` — N is bold.
Line 2: `"Their price adjustments and stock status will be reset."` — `text-secondary`.

When the product has no existing variants: this warning is omitted entirely.

#### Generate button

```
[Generate 12 variants]   ← primary button md, right-aligned
```

Label dynamically shows the count: `Generate [N] variants`.

Loading state: `"Generating…"` + spinner. Disabled while generating.

On success:
- Generator panel collapses.
- Variant table refreshes with the new rows.
- Toast: `"12 variants created. Set prices and availability below."`
- Table scrolls into view.

On error:
- Toast: `"Couldn't generate variants. Try again."`
- Panel stays open on Step 2.

#### "Back to attributes" button

Ghost button sm, left-aligned. Returns to Step 1 with the attribute data preserved (do not reset).

---

## Step indicator (inside the panel)

Shows which step is active. Minimal — text only, not circles:

```
Step 1 of 2 — Define attributes
```

```
font-size: text-xs; font-weight: medium; color: text-secondary
text-transform: uppercase; letter-spacing: 0.05em
margin-bottom: space-4
```

---

## Delete Product

Danger button sm in the sticky footer (Details tab only).

On click: confirmation modal sm:

```
"Delete Articulated Dragon?"
"This will permanently remove the product and all its variants from the store."
[Cancel] (ghost)   [Delete product] (danger)
```

On confirm: `DELETE /api/admin/products/[id]` → redirect to `/admin/products` + Toast "Product deleted."

---

## Loading (Edit page initial load)

While fetching product data:
- Tab bar visible but tabs unclickable (disabled appearance, `opacity: 0.6`).
- Details tab: skeleton form (same as Create page field grid skeletons).
- Variants tab: skeleton table (5 rows × 5 columns).

---

## Error (initial load failure)

```
ErrorState (full content area):
heading: "Couldn't load this product"
body: "Check your connection and try again."
CTA: "Try again"       ← retries the fetch
Secondary: "← Back to products"  (ghost)
```

---

## Unsaved changes guard

Both tabs track their own dirty state independently:
- Leaving the page (Cancel, sidebar nav) when either tab is dirty → confirm modal.
- Switching between tabs does not trigger the guard — unsaved changes in Tab 1 persist while the user works on Tab 2, and are submitted together on "Save changes".
