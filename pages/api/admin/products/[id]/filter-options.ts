import { eq } from 'drizzle-orm'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { err, ok } from '@/lib/api/respond'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { db, productColorOptions, productHeightOptions, productRoomOptions } from '@/lib/db'

const PutSchema = z.object({
  color_option_ids: z.array(z.string().uuid()),
  height_option_ids: z.array(z.string().uuid()),
  room_option_ids: z.array(z.string().uuid()),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const productId = typeof req.query.id === 'string' ? req.query.id : null
  if (!productId) return err(res, 'id required', 400)

  if (req.method === 'GET') {
    const [colors, heights, rooms] = await Promise.all([
      db.select().from(productColorOptions).where(eq(productColorOptions.productId, productId)),
      db.select().from(productHeightOptions).where(eq(productHeightOptions.productId, productId)),
      db.select().from(productRoomOptions).where(eq(productRoomOptions.productId, productId)),
    ])
    return ok(res, {
      color_option_ids: colors.map((r) => r.colorOptionId),
      height_option_ids: heights.map((r) => r.heightOptionId),
      room_option_ids: rooms.map((r) => r.roomOptionId),
    })
  }

  if (req.method === 'PUT') {
    const parsed = PutSchema.safeParse(req.body)
    if (!parsed.success) return err(res, parsed.error.issues[0].message, 400)

    const { color_option_ids, height_option_ids, room_option_ids } = parsed.data

    await db.transaction(async (tx) => {
      await tx.delete(productColorOptions).where(eq(productColorOptions.productId, productId))
      await tx.delete(productHeightOptions).where(eq(productHeightOptions.productId, productId))
      await tx.delete(productRoomOptions).where(eq(productRoomOptions.productId, productId))

      if (color_option_ids.length > 0) {
        await tx
          .insert(productColorOptions)
          .values(color_option_ids.map((colorOptionId) => ({ productId, colorOptionId })))
      }
      if (height_option_ids.length > 0) {
        await tx
          .insert(productHeightOptions)
          .values(height_option_ids.map((heightOptionId) => ({ productId, heightOptionId })))
      }
      if (room_option_ids.length > 0) {
        await tx
          .insert(productRoomOptions)
          .values(room_option_ids.map((roomOptionId) => ({ productId, roomOptionId })))
      }
    })

    return ok(res, { color_option_ids, height_option_ids, room_option_ids })
  }

  res.setHeader('Allow', ['GET', 'PUT'])
  return res.status(405).end()
}
