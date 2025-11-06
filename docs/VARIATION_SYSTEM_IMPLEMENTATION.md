# Variation System - Implementation Guide

## 🎯 Overview

This document outlines the step-by-step implementation of the new variation system that supports:
- Bulk variation generation from attribute combinations
- Attribute-based image inheritance
- Support for design variations (not just color/size)
- Efficient management of 600+ variations

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin UI Layer                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  AttributeBuilder → VariationGenerator → VariationManager   │
│       ↓                    ↓                      ↓          │
│   Define attrs         Generate combos      Edit/manage     │
│                                                              │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  /api/admin/products/[id]/attributes                        │
│  /api/admin/products/[id]/variations/generate               │
│  /api/admin/products/[id]/variations/bulk                   │
│                                                              │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  product_attributes                                          │
│  product_attribute_options                                   │
│  product_variants_new (enhanced)                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Step 1: Create New Tables

#### Table: `product_attributes`
Stores attribute definitions for each product.

```sql
CREATE TABLE product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products_new(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- e.g., "Color", "Height", "Material", "Design Pattern"
  
  type TEXT NOT NULL CHECK (type IN ('color', 'size', 'material', 'design', 'text', 'custom')),
  -- Helps UI render appropriate input (color picker, dropdown, etc.)
  
  display_order INTEGER DEFAULT 0,
  -- Order to display in UI
  
  required BOOLEAN DEFAULT TRUE,
  -- Whether this attribute must be selected
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_attributes_product_id ON product_attributes(product_id);
```

#### Table: `product_attribute_options`
Stores the possible values for each attribute.

```sql
CREATE TABLE product_attribute_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id UUID NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
  
  value TEXT NOT NULL,
  -- Machine-readable value: "red", "small", "ceramic"
  
  display_name TEXT NOT NULL,
  -- Human-readable: "Crimson Red", "6 inch", "Glazed Ceramic"
  
  hex_color TEXT,
  -- For color swatches: "#FF0000"
  
  images JSONB DEFAULT '[]'::jsonb,
  -- Images specific to this option: ["red-vase-1.jpg", "red-vase-2.jpg"]
  
  price_modifier DECIMAL(10, 2) DEFAULT 0,
  -- Price adjustment for this option: +5.00, -2.50, etc.
  
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(attribute_id, value)
);

CREATE INDEX idx_attribute_options_attribute_id ON product_attribute_options(attribute_id);
```

#### Update: `product_variants_new`
Enhance existing variant table.

```sql
ALTER TABLE product_variants_new
  ADD COLUMN IF NOT EXISTS attribute_values JSONB DEFAULT '{}'::jsonb,
  -- Stores: {"color": "red", "height": "small", "material": "ceramic"}
  
  ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT FALSE,
  -- Track if created by bulk generator vs manual
  
  ADD COLUMN IF NOT EXISTS image_sources JSONB DEFAULT '{}'::jsonb,
  -- Track image inheritance: {"primary": "design:ribbed", "gallery": ["color:red"]}
  
  ADD COLUMN IF NOT EXISTS custom_images JSONB DEFAULT '[]'::jsonb;
  -- Manual overrides for this specific variant

-- Index for filtering by attributes
CREATE INDEX idx_variants_attribute_values ON product_variants_new USING GIN (attribute_values);
```

---

## 🔧 Backend Implementation

### Step 2: Create API Endpoints

#### File: `pages/api/admin/products/[id]/attributes.ts`

