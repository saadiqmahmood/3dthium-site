# Admin Layout System

All admin pages share a common layout structure. Defined here so each admin page spec can reference it without repeating.

---

## Chrome

```
┌─────────────────────────────────────────────────────────────────┐
│  [AdminSidebar — fixed, 256px]  │  [Main content area]         │
│                                 │                              │
│  🧊 3dthium                     │  [PageHeader]                │
│                                 │  ──────────────────────      │
│  ── Navigation ──               │  [Filter bar — optional]     │
│  Dashboard                      │  [Content: table / form]     │
│  Products                       │                              │
│  Categories                     │                              │
│  Orders                         │                              │
│  Custom Orders                  │                              │
│  Users                          │                              │
│                                 │                              │
│  ── Account ──                  │                              │
│  [User email]                   │                              │
│  Sign out                       │                              │
└─────────────────────────────────┴──────────────────────────────┘
```

---

## AdminSidebar

```
position: fixed
top: 0; left: 0; height: 100vh
width: sidebar-width (256px)
bg: surface (#ffffff)
border-right: 1px solid border (#e4e4e7)
z-index: z-navbar (300)
display: flex; flex-direction: column
overflow-y: auto
```

### Logo / brand area
```
padding: space-5 space-6
border-bottom: 1px solid border
font-size: text-xl; font-weight: medium; color: text-primary
```
"3dthium" wordmark. No icon needed.

### Navigation groups
```
padding: space-4 space-3
```

Group label:
```
font-size: text-xs; font-weight: medium; color: text-tertiary
text-transform: uppercase; letter-spacing: 0.05em
padding: space-2 space-3; margin-bottom: space-1
```

Nav item (link):
```
display: flex; align-items: center; gap: space-3
padding: space-2.5 space-3; border-radius: radius-md
font-size: text-sm; font-weight: medium
color: text-secondary
hover: bg-surface-overlay text-primary
transition: transition-fast

Active:
  bg: brand-primary-subtle (#d1fae5)
  color: brand-primary-hover (#059669)
  font-weight: medium
```

Icon: 18px, same colour as text.

### User / account area
```
margin-top: auto
padding: space-4 space-3
border-top: 1px solid border
```
User email: `text-sm text-secondary`, truncated.
"Sign out" link: `text-sm text-danger hover:text-danger` (no button, just a link).

---

## Main content area

```
margin-left: sidebar-width (256px)
min-height: 100vh
padding: space-8 (all sides)
bg: surface-raised (#fafafa)
```

Mobile: sidebar collapses to a top hamburger menu. Main content is full width.

---

## Admin PageHeader

Same as the PageHeader component, but inside the admin content area.

```
display: flex; justify-content: space-between; align-items: center
margin-bottom: space-6
```

- Left: `<h1>` page title + optional count badge
- Right: Primary action button (e.g., "Add product")

---

## Filter Bar (optional, used on list pages)

```
bg: surface (#ffffff)
border: 1px solid border
border-radius: radius-lg
padding: space-4
margin-bottom: space-6
display: flex; flex-wrap: wrap; gap: space-3; align-items: center
```

Contains: search input, select filters. "Clear filters" ghost button sm when any filter is active.

---

## Admin Table (list pages)

```
bg: surface
border: 1px solid border
border-radius: radius-lg
overflow: hidden
shadow: shadow-xs
```

```
thead:
  bg: surface-raised
  border-bottom: 1px solid border
  th: text-xs font-medium text-secondary uppercase tracking-wide padding: space-3 space-4

tbody:
  tr: border-bottom: 1px solid border (except last)
  tr hover: bg-surface-raised
  td: text-sm text-primary padding: space-3 space-4

tbody td:last-child (actions):
  display: flex; gap: space-2; justify-content: flex-end
```

---

## Admin Form (create / edit pages)

Max-width: 720px. Left-aligned within the content area (not centred).

```
bg: surface (#ffffff)
border: 1px solid border
border-radius: radius-lg
padding: space-8
```

Section headings inside form: `text-base font-medium text-primary` with `border-bottom: 1px solid border pb-2 mb-4`.

Form actions (bottom):
```
display: flex; gap: space-3; justify-content: flex-end; margin-top: space-8
padding-top: space-6; border-top: 1px solid border
```
[Cancel] (ghost) — [Save] (primary)

---

## Mobile admin

On mobile, the sidebar is hidden. A sticky top bar shows the 3dthium logo and a hamburger icon. Tapping opens the sidebar as a full-height overlay drawer from the left (same sidebar styles). Backdrop closes it.

Main content: no left margin, full width.
