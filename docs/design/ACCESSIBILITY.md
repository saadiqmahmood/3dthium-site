# 3dthium Accessibility Baseline

Target: **WCAG 2.2 AA** compliance before launch.

---

## 1. Colour Contrast Requirements

### Minimum ratios (WCAG 2.2 AA)
- Normal text (< 18px / < 14px bold): **4.5 : 1**
- Large text (≥ 18px / ≥ 14px bold): **3 : 1**
- UI components and graphical objects: **3 : 1**

### Current failing pairs (as-audited)

| Foreground | Background | Ratio | Use | Fail |
|------------|-----------|-------|-----|------|
| `emerald-500` (#10b981) | White (#fff) | ~2.3 : 1 | Active filter chip text | AA fail — normal text |
| `emerald-400` (#34d399) | White (#fff) | ~1.7 : 1 | Badge text in order status | AA fail |
| `cyan-400` (#22d3ee) | White (#fff) | ~1.9 : 1 | Gradient heading on white | AA fail |
| `zinc-400` (#a1a1aa) | White (#fff) | ~2.6 : 1 | Tertiary text, icon labels | AA fail — normal text |

### Required fixes

| Element | Replace with | Passes at |
|---------|-------------|-----------|
| `text-emerald-500` on white backgrounds | Use `text-brand-primary-hover` (#059669) — ratio 4.6:1 | AA pass |
| `text-emerald-400` badges | Use `text-brand-primary-hover` on `brand-primary-subtle` bg | AA pass |
| Cyan gradient text on white | Dark fallback text (`text-primary`) for non-decorative content | — |
| `text-zinc-400` as body text | `text-secondary` = `#52525b` — ratio 7.3:1 | AA pass |

**Rule:** Decorative gradient text (the hero `from-emerald-400 to-cyan-400 bg-clip-text`) is acceptable only when the same heading content is also accessible via other means (e.g., the underlying text is readable without the gradient). Mark such elements `aria-hidden="false"` and ensure contrast falls back correctly in forced-colors mode.

---

## 2. Focus Visible

### Requirement
Every interactive element must show a visible focus indicator when navigated via keyboard. WCAG 2.2 SC 2.4.11 (Focus Appearance — AA) requires:
- Minimum area: perimeter of the unfocused component × 2px
- Minimum contrast between focused and unfocused state: 3:1

### Implementation spec

Apply globally via `@layer base` in `globals.css`:

```css
@layer base {
  :focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgb(16 185 129 / 0.4); /* brand-primary/40 */
  }
}
```

The 3px ring at 40% opacity over white = ratio ~3.2:1 against white background. Acceptable for AA.

**Per-element overrides:**

| Element | Ring colour | Notes |
|---------|------------|-------|
| Button (primary, secondary, ghost) | `brand-primary/40` | Standard |
| Button (danger) | `danger/40` | Use red ring on danger buttons |
| Input, Select, Textarea | `brand-primary/40` + `border-focus` | Border colour also changes |
| Checkbox, Radio | `brand-primary/40` | Ring wraps the control box |
| Link | `brand-primary/40` | Standard |
| Modal close button | `brand-primary/40` | Standard |
| Nav items | `brand-primary/40` | Standard |

**Never use `focus:outline-none` without a visible replacement.**

---

## 3. Semantic Landmarks

Every page must include these landmark regions:

```html
<header> — Navbar (role="banner" on <header>)
<nav aria-label="Main navigation"> — inside <header>
<main id="main-content"> — wraps all page-specific content
<footer> — Footer (role="contentinfo" on <footer>)
```

Admin pages additionally:
```html
<aside aria-label="Admin navigation"> — AdminSidebar
```

### Skip link
Add a "Skip to main content" link as the **first focusable element** in `pages/_document.tsx`:

```html
<a href="#main-content" class="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 ...">
  Skip to main content
</a>
```

---

## 4. Heading Hierarchy

Each page must have **exactly one `<h1>`**. Heading levels must not skip (no h1 → h3).

| Page section | Heading level |
|-------------|---------------|
| Page title (SEO) | h1 |
| Major content sections | h2 |
| Subsections | h3 |
| Card / item titles | h3 or h4 |
| Form group labels | Use `<legend>` in `<fieldset>`, not a heading |

Current violation: `components/sections/HeroSection.tsx` wraps the hero copy in a `<h1>`-level class but may render as a `<div>` in some views — confirm tag.

---

## 5. Images

- Every `<Image>` must have a meaningful `alt` attribute.
- Decorative images (background patterns, glows): `alt=""` and `aria-hidden="true"`.
- Product images: `alt={product.name}`.
- Hero images: describe the subject.
- Icons used as standalone interactive controls (cart icon, close button): no `<img>` — use SVG with `aria-label` on the wrapping `<button>`.

---

## 6. Form Accessibility

- Every input must have an associated `<label>` via `htmlFor` / `id`. No placeholder-as-label.
- Required fields: `aria-required="true"` + visible `*` marker + note "* Required" somewhere on the form.
- Error messages: use `aria-describedby` linking input to error `<p>`. Error `<p>` must have `role="alert"` or be in a live region.
- Grouped options (radio, checkbox): wrap in `<fieldset>` with `<legend>`.
- File upload: `<input type="file">` with visible `<label>`. Do not use a styled `<div>` as the only trigger.

---

## 7. Keyboard Navigation

### Required tab order
1. Skip link
2. Navbar (logo → nav links → cart icon → sign in)
3. Main content (top to bottom, left to right)
4. Footer

### Required keyboard interactions

| Component | Keys |
|-----------|------|
| Modal | `Esc` closes; focus trapped inside while open; focus returns to trigger on close |
| Mobile nav drawer | `Esc` closes; focus trapped inside while open |
| Dropdown / Select | Native `<select>` is acceptable — do not build custom without full ARIA |
| Toast | Does not receive focus (auto-dismiss); includes close button that is keyboard reachable |
| Accordion (if used) | `Enter`/`Space` to toggle |
| Tabs (if used) | Arrow keys to navigate, `Enter`/`Space` to activate |

### Focus management rules
- When a modal opens: move focus to the first focusable element inside (typically the heading or close button).
- When a modal closes: return focus to the element that opened it.
- When a page-level error occurs (e.g., form validation): move focus to the error summary at the top of the form.

---

## 8. Interactive State Requirements

Every interactive element must have visible styling for:

| State | Requirement |
|-------|-------------|
| Default | Sufficient contrast (see §1) |
| Hover | Visible colour or border change |
| Focus | 3px brand-primary ring (see §2) |
| Active / Pressed | Slightly darker fill or inset shadow |
| Disabled | 50% opacity + `cursor-not-allowed` + `aria-disabled="true"` |
| Loading | Spinner + `aria-busy="true"` on the button; `aria-label` updated |
| Error | Red border + `aria-invalid="true"` + `aria-describedby` pointing to error |

---

## 9. Motion & Animation

The site uses CSS animations (slide-in, fade-in, bounce). Apply:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Add this to `globals.css`. Spinner animations are exempt (they convey state) — use `animation-duration: 1s` on spinner even in reduced-motion to keep it visually intelligible.

---

## 10. ARIA Roles to Apply

| Component | Required ARIA |
|-----------|--------------|
| Mobile nav drawer | `role="dialog"` `aria-modal="true"` `aria-label="Navigation menu"` |
| Modal | `role="dialog"` `aria-modal="true"` `aria-labelledby` (pointing to modal title) |
| Toast | `role="status"` (success) or `role="alert"` (error) `aria-live="polite"/"assertive"` |
| Loading spinner | `role="status"` `aria-label="Loading"` |
| Cart item count badge | `aria-label="N items in cart"` |
| Admin sidebar | `role="navigation"` `aria-label="Admin navigation"` |
| Filter group | `role="group"` `aria-label="Filter by category"` |

---

## 11. Testing Checklist

Before shipping each page:
- [ ] Tab through page from top to bottom — all interactive elements reachable
- [ ] Every focused element has visible ring
- [ ] Screen reader announces page title, headings, and form labels correctly (test with VoiceOver on Safari)
- [ ] Form errors announced via `role="alert"`
- [ ] Modal focus trap works
- [ ] Contrast ratios verified with browser DevTools (Firefox accessibility picker)
- [ ] `prefers-reduced-motion` disables decorative animations
- [ ] All images have meaningful alt text
