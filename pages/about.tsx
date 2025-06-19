import Head from 'next/head'

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About 3Dthium</title>
      </Head>

      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-12 bg-gray-50 rounded-xl py-20 px-6 sm:px-10 md:px-20 lg:px-32">
          <h1 className="text-4xl font-bold text-stone-800 text-center">About 3Dthium</h1>

          {/* Story */}
          <div>
            <h2 className="text-2xl font-semibold text-stone-700 mb-2">Our Story</h2>
            <p className="text-gray-600 leading-relaxed">
              3Dthium began with a deep curiosity for turning digital concepts into tangible, beautiful objects. What started as a small home setup has evolved into a brand driven by creativity, purpose, and problem-solving through 3D design.
            </p>
          </div>

          {/* Passion */}
          <div>
            <h2 className="text-2xl font-semibold text-stone-700 mb-2">Design & Innovation</h2>
            <p className="text-gray-600 leading-relaxed">
              Our team thrives on pushing boundaries. Every model we create is designed with precision and imagination, whether it&apos;s for a personalized cake topper or a functional kitchen gadget. Innovation isn&apos;t just a value, it&apos;s part of our process.
            </p>
          </div>

          {/* Personalization */}
          <div>
            <h2 className="text-2xl font-semibold text-stone-700 mb-2">Personalized for You</h2>
            <p className="text-gray-600 leading-relaxed">
              We believe every customer deserves something unique. That&apos;s why 3Dthium offers fully customizable prints — from names to scale and colors — crafted with care and made to reflect your vision.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
