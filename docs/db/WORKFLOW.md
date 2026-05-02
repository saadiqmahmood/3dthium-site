# Database Workflow

## TL;DR

| Command | When to use |
|---|---|
| `npm run db:generate` | After editing `drizzle/schema.ts` — creates a new migration SQL file |
| `npm run db:migrate` | Deploy migrations to the target database |
| `npm run db:push` | Local dev only — syncs schema directly, no migration file created |
| `npm run db:pull` | Introspect an existing DB and update the local schema (use rarely) |
| `npm run db:studio` | Visual DB browser for local development |

---

## Normal development flow

### Making a schema change

1. Edit `drizzle/schema.ts` with your change.
2. Run `npm run db:generate` — Drizzle creates a new SQL migration in `drizzle/migrations/`.
3. Review the generated SQL file. Rename it if the auto-name is unhelpful:
   ```
   drizzle/migrations/0003_add_contact_messages.sql
   ```
4. Commit both `schema.ts` and the new migration file.
5. In CI / production, `npm run db:migrate` applies any unapplied migrations in order.

### Local dev shortcut

```bash
npm run db:push
```

This skips migration files and syncs `schema.ts` directly to your local DB. **Never use on staging or production.** Use when you want fast iteration and don't need a migration history for the change.

---

## Applying migrations to production

```bash
DATABASE_URL="<prod-url>" npm run db:migrate
```

Migrations are applied in numeric order and each runs once. The migration runner tracks which have been applied in the `drizzle` journal (`drizzle/migrations/meta/_journal.json`).

---

## Pending migration: 0002 rename (coordinate with backend engineer)

`drizzle/migrations/0002_rename_tables.sql` renames:
- `products_new` → `products`
- `product_variants_new` → `product_variants`
- `products` → `products_legacy`
- `product_variants` → `product_variants_legacy`

**This migration cannot be applied until the backend engineer updates all code references.** See the header comment in that file for the full checklist.

After applying 0002:
1. Update `drizzle/schema.ts` table names (see comment in `productsNew` and `productVariantsNew` definitions).
2. Run `npm run db:generate` to resync the Drizzle snapshot.
3. The generated empty migration represents the schema is now in sync — commit it.

---

## Adding FK constraints to `order_items` (after 0002)

Once `products` and `product_variants` are the canonical table names, add FKs:

```ts
// In schema.ts orderItems definition:
variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
```

Then run `db:generate` to get the migration.

---

## Drizzle vs Supabase client

| Use case | Use |
|---|---|
| Reading/writing product, order, user data | Drizzle (`db` from `lib/db.ts`) |
| Auth cookie sessions | Supabase Auth (`createServerClient`) |
| Storage file uploads | Supabase Storage (`getSupabaseAdmin().storage`) |
| Realtime subscriptions | Supabase Realtime (if needed in future) |

---

## Environment variables

`DATABASE_URL` must be set in `.env.local` for local migration commands. See `env.example` for the expected format.

For CI, `DATABASE_URL` is set as a GitHub Actions secret.

---

## File layout

```
drizzle/
  schema.ts            ← source of truth for the schema
  migrate.ts           ← migration runner (used by npm run db:migrate)
  seed.ts              ← dev seed data
  migrations/
    0000_*.sql         ← baseline: captures the full initial schema
    0001_*.sql         ← adds promo_codes, stripe_webhook_events, FK constraints, indexes
    0002_rename_tables.sql  ← renames _new tables (apply after backend code update)
    meta/
      _journal.json    ← Drizzle migration journal (do not edit manually)
      *.json           ← per-migration snapshots (do not edit manually)
```
