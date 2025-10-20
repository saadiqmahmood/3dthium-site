# 🚀 Push Variant Schema to Supabase Using Drizzle

**Date:** October 20, 2025

## ✅ Updated Drizzle Schema

The `drizzle/schema.ts` file has been updated with the complete variant schema:
- ✅ size, color, material fields
- ✅ sku, stockQuantity, isAvailable fields
- ✅ Matches our SQL design

---

## 📋 Steps to Push to Supabase

### **Option 1: Using Drizzle Push (Recommended)**

This will push the schema directly to your Supabase database.

#### **Step 1: Get Your Supabase Connection String**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **Database**
4. Copy the **Connection string** (URI format)
5. Replace `[YOUR-PASSWORD]` with your actual database password

It should look like:
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

#### **Step 2: Temporarily Update .env.local**

**IMPORTANT:** Make a backup of your current `DATABASE_URL` first!

```bash
# Backup current DATABASE_URL
echo "Current DATABASE_URL: $(grep DATABASE_URL .env.local)"

# Or just copy it to a text file
```

Then update `.env.local`:
```env
# Temporarily point to Supabase (don't commit this!)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
```

#### **Step 3: Push Schema to Supabase**

```bash
npm run db:push
```

This will:
- ✅ Connect to your Supabase database
- ✅ Compare your schema with the database
- ✅ Show you what changes will be made
- ✅ Ask for confirmation
- ✅ Apply the changes

**Expected Output:**
```
Pulling schema from database...
Changes:

ALTER TABLE "product_variants_new" 
  ADD COLUMN "size" VARCHAR(50),
  ADD COLUMN "color" VARCHAR(50),
  ADD COLUMN "material" VARCHAR(50),
  ADD COLUMN "sku" VARCHAR(100) UNIQUE,
  ADD COLUMN "stock_quantity" INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN "is_available" BOOLEAN DEFAULT true NOT NULL,
  DROP COLUMN "name",
  DROP COLUMN "in_stock",
  DROP COLUMN "customizable";

Do you want to execute these statements? [y/n]
```

Type `y` and press Enter.

#### **Step 4: Restore Local DATABASE_URL**

**IMPORTANT:** Change it back to local immediately!

```env
# Restore to local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/3dthium_dev"
```

---

### **Option 2: Manual SQL (Alternative)**

If you prefer not to change `DATABASE_URL`, you can run the SQL manually:

1. Go to Supabase Dashboard → **SQL Editor**
2. Run this SQL:

```sql
-- Update product_variants_new table
ALTER TABLE product_variants_new 
  ADD COLUMN IF NOT EXISTS size VARCHAR(50),
  ADD COLUMN IF NOT EXISTS color VARCHAR(50),
  ADD COLUMN IF NOT EXISTS material VARCHAR(50),
  ADD COLUMN IF NOT EXISTS sku VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true NOT NULL;

-- Remove old columns if they exist
ALTER TABLE product_variants_new 
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS in_stock,
  DROP COLUMN IF EXISTS customizable;

-- Add unique constraint on size+color+material
ALTER TABLE product_variants_new
  ADD CONSTRAINT IF NOT EXISTS unique_variant_combination 
  UNIQUE(product_id, size, color, material);

-- Add check constraint (at least one attribute)
ALTER TABLE product_variants_new
  ADD CONSTRAINT IF NOT EXISTS at_least_one_attribute 
  CHECK (size IS NOT NULL OR color IS NOT NULL OR material IS NOT NULL);

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_variants_size ON product_variants_new(size) WHERE size IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_variants_color ON product_variants_new(color) WHERE color IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_variants_material ON product_variants_new(material) WHERE material IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants_new(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_variants_availability ON product_variants_new(is_available) WHERE is_available = true;

-- Add comments
COMMENT ON COLUMN product_variants_new.size IS 'Physical size (e.g., "150mm", "180mm")';
COMMENT ON COLUMN product_variants_new.color IS 'Color name (e.g., "White", "Black")';
COMMENT ON COLUMN product_variants_new.material IS 'Material type (e.g., "PLA", "PETG", "Resin")';
COMMENT ON COLUMN product_variants_new.sku IS 'Stock Keeping Unit. Auto-generated if not provided.';
COMMENT ON COLUMN product_variants_new.stock_quantity IS '0 = print-on-demand, >0 = pre-made inventory';
COMMENT ON COLUMN product_variants_new.is_available IS 'Whether variant can be purchased';
```

---

### **Option 3: Fresh SQL File (If Table Doesn't Exist Yet)**

If `product_variants_new` doesn't exist in Supabase yet, run the complete SQL:

```bash
# Copy the entire file
database/product_variants_new.sql
```

Paste it into Supabase SQL Editor and run.

---

## 🧪 Verify Schema Applied

After pushing, verify in Supabase SQL Editor:

```sql
-- Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'product_variants_new'
ORDER BY ordinal_position;

-- Expected columns:
-- id, product_id, size, color, material, price_adjustment, 
-- sku, image_url, stock_quantity, is_available, created_at, updated_at
```

---

## ✅ Success Criteria

Schema is successfully applied if:
- [ ] `product_variants_new` table exists
- [ ] Has columns: size, color, material, sku, stock_quantity, is_available
- [ ] Unique constraint on size+color+material works
- [ ] RLS policies exist (check with `SELECT * FROM pg_policies WHERE tablename = 'product_variants_new'`)
- [ ] Can create a test variant via admin UI

---

## 🎯 After Schema Applied

Once the schema is in Supabase:

1. ✅ Test variant creation in admin
2. ✅ Test variant editing
3. ✅ Test variant deletion
4. ✅ Verify price calculations
5. ✅ Move to Phase 2!

---

## 🚨 Troubleshooting

### **Error: "relation product_variants_new already exists"**
The table already exists. Use **Option 2** (ALTER statements) instead.

### **Error: "permission denied"**
Your database user doesn't have permissions. Use Supabase Dashboard SQL Editor instead (runs as superuser).

### **Error: "constraint already exists"**
The constraint is already there. Skip that statement or use `IF NOT EXISTS`.

### **Database URL format error**
Make sure you're using the **pooler** connection string, not the direct connection string:
```
✅ pooler.supabase.com:6543
❌ aws-0-us-west-1.pooler.supabase.com:5432
```

---

## 💡 Pro Tip

After pushing to Supabase, also push to your local database:

```bash
# Make sure DATABASE_URL points to local
echo $DATABASE_URL

# Should be: postgresql://postgres:postgres@localhost:5432/3dthium_dev

# Push to local
npm run db:push
```

Now local and Supabase are in sync! 🎉

---

## 📝 Summary

**Drizzle Method:**
1. Update `DATABASE_URL` to Supabase
2. Run `npm run db:push`
3. Restore `DATABASE_URL` to local
4. Test in admin

**Manual Method:**
1. Copy SQL from Option 2
2. Paste in Supabase SQL Editor
3. Run
4. Test in admin

**Choose whichever you're more comfortable with!**

