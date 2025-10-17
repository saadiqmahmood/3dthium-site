# 🔧 Quick Fix - Two Issues

## Issue 1: Config Error ✅ FIXED

**Error:** `Please specify 'dialect' param in config file`

**Fix:** Updated `drizzle.config.ts` to use `dialect: 'postgresql'` instead of deprecated `driver: 'pg'`

---

## Issue 2: DATABASE_URL Missing

**Error:** `DATABASE_URL is not set`

**Fix:** Add DATABASE_URL to your `.env.local` file

### Option A: Automatic Setup

```bash
# Make the script executable and run it
chmod +x setup-drizzle.sh
./setup-drizzle.sh
```

This will:
1. Add DATABASE_URL to .env.local
2. Start PostgreSQL with Docker
3. Push schema to database
4. Seed test data

### Option B: Manual Setup

1. **Check if `.env.local` exists:**
   ```bash
   ls -la .env.local
   ```

2. **If it doesn't exist, create it:**
   ```bash
   cp env.example .env.local
   ```

3. **Add DATABASE_URL to `.env.local`:**
   ```bash
   # For local development:
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/3dthium_dev"
   
   # Keep your existing Supabase variables:
   NEXT_PUBLIC_SUPABASE_URL="..."
   NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
   SUPABASE_SERVICE_ROLE_KEY="..."
   ```

4. **Start PostgreSQL:**
   ```bash
   docker-compose up -d
   ```

5. **Push schema:**
   ```bash
   npm run db:push
   ```

6. **Seed data:**
   ```bash
   npm run db:seed
   ```

---

## Now Try Again

```bash
# This should work now!
npm run db:push
npm run db:seed
npm run db:studio
```

---

## If You Don't Have Docker

### Mac: Use PostgreSQL.app
1. Download from https://postgresapp.com/
2. Install and start
3. Create database: `createdb 3dthium_dev`
4. Same DATABASE_URL as above

### Linux: Native PostgreSQL
```bash
sudo apt install postgresql-15
sudo systemctl start postgresql
sudo -u postgres createdb 3dthium_dev
```

### Windows: PostgreSQL Installer
1. Download from https://www.postgresql.org/download/windows/
2. Install with defaults
3. Create database `3dthium_dev`
4. Use DATABASE_URL: `postgresql://postgres:YOUR_PASSWORD@localhost:5432/3dthium_dev`

---

## Alternative: Use Supabase Database

If you don't want local PostgreSQL, just use your Supabase database:

```bash
# In .env.local, use your Supabase connection string:
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

Then skip Docker:
```bash
npm run db:push  # Pushes directly to Supabase
npm run db:seed  # Seeds Supabase database
```

---

## Verification

```bash
# 1. Check Docker is running
docker ps

# 2. Check .env.local has DATABASE_URL
cat .env.local | grep DATABASE_URL

# 3. Try pushing
npm run db:push

# 4. Try seeding
npm run db:seed

# 5. Open Studio
npm run db:studio
```

---

## Quick Reference

```bash
# Start database
docker-compose up -d

# Stop database
docker-compose down

# View logs
docker-compose logs

# Reset database
docker-compose down -v
docker-compose up -d
npm run db:push
npm run db:seed
```

---

## ✅ Once Fixed

You'll be able to run:
```bash
npm run db:push    # Works! ✅
npm run db:seed    # Works! ✅
npm run db:studio  # Works! ✅
```

And then you can use the complete Drizzle workflow! 🎉

