import { and, eq, isNull, ne } from 'drizzle-orm'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { err, ok } from '@/lib/api/respond'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { db, productVariantsNew } from '@/lib/db'
import { log } from '@/lib/log'
import { hasAtLeastOneAttribute, normalizeVariantAttributes } from '@/utils/variantHelpers'

const UpdateVariantSchema = z.object({
  size: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  material: z.string().nullable().optional(),
  price_adjustment: z.coerce.number().optional(),
  sku: z.string().nullable().optional(),
  stock_quantity: z.coerce.number().int().min(0).optional(),
  is_available: z.boolean().optional(),
  image_url: z.string().url().nullable().optional(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const { productId, variantId } = req.query
  if (!productId || typeof productId !== 'string') return err(res, 'Product ID is required', 400)
  if (!variantId || typeof variantId !== 'string') return err(res, 'Variant ID is required', 400)

  try {
    if (req.method === 'GET') {
      const [variant] = await db
        .select()
        .from(productVariantsNew)
        .where(
          and(eq(productVariantsNew.id, variantId), eq(productVariantsNew.productId, productId))
        )
        .limit(1)

      if (!variant) return err(res, 'Variant not found', 404)
      return ok(res, variant)
    }

    if (req.method === 'PUT') {
      const parsed = UpdateVariantSchema.safeParse(req.body)
      if (!parsed.success) {
        return err(res, 'Validation failed', 400, parsed.error.flatten().fieldErrors)
      }

      const updates = parsed.data

      // Fetch current variant to merge with updates for combination check
      const [current] = await db
        .select({
          size: productVariantsNew.size,
          color: productVariantsNew.color,
          material: productVariantsNew.material,
          sku: productVariantsNew.sku,
        })
        .from(productVariantsNew)
        .where(
          and(eq(productVariantsNew.id, variantId), eq(productVariantsNew.productId, productId))
        )
        .limit(1)

      if (!current) return err(res, 'Variant not found', 404)

      const merged = normalizeVariantAttributes({
        size: updates.size !== undefined ? updates.size : current.size,
        color: updates.color !== undefined ? updates.color : current.color,
        material: updates.material !== undefined ? updates.material : current.material,
      })

      if (!hasAtLeastOneAttribute(merged.size, merged.color, merged.material)) {
        return err(res, 'At least one attribute (size, color, or material) must remain', 400)
      }

      // Duplicate combination check (exclude self)
      const sizeCondition = merged.size
        ? eq(productVariantsNew.size, merged.size)
        : isNull(productVariantsNew.size)
      const colorCondition = merged.color
        ? eq(productVariantsNew.color, merged.color)
        : isNull(productVariantsNew.color)
      const materialCondition = merged.material
        ? eq(productVariantsNew.material, merged.material)
        : isNull(productVariantsNew.material)

      const [conflict] = await db
        .select({ id: productVariantsNew.id })
        .from(productVariantsNew)
        .where(
          and(
            eq(productVariantsNew.productId, productId),
            sizeCondition,
            colorCondition,
            materialCondition,
            ne(productVariantsNew.id, variantId)
          )
        )
        .limit(1)

      if (conflict) {
        return err(
          res,
          'Another variant already has this size, color, and material combination',
          409
        )
      }

      // SKU collision check (exclude self)
      const newSku = updates.sku !== undefined ? updates.sku?.trim() || null : current.sku
      if (newSku && newSku !== current.sku) {
        const [skuConflict] = await db
          .select({ id: productVariantsNew.id })
          .from(productVariantsNew)
          .where(and(eq(productVariantsNew.sku, newSku), ne(productVariantsNew.id, variantId)))
          .limit(1)
        if (skuConflict) return err(res, `SKU "${newSku}" already exists`, 409)
      }

      const setValues: Record<string, unknown> = { updatedAt: new Date() }
      if (updates.size !== undefined) setValues.size = merged.size
      if (updates.color !== undefined) setValues.color = merged.color
      if (updates.material !== undefined) setValues.material = merged.material
      if (updates.price_adjustment !== undefined)
        setValues.priceAdjustment = String(updates.price_adjustment)
      if (updates.sku !== undefined) setValues.sku = newSku
      if (updates.stock_quantity !== undefined) setValues.stockQuantity = updates.stock_quantity
      if (updates.is_available !== undefined) setValues.isAvailable = updates.is_available
      if (updates.image_url !== undefined) setValues.imageUrl = updates.image_url

      const [updated] = await db
        .update(productVariantsNew)
        .set(setValues)
        .where(
          and(eq(productVariantsNew.id, variantId), eq(productVariantsNew.productId, productId))
        )
        .returning()

      if (!updated) return err(res, 'Variant not found', 404)
      log.debug('[API/admin/product-variants/[variantId]] Updated variant:', variantId)
      return ok(res, updated)
    }

    if (req.method === 'DELETE') {
      await db
        .delete(productVariantsNew)
        .where(
          and(eq(productVariantsNew.id, variantId), eq(productVariantsNew.productId, productId))
        )

      log.debug('[API/admin/product-variants/[variantId]] Deleted variant:', variantId)
      return ok(res, { success: true })
    }

    return err(res, 'Method not allowed', 405)
  } catch (error) {
    log.error('[API/admin/product-variants/[productId]/[variantId]]', error)
    return err(res, 'Internal server error', 500)
  }
}
