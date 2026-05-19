import Link from 'next/link'
import ProductGrid from '@/components/sections/ProductGrid'

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-8 border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex items-center gap-2 text-lg mb-6" aria-label="Breadcrumb">
            <Link
              href="/"
              className="text-zinc-400 hover:text-zinc-900 hover:underline underline-offset-2 transition-colors"
            >
              Home
            </Link>
            <svg
              aria-hidden="true"
              className="w-4 h-4 text-zinc-300 flex-shrink-0"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M4 2l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-zinc-900 font-semibold">Shop</span>
          </nav>
          <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">Shop</h1>
        </div>
      </div>
      <ProductGrid />
    </div>
  )
}
