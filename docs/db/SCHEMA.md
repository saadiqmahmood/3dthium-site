# Canonical Schema Reference

_This document describes the target schema **after** migration 0002 is applied._
_For the current (pre-rename) state, see `CURRENT_STATE.md`._

## Tables

### `products` (was `products_new`)
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| name | text | NOT NULL |
| slug | text | NOT NULL, UNIQUE |
| description | text | |
| category_id | uuid | FK → categories(id) ON DELETE SET NULL |
| base_price | numeric | NOT NULL |
| thumbnail_url | text | |
| images | jsonb | NOT NULL, DEFAULT '[]' |
| gallery_images | jsonb | NOT NULL, DEFAULT '[]' |
| image_crops | jsonb | NOT NULL, DEFAULT '{}' |
| is_active | boolean | NOT NULL, DEFAULT true |
| customizable | boolean | NOT NULL, DEFAULT false |
| attributes | jsonb | NOT NULL, DEFAULT '{}' |
| created_at | timestamptz | NOT NULL, DEFAULT now() |
| updated_at | timestamptz | NOT NULL, DEFAULT now() |

### `product_variants` (was `product_variants_new`)
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| product_id | uuid | NOT NULL, FK → products(id) ON DELETE CASCADE |
| size | varchar(50) | |
| color | varchar(50) | |
| material | varchar(50) | |
| price_adjustment | numeric | NOT NULL, DEFAULT 0 |
| sku | varchar(100) | UNIQUE |
| image_url | text | |
| stock_quantity | integer | NOT NULL, DEFAULT 0 |
| is_available | boolean | NOT NULL, DEFAULT true |
| created_at | timestamptz | NOT NULL, DEFAULT now() |
| updated_at | timestamptz | NOT NULL, DEFAULT now() |

**Indexes**: `idx_variants_product_id` on `product_id`
**Constraints**: UNIQUE(product_id, size, color, material) to prevent duplicate variant combinations

### `products_legacy` (was `products`)
Frozen legacy table. SELECT-only RLS. No application code should write to this table.

### `product_variants_legacy` (was `product_variants`)
Frozen legacy table. SELECT-only RLS. Only referenced by `admin/orders/[id].ts` for displaying old order history.

### `categories`
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| name | text | NOT NULL |
| slug | text | NOT NULL, UNIQUE |
| parent_id | uuid | FK → categories(id) (self-referential) |
| description | text | |
| image_url | text | |
| sort_order | integer | NOT NULL, DEFAULT 0 |
| is_active | boolean | NOT NULL, DEFAULT true |
| created_at | timestamptz | NOT NULL, DEFAULT now() |
| updated_at | timestamptz | NOT NULL, DEFAULT now() |

### `category_attributes`
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| category_id | uuid | FK → categories(id) ON DELETE SET NULL |
| name | text | NOT NULL |
| type | text | NOT NULL, DEFAULT 'text' |
| unit | text | |
| is_required | boolean | NOT NULL, DEFAULT false |
| is_filterable | boolean | NOT NULL, DEFAULT true |
| options | jsonb | NOT NULL, DEFAULT '[]' |
| display_order | integer | NOT NULL, DEFAULT 0 |
| created_at | timestamptz | NOT NULL, DEFAULT now() |

### `users`
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| auth_user_id | uuid | UNIQUE (references auth.users) |
| email | text | |
| is_admin | boolean | NOT NULL, DEFAULT false |
| created_at | timestamptz | NOT NULL, DEFAULT now() |

### `carts`
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| user_id | uuid | |
| created_at | timestamptz | NOT NULL, DEFAULT now() |
| updated_at | timestamptz | NOT NULL, DEFAULT now() |

### `cart_items`
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| cart_id | uuid | |
| variant_id | uuid | (logically → product_variants) |
| quantity | integer | NOT NULL |
| size | text | |

### `checkout_carts`
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| user_id | uuid | |
| guest_email | text | |
| cart_data | jsonb | NOT NULL |
| shipping_address | jsonb | |
| shipping_rate_id | text | |
| shipping_cost | numeric | DEFAULT 0.00 |
| shipping_provider | text | |
| shipping_service | text | |
| created_at | timestamptz | NOT NULL, DEFAULT now() |

### `orders`
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| user_id | uuid | |
| guest_email | text | |
| total_price | numeric | NOT NULL |
| status | order_status | NOT NULL, DEFAULT 'pending' |
| stripe_session_id | text | UNIQUE |
| stripe_payment_intent_id | text | |
| stripe_customer_id | text | |
| shipping_name | text | |
| shipping_address | text | |
| shipping_city | text | |
| shipping_postcode | text | |
| shipping_country | text | DEFAULT 'GB' |
| shipping_phone | text | |
| shipping_method | text | |
| shipping_rate_id | text | |
| shipping_cost | numeric | DEFAULT 0.00 |
| tracking_number | text | |
| tracking_url | text | |
| shipping_label_url | text | |
| shipped_at | timestamptz | |
| created_at | timestamptz | NOT NULL, DEFAULT now() |

**Indexes**: `idx_orders_created_at`

### `order_items`
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| order_id | uuid | FK → orders(id) ON DELETE CASCADE |
| variant_id | uuid | FK → product_variants(id) — add after migration 0002 |
| product_id | uuid | FK → products(id) — add after migration 0002 |
| quantity | integer | NOT NULL |
| price_at_purchase | numeric | NOT NULL |
| size | text | |

**Indexes**: `idx_order_items_order_id`

**Note**: FKs on `variant_id` and `product_id` are deferred until migration 0002 renames the tables. Historical rows may reference `products_legacy(id)` — the backend engineer must decide how to display those.

### `custom_orders`
| Column | Type | Constraints |
|---|---|---|
| id | serial | PK |
| name | varchar | NOT NULL |
| email | varchar | NOT NULL |
| phone | varchar | |
| material | varchar | NOT NULL |
| address | text | NOT NULL |
| width | integer | |
| height | integer | |
| depth | integer | |
| description | text | NOT NULL |
| file_url | text | NOT NULL |
| status | varchar | DEFAULT 'pending' |
| created_at | timestamp | DEFAULT now() |

### `promo_codes`
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| code | text | NOT NULL, UNIQUE |
| type | text | NOT NULL — 'percentage' or 'fixed' |
| value | numeric | NOT NULL |
| min_order_value | numeric | |
| max_uses | integer | |
| uses | integer | NOT NULL, DEFAULT 0 |
| expires_at | timestamptz | |
| active | boolean | NOT NULL, DEFAULT true |
| created_at | timestamptz | NOT NULL, DEFAULT now() |

### `stripe_webhook_events`
| Column | Type | Constraints |
|---|---|---|
| id | text | PK (Stripe event ID, e.g. `evt_...`) |
| type | text | NOT NULL |
| payload | jsonb | NOT NULL |
| received_at | timestamptz | NOT NULL, DEFAULT now() |

**Purpose**: Idempotency table. The Stripe webhook handler inserts `event.id` before processing; duplicate deliveries are rejected via the PK constraint.

---

## Enums

| Name | Values |
|---|---|
| order_status | pending, processing, shipped, delivered, cancelled |

---

## Relationships

```
categories ──< category_attributes
categories ──< products
products ──< product_variants
orders ──< order_items
order_items >── product_variants  (after migration 0002)
order_items >── products          (after migration 0002)
carts ──< cart_items
cart_items >── product_variants
users ──< orders
users ──< carts
categories ──< categories (self-referential: parent_id)
```
