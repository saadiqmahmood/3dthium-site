import { getSupabaseAdmin } from '@/lib/supabaseClient'
import type { NextApiRequest, NextApiResponse } from 'next'

type AttributeOption = {
  id: string
  attribute_id: string
  value: string
  display_name: string
  hex_color: string | null
  images: string[]
  price_modifier: number
  display_order: number
}

type Attribute = {
  id: string
  product_id: string
  name: string
  type: string
  display_order: number
  required: boolean
  options: AttributeOption[]
}

type Combination = {
  values: Record<string, string>
  options: Record<string, AttributeOption>
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = getSupabaseAdmin()
  const { id: productId } = req.query
  const { attributeIds, pricingStrategy, defaultStock } = req.body

  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ error: 'Product ID is required' })
  }

  if (!attributeIds || !Array.isArray(attributeIds) || attributeIds.length === 0) {
    return res.status(400).json({ error: 'At least one attribute ID is required' })
  }

  try {
    // 1. Fetch the product
    const { data: product, error: prodError } = await supabase
      .from('products_new')
      .select('id, name, slug, base_price')
      .eq('id', productId)
      .single()

    if (prodError || !product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    // 2. Fetch all attributes and their options
    const { data: attributes, error: attrError } = await supabase
      .from('product_attributes')
      .select(`
        *,
        options:product_attribute_options(*)
      `)
      .in('id', attributeIds)
      .eq('product_id', productId)

    if (attrError) {
      return res.status(500).json({ error: attrError.message })
    }

    if (!attributes || attributes.length === 0) {
      return res.status(400).json({ error: 'No attributes found for the given IDs' })
    }

    // Validate all attributes have options
    for (const attr of attributes) {
      if (!attr.options || attr.options.length === 0) {
        return res.status(400).json({ 
          error: `Attribute "${attr.name}" has no options. Please add options first.` 
        })
      }
    }

    // 3. Generate all combinations using cartesian product
    const combinations = generateCombinations(attributes as Attribute[])

    console.log(`🎲 [VARIATION GENERATOR] Generating ${combinations.length} variations for product: ${product.name}`)

    // 4. Create variation records
    const basePrice = parseFloat(String(product.base_price))
    const variants = combinations.map((combo, index) => {
      // Build SKU: SLUG-ATTR1VAL-ATTR2VAL-001
      const skuParts = [
        product.slug.toUpperCase().replace(/-/g, '').slice(0, 8),
        ...Object.values(combo.values).map(v => String(v).toUpperCase().replace(/\s+/g, '').slice(0, 4)),
        String(index + 1).padStart(3, '0')
      ]
      const sku = skuParts.join('-')

      // Calculate price
      let finalPrice = basePrice
      if (pricingStrategy === 'additive') {
        Object.values(combo.options).forEach(option => {
          finalPrice += option.price_modifier || 0
        })
      }

      // Collect images from attribute options (priority: design > color > material > size)
      const inheritedImages = collectImages(combo.options)

      return {
        product_id: productId,
        sku,
        price: finalPrice.toFixed(2),
        stock_quantity: defaultStock || 0,
        attribute_values: combo.values,
        auto_generated: true,
        images: inheritedImages.all,
        image_sources: inheritedImages.sources,
        is_available: true,
        // Keep legacy fields for backwards compatibility
        size: combo.values.height || combo.values.size || null,
        color: combo.values.color || null,
        material: combo.values.material || null,
        price_adjustment: finalPrice - basePrice,
      }
    })

    // 5. Insert all variants in batches (Supabase limit: 1000 per request)
    const batchSize = 500
    const createdVariants = []

    for (let i = 0; i < variants.length; i += batchSize) {
      const batch = variants.slice(i, i + batchSize)
      
      const { data: created, error: insertError } = await supabase
        .from('product_variants_new')
        .insert(batch)
        .select()

      if (insertError) {
        console.error('❌ [VARIATION GENERATOR] Batch insert failed:', insertError)
        return res.status(500).json({ 
          error: insertError.message,
          hint: insertError.hint,
          details: insertError.details 
        })
      }

      createdVariants.push(...(created || []))
    }

    console.log(`✅ [VARIATION GENERATOR] Created ${createdVariants.length} variations successfully`)

    return res.status(201).json({
      success: true,
      created: createdVariants.length,
      variants: createdVariants,
    })

  } catch (error) {
    console.error('❌ [VARIATION GENERATOR] Unexpected error:', error)
    return res.status(500).json({ error: 'Failed to generate variations' })
  }
}

// Helper: Generate cartesian product of attributes
function generateCombinations(attributes: Attribute[]): Combination[] {
  if (!attributes.length) return []

  const result: Combination[] = []
  
  function recurse(index: number, current: Combination) {
    if (index === attributes.length) {
      result.push({ 
        values: { ...current.values },
        options: { ...current.options }
      })
      return
    }

    const attr = attributes[index]
    const attrKey = attr.name.toLowerCase().replace(/\s+/g, '_')
    
    for (const option of attr.options) {
      recurse(index + 1, {
        values: { ...current.values, [attrKey]: option.value },
        options: { ...current.options, [attrKey]: option },
      })
    }
  }

  recurse(0, { values: {}, options: {} })
  return result
}

// Helper: Collect images from attribute options with priority
function collectImages(optionsMap: Record<string, AttributeOption>) {
  const allImages: string[] = []
  const sources: Record<string, string[]> = {}

  // Priority order: design > color > material > size
  const priority = ['design', 'design_pattern', 'color', 'material', 'size', 'height']

  for (const key of Object.keys(optionsMap)) {
    const option = optionsMap[key]
    if (option?.images && Array.isArray(option.images) && option.images.length > 0) {
      // Add images that aren't already included
      const newImages = option.images.filter(img => !allImages.includes(img))
      allImages.push(...newImages)
      sources[key] = option.images
    }
  }

  return {
    all: allImages,
    sources,
  }
}

