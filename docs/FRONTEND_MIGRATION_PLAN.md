# 🎯 Frontend Migration & Variant System Implementation Plan

**Created:** October 20, 2025
**Status:** In Progress
**Branch:** `feature/frontend-migration`

---

## 📊 Executive Summary

### **Business Model:**
- **Fixed Products:** Catalog items with pre-defined variants (size, color, material)
- **Custom Orders:** Bespoke requests via custom order form
- **Print-on-Demand:** No stock management, items printed when ordered

### **Current State:**
- ✅ Admin product management (`products_new` table)
- ✅ Category management with dynamic attributes
- ✅ Image upload system
- ❌ Frontend still uses old `products` table
- ❌ No variant system for `products_new`
- ❌ Cart uses old schema

### **Goal:**
Complete migration to `products_new` schema with full variant support.

**Timeline:** 10 working days (2 weeks)
**Approach:** Build properly, no shortcuts

---

## 🌳 Git Workflow

### **Branch Structure:**
```
main (production)
  ↓
feature/frontend-migration (parent feature branch)
  ↓
  ├── feature/product-variants (Phase 1) ← START HERE
  ├── feature/product-display (Phase 2)
  ├── feature/cart-migration (Phase 3)
  ├── feature/homepage-update (Phase 4)
  └── feature/orders-update (Phase 5)
```

### **Merge Strategy:**
```bash
# After each phase completes:
git checkout feature/frontend-migration
git merge feature/[phase-branch] --no-ff
git branch -d feature/[phase-branch]

# Create next phase branch:
git checkout -b feature/[next-phase]

# Final merge to main after all testing:
git checkout main
git merge feature/frontend-migration --no-ff
git push origin main
```

### **Commit Convention:**
```
feat: Add variant management UI
fix: Correct variant price calculation
refactor: Update cart to use new schema
docs: Update variant system documentation
test: Add variant creation tests
```

---

## 📋 Phase 1: Product Variants System

**Branch:** `feature/product-variants`
**Time:** 2-3 days
**Priority:** CRITICAL

### **What Is a Variant?**

A variant is a specific version of a product with different attributes:
- **Size:** 150mm, 180mm, 210mm, 240mm
- **Color:** White, Black, Red, Blue, etc.
- **Material:** PLA, PETG, Resin

**Example:**
```
Base Product: "Geometric Vase" (£20 base_price)
Variants:
  - 150mm, White, PLA → £20 + £0 = £20
  - 180mm, Black, PLA → £20 + £3 = £23
  - 210mm, Red, PETG → £20 + £8 = £28
  - 240mm, Blue, Resin → £20 + £15 = £35
```

### **Database Schema**

**File:** `database/product_variants_new.sql`

```sql
-- Product Variants for products_new
CREATE TABLE IF NOT EXISTS product_variants_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products_new(id) ON DELETE CASCADE,
  
  -- Variant attributes
  size VARCHAR(50),           -- "150mm", "180mm", "210mm", "240mm"
  color VARCHAR(50),          -- "White", "Black", "Red", "Blue"
  material VARCHAR(50),       -- "PLA", "PETG", "Resin"
  
  -- Pricing (base_price + price_adjustment = final price)
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  
  -- Optional fields
  sku VARCHAR(100) UNIQUE,    -- e.g., "GEO-VASE-150-WHT-PLA"
  image_url TEXT,             -- Variant-specific image (optional)
  stock_quantity INTEGER DEFAULT 0,  -- 0 = print-on-demand
  is_available BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique combinations
  UNIQUE(product_id, size, color, material)
);

-- Indexes for performance
CREATE INDEX idx_variants_product ON product_variants_new(product_id);
CREATE INDEX idx_variants_sku ON product_variants_new(sku);
CREATE INDEX idx_variants_availability ON product_variants_new(is_available);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_variant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_variant_updated_at
BEFORE UPDATE ON product_variants_new
FOR EACH ROW
EXECUTE FUNCTION update_variant_updated_at();

-- RLS Policies
ALTER TABLE product_variants_new ENABLE ROW LEVEL SECURITY;

-- Public can read available variants
CREATE POLICY "Public can view available variants"
  ON product_variants_new FOR SELECT
  USING (is_available = true);

-- Authenticated users can view all variants
CREATE POLICY "Authenticated users can view all variants"
  ON product_variants_new FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify variants
CREATE POLICY "Admins can insert variants"
  ON product_variants_new FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update variants"
  ON product_variants_new FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete variants"
  ON product_variants_new FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Comments for documentation
COMMENT ON TABLE product_variants_new IS 'Product variants for products_new table with size, color, and material options';
COMMENT ON COLUMN product_variants_new.price_adjustment IS 'Amount to add/subtract from base_price (e.g., +5 for larger size, -3 for smaller)';
COMMENT ON COLUMN product_variants_new.stock_quantity IS '0 = print-on-demand (no stock tracking), >0 = pre-made inventory';
```

