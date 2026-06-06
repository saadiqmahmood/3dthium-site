import { and, eq } from 'drizzle-orm'
import type { NextApiRequest, NextApiResponse } from 'next'
import { err, ok } from '@/lib/api/respond'
import { requireUser } from '@/lib/auth/requireUser'
import { db, userFavourites } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const identity = await requireUser(req, res)
  if (!identity) return

  const { productId } = req.query
  if (!productId || typeof productId !== 'string') return err(res, 'Invalid product ID', 400)

  if (req.method === 'DELETE') {
    await db
      .delete(userFavourites)
      .where(
        and(eq(userFavourites.userId, identity.dbUserId), eq(userFavourites.productId, productId))
      )
    return ok(res, { success: true })
  }

  return err(res, 'Method not allowed', 405)
}
