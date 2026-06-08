import { eq } from 'drizzle-orm'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { err, ok } from '@/lib/api/respond'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { db, roomOptions } from '@/lib/db'

const BodySchema = z.object({
  name: z.string().min(1),
  sort_order: z.coerce.number().int().optional().default(0),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method === 'POST') {
    const parsed = BodySchema.safeParse(req.body)
    if (!parsed.success) return err(res, parsed.error.issues[0].message, 400)
    const [row] = await db
      .insert(roomOptions)
      .values({ name: parsed.data.name, sortOrder: parsed.data.sort_order })
      .returning()
    return ok(res, { room: row })
  }

  if (req.method === 'PUT') {
    const id = typeof req.query.id === 'string' ? req.query.id : null
    if (!id) return err(res, 'id required', 400)
    const parsed = BodySchema.safeParse(req.body)
    if (!parsed.success) return err(res, parsed.error.issues[0].message, 400)
    const [row] = await db
      .update(roomOptions)
      .set({ name: parsed.data.name, sortOrder: parsed.data.sort_order })
      .where(eq(roomOptions.id, id))
      .returning()
    if (!row) return err(res, 'Not found', 404)
    return ok(res, { room: row })
  }

  if (req.method === 'DELETE') {
    const id = typeof req.query.id === 'string' ? req.query.id : null
    if (!id) return err(res, 'id required', 400)
    await db.delete(roomOptions).where(eq(roomOptions.id, id))
    return ok(res, { success: true })
  }

  res.setHeader('Allow', ['POST', 'PUT', 'DELETE'])
  return res.status(405).end()
}
