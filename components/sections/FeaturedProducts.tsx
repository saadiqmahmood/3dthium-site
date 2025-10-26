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

export default function FeaturedProducts() {
  const [products, setProducts] = useState<ProductNew[]>([])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products')
        if (res.ok) {
          const data = await res.json()
          setProducts(data.products.slice(0, 4)) // Only show 4 featured products
        }
      } catch (error) {
        console.error('Error fetching featured products:', error)
      }
    }
    fetchProducts()
  }, [])

  return (
    <section className="bg-white py-30 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-stone-800 mb-12">
          Featured Products
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} variants={product.variants} />
          ))}
        </div>
      </div>
    </section>
  )
}
