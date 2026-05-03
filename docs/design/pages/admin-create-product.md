# Admin Page: Create / Edit Product (`/admin/create-product`, `/admin/products/[id]`)

See `admin-layout.md` for chrome and admin form patterns.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  PageHeader: "Add product"  or  "Edit: [product name]"          │
│  ──────────────────────────────────────────────────────         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Basic information                                       │   │
│  │  ─────────────────                                       │   │
│  │  Product name *                                          │   │
│  │  Slug *  (auto-generated from name, editable)            │   │
│  │  Description (Textarea lg)                               │   │
│  │  Category *  (Select)                                    │   │
│  │  Base price *  (£ prefix Input)                          │   │
│  │  Customisable  (Checkbox)                                │   │
│  │  Active  (Checkbox)                                      │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Images                                                  │   │
│  │  ─────────                                               │   │
│  │  [ImageUpload / ImageManager component]                  │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Attributes                                              │   │
│  │  ──────────                                              │   │
│  │  [AttributeBuilder component]                            │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Variants                                                │   │
│  │  ────────                                                │   │
│  │  [VariantManager component]                              │   │
│  │  [Generate variations] button                            │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                            [Cancel]   [Save product]     │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Sections

Each section is a card within the form (standard Card, no hover, `mb-6`).

### Basic information
Fields as listed. All standard Input/Textarea/Select/Checkbox components.

Slug field: read-only `surface-raised` Input by default, "Edit" link to make editable. Show live URL preview: `3dthium.com/products/[slug]` in `text-xs text-secondary`.

Price: £ prefix Input (`text-base font-semibold`). `type="number"` `step="0.01"` `min="0"`.

### Images
Use the existing `ImageManager` and `ImageUpload` components, restyled to match Card/FileUpload specs.

Layout: grid of uploaded images (80×80px thumbnails) + "Add image" FileUpload slot.
Each image thumbnail: "Set as main" checkbox + "Remove" icon (×).
Main image: marked with a "Main" badge (brand).

### Attributes
Use the existing `AttributeBuilder` component.

The form for each attribute:
- Attribute name (Input sm)
- Values (comma-separated tags or individual Input+Add pattern)
- Remove attribute (×)
- "Add attribute" ghost button sm

### Variants (if attributes are defined)
Use the existing `VariantManager` component.

Each variant row in a table:
- Combination name (auto)
- Price adjustment (£ ± Input sm)
- Available (Checkbox)
- Remove (×)

"Generate all variations" button (secondary md): triggers `VariationGenerator` — confirm with a modal if variants already exist ("This will regenerate all variants. Existing variant data will be replaced.").

---

## Validation

Required fields validated on submit. Slug must be unique (async validate on blur, show "Slug available" / "Slug taken" status).

---

## Submit states

"Save product" — primary md.
Loading: "Saving…" + spinner.
Success: Toast "Product saved." + redirect to `/admin/products`.
Error: Toast "Couldn't save product. Try again."

---

## Cancel

Ghost button → `/admin/products`. If form is dirty (unsaved changes), confirm: "You have unsaved changes. Leave without saving?" [Leave] [Stay].

---

## Edit vs Create

Edit mode pre-populates all fields. PageHeader shows "Edit: [product name]".

In edit mode, a "Delete product" danger button sm appears below the form (outside the card, left-aligned). Clicking opens the confirmation modal.
