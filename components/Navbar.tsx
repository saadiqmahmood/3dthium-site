import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'

const CartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    className="w-6 h-6 fill-zinc-900"
  >
    <title>Cart</title>
    <path d="M29.74 8.32A1 1 0 0 0 29 8H13a1 1 0 0 0 0 2h14.91l-.81 9.48a1.87 1.87 0 0 1-2 1.52H12.88a1.87 1.87 0 0 1-2-1.52L10 8.92v-.16L9.33 6.2A3.89 3.89 0 0 0 7 3.52L3.37 2.07a1 1 0 0 0-.74 1.86l3.62 1.45a1.89 1.89 0 0 1 1.14 1.3L8 9.16l.9 10.49a3.87 3.87 0 0 0 4 3.35h.1v2.18a3 3 0 1 0 2 0V23h8v2.18a3 3 0 1 0 2 0V23h.12a3.87 3.87 0 0 0 4-3.35L30 9.08a1 1 0 0 0-.26-.76zM14 29a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm10 0a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" />
    <path d="M15 18v-5a1 1 0 0 0-2 0v5a1 1 0 0 0 2 0zM20 18v-5a1 1 0 0 0-2 0v5a1 1 0 0 0 2 0zM25 18v-5a1 1 0 0 0-2 0v5a1 1 0 0 0 2 0z" />
  </svg>
)

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-6 h-6 text-zinc-900"
  >
    <title>Account</title>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

