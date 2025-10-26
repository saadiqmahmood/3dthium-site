import Head from 'next/head'
import { useEffect, useState } from 'react'
import CustomPrintsCTA from '@/components/sections/CustomPrintsCTA'
import FeaturedProducts from '@/components/sections/FeaturedProducts'
import HeroSection from '@/components/sections/HeroSection'

export default function Home() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen">
      <Head>
        <title>3Dthium – Custom 3D Prints & Personalized Products</title>
        <meta
          name="description"
          content="Transform your ideas into reality with our premium 3D printing services. Custom designs, multiple materials, and fast delivery."
        />
      </Head>

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div
            className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Why Choose <span className="text-blue-600">3Dthium</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We combine cutting-edge 3D printing technology with creative design to bring your
              vision to life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Custom Designs</h3>
              <p className="text-gray-600">
                Personalized products tailored to your exact specifications and preferences.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Fast Production</h3>
              <p className="text-gray-600">
                Quick turnaround times without compromising on quality or attention to detail.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-violet-100 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Premium Materials</h3>
              <p className="text-gray-600">
                High-quality PLA, PETG, and resin materials for durable, beautiful results.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-orange-50 to-red-100 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Free Shipping</h3>
              <p className="text-gray-600">
                Complimentary shipping on all orders with secure packaging and tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div
            className={`text-center mb-16 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Featured <span className="text-blue-600">Products</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our most popular 3D printed items, each crafted with precision and available
              in multiple variants.
            </p>
          </div>
          <div
            className={`transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <FeaturedProducts />
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div
            className={`text-center mb-16 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              How It <span className="text-blue-600">Works</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From concept to creation, our streamlined process makes custom 3D printing simple and
              accessible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div
              className={`text-center transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 hover:scale-110 transition-transform duration-300">
                <span className="text-3xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Choose or Design</h3>
              <p className="text-gray-600 text-lg">
                Browse our collection or upload your own design. We support various file formats and
                can help optimize your model.
              </p>
            </div>

            <div
              className={`text-center transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 hover:scale-110 transition-transform duration-300">
                <span className="text-3xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Customize</h3>
              <p className="text-gray-600 text-lg">
                Select your preferred size, color, and material. Add personal touches like text,
                logos, or custom modifications.
              </p>
            </div>

            <div
              className={`text-center transition-all duration-1000 delay-900 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              <div className="bg-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 hover:scale-110 transition-transform duration-300">
                <span className="text-3xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Print & Ship</h3>
              <p className="text-gray-600 text-lg">
                We print your item with care, perform quality checks, and ship it securely to your
                doorstep.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Prints CTA */}
      <div
        className={`transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <CustomPrintsCTA />
      </div>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div
            className={`text-center mb-16 transition-all duration-1000 delay-1100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              What Our <span className="text-yellow-400">Customers</span> Say
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Don&apos;t just take our word for it. Here&apos;s what our satisfied customers have to
              say about their experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div
              className={`bg-gray-800 p-8 rounded-xl hover:bg-gray-700 transition-all duration-300 hover:scale-105 transition-all duration-1000 delay-1300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              <div className="text-yellow-400 text-2xl mb-4">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-300 mb-6 text-lg">
                &quot;Amazing quality and attention to detail! The custom phone case I ordered
                exceeded my expectations.&quot;
              </p>
              <div className="font-semibold text-white">- Sarah M.</div>
            </div>

            <div
              className={`bg-gray-800 p-8 rounded-xl hover:bg-gray-700 transition-all duration-300 hover:scale-105 transition-all duration-1000 delay-1500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              <div className="text-yellow-400 text-2xl mb-4">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-300 mb-6 text-lg">
                &quot;Fast shipping and excellent customer service. The 3D printed desk organizer is
                perfect for my workspace.&quot;
              </p>
              <div className="font-semibold text-white">- James L.</div>
            </div>

            <div
              className={`bg-gray-800 p-8 rounded-xl hover:bg-gray-700 transition-all duration-300 hover:scale-105 transition-all duration-1000 delay-1700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              <div className="text-yellow-400 text-2xl mb-4">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-300 mb-6 text-lg">
                &quot;Love the customization options! They helped me create the perfect gift for my
                daughter&apos;s birthday.&quot;
              </p>
              <div className="font-semibold text-white">- Maria R.</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
