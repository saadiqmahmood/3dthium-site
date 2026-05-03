# Component: Checkbox

---

## Anatomy

```
[✓]  Label text
     Optional helper text
```

Control left, label right. Never label above.

---

## States

### Default (unchecked)
```
width/height: 18px × 18px
border: 1.5px solid border (#e4e4e7)
border-radius: radius-sm (4px)
bg: surface (#ffffff)
```

### Checked
```
bg: brand-primary (#10b981)
border-color: brand-primary (#10b981)
checkmark: white SVG
```

### Hover (unchecked)
```
border-color: border-strong (#d4d4d8)
bg: surface-raised (#fafafa)
```

### Hover (checked)
```
bg: brand-primary-hover (#059669)
border-color: brand-primary-hover
```

### Focus
```
box-shadow: 0 0 0 3px rgb(16 185 129 / 0.4)
outline: none
```

### Disabled (unchecked)
```
bg: surface-overlay (#f4f4f5)
border-color: neutral-300 (#d4d4d8)
cursor: not-allowed
aria-disabled="true"
```

### Disabled (checked)
```
bg: brand-primary-subtle (#d1fae5)
border-color: brand-primary-muted (#6ee7b7)
checkmark: brand-primary (#10b981)
```

### Indeterminate
```
bg: brand-primary (#10b981)
border-color: brand-primary
dash mark: white SVG (–)
```
Use for "select all" when some-but-not-all children are selected.

---

## Label

```
font-size: text-base
font-weight: regular (400)
color: text-primary
cursor: pointer  (clicking label checks the box)
```

### Helper text (optional, beneath label)
```
font-size: text-sm
color: text-secondary
margin-top: 0
```

---

## Group

Multiple related checkboxes use `<fieldset>` + `<legend>`:

```
┌─────────────────────────────┐
│ Choose finishes             │ ← <legend> styled as label
│                             │
│  [✓]  Matte                 │
│  [ ]  Gloss                 │
│  [ ]  Textured              │
└─────────────────────────────┘
```

Spacing between options: `space-y-3` (12px).

---

## Spacing

- Checkbox box and label: `gap-3` (12px) horizontal
- Group items: `gap-3` (12px) vertical

---

## Accessibility

```tsx
<input
  type="checkbox"
  id="accept-terms"
  aria-describedby="accept-terms-helper"
/>
<label htmlFor="accept-terms">I accept the terms</label>
<p id="accept-terms-helper" className="...">You must accept to continue.</p>
```

For groups:
```tsx
<fieldset>
  <legend>Notify me when:</legend>
  <label><input type="checkbox" /> Order shipped</label>
  <label><input type="checkbox" /> Order delivered</label>
</fieldset>
```
