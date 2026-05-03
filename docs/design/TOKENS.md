# 3dthium Design Tokens

Source of truth: `styles/tokens.css` (`@theme` block).
Tailwind classes in components must use token-backed aliases — **no hard-coded palette classes** (e.g. `emerald-500`, `zinc-900`, `gray-200`) outside the token file.

---

## Colours

### Brand

| Token | Value | Use |
|-------|-------|-----|
| `brand-primary` | `#10b981` (emerald-500) | Active states, spinners, focus rings, filter chips, links |
| `brand-primary-hover` | `#059669` (emerald-600) | Hover on brand-coloured elements |
| `brand-primary-subtle` | `#d1fae5` (emerald-100) | Tinted backgrounds (badges, chips) |
| `brand-primary-muted` | `#6ee7b7` (emerald-300) | Borders on tinted backgrounds |
| `brand-secondary` | `#18181b` (zinc-900) | Primary action buttons, headings h1–h2 |
| `brand-secondary-hover` | `#27272a` (zinc-800) | Hover on dark buttons |
| `brand-accent` | `#22d3ee` (cyan-400) | **Gradient terminus only** — never a solid fill |

**Rules:**
- `brand-primary` goes on **white/light backgrounds** only. On dark backgrounds (e.g., hero), use `text-white` or the gradient treatment.
- `brand-secondary` (near-black) is the CTA button colour, not `brand-primary`. The primary/secondary naming here refers to the palette role, not button hierarchy.
- `brand-accent` (cyan) must only appear in CSS gradients. Never use it as a standalone text, background, or border colour.

### Neutrals

| Token | Hex | Role |
|-------|-----|------|
| `neutral-0` | `#ffffff` | Page background, card background, modal background |
| `neutral-50` | `#fafafa` | Raised surface (sidebar, table header) |
| `neutral-100` | `#f4f4f5` | Pressed/active backgrounds, skeleton loader |
| `neutral-200` | `#e4e4e7` | Default border |
| `neutral-300` | `#d4d4d8` | Hovered border, dividers |
| `neutral-400` | `#a1a1aa` | Disabled text, placeholder text, icons |
| `neutral-500` | `#71717a` | Tertiary text, meta-info |
| `neutral-600` | `#52525b` | Secondary text, labels |
| `neutral-700` | `#3f3f46` | — (reserved) |
| `neutral-800` | `#27272a` | — (reserved) |
| `neutral-900` | `#18181b` | Primary text, headings |

**Do not use `gray-*` Tailwind classes** — the zinc scale is the single neutral palette.

### Semantic

| Token | Use case | Background | Border | Text |
|-------|----------|-----------|--------|------|
| `success` | Order confirmed, saved | `success-subtle` | `success-border` | `success` |
| `warning` | Pending orders, low stock | `warning-subtle` | `warning-border` | `warning` |
| `danger` | Errors, destructive actions | `danger-subtle` | `danger-border` | `danger` |
| `info` | Informational banners | `info-subtle` | `info-border` | `info` |

### Text

| Token | Use |
|-------|-----|
| `text-primary` → `neutral-900` | All headings, body copy |
| `text-secondary` → `neutral-600` | Labels, meta, descriptions |
| `text-tertiary` → `neutral-400` | Placeholders, captions, disabled |
| `text-on-dark` → `neutral-0` | Text on dark buttons/backgrounds |
| `text-link` → `brand-primary-hover` | Inline links |

---

## Typography

Font family: **Inter** (self-hosted via `next/font/google` — performance role will wire this).

### Scale

| Token | Size | Equivalent px (18px base) | Use |
|-------|------|--------------------------|-----|
| `text-xs` | 0.694rem | ~12.5px | Badges, captions, copyright |
| `text-sm` | 0.833rem | ~15px | Labels, table cells, meta |
| `text-base` | 1rem | 18px | Body copy, form inputs |
| `text-lg` | 1.2rem | ~22px | Lead text, card descriptions |
| `text-xl` | 1.44rem | ~26px | h5, section sub-labels |
| `text-2xl` | 1.728rem | ~31px | h4, admin table headings |
| `text-3xl` | 2.074rem | ~37px | h3, section titles |
| `text-4xl` | 2.488rem | ~45px | h2, page titles |
| `text-5xl` | 3.157rem | ~57px | h1 |
| `text-6xl` | 3.953rem | ~71px | Hero display (sparingly) |

