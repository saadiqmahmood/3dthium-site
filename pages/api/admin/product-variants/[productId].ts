import { and, asc, eq, isNull } from 'drizzle-orm'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { err, ok } from '@/lib/api/respond'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { db, productsNew, productVariantsNew } from '@/lib/db'
import { log } from '@/lib/log'
import { hasAtLeastOneAttribute, normalizeVariantAttributes } from '@/utils/variantHelpers'

const CreateVariantSchema = z
  .object({
    size: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
    material: z.string().nullable().optional(),
    price_adjustment: z.coerce.number().default(0),
    sku: z.string().nullable().optional(),
    stock_quantity: z.coerce.number().int().min(0).default(0),
    is_available: z.boolean().default(true),
  })
  .refine(
    (d) => {
      const n = normalizeVariantAttributes(d)
      return hasAtLeastOneAttribute(n.size, n.color, n.material)
    },
    { message: 'At least one attribute (size, color, or material) is required' }
  )

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const { productId } = req.query
  if (!productId || typeof productId !== 'string') return err(res, 'Product ID is required', 400)

  try {
    if (req.method === 'GET') {
      const variants = await db
        .select({
          id: productVariantsNew.id,
          product_id: productVariantsNew.productId,
          size: productVariantsNew.size,
          color: productVariantsNew.color,
          material: productVariantsNew.material,
          price_adjustment: productVariantsNew.priceAdjustment,
          sku: productVariantsNew.sku,
          image_url: productVariantsNew.imageUrl,
          stock_quantity: productVariantsNew.stockQuantity,
          is_available: productVariantsNew.isAvailable,
          created_at: productVariantsNew.createdAt,
          updated_at: productVariantsNew.updatedAt,
        })
        .from(productVariantsNew)
        .where(eq(productVariantsNew.productId, productId))
        .orderBy(
          asc(productVariantsNew.size),
          asc(productVariantsNew.color),
          asc(productVariantsNew.material)
        )

      return ok(res, variants)
    }

    if (req.method === 'POST') {
      const parsed = CreateVariantSchema.safeParse(req.body)
      if (!parsed.success) {
        return err(res, parsed.error.errors[0]?.message ?? 'Validation failed', 400)
      }

      const body = parsed.data
      const norm = normalizeVariantAttributes(body)

      // Duplicate combination check
      const sizeCondition = norm.size
        ? eq(productVariantsNew.size, norm.size)
        : isNull(productVariantsNew.size)
      const colorCondition = norm.color
        ? eq(productVariantsNew.color, norm.color)
        : isNull(productVariantsNew.color)
      const materialCondition = norm.material
        ? eq(productVariantsNew.material, norm.material)
        : isNull(productVariantsNew.material)

      const [duplicate] = await db
        .select({ id: productVariantsNew.id })
        .from(productVariantsNew)
        .where(
          and(
            eq(productVariantsNew.productId, productId),
            sizeCondition,
            colorCondition,
            materialCondition
          )
        )
        .limit(1)

      if (duplicate) {
        return err(
          res,
          'A variant with this size, color, and material combination already exists',
          409
        )
      }

      // Resolve SKU
      let sku = body.sku?.trim() || null
      if (!sku) {
        const [product] = await db
          .select({ slug: productsNew.slug })
          .from(productsNew)
          .where(eq(productsNew.id, productId))
          .limit(1)

        if (product) {
          const parts = [
            product.slug.toUpperCase().replace(/-/g, ''),
            norm.size,
            norm.color?.substring(0, 3).toUpperCase(),
            norm.material?.substring(0, 3).toUpperCase(),
          ].filter(Boolean)
          const base = parts.join('-')
          sku = base
          let counter = 1
          while (true) {
            const [taken] = await db
              .select({ id: productVariantsNew.id })
              .from(productVariantsNew)
              .where(eq(productVariantsNew.sku, sku as string))
              .limit(1)
            if (!taken) break
            sku = `${base}-${counter++}`
          }
        }
      } else {
        const [skuConflict] = await db
          .select({ id: productVariantsNew.id })
          .from(productVariantsNew)
          .where(eq(productVariantsNew.sku, sku))
          .limit(1)
        if (skuConflict) return err(res, `SKU "${sku}" already exists`, 409)
      }

      const [newVariant] = await db
        .insert(productVariantsNew)
        .values({
          productId,
          size: norm.size,
          color: norm.color,
          material: norm.material,
          priceAdjustment: String(body.price_adjustment),
          sku,
          stockQuantity: body.stock_quantity,
          isAvailable: body.is_available,
        })
        .returning()

      log.debug('[API/admin/product-variants] Created variant:', newVariant.id)
      return ok(res, newVariant, 201)
    }

    return err(res, 'Method not allowed', 405)
  } catch (error) {
    log.error('[API/admin/product-variants/[productId]]', error)
    return err(res, 'Internal server error', 500)
  }
}