### **TypeScript Types**

**File:** `types/index.ts` (ADD to existing)

```typescript
// Product Variant type
export interface ProductVariantNew {
  id: string
  product_id: string
  
  // Variant attributes
  size?: string          // "150mm", "180mm", etc.
  color?: string         // "White", "Black", etc.
  material?: string      // "PLA", "PETG", "Resin"
  
  // Pricing
  price_adjustment: number  // +/- from base_price
  
  // Optional
  sku?: string
  image_url?: string
  stock_quantity: number
  is_available: boolean
  
  // Timestamps
  created_at: string
  updated_at: string
}

// For displaying in UI
export interface VariantOption {
  attribute: 'size' | 'color' | 'material'
  value: string
  priceAdjustment: number
}

// Matrix view data structure
export interface VariantMatrixCell {
  size: string
  color: string
  material: string
  variantId?: string
  price?: number
  exists: boolean
}
```

### **API Endpoints**

#### **1. GET /api/admin/product-variants/[productId].ts**

Fetch all variants for a product.

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { productId } = req.query

  if (req.method === 'GET') {
    // Fetch all variants for product
    const { data, error } = await supabaseAdmin
      .from('product_variants_new')
      .select('*')
      .eq('product_id', productId)
      .order('size', { ascending: true })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    // Create new variant
    const variantData = req.body

    // Validate required fields
    if (!variantData.size && !variantData.color && !variantData.material) {
      return res.status(400).json({ 
        error: 'At least one attribute (size, color, or material) is required' 
      })
    }

    // Auto-generate SKU if not provided
    if (!variantData.sku) {
      const { data: product } = await supabaseAdmin
        .from('products_new')
        .select('slug')
        .eq('id', productId)
        .single()

      if (product) {
        const skuParts = [
          product.slug.toUpperCase(),
          variantData.size,
          variantData.color?.substring(0, 3).toUpperCase(),
          variantData.material?.substring(0, 3).toUpperCase(),
        ].filter(Boolean)
        
        variantData.sku = skuParts.join('-')
      }
    }

    const { data, error } = await supabaseAdmin
      .from('product_variants_new')
      .insert([{ product_id: productId, ...variantData }])
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(201).json(data)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
```

#### **2. PUT/DELETE /api/admin/product-variants/[productId]/[variantId].ts**

Update or delete a specific variant.

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { productId, variantId } = req.query

  if (req.method === 'PUT') {
    // Update variant
    const updates = req.body

    const { data, error } = await supabaseAdmin
      .from('product_variants_new')
      .update(updates)
      .eq('id', variantId)
      .eq('product_id', productId)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    // Delete variant
    const { error } = await supabaseAdmin
      .from('product_variants_new')
      .delete()
      .eq('id', variantId)
      .eq('product_id', productId)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ message: 'Variant deleted successfully' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
```

### **Admin UI Component**

**File:** `components/admin/VariantManager.tsx`

Features:
- List all variants for a product
- Add new variant (form with size, color, material, price adjustment)
- Edit existing variant
- Delete variant
- Matrix view (Size x Color grid)
- Bulk create (generate all combinations)

**Key Features:**
```typescript
// Variant form
<form onSubmit={handleCreateVariant}>
  <select name="size">
    <option value="150mm">150mm</option>
    <option value="180mm">180mm</option>
    <option value="210mm">210mm</option>
    <option value="240mm">240mm</option>
  </select>
  
  <input 
    type="text" 
    name="color" 
    placeholder="Color (e.g., White, Black)" 
  />
  
  <select name="material">
    <option value="PLA">PLA</option>
    <option value="PETG">PETG</option>
    <option value="Resin">Resin</option>
  </select>
  
  <input 
    type="number" 
    name="price_adjustment" 
    placeholder="Price adjustment (£)" 
    step="0.01"
  />
  
  <button type="submit">Add Variant</button>
</form>

// Variant list
<table>
  <thead>
    <tr>
      <th>Size</th>
      <th>Color</th>
      <th>Material</th>
      <th>Price Adjustment</th>
      <th>Final Price</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {variants.map(variant => (
      <tr key={variant.id}>
        <td>{variant.size}</td>
        <td>{variant.color}</td>
        <td>{variant.material}</td>
        <td>£{variant.price_adjustment}</td>
        <td>£{basePrice + variant.price_adjustment}</td>
        <td>
          <button onClick={() => editVariant(variant)}>Edit</button>
          <button onClick={() => deleteVariant(variant.id)}>Delete</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### **Integration into Product Wizard**

**File:** `pages/admin/products/[id].tsx` or `create-product.tsx`

Add a new step to the wizard:

```typescript
const steps = [
  'Basic Info',
  'Category & Attributes',
  'Images',
  'Variants',  // ← NEW STEP
  'Review'
]

// Step 4: Variants
{currentStep === 3 && (
  <div>
    <h2>Product Variants</h2>
    <p>Add size, color, and material options for this product.</p>
    
    <VariantManager 
      productId={productId}
      basePrice={formData.base_price}
    />
  </div>
)}
```

### **Testing Checklist**

- [ ] Create product with single variant
- [ ] Create product with multiple variants
- [ ] Edit variant (change size, color, price)
- [ ] Delete variant
- [ ] Test unique constraint (can't create duplicate size/color/material combo)
- [ ] Verify SKU auto-generation
- [ ] Test price adjustment calculation
- [ ] Check RLS policies (only admins can edit)
- [ ] Verify variants deleted when product deleted (CASCADE)

---

## 📋 Phase 2: Frontend Product Display

**Branch:** `feature/product-display`
**Time:** 2-3 days
**Priority:** HIGH

### **Public API Endpoints**

#### **1. GET /api/products.ts**

Fetch all products for listing page.

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { category, search, sort, limit = 20, offset = 0 } = req.query

  let query = supabase
    .from('products_new')
    .select(`
      *,
      categories:category_id (
        id,
        name,
        slug
      )
    `)
    .eq('is_active', true)

  // Filter by category
  if (category) {
    query = query.eq('category_id', category)
  }

  // Search by name or description
  if (search && typeof search === 'string') {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  // Sorting
  if (sort === 'price_asc') {
    query = query.order('base_price', { ascending: true })
  } else if (sort === 'price_desc') {
    query = query.order('base_price', { ascending: false })
  } else if (sort === 'name') {
    query = query.order('name', { ascending: true })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  // Pagination
  query = query.range(
    parseInt(offset as string), 
    parseInt(offset as string) + parseInt(limit as string) - 1
  )

  const { data, error, count } = await query

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ 
    products: data, 
    total: count 
  })
}
```

#### **2. GET /api/products/[slug].ts**

Fetch single product with variants.

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { slug } = req.query

  // Fetch product
  const { data: product, error: productError } = await supabase
    .from('products_new')
    .select(`
      *,
      categories:category_id (
        id,
        name,
        slug,
        description
      )
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (productError || !product) {
    return res.status(404).json({ error: 'Product not found' })
  }

  // Fetch variants
  const { data: variants, error: variantsError } = await supabase
    .from('product_variants_new')
    .select('*')
    .eq('product_id', product.id)
    .eq('is_available', true)
    .order('size', { ascending: true })

  if (variantsError) {
    return res.status(500).json({ error: variantsError.message })
  }

  return res.status(200).json({
    product,
    variants: variants || []
  })
}
```

### **Frontend Components**

#### **1. Update ProductCard.tsx**

```typescript
import Image from 'next/image'
import Link from 'next/link'

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    thumbnail_url: string
    base_price: number
    customizable: boolean
    categories?: {
      name: string
    }
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.slug}`}>
      <div className="border rounded-lg overflow-hidden hover:shadow-lg transition">
        <Image
          src={product.thumbnail_url}
          alt={product.name}
          width={400}
          height={400}
          className="w-full h-64 object-cover"
        />
        <div className="p-4">
          <h3 className="text-lg font-semibold">{product.name}</h3>
          <p className="text-sm text-gray-500">
            {product.categories?.name}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xl font-bold">
              £{product.base_price.toFixed(2)}
              <span className="text-sm text-gray-500 font-normal"> onwards</span>
            </p>
            {product.customizable && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Customizable
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
```

#### **2. Update pages/products/index.tsx**

```typescript
import { useState, useEffect } from 'react'
import ProductCard from '@/components/ui/ProductCard'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    fetchProducts()
  }, [search, category, sort])

  const fetchProducts = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    
    if (search) params.append('search', search)
    if (category) params.append('category', category)
    if (sort) params.append('sort', sort)

    const response = await fetch(`/api/products?${params}`)
    const data = await response.json()
    
    setProducts(data.products || [])
    setLoading(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Explore Our Products</h1>
      
      {/* Filters */}
      <div className="flex gap-4 mb-8">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-4 py-2"
        />
        
        <select 
          value={sort} 
          onChange={(e) => setSort(e.target.value)}
          className="border rounded px-4 py-2"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name">Name</option>
        </select>
      </div>

      {/* Product Grid */}
      {loading ? (
        <p>Loading products...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
```

#### **3. Update pages/products/[slug].tsx**

This is the complex one - needs variant selector.

```typescript
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { useCart } from '@/context/CartContext'
import Toast from '@/components/ui/Toast'

export default function ProductDetailPage() {
  const router = useRouter()
  const { slug } = router.query
  const { addToCart } = useCart()

  const [product, setProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Selected variant options
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (slug) {
      fetchProduct()
    }
  }, [slug])

  // Find variant based on selected options
  useEffect(() => {
    if (selectedSize || selectedColor || selectedMaterial) {
      const variant = variants.find(v => 
        (!selectedSize || v.size === selectedSize) &&
        (!selectedColor || v.color === selectedColor) &&
        (!selectedMaterial || v.material === selectedMaterial)
      )
      setSelectedVariant(variant || null)
    }
  }, [selectedSize, selectedColor, selectedMaterial, variants])

  const fetchProduct = async () => {
    setLoading(true)
    const response = await fetch(`/api/products/${slug}`)
    const data = await response.json()
    
    setProduct(data.product)
    setVariants(data.variants || [])
    setLoading(false)
  }

  const calculatePrice = () => {
    if (!product) return 0
    
    const basePrice = product.base_price
    const adjustment = selectedVariant?.price_adjustment || 0
    
    return basePrice + adjustment
  }

  const handleAddToCart = () => {
    if (!selectedVariant) {
      setToast({ 
        message: 'Please select size, color, and material', 
        type: 'error' 
      })
      return
    }

    addToCart({
      product,
      variant: selectedVariant,
      quantity: 1
    })

    setToast({ 
      message: 'Added to cart!', 
      type: 'success' 
    })
  }

  if (loading) return <p>Loading...</p>
  if (!product) return <p>Product not found</p>

  // Get unique values for selectors
  const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))]
  const colors = [...new Set(variants.map(v => v.color).filter(Boolean))]
  const materials = [...new Set(variants.map(v => v.material).filter(Boolean))]

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <div>
          <Image
            src={selectedVariant?.image_url || product.thumbnail_url}
            alt={product.name}
            width={600}
            height={600}
            className="w-full rounded-lg"
          />
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-gray-500 mb-4">{product.categories?.name}</p>
          <p className="text-gray-700 mb-6">{product.description}</p>

          {/* Size Selector */}
          {sizes.length > 0 && (
            <div className="mb-4">
              <label className="block font-medium mb-2">Size</label>
              <div className="flex gap-2">
                {sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border rounded ${
                      selectedSize === size 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selector */}
          {colors.length > 0 && (
            <div className="mb-4">
              <label className="block font-medium mb-2">Color</label>
              <div className="flex gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 border rounded ${
                      selectedColor === color 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Material Selector */}
          {materials.length > 0 && (
            <div className="mb-6">
              <label className="block font-medium mb-2">Material</label>
              <div className="flex gap-2">
                {materials.map(material => (
                  <button
                    key={material}
                    onClick={() => setSelectedMaterial(material)}
                    className={`px-4 py-2 border rounded ${
                      selectedMaterial === material 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white'
                    }`}
                  >
                    {material}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price */}
          <p className="text-2xl font-bold mb-6">
            £{calculatePrice().toFixed(2)}
          </p>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            Add to Cart
          </button>

          {/* Category Attributes */}
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h3 className="font-medium mb-3">Specifications</h3>
              <dl className="space-y-2">
                {Object.entries(product.attributes).map(([key, value]) => (
                  <div key={key} className="flex">
                    <dt className="font-medium w-1/3">{key}:</dt>
                    <dd className="text-gray-700">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  )
}
```

### **Testing Checklist**

- [ ] Product listing page loads with products_new
- [ ] Search functionality works
- [ ] Category filtering works
- [ ] Sorting works (price, name, newest)
- [ ] Product detail page loads
- [ ] Variant selector displays all options
- [ ] Price updates when variant selected
- [ ] Can't add to cart without selecting all required options
- [ ] Image changes when variant selected (if variant has image)
- [ ] Category attributes display correctly

---

## 📋 Phase 3: Shopping Cart Migration

**Branch:** `feature/cart-migration`
**Time:** 2 days
**Priority:** HIGH

### **Update Cart Context**

**File:** `context/CartContext.tsx`

```typescript
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

export type CartItem = {
  product: {
    id: string
    name: string
    slug: string
    thumbnail_url: string
    base_price: number
  }
  variant: {
    id: string
    size?: string
    color?: string
    material?: string
    price_adjustment: number
    image_url?: string
  }
  quantity: number
  finalPrice: number  // Calculated: base_price + price_adjustment
}

type CartContextType = {
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, 'finalPrice'>) => void
  removeFromCart: (productId: string, variantId: string) => void
  updateQuantity: (productId: string, variantId: string, quantity: number) => void
  clearCart: () => void
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([])

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('cart')
    if (stored) {
      try {
        setCart(JSON.parse(stored))
      } catch (err) {
        console.error('Failed to parse cart:', err)
      }
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (item: Omit<CartItem, 'finalPrice'>) => {
    const finalPrice = item.product.base_price + item.variant.price_adjustment

    setCart(prev => {
      const existing = prev.find(
        i => i.product.id === item.product.id && i.variant.id === item.variant.id
      )

      if (existing) {
        return prev.map(i =>
          i.product.id === item.product.id && i.variant.id === item.variant.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      }

      return [...prev, { ...item, finalPrice }]
    })
  }

  const removeFromCart = (productId: string, variantId: string) => {
    setCart(prev =>
      prev.filter(
        item => !(item.product.id === productId && item.variant.id === variantId)
      )
    )
  }

  const updateQuantity = (productId: string, variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId)
      return
    }

    setCart(prev =>
      prev.map(item =>
        item.product.id === productId && item.variant.id === variantId
          ? { ...item, quantity }
          : item
      )
    )
  }

  const clearCart = () => setCart([])

  const total = cart.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0)
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
```

### **Update Cart Page**

**File:** `pages/cart.tsx`

```typescript
import { useCart } from '@/context/CartContext'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, total, itemCount } = useCart()
  const router = useRouter()

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <Link href="/products">
          <button className="bg-blue-600 text-white px-6 py-2 rounded">
            Continue Shopping
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          {cart.map(item => (
            <div 
              key={`${item.product.id}-${item.variant.id}`}
              className="flex gap-4 border-b py-4"
            >
              <Image
                src={item.variant.image_url || item.product.thumbnail_url}
                alt={item.product.name}
                width={100}
                height={100}
                className="rounded"
              />

              <div className="flex-1">
                <h3 className="font-semibold">{item.product.name}</h3>
                <p className="text-sm text-gray-600">
                  {[item.variant.size, item.variant.color, item.variant.material]
                    .filter(Boolean)
                    .join(' • ')}
                </p>
                <p className="text-lg font-bold mt-2">
                  £{item.finalPrice.toFixed(2)}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(
                      item.product.id,
                      item.variant.id,
                      parseInt(e.target.value)
                    )
                  }
                  className="w-20 border rounded px-2 py-1"
                />
                <button
                  onClick={() => removeFromCart(item.product.id, item.variant.id)}
                  className="text-red-600 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="border rounded-lg p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Items ({itemCount})</span>
              <span>£{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
          </div>

          <div className="border-t pt-4 mb-6">
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span>£{total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => router.push('/checkout')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  )
}
```

### **Update Checkout**

**File:** `pages/checkout.tsx`

Verify that checkout properly passes variant data to order creation.

```typescript
// In checkout, when creating order:
const lineItems = cart.map(item => ({
  product_id: item.product.id,
  variant_id: item.variant.id,
  quantity: item.quantity,
  price: item.finalPrice,
  
  // Store variant details for order history
  variant_details: {
    size: item.variant.size,
    color: item.variant.color,
    material: item.variant.material
  }
}))
```

### **Testing Checklist**

- [ ] Add product to cart from detail page
- [ ] Cart displays variant information
- [ ] Update quantity works
- [ ] Remove item works
- [ ] Cart persists in localStorage
- [ ] Cart total calculates correctly
- [ ] Proceed to checkout works
- [ ] Checkout receives variant data

---

## 📋 Phase 4: Homepage & Components Update

**Branch:** `feature/homepage-update`
**Time:** 1 day
**Priority:** MEDIUM

### **Files to Update:**

1. **pages/index.tsx** - Update sections to use new API
2. **components/sections/FeaturedProducts.tsx** - Fetch from products_new
3. **components/sections/ProductGrid.tsx** - Use new ProductCard
4. **components/sections/HeroSection.tsx** - Verify links work

### **Testing Checklist**

- [ ] Homepage loads correctly
- [ ] Featured products display
- [ ] Product grid works
- [ ] Links navigate to correct pages
- [ ] Categories display correctly

---

## 📋 Phase 5: Orders Integration

**Branch:** `feature/orders-update`
**Time:** 1 day
**Priority:** MEDIUM

### **What to Update:**

1. **Order Items Table** - Add variant_id and variant_details columns
2. **Admin Orders Page** - Display variant information
3. **Order Confirmation** - Show variant in email/page
4. **Stripe/Checkout** - Pass variant data

### **Database Update:**

```sql
-- Add variant columns to order_items
ALTER TABLE order_items 
ADD COLUMN variant_id UUID REFERENCES product_variants_new(id),
ADD COLUMN variant_details JSONB DEFAULT '{}'::jsonb;

-- Index for queries
CREATE INDEX idx_order_items_variant ON order_items(variant_id);
```

### **Testing Checklist**

- [ ] Place order with variant
- [ ] Order shows variant details in admin
- [ ] Order confirmation email shows variant
- [ ] Order history shows variant
- [ ] Printing workflow receives variant info

---

## 📋 Phase 6: Testing & Polish

**Time:** 2-3 days
**Priority:** CRITICAL

### **End-to-End Testing:**

1. **Admin Flow:**
   - [ ] Create product
   - [ ] Add variants (size, color, material)
   - [ ] Upload images
   - [ ] Set prices
   - [ ] Activate product

2. **Customer Flow:**
   - [ ] Browse products
   - [ ] Search/filter
   - [ ] View product detail
   - [ ] Select variant options
   - [ ] Add to cart
   - [ ] View cart
   - [ ] Checkout
   - [ ] Receive confirmation

3. **Order Management:**
   - [ ] View order in admin
   - [ ] See variant details
   - [ ] Print order details
   - [ ] Process order

### **Bug Fixes & Polish:**

- [ ] Fix any UI issues
- [ ] Optimize images
- [ ] Add loading states
- [ ] Error handling
- [ ] Mobile responsiveness
- [ ] Accessibility

---

## 🚀 Deployment Checklist

Before merging to main:

- [ ] All tests pass
- [ ] No console errors
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] RLS policies verified
- [ ] Performance tested
- [ ] Mobile tested
- [ ] Documentation updated

---

## 📊 Success Metrics

### **Before Migration:**
- Frontend uses old `products` table
- No variant support in new system
- Cart uses old schema
- Admin can't create variants

### **After Migration:**
- ✅ Frontend uses `products_new`
- ✅ Full variant support (size, color, material)
- ✅ Cart handles variants properly
- ✅ Admin can create/manage variants
- ✅ Orders include variant data
- ✅ Print-on-demand ready

---

## 🎯 Timeline Summary

| Phase | Time | Priority | Status |
|-------|------|----------|--------|
| Phase 1: Variants System | 2-3 days | CRITICAL | Pending |
| Phase 2: Product Display | 2-3 days | HIGH | Pending |
| Phase 3: Cart Migration | 2 days | HIGH | Pending |
| Phase 4: Homepage Update | 1 day | MEDIUM | Pending |
| Phase 5: Orders Integration | 1 day | MEDIUM | Pending |
| Phase 6: Testing & Polish | 2-3 days | CRITICAL | Pending |

**Total:** ~10-13 working days (2 weeks)

---

## 📝 Notes

- All work done in feature branches
- Regular commits with descriptive messages
- Test each phase before moving to next
- Keep main branch stable
- Document as you go

---

## 🆘 Troubleshooting

### **Issue: Variants not showing on product page**
- Check RLS policies on `product_variants_new`
- Verify product_id foreign key
- Check `is_available = true`

### **Issue: Cart not updating**
- Clear localStorage
- Check CartContext provider wraps app
- Verify variant data structure

### **Issue: Price calculation wrong**
- Check base_price on product
- Verify price_adjustment on variant
- Ensure finalPrice calculated correctly

---

**Ready to implement!** 🚀

