import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useEffect, useState } from 'react'

export default function Navbar() {
    const { cart } = useCart()
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
    const [isOpen, setIsOpen] = useState(false)
    const [animate, setAnimate] = useState(false)

    useEffect(() => {
        const handleResize = () => {
          if (window.innerWidth >= 768) {
            setIsOpen(false)
          }
        }
      
        window.addEventListener('resize', handleResize)
      
        return () => {
          window.removeEventListener('resize', handleResize)
        }
      }, [])

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
        <nav className="bg-white px-6 py-4 flex flex-col md:flex-row md:justify-between md:items-center">
            <div className="flex justify-between items-center w-full">
                <Link href="/" className="text-4xl pl-5 font-bold text-blue-500">3Dthium</Link>

                <div className="flex items-center gap-4">
                    <Link href="/cart" className="hover:text-blue-600 md:hidden">
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

                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`md:hidden p-2 rounded transition
                            ${isOpen
                              ? 'bg-blue-500 text-white'
                              : 'text-gray-700 hover:text-blue-500 hover:bg-blue-50 active:bg-blue-100'
                            }`}
                        aria-label="Toggle Menu"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>
            <div className="hidden md:flex md:flex-row md:space-x-7 pr-20 text-sm font-medium text-gray-600 items-center">
                <Link href="/" className="text-base hover:text-stone-800">Home</Link>
                <Link href="/products" className="text-base hover:text-stone-800">Shop</Link>
                <Link href="/custom-order" className="text-base hover:text-stone-800 whitespace-nowrap">Custom Order</Link>
                <Link href="/about" className="text-base hover:text-stone-800">About</Link>
                <Link href="/contact" className="text-base hover:text-stone-800">Contact</Link>
                <Link href="/cart" className="hover:text-blue-600 hidden md:block">
                    <div className="relative w-6 h-6">
                    <CartIcon />
                    {totalItems > 0 && (
                        <span className={`absolute -top-2 -right-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium leading-none transition-transform duration-300 ease-out ${animate ? 'scale-110' : 'scale-100'}`}>
                        {totalItems}
                        </span>
                    )}
                    </div>
                </Link>
            </div>
            {isOpen && (
            <div
                className="fixed inset-0 z-50 bg-black/40"
                onClick={() => setIsOpen(false)}
            >
                <div
                className="bg-white w-4/5 h-full p-6 shadow-lg flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
                >
                <button
                    onClick={() => setIsOpen(false)}
                    className="self-end text-gray-600 hover:text-blue-500 hover:bg-blue-50 active:bg-blue-100 p-2 rounded transition"
                    aria-label="Close Menu"
                    >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <Link href="/" className="text-4xl font-bold text-blue-500">3Dthium</Link>
                <div className="mt-6 flex flex-col divide-y divide-gray-200">
                <Link href="/" className="py-3 font-medium text-stone-800 hover:text-gray-600 text-base">Home</Link>
                <Link href="/products" className="py-3 font-medium text-stone-800 hover:text-gray-600 text-base">Shop</Link>
                <Link href="/custom-order" className="py-3 font-medium text-stone-800 hover:text-gray-600 text-base whitespace-nowrap">Custom Order</Link>
                <Link href="/about" className="py-3 font-medium text-stone-800 hover:text-gray-600 text-base">About</Link>
                <Link href="/contact" className="py-3 font-medium text-stone-800 hover:text-gray-600 text-base">Contact</Link>
                </div>
                </div>
            </div>
            )}
        </nav>
  )
}
