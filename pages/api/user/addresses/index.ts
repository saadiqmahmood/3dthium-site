import { eq } from 'drizzle-orm'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { err, ok } from '@/lib/api/respond'
import { requireUser } from '@/lib/auth/requireUser'
import { db, userAddresses } from '@/lib/db'

const addressSchema = z.object({
  label: z.string().max(32).default(''),
  name: z.string().min(1, 'Name is required').max(100),
  line1: z.string().min(1, 'Address line 1 is required').max(200),
  line2: z.string().max(200).default(''),
  city: z.string().min(1, 'City is required').max(100),
  postcode: z.string().min(1, 'Postcode is required').max(20),
  country: z.string().length(2).default('GB'),
  phone: z.string().max(30).default(''),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const identity = await requireUser(req, res)
  if (!identity) return

  if (req.method === 'GET') {
    const rows = await db
      .select()
      .from(userAddresses)
      .where(eq(userAddresses.userId, identity.dbUserId))
      .orderBy(userAddresses.createdAt)

    return ok(res, rows)
  }

  if (req.method === 'POST') {
    const parsed = addressSchema.safeParse(req.body)
    if (!parsed.success) return err(res, 'Invalid address', 400, parsed.error.flatten())

    const existing = await db
      .select({ id: userAddresses.id })
      .from(userAddresses)
      .where(eq(userAddresses.userId, identity.dbUserId))

    const [created] = await db
      .insert(userAddresses)
      .values({ userId: identity.dbUserId, isDefault: existing.length === 0, ...parsed.data })
      .returning()

    return ok(res, created, 201)
  }

  return err(res, 'Method not allowed', 405)
}
