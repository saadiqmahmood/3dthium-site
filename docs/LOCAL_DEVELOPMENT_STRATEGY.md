# Local Development Strategy with Supabase

## The Hybrid Approach (Recommended)

### What Stays in Supabase Cloud ☁️
- **Supabase Storage** (images, files)
- **Supabase Auth** (authentication)
- **Realtime** (if you use it)
- **Edge Functions** (if you use them)

### What Goes Local 💻
- **PostgreSQL Database** (schema, data)
- **Development environment**

---

## Why This Approach?

### Storage Should Stay in Supabase
1. **File hosting complexity** - You don't want to manage local file storage
2. **Public URLs** - Storage URLs work seamlessly in dev/prod
3. **No conflicts** - Same image URLs in local and production
4. **Upload testing** - Real upload flow, no mocking needed

### Database Can Be Local
1. **Fast development** - No network latency
2. **Offline work** - No internet required for DB work
3. **Safe testing** - Can't break production data
4. **Easy reset** - Drop and recreate instantly

---

## Three Development Setups

### Option 1: Hybrid (RECOMMENDED) ⭐
```
Local Dev Environment:
├── Database: Local PostgreSQL (via Drizzle)
└── Storage: Supabase Cloud (same as production)
```

**Pros:**
- Fast database queries
- Real storage upload testing
- Best of both worlds

**Cons:**
- Need local PostgreSQL
- Two connection strings

---

### Option 2: Full Supabase (Your Current Setup)
```
Dev Environment:
├── Database: Supabase Cloud
└── Storage: Supabase Cloud
```

**Pros:**
- Simple setup
- One connection string
- Works anywhere

**Cons:**
- Network latency on queries
- Can accidentally modify production
- Requires internet

---

### Option 3: Full Local (Advanced)
```
Local Dev Environment:
├── Database: Local PostgreSQL
└── Storage: Local S3-compatible (MinIO)
```

**Pros:**
- Completely offline
- True local development

**Cons:**
- Complex setup (MinIO, local S3)
- Different URLs in dev vs prod
- Storage mocking required

---

## Recommended Setup: Hybrid Approach

### Architecture

```
┌─────────────────────────────────────┐
│     Your Next.js App (Local)        │
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │   Backend    │  │   Frontend  │ │
│  │   (API)      │  │   (React)   │ │
│  └──────┬───────┘  └──────┬──────┘ │
│         │                  │        │
└─────────┼──────────────────┼────────┘
          │                  │
          │                  │
    ┌─────▼──────┐    ┌─────▼──────────┐
    │   LOCAL    │    │   SUPABASE     │
    │ PostgreSQL │    │    STORAGE     │
    │            │    │                │
    │ Tables     │    │  - Images      │
    │ Data       │    │  - Files       │
    │ Schema     │    │  - Public URLs │
    └────────────┘    └────────────────┘
```

---

## Implementation

### Environment Variables

```bash
# .env.local (Local Development)

# Local Database (Drizzle)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/3dthium_dev"

# Supabase Storage & Auth (Cloud)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

```bash
# .env.production (Production)

# Supabase Database (Cloud)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Supabase Storage & Auth (Cloud)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Code Structure

```typescript
// lib/db.ts - Database queries (use Drizzle)
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
export const db = drizzle(client)

// Usage: Database queries
import { db } from '@/lib/db'
const products = await db.query.productsNew.findMany()
```

```typescript
// lib/supabaseClient.ts - Storage & Auth (use Supabase)
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Usage: File uploads
import { supabase } from '@/lib/supabaseClient'
const { data } = await supabase.storage.from('products').upload(...)
```

### API Route Example

```typescript
// pages/api/admin/products.ts
import { db } from '@/lib/db'
import { productsNew } from '@/drizzle/schema'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Database: Use Drizzle (local or cloud)
    const newProduct = await db.insert(productsNew).values({
      name: req.body.name,
      images: req.body.images, // URLs from Supabase Storage
      // ...
    }).returning()
    
    res.json(newProduct)
  }
}
```

```typescript
// components/admin/ImageManager.tsx
import { supabase } from '@/lib/supabaseClient'

export default function ImageManager() {
  const uploadImage = async (file: File) => {
    // Storage: Always use Supabase (cloud)
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filePath, file)
    
    // Get public URL (works in dev and prod)
    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(filePath)
    
    return publicUrl // Save this to database
  }
}
```

