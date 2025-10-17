import Link from 'next/link'
import React from 'react'

export default function CustomPrintsCTA() {
  return (
    <section className="text-white py-20 px-6">
      <div className="bg-blue-500 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 rounded-xl py-10 px-6 md:px-22 lg:px-32">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold">Custom 3D Prints</h2>
          <p className="text-sm md:text-base mt-1 text-white/90 font-medium">
            Request a personalized 3D printed item tailored to your needs.
          </p>
        </div>
        <Link
          href="/custom-order"
          className="bg-white text-blue-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
        >
          Learn More
        </Link>
      </div>
    </section>
  )
}
