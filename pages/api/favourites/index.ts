import { desc, eq } from 'drizzle-orm'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { err, ok } from '@/lib/api/respond'
import { requireUser } from '@/lib/auth/requireUser'
import { db, productsNew, userFavourites } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const identity = await requireUser(req, res)
  if (!identity) return

  if (req.method === 'GET') {
    const rows = await db
      .select({
        productId: userFavourites.productId,
        createdAt: userFavourites.createdAt,
        product: {
          id: productsNew.id,
          name: productsNew.name,
          slug: productsNew.slug,
          base_price: productsNew.basePrice,
          thumbnail_url: productsNew.thumbnailUrl,
        },
      })
      .from(userFavourites)
      .leftJoin(productsNew, eq(userFavourites.productId, productsNew.id))
      .where(eq(userFavourites.userId, identity.dbUserId))
      .orderBy(desc(userFavourites.createdAt))

    return ok(res, {
      productIds: rows.map((r) => r.productId),
      products: rows.map((r) => r.product).filter(Boolean),
    })
  }

  if (req.method === 'POST') {
    const parsed = z.object({ product_id: z.string().uuid() }).safeParse(req.body)
    if (!parsed.success) return err(res, 'Invalid product ID', 400)

    await db
      .insert(userFavourites)
      .values({ userId: identity.dbUserId, productId: parsed.data.product_id })
      .onConflictDoNothing()

    return ok(res, { success: true })
  }

  return err(res, 'Method not allowed', 405)
}
