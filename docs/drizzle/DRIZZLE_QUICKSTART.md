# 🚀 Drizzle Setup - Quick Start Guide

## ✅ What's Been Set Up

You now have a complete Drizzle ORM setup with:
- ✅ Drizzle ORM & Kit installed
- ✅ Schema file matching your database structure
- ✅ Docker Compose for local PostgreSQL
- ✅ Database client (`lib/db.ts`)
- ✅ Migration scripts
- ✅ Seed scripts
- ✅ npm scripts ready to use

---

## 🎯 The Hybrid Approach

Your setup uses:
- **Database:** Local PostgreSQL (via Docker) for development, Supabase for production
- **Storage:** Supabase Cloud (always) for image uploads
- **Auth:** Supabase Cloud (always) for authentication

This gives you fast local development while keeping storage/auth simple!

---

## 📦 Quick Start (3 Steps)

### Step 1: Start Local Database

```bash
# Start PostgreSQL in Docker
docker-compose up -d

# Check it's running
docker ps
```

### Step 2: Add DATABASE_URL to .env.local

```bash
# Copy the example env file
cp env.example .env.local

# Edit .env.local and set:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/3dthium_dev"

# Keep your existing Supabase vars (for Storage & Auth):
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-key"
SUPABASE_SERVICE_ROLE_KEY="your-key"
```

### Step 3: Push Schema & Seed Data

```bash
# Push schema to local database
npm run db:push

# Add test data
npm run db:seed
```

**That's it!** 🎉

---

## 🎨 View Your Data with Drizzle Studio

```bash
# Open Drizzle Studio (like Supabase UI but local)
npm run db:studio
```

Opens at: https://local.drizzle.studio

You can now:
- ✅ View all tables
- ✅ Edit data
- ✅ Run queries
- ✅ See relationships

---

## 🛠️ Daily Development Workflow

### Option A: Local Database (Recommended)

```bash
# 1. Start database
docker-compose up -d

# 2. Start Next.js
npm run dev

# 3. (Optional) Open Drizzle Studio
npm run db:studio
```

Your app now uses:
- **Database:** Local PostgreSQL (fast!)
- **Storage:** Supabase Cloud (images work!)
- **Auth:** Supabase Cloud (login works!)

### Option B: Supabase Database

```bash
# Update .env.local to use Supabase
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Start Next.js
npm run dev
```

Your app now uses:
- **Database:** Supabase Cloud
- **Storage:** Supabase Cloud
- **Auth:** Supabase Cloud

---

## 📝 Available Commands

```bash
# Development
npm run dev              # Start Next.js
npm run db:studio       # Open Drizzle Studio

# Database Operations
npm run db:push         # Push schema changes to DB (dev)
npm run db:pull         # Pull schema from DB to code
npm run db:generate     # Generate migration files (prod)
npm run db:migrate      # Run migrations (prod)
npm run db:seed         # Add test data
npm run db:reset        # Reset DB + seed data

# Docker
docker-compose up -d    # Start PostgreSQL
docker-compose down     # Stop PostgreSQL
docker-compose down -v  # Stop + delete all data
```

---

## 🔄 Making Schema Changes

### Development (Fast)

```typescript
// 1. Edit drizzle/schema.ts
export const productsNew = pgTable('products_new', {
  // ... existing fields
  newField: text('new_field'), // Add new field
})

// 2. Push to local database
npm run db:push

// That's it! ✅
```

### Production (With Migrations)

```bash
# 1. Make changes to drizzle/schema.ts

# 2. Generate migration file
npm run db:generate

# 3. Review the migration in drizzle/migrations/

# 4. Apply to production
DATABASE_URL="[production-url]" npm run db:migrate
```

---

## 🎯 Example: Using Drizzle in Your Code

### Before (Manual Supabase Query)

```typescript
// pages/api/admin/products.ts
const { data, error } = await supabaseAdmin
  .from('products_new')
  .select('*')
  .eq('category_id', categoryId)
```

### After (Drizzle - Type Safe!)

```typescript
// pages/api/admin/products.ts
import { db } from '@/lib/db'
import { productsNew } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'

const products = await db.query.productsNew.findMany({
  where: eq(productsNew.categoryId, categoryId),
  with: {
    category: true,  // Auto-join!
    variants: true,  // Auto-join!
  },
})
// products is fully typed! ✨
```

---

## 💾 Migrating Your Current Product Upload Flow

The product upload we just built will work perfectly with Drizzle:

```typescript
// pages/api/admin/products.ts (updated)
import { db, productsNew } from '@/lib/db'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, slug, category_id, base_price, images, ... } = req.body

    // Instead of supabaseAdmin.from('products_new').insert()
    const [newProduct] = await db.insert(productsNew).values({
      name,
      slug,
      categoryId: category_id,
      basePrice: base_price,
      images,
      thumbnailUrl: images[0],
      galleryImages: images.slice(1),
      // ... other fields
    }).returning()

    res.json(newProduct)
  }
}
```

**Images still upload to Supabase Storage** (no change there!)

---

## 🗂️ Project Structure

```
3dthium/
├── drizzle/
│   ├── schema.ts              # Your database schema ✅
│   ├── migrate.ts             # Migration runner ✅
│   ├── seed.ts                # Test data seeder ✅
│   └── migrations/            # Generated migrations (git commit)
├── lib/
│   ├── db.ts                  # Drizzle client ✅
│   └── supabaseClient.ts      # Supabase client (Storage & Auth)
├── drizzle.config.ts          # Drizzle config ✅
├── docker-compose.yml         # Local PostgreSQL ✅
└── env.example                # Environment template ✅
```

---

## 🔧 Troubleshooting

### "Can't connect to database"
```bash
# Check if PostgreSQL is running
docker ps

# If not, start it
docker-compose up -d

# Check logs
docker-compose logs
```

### "Port 5432 already in use"
```bash
# Change port in docker-compose.yml
ports:
  - "5433:5432"  # Use 5433 instead

# Update DATABASE_URL in .env.local
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/3dthium_dev"
```

### "Images not uploading"
- Images use Supabase Storage (cloud) - you need internet
- Check your NEXT_PUBLIC_SUPABASE_URL and keys
- Verify Storage RLS policies in Supabase Dashboard

### "db:push fails"
```bash
# Make sure database is running
docker ps

# Try connecting manually
docker exec -it 3dthium_postgres psql -U postgres -d 3dthium_dev
```

---

## 🎉 Next Steps

1. **✅ You're all set!** Your schema is now in code
2. **Test it:** Run `npm run db:studio` to see your data
3. **Make changes:** Edit `drizzle/schema.ts` and run `npm run db:push`
4. **No more manual SQL!** Schema changes are now version controlled

---

## 📚 Learn More

- [Drizzle Documentation](https://orm.drizzle.team)
- [Drizzle with Supabase](https://orm.drizzle.team/docs/get-started-postgresql#supabase)
- [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview)

---

## 🔄 Switching Between Local & Cloud Database

Just change the `DATABASE_URL` in your `.env.local`:

```bash
# Local (fast development)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/3dthium_dev"

# Cloud (test with production data)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
```

**Storage & Auth always use Supabase Cloud** (no changes needed!)

---

**Happy coding!** 🚀

