import { log } from '../../../../../lib/log'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { getSupabaseAdmin } from '@/lib/supabaseClient'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const supabase = getSupabaseAdmin()
  const { id: productId } = req.query

  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ error: 'Product ID is required' })
  }

  // GET: Fetch all attributes and their options for a product
  if (req.method === 'GET') {
    try {
      log.debug('[API] Fetching attributes for product:', productId)

      // Fetch attributes
      const { data: attributes, error: attrError } = await supabase
        .from('product_attributes')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true })

      if (attrError) {
        log.error('[API] Error fetching attributes:', attrError)
        return res.status(500).json({ error: attrError.message })
      }

      if (!attributes || attributes.length === 0) {
        log.debug('[API] No attributes found for product')
        return res.json({ attributes: [] })
      }

      // Fetch options for all attributes
      const attributeIds = attributes.map((attr) => attr.id)
      const { data: options, error: optError } = await supabase
        .from('product_attribute_options')
        .select('*')
        .in('attribute_id', attributeIds)
        .order('display_order', { ascending: true })

      if (optError) {
        log.error('[API] Error fetching options:', optError)
        return res.status(500).json({ error: optError.message })
      }

      // Group options by attribute_id
      const optionsByAttribute = (options || []).reduce(
        (
          acc: Record<
            string,
            Array<{
              attribute_id: string
              value: string
              display_name: string
              display_order?: number
            }>
          >,
          opt: {
            attribute_id: string
            value: string
            display_name: string
            display_order?: number
          }
        ) => {
          if (!acc[opt.attribute_id]) {
            acc[opt.attribute_id] = []
          }
          acc[opt.attribute_id].push(opt)
          return acc
        },
        {}
      )

      // Combine attributes with their options
      const sortedAttributes = attributes.map((attr) => ({
        ...attr,
        options: (optionsByAttribute[attr.id] || []).sort(
          (a: { display_order?: number }, b: { display_order?: number }) =>
            (a.display_order || 0) - (b.display_order || 0)
        ),
      }))

      log.debug('[API] Attributes fetched:', sortedAttributes.length)
      return res.json({ attributes: sortedAttributes })
    } catch (error) {
      log.error('[API] Exception fetching attributes:', error)
      return res.status(500).json({
        error: 'Failed to fetch attributes',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // POST: Create attributes with options for a product
  if (req.method === 'POST') {
    try {
      log.debug('� [API] Saving attributes for product:', productId)
      const { attributes } = req.body

      if (!Array.isArray(attributes) || attributes.length === 0) {
        return res.status(400).json({ error: 'Attributes array is required' })
      }

      const createdAttributes = []

      for (const attr of attributes) {
        // Validate attribute
        if (!attr.name || !attr.type) {
          return res.status(400).json({ error: 'Attribute name and type are required' })
        }

        let newAttr: {
          id: string
          product_id: string
          name: string
          type: string
          display_order: number
          required: boolean
        } | null = null

        // If attribute has an ID, try to update it
        if (attr.id) {
          const { data: existingAttr, error: fetchError } = await supabase
            .from('product_attributes')
            .select('*')
            .eq('id', attr.id)
            .eq('product_id', productId)
            .single()

          if (fetchError || !existingAttr) {
            log.error('[API] Error fetching attribute by ID:', fetchError)
            // If ID doesn't exist, treat as new attribute
            const { data: insertedAttr, error: attrError } = await supabase
              .from('product_attributes')
              .insert({
                product_id: productId,
                name: attr.name,
                type: attr.type,
                display_order: attr.display_order || 0,
                required: attr.required !== undefined ? attr.required : true,
              })
              .select()
              .single()

            if (attrError) {
              log.error('[API] Error inserting attribute:', attrError)
              return res.status(500).json({ error: attrError.message })
            }
            newAttr = insertedAttr
          } else {
            // Update existing attribute by ID
            const { data: updatedAttr, error: updateError } = await supabase
              .from('product_attributes')
              .update({
                name: attr.name,
                type: attr.type,
                display_order: attr.display_order || 0,
                required: attr.required !== undefined ? attr.required : true,
              })
              .eq('id', attr.id)
              .select()
              .single()

            if (updateError) {
              log.error('[API] Error updating attribute:', updateError)
              return res.status(500).json({ error: updateError.message })
            }
            newAttr = updatedAttr
          }
        } else {
          // No ID - check if attribute exists by name (to avoid duplicates)
          const { data: existingAttr } = await supabase
            .from('product_attributes')
            .select('*')
            .eq('product_id', productId)
            .eq('name', attr.name)
            .single()

          if (existingAttr) {
            // Update existing attribute by name
            const { data: updatedAttr, error: updateError } = await supabase
              .from('product_attributes')
              .update({
                type: attr.type,
                display_order: attr.display_order || 0,
                required: attr.required !== undefined ? attr.required : true,
              })
              .eq('id', existingAttr.id)
              .select()
              .single()

            if (updateError) {
              log.error('[API] Error updating attribute by name:', updateError)
              return res.status(500).json({ error: updateError.message })
            }
            newAttr = updatedAttr
          } else {
            // Insert new attribute
            const { data: insertedAttr, error: attrError } = await supabase
              .from('product_attributes')
              .insert({
                product_id: productId,
                name: attr.name,
                type: attr.type,
                display_order: attr.display_order || 0,
                required: attr.required !== undefined ? attr.required : true,
              })
              .select()
              .single()

            if (attrError) {
              log.error('[API] Error inserting new attribute:', attrError)
              return res.status(500).json({ error: attrError.message })
            }
            newAttr = insertedAttr
          }
        }

        // Delete existing options for this attribute first (to handle updates)
        // Wait for delete to complete before inserting
        if (!newAttr) {
          return res.status(500).json({ error: 'Failed to create or update attribute' })
        }

        // Fetch existing options before deleting to check for orphaned variants
        const { data: oldOptions } = await supabase
          .from('product_attribute_options')
          .select('value, display_name')
          .eq('attribute_id', newAttr.id)

        const oldOptionValues = new Set<string>(
          oldOptions?.map((opt) => opt.value.toLowerCase().trim()) || []
        )

        const { error: deleteError } = await supabase
          .from('product_attribute_options')
          .delete()
          .eq('attribute_id', newAttr.id)

        if (deleteError) {
          log.error('[API] Error deleting existing options:', deleteError)
          return res.status(500).json({
            error: deleteError.message,
            details: `Failed to delete existing options for attribute "${attr.name}"`,
          })
        }

        // Insert options for this attribute
        if (attr.options && Array.isArray(attr.options) && attr.options.length > 0) {
          // Track used values to ensure uniqueness
          const usedValues = new Set<string>()

          const optionsToInsert = attr.options.map(
            (
              opt: {
                value?: string
                displayName?: string
                hexColor?: string
                images?: string[]
                priceModifier?: number
              },
              idx: number
            ) => {
              // Use provided value, or generate from display name with attribute prefix
              let optionValue = opt.value?.trim()

              if (!optionValue || optionValue === '') {
                // Generate from display name with attribute name prefix for better uniqueness
                const attrPrefix =
                  attr.name
                    ?.toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '')
                    .slice(0, 10) || 'option'

                const displayValue =
                  opt.displayName
                    ?.toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '') || `opt-${idx}`

                optionValue = `${attrPrefix}-${displayValue}`
              }

              // Ensure uniqueness by appending counter if value already used
              let uniqueValue = optionValue
              let counter = 0
              while (usedValues.has(uniqueValue)) {
                counter++
                uniqueValue = `${optionValue}-${counter}`
              }
              usedValues.add(uniqueValue)

              return {
                attribute_id: newAttr.id,
                value: uniqueValue,
                display_name: opt.displayName || opt.value || `Option ${idx + 1}`,
                hex_color: opt.hexColor || null,
                images: opt.images || [],
                price_modifier: opt.priceModifier || 0,
                display_order: idx,
              }
            }
          )

          const { data: newOptions, error: optError } = await supabase
            .from('product_attribute_options')
            .insert(optionsToInsert)
            .select()

          if (optError) {
            log.error('[API] Error inserting options:', {
              attributeId: newAttr.id,
              attributeName: attr.name,
              optionsCount: optionsToInsert.length,
              optionsToInsert: optionsToInsert.map(
                (opt: { value: string; display_name: string }) => ({
                  value: opt.value,
                  display_name: opt.display_name,
                })
              ),
              error: optError,
            })
            return res.status(500).json({
              error: optError.message,
              details: `Failed to insert options for attribute "${attr.name}"`,
              hint:
                optError.hint || 'This may be due to duplicate values or a constraint violation.',
            })
          }

          createdAttributes.push({
            ...newAttr,
            options: newOptions,
          })

          // Check for orphaned variants (variants that reference deleted option values)
          const newOptionValues = new Set<string>(
            newOptions.map((opt: { value: string }) => opt.value.toLowerCase().trim())
          )
          const deletedOptionValues = Array.from(oldOptionValues).filter(
            (val) => !newOptionValues.has(val)
          )

          if (deletedOptionValues.length > 0) {
            // Find variants that reference deleted option values
            // Map attribute name to database column (size/color/material)
            const attrNameLower = newAttr.name.toLowerCase()
            let columnName: 'size' | 'color' | 'material' | null = null

            if (
              newAttr.type?.toLowerCase() === 'size' ||
              attrNameLower.includes('size') ||
              attrNameLower.includes('height')
            ) {
              columnName = 'size'
            } else if (
              newAttr.type?.toLowerCase() === 'color' ||
              attrNameLower.includes('color') ||
              attrNameLower.includes('colour')
            ) {
              columnName = 'color'
            } else if (
              newAttr.type?.toLowerCase() === 'material' ||
              attrNameLower.includes('material')
            ) {
              columnName = 'material'
            }

            if (columnName) {
              // Fetch variants that reference deleted option values
              // Note: We need to match by the option values (not display names)
              // Variants store option values, which are normalized
              const { data: orphanedVariants } = await supabase
                .from('product_variants_new')
                .select('id, size, color, material, sku')
                .eq('product_id', productId)

              const variantsToDelete = orphanedVariants?.filter((variant) => {
                const variantValue = variant[columnName]?.toLowerCase().trim()
                return variantValue && deletedOptionValues.includes(variantValue)
              })

              if (variantsToDelete && variantsToDelete.length > 0) {
                log.debug(
                  `⚠️ [API] Found ${variantsToDelete.length} orphaned variants due to deleted option values`
                )

                // Delete orphaned variants
                const variantIds = variantsToDelete.map((v) => v.id)
                const { error: deleteVariantError } = await supabase
                  .from('product_variants_new')
                  .delete()
                  .in('id', variantIds)

                if (deleteVariantError) {
                  log.error('[API] Error deleting orphaned variants:', deleteVariantError)
                  // Don't fail the attribute update, just log the error
                } else {
                  log.debug(`✅ [API] Deleted ${variantsToDelete.length} orphaned variants`)
                }
              }
            }
          }
        } else {
          createdAttributes.push({
            ...newAttr,
            options: [],
          })

          // If all options were removed, check if any variants reference this attribute
          // (This is a conservative approach - we could delete all variants, but that might be too aggressive)
          log.debug(
            `⚠️ [API] All options removed for attribute "${newAttr.name}". Existing variants may be affected.`
          )
        }
      }

      log.debug('[API] Attributes saved successfully')
      return res.status(201).json({ attributes: createdAttributes })
    } catch (error) {
      log.error('[API] Exception creating attributes:', error)
      return res.status(500).json({
        error: 'Failed to create attributes',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // DELETE: Remove all attributes for a product (cascade deletes options and variants)
  if (req.method === 'DELETE') {
    try {
      // First, delete all auto-generated variants
      await supabase
        .from('product_variants_new')
        .delete()
        .eq('product_id', productId)
        .eq('auto_generated', true)

      // Then delete attributes (options will cascade)
      const { error } = await supabase
        .from('product_attributes')
        .delete()
        .eq('product_id', productId)

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.json({ success: true, message: 'Attributes and auto-generated variants deleted' })
    } catch {
      return res.status(500).json({ error: 'Failed to delete attributes' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
