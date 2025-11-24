import Head from 'next/head'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About 3Dthium</title>
      </Head>

      <div className="min-h-screen bg-white relative overflow-hidden">
        {/* Background glow effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
        </div>
        {/* Hero Section */}
        <section className="relative bg-white py-16 pt-24 overflow-hidden">
          {/* Hexagon pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(134,239,172,0.1)_40%,rgba(134,239,172,0.1)_60%,transparent_60%),linear-gradient(150deg,transparent_40%,rgba(34,211,238,0.1)_40%,rgba(34,211,238,0.1)_60%,transparent_60%)] bg-[size:80px_140px]" />
          </div>
          <div className="relative max-w-7xl mx-auto px-6 text-center">
            <h1 className="text-5xl md:text-6xl font-light text-zinc-900 mb-6">About 3Dthium</h1>
            <p className="text-lg md:text-xl text-zinc-600 max-w-3xl mx-auto font-light">
              Transforming digital concepts into tangible, beautiful objects through precision 3D
              printing.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="relative py-16 bg-white overflow-hidden">
          {/* Hexagon pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(134,239,172,0.1)_40%,rgba(134,239,172,0.1)_60%,transparent_60%),linear-gradient(150deg,transparent_40%,rgba(34,211,238,0.1)_40%,rgba(34,211,238,0.1)_60%,transparent_60%)] bg-[size:80px_140px]" />
          </div>
          <div className="relative max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-light text-zinc-900 mb-6">Our Story</h2>
                <p className="text-base text-zinc-600 leading-relaxed mb-6 font-light">
                  3Dthium began with a deep curiosity for turning digital concepts into tangible,
                  beautiful objects. What started as a small home setup has evolved into a brand
                  driven by creativity, purpose, and problem-solving through 3D design.
                </p>
                <p className="text-base text-zinc-600 leading-relaxed font-light">
                  From our humble beginnings, we&apos;ve grown into a trusted name in custom 3D
                  printing, serving customers who value quality, creativity, and personalization in
                  every piece.
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-gray-200 rounded-2xl p-12 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-32 h-32 text-emerald-500 mx-auto mb-6"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <p className="text-2xl font-semibold text-zinc-900">Since 2020</p>
                <p className="text-zinc-600 mt-2 font-light">Years of Innovation</p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="relative py-16 bg-white overflow-hidden">
          {/* Hexagon pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(134,239,172,0.1)_40%,rgba(134,239,172,0.1)_60%,transparent_60%),linear-gradient(150deg,transparent_40%,rgba(34,211,238,0.1)_40%,rgba(34,211,238,0.1)_60%,transparent_60%)] bg-[size:80px_140px]" />
          </div>

          <div className="relative max-w-7xl mx-auto px-6">
            <h2 className="text-4xl font-light text-center text-zinc-900 mb-12">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Design & Innovation */}
              <div className="bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-2xl p-8 transition-all">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8 text-emerald-500"
                  >
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                    <path d="M5 3v4" />
                    <path d="M19 17v4" />
                    <path d="M3 5h4" />
                    <path d="M17 19h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-zinc-900 mb-4">Design & Innovation</h3>
                <p className="text-zinc-600 leading-relaxed font-light">
                  Our team thrives on pushing boundaries. Every model we create is designed with
                  precision and imagination, whether it&apos;s for a personalized cake topper or a
                  functional kitchen gadget. Innovation isn&apos;t just a value, it&apos;s part of
                  our process.
                </p>
              </div>

              {/* Quality */}
              <div className="bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-2xl p-8 transition-all">
                <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center justify-center mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8 text-cyan-500"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-zinc-900 mb-4">Premium Quality</h3>
                <p className="text-zinc-600 leading-relaxed font-light">
                  We use only the finest materials and state-of-the-art 3D printing technology to
                  ensure every product meets our exacting standards. Quality isn&apos;t
                  negotiable—it&apos;s our promise to you.
                </p>
              </div>

              {/* Personalization */}
              <div className="bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-2xl p-8 transition-all">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8 text-emerald-500"
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-zinc-900 mb-4">Personalized for You</h3>
                <p className="text-zinc-600 leading-relaxed font-light">
                  We believe every customer deserves something unique. That&apos;s why 3Dthium
                  offers fully customizable prints—from names to scale and colors—crafted with care
                  and made to reflect your vision.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="relative py-16 bg-white overflow-hidden">
          {/* Hexagon pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(134,239,172,0.1)_40%,rgba(134,239,172,0.1)_60%,transparent_60%),linear-gradient(150deg,transparent_40%,rgba(34,211,238,0.1)_40%,rgba(34,211,238,0.1)_60%,transparent_60%)] bg-[size:80px_140px]" />
          </div>

          <div className="relative max-w-7xl mx-auto px-6">
            <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-gray-200 rounded-3xl p-12 md:p-16 text-center">
              <h2 className="text-4xl md:text-5xl font-light text-zinc-900 mb-6">Our Mission</h2>
              <p className="text-lg md:text-xl text-zinc-700 max-w-4xl mx-auto leading-relaxed font-light">
                To make high-quality, custom 3D printing accessible to everyone. We&apos;re
                committed to turning your ideas into reality with precision, creativity, and
                care—one layer at a time.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-16 bg-white overflow-hidden">
          {/* Hexagon pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(134,239,172,0.1)_40%,rgba(134,239,172,0.1)_60%,transparent_60%),linear-gradient(150deg,transparent_40%,rgba(34,211,238,0.1)_40%,rgba(34,211,238,0.1)_60%,transparent_60%)] bg-[size:80px_140px]" />
          </div>

          <div className="relative max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-light text-zinc-900 mb-6">Ready to Get Started?</h2>
            <p className="text-lg text-zinc-600 mb-8 max-w-2xl mx-auto font-light">
              Explore our products or request a custom print today. Let&apos;s create something
              amazing together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="bg-zinc-900 text-white px-8 py-4 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
              >
                Browse Products
              </Link>
              <Link
                href="/custom-order"
                className="border border-gray-300 text-zinc-900 px-8 py-4 rounded-lg font-medium hover:bg-gray-100 hover:border-gray-400 transition-colors"
              >
                Request Custom Print
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
