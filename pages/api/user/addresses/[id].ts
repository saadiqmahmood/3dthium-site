import { and, eq } from 'drizzle-orm'
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

  const { id } = req.query
  if (typeof id !== 'string') return err(res, 'Invalid ID', 400)

  const [address] = await db
    .select()
    .from(userAddresses)
    .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, identity.dbUserId)))

  if (!address) return err(res, 'Address not found', 404)

  // PUT — update fields
  if (req.method === 'PUT') {
    const parsed = addressSchema.safeParse(req.body)
    if (!parsed.success) return err(res, 'Invalid address', 400, parsed.error.flatten())

    const [updated] = await db
      .update(userAddresses)
      .set(parsed.data)
      .where(eq(userAddresses.id, id))
      .returning()

    return ok(res, updated)
  }

  // PATCH — set as default
  if (req.method === 'PATCH') {
    const parsed = z.object({ is_default: z.literal(true) }).safeParse(req.body)
    if (!parsed.success) return err(res, 'Invalid patch', 400)

    await db
      .update(userAddresses)
      .set({ isDefault: false })
      .where(eq(userAddresses.userId, identity.dbUserId))

    const [updated] = await db
      .update(userAddresses)
      .set({ isDefault: true })
      .where(eq(userAddresses.id, id))
      .returning()

    return ok(res, updated)
  }

  // DELETE
  if (req.method === 'DELETE') {
    await db.delete(userAddresses).where(eq(userAddresses.id, id))

    if (address.isDefault) {
      const [next] = await db
        .select({ id: userAddresses.id })
        .from(userAddresses)
        .where(eq(userAddresses.userId, identity.dbUserId))
        .limit(1)

      if (next) {
        await db.update(userAddresses).set({ isDefault: true }).where(eq(userAddresses.id, next.id))
      }
    }

    return ok(res, { success: true })
  }

  return err(res, 'Method not allowed', 405)
}
