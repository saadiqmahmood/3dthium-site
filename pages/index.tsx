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
      <section className="relative py-32 bg-zinc-950 overflow-hidden">
        {/* Hexagon pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(134,239,172,0.1)_40%,rgba(134,239,172,0.1)_60%,transparent_60%),linear-gradient(150deg,transparent_40%,rgba(34,211,238,0.1)_40%,rgba(34,211,238,0.1)_60%,transparent_60%)] bg-[size:80px_140px]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6">
          <div
            className={`text-center mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
              Why Choose <span className="font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">3Dthium</span>?
            </h2>
            <p className="text-lg text-zinc-400 max-w-3xl mx-auto font-light">
              Cutting-edge technology meets precision craftsmanship
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-10 h-10 mb-6 text-emerald-400 group-hover:text-emerald-300 transition-colors"
              >
                <path d="M12 2v6" />
                <path d="M12 16v6" />
                <path d="m4.93 4.93 4.24 4.24" />
                <path d="m14.83 14.83 4.24 4.24" />
                <path d="M2 12h6" />
                <path d="M16 12h6" />
                <path d="m4.93 19.07 4.24-4.24" />
                <path d="m14.83 9.17 4.24-4.24" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-3">Custom Designs</h3>
              <p className="text-base text-zinc-400 font-light leading-relaxed">
                Personalized products tailored to your exact specifications
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-10 h-10 mb-6 text-cyan-400 group-hover:text-cyan-300 transition-colors"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-3">Fast Production</h3>
              <p className="text-base text-zinc-400 font-light leading-relaxed">
                Quick turnaround times without compromising on quality
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-10 h-10 mb-6 text-emerald-400 group-hover:text-emerald-300 transition-colors"
              >
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-3">Premium Materials</h3>
              <p className="text-base text-zinc-400 font-light leading-relaxed">
                High-quality PLA, PETG, and resin for durable results
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-10 h-10 mb-6 text-cyan-400 group-hover:text-cyan-300 transition-colors"
              >
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-3">Free Shipping</h3>
              <p className="text-base text-zinc-400 font-light leading-relaxed">
                Complimentary shipping on all orders with tracking
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="relative py-32 bg-zinc-950 overflow-hidden">
        {/* Hexagon pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(134,239,172,0.1)_40%,rgba(134,239,172,0.1)_60%,transparent_60%),linear-gradient(150deg,transparent_40%,rgba(34,211,238,0.1)_40%,rgba(34,211,238,0.1)_60%,transparent_60%)] bg-[size:80px_140px]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6">
          <div
            className={`text-center mb-20 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
              Featured <span className="font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Products</span>
            </h2>
            <p className="text-lg text-zinc-400 max-w-3xl mx-auto font-light">
              Explore our curated collection of precision-crafted 3D prints
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
      <section className="relative py-32 bg-zinc-950 overflow-hidden">
        {/* Hexagon pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(134,239,172,0.1)_40%,rgba(134,239,172,0.1)_60%,transparent_60%),linear-gradient(150deg,transparent_40%,rgba(34,211,238,0.1)_40%,rgba(34,211,238,0.1)_60%,transparent_60%)] bg-[size:80px_140px]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6">
          <div
            className={`text-center mb-20 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
              How It <span className="font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Works</span>
            </h2>
            <p className="text-lg text-zinc-400 max-w-3xl mx-auto font-light">
              A streamlined process from concept to delivery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div
              className={`text-center transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              <div className="bg-emerald-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                <span className="text-2xl font-light text-emerald-400">1</span>
              </div>
              <h3 className="text-xl font-medium text-white mb-4">Choose or Design</h3>
              <p className="text-zinc-400 text-base font-light leading-relaxed">
                Browse our collection or upload your own design. We support various file formats and
                can help optimize your model.
              </p>
            </div>

            <div
              className={`text-center transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              <div className="bg-cyan-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 border border-cyan-500/20">
                <span className="text-2xl font-light text-cyan-400">2</span>
              </div>
              <h3 className="text-xl font-medium text-white mb-4">Customize</h3>
              <p className="text-zinc-400 text-base font-light leading-relaxed">
                Select your preferred size, color, and material. Add personal touches like text,
                logos, or custom modifications.
              </p>
            </div>

            <div
              className={`text-center transition-all duration-1000 delay-900 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              <div className="bg-emerald-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                <span className="text-2xl font-light text-emerald-400">3</span>
              </div>
              <h3 className="text-xl font-medium text-white mb-4">Print & Ship</h3>
              <p className="text-zinc-400 text-base font-light leading-relaxed">
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
      <section className="relative py-32 bg-zinc-950 overflow-hidden">
        {/* Hexagon pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(134,239,172,0.1)_40%,rgba(134,239,172,0.1)_60%,transparent_60%),linear-gradient(150deg,transparent_40%,rgba(34,211,238,0.1)_40%,rgba(34,211,238,0.1)_60%,transparent_60%)] bg-[size:80px_140px]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6">
          <div
            className={`text-center mb-20 transition-all duration-1000 delay-1100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
              What Our <span className="font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Customers</span> Say
            </h2>
            <p className="text-lg text-zinc-400 max-w-3xl mx-auto font-light">
              Trusted by makers, designers, and businesses worldwide
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className={`bg-zinc-950 p-8 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all duration-300 transition-all duration-1000 delay-1300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-zinc-300 mb-6 text-base font-light leading-relaxed">
                &quot;Amazing quality and attention to detail! The custom phone case I ordered
                exceeded my expectations.&quot;
              </p>
              <div className="font-medium text-white text-base">Sarah M.</div>
              <div className="text-zinc-500 text-sm font-light">Product Designer</div>
            </div>

            <div
              className={`bg-zinc-950 p-8 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all duration-300 transition-all duration-1000 delay-1500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-zinc-300 mb-6 text-base font-light leading-relaxed">
                &quot;Fast shipping and excellent customer service. The 3D printed desk organizer is
                perfect for my workspace.&quot;
              </p>
              <div className="font-medium text-white text-base">James L.</div>
              <div className="text-zinc-500 text-sm font-light">Software Engineer</div>
            </div>

            <div
              className={`bg-zinc-950 p-8 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all duration-300 transition-all duration-1000 delay-1700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-zinc-300 mb-6 text-base font-light leading-relaxed">
                &quot;Love the customization options! They helped me create the perfect gift for my
                daughter&apos;s birthday.&quot;
              </p>
              <div className="font-medium text-white text-base">Maria R.</div>
              <div className="text-zinc-500 text-sm font-light">Small Business Owner</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
