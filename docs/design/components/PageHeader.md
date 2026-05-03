# Component: PageHeader

Used at the top of main content pages (below the Navbar) to establish page identity.

---

## Anatomy

```
┌──────────────────────────────────────────────────────────────┐
│  [Breadcrumb — optional]                                     │
│                                                              │
│  Page title                       [Primary action — opt]    │
│  Descriptive subtitle — optional                            │
└──────────────────────────────────────────────────────────────┘
```

---

## Styles

```
padding: space-8 0 (top/bottom), 0 (left/right — padding is from the page layout container)
border-bottom: 1px solid border (#e4e4e7)
margin-bottom: space-8 (32px) below the border
```

### Title
```
font-size: text-4xl (on desktop), text-3xl (on mobile)
font-weight: bold (700)
color: text-primary (#18181b)
```

### Subtitle
```
font-size: text-base
font-weight: regular (400)
color: text-secondary (#52525b)
margin-top: space-2 (8px)
max-width: 520px
```

### Action area (right side)
Aligns to the right on desktop, moves below title on mobile.

---

## Variants

### Simple (most pages)
Title only.

```
Products

────────────────────────────────────────────────────
```

### With subtitle
```
My Account
Manage your profile, address, and order history.

────────────────────────────────────────────────────
```

### With action (admin pages)
```
Products                                 [+ Add product]

────────────────────────────────────────────────────
```

### Admin header with stat count
```
Orders  (143)                            [Export CSV]

────────────────────────────────────────────────────
```
Count in parentheses: `text-2xl font-light text-secondary`, displayed inline after title.

---

## Spacing below

`margin-bottom: space-8 (32px)` between PageHeader and first content section.

---

## Responsive behaviour

- On mobile: action moves below the title, full width.
- Title size drops one step: `text-4xl → text-3xl`.

---

## Usage rules

- Every page has exactly one PageHeader.
- The PageHeader `<h1>` is the only `<h1>` on the page.
- Do not use PageHeader inside modals — modals have their own header.
