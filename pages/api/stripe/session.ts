import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }
  const { session_id } = req.query
  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ message: 'Missing session_id' })
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id)
    res.status(200).json({
      promo_code: session.metadata?.promo_code || null,
      discount: session.metadata?.discount || null,
    })
  } catch {
    res.status(500).json({ message: 'Failed to fetch session' })
  }
}
