import Link from 'next/link'
import React from 'react'

export default function HeroSection() {
  return (
    <section className="bg-gray-50 py-16 px-6 rounded-xl pb-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="text-center md:text-left space-y-10">
          <h1 className="text-4xl md:text-6xl font-bold text-stone-800 mb-4">
            Showcase Your 3D Designs
          </h1>
          <p className="text-gray-700 text-lg mb-6">
            Creative 3D printed products for your home, gifts, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link
              href="/shop"
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-500 transition"
            >
              Explore Products
            </Link>
            <Link
              href="/custom-order"
              className="border border-blue-500 text-blue-500 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition"
            >
              Custom Order
            </Link>
          </div>
        </div>

        {/* Optional image placeholder */}
        <div className="w-full md:w-1/2 h-64 bg-gray-200 rounded-lg shadow-md"></div>
      </div>
    </section>
  )
}