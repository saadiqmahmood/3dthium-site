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

  // Filter out any null/undefined/empty IDs
  const validAttributeIds = attributeIds.filter(
    (id) => id && typeof id === 'string' && id.trim() !== ''
  )

  if (validAttributeIds.length === 0) {
    console.error('❌ [VARIATION GENERATOR] No valid attribute IDs provided:', attributeIds)
    return res.status(400).json({
      error: 'No valid attribute IDs provided. Please save your attributes first.',
      received: attributeIds,
    })
  }

  console.log('🔍 [VARIATION GENERATOR] Looking for attributes:', {
    productId,
    attributeIds: validAttributeIds,
    count: validAttributeIds.length,
  })

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
      .in('id', validAttributeIds)
      .eq('product_id', productId)
      .order('display_order', { ascending: true })

    if (attrError) {
      console.error('❌ [VARIATION GENERATOR] Error fetching attributes:', attrError)
      return res.status(500).json({ error: attrError.message })
    }

    console.log('📊 [VARIATION GENERATOR] Found attributes:', {
      requested: validAttributeIds.length,
      found: attributes?.length || 0,
      attributeNames: attributes?.map((a) => a.name) || [],
    })

    if (!attributes || attributes.length === 0) {
      // Try to fetch all attributes for this product to help debug
      const { data: allAttrs } = await supabase
        .from('product_attributes')
        .select('id, name, type')
        .eq('product_id', productId)

      console.error('❌ [VARIATION GENERATOR] No attributes found. Available attributes:', allAttrs)
      return res.status(400).json({
        error: 'No attributes found for the given IDs',
        requestedIds: validAttributeIds,
        availableAttributes: allAttrs || [],
      })
    }

    // Validate all attributes have options
    for (const attr of attributes) {
      if (!attr.options || attr.options.length === 0) {
        return res.status(400).json({
          error: `Attribute "${attr.name}" has no options. Please add options first.`,
        })
      }
    }

    // 3. Generate all combinations using cartesian product
    const combinations = generateCombinations(attributes as Attribute[])

    console.log(
      `🎲 [VARIATION GENERATOR] Generating ${combinations.length} variations for product: ${product.name}`
    )

    // 4. Create variation records
    const variants = combinations.map((combo, index) => {
      // Build SKU: SLUG-ATTR1VAL-ATTR2VAL-001
      const skuParts = [
        product.slug.toUpperCase().replace(/-/g, '').slice(0, 8),
        ...Object.values(combo.values).map((v) =>
          String(v).toUpperCase().replace(/\s+/g, '').slice(0, 4)
        ),
        String(index + 1).padStart(3, '0'),
      ]
      const sku = skuParts.join('-')

      // Calculate price adjustment
      let priceAdjustment = 0
      if (pricingStrategy === 'additive') {
        Object.values(combo.options).forEach((option) => {
          priceAdjustment += option.price_modifier || 0
        })
      }

      // Collect images from attribute options (priority: color > design > material > size)
      // Use first image as image_url (database only supports single image_url, not array)
      const inheritedImages = collectImages(combo.options, attributes)
      const imageUrl = inheritedImages.all.length > 0 ? inheritedImages.all[0] : null

      // Map attribute values to database columns
      // The combo.values keys are lowercase with underscores (e.g., "height", "color", "colour")
      // We need to find which attribute is color/colour, size/height, and material
      let size: string | null = null
      let color: string | null = null
      let material: string | null = null

      // Find attributes by type and name
      for (const attr of attributes) {
        const attrKey = attr.name.toLowerCase().replace(/\s+/g, '_')
        const attrType = attr.type?.toLowerCase() || ''
        const attrNameLower = attr.name.toLowerCase()
        const value = combo.values[attrKey]

        // Check for size/height
        if (
          attrType === 'size' ||
          attrNameLower.includes('size') ||
          attrNameLower.includes('height')
        ) {
          size = value || null
        }
        // Check for color/colour
        else if (
          attrType === 'color' ||
          attrNameLower.includes('color') ||
          attrNameLower.includes('colour')
        ) {
          color = value || null
        }
        // Check for material
        else if (attrType === 'material' || attrNameLower.includes('material')) {
          material = value || null
        }
      }

      return {
        product_id: productId,
        sku,
        price_adjustment: priceAdjustment.toFixed(2),
        stock_quantity: defaultStock || 0,
        is_available: true,
        size,
        color,
        material,
        image_url: imageUrl,
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
          details: insertError.details,
        })
      }

      createdVariants.push(...(created || []))
    }

    console.log(
      `✅ [VARIATION GENERATOR] Created ${createdVariants.length} variations successfully`
    )

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
        options: { ...current.options },
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
// Priority: color/colour > design > material > size/height
function collectImages(
  optionsMap: Record<string, AttributeOption>,
  attributes: Attribute[]
): { all: string[]; sources: Record<string, string[]> } {
  const allImages: string[] = []
  const sources: Record<string, string[]> = {}

  // Create a map of attribute names to their types for priority checking
  const attrTypeMap: Record<string, string> = {}
  attributes.forEach((attr) => {
    const key = attr.name.toLowerCase().replace(/\s+/g, '_')
    attrTypeMap[key] = attr.type.toLowerCase()
  })

  // Sort keys by priority: color/colour first, then design, material, then size/height
  const sortedKeys = Object.keys(optionsMap).sort((a, b) => {
    const aType = attrTypeMap[a] || ''
    const bType = attrTypeMap[b] || ''
    const aIsColor = a === 'color' || a === 'colour' || aType === 'color'
    const bIsColor = b === 'color' || b === 'colour' || bType === 'color'
    const aIsDesign = aType === 'design'
    const bIsDesign = bType === 'design'
    const aIsMaterial = aType === 'material'
    const bIsMaterial = bType === 'material'

    if (aIsColor && !bIsColor) return -1
    if (!aIsColor && bIsColor) return 1
    if (aIsDesign && !bIsDesign) return -1
    if (!aIsDesign && bIsDesign) return 1
    if (aIsMaterial && !bIsMaterial) return -1
    if (!aIsMaterial && bIsMaterial) return 1
    return 0
  })

  // Process in priority order
  for (const key of sortedKeys) {
    const option = optionsMap[key]
    if (option?.images && Array.isArray(option.images) && option.images.length > 0) {
      // Add images that aren't already included
      const newImages = option.images.filter((img) => !allImages.includes(img))
      allImages.push(...newImages)
      sources[key] = option.images
    }
  }

  return {
    all: allImages,
    sources,
  }
}
