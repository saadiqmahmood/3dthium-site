import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useCart } from '@/context/CartContext'

// Helper function for dynamic price calculation
function getDynamicPrice(variant: { color: string }, size: string): number {
  let basePrice = 16.99
  if (variant.color && variant.color.includes('And')) {
    basePrice = 17.99
  }
  if (size === '210mm') {
    return basePrice - 4
  } else if (size === '180mm') {
    return basePrice - 7
  } else if (size === '150mm') {
    return basePrice - 10
  } else if (size === '240mm') {
    return basePrice
  }
  return basePrice
}

export default function CartPage() {
  const { cart, removeFromCart, clearCart, updateCartItemQuantity } = useCart()
  const total = cart.reduce(
    (acc, item) => acc + getDynamicPrice(item.variant, item.size) * item.quantity,
    0
  )
  const router = useRouter()
  const { from } = router.query

  useEffect(() => {
    if (cart.length === 0) {
      router.replace(from && typeof from === 'string' ? from : '/')
    }
  }, [cart, from, router])

  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <button
        onClick={() => {
          if (from && typeof from === 'string') {
            router.push(from)
          } else {
            router.push('/products') // fallback
          }
        }}
        className="mb-6 text-sm text-blue-600 hover:underline"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-8 text-stone-800">Your Cart</h1>

      <div className="space-y-6">
        {cart.map((item) => (
          <div
            key={item.product.id + '-' + item.variant.id}
            className="flex items-center justify-between border-b pb-4"
          >
            <div className="flex items-center gap-4">
              <Image
                width={100}
                height={100}
                src={item.variant.image_url}
                alt={item.product.title + ' - ' + item.variant.color}
                className="w-20 h-20 object-cover rounded"
              />
              <div>
                <h3 className="font-semibold text-gray-800">{item.product.title}</h3>
                <p className="text-sm text-gray-500">Size: {item.size}</p>
                <p className="text-sm text-gray-500">Color: {item.variant.color}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    aria-label="Decrease quantity"
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-gray-700"
                    onClick={() =>
                      updateCartItemQuantity(
                        item.product.id,
                        item.variant.id,
                        item.size,
                        item.quantity - 1
                      )
                    }
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span className="text-sm text-gray-800 w-6 text-center inline-block">
                    {item.quantity}
                  </span>
                  <button
                    aria-label="Increase quantity"
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-gray-700"
                    onClick={() =>
                      updateCartItemQuantity(
                        item.product.id,
                        item.variant.id,
                        item.size,
                        item.quantity + 1
                      )
                    }
                  >
                    +
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  Customizable: {item.variant.customizable ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-700 font-medium">
                £{(getDynamicPrice(item.variant, item.size) * item.quantity).toFixed(2)}
              </p>
              <button
                onClick={() => removeFromCart(item.product.id, item.variant.id, item.size)}
                className="text-red-500 text-sm hover:underline mt-1"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col md:flex-row justify-between items-center">
        <p className="text-xl font-semibold text-gray-900">Total: £{total.toFixed(2)}</p>
        <div className="flex flex-wrap gap-4 w-full md:w-auto mt-6 md:mt-0">
          <Link href="/products">
            <button className="bg-gray-100 text-gray-800 px-3 py-2 md:px-4 md:py-2 rounded hover:bg-gray-200 text-sm">
              Continue Shopping
            </button>
          </Link>
          <Link href="/checkout">
            <button className="bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2 rounded hover:bg-blue-700 text-sm">
              Checkout
            </button>
          </Link>
          <button
            onClick={() => {
              setTimeout(() => clearCart(), 300)
            }}
            className="bg-red-600 text-white px-3 py-2 md:px-4 md:py-2 rounded hover:bg-red-700 text-sm w-full sm:w-auto mt-4 sm:mt-0"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
