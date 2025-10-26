import React, { useEffect, useState } from 'react'
import ProductCard from '@/components/ui/ProductCard'
import { ProductVariantNew } from '@/types'

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

const categories = [
  'All',
  'Home Decor',
  'Kitchen Accessories',
  'Camera Accessories',
  'Charms & Keychains',
  'Personalized Party Items',
  'Gifts & Custom Items',
]

export default function ProductGrid() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [products, setProducts] = useState<ProductNew[]>([])
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
        <div className="mb-8 flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading products...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Product Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} variants={product.variants} />
            ))}
          </div>
        )}

        {/* No Products State */}
        {!loading && !error && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {selectedCategory === 'All' 
                ? 'No products available' 
                : `No products found in ${selectedCategory} category`
              }
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
