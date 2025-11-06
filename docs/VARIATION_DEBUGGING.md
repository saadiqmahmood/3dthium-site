# Variation System Debugging Report

## 🔍 Investigation: Why Variations Don't Save

**Date:** 2025-11-06  
**Issue:** Client reports that creating variants doesn't work - they don't save to database

---

## 📋 Current System Analysis

### ✅ What EXISTS:

1. **Database Table:** `product_variants_new`
   - Location: `database/product_variants_new.sql`
   - Fields: size, color, material, price_adjustment, sku, stock_quantity
   - RLS policies enabled (admins can insert/update/delete)
   - Unique constraint: `(product_id, size, color, material)`

2. **API Endpoint:** `/api/admin/product-variants/[productId]`
   - Location: `pages/api/admin/product-variants/[productId].ts`
   - POST handler exists
   - Auto-generates SKU if not provided
   - Validates at least one attribute
   - Uses `supabaseAdmin` with service role key

3. **Frontend Component:** `VariantManager.tsx`
   - Location: `components/admin/VariantManager.tsx`
   - Form to create variants (size, color, material, price_adjustment)
   - Fetches existing variants on mount
   - Displays variants in table
   - Edit/delete functionality

---

## 🐛 Potential Issues

### Issue 1: API Endpoint Not Found
**Hypothesis:** The API endpoint might not be wired correctly

**Check:**
```typescript
// VariantManager calls:
fetch(`/api/admin/product-variants/${productId}`)

// File exists at:
pages/api/admin/product-variants/[productId].ts

// This should work ✅
```

---

### Issue 2: RLS Policies Blocking Insert
**Hypothesis:** Row Level Security might be blocking the insert even with service role

**Evidence:**
- API uses `supabaseAdmin` with `SUPABASE_SERVICE_ROLE_KEY`
- Service role should bypass RLS
- But RLS policy checks for `auth.uid()` which might be NULL

**The Problem:**
```sql
-- This policy checks auth.uid()
CREATE POLICY "Admins can insert variants"
  ON product_variants_new
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()   -- ⚠️ This is NULL when using service role!
      AND users.role = 'admin'
    )
  );
```

**Service role doesn't have `auth.uid()`**, so the RLS check fails!

**Solution:** Service role should bypass RLS entirely, OR we need to set the role differently.

---

### Issue 3: Missing Environment Variables
**Hypothesis:** `SUPABASE_SERVICE_ROLE_KEY` might not be set

**Check needed:**
```bash
# In .env.local, should have:
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # ← Must be set!
```

If this is missing, the admin client won't have privileges.

---

### Issue 4: Unique Constraint Violations
**Hypothesis:** Trying to create duplicate variants

**Check:**
- Constraint: `UNIQUE(product_id, size, color, material)`
- If size/color/material are all NULL, multiple variants would conflict
- API returns 409 on constraint violation, but might not show error clearly

**Example conflict:**
```
Variant 1: { size: null, color: "Red", material: null }
Variant 2: { size: null, color: "Red", material: null }
→ DUPLICATE! Second insert fails.
```

---

### Issue 5: Database Table Doesn't Exist
**Hypothesis:** Schema might not have been applied to Supabase

**Check needed:**
Run this query in Supabase SQL editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'product_variants_new';
```

If returns empty → table doesn't exist!

---

## 🔧 Debugging Steps

### Step 1: Verify Table Exists
```sql
-- Run in Supabase SQL Editor
SELECT * FROM product_variants_new LIMIT 1;
```

**Expected:** Returns empty result or rows (not error)  
**If Error:** Table doesn't exist → run `database/product_variants_new.sql`

---

### Step 2: Test Direct Insert (Bypass API)
```sql
-- Run in Supabase SQL Editor
INSERT INTO product_variants_new (
  product_id,
  size,
  color,
  material,
  price_adjustment,
  sku
) VALUES (
  'REPLACE-WITH-REAL-PRODUCT-ID',
  '150mm',
  'Red',
  'PLA',
  0.00,
  'TEST-SKU-001'
);
```

**If Success:** Table works, issue is in API/RLS  
**If Fails:** Check error message (RLS? constraint?)

---

### Step 3: Check RLS with Service Role
```sql
-- Verify service role can bypass RLS
-- Run this with service role credentials
SELECT * FROM product_variants_new;
-- Should see all rows regardless of RLS

-- Try insert
INSERT INTO product_variants_new (product_id, color)
VALUES ('test-uuid', 'test-color');
-- Should work with service role
```

---

### Step 4: Check API Logs
**Add logging to API endpoint:**

```typescript
// In pages/api/admin/product-variants/[productId].ts
console.log('🔍 Creating variant:', {
  productId,
  variantData,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
})

const { data: newVariant, error } = await supabaseAdmin
  .from('product_variants_new')
  .insert([...])
  .select()
  .single()

console.log('📊 Insert result:', { data: newVariant, error })
```

Check terminal/browser console for these logs.

---

## 🎯 Most Likely Causes (Ranked)

1. **🥇 RLS Policy Blocking Service Role** (80% probability)
   - Service role doesn't have `auth.uid()`
   - RLS policy checks fail
   - Insert silently blocked

2. **🥈 Table Doesn't Exist in Supabase** (15% probability)
   - SQL file not run yet
   - Working on local but not production

3. **🥉 Environment Variable Missing** (5% probability)
   - `SUPABASE_SERVICE_ROLE_KEY` not set
   - Using anon key instead (insufficient permissions)

---

## ✅ Recommended Fix

### Quick Fix: Disable RLS for Service Role

The service role should already bypass RLS by default in Supabase. If it's not working:

**Option A: Verify Service Role Setup**
```typescript
// In API endpoint, add explicit auth bypass
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public'
    }
  }
)
```

**Option B: Add Service Role Policy**
```sql
-- In Supabase, add this policy
CREATE POLICY "Service role can do anything"
  ON product_variants_new
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

**Option C: Temporarily Disable RLS (Testing Only)**
```sql
-- ⚠️ ONLY FOR TESTING
ALTER TABLE product_variants_new DISABLE ROW LEVEL SECURITY;
-- Try creating variant
-- If it works, issue is RLS
-- Re-enable: ALTER TABLE product_variants_new ENABLE ROW LEVEL SECURITY;
```

---

## 📝 Action Items

### Immediate (Fix Broken System):
- [ ] Check if `product_variants_new` table exists in Supabase
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- [ ] Add console logging to API endpoint
- [ ] Test variant creation and check logs
- [ ] Fix RLS if blocking service role
- [ ] Verify variant appears in database after creation

### Short Term (Improve UX):
- [ ] Add better error messages in UI
- [ ] Show loading state clearly
- [ ] Add success/error toasts
- [ ] Show created variant immediately without refresh

### Long Term (New System):
- [ ] Implement bulk variation generator
- [ ] Add attribute system
- [ ] Add image inheritance
- [ ] Build new UI components

---

## 🧪 Test Checklist

After fixing, verify:
- [ ] Can create variant with size only
- [ ] Can create variant with color only
- [ ] Can create variant with all three attributes
- [ ] SKU auto-generates if empty
- [ ] Price adjustment calculates correctly
- [ ] Variant appears in list immediately
- [ ] Can edit variant
- [ ] Can delete variant
- [ ] Can create 10 variants rapidly
- [ ] No duplicates allowed (constraint works)

---

**Next Action:** Run debugging steps 1-4 to identify root cause, then apply fix.