### Weights

Maximum **3 weights** in any component. Use the following roles:

| Weight | Value | Role |
|--------|-------|------|
| Regular | 400 | Body copy, table cells |
| Medium | 500 | Navigation links, labels, buttons, h4–h5 |
| Bold | 700 | h1, h2 — page-level headings only |

**Drop `font-light` (300) from all new components.** Use `font-regular` for secondary text, `text-secondary` colour for visual de-emphasis instead. `font-light` may remain on existing marketing copy during migration — frontend engineer will clean up.

`font-semibold` (600) is acceptable for h3 headings and card prices as a transition — not a permanent fixture.

### Heading scale

| Level | Size | Weight | Line-height |
|-------|------|--------|-------------|
| h1 | `text-5xl` | bold | tight |
| h2 | `text-4xl` | bold | tight |
| h3 | `text-3xl` | medium | snug |
| h4 | `text-2xl` | medium | snug |
| h5 | `text-xl` | medium | normal |
| h6 | `text-base` | medium | normal |

---

## Spacing

4 px base. Use tokens rather than arbitrary values.

| Token | Value | Common uses |
|-------|-------|-------------|
| `space-1` | 4px | Inline gaps (icon + label) |
| `space-2` | 8px | Between tight-grouped elements |
| `space-3` | 12px | Badge padding, compact inputs |
| `space-4` | 16px | Standard inner padding |
| `space-6` | 24px | Card padding, section inner |
| `space-8` | 32px | Between card rows |
| `space-12` | 48px | Between sections (mobile) |
| `space-16` | 64px | Between sections (desktop) |
| `space-20` | 80px | Major section breaks |

---

## Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `radius-sm` | 4px | Tags, small badges |
| `radius-md` | 8px | Inputs, buttons, small cards |
| `radius-lg` | 12px | Standard card |
| `radius-xl` | 16px | Featured cards |
| `radius-2xl` | 24px | Section containers |
| `radius-3xl` | 32px | Hero blocks, gradient CTAs |
| `radius-full` | 9999px | Pills, avatar circles |

---

## Shadows

| Token | Use |
|-------|-----|
| `shadow-xs` | Subtle card lift, input on focus |
| `shadow-sm` | Default card |
| `shadow-md` | Dropdown, tooltip |
| `shadow-lg` | Modal, mobile nav drawer |
| `shadow-xl` | Popovers (rare) |

---

## Focus Ring

**All interactive elements share one ring style:**

```
box-shadow: 0 0 0 3px rgb(16 185 129 / 0.4)
```

In Tailwind: `focus-visible:ring-3 focus-visible:ring-brand-primary/40`

Apply via `@layer base` in `globals.css` as the default for `button, a, input, select, textarea, [role="button"]`. Individual components may override ring colour only for danger contexts (use `danger` colour).

**Never use `focus:outline-none` without a replacement ring.**

---

## Z-index

| Token | Value | Use |
|-------|-------|-----|
| `z-raised` | 10 | Hover cards, tooltips |
| `z-dropdown` | 100 | Select menus, autocomplete |
| `z-sticky` | 200 | Sticky table headers |
| `z-navbar` | 300 | Top navigation bar |
| `z-overlay` | 400 | Modal backdrop |
| `z-modal` | 500 | Modal dialog |
| `z-toast` | 600 | Toast notifications |

---

## Transitions

| Token | Duration | Use |
|-------|----------|-----|
| `transition-fast` | 150ms ease-out | Colour changes on hover |
| `transition-base` | 200ms ease-out | Border, shadow, opacity |
| `transition-slow` | 300ms ease-out | Panel open/close, page overlays |

---

## Layout Constants

| Token | Value | Use |
|-------|-------|-----|
| `max-w-content` | 80rem (1280px) | All page content wrappers |
| `navbar-height` | 4rem (64px) | `pt-[navbar-height]` on all pages |
| `sidebar-width` | 16rem (256px) | Admin layout |
