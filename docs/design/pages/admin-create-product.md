# Admin Page: Create Product (`/admin/create-product`)

See `admin-layout.md` for chrome and admin form/table patterns.

> **Note:** This page is Create-only — a single-page form with no tabs and no variant management.
> Variant management (attributes, generator, variant table) is exclusively on the Edit page.
> See `admin-edit-product.md` for the 2-tab Edit flow.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  PageHeader: "Add product"                                       │
│  ──────────────────────────────────────────────────────         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ┌─────────────────────────┐  ┌──────────────────────┐   │   │
│  │  │  Product name *         │  │  Category *          │   │   │
│  │  └─────────────────────────┘  └──────────────────────┘   │   │
│  │  ┌─────────────────────────┐  ┌──────────────────────┐   │   │
│  │  │  Slug *                 │  │  Base price *  £      │   │   │
│  │  └─────────────────────────┘  └──────────────────────┘   │   │
│  │                                                          │   │
│  │  Description                                             │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │  (Textarea lg, 6 rows)                           │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  Images                                                  │   │
│  │  [ImageUpload drop zone or thumbnail grid]               │   │
│  │                                                          │   │
│  │  [✓] Active    [✓] Customisable                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ sticky footer ──────────────────────────────────────────┐   │
│  │                              [Cancel]   [Save product]   │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Core fields grid

The top four fields sit in a **2-column responsive grid** (desktop). On mobile, each field is full-width (single column).

| Position | Field | Notes |
|----------|-------|-------|
| Col 1, row 1 | Product name * | `type="text"` |
| Col 2, row 1 | Category * | `<Select>` populated from API |
| Col 1, row 2 | Slug * | Auto-generated from name; see below |
| Col 2, row 2 | Base price * | £-prefix Input; `type="number"` `step="0.01"` `min="0"` |

Grid spacing: `gap-x-6 gap-y-5`.

---

## Slug field

Default state: read-only, `bg-surface-raised`, showing the auto-generated slug.

```
Slug *
┌──────────────────────────────────────────────┐
│  my-product-name                      [Edit] │
└──────────────────────────────────────────────┘
3dthium.com/products/my-product-name
```

- "Edit" is a ghost button xs inline inside the input's right side.
- Clicking Edit makes the field editable (`bg-surface`, cursor `text`).
- On blur: async uniqueness check → show status inline:
  - `text-xs text-success`: "Slug available"
  - `text-xs text-danger`: "Slug already in use — choose another"
- URL preview (`3dthium.com/products/[slug]`): `text-xs text-secondary`, below the field, always visible.

---

## Description

Full-width `<Textarea>` lg — 6 rows minimum, `resize-y`. `maxLength={2000}` with character counter.

---

## Images

Use the `ImageManager` component restyled to match the `FileUpload` and `Card` specs.

```
┌────────────────────────────────────────────────────────────┐
│  Images                                                    │
│                                                            │
│  ┌──────┐  ┌──────┐  ┌──────────────────────────────────┐ │
│  │[img] │  │[img] │  │  + Add image                     │ │
│  │ Main │  │  ×   │  │  (drop zone / browse)            │ │
│  └──────┘  └──────┘  └──────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

- Thumbnails: 80 × 80 px, `rounded-md border border-border object-contain bg-surface-raised`.
- First image auto-marked as Main; "Main" badge (brand) overlaid bottom-left.
- Each thumbnail has an `×` remove button (icon button xs, top-right corner, appears on hover).
- "Set as main" on click of any non-main thumbnail (swap the Main badge).
- "Add image" drop zone appended at the end of the thumbnail row. Accepts PNG, JPG, WebP. Max 5 MB per file.
- Upload progress: thin 3px bar at the bottom of the thumbnail while uploading.

On Create: images are uploaded immediately on selection (before form save) and the returned URLs are stored in state for submission.

---

## Toggles

Two `<Checkbox>` controls, displayed in a horizontal row with `gap-6`:

```
[✓]  Active         [✓]  Customisable
```

- **Active**: default checked. Unchecked = product hidden from store.
- **Customisable**: default unchecked. Checked = "Custom" badge shown on ProductCard.

---

## Sticky save footer

Fixed to the bottom of the viewport (not the card), always visible as the user scrolls.

```
bg: surface (#ffffff)
border-top: 1px solid border (#e4e4e7)
padding: space-4 space-8
display: flex; justify-content: flex-end; gap: space-3
z-index: z-sticky (200)
```

Actions:
- **Cancel** — ghost button md → `/admin/products`. If form is dirty: "You have unsaved changes. Leave without saving?" modal. [Leave] (danger) [Stay] (primary).
- **Save product** — primary button md.

Loading state: "Saving…" + spinner. Disabled while saving.
Success: Toast "Product saved." + redirect to `/admin/products/[id]` (edit page, so admin can add variants).
Error: Toast "Couldn't save product. Try again."

---

## Validation

Validate on submit (not on each keystroke — only email/slug validate on blur):

| Field | Rule |
|-------|------|
| Product name | Required, min 2 chars |
| Slug | Required, unique (async check on blur) |
| Category | Required — must select one |
| Base price | Required, > 0 |

On failure: scroll to first invalid field, apply error state on that input, move focus to it.

---

## Post-save nudge

After successful save, the redirect goes to the Edit page (`/admin/products/[id]`). The Edit page opens on the **Variants tab** with a contextual banner:

```
┌──────────────────────────────────────────────────────────────────┐
│  ℹ  Product created. Add variants to offer size and colour       │
│     options, or save with just the base product.        [Dismiss]│
└──────────────────────────────────────────────────────────────────┘
```

Banner style:
```
bg: info-subtle (#eff6ff)
border: 1px solid info-border (#bfdbfe)
text: info (#2563eb)
icon: InformationCircleIcon (16px)
border-radius: radius-md
padding: space-3 space-4
margin-bottom: space-6
```

This banner only appears on the first visit after creation (pass `?created=1` in the redirect URL; dismiss it from state, not localStorage).
