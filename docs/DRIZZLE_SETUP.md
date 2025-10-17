# Drizzle ORM Setup for 3dthium

## Why Drizzle?

Instead of manually copying SQL scripts to Supabase, you can:
1. Define your schema in TypeScript
2. Run `pnpm db:push` to sync changes
3. Use Drizzle Studio to view/edit data locally
4. Get type-safe database queries
5. Version control your schema changes

---

## Installation

```bash
# Install Drizzle
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit

# Or with npm
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

---

## Project Structure

```
3dthium/
├── drizzle/
│   ├── schema.ts           # Your schema definitions
│   ├── migrations/         # Generated migrations (git commit these)
│   └── meta/              # Drizzle metadata
├── drizzle.config.ts      # Drizzle configuration
├── lib/
│   └── db.ts              # Database client
└── package.json
```

---

## Configuration Files

### 1. `drizzle.config.ts`

```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config
```

### 2. `.env.local`

```bash
# Get this from Supabase → Project Settings → Database → Connection String
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Your existing Supabase vars
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 3. `drizzle/schema.ts`

```typescript
import { pgTable, uuid, text, numeric, boolean, timestamp, jsonb, integer } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Categories table
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  parentId: uuid('parent_id').references(() => categories.id),
  description: text('description'),
  imageUrl: text('image_url'),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Category Attributes table
export const categoryAttributes = pgTable('category_attributes', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').references(() => categories.id),
  name: text('name').notNull(),
  type: text('type').notNull().default('text'),
  unit: text('unit'),
  isRequired: boolean('is_required').default(false),
  isFilterable: boolean('is_filterable').default(true),
  options: jsonb('options').default([]),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
})

// Products (new schema)
export const productsNew = pgTable('products_new', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  categoryId: uuid('category_id').references(() => categories.id),
  basePrice: numeric('base_price').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  images: jsonb('images').default([]),
  galleryImages: jsonb('gallery_images').default([]),
  imageCrops: jsonb('image_crops').default({}),
  isActive: boolean('is_active').default(true),
  customizable: boolean('customizable').default(false),
  attributes: jsonb('attributes').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Product Variants
export const productVariantsNew = pgTable('product_variants_new', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => productsNew.id),
  name: text('name').notNull(),
  imageUrl: text('image_url'),
  priceAdjustment: numeric('price_adjustment').default(0),
  inStock: boolean('in_stock').default(true),
  customizable: boolean('customizable').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  authUserId: uuid('auth_user_id').unique(),
  email: text('email'),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

// Relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
  products: many(productsNew),
  attributes: many(categoryAttributes),
}))

export const productsNewRelations = relations(productsNew, ({ one, many }) => ({
  category: one(categories, {
    fields: [productsNew.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariantsNew),
}))
```

### 4. `lib/db.ts`

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/drizzle/schema'

const connectionString = process.env.DATABASE_URL!

// For queries
const queryClient = postgres(connectionString)
export const db = drizzle(queryClient, { schema })

// For migrations
const migrationClient = postgres(connectionString, { max: 1 })
export const migrationDb = drizzle(migrationClient, { schema })
```

### 5. `package.json` scripts

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio",
    "db:migrate": "tsx drizzle/migrate.ts",
    "db:seed": "tsx drizzle/seed.ts"
  }
}
```

---

## Usage

### 1. **Push Changes (Development)**
```bash
# Make changes to drizzle/schema.ts
# Then push directly to database (no migration files)
pnpm db:push
```

### 2. **Generate Migrations (Production)**
```bash
# Generate migration files from schema changes
pnpm db:generate

# Apply migrations
pnpm db:migrate
```

### 3. **View Data with Drizzle Studio**
```bash
# Opens a web UI at https://local.drizzle.studio
pnpm db:studio
```

### 4. **Type-Safe Queries**

```typescript
import { db } from '@/lib/db'
import { productsNew, categories } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'

// Select with relations
const products = await db.query.productsNew.findMany({
  with: {
    category: true,
    variants: true,
  },
})

// Insert
const newProduct = await db.insert(productsNew).values({
  name: 'Blue Vase',
  slug: 'blue-vase',
  categoryId: 'uuid-here',
  basePrice: '29.99',
  images: ['url1', 'url2'],
}).returning()

// Update
await db.update(productsNew)
  .set({ isActive: false })
  .where(eq(productsNew.id, productId))

// Delete
await db.delete(productsNew)
  .where(eq(productsNew.id, productId))
```

---

## Comparison: Old vs New Way

### Old Way (Your current approach)
```sql
-- database/finalize_products_schema.sql
ALTER TABLE products_new 
  ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
```
Then: Copy → Paste into Supabase → Run manually

### New Way (Drizzle)
```typescript
// drizzle/schema.ts
export const productsNew = pgTable('products_new', {
  // ... other fields
  images: jsonb('images').default([]),
})
```
Then: `pnpm db:push` → Done!

---

## Migration Strategy

### Phase 1: Set up Drizzle
1. Install dependencies
2. Create schema file from existing database
3. Configure Drizzle

### Phase 2: Introspect Existing Schema
```bash
# Generate schema from existing Supabase database
pnpm drizzle-kit introspect:pg
```
This creates TypeScript schema from your current database!

### Phase 3: Use for New Changes
- Modify `drizzle/schema.ts` for new changes
- Run `pnpm db:push` in development
- Run `pnpm db:generate` + `pnpm db:migrate` for production

---

## Benefits for Your Project

1. **No more manual SQL**
   - Change schema in TypeScript
   - Auto-sync to database

2. **Type Safety**
   ```typescript
   // This will error if field doesn't exist
   const product = await db.query.productsNew.findFirst({
     where: eq(productsNew.nonExistentField, 'value') // ❌ TypeScript error
   })
   ```

3. **Team Collaboration**
   - Schema changes in git
   - Easy code reviews
   - No missed migrations

4. **Testing**
   - Drizzle Studio for local data viewing
   - Easy to seed test data
   - Can use SQLite for unit tests

5. **Migrations**
   - Automatic migration generation
   - Version controlled
   - Easy rollbacks

---

## Next Steps

1. **Install Drizzle** (`pnpm add drizzle-orm postgres drizzle-kit`)
2. **Run introspection** to generate schema from your current DB
3. **Set up npm scripts** for db:push, db:studio, etc.
4. **Test with Drizzle Studio**
5. **Replace manual SQL with db:push**

Would you like me to set this up for your project?

