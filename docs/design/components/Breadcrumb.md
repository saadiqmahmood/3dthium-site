# Component: Breadcrumb

---

## Anatomy

```
Home  /  Products  /  Category name  /  Product name
```

---

## Styles

```
display: flex; flex-wrap: wrap; align-items: center
gap: space-1 (4px)
font-size: text-sm
font-weight: regular (400)
margin-bottom: space-2 (8px)
```

### Links (all crumbs except last)
```
color: text-secondary (#52525b)
hover: text-link (#059669)
transition: transition-fast
text-decoration: none
```

### Separator `/`
```
color: text-tertiary (#a1a1aa)
margin: 0 space-1 (4px)
aria-hidden="true"
```

### Current page (last crumb, no link)
```
color: text-primary (#18181b)
font-weight: medium (500)
aria-current="page"
```

---

## Truncation

On mobile, if the breadcrumb has 4+ levels, collapse middle items:

```
Home  /  …  /  Product name
```

The `…` expands on tap.

---

## Usage

Show breadcrumbs on:
- `/products/[slug]` — Home / Products / [Category] / [Product name]
- `/admin/**` — Admin / [Section] / [Item name]

Do not show breadcrumbs on:
- Top-level pages (Home, Products index, Account, Orders)
- Auth pages
- Checkout pages (step indicator replaces breadcrumbs)

---

## Accessibility

```tsx
<nav aria-label="Breadcrumb">
  <ol className="...">
    <li><a href="/">Home</a></li>
    <li aria-hidden="true">/</li>
    <li><a href="/products">Products</a></li>
    <li aria-hidden="true">/</li>
    <li aria-current="page">Product name</li>
  </ol>
</nav>
```

Use `<nav aria-label="Breadcrumb">` + `<ol>` (ordered list — order matters).
Separators have `aria-hidden="true"`.
Last item has `aria-current="page"`.
