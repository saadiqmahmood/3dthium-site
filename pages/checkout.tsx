import { useCart } from '@/context/CartContext'
import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'

export default function CheckoutPage() {
  const { cart, clearCart } = useCart()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const router = useRouter()
  const total = cart.reduce((acc, item) => acc + item.variant.price * item.quantity, 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setEmailError('Please enter a valid email address.')
      return
    }
    setEmailError('')
    // Here you would proceed to payment or order creation
    alert('Checkout not implemented yet. Email: ' + email)
    clearCart()
    router.push('/')
  }

  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 text-sm text-blue-600 hover:underline flex items-center"
      >
        ← Back
      </button>
      <h1 className="text-3xl font-bold mb-8 text-stone-800 text-center">Checkout</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-8 mb-10 max-w-lg mx-auto">
        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
        <input
          type="email"
          className="w-full border border-gray-300 rounded p-2 mb-2"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        {emailError && <p className="text-red-500 text-sm mb-2">{emailError}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition mt-2"
        >
          Place Order
        </button>
      </form>
      <div className="bg-gray-50 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-stone-800">Order Summary</h2>
        <div className="space-y-6">
          {cart.map((item) => (
            <div key={item.product.id + '-' + item.variant.id} className="flex items-center gap-4 border-b pb-4">
              <Image width={80} height={80} src={item.variant.image_url} alt={item.product.title + ' - ' + item.variant.color} className="w-16 h-16 object-cover rounded" />
              <div>
                <h3 className="font-semibold text-gray-800">{item.product.title}</h3>
                <p className="text-sm text-gray-500">Color: {item.variant.color}</p>
                <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                <p className="text-sm text-gray-500">Customizable: {item.variant.customizable ? 'Yes' : 'No'}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-gray-700 font-medium">£{(item.variant.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-between items-center">
          <p className="text-lg font-semibold text-gray-900">Total:</p>
          <p className="text-xl font-bold text-blue-600">£{total.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
} 