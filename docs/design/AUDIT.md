# 3dthium Visual Design Audit

_Conducted pre-launch. Based on reading every file in `pages/` and `components/`. Findings grouped by issue type._

---

## 1. Colour — Inconsistent Palette

### Problem
The site uses **two brand accents** (emerald + cyan), but they are applied ad-hoc with no clear rule:
- `emerald-500` as the primary accent (spinners, active states, CTA gradients)
- `cyan-400/500` only in gradient overlays and hero glows
- Opacity variants scattered without a system: `/5`, `/10`, `/20`, `/30`, `/50` — all appearing inline

Neutral text mixes `zinc-*` and `gray-*` interchangeably:
- `text-zinc-900`, `text-zinc-700`, `text-zinc-600`, `text-zinc-400` (text scale)
- `bg-gray-50`, `bg-gray-100`, `bg-gray-200` (backgrounds)
- These refer to nearly identical colours from two different Tailwind palettes — no semantic distinction.

Status colours are inconsistent:
- "Success" uses both `green-*` and `emerald-*` (different hues).
- Badge colours for order status: `emerald-400` for "Paid", `yellow-400` for "Pending", `red-*` for "Cancelled" — but on dark `bg-*-500/20` backgrounds in orders table, and light `bg-*-50` elsewhere. Two separate badge styles for the same states.

### Files affected
`pages/admin/orders.tsx`, `pages/orders.tsx`, `components/sections/HeroSection.tsx`, `pages/products/[slug].tsx`, `pages/checkout.tsx`

### Fix direction
See `TOKENS.md`. Centralise on one neutral palette (zinc), define semantic aliases for success/warning/danger/info, and restrict emerald/cyan to brand roles only.

---

## 2. Typography — No Consistent Hierarchy

### Problem
`font-light` (300) is applied to nearly everything — body copy, nav links, labels, descriptions — creating a flat, hard-to-scan hierarchy.

Five font weights in use (`font-light`, `font-normal`, `font-medium`, `font-semibold`, `font-bold`) with no documented rule for which weight maps to which role.

Heading sizes jump non-uniformly:
- Hero: `text-8xl` (84px-equivalent at 18px base) — extremely large
- Page title: `text-4xl` — large
- Section headers: `text-2xl`, `text-3xl` — inconsistent between pages
- Card headings: `text-sm font-normal` (ProductCard) vs `text-xl font-medium` (admin) — no standard

`pages/about.tsx` uses `text-7xl` for a heading that is literally the same page section as `text-3xl` headings on other pages.

### Files affected
`components/ui/ProductCard.tsx`, `pages/index.tsx`, `pages/about.tsx`, `pages/products/[slug].tsx`, `pages/admin/orders.tsx`

### Fix direction
See `TOKENS.md`. Max 3 weights: regular (400), medium (500), bold (700). Drop light (300) for body — move it to captions and secondary labels only. Define a heading scale h1–h5 with fixed sizes and weights.

---

## 3. Button Styles — Three Unrelated Patterns

### Problem
Three distinct button treatments exist with no clear hierarchy:

**Pattern A — Dark primary** (most CTAs):
```
bg-zinc-900 text-white px-8 py-4 rounded-lg font-medium hover:bg-zinc-800
```

**Pattern B — Outline secondary**:
```
border border-gray-300 text-zinc-900 px-8 py-4 rounded-lg font-medium hover:bg-gray-50
```

**Pattern C — Brand-coloured active filter**:
```
bg-emerald-500 text-white border border-emerald-500
```

Additionally, admin action buttons (e.g. delete, edit) use inline styles with no shared base:
- `bg-red-600 text-white hover:bg-red-700 text-xs px-3 py-1.5 rounded`
- `text-blue-600 hover:text-blue-700 text-sm` (text-only)
- `bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700`

Disabled state: `disabled:opacity-50 disabled:cursor-not-allowed` — present on some buttons, absent on others.

Focus state: **no `focus-visible` ring on any button**. Keyboard navigation is invisible.

### Fix direction
See `docs/design/components/Button.md`. Four variants: primary, secondary, ghost, danger. Two sizes: sm, md (default). Focus ring mandatory on all.

---

## 4. Form Inputs — Two Competing Focus Colours

### Problem
Two different focus colour schemes used across the same forms:
- **Blue focus**: `focus:ring-2 focus:ring-blue-500 focus:border-transparent` — checkout, contact, auth
- **Emerald focus**: `focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300` — admin, product forms

No rule for which to use. Result: within the checkout flow (3 steps), address form uses blue focus, shipping step uses emerald focus.

Placeholder text colour: `placeholder:text-zinc-500` in some inputs, no placeholder class in others (falls back to browser default grey).

Error state: inline `text-red-500 text-sm` below the field in some places; `border-red-500` ring in others; no unified error presentation.

Label position inconsistent:
- Most labels above the field: `text-sm font-medium text-zinc-700 mb-1`
- Some labels inline (checkbox): no consistent pattern
- Some required fields have `*` asterisks, most do not

### Fix direction
See `docs/design/components/Input.md`. Single focus: brand-primary ring. Unified error: red border + red helper text below. All labels above field. Required marker `*` on all required fields.

---

## 5. Card Patterns — No Standard Card

### Problem
Four distinct card styles for the same semantic purpose (displaying a product or content block):

