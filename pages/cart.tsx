import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useCart } from '@/context/CartContext'
import { formatMoney } from '@/lib/format/money'
import type { CartQuote } from '@/lib/pricing/quoteCart'

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

export default function CartPage() {
  const { cart, removeFromCart, clearCart, updateCartItemQuantity } = useCart()
  const router = useRouter()
  const { from } = router.query
  const [quote, setQuote] = useState<CartQuote | null>(null)

  useEffect(() => {
    if (cart.length === 0) {
      setQuote(null)
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
      .catch(() => {})
  }, [cart])

  const backHref = from && typeof from === 'string' ? from : '/products'

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        {/* Back */}
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-8 group"
        >
          <svg
            aria-hidden="true"
            focusable="false"
            className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Continue shopping
        </Link>

        <h1 className="text-3xl font-light text-zinc-900 mb-10">
          Your Cart{' '}
          {cart.length > 0 && (
            <span className="text-lg text-zinc-400 font-light ml-1">
              ({cart.reduce((s, i) => s + i.quantity, 0)}{' '}
              {cart.reduce((s, i) => s + i.quantity, 0) === 1 ? 'item' : 'items'})
            </span>
          )}
        </h1>

        {cart.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
              <svg
                aria-hidden="true"
                focusable="false"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                className="w-10 h-10 fill-zinc-300"
              >
                <title>Empty cart</title>
                <path d="M29.74 8.32A1 1 0 0 0 29 8H13a1 1 0 0 0 0 2h14.91l-.81 9.48a1.87 1.87 0 0 1-2 1.52H12.88a1.87 1.87 0 0 1-2-1.52L10 8.92v-.16L9.33 6.2A3.89 3.89 0 0 0 7 3.52L3.37 2.07a1 1 0 0 0-.74 1.86l3.62 1.45a1.89 1.89 0 0 1 1.14 1.3L8 9.16l.9 10.49a3.87 3.87 0 0 0 4 3.35h.1v2.18a3 3 0 1 0 2 0V23h8v2.18a3 3 0 1 0 2 0V23h.12a3.87 3.87 0 0 0 4-3.35L30 9.08a1 1 0 0 0-.26-.76zM14 29a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm10 0a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" />
              </svg>
            </div>
            <h2 className="text-2xl font-light text-zinc-900 mb-2">Your cart is empty</h2>
            <p className="text-zinc-500 font-light mb-8">
              Looks like you haven&apos;t added anything yet.
            </p>
            <Link
              href="/products"
              className="bg-zinc-900 text-white px-8 py-3 rounded-lg hover:bg-zinc-800 transition-colors font-medium text-sm"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-12 lg:items-start">
            {/* Item list */}
            <div className="space-y-3">
              {cart.map((item) => {
                const lineTotal =
                  quote?.items.find(
                    (qi) =>
                      qi.product_id === item.product_id &&
                      qi.variant_id === (item.variant_id ?? null)
                  )?.line_total ?? item.price * item.quantity

                const variantLabel = [item.size, item.color, item.material]
                  .filter(Boolean)
                  .join(' · ')

                return (
                  <div
                    key={`${item.product_id}-${item.variant_id || 'base'}`}
                    className="flex gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm"
                  >
                    {/* Image */}
                    <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-50">
                      <Image
                        width={80}
                        height={80}
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-medium text-zinc-900 leading-snug">
                            {item.name}
                          </h3>
                          {variantLabel && (
                            <p className="text-xs text-zinc-500 font-light mt-0.5">
                              {variantLabel}
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-zinc-900 flex-shrink-0">
                          {formatMoney(lineTotal)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity control */}
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-gray-50 transition-colors disabled:opacity-30 text-base"
                            onClick={() =>
                              updateCartItemQuantity(
                                item.product_id,
                                item.variant_id || undefined,
                                item.quantity - 1
                              )
                            }
                            disabled={item.quantity <= 1}
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm font-medium text-zinc-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-gray-50 transition-colors text-base"
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

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(item.product_id, item.variant_id || undefined)
                          }
                          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-500 transition-colors"
                          aria-label={`Remove ${item.name}`}
                        >
                          <TrashIcon />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Clear cart */}
              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => clearCart()}
                  className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
                >
                  Clear all items
                </button>
              </div>
            </div>

            {/* Order summary */}
            <div className="mt-8 lg:mt-0 sticky top-24">
              <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="text-base font-medium text-zinc-900">Order Summary</h2>
                </div>

                <div className="px-6 py-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 font-light">Subtotal</span>
                    <span className="text-zinc-900 font-medium">
                      {formatMoney(
                        quote?.total ??
                          cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 font-light">Shipping</span>
                    <span className="text-zinc-400 font-light text-xs">Calculated at checkout</span>
                  </div>
                </div>

                <div className="px-6 pb-2 border-t border-gray-100">
                  <div className="flex justify-between items-baseline py-4">
                    <span className="text-base font-medium text-zinc-900">Total</span>
                    <span className="text-xl font-semibold text-zinc-900">
                      {formatMoney(
                        quote?.total ??
                          cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
                      )}
                    </span>
                  </div>

                  <Link href="/checkout">
                    <button
                      type="button"
                      className="w-full bg-zinc-900 text-white py-3.5 rounded-xl hover:bg-zinc-800 active:scale-[0.99] transition-all font-medium text-sm mb-3"
                    >
                      Checkout
                    </button>
                  </Link>

                  <Link href="/products">
                    <button
                      type="button"
                      className="w-full border border-gray-200 text-zinc-700 py-3 rounded-xl hover:bg-gray-50 transition-colors font-light text-sm mb-4"
                    >
                      Continue Shopping
                    </button>
                  </Link>

                  <p className="text-center text-xs text-zinc-400 pb-2">
                    Secure checkout · Made in the UK
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