---

## Local PostgreSQL Setup

### Option A: Docker (Easiest)

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: 3dthium_db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: 3dthium_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
# Start database
docker-compose up -d

# Stop database
docker-compose down

# Reset database (careful!)
docker-compose down -v
```

### Option B: PostgreSQL.app (Mac)

1. Download from https://postgresapp.com/
2. Install and start
3. Create database: `createdb 3dthium_dev`

### Option C: Native Install

```bash
# Mac
brew install postgresql@15
brew services start postgresql@15
createdb 3dthium_dev

# Linux
sudo apt install postgresql-15
sudo systemctl start postgresql
sudo -u postgres createdb 3dthium_dev
```

---

## Development Workflow

### Setup (One-time)

```bash
# 1. Install dependencies
pnpm install

# 2. Start local database (if using Docker)
docker-compose up -d

# 3. Push schema to local database
pnpm db:push

# 4. (Optional) Seed with test data
pnpm db:seed
```

### Daily Development

```bash
# Start everything
pnpm dev          # Next.js app
pnpm db:studio    # View/edit local data (optional)

# Your app now uses:
# - Local PostgreSQL for database queries
# - Supabase Cloud for file uploads
```

### Making Schema Changes

```bash
# 1. Edit drizzle/schema.ts
# 2. Push to local database
pnpm db:push

# 3. Test locally
# 4. When ready for production:
pnpm db:generate  # Generate migration
pnpm db:migrate   # Apply to production
```

---

## Testing File Uploads Locally

Since Storage stays in Supabase Cloud, your upload flow works identically:

```typescript
// This works the same in dev and prod!
const { data, error } = await supabase.storage
  .from('products')
  .upload('category/product/image.jpg', file)

// URLs are always from Supabase Cloud
const publicUrl = 'https://[project].supabase.co/storage/v1/object/public/...'
```

**Benefits:**
- ✅ No storage mocking needed
- ✅ Same URLs in dev and prod
- ✅ Real upload testing
- ✅ No local file management

---

## Data Synchronization

### Seed Production Data to Local

```typescript
// drizzle/seed.ts
import { db } from '@/lib/db'
import { categories, productsNew } from './schema'

async function seed() {
  // Add test categories
  await db.insert(categories).values([
    { name: 'Vases', slug: 'vases' },
    { name: 'Sculptures', slug: 'sculptures' },
  ])
  
  // Add test products
  await db.insert(productsNew).values({
    name: 'Test Vase',
    slug: 'test-vase',
    categoryId: 'uuid-from-above',
    basePrice: '29.99',
    images: ['https://[supabase-url]/storage/v1/object/public/products/test.jpg']
  })
}

seed()
```

```bash
pnpm db:seed
```

### Pull Production Schema to Local

```bash
# Get latest schema from Supabase
DATABASE_URL="[production-url]" pnpm db:pull

# Apply to local database
pnpm db:push
```

---

## Troubleshooting

### Issue: Can't connect to local PostgreSQL
```bash
# Check if running
docker ps  # or
brew services list  # or
sudo systemctl status postgresql
```

### Issue: Port 5432 already in use
```bash
# Change port in docker-compose.yml
ports:
  - "5433:5432"  # Use 5433 instead

# Update DATABASE_URL
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/3dthium_dev"
```

### Issue: Storage upload fails locally
- Storage is in cloud, so you need internet
- Check your Supabase URL and keys
- Verify RLS policies allow uploads

---

## Summary

**Recommended Setup:**
```
┌─────────────────────────────────────┐
│  Development (Your Computer)        │
│  - Next.js: localhost:3000          │
│  - Database: PostgreSQL (local)     │
│  - Storage: Supabase (cloud)        │
│  - Auth: Supabase (cloud)           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Production (Vercel + Supabase)     │
│  - Next.js: vercel.app              │
│  - Database: Supabase (cloud)       │
│  - Storage: Supabase (cloud)        │
│  - Auth: Supabase (cloud)           │
└─────────────────────────────────────┘
```

**This gives you:**
- ⚡ Fast local database queries
- ☁️ Real cloud storage for testing
- 🔒 Safe development environment
- 🚀 Easy schema changes with `db:push`

Ready to set this up? 🎯

