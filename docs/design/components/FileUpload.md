# Component: FileUpload

---

## Anatomy

```
Label text  *
┌───────────────────────────────────────────────────────┐
│                                                       │
│           ↑  Drag files here or                       │
│              Browse files                             │
│                                                       │
│           Accepted: .stl, .obj, .step  Max 50 MB      │
└───────────────────────────────────────────────────────┘
Helper text or error message
```

After file selected:
```
┌───────────────────────────────────────────────────────┐
│  📄  model.stl                          23.4 MB  [×]  │
└───────────────────────────────────────────────────────┘
```

---

## States

### Default
```
border: 2px dashed border (#e4e4e7)
border-radius: radius-lg (12px)
bg: surface-raised (#fafafa)
padding: py-10 px-8
text-align: center
```

### Drag over
```
border-color: brand-primary (#10b981)
bg: brand-primary-subtle (#d1fae5)
```

### Focus (on the hidden input or the "Browse files" trigger)
Standard focus ring on the "Browse files" button.

### With file selected
```
border: 1px solid border-strong (#d4d4d8)
bg: surface (#ffffff)
padding: py-3 px-4
display: flex; align-items: center; justify-content: space-between
```

### Error
```
border-color: danger (#dc2626)
bg: danger-subtle (#fef2f2)
```
Error message below drop zone.

### Uploading
Show a progress bar across the bottom of the drop zone.
```
progress bar bg: brand-primary
height: 3px
border-radius at bottom: radius-lg
```
Percentage or "Uploading…" label above.

### Upload complete
Replace progress bar with a checkmark icon in `success` colour.

### Disabled
```
opacity: 0.5
cursor: not-allowed
pointer-events: none
```

---

## "Browse files" button

Inside the drop zone. Style as **secondary button sm**. Opens the hidden `<input type="file">`.

---

## File preview (post-select)

| Element | Style |
|---------|-------|
| File icon | 20px, `text-secondary` |
| File name | `text-sm font-medium text-primary`, truncate with ellipsis |
| File size | `text-sm text-secondary` |
| Remove button | Icon button (×), `text-tertiary`, `hover:text-danger` |

---

## Accepted types / size

Show beneath the drop zone in `text-xs text-secondary`. Format:
`Accepted: .stl, .obj, .3mf · Max 50 MB`

---

## Accessibility

The native `<input type="file">` must be present in the DOM (sr-only) so screen readers can use it:

```tsx
<div role="region" aria-label="File upload">
  <label htmlFor="model-file">Upload your 3D model</label>
  <input
    id="model-file"
    type="file"
    className="sr-only"
    accept=".stl,.obj,.step,.3mf"
    aria-describedby="file-hint"
  />
  {/* Visual drop zone */}
  <div onDrop={...} onDragOver={...} onClick={() => inputRef.current?.click()}>
    ...
  </div>
  <p id="file-hint">Accepted formats: .stl, .obj, .step, .3mf. Max 50 MB.</p>
</div>
```

The drop zone `<div>` should have `role="button"` `tabIndex={0}` and respond to `Enter`/`Space` keypress.
