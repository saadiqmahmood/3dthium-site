# Component: Textarea

Inherits all states, label, helper text, and error patterns from **Input**. Only differences documented here.

---

## Anatomy

```
Label text  *
┌──────────────────────────────────────┐
│                                      │
│  placeholder text                    │
│                                      │
│                                      │
└──────────────────────────────────────┘
Helper text or error message
          [0 / 500 characters]
```

---

## Differences from Input

| Property | Input | Textarea |
|----------|-------|----------|
| Height | Single line | `rows={4}` default (72px approx) |
| Resize | n/a | `resize-y` — allow vertical resize only |
| Character count | Not shown | Show when `maxLength` is set |

---

## Character Counter

Displayed bottom-right when a `maxLength` is provided.

```
font-size: text-xs
color: text-tertiary
```

Turns `danger` colour when < 20 characters remain.

---

## Sizes

| Size | Min rows | Use |
|------|----------|-----|
| sm | 2 | Short notes |
| md (default) | 4 | Standard message fields |
| lg | 8 | Custom order description, contact message |

---

## Padding

Same as Input: `px-4 py-3`.

---

## Usage Rules

- Use for any free-text input over ~80 characters.
- Always set a `maxLength` and show the counter.
- `resize-x` (horizontal only) and `resize` (both) are forbidden — horizontal resize breaks layout.
