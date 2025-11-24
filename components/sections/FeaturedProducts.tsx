import Link from 'next/link'
import { useEffect, useState } from 'react'
import ProductCard from '@/components/ui/ProductCard'
import type { ProductVariantNew } from '@/types'

// New product type from products_new API
type ProductNew = {
  id: string
  name: string
  description: string
  slug: string
  base_price: number
  thumbnail_url: string
  customizable: boolean
  category: {
    name: string
    slug: string
  }
  variants: ProductVariantNew[]
  price_range: {
    min: number
    max: number
    has_variants: boolean
  }
  created_at: string
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<ProductNew[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/products')
        if (res.ok) {
          const data = await res.json()
          setProducts(data.products.slice(0, 4)) // Only show 4 featured products
        } else {
          setError('Failed to load products')
        }
      } catch (error) {
        console.error('Error fetching featured products:', error)
        setError('Failed to load products')
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  if (loading) {
    return (
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-zinc-600 font-light">Loading featured products...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="max-w-md mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-16 h-16 text-red-500 mx-auto mb-4"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h3 className="text-lg font-medium text-zinc-900 mb-2">Unable to Load Products</h3>
            <p className="text-zinc-600 mb-6 font-light">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-zinc-900 text-white font-medium py-3 px-6 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="max-w-md mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-16 h-16 text-zinc-400 mx-auto mb-4"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <h3 className="text-lg font-medium text-zinc-900 mb-2">No Products Available</h3>
            <p className="text-zinc-600 mb-6 font-light">
              We&apos;re working on adding amazing products to our collection!
            </p>
            <Link
              href="/custom-order"
              className="inline-block bg-zinc-900 text-white font-medium py-3 px-6 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Start Custom Order
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12 place-items-center">
          {products.map((product) => (
            <div key={product.id} className="w-full max-w-[280px]">
              <ProductCard product={product} variants={product.variants} />
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-3 px-8 rounded-lg transition-colors"
            >
              View All Products
            </Link>
            <Link
              href="/custom-order"
              className="border border-gray-300 text-zinc-900 hover:bg-gray-100 hover:border-gray-400 font-medium py-3 px-8 rounded-lg transition-colors"
            >
              Custom Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
