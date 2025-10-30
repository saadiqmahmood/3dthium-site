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
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Shop by Category</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-full border-2 text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
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
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 text-lg">Loading amazing products...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <p className="text-red-800 text-lg mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
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
              <p className="text-gray-600 text-lg">
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
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 max-w-md mx-auto">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Products Found</h3>
              <p className="text-gray-600 mb-6">
                {selectedCategory === 'All'
                  ? "We're working on adding more amazing products!"
                  : `No products found in ${selectedCategory} category`}
              </p>
              {selectedCategory !== 'All' && (
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
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
