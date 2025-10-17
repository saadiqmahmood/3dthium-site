# 🚀 Drizzle Quick Reference

## ✅ Setup Complete!

Your database is now set up with:
- ✅ 3 test categories (Vases, Sculptures, Prints)
- ✅ 2 test products
- ✅ Schema synced to local PostgreSQL

---

## 📋 Daily Commands

### Start Development
```bash
# Start database
docker-compose up -d

# Start Next.js
npm run dev

# (Optional) View database
npm run db:studio  # Opens at https://local.drizzle.studio
```

### Stop Everything
```bash
# Stop database
docker-compose down

# Stop Drizzle Studio (Ctrl+C in terminal)
```

---

## 🔧 Database Commands

### Schema Changes
```bash
# Push schema changes to database (development)
npm run db:push

# Generate migration files (production)
npm run db:generate

# Run migrations (production)
DATABASE_URL="[prod-url]" npm run db:migrate
```

### Data Management
```bash
# Add test data
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/3dthium_dev" npm run db:seed

# Or create an alias:
alias db:seed-local='DATABASE_URL="postgresql://postgres:postgres@localhost:5432/3dthium_dev" npm run db:seed'
db:seed-local

# Reset database
docker-compose down -v
docker-compose up -d
npm run db:push
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/3dthium_dev" npm run db:seed
```

---

## 🎯 Workflow

### Making Schema Changes

1. **Edit** `drizzle/schema.ts`:
   ```typescript
   export const productsNew = pgTable('products_new', {
     // ... existing fields
     newField: text('new_field'), // Add new field
   })
   ```

2. **Push to database**:
   ```bash
   npm run db:push
   ```

3. **Verify** in Drizzle Studio:
   ```bash
   npm run db:studio
   ```

---

## 🔄 Switching Databases

### Local Development (Fast)
```bash
# In .env.local:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/3dthium_dev"

npm run dev
```

### Production (Supabase)
```bash
# In .env.local:
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

npm run dev
```

**Note:** Storage & Auth always use Supabase (no changes needed!)

---

## 💡 Tips & Tricks

### 1. **Create Shell Aliases** (Add to ~/.zshrc or ~/.bashrc)

```bash
# Add these to your shell config:
alias dc='docker-compose'
alias dcu='docker-compose up -d'
alias dcd='docker-compose down'
alias dcr='docker-compose down -v && docker-compose up -d'

alias db:push='npm run db:push'
alias db:studio='npm run db:studio'
alias db:seed-local='DATABASE_URL="postgresql://postgres:postgres@localhost:5432/3dthium_dev" npm run db:seed'
```

Then just use:
```bash
dcu              # Start database
db:push          # Push schema
db:seed-local    # Seed data
db:studio        # Open studio
```

### 2. **Check Database Status**

```bash
# Is PostgreSQL running?
docker ps

# View logs
docker-compose logs

# Connect directly to PostgreSQL
docker exec -it 3dthium_postgres psql -U postgres -d 3dthium_dev
```

### 3. **Reset Database**

```bash
# Complete reset
docker-compose down -v  # Delete all data
docker-compose up -d    # Restart
npm run db:push         # Recreate schema
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/3dthium_dev" npm run db:seed  # Add test data
```

---

## 🎨 Using Drizzle Studio

**Start**: `npm run db:studio`
**URL**: https://local.drizzle.studio

**Features**:
- 📊 View all tables
- ✏️ Edit data inline
- ➕ Add new rows
- 🗑️ Delete rows
- 🔍 Filter & search
- 📈 See relationships
- 🔗 Navigate foreign keys

---

## 📝 Common Issues & Solutions

### "Can't connect to database"
```bash
# Check if running
docker ps

# If not running
docker-compose up -d
```

### "Port 5432 already in use"
```bash
# Use different port in docker-compose.yml
ports:
  - "5433:5432"

# Update DATABASE_URL
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/3dthium_dev"
```

### "DATABASE_URL not found"
For npm scripts that don't load .env.local automatically, prefix with:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/3dthium_dev" npm run [command]
```

---

## 🎉 Success!

You now have:
- ✅ Local PostgreSQL running
- ✅ Schema synced
- ✅ Test data loaded
- ✅ Drizzle Studio available
- ✅ Type-safe database queries ready

**Next**: Start using Drizzle in your API routes! 🚀

