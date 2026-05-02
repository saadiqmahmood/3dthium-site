# database/

This directory is **deprecated**. All schema changes are now managed as Drizzle migrations.

See `drizzle/migrations/` for the authoritative migration history.

## Archived files

The `_archive/` subdirectory contains the original ad-hoc SQL files for historical
reference. They should **not** be applied to any database.

Key files and what replaced them:

| Archived file | Replaced by |
|---|---|
| `schema.sql` | `drizzle/migrations/0000_*.sql` (baseline) |
| `product_variants_new.sql`, `update_variants_schema.sql`, `finalize_products_schema.sql`, `update_products_schema.sql` | `drizzle/migrations/0000_*.sql` (baseline) |
| `rls_final.sql` | `docs/db/RLS.md` + `drizzle/migrations/0001_*.sql` |
| `storage_rls.sql` | `docs/db/RLS.md` (storage section) |
| `disable_storage_rls.sql`, `nuclear_storage_fix.sql`, `comprehensive_storage_fix.sql` | Obsolete — do NOT apply |
| `promo_codes.sql` | `drizzle/migrations/0001_*.sql` |
| `orders_schema.sql`, `add_shipping_to_orders.sql`, `add_guest_email_to_orders.sql`, `add_shipping_to_checkout_carts.sql` | `drizzle/migrations/0000_*.sql` (baseline) |
| `product_attributes_system.sql`, `category_attributes` setup | `drizzle/migrations/0000_*.sql` (baseline) |

## Pending migration

`drizzle/migrations/0002_rename_tables.sql` must be applied after the backend engineer
updates all code references. See that file's header comment for the checklist.
