# Admin Page: Categories (`/admin/categories`)

See `admin-layout.md` for chrome and table patterns.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  PageHeader: "Categories" (8)         [+ Add category]           │
│  ──────────────────────────────────────────────────────         │
│                                                                  │
│  [Category table]                                                │
│  Name         Slug         Products   Actions                    │
│  Widgets      widgets      12         [E][D]                     │
│  Gadgets      gadgets      5          [E][D]                     │
│  ...                                                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## Table Columns

| Column | Content |
|--------|---------|
| Name | Category name |
| Slug | `text-sm text-secondary font-mono` |
| Products | Count linking to `/admin/products?category=[slug]` |
| Actions | [Edit] [Delete] icon buttons |

---

## Add / Edit Category (inline or modal — use modal, form is simple)

Modal md:
```
Heading: "Add category" / "Edit category"

Category name *  (Input md)
Slug *           (auto-generated from name, editable)
Description      (Textarea sm — 2 rows)

[Attributes]
  Each category has associated attribute templates (from CategoryAttributes).
  Simple list: attribute name + type (text/select/boolean).
  "Add attribute template" ghost button sm.

[Cancel]  [Save]
```

Validation: name required, slug unique (async check).

---

## Delete

Confirmation modal sm:
```
"Delete [category name]?"
"Products in this category will become uncategorised. This cannot be undone."
[Cancel]  [Delete]
```

---

## Empty state

```
No categories yet.
Add your first category to start organising products.
[+ Add category]
```

---

## Loading state

Skeleton table: 5 rows × 4 columns.
