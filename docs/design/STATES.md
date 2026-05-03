# Data-Fetch State Catalogue

Every place in the app that fetches data must implement the four-state machine:
`LOADING → EMPTY | ERROR | SUCCESS`

The frontend engineer uses this as a checklist. Every row must be resolved.

---

## Customer Pages

### Home (`/`)
| Data | Loading | Empty | Error |
|------|---------|-------|-------|
| Featured products | 3 skeleton ProductCards | Hide the section entirely | Hide the section (not critical) |

### Products (`/products`)
| Data | Loading | Empty | Error |
|------|---------|-------|-------|
| Category list | Show last-seen chips or skeleton chips | Hide filter bar | Hide filter bar |
| Product grid | 8 skeleton ProductCards | EmptyState: "No products in this category" + "Clear filter" | ErrorState: "Couldn't load products" + retry |

### Product Detail (`/products/[slug]`)
| Data | Loading | Empty (404) | Error |
|------|---------|------------|-------|
| Product | Skeleton (image block + text lines) | ErrorState: "Product not found" + "Browse products" | ErrorState: "Couldn't load this product" + retry |

### Cart (`/cart`)
| Data | Loading | Empty | Error |
|------|---------|-------|-------|
| Cart items | Skeleton rows | EmptyState: "Your cart is empty" + "Browse products" | Toast error |
| Server quote | `—` in price cells, disabled checkout | — | Toast: "Couldn't calculate total. Try again." |

### Checkout — Step 1 (Address)
| Data | Loading | Empty | Error |
|------|---------|-------|-------|
| Saved address (pre-fill) | Input fields empty (wait for prefill, no skeleton) | Form empty (user types) | No prefill, form stays empty — silent |

### Checkout — Step 2 (Shipping)
| Data | Loading | Empty (no rates) | Error |
|------|---------|-----------------|-------|
| Shippo rates | 2 skeleton rate cards | ErrorState inline: "No delivery options available. Check your address." | ErrorState inline: same message |

### Checkout — Step 3 (Payment)
| Data | Loading | Empty | Error |
|------|---------|-------|-------|
| Stripe element | Stripe handles its own loading state | — | Toast (Stripe error message) |

### Success (`/success`)
| Data | Loading | Empty (no order) | Error |
|------|---------|-----------------|-------|
| Order confirmation | Spinner + "Confirming your order…" | Redirect to /orders | "Payment processed but order not found yet" |

### Account (`/account`)
| Data | Loading | Empty | Error |
|------|---------|-------|-------|
| User profile | Skeleton cards | — (user always has a profile) | ErrorState: "Couldn't load your account" |
| Saved address | Field inputs blank | "No saved address" + save prompt | Toast error |

### Orders (`/orders`)
| Data | Loading | Empty | Error |
|------|---------|-------|-------|
| Order list | 3 skeleton order cards | EmptyState: "No orders yet" + "Browse products" | ErrorState: "Couldn't load your orders" |
| Order detail (expand) | Spinner inside card | — | Toast error: "Couldn't load order details" |

### Custom Order (`/custom-order`)
No data fetched on load — form only.

### Contact (`/contact`)
No data fetched on load — form only.

### Auth (`/auth`)
No data fetched on load — form only.

---

## Admin Pages

### Dashboard (`/admin`)
| Data | Loading | Empty | Error |
|------|---------|-------|-------|
| Stat metrics | 4 skeleton stat cards | Show `0` values | ErrorState inline in stats row |
| Recent orders | 10 skeleton table rows | "No recent orders" | ErrorState inline in table |

### Products list (`/admin/products`)
| Data | Loading | Empty | Error |
|------|---------|-------|-------|
| Category filters | Skeleton chips | Hide filter | Hide filter |
| Product table | 8 skeleton rows | EmptyState: "No products yet" | ErrorState |

### Create / Edit Product (`/admin/create-product`, `/admin/products/[id]`)
| Data | Loading | Empty | Error |
|------|---------|-------|-------|
| Product data (edit mode) | Skeleton form | — | ErrorState: "Couldn't load product" + back link |
| Category list (select) | Disabled select | No categories: "Create a category first" | Select stays disabled |

### Categories (`/admin/categories`)
| Data | Loading | Empty | Error |
|------|---------|-------|-------|
| Category list | 5 skeleton rows | EmptyState: "No categories yet" | ErrorState |

### Orders (`/admin/orders`)
| Data | Loading | Empty | Error |
|------|---------|-------|-------|
| Stats | 4 skeleton stat cards | `0` values | Hide stats row |
| Order table | 10 skeleton rows | EmptyState | ErrorState |
| Order detail modal | Spinner inside modal | — | Modal shows ErrorState with Close button |

### Users (`/admin/users`)
| Data | Loading | Empty | Error |
|------|---------|-------|-------|
| User table | 10 skeleton rows | EmptyState | ErrorState |

### Custom Orders (`/admin/custom-orders`)
| Data | Loading | Empty | Error |
|------|---------|-------|-------|
| Custom order table | 8 skeleton rows | EmptyState: "No custom order enquiries" | ErrorState |
| Order detail modal | Spinner inside modal | — | Modal ErrorState |

---

## Skeleton Patterns

### Text line skeleton
```css
height: 1rem; border-radius: radius-sm; bg: neutral-100; animation: pulse 2s infinite;
```

### Image/block skeleton
```css
border-radius: matches the real element's radius; bg: neutral-100; animation: pulse 2s infinite;
```

### Skeleton ProductCard
```
Image block: aspect-square, rounded-t-lg, bg-neutral-100, animate-pulse
Name: h-3 w-3/4 bg-neutral-100 animate-pulse rounded mt-3
Price: h-3 w-1/4 bg-neutral-100 animate-pulse rounded mt-2
```

### Skeleton table row
```
Each cell: h-4 bg-neutral-100 animate-pulse rounded; varying widths per column
```
