import { and, eq, ne } from 'drizzle-orm'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { err, ok } from '@/lib/api/respond'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { categories, db, productsNew } from '@/lib/db'
import { log } from '@/lib/log'

const UpdateProductSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    category_id: z.string().uuid().optional(),
    base_price: z.coerce.number().positive().optional(),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens')
      .optional(),
    thumbnail_url: z.string().url().nullable().optional(),
    images: z.array(z.string()).optional(),
    gallery_images: z.array(z.string()).optional(),
    is_active: z.boolean().optional(),
    customizable: z.boolean().optional(),
    attributes: z.record(z.unknown()).optional(),
  })
  .strict()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const { id } = req.query
  if (!id || typeof id !== 'string') return err(res, 'Invalid product ID', 400)

  try {
    if (req.method === 'GET') {
      const [product] = await db
        .select({
          id: productsNew.id,
          name: productsNew.name,
          description: productsNew.description,
          category_id: productsNew.categoryId,
          base_price: productsNew.basePrice,
          thumbnail_url: productsNew.thumbnailUrl,
          images: productsNew.images,
          gallery_images: productsNew.galleryImages,
          slug: productsNew.slug,
          is_active: productsNew.isActive,
          customizable: productsNew.customizable,
          attributes: productsNew.attributes,
          created_at: productsNew.createdAt,
          updated_at: productsNew.updatedAt,
          categories: {
            name: categories.name,
            slug: categories.slug,
          },
        })
        .from(productsNew)
        .leftJoin(categories, eq(productsNew.categoryId, categories.id))
        .where(eq(productsNew.id, id))
        .limit(1)

      if (!product) return err(res, 'Product not found', 404)
      return ok(res, product)
    }

    if (req.method === 'PUT') {
      const parsed = UpdateProductSchema.safeParse(req.body)
      if (!parsed.success) {
        return err(res, 'Validation failed', 400, parsed.error.flatten().fieldErrors)
      }

      const body = parsed.data

      if (body.slug) {
        const [conflict] = await db
          .select({ id: productsNew.id })
          .from(productsNew)
          .where(and(eq(productsNew.slug, body.slug), ne(productsNew.id, id)))
          .limit(1)
        if (conflict) return err(res, 'Slug already exists', 400)
      }

      const updateValues: Record<string, unknown> = { updatedAt: new Date() }
      if (body.name !== undefined) updateValues.name = body.name
      if (body.description !== undefined) updateValues.description = body.description
      if (body.category_id !== undefined) updateValues.categoryId = body.category_id
      if (body.base_price !== undefined) updateValues.basePrice = String(body.base_price)
      if (body.slug !== undefined) updateValues.slug = body.slug
      if (body.thumbnail_url !== undefined) updateValues.thumbnailUrl = body.thumbnail_url
      if (body.images !== undefined) updateValues.images = body.images
      if (body.gallery_images !== undefined) updateValues.galleryImages = body.gallery_images
      if (body.is_active !== undefined) updateValues.isActive = body.is_active
      if (body.customizable !== undefined) updateValues.customizable = body.customizable
      if (body.attributes !== undefined) updateValues.attributes = body.attributes

      const [updated] = await db
        .update(productsNew)
        .set(updateValues)
        .where(eq(productsNew.id, id))
        .returning()

      if (!updated) return err(res, 'Product not found', 404)
      log.debug('[API/admin/products/[id]] Updated product:', id)
      return ok(res, updated)
    }

    if (req.method === 'DELETE') {
      await db.delete(productsNew).where(eq(productsNew.id, id))
      log.debug('[API/admin/products/[id]] Deleted product:', id)
      return ok(res, { success: true })
    }

    return err(res, 'Method not allowed', 405)
  } catch (error) {
    log.error('[API/admin/products/[id]]', error)
    return err(res, 'Internal server error', 500)
  }
}