```typescript
import { getSupabaseAdmin } from '@/lib/supabaseClient'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getSupabaseAdmin()
  const { id: productId } = req.query

  if (req.method === 'GET') {
    // Get all attributes and their options for a product
    const { data: attributes, error } = await supabase
      .from('product_attributes')
      .select(`
        *,
        options:product_attribute_options(*)
      `)
      .eq('product_id', productId)
      .order('display_order')

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ attributes })
  }

  if (req.method === 'POST') {
    // Create/update attributes for a product
    const { attributes } = req.body

    // Transaction-like approach
    const results = []
    
    for (const attr of attributes) {
      // Insert attribute
      const { data: newAttr, error: attrError } = await supabase
        .from('product_attributes')
        .insert({
          product_id: productId,
          name: attr.name,
          type: attr.type,
          display_order: attr.display_order || 0,
        })
        .select()
        .single()

      if (attrError) return res.status(500).json({ error: attrError.message })

      // Insert options for this attribute
      if (attr.options?.length) {
        const optionsToInsert = attr.options.map((opt, idx) => ({
          attribute_id: newAttr.id,
          value: opt.value,
          display_name: opt.displayName || opt.value,
          hex_color: opt.hexColor || null,
          images: opt.images || [],
          price_modifier: opt.priceModifier || 0,
          display_order: idx,
        }))

        const { error: optError } = await supabase
          .from('product_attribute_options')
          .insert(optionsToInsert)

        if (optError) return res.status(500).json({ error: optError.message })
      }

      results.push(newAttr)
    }

    return res.json({ attributes: results })
  }

  if (req.method === 'DELETE') {
    // Delete all attributes for a product (cascade deletes options)
    const { error } = await supabase
      .from('product_attributes')
      .delete()
      .eq('product_id', productId)

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
```

#### File: `pages/api/admin/products/[id]/variations/generate.ts`

```typescript
import { getSupabaseAdmin } from '@/lib/supabaseClient'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = getSupabaseAdmin()
  const { id: productId } = req.query
  const { attributeIds, pricingStrategy, priceModifiers, defaultStock } = req.body

  try {
    // 1. Fetch all attributes and their options
    const { data: attributes, error: attrError } = await supabase
      .from('product_attributes')
      .select(`
        *,
        options:product_attribute_options(*)
      `)
      .in('id', attributeIds)

    if (attrError) return res.status(500).json({ error: attrError.message })

    // 2. Get product base price
    const { data: product, error: prodError } = await supabase
      .from('products_new')
      .select('base_price, slug, name')
      .eq('id', productId)
      .single()

    if (prodError) return res.status(500).json({ error: prodError.message })

    // 3. Generate all combinations using cartesian product
    const combinations = generateCombinations(attributes)

    // 4. Create variation records
    const variants = combinations.map((combo, index) => {
      // Build SKU: PRODUCT-SLUG-ATTR1-ATTR2-001
      const skuParts = [
        product.slug.toUpperCase(),
        ...Object.values(combo.values).map(v => String(v).toUpperCase().slice(0, 4)),
        String(index + 1).padStart(3, '0')
      ]
      const sku = skuParts.join('-')

      // Calculate price
      let price = parseFloat(product.base_price)
      if (pricingStrategy === 'additive') {
        Object.values(combo.values).forEach(value => {
          price += priceModifiers[value] || 0
        })
      }

      // Collect images from attribute options
      const inheritedImages = collectImages(combo.options)

      return {
        product_id: productId,
        sku,
        price: price.toFixed(2),
        stock: defaultStock || 0,
        attribute_values: combo.values,
        auto_generated: true,
        images: inheritedImages.all,
        image_sources: inheritedImages.sources,
        is_active: true,
      }
    })

    // 5. Insert all variants (batch)
    const { data: created, error: insertError } = await supabase
      .from('product_variants_new')
      .insert(variants)
      .select()

    if (insertError) return res.status(500).json({ error: insertError.message })

    return res.json({
      success: true,
      created: created.length,
      variants: created,
    })

  } catch (error) {
    console.error('Variation generation error:', error)
    return res.status(500).json({ error: 'Failed to generate variations' })
  }
}

// Helper: Generate cartesian product of attributes
function generateCombinations(attributes) {
  if (!attributes.length) return []

  const result = []
  
  function recurse(index, current) {
    if (index === attributes.length) {
      result.push({ ...current })
      return
    }

    const attr = attributes[index]
    for (const option of attr.options) {
      recurse(index + 1, {
        values: { ...current.values, [attr.name.toLowerCase()]: option.value },
        options: { ...current.options, [attr.name.toLowerCase()]: option },
      })
    }
  }

  recurse(0, { values: {}, options: {} })
  return result
}

// Helper: Collect images from attribute options
function collectImages(optionsMap) {
  const allImages = []
  const sources = {}

  // Priority: design > color > other
  const priority = ['design', 'color', 'material', 'size']

  for (const attrName of priority) {
    const option = optionsMap[attrName]
    if (option?.images?.length) {
      allImages.push(...option.images)
      sources[attrName] = option.images
    }
  }

  return {
    all: allImages,
    sources,
  }
}
```

