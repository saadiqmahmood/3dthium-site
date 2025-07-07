import React, { useEffect, useState } from 'react'
import ProductCard from '@/components/ui/ProductCard'
import { Product, ProductVariant } from '@/types'

// Type for fetched product with variants
type ProductWithVariants = {
  product: Product
  variants: ProductVariant[]
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<ProductWithVariants[]>([])

  useEffect(() => {
    const fetchProducts = async () => {
      const res = await fetch('/api/test')
      const data = await res.json()
      setProducts(data.slice(0, 4)) // Only show 4 featured products
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
          {products.map(({ product, variants }) => (
            <ProductCard key={product.id} product={product} variants={variants} />
          ))}
        </div>
      </div>
    </section>
  )
}
