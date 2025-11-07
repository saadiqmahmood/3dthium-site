import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
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
          <div className="text-center mb-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-4"></div>
            <p className="text-zinc-400 font-light">Loading featured products...</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-zinc-800/50 rounded-2xl h-80 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 max-w-md mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-12 h-12 text-red-400 mx-auto mb-4"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h3 className="text-lg font-medium text-white mb-2">Unable to Load Products</h3>
            <p className="text-zinc-400 mb-4 text-sm font-light">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-white text-zinc-950 font-medium py-2 px-6 rounded-lg hover:bg-zinc-100 transition-colors"
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
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 max-w-md mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-16 h-16 text-zinc-600 mx-auto mb-4"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <h3 className="text-xl font-medium text-white mb-2">No Products Available</h3>
            <p className="text-zinc-400 mb-6 font-light">
              We&apos;re working on adding amazing products to our collection!
            </p>
            <Link
              href="/custom-order"
              className="inline-block bg-white text-zinc-950 font-medium py-3 px-6 rounded-lg hover:bg-zinc-100 transition-colors"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {products.map((product, index) => (
            <div
              key={product.id}
              className={`group transition-all duration-500 ${
                index % 2 === 0 ? 'lg:animate-slide-in-left' : 'lg:animate-slide-in-right'
              }`}
              style={{
                animationDelay: `${index * 200}ms`,
              }}
            >
              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all duration-300 overflow-hidden">
                {/* Product Image */}
                <div className="relative h-64 bg-zinc-950 overflow-hidden">
                  <Image
                    src={product.thumbnail_url}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>

                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="bg-zinc-900/80 backdrop-blur-sm text-zinc-300 px-3 py-1 rounded-full text-xs font-light border border-zinc-800">
                      {product.category.name}
                    </span>
                  </div>

                  {/* Customizable Badge */}
                  {product.customizable && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-emerald-500/20 backdrop-blur-sm text-emerald-400 px-3 py-1 rounded-full text-xs font-light flex items-center gap-1 border border-emerald-500/30">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4"
                        >
                          <path d="M12 2v6" />
                          <path d="M12 16v6" />
                          <path d="m4.93 4.93 4.24 4.24" />
                          <path d="m14.83 14.83 4.24 4.24" />
                          <path d="M2 12h6" />
                          <path d="M16 12h6" />
                          <path d="m4.93 19.07 4.24-4.24" />
                          <path d="m14.83 9.17 4.24-4.24" />
                        </svg>
                        Customizable
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="text-lg font-medium text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    {product.name}
                  </h3>

                  <p className="text-zinc-400 mb-4 line-clamp-2 text-sm font-light">{product.description}</p>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-semibold text-white">
                        £{product.price_range.min.toFixed(2)}
                      </span>
                      {product.price_range.has_variants &&
                        product.price_range.min !== product.price_range.max && (
                          <span className="text-zinc-500 text-sm font-light">
                            - £{product.price_range.max.toFixed(2)}
                          </span>
                        )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    href={`/products/${product.slug}`}
                    className="w-full bg-white hover:bg-zinc-100 text-zinc-950 font-medium py-3 px-6 rounded-lg transition-colors text-center block"
                  >
                    View Product
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="bg-white hover:bg-zinc-100 text-zinc-950 font-medium py-3 px-8 rounded-lg transition-colors"
            >
              View All Products
            </Link>
            <Link
              href="/custom-order"
              className="border border-zinc-700 text-white hover:bg-zinc-900 hover:border-zinc-600 font-medium py-3 px-8 rounded-lg transition-colors"
            >
              Custom Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