#### File: `pages/api/admin/products/[id]/variations/bulk.ts`

```typescript
import { getSupabaseAdmin } from '@/lib/supabaseClient'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = getSupabaseAdmin()
  const { id: productId } = req.query
  const { variantIds, updates } = req.body

  try {
    // Build update object
    const updateData: any = {}
    
    if (updates.price !== undefined) {
      if (typeof updates.price === 'string' && updates.price.startsWith('+')) {
        // Relative pricing - need to fetch current prices
        const { data: variants } = await supabase
          .from('product_variants_new')
          .select('id, price')
          .in('id', variantIds)

        // Update each individually with relative price
        for (const variant of variants) {
          const newPrice = parseFloat(variant.price) + parseFloat(updates.price)
          await supabase
            .from('product_variants_new')
            .update({ price: newPrice.toFixed(2) })
            .eq('id', variant.id)
        }
        
        return res.json({ success: true, updated: variants.length })
      } else {
        updateData.price = updates.price
      }
    }

    if (updates.stock !== undefined) updateData.stock = updates.stock
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active

    // Bulk update
    const { data, error } = await supabase
      .from('product_variants_new')
      .update(updateData)
      .in('id', variantIds)
      .select()

    if (error) return res.status(500).json({ error: error.message })

    return res.json({ success: true, updated: data.length, variants: data })

  } catch (error) {
    console.error('Bulk update error:', error)
    return res.status(500).json({ error: 'Failed to update variations' })
  }
}
```

---

## 🎨 Frontend Components

### Component 1: `AttributeBuilder.tsx`

```typescript
import { useState } from 'react'
import { ImageUpload } from './ImageUpload'

type AttributeOption = {
  value: string
  displayName: string
  hexColor?: string
  images?: string[]
  priceModifier?: number
}

type Attribute = {
  id?: string
  name: string
  type: 'color' | 'size' | 'material' | 'design' | 'custom'
  options: AttributeOption[]
}

export default function AttributeBuilder({ 
  productId, 
  onAttributesChange 
}: { 
  productId: string
  onAttributesChange: (attrs: Attribute[]) => void 
}) {
  const [attributes, setAttributes] = useState<Attribute[]>([])

  const addAttribute = () => {
    setAttributes([...attributes, {
      name: '',
      type: 'custom',
      options: []
    }])
  }

  const addOption = (attrIndex: number) => {
    const newAttrs = [...attributes]
    newAttrs[attrIndex].options.push({
      value: '',
      displayName: '',
      images: [],
      priceModifier: 0
    })
    setAttributes(newAttrs)
  }

  const updateOption = (attrIndex: number, optIndex: number, field: string, value: any) => {
    const newAttrs = [...attributes]
    newAttrs[attrIndex].options[optIndex][field] = value
    setAttributes(newAttrs)
    onAttributesChange(newAttrs)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Product Attributes</h3>
        <button
          type="button"
          onClick={addAttribute}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add Attribute
        </button>
      </div>

      {attributes.map((attr, attrIdx) => (
        <div key={attrIdx} className="border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Attribute Name</label>
              <input
                type="text"
                placeholder="e.g., Color, Height, Material"
                value={attr.name}
                onChange={(e) => {
                  const newAttrs = [...attributes]
                  newAttrs[attrIdx].name = e.target.value
                  setAttributes(newAttrs)
                }}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={attr.type}
                onChange={(e) => {
                  const newAttrs = [...attributes]
                  newAttrs[attrIdx].type = e.target.value as any
                  setAttributes(newAttrs)
                }}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="color">Color</option>
                <option value="size">Size</option>
                <option value="material">Material</option>
                <option value="design">Design Pattern</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Options</label>
              <button
                type="button"
                onClick={() => addOption(attrIdx)}
                className="text-sm px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                + Add Option
              </button>
            </div>

            {attr.options.map((option, optIdx) => (
              <div key={optIdx} className="grid grid-cols-12 gap-2 items-start p-2 bg-gray-50 rounded">
                <input
                  type="text"
                  placeholder="Value (red)"
                  value={option.value}
                  onChange={(e) => updateOption(attrIdx, optIdx, 'value', e.target.value)}
                  className="col-span-2 px-2 py-1 border rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="Display (Crimson Red)"
                  value={option.displayName}
                  onChange={(e) => updateOption(attrIdx, optIdx, 'displayName', e.target.value)}
                  className="col-span-3 px-2 py-1 border rounded text-sm"
                />
                {attr.type === 'color' && (
                  <input
                    type="color"
                    value={option.hexColor || '#000000'}
                    onChange={(e) => updateOption(attrIdx, optIdx, 'hexColor', e.target.value)}
                    className="col-span-1 h-8 border rounded"
                  />
                )}
                <input
                  type="number"
                  placeholder="Price +/-"
                  step="0.01"
                  value={option.priceModifier || 0}
                  onChange={(e) => updateOption(attrIdx, optIdx, 'priceModifier', parseFloat(e.target.value))}
                  className="col-span-2 px-2 py-1 border rounded text-sm"
                />
                <div className="col-span-3">
                  <ImageUpload
                    onImagesUploaded={(urls) => updateOption(attrIdx, optIdx, 'images', urls)}
                    currentImages={option.images || []}
                    maxImages={5}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newAttrs = [...attributes]
                    newAttrs[attrIdx].options.splice(optIdx, 1)
                    setAttributes(newAttrs)
                  }}
                  className="col-span-1 text-red-600 hover:text-red-800"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {attributes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No attributes defined. Click "Add Attribute" to get started.
        </div>
      )}
    </div>
  )
}
```

