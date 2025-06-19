import { useCart } from '@/context/CartContext'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function CartPage() {
  const { cart, removeFromCart, clearCart } = useCart()
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
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

      <h1 className="text-3xl font-bold mb-8 text-blue-600">Your Cart</h1>

      <div className="space-y-6">
        {cart.map((item) => (
          <div key={item.id} className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-4">
              <Image width={300} height={300} src={item.image} alt={item.title} className="w-20 h-20 object-cover rounded" />
              <div>
                <h3 className="font-semibold text-gray-800">{item.title}</h3>
                <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                <p className="text-sm text-gray-500">Material: {item.material}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-700 font-medium">£{(item.price * item.quantity).toFixed(2)}</p>
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-red-500 text-sm hover:underline mt-1"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xl font-semibold text-gray-900">Total: £{total.toFixed(2)}</p>
        <div className="flex gap-4">
          <Link href="/products">
            <button className="bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200">
              Continue Shopping
            </button>
          </Link>
          <button
            onClick={() => {
                setTimeout(() => clearCart(), 300)
              }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  )
}
