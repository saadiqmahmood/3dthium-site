import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { log } from '@/lib/log'
import { getSupabaseAdmin } from '@/lib/supabaseClient'
import { getVariantCombinationKey, normalizeVariantAttributes } from '@/utils/variantHelpers'

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
  const admin = await requireAdmin(req, res)
  if (!admin) return

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
    log.error('[VARIATION GENERATOR] No valid attribute IDs provided:', attributeIds)
    return res.status(400).json({
      error: 'No valid attribute IDs provided. Please save your attributes first.',
      received: attributeIds,
    })
  }

  log.debug('[VARIATION GENERATOR] Looking for attributes:', {
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
      log.error('[VARIATION GENERATOR] Error fetching attributes:', attrError)
      return res.status(500).json({ error: attrError.message })
    }

    log.debug('� [VARIATION GENERATOR] Found attributes:', {
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

      log.error('[VARIATION GENERATOR] No attributes found. Available attributes:', allAttrs)
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

    log.debug(
      `🎲 [VARIATION GENERATOR] Generated ${combinations.length} combinations for product: ${product.name}`
    )

    // 3.5. Fetch existing variants to check for duplicates
    const { data: existingVariants, error: existingError } = await supabase
      .from('product_variants_new')
      .select('size, color, material, sku')
      .eq('product_id', productId)

    if (existingError) {
      log.error('[VARIATION GENERATOR] Error fetching existing variants:', existingError)
      return res.status(500).json({ error: 'Failed to check existing variants' })
    }

    // Create a set of existing variant combination keys for fast lookup
    const existingCombinations = new Set<string>()
    const existingSkus = new Set<string>()

    existingVariants?.forEach((variant) => {
      const key = getVariantCombinationKey(variant.size, variant.color, variant.material)
      existingCombinations.add(key)
      if (variant.sku) existingSkus.add(variant.sku.toUpperCase())
    })

    log.debug(`📊 [VARIATION GENERATOR] Found ${existingVariants?.length || 0} existing variants`)

    // 4. Create variation records, filtering out existing combinations
    const newVariants = []
    const skippedVariants = []
    let variantIndex = 0

    for (const combo of combinations) {
      variantIndex++

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

      // Normalize attributes
      const normalized = normalizeVariantAttributes({ size, color, material })

      // Check if this combination already exists
      const combinationKey = getVariantCombinationKey(
        normalized.size,
        normalized.color,
        normalized.material
      )

      if (existingCombinations.has(combinationKey)) {
        skippedVariants.push({
          size: normalized.size,
          color: normalized.color,
          material: normalized.material,
          reason: 'duplicate_combination',
        })
        continue
      }

      // Build base SKU: SLUG-ATTR1VAL-ATTR2VAL-001
      const skuParts = [
        product.slug.toUpperCase().replace(/-/g, '').slice(0, 8),
        ...Object.values(combo.values).map((v) =>
          String(v).toUpperCase().replace(/\s+/g, '').slice(0, 4)
        ),
        String(variantIndex).padStart(3, '0'),
      ]
      const baseSku = skuParts.join('-')

      // Generate SKU and ensure uniqueness
      let finalSku = baseSku
      let attemptSku = baseSku.toUpperCase()
      let skuSuffixCounter = 1

      // If SKU already exists, append counter
      while (existingSkus.has(attemptSku)) {
        const skuSuffix = `-${skuSuffixCounter}`
        finalSku = `${baseSku}${skuSuffix}`
        attemptSku = finalSku.toUpperCase()
        skuSuffixCounter++
      }

      existingSkus.add(finalSku.toUpperCase())

      newVariants.push({
        product_id: productId,
        sku: finalSku,
        price_adjustment: priceAdjustment.toFixed(2),
        stock_quantity: defaultStock || 0,
        is_available: true,
        size: normalized.size,
        color: normalized.color,
        material: normalized.material,
        image_url: imageUrl,
      })
    }

    log.debug(
      `📈 [VARIATION GENERATOR] Prepared ${newVariants.length} new variants, skipped ${skippedVariants.length} duplicates`
    )

    if (newVariants.length === 0) {
      return res.status(400).json({
        error: 'All combinations already exist',
        skipped: skippedVariants.length,
        message: `All ${combinations.length} generated combinations already exist for this product.`,
      })
    }

    // 5. Insert new variants in batches (Supabase limit: 1000 per request)
    const batchSize = 500
    const createdVariants = []
    const failedBatches: Array<{ batchIndex: number; error: string }> = []

    for (let i = 0; i < newVariants.length; i += batchSize) {
      const batch = newVariants.slice(i, i + batchSize)
      const batchIndex = Math.floor(i / batchSize) + 1

      const { data: created, error: insertError } = await supabase
        .from('product_variants_new')
        .insert(batch)
        .select()

      if (insertError) {
        log.error(`❌ [VARIATION GENERATOR] Batch ${batchIndex} insert failed:`, insertError)
        failedBatches.push({
          batchIndex,
          error: insertError.message,
        })
        // Continue with next batch instead of failing completely
        continue
      }

      createdVariants.push(...(created || []))
    }

    const successCount = createdVariants.length
    const failedCount = newVariants.length - successCount

    log.debug(
      `✅ [VARIATION GENERATOR] Created ${successCount} variations successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`
    )

    // Return success with details about what was created and what was skipped
    return res.status(201).json({
      success: true,
      created: successCount,
      skipped: skippedVariants.length,
      failed: failedCount,
      variants: createdVariants,
      skippedVariants: skippedVariants.length > 0 ? skippedVariants : undefined,
      errors: failedBatches.length > 0 ? failedBatches : undefined,
    })
  } catch (error) {
    log.error('[VARIATION GENERATOR] Unexpected error:', error)
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
