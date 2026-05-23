import Head from 'next/head'
import Link from 'next/link'
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
        <title>3Dthium – Custom 3D Prints & Personalised Products</title>
        <meta
          name="description"
          content="UK-based 3D printing studio. Custom designs, premium materials, fast delivery."
        />
      </Head>

      <HeroSection />

      {/* Stats strip */}
      <section className="bg-emerald-600">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-emerald-500">
            {[
              { value: 'UK', label: 'Designed & printed' },
              { value: '100%', label: 'Made to order' },
              { value: 'FDM + Resin', label: 'Print technologies' },
              { value: '2–5 days', label: 'Typical turnaround' },
            ].map((stat) => (
              <div key={stat.label} className="py-8 px-6 text-center">
                <p className="text-2xl font-light text-white mb-1">{stat.value}</p>
                <p className="text-sm text-emerald-100 font-light">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6">
          <div
            className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <h2 className="text-4xl md:text-5xl font-light text-zinc-900 mb-4">
              Why choose{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                3Dthium
              </span>
              ?
            </h2>
            <p className="text-lg text-zinc-500 font-light">
              Precision craft, printed to order, shipped with care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 hover:border-emerald-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-6">
                <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-zinc-900 mb-3">Custom designs</h3>
              <p className="text-sm text-zinc-500 font-light leading-relaxed">
                Personalised to your exact spec — colour, size, and material. Or submit your own 3D file.
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-8 hover:border-emerald-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-6">
                <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-zinc-900 mb-3">Fast production</h3>
              <p className="text-sm text-zinc-500 font-light leading-relaxed">
                Straight to the printer after you order. No batch waiting, no sitting in a queue.
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-8 hover:border-emerald-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-6">
                <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-zinc-900 mb-3">Premium materials</h3>
              <p className="text-sm text-zinc-500 font-light leading-relaxed">
                Quality PLA, PETG, and resin — no cheap substitutes. The right material for the job.
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-8 hover:border-emerald-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-6">
                <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                  <path d="M5 12H19" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-zinc-900 mb-3">UK shipping</h3>
              <p className="text-sm text-zinc-500 font-light leading-relaxed">
                Tracked delivery across the UK. International orders welcome — just ask.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-light text-zinc-900 mb-4">
              Featured{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                products
              </span>
            </h2>
            <p className="text-lg text-zinc-500 font-light">
              A selection of what we make — every piece printed fresh to order.
            </p>
          </div>
          <FeaturedProducts />
        </div>
      </section>

      {/* How it works — dark */}
      <section className="bg-zinc-900 py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-emerald-400 text-sm font-medium uppercase tracking-widest mb-4">How it works</p>
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4">From order to doorstep</h2>
            <p className="text-zinc-400 font-light">Three steps, zero stress.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 — Browse & choose */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-3">Choose or design</h3>
              <p className="text-sm text-zinc-400 font-light leading-relaxed max-w-xs">Browse our catalogue or submit a custom request with your own file or specs.</p>
            </div>

            {/* Step 2 — 3D print */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                  <path d="M12 2L2 7l10 5 10-5-10-5Z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-3">We print it</h3>
              <p className="text-sm text-zinc-400 font-light leading-relaxed max-w-xs">Your order goes straight to the printer. Calibrated, checked, and handled with care.</p>
            </div>

            {/* Step 3 — Delivered */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-3">It arrives</h3>
              <p className="text-sm text-zinc-400 font-light leading-relaxed max-w-xs">Packed securely and shipped tracked across the UK — usually within 2–5 days.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Prints CTA */}
      <CustomPrintsCTA />

      {/* Studio teaser */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-emerald-600 text-sm font-medium uppercase tracking-widest mb-4">Made in the UK</p>
              <h2 className="text-3xl md:text-4xl font-light text-zinc-900 mb-6 leading-tight">
                Small by design.<br />Precise by habit.
              </h2>
              <p className="text-zinc-500 font-light leading-relaxed mb-6">
                3Dthium is a UK-based studio that prints every order fresh — no stock, no warehouse, no compromise.
                From a single piece to a full custom run, every print is treated like it matters. Because it does.
              </p>
              <Link
                href="/about"
                className="text-emerald-600 text-sm font-medium hover:text-emerald-700 transition-colors"
              >
                Read our story →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { title: 'Printed fresh every time', body: 'Nothing sits in a warehouse. You order, we print — that\'s it.' },
                { title: 'Checked before it ships', body: 'Calibrated and inspected before every dispatch. No shortcuts.' },
                { title: 'Real people, fast replies', body: 'Questions? We respond — usually same day, always honestly.' },
                { title: 'Custom requests welcome', body: 'Your file, your specs, your colour. We make it work.' },
              ].map((item) => (
                <div key={item.title} className="bg-white border border-zinc-200 rounded-2xl p-5 hover:border-emerald-300 transition-all">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mb-3" />
                  <p className="text-sm font-medium text-zinc-900 mb-1.5">{item.title}</p>
                  <p className="text-xs text-zinc-500 font-light leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
