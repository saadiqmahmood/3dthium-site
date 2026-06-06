import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useFavourites } from '@/context/FavouritesContext'

const SearchIcon = () => (
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
    className="w-5 h-5"
  >
    <title>Search</title>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)

const CartIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    className="w-6 h-6 fill-current"
  >
    <title>Cart</title>
    <path d="M29.74 8.32A1 1 0 0 0 29 8H13a1 1 0 0 0 0 2h14.91l-.81 9.48a1.87 1.87 0 0 1-2 1.52H12.88a1.87 1.87 0 0 1-2-1.52L10 8.92v-.16L9.33 6.2A3.89 3.89 0 0 0 7 3.52L3.37 2.07a1 1 0 0 0-.74 1.86l3.62 1.45a1.89 1.89 0 0 1 1.14 1.3L8 9.16l.9 10.49a3.87 3.87 0 0 0 4 3.35h.1v2.18a3 3 0 1 0 2 0V23h8v2.18a3 3 0 1 0 2 0V23h.12a3.87 3.87 0 0 0 4-3.35L30 9.08a1 1 0 0 0-.26-.76zM14 29a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm10 0a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" />
    <path d="M15 18v-5a1 1 0 0 0-2 0v5a1 1 0 0 0 2 0zM20 18v-5a1 1 0 0 0-2 0v5a1 1 0 0 0 2 0zM25 18v-5a1 1 0 0 0-2 0v5a1 1 0 0 0 2 0z" />
  </svg>
)

const AccountIcon = () => (
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
    className="w-6 h-6"
  >
    <title>Account</title>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
)

