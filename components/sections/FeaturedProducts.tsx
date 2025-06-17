import React from 'react'

type Product = {
  id: number
  name: string
  category: string
}

const products: Product[] = [
  { id: 1, name: 'Modern Vase', category: 'Home Decor' },
  { id: 2, name: 'Camera Mount', category: 'Accessories' },
  { id: 3, name: 'Keychain Set', category: 'Charms & Gifts' },
  { id: 4, name: 'Egg Tray', category: 'Kitchen Accessories' },
]

export default function FeaturedProducts() {
  return (
    <section className="bg-white py-30 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-stone-800 mb-12">
          Explore Our Products
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-gray-50 rounded-xl p-6 shadow hover:shadow-md transition"
            >
              <div className="w-full h-40 bg-gray-200 rounded mb-4" />
              <h3 className="text-lg font-semibold text-stone-800">{product.name}</h3>
              <p className="text-sm text-gray-500">{product.category}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
