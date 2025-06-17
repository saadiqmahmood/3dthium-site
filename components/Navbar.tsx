import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useEffect, useState } from 'react'

export default function Navbar() {
    const { cart } = useCart()
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

    const [animate, setAnimate] = useState(false)

    useEffect(() => {
        if (totalItems === 0) return
        setAnimate(true)
        const timeout = setTimeout(() => setAnimate(false), 300)
        return () => clearTimeout(timeout)
      }, [totalItems])

    const CartIcon = () => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            className="w-6 h-6 fill-gray-600"
        >
            <path
                d="M29.74 8.32A1 1 0 0 0 29 8H13a1 1 0 0 0 0 2h14.91l-.81 9.48a1.87 1.87 0 0 1-2 1.52H12.88a1.87 1.87 0 0 1-2-1.52L10 8.92v-.16L9.33 6.2A3.89 3.89 0 0 0 7 3.52L3.37 2.07a1 1 0 0 0-.74 1.86l3.62 1.45a1.89 1.89 0 0 1 1.14 1.3L8 9.16l.9 10.49a3.87 3.87 0 0 0 4 3.35h.1v2.18a3 3 0 1 0 2 0V23h8v2.18a3 3 0 1 0 2 0V23h.12a3.87 3.87 0 0 0 4-3.35L30 9.08a1 1 0 0 0-.26-.76zM14 29a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm10 0a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"
            />
            <path
                d="M15 18v-5a1 1 0 0 0-2 0v5a1 1 0 0 0 2 0zM20 18v-5a1 1 0 0 0-2 0v5a1 1 0 0 0 2 0zM25 18v-5a1 1 0 0 0-2 0v5a1 1 0 0 0 2 0z"
            />
        </svg>
      )
    return (
      <nav className="bg-white px-6 py-4 flex justify-between items-center">
          <a href="/" className="text-4xl pl-10 font-bold text-blue-500">3Dthium</a>
          <div className="space-x-7 pr-10 text-sm font-medium text-gray-600 flex items-center">
            <a href="/" className="hover:text-text-stone-800 text-base">Home</a>
            <a href="/products" className="hover:text-text-stone-800 text-base">Shop</a>
            <a href="/custom-order" className="hover:text-text-stone-800 text-base">Custom Order</a>
            <a href="/about" className="hover:text-text-stone-800 text-base">About</a>
            <a href="/contact" className="hover:text-text-stone-800 text-base">Contact</a>
            <Link href="/cart" className="hover:text-blue-600">
                <div className="relative w-6 h-6">
                    <CartIcon />

                    {totalItems > 0 && (
                        <span
                            className={`absolute -top-2 -right-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium leading-none transition-transform duration-300 ease-out ${animate ? 'scale-110' : 'scale-100'
                                }`}
                        >
                            {totalItems}
                        </span>
                    )}
                </div>
            </Link>
          </div>
      </nav>
  )
}