export default function Navbar() {
  const { cart } = useCart()
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const { favouriteIds } = useFavourites()
  const [isOpen, setIsOpen] = useState(false)
  const [animate, setAnimate] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const [mobileShopOpen, setMobileShopOpen] = useState(false)
  const [navCategories, setNavCategories] = useState<
    Array<{ id: string; name: string; slug: string; parent_id: string | null }>
  >([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const shopTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const { user, isAdmin } = useAuth()

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  const submitSearch = (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    setSearchOpen(false)
    setSearchQuery('')
    router.push({ pathname: '/products', query: { q: trimmed } })
  }

  const isActive = (href: string) => {
    if (href === '/') return router.pathname === '/'
    return router.pathname === href || router.pathname.startsWith(`${href}/`)
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (totalItems === 0) return
    setAnimate(true)
    const timeout = setTimeout(() => setAnimate(false), 300)
    return () => clearTimeout(timeout)
  }, [totalItems])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setNavCategories(data.categories || []))
      .catch(() => {})
  }, [])

  const handleShopEnter = () => {
    if (shopTimeout.current) clearTimeout(shopTimeout.current)
    setShopOpen(true)
  }

  const handleShopLeave = () => {
    shopTimeout.current = setTimeout(() => setShopOpen(false), 150)
  }

  const linkClass = (href: string) =>
    `text-base font-light transition-colors ${
      isActive(href)
        ? 'text-emerald-600 border-b border-emerald-500 pb-px'
        : 'text-zinc-600 hover:text-zinc-900'
    }`

  const badgeClass = `absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[10px] min-w-[17px] h-[17px] flex items-center justify-center rounded-full font-medium leading-none transition-transform duration-300 ease-out ${animate ? 'scale-125' : 'scale-100'}`

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 transition-all duration-300 ${
          scrolled ? 'py-3' : 'py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">

          {/* Mobile row */}
          {searchOpen ? (
            /* Mobile: search takes over the top bar */
            <form
              className="flex items-center gap-3 md:hidden"
              onSubmit={(e) => { e.preventDefault(); submitSearch(searchQuery); setIsOpen(false) }}
            >
              <div className="flex-1 flex items-center gap-2 bg-zinc-100 rounded-full px-4 py-2 border border-transparent focus-within:border-emerald-400 transition">
                <span className="text-zinc-400 flex-shrink-0"><SearchIcon /></span>
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery('') } }}
                  placeholder="Search products…"
                  className="flex-1 bg-transparent text-base font-light text-zinc-900 placeholder:text-zinc-400 min-w-0"
                    style={{ outline: 'none', boxShadow: 'none' }}
                />
              </div>
              <button
                type="button"
                onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                className="text-zinc-500 hover:text-zinc-900 transition-colors text-base font-light flex-shrink-0"
                aria-label="Cancel"
              >
                Cancel
              </button>
            </form>
          ) : (
            /* Mobile: normal top bar */
            <div className="flex justify-between items-center md:hidden">
              <Link href="/" className="text-xl font-light text-zinc-900 tracking-tight">
                3Dthium
              </Link>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="text-zinc-600 hover:text-zinc-900 transition-colors"
                  aria-label="Search"
                >
                  <SearchIcon />
                </button>
                <Link
                  href="/favourites"
                  className="relative text-zinc-600 hover:text-zinc-900 transition-colors"
                  aria-label="Favourites"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {favouriteIds.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] min-w-[17px] h-[17px] flex items-center justify-center rounded-full font-medium leading-none">
                      {favouriteIds.length}
                    </span>
                  )}
                </Link>
                <Link
                  href={{ pathname: '/cart', query: { from: router.asPath } }}
                  className="relative text-zinc-700 hover:text-zinc-900 transition-colors"
                  aria-label={`Cart${totalItems > 0 ? `, ${totalItems} items` : ''}`}
                >
                  <CartIcon />
                  {totalItems > 0 && <span className={badgeClass}>{totalItems}</span>}
                </Link>
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="p-1.5 rounded text-zinc-700 hover:text-zinc-900 hover:bg-gray-100 transition"
                  aria-label="Toggle Menu"
                  aria-expanded={isOpen}
                >
                  <svg aria-hidden="true" focusable="false" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <title>Menu</title>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Desktop layout */}
          {searchOpen ? (
            /* Desktop: search takes over the center + right */
            <form
              className="hidden md:flex md:items-center md:w-full md:gap-4"
              onSubmit={(e) => { e.preventDefault(); submitSearch(searchQuery) }}
            >
              <Link href="/" className="text-xl font-light text-zinc-900 tracking-tight flex-shrink-0">
                3Dthium
              </Link>
              <div className="flex-1 flex items-center gap-3 bg-zinc-100 rounded-full px-5 py-2 border border-transparent focus-within:border-emerald-400 transition mx-6">
                <span className="text-zinc-400 flex-shrink-0"><SearchIcon /></span>
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery('') } }}
                  placeholder="Search products…"
                  className="flex-1 bg-transparent text-base font-light text-zinc-900 placeholder:text-zinc-400 min-w-0"
                    style={{ outline: 'none', boxShadow: 'none' }}
                />
              </div>
              <button
                type="button"
                onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                className="text-base font-light text-zinc-500 hover:text-zinc-900 transition-colors flex-shrink-0"
                aria-label="Cancel"
              >
                Cancel
              </button>
            </form>
          ) : (
            /* Desktop: normal 3-column layout */
            <div className="hidden md:flex md:items-center md:w-full">
              {/* Left: Logo */}
              <div className="flex-1">
                <Link href="/" className="text-xl font-light text-zinc-900 tracking-tight">
                  3Dthium
                </Link>
              </div>

              {/* Center: Nav links */}
              <div className="flex items-center gap-8">
                <Link href="/" className={linkClass('/')}>Home</Link>
                {/* biome-ignore lint/a11y/noStaticElementInteractions: hover trigger for dropdown */}
                <div className="relative" onMouseEnter={handleShopEnter} onMouseLeave={handleShopLeave}>
                  <Link href="/products" className={`flex items-center gap-1 ${linkClass('/products')}`}>
                    Shop
                    <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-3 h-3 opacity-50 transition-transform duration-150 ${shopOpen ? 'rotate-180' : ''}`}>
                      <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                  </Link>
                  {shopOpen && navCategories.length > 0 && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-50">
                      <div className="bg-white shadow-2xl min-w-[240px] border border-zinc-100 border-t-[3px] border-t-emerald-500">
                        <Link href="/products" onClick={() => setShopOpen(false)} className="block px-6 py-3 text-base text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors">All products</Link>
                        <div className="mx-6 border-t border-zinc-100" />
                        {navCategories.filter((c) => !c.parent_id).map((cat) => (
                          <Link key={cat.id} href={`/products?cat=${cat.slug}`} onClick={() => setShopOpen(false)} className="block px-6 py-3 text-base text-zinc-700 hover:text-emerald-600 hover:bg-emerald-50/40 transition-colors">
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Link href="/custom-order" className={`text-base font-light transition-colors px-3.5 py-1 rounded-full border ${isActive('/custom-order') ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-zinc-300 text-zinc-700 hover:border-emerald-400 hover:text-emerald-600'}`}>
                  Custom Order
                </Link>
                <Link href="/about" className={linkClass('/about')}>About</Link>
                <Link href="/contact" className={linkClass('/contact')}>Contact</Link>
              </div>

              {/* Right: Search + Admin + Cart + Account */}
              <div className="flex-1 flex items-center justify-end gap-5">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="text-zinc-600 hover:text-zinc-900 transition-colors"
                  aria-label="Search"
                >
                  <SearchIcon />
                </button>
                {isAdmin && (
                  <Link href="/admin" className="text-base font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                    Admin
                  </Link>
                )}
                <Link
                  href="/favourites"
                  className="relative text-zinc-600 hover:text-zinc-900 transition-colors"
                  aria-label={`Favourites${favouriteIds.length > 0 ? `, ${favouriteIds.length}` : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {favouriteIds.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] min-w-[17px] h-[17px] flex items-center justify-center rounded-full font-medium leading-none">
                      {favouriteIds.length}
                    </span>
                  )}
                </Link>
                <Link
                  href={{ pathname: '/cart', query: { from: router.asPath } }}
                  className="relative text-zinc-700 hover:text-zinc-900 transition-colors"
                  aria-label={`Cart${totalItems > 0 ? `, ${totalItems} items` : ''}`}
                >
                  <CartIcon />
                  {totalItems > 0 && <span className={badgeClass}>{totalItems}</span>}
                </Link>
                <Link
                  href={user ? '/account' : '/auth'}
                  className={`transition-colors ${user ? 'text-emerald-600 hover:text-emerald-700' : 'text-zinc-700 hover:text-zinc-900'}`}
                  aria-label={user ? 'My account' : 'Sign in'}
                >
                  <AccountIcon />
                </Link>
              </div>
            </div>
          )}

        </div>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop overlay for mobile menu */}
          <div
            className="md:hidden fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsOpen(false)
            }}
          />

          {/* biome-ignore lint/a11y/noStaticElementInteractions: stops click propagation */}
          <div
            className="md:hidden fixed top-0 left-0 z-[70] bg-white w-72 h-full flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            style={{ animation: 'slideInLeft 0.25s ease-out' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="text-lg font-light text-zinc-900">3Dthium</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded text-zinc-500 hover:text-zinc-900 hover:bg-gray-100 transition"
                aria-label="Close Menu"
              >
                <svg
                  aria-hidden="true"
                  focusable="false"
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto py-3 px-3">
              {(
                [
                  { href: '/', label: 'Home' },
                  { href: '/about', label: 'About' },
                  { href: '/contact', label: 'Contact' },
                ] as { href: string; label: string }[]
              ).map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-2.5 rounded-lg text-base font-light transition-colors ${
                    isActive(href)
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-zinc-700 hover:text-zinc-900 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </Link>
              ))}

              {/* Shop with expandable categories */}
              <div>
                <button
                  type="button"
                  onClick={() => setMobileShopOpen(!mobileShopOpen)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-base font-light transition-colors ${
                    isActive('/products')
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-zinc-700 hover:text-zinc-900 hover:bg-gray-50'
                  }`}
                >
                  <span>Shop</span>
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-4 h-4 transition-transform ${mobileShopOpen ? 'rotate-180' : ''}`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {mobileShopOpen && (
                  <div className="pl-4 mt-0.5 space-y-0.5">
                    <Link
                      href="/products"
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-2 text-sm text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      All products
                    </Link>
                    {navCategories
                      .filter((c) => !c.parent_id)
                      .map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/products?cat=${cat.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="block px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))}
                  </div>
                )}
              </div>

              <Link
                href="/custom-order"
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-base font-medium transition-colors mt-1 ${
                  isActive('/custom-order')
                    ? 'text-emerald-700 bg-emerald-100'
                    : 'text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                Custom Order
              </Link>
            </div>

            {/* Footer: Auth */}
            <div className="px-3 py-4 border-t border-gray-100 space-y-2">
              <Link
                href={{ pathname: '/cart', query: { from: router.asPath } }}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="text-base font-light text-zinc-700">Cart</span>
                {totalItems > 0 && (
                  <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    {totalItems}
                  </span>
                )}
              </Link>

              <Link
                href={user ? '/account' : '/auth'}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white transition-colors"
              >
                <AccountIcon />
                <span className="text-base font-medium">{user ? 'My Account' : 'Sign In'}</span>
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-base font-light text-zinc-500 hover:text-zinc-900 hover:bg-gray-50 transition-colors"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
