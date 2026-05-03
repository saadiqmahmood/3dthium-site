import { desc, eq } from 'drizzle-orm'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { err, ok } from '@/lib/api/respond'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { categories, db, productsNew } from '@/lib/db'
import { log } from '@/lib/log'

const CreateProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  category_id: z.string().uuid('Invalid category ID'),
  base_price: z.coerce.number().positive('Base price must be greater than 0'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  thumbnail_url: z.string().url().nullable().optional(),
  images: z.array(z.string()).min(1, 'At least one image is required'),
  gallery_images: z.array(z.string()).optional().default([]),
  is_active: z.boolean().optional().default(true),
  customizable: z.boolean().optional().default(false),
  attributes: z.record(z.unknown()).optional().default({}),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    if (req.method === 'GET') {
      const rows = await db
        .select({
          id: productsNew.id,
          name: productsNew.name,
          description: productsNew.description,
          category_id: productsNew.categoryId,
          base_price: productsNew.basePrice,
          thumbnail_url: productsNew.thumbnailUrl,
          slug: productsNew.slug,
          is_active: productsNew.isActive,
          customizable: productsNew.customizable,
          attributes: productsNew.attributes,
          images: productsNew.images,
          created_at: productsNew.createdAt,
          updated_at: productsNew.updatedAt,
          categories: {
            name: categories.name,
            slug: categories.slug,
          },
        })
        .from(productsNew)
        .leftJoin(categories, eq(productsNew.categoryId, categories.id))
        .orderBy(desc(productsNew.createdAt))

      return ok(res, rows)
    }

    if (req.method === 'POST') {
      const parsed = CreateProductSchema.safeParse(req.body)
      if (!parsed.success) {
        return err(res, 'Validation failed', 400, parsed.error.flatten().fieldErrors)
      }

      const body = parsed.data

      const [existing] = await db
        .select({ id: productsNew.id })
        .from(productsNew)
        .where(eq(productsNew.slug, body.slug))
        .limit(1)
      if (existing) return err(res, 'Slug already exists', 400)

      const [newProduct] = await db
        .insert(productsNew)
        .values({
          name: body.name,
          description: body.description,
          categoryId: body.category_id,
          basePrice: String(body.base_price),
          thumbnailUrl: body.thumbnail_url ?? body.images[0],
          slug: body.slug,
          isActive: body.is_active ?? true,
          customizable: body.customizable ?? false,
          attributes: body.attributes ?? {},
          images: body.images,
          galleryImages: body.gallery_images ?? [],
        })
        .returning()

      log.debug('[API/admin/products] Created product:', newProduct.id)
      return ok(res, newProduct, 201)
    }

    return err(res, 'Method not allowed', 405)
  } catch (error) {
    log.error('[API/admin/products]', error)
    return err(res, 'Internal server error', 500)
  }
}
