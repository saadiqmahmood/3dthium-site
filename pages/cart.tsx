import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useCart } from '@/context/CartContext'
import { formatMoney } from '@/lib/format/money'
import type { CartQuote } from '@/lib/pricing/quoteCart'

export default function CartPage() {
  const { cart, removeFromCart, clearCart, updateCartItemQuantity } = useCart()
  const router = useRouter()
  const { from } = router.query
  const [quote, setQuote] = useState<CartQuote | null>(null)

  useEffect(() => {
    if (cart.length === 0) {
      router.replace(from && typeof from === 'string' ? from : '/')
      return
    }
    fetch('/api/cart/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cart: cart.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id ?? null,
          quantity: i.quantity,
          name: i.name,
          image_url: i.image_url,
        })),
      }),
    })
      .then((r) => r.json())
      .then((q) => {
        if (q.total !== undefined) setQuote(q)
      })
      .catch(() => {}) // keep showing client-side fallback on network error
  }, [cart, from, router])

  return (
    <div className="min-h-screen bg-white pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        <button
          type="button"
          onClick={() => {
            if (from && typeof from === 'string') {
              router.push(from)
            } else {
              router.push('/products') // fallback
            }
          }}
          className="mb-6 text-base text-emerald-600 hover:text-emerald-700 transition-colors font-light"
        >
          ← Back
        </button>

        <h1 className="text-4xl font-light text-zinc-900 mb-8">Your Cart</h1>

        <div className="space-y-4">
          {cart.map((item) => (
            <div
              key={`${item.product_id}-${item.variant_id || 'base'}`}
              className="flex items-center justify-between p-6 bg-gray-50 border border-gray-200 rounded-2xl"
            >
              <div className="flex items-center gap-4">
                <Image
                  width={100}
                  height={100}
                  src={item.image_url}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded"
                />
                <div>
                  <h3 className="font-medium text-zinc-900 text-lg">{item.name}</h3>
                  <p className="text-base text-zinc-600 font-light">
                    {[item.size, item.color, item.material].filter(Boolean).join(' • ') ||
                      'Base product'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300 text-zinc-900 border border-gray-300 disabled:opacity-50"
                      onClick={() =>
                        updateCartItemQuantity(
                          item.product_id,
                          item.variant_id || undefined,
                          item.quantity - 1
                        )
                      }
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="text-base text-zinc-900 w-8 text-center inline-block font-medium">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      className="px-3 py-1 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-white border border-zinc-700"
                      onClick={() =>
                        updateCartItemQuantity(
                          item.product_id,
                          item.variant_id || undefined,
                          item.quantity + 1
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-zinc-900 font-semibold text-lg">
                  {formatMoney(
                    quote?.items.find(
                      (qi) =>
                        qi.product_id === item.product_id &&
                        qi.variant_id === (item.variant_id ?? null)
                    )?.line_total ?? item.price * item.quantity
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.product_id, item.variant_id || undefined)}
                  className="text-red-600 text-base hover:text-red-700 transition-colors mt-2 font-light"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <p className="text-xl font-light text-zinc-700">Total:</p>
            <p className="text-2xl font-semibold text-zinc-900">
              {formatMoney(
                quote?.total ?? cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
              )}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/products" className="flex-1">
              <button
                type="button"
                className="w-full border border-gray-300 text-zinc-900 px-6 py-3 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-colors font-medium"
              >
                Continue Shopping
              </button>
            </Link>
            <Link href="/checkout" className="flex-1">
              <button
                type="button"
                className="w-full bg-zinc-900 text-white px-6 py-3 rounded-lg hover:bg-zinc-800 transition-colors font-medium"
              >
                Checkout
              </button>
            </Link>
          </div>
          <button
            type="button"
            onClick={() => {
              setTimeout(() => clearCart(), 300)
            }}
            className="w-full mt-3 text-red-600 hover:text-red-700 text-base transition-colors font-light"
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  )
}
