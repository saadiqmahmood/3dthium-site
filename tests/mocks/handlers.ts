import { http, HttpResponse } from 'msw'

const SHIPPO_BASE = 'https://api.goshippo.com'
const STRIPE_BASE = 'https://api.stripe.com'

export const handlers = [
  // Shippo rate lookup — returns a fixed £5.99 shipping rate
  http.get(`${SHIPPO_BASE}/rates/:rateId`, ({ params }) => {
    return HttpResponse.json({
      object_id: params.rateId,
      amount: '5.99',
      currency: 'GBP',
      provider: 'HERMES',
      servicelevel: { name: 'Standard' },
    })
  }),

  // Stripe checkout session create
  http.post(`${STRIPE_BASE}/v1/checkout/sessions`, () => {
    return HttpResponse.json({
      id: 'cs_test_mock',
      url: 'https://checkout.stripe.com/mock',
    })
  }),
]
