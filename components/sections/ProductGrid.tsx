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

export default function ProductGrid() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [products, setProducts] = useState<ProductNew[]>([])
  const [categories, setCategories] = useState<string[]>(['All'])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('🔄 [ProductGrid] Component mounted, fetching products...')
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('🔄 [ProductGrid] Making API call to /api/products...')
        const res = await fetch('/api/products')

        if (!res.ok) {
          console.error('❌ [ProductGrid] API response not ok:', res.status, res.statusText)
          setError('Failed to fetch products')
          return
        }

        const data = await res.json()
        console.log('✅ [ProductGrid] Products fetched successfully:', data.products.length)
        setProducts(data.products)

        // Extract unique categories from products
        const uniqueCategories = [
          'All',
          ...new Set(data.products.map((p: ProductNew) => p.category.name)),
        ] as string[]
        setCategories(uniqueCategories)
      } catch (error) {
        console.error('❌ [ProductGrid] Error fetching products:', error)
        setError('Failed to fetch products')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((product) => product.category.name === selectedCategory)

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Category Filters */}
        <div className="mb-12">
          <h2 className="text-2xl font-light text-zinc-900 mb-6 text-center">Shop by Category</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-lg text-base font-light transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-emerald-500 text-white border border-emerald-500'
                    : 'bg-gray-100 text-zinc-700 border border-gray-200 hover:bg-gray-200 hover:text-zinc-900'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            <p className="mt-4 text-zinc-600 text-lg font-light">Loading products...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md mx-auto shadow-sm">
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
              <p className="text-zinc-900 text-lg mb-4 font-light">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-zinc-900 text-white font-medium py-3 px-6 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Product Grid */}
        {!loading && !error && (
          <>
            <div className="mb-8 text-center">
              <p className="text-zinc-600 text-lg font-light">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                {selectedCategory !== 'All' && ` in ${selectedCategory}`}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} variants={product.variants} />
              ))}
            </div>
          </>
        )}

        {/* No Products State */}
        {!loading && !error && filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-white border border-gray-200 rounded-2xl p-12 max-w-md mx-auto shadow-sm">
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
              <h3 className="text-xl font-medium text-zinc-900 mb-2">No Products Found</h3>
              <p className="text-zinc-600 mb-6 font-light">
                {selectedCategory === 'All'
                  ? "We're working on adding more amazing products!"
                  : `No products found in ${selectedCategory} category`}
              </p>
              {selectedCategory !== 'All' && (
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="bg-zinc-900 text-white font-medium py-2 px-4 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  View All Products
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
