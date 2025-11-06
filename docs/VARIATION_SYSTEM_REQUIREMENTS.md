# Product Variation System - Requirements & Implementation Plan

## 📋 Executive Summary

**Status:** Current variation system is non-functional
**Priority:** HIGH - Blocking client's ability to list products
**Impact:** Client has 600+ variations to manage; current system requires manual one-by-one entry

---

## ❌ Current System Issues

### Problems Identified:
1. **Variations don't save/create properly**
   - Creating a variant does not persist to database
   - No error messages, just silently fails

2. **No bulk creation**
   - Can only add one variation at a time
   - For 50-600 variations, this is unusable

3. **Manual image assignment for each variation**
   - Must set images for every single variation
   - No inheritance or smart defaults

4. **Limited attribute support**
   - Cannot handle complex multi-dimensional variations
   - No support for design pattern as attribute

---

## ✅ Client Requirements

### 1. Bulk Variation Generator
**User Story:** As an admin, I want to define attributes and automatically generate all possible combinations.

**Acceptance Criteria:**
- [ ] Define multiple attributes (color, height, material, design, etc.)
- [ ] Add multiple options per attribute (e.g., 16 colors)
- [ ] Click "Generate Variations" to create all combinations automatically
- [ ] System calculates: Attribute1 × Attribute2 × Attribute3 = Total variations
- [ ] Preview variation count before generation
- [ ] Generate SKUs automatically (e.g., `VASE-RED-SMALL-001`)

**Example:**
```
Attributes:
- Colors: Red, Blue, Green, Yellow (4 options)
- Heights: Small, Medium, Large (3 options)
- Materials: Ceramic, Glass (2 options)

Result: 4 × 3 × 2 = 24 variations created automatically
```

---

### 2. Attribute-Based Image Assignment
**User Story:** As an admin, I want to assign images to attributes once, and have all variations inherit them.

**Acceptance Criteria:**
- [ ] Upload images for an attribute (e.g., "Red" color)
- [ ] All variations with that attribute automatically show those images
- [ ] Support multiple attributes with images (color + design pattern)
- [ ] Allow override for specific variations if needed
- [ ] Smart image inheritance hierarchy

**Example:**
```
Assign Images:
- Red color → [red1.jpg, red2.jpg, red3.jpg]
- Blue color → [blue1.jpg, blue2.jpg]

Generated Variations:
- Red + Small + Ceramic → Shows red1, red2, red3
- Red + Large + Glass → Shows red1, red2, red3
- Blue + Small + Ceramic → Shows blue1, blue2
- Blue + Large + Glass → Shows blue1, blue2

Result: Set images 2 times, not 4 times
```

---

### 3. Support Design as Attribute
**User Story:** As an admin, I want to include design pattern as a variation attribute, not just color/size.

**Acceptance Criteria:**
- [ ] Support "Design" attribute alongside color/height/material
- [ ] Handle products where design varies (Pattern A vs Pattern B)
- [ ] Multiple designs can have different images
- [ ] Not limited to simple color/size variations like eBay

**Example:**
```
Product: Decorative Vase
Attributes:
- Design: Smooth, Ribbed, Geometric
- Color: Red, Blue, White
- Height: Small, Large

Result: 3 × 3 × 2 = 18 variations
Each design can have unique images
```

---

### 4. UI Requirements
**User Story:** As an admin, I want an intuitive interface to manage hundreds of variations efficiently.

**Acceptance Criteria:**
- [ ] Visual attribute builder interface
- [ ] Preview all variations before saving
- [ ] Bulk edit pricing (e.g., set all as +$5 from base)
- [ ] Bulk edit stock levels
- [ ] Filter/search variations in admin panel
- [ ] Click variation → see detailed view with images
- [ ] Export variations to CSV for bulk editing
- [ ] Import variations from CSV

---

## 🏗️ Technical Architecture

### Database Schema Changes

#### New: `product_attributes` table
```sql
CREATE TABLE product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products_new(id) ON DELETE CASCADE,
  name TEXT NOT NULL,  -- e.g., "Color", "Height", "Material", "Design"
  type TEXT NOT NULL,  -- 'color', 'size', 'material', 'design', 'custom'
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### New: `product_attribute_options` table
```sql
CREATE TABLE product_attribute_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id UUID REFERENCES product_attributes(id) ON DELETE CASCADE,
  value TEXT NOT NULL,  -- e.g., "Red", "Small", "Ceramic"
  display_name TEXT,
  hex_color TEXT,  -- For color swatches
  images JSONB DEFAULT '[]'::jsonb,  -- Images for this option
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Update: `product_variants_new` table
```sql
ALTER TABLE product_variants_new
  ADD COLUMN attribute_values JSONB DEFAULT '{}'::jsonb,
  -- e.g., {"color": "red", "height": "small", "material": "ceramic"}
  ADD COLUMN auto_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN image_inheritance JSONB DEFAULT '{}'::jsonb;
  -- Tracks which images came from which attributes
```

---

### API Endpoints

#### 1. Attribute Management
```typescript
// Create/update attributes for a product
POST /api/admin/products/[id]/attributes
{
  "attributes": [
    {
      "name": "Color",
      "type": "color",
      "options": [
        { "value": "red", "displayName": "Red", "hexColor": "#FF0000", "images": [...] },
        { "value": "blue", "displayName": "Blue", "hexColor": "#0000FF", "images": [...] }
      ]
    },
    {
      "name": "Height",
      "type": "size",
      "options": [
        { "value": "small", "displayName": "6 inch" },
        { "value": "large", "displayName": "12 inch" }
      ]
    }
  ]
}

// Get attributes for a product
GET /api/admin/products/[id]/attributes
```