export default function Navbar() {
  const { cart } = useCart()
  const isCartEmpty = cart.length === 0
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const [isOpen, setIsOpen] = useState(false)
  const [animate, setAnimate] = useState(false)
  const router = useRouter()
  const { user, isAdmin } = useAuth()

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

  return (
    <>
    <nav
      className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-lg px-6 py-4 flex flex-col md:flex-row md:justify-between md:items-center transition-all duration-300 border-b border-gray-200"
    >
      <div className="flex justify-between items-center w-full relative z-10">
        <Link
          href="/"
          className="text-5xl pl-5 font-light text-zinc-900"
        >
          3Dthium
        </Link>

        <div className="flex items-center gap-4">
          {!isCartEmpty ? (
            <Link
              href={{ pathname: '/cart', query: { from: router.asPath } }}
              className="hover:text-blue-600 md:hidden"
            >
              <div className="relative w-6 h-6">
                <CartIcon />
                {totalItems > 0 && (
                  <span
                    className={`absolute -top-2 -right-2 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium leading-none transition-transform duration-300 ease-out ${animate ? 'scale-110' : 'scale-100'}`}
                  >
                    {totalItems}
                  </span>
                )}
              </div>
            </Link>
          ) : (
            <div
              className="relative w-6 h-6 cursor-not-allowed opacity-50 md:hidden"
              title="Cart is empty"
            >
              <CartIcon />
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`md:hidden p-2 rounded transition ${
              isOpen
                ? 'bg-emerald-500 text-white'
                : 'text-zinc-900 hover:text-emerald-600 hover:bg-gray-100'
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
              <title>Menu</title>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      <div className="hidden md:flex md:flex-row md:space-x-7 pr-20 text-base font-medium items-center text-zinc-900">
        <Link
          href="/"
          className="text-base text-zinc-900 hover:text-emerald-600 transition-colors font-light"
        >
          Home
        </Link>
        <Link
          href="/products"
          className="text-base text-zinc-900 hover:text-emerald-600 transition-colors font-light"
        >
          Shop
        </Link>
        <Link
          href="/custom-order"
          className="text-base whitespace-nowrap text-zinc-900 hover:text-emerald-600 transition-colors font-light"
        >
          Custom Order
        </Link>
        <Link
          href="/about"
          className="text-base text-zinc-900 hover:text-emerald-600 transition-colors font-light"
        >
          About
        </Link>
        <Link
          href="/contact"
          className="text-base text-zinc-900 hover:text-emerald-600 transition-colors font-light"
        >
          Contact
        </Link>
        {!isCartEmpty ? (
          <Link
            href={{ pathname: '/cart', query: { from: router.asPath } }}
            className="hidden md:block hover:text-emerald-600 transition-colors"
          >
            <div className="relative w-6 h-6">
              <CartIcon />
              {totalItems > 0 && (
                <span
                  className={`absolute -top-2 -right-2 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium leading-none transition-transform duration-300 ease-out ${animate ? 'scale-110' : 'scale-100'}`}
                >
                  {totalItems}
                </span>
              )}
            </div>
          </Link>
        ) : (
          <div
            className="relative w-6 h-6 cursor-not-allowed opacity-50 hidden md:block"
            title="Cart is empty"
          >
            <CartIcon />
          </div>
        )}
          {!user ? (
            <Link
              href="/auth"
              className="text-base font-medium text-zinc-900 hover:text-emerald-600 transition-colors"
            >
              Login
            </Link>
          ) : (
            <>
              <Link
                href="/account"
                className="hover:text-emerald-400 transition-colors"
              >
                <UserIcon />
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-base font-medium text-zinc-900 hover:text-emerald-600 transition-colors"
                >
                  Admin
                </Link>
              )}
            </>
          )}
        {/** Privacy Policy link (desktop) */}
        {/* Privacy Policy link removed from desktop */}
      </div>
    </nav>
    
    {/* Mobile Menu - Outside nav element */}
    {isOpen && (
        <>
          {/* Backdrop */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop overlay for mobile menu */}
          <div
            className="md:hidden fixed inset-0 z-[60] bg-white/90 backdrop-blur-sm animate-fadeIn"
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsOpen(false)
              }
            }}
            style={{
              animation: 'fadeIn 0.3s ease-out',
            }}
          />
          
          {/* Menu Panel */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: stops click propagation */}
          <div
            className="md:hidden fixed top-0 left-0 z-[70] bg-white w-full sm:w-96 h-full flex flex-col shadow-2xl border-r border-gray-200"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            style={{
              animation: 'slideInLeft 0.4s ease-out',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <span className="text-3xl font-light text-zinc-900">3Dthium</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-gray-100 transition-all"
                aria-label="Close Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cart Section */}
            {!isCartEmpty && (
              <div className="px-6 py-4 bg-gray-50">
                <Link
                  href={{ pathname: '/cart', query: { from: router.asPath } }}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                    <span className="text-zinc-900 text-lg font-light">
                      {totalItems} item{totalItems !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    router.push('/')
                  }}
                  className="w-full text-left py-3 px-4 text-lg text-zinc-700 hover:text-zinc-900 hover:bg-gray-100 rounded-lg transition-all font-light"
                >
                  Home
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    router.push('/products')
                  }}
                  className="w-full text-left py-3 px-4 text-lg text-zinc-700 hover:text-zinc-900 hover:bg-gray-100 rounded-lg transition-all font-light"
                >
                  Shop
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    router.push('/custom-order')
                  }}
                  className="w-full text-left py-3 px-4 text-lg text-zinc-700 hover:text-zinc-900 hover:bg-gray-100 rounded-lg transition-all font-light"
                >
                  Custom Order
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    router.push('/about')
                  }}
                  className="w-full text-left py-3 px-4 text-lg text-zinc-700 hover:text-zinc-900 hover:bg-gray-100 rounded-lg transition-all font-light"
                >
                  About
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    router.push('/contact')
                  }}
                  className="w-full text-left py-3 px-4 text-lg text-zinc-700 hover:text-zinc-900 hover:bg-gray-100 rounded-lg transition-all font-light"
                >
                  Contact
                </button>

                {/* Auth Section */}
                <div className="pt-4 mt-4 border-t border-gray-200">
                  {!user ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false)
                        router.push('/auth')
                      }}
                      className="w-full text-left py-3 px-4 text-lg text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-all font-medium"
                    >
                      Login
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false)
                          router.push('/account')
                        }}
                        className="w-full text-left py-3 px-4 text-lg text-zinc-700 hover:text-zinc-900 hover:bg-gray-100 rounded-lg transition-all font-light mb-2"
                      >
                        My Account
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false)
                            router.push('/admin')
                          }}
                          className="w-full text-left py-3 px-4 text-lg text-zinc-700 hover:text-zinc-900 hover:bg-gray-100 rounded-lg transition-all font-light"
                        >
                          Admin
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
