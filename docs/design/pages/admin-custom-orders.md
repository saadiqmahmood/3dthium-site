# Admin Page: Custom Orders (`/admin/custom-orders`)

See `admin-layout.md` for chrome and table patterns.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  PageHeader: "Custom Orders" (18)                                │
│  ──────────────────────────────────────────────────────         │
│                                                                  │
│  [Filter bar]                                                    │
│  [Search name or email]  [Status: All ▾]  [Clear]               │
│                                                                  │
│  [Custom orders table]                                           │
│  Name       Email         Date      Budget     Status  Actions   │
│  Jane S.    jane@…        5 Jan     £50-£150   New     [View]   │
│  ...                                                             │
│                                                                  │
│  [Pagination]                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Table columns

| Column | Content | Notes |
|--------|---------|-------|
| Name | First + last | |
| Email | Email address | `text-sm text-secondary` |
| Date | Submitted date | |
| Budget | Budget range label | |
| Status | Badge | |
| Actions | [View] button sm | Opens detail modal |

---

## Status values

| Status | Badge variant |
|--------|--------------|
| new | Info |
| reviewing | Warning |
| quoted | Warning |
| accepted | Success |
| declined | Danger |
| completed | Success |

---

## Custom Order Detail (modal lg)

```
┌──────────────────────────────────────────────────────────────────┐
│  Custom order from Jane Smith                       [×]          │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Contact                                                         │
│  Name: Jane Smith  Email: jane@…  Phone: 07...                  │
│                                                                  │
│  Project description                                             │
│  [description text — preserve line breaks]                       │
│                                                                  │
│  Material / colour preference                                    │
│  [preference text]                                               │
│                                                                  │
│  Budget range: £50 – £150                                        │
│                                                                  │
│  Attached file                                                   │
│  [📎 model.stl  12 MB  Download]                                │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  Status:  [Status select]  [Update status]                      │
│                                                                  │
│  Admin notes (internal, not shown to customer)                   │
│  [Textarea sm]                                                   │
│  [Save notes]                                                    │
│                                                                  │
│                                              [Close]            │
└──────────────────────────────────────────────────────────────────┘
```

### Attached file
If `file_url` exists: show filename (derived from URL), file size (if available), download link.
If no file: "No file attached." — `text-sm text-tertiary`.

### Reply via email
"Reply by email" ghost button sm (opens `mailto:` link pre-populated with customer email and a template subject "Re: Your custom 3dthium order enquiry").

---

## Filter bar

Search: name or email, 300ms debounce.
Status: Select sm.

---

## Empty state

No enquiries:
```
[DocumentIcon, text-tertiary]
No custom order enquiries
When customers submit a custom order, it'll appear here.
```

---

## Loading

Skeleton table: 8 rows × 6 columns.