---

### Component 2: `VariationGenerator.tsx`

```typescript
import { useState } from 'react'

type GeneratorProps = {
  productId: string
  attributes: any[]
  onGenerate: () => void
}

export default function VariationGenerator({ productId, attributes, onGenerate }: GeneratorProps) {
  const [selectedAttrIds, setSelectedAttrIds] = useState<string[]>([])
  const [pricingStrategy, setPricingStrategy] = useState<'base' | 'additive'>('base')
  const [defaultStock, setDefaultStock] = useState(10)
  const [generating, setGenerating] = useState(false)

  // Calculate combination count
  const combinationCount = selectedAttrIds.reduce((total, attrId) => {
    const attr = attributes.find(a => a.id === attrId)
    return total * (attr?.options?.length || 1)
  }, 1)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const response = await fetch(`/api/admin/products/${productId}/variations/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attributeIds: selectedAttrIds,
          pricingStrategy,
          defaultStock,
          priceModifiers: {}, // Extract from attributes
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        alert(`Successfully created ${result.created} variations!`)
        onGenerate()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      alert('Failed to generate variations')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="border rounded-lg p-6 space-y-6">
      <h3 className="text-xl font-bold">Generate Variations</h3>

      <div>
        <label className="block text-sm font-medium mb-2">Select Attributes to Combine</label>
        <div className="space-y-2">
          {attributes.map(attr => (
            <label key={attr.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedAttrIds.includes(attr.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedAttrIds([...selectedAttrIds, attr.id])
                  } else {
                    setSelectedAttrIds(selectedAttrIds.filter(id => id !== attr.id))
                  }
                }}
                className="rounded"
              />
              <span>{attr.name} ({attr.options.length} options)</span>
            </label>
          ))}
        </div>
      </div>

      {selectedAttrIds.length > 0 && (
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-lg font-semibold text-blue-900">
            Will generate: <span className="text-2xl">{combinationCount}</span> variations
          </p>
          <p className="text-sm text-blue-700 mt-1">
            {selectedAttrIds.map(id => {
              const attr = attributes.find(a => a.id === id)
              return `${attr?.name} (${attr?.options.length})`
            }).join(' × ')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Pricing Strategy</label>
          <select
            value={pricingStrategy}
            onChange={(e) => setPricingStrategy(e.target.value as any)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="base">Base Price (all same)</option>
            <option value="additive">Additive (base + modifiers)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Default Stock</label>
          <input
            type="number"
            value={defaultStock}
            onChange={(e) => setDefaultStock(parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded"
            min="0"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={selectedAttrIds.length === 0 || generating}
        className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {generating ? 'Generating...' : `Generate ${combinationCount} Variations`}
      </button>

      {combinationCount > 100 && (
        <p className="text-sm text-orange-600">
          ⚠️ Large batch detected. This may take 10-30 seconds.
        </p>
      )}
    </div>
  )
}
```

---

## 🔍 Testing Plan

### Unit Tests

#### Test 1: Attribute Creation
```typescript
// Create 2 attributes with 3 options each
// Verify they save to database
// Verify images are associated
```

#### Test 2: Variation Generation (Small)
```typescript
// 2 colors × 2 sizes = 4 variations
// Verify all combinations created
// Verify SKUs are unique
// Verify images inherited correctly
```

#### Test 3: Variation Generation (Large)
```typescript
// 16 colors × 4 heights × 3 materials = 192 variations
// Verify performance (< 10 seconds)
// Verify no duplicates
// Verify all have correct attributes
```

#### Test 4: Image Inheritance
```typescript
// Red color has 3 images
// Ribbed design has 2 images
// Red + Ribbed variation should inherit 5 images
// Verify image_sources metadata is correct
```

#### Test 5: Bulk Update
```typescript
// Update 50 variants at once
// Change price +$5.00
// Change stock to 20
// Verify all updated correctly
```

---

## 📊 Performance Considerations

### Optimization Strategies:

1. **Batch Inserts**
   - Use Supabase batch insert (max 1000 rows at a time)
   - For 600+ variations, split into chunks

2. **Background Jobs**
   - For very large generations (500+), consider queue system
   - Show progress bar to admin

3. **Database Indexes**
   - Index on `attribute_values` for filtering
   - Index on `product_id` for lookups

4. **Caching**
   - Cache attribute definitions
   - Cache generated combinations for preview

---

## 🚦 Implementation Phases

### Phase 1: Database Setup ✅ (Day 1)
- [ ] Create migration script
- [ ] Create new tables
- [ ] Update existing tables
- [ ] Test schema locally
- [ ] Push to Supabase

### Phase 2: Backend API (Day 2-3)
- [ ] Implement attribute CRUD endpoints
- [ ] Implement variation generation logic
- [ ] Implement bulk update endpoint
- [ ] Test with Postman/Insomnia
- [ ] Handle edge cases

### Phase 3: Admin UI Components (Day 4-5)
- [ ] Build AttributeBuilder component
- [ ] Build VariationGenerator component
- [ ] Build VariationGridManager component
- [ ] Integrate into product creation page
- [ ] Add to product edit page

### Phase 4: Testing (Day 6)
- [ ] Test with 10 variations
- [ ] Test with 100 variations
- [ ] Test with 600 variations
- [ ] Test image inheritance
- [ ] Test bulk updates
- [ ] Fix bugs

### Phase 5: Client Review (Day 7)
- [ ] Deploy to staging
- [ ] Client walkthrough
- [ ] Gather feedback
- [ ] Make adjustments
- [ ] Deploy to production

---

## 🐛 Known Issues to Fix First

### Issue 1: Current Variation Creation Broken
**Symptoms:** Variations don't save when created
**Investigation needed:**
- Check API endpoint: `/api/admin/products/[id]/variants`
- Check database permissions
- Check frontend form submission
- Check error handling

**Files to check:**
- `pages/api/admin/products/[id]/variants.ts`
- `components/admin/VariantManager.tsx`
- `pages/admin/products/[id].tsx`

---

## 💡 Quick Wins

Before building the full system, fix immediate issues:

1. **Fix variation creation** (current system completely broken)
2. **Add basic SKU auto-generation**
3. **Add variation list view** (currently can't see created variations)
4. **Add delete variation** (can't remove bad variants)

Then build the full attribute-based system.

---

## 📚 Related Documentation

- See `VARIATION_SYSTEM_REQUIREMENTS.md` for detailed requirements
- See eBay variation docs for reference: [eBay Variations](https://www.ebay.com/help/listings/listing-tips/adding-variations-listing?id=4149)
- See Shopify variants for inspiration: [Shopify Variants](https://help.shopify.com/en/manual/products/variants)

---

**Document Version:** 1.0  
**Created:** 2025-11-06  
**Next Action:** Investigate and fix current broken variation system, then implement bulk generator

