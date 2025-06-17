import React, { useState } from 'react'
import { products, Product } from '@/data/products'
import ProductCard from '@/components/ui/ProductCard'

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

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((product) => product.category === selectedCategory)

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

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
