import Link from 'next/link'
import ProductGrid from '@/components/sections/ProductGrid'

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-white py-16 pt-24 overflow-hidden">
        {/* Hexagon pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(134,239,172,0.1)_40%,rgba(134,239,172,0.1)_60%,transparent_60%),linear-gradient(150deg,transparent_40%,rgba(34,211,238,0.1)_40%,rgba(34,211,238,0.1)_60%,transparent_60%)] bg-[size:80px_140px]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-light text-zinc-900 mb-6">
            Our <span className="font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">Collection</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 max-w-3xl mx-auto font-light">
            Explore our carefully crafted 3D printed products, each designed with precision and available in multiple options.
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section className="relative py-16 bg-white overflow-hidden">
        {/* Hexagon pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(134,239,172,0.1)_40%,rgba(134,239,172,0.1)_60%,transparent_60%),linear-gradient(150deg,transparent_40%,rgba(34,211,238,0.1)_40%,rgba(34,211,238,0.1)_60%,transparent_60%)] bg-[size:80px_140px]" />
        </div>
        
        <div className="relative">
          <ProductGrid />
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative py-16 bg-white overflow-hidden">
        {/* Hexagon pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(134,239,172,0.1)_40%,rgba(134,239,172,0.1)_60%,transparent_60%),linear-gradient(150deg,transparent_40%,rgba(34,211,238,0.1)_40%,rgba(34,211,238,0.1)_60%,transparent_60%)] bg-[size:80px_140px]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-light text-zinc-900 mb-6">
            Don&apos;t See What You&apos;re <span className="font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">Looking For?</span>
          </h2>
          <p className="text-lg text-zinc-600 mb-8 max-w-2xl mx-auto font-light">
            We specialize in custom 3D printing projects. Let us bring your unique ideas to life.
          </p>
          <Link
            href="/custom-order"
            className="inline-block bg-zinc-900 text-white font-medium py-4 px-8 rounded-lg text-lg hover:bg-zinc-800 transition-colors"
          >
            Start Custom Order
          </Link>
        </div>
      </section>
    </div>
  )
}