```css
/* A — ProductCard: no border radius, bare border */
bg-white border border-gray-200 overflow-hidden

/* B — FeaturedProducts card */
bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8

/* C — Admin table row (not really a card, but used as one on mobile) */
border-b border-gray-100

/* D — Stats card (admin dashboard) */
bg-white rounded-lg p-6 shadow-sm border border-gray-100
```

ProductCard (`components/ui/ProductCard.tsx`) has `border border-gray-200` with **no border radius** — visually inconsistent with every other card in the app which uses `rounded-lg` or `rounded-2xl`.

### Fix direction
See `docs/design/components/Card.md`. Standard card: `bg-surface border border-border rounded-lg shadow-xs`. ProductCard uses the standard card base with an image slot.

---

## 6. Empty States — Missing

### Problem
- `pages/products/index.tsx`: if no products, renders nothing (empty `<div>`).
- `pages/orders.tsx`: renders "No orders found" as plain `text-zinc-500` text, no icon or action.
- `pages/cart.tsx`: "Your cart is empty" with minimal styling, no clear CTA to continue shopping.
- Admin product list: no empty state at all.
- Admin custom orders: no empty state.

### Fix direction
All empty states must use the `EmptyState` component (see spec). Minimum: icon + heading + body copy + primary action.

---

## 7. Error States — Missing or Alert()

### Problem
- `pages/checkout.tsx`: uses `alert()` to show errors (at least 3 instances).
- `pages/cart.tsx`: uses `alert()` on remove-item failure.
- `pages/account.tsx`: uses `alert()` for password update errors.
- `pages/orders.tsx`: shows `{error}` inline as a raw string inside a `<p>`.
- `pages/products/[slug].tsx`: shows a plain `<p>` "Error loading product" with no visual treatment.

### Fix direction
All `alert()` calls → `Toast` (error variant). All inline error strings → `ErrorState` component. See specs.

---

## 8. Loading States — Inconsistent

### Problem
Three different loading patterns in use:
1. `animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent` — spinner (most common)
2. `Loading...` plain text
3. Conditional render that shows nothing while loading (blank flash)

No skeleton loaders anywhere. On slow connections, product grid, order list, and admin tables all flash blank before content appears.

### Fix direction
See `docs/design/components/LoadingSpinner.md`. Use spinner for inline/button loading. Use skeleton screens for list and detail pages (specified per page in `docs/design/pages/`).

---

## 9. Focus States — Broken

### Problem
Keyboard navigation is effectively invisible site-wide:
- Buttons: no `focus-visible` ring (clicking removes the native outline, nothing replaces it)
- `<Link>` components: no custom focus style
- `<input>` focus style is inconsistent (see §4)
- `<select>` on Safari/Firefox shows native focus; on Chrome it's `focus:outline-none` with no ring replacement
- Mobile nav close button: no focus ring

This is a WCAG 2.2 AA failure.

### Fix direction
See `ACCESSIBILITY.md`. Global rule: every interactive element gets `focus-visible:ring-3 focus-visible:ring-brand-primary` (defined in tokens). Added via Tailwind `@layer base` in globals.css.

---

## 10. Navigation — Mobile Menu Incomplete

### Problem
- Mobile menu (`Navbar.tsx`) opens as a left-side drawer. Closing it requires either clicking outside or pressing the X button — no keyboard trap. Screen reader focus is not moved into the menu on open.
- Navbar has no `aria-label` on the `<nav>` element.
- "3dthium" logo is a text node, not a proper `<span aria-label>` or `<Image alt>`.
- Cart icon has `title` attribute but no `aria-label` — inconsistent across browsers.

---

## 11. Admin Layout — No Consistent Pattern

### Problem
Admin pages range from 246 to 1004 lines and each builds its own filter bar, action area, and table from scratch with no shared layout vocabulary.

Observed layout patterns that differ page-to-page:
- **Orders**: search/filter bar at top → stats row → table → detail modal
- **Products**: search + filter → grid of product cards (not a table)
- **Categories**: simple list, no filter bar
- **Users**: table with inline edit
- **Custom orders**: table with status filter

The AdminSidebar (`components/admin/AdminSidebar.tsx`) is 481 lines and includes navigation groups, collapse logic, and user info — reasonable but needs its API pinned down.

---

## 12. SessionDebug in Production

`components/SessionDebug.tsx` is imported in `pages/_app.tsx` unconditionally. It renders a collapsible debug panel showing auth state. This must be gated to `NODE_ENV !== 'production'` (frontend engineer's job).

---

## Summary of Issues by Severity

| # | Issue | Severity | Fix role |
|---|-------|----------|----------|
| 1 | Inconsistent colour palette | High | Designer (tokens) |
| 2 | No typography hierarchy | High | Designer (tokens + specs) |
| 3 | Three button styles, no focus rings | High | Designer (spec) + Frontend |
| 4 | Two competing input focus colours | High | Designer (spec) + Frontend |
| 5 | No standard card | Medium | Designer (spec) + Frontend |
| 6 | Missing empty states | High | Designer (spec) + Frontend |
| 7 | alert() for errors | High | Frontend |
| 8 | Inconsistent loading states | Medium | Designer (spec) + Frontend |
| 9 | Focus states broken site-wide | Critical | Designer (spec) + Frontend |
| 10 | Nav accessibility gaps | High | Frontend |
| 11 | Admin layout fragmented | Medium | Designer (page specs) |
| 12 | SessionDebug in prod | Medium | Frontend |
