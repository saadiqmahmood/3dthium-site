import Link from 'next/link'
import ProductGrid from '@/components/sections/ProductGrid'

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 pt-32">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Discover Our <span className="text-yellow-300">3D Printed</span> Collection
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            From home decor to custom accessories, explore our carefully crafted 3D printed
            products. Each item is designed with precision and printed to perfection.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              ✨ Customizable Designs
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              🎨 Multiple Colors
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              📏 Various Sizes
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              🚀 Fast Shipping
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="py-16">
        <ProductGrid />
      </div>

      {/* Call to Action */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Don&apos;t See What You&apos;re Looking For?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            We specialize in custom 3D printing projects. Let us bring your unique ideas to life!
          </p>
          <Link
            href="/custom-order"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors"
          >
            Start Custom Order
          </Link>
        </div>
      </div>
    </div>
  )
}
