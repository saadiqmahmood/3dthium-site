import { and, eq, isNull, lt, or, sql } from 'drizzle-orm'
import type { NextApiRequest, NextApiResponse } from 'next'
import { promoCodes } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { log } from '@/lib/log'

/**
 * Atomically increment promo_code.uses after a confirmed payment.
 * Only increments when max_uses has not been reached, preventing races.
 * Called from the Stripe webhook — not a public endpoint.
 */
export async function applyPromoCode(promoId: string): Promise<boolean> {
  try {
    const result = await db
      .update(promoCodes)
      .set({ uses: sql`${promoCodes.uses} + 1` })
      .where(
        and(
          eq(promoCodes.id, promoId),
          or(isNull(promoCodes.maxUses), lt(promoCodes.uses, promoCodes.maxUses!))
        )
      )
      .returning({ id: promoCodes.id })

    return result.length > 0
  } catch (err) {
    log.error('Failed to increment promo uses:', err)
    return false
  }
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  return res.status(404).json({ error: 'Not found' })
}