#### 2. Variation Generation
```typescript
// Preview variations before creating
POST /api/admin/products/[id]/variations/preview
{
  "attributeIds": ["attr-uuid-1", "attr-uuid-2"]
}
Response: {
  "count": 24,
  "combinations": [...],
  "estimatedTime": "2 seconds"
}

// Generate all variations
POST /api/admin/products/[id]/variations/generate
{
  "attributeIds": ["attr-uuid-1", "attr-uuid-2"],
  "pricingStrategy": "base", // or "additive"
  "priceModifiers": {
    "large": 10.00,  // +$10 for large
    "ceramic": 5.00   // +$5 for ceramic
  },
  "defaultStock": 10
}
Response: {
  "created": 24,
  "skipped": 0,
  "variants": [...]
}
```

#### 3. Bulk Operations
```typescript
// Bulk update variations
PATCH /api/admin/products/[id]/variations/bulk
{
  "variantIds": ["uuid1", "uuid2", ...],
  "updates": {
    "stock": 50,
    "price": "+5.00"  // relative pricing
  }
}

// Delete all auto-generated variations
DELETE /api/admin/products/[id]/variations/auto-generated
```

---

## 🎨 UI Components

### 1. Attribute Builder Component
**Location:** `/components/admin/AttributeBuilder.tsx`

**Features:**
- Add/remove attributes
- Define attribute types (color, size, design, custom)
- Add options to each attribute
- Upload images per option
- Drag-to-reorder attributes and options
- Color picker for color attributes

---

### 2. Variation Generator Component
**Location:** `/components/admin/VariationGenerator.tsx`

**Features:**
- Select which attributes to use
- Preview combination count
- Set pricing strategy:
  - Base price (all same)
  - Additive (base + modifiers)
  - Custom (set individually later)
- Set default stock level
- Generate button with progress indicator
- Success summary

---

### 3. Variation Grid Manager
**Location:** `/components/admin/VariationGridManager.tsx`

**Features:**
- Table/grid view of all variations
- Filter by attribute values
- Sort by price, SKU, stock
- Bulk select checkboxes
- Inline editing for price/stock
- Quick image preview
- Delete individual or bulk
- Export to CSV button

---

## 📊 Data Flow

### Variation Generation Process:
```
1. Admin defines attributes
   ↓
2. Admin uploads images per attribute option
   ↓
3. Admin clicks "Generate Variations"
   ↓
4. System calculates all combinations
   ↓
5. System creates variation records with:
   - SKU (auto-generated)
   - Attribute values (stored as JSON)
   - Inherited images (from attribute options)
   - Base price + modifiers
   - Default stock
   ↓
6. Variations saved to database
   ↓
7. Admin can bulk-edit if needed
```

### Image Inheritance Logic:
```
For variation: {color: "red", height: "small", design: "ribbed"}

1. Collect images from attribute options:
   - Red color → [red1.jpg, red2.jpg]
   - Ribbed design → [ribbed1.jpg]

2. Merge images (design takes priority):
   - Primary: ribbed1.jpg
   - Gallery: [red1.jpg, red2.jpg]

3. Store inheritance metadata:
   {
     "primary_from": "design:ribbed",
     "gallery_from": ["color:red"]
   }

4. Allow manual override per variation
```

---

## 🔄 Migration Strategy

### Phase 1: Database Schema (Day 1)
- [ ] Create new tables: `product_attributes`, `product_attribute_options`
- [ ] Alter `product_variants_new` table
- [ ] Write migration script for existing variants (if any)

### Phase 2: Backend API (Day 2-3)
- [ ] Attribute CRUD endpoints
- [ ] Variation generation algorithm
- [ ] Image inheritance logic
- [ ] Bulk update operations
- [ ] CSV export/import

### Phase 3: Admin UI (Day 4-5)
- [ ] AttributeBuilder component
- [ ] VariationGenerator component
- [ ] VariationGridManager component
- [ ] Integrate into product creation flow

### Phase 4: Testing & Refinement (Day 6)
- [ ] Test with 50+ variations
- [ ] Test with 600+ variations (performance)
- [ ] Test image inheritance edge cases
- [ ] Load testing on generation endpoint

### Phase 5: Client Testing (Day 7)
- [ ] Client walkthrough
- [ ] Feedback collection
- [ ] Bug fixes
- [ ] Documentation for client

---

## 🎯 Success Metrics

- [ ] Can create 600 variations in under 10 seconds
- [ ] Images set 1 time per attribute, not per variation
- [ ] Zero manual SKU generation required
- [ ] Bulk editing takes < 2 seconds for 50 variations
- [ ] Client can manage full catalog without frustration

---

## 🚀 Future Enhancements (V2)

1. **3D Product Viewer**
   - For design-heavy variations
   - Rotate/zoom preview

2. **AI-Powered Image Assignment**
   - Auto-detect color from image
   - Suggest attribute based on image content

3. **Variation Templates**
   - Save attribute sets as templates
   - Apply to multiple products

4. **Variant Analytics**
   - Which combinations sell most
   - Low stock alerts per variation

5. **Customer-Facing Variation Selector**
   - Visual attribute selector (color swatches)
   - Real-time price updates
   - Image updates on selection

---

## 📝 Notes

- Current eBay variation system limitation acknowledged
- Client needs to manage 600+ variations efficiently
- Must support design as first-class attribute
- Image inheritance is critical for scale
- Bulk operations are non-negotiable

---

**Document Version:** 1.0  
**Created:** 2025-11-06  
**Status:** Ready for implementation approval

