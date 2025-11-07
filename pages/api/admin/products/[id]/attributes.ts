import { getSupabaseAdmin } from '@/lib/supabaseClient'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getSupabaseAdmin()
  const { id: productId } = req.query

  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ error: 'Product ID is required' })
  }

  // GET: Fetch all attributes and their options for a product
  if (req.method === 'GET') {
    try {
      const { data: attributes, error } = await supabase
        .from('product_attributes')
        .select(`
          *,
          options:product_attribute_options(*)
        `)
        .eq('product_id', productId)
        .order('display_order', { ascending: true })

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      // Sort options within each attribute
      const sortedAttributes = attributes?.map((attr) => ({
        ...attr,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options: attr.options?.sort((a: any, b: any) => a.display_order - b.display_order) || [],
      }))

      return res.json({ attributes: sortedAttributes || [] })
    } catch {
      return res.status(500).json({ error: 'Failed to fetch attributes' })
    }
  }

  // POST: Create attributes with options for a product
  if (req.method === 'POST') {
    try {
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

        // Insert attribute
        const { data: newAttr, error: attrError } = await supabase
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
          return res.status(500).json({ error: attrError.message })
        }

        // Insert options for this attribute
        if (attr.options && Array.isArray(attr.options) && attr.options.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const optionsToInsert = attr.options.map((opt: any, idx: number) => ({
            attribute_id: newAttr.id,
            value: opt.value || opt.displayName?.toLowerCase().replace(/\s+/g, '-'),
            display_name: opt.displayName || opt.value,
            hex_color: opt.hexColor || null,
            images: opt.images || [],
            price_modifier: opt.priceModifier || 0,
            display_order: idx,
          }))

          const { data: newOptions, error: optError } = await supabase
            .from('product_attribute_options')
            .insert(optionsToInsert)
            .select()

          if (optError) {
            return res.status(500).json({ error: optError.message })
          }

          createdAttributes.push({
            ...newAttr,
            options: newOptions,
          })
        } else {
          createdAttributes.push({
            ...newAttr,
            options: [],
          })
        }
      }

      return res.status(201).json({ attributes: createdAttributes })
    } catch {
      return res.status(500).json({ error: 'Failed to create attributes' })
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

