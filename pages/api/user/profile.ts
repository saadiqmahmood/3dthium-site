import { eq } from 'drizzle-orm'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { err, ok } from '@/lib/api/respond'
import { requireUser } from '@/lib/auth/requireUser'
import { db, users } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const identity = await requireUser(req, res)
  if (!identity) return

  if (req.method === 'GET') {
    const [row] = await db
      .select({ fullName: users.fullName, email: users.email })
      .from(users)
      .where(eq(users.id, identity.dbUserId))
      .limit(1)

    return ok(res, { full_name: row?.fullName ?? '' })
  }

  if (req.method === 'PATCH') {
    const parsed = z.object({ full_name: z.string().max(64) }).safeParse(req.body)
    if (!parsed.success) return err(res, 'Invalid data', 400)

    await db
      .update(users)
      .set({ fullName: parsed.data.full_name.trim() })
      .where(eq(users.id, identity.dbUserId))

    return ok(res, { success: true })
  }

  return err(res, 'Method not allowed', 405)
}
