# Component: Select

Use the native `<select>` element. Do not build a custom dropdown unless you need multi-select with search — and even then, evaluate accessibility cost.

---

## Anatomy

```
Label text  *
┌──────────────────────────────────────────┐
│  Option text                         ▾   │
└──────────────────────────────────────────┘
Helper text or error message
```

The trailing chevron (`▾`) is rendered via a background SVG on the wrapper — do not use `appearance-none` without a replacement chevron.

---

## States

Inherits all states from **Input** (default, hover, focus, disabled, error). Same padding, radius, border, and focus ring.

### Specific differences

- `appearance-none` to remove native OS chevron.
- Replace with a custom SVG chevron positioned absolutely at right.
- `cursor-pointer` on the select element.
- On `disabled`: remove `cursor-pointer`, add `cursor-not-allowed`.

---

## Sizing

| Size | Padding | Font size |
|------|---------|-----------|
| sm | `px-3 py-2` | `text-sm` |
| md (default) | `px-4 py-3` | `text-base` |

---

## Options

- First option should be a non-value placeholder: `<option value="">Select an option</option>`.
- Placeholder option is `disabled` and `selected` by default (forces user to choose).
- Group related options with `<optgroup label="...">`.

---

## Usage Rules

- Use `<select>` for 3–12 options. For 1–2 options, use Radio. For 12+, add a search input above.
- Avoid custom JS dropdowns unless native `<select>` lacks a required feature (e.g., search-filtered multi-select). If custom is required, use a fully accessible library.
- `size` attribute: never set `size > 1` unless you want a list box (use Radio for that).

---

## Accessibility

```tsx
<label htmlFor="category">Category <span aria-hidden="true">*</span></label>
<select
  id="category"
  aria-required="true"
  aria-invalid={!!error}
  aria-describedby={error ? "category-error" : undefined}
>
  <option value="" disabled selected>Select a category</option>
  ...
</select>
{error && <p id="category-error" role="alert">...</p>}
```
