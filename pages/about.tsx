import Head from 'next/head'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About | 3Dthium</title>
      </Head>

      <div className="min-h-screen bg-white">

        {/* Header */}
        <section className="pt-40 pb-12 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6">
            <h1 className="text-5xl md:text-6xl font-light text-zinc-900 mb-4">About 3Dthium</h1>
            <p className="text-lg text-zinc-500 font-light max-w-xl">
              A UK-based 3D printing studio turning ideas into real, tangible objects — one layer at a time.
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-widest mb-6">Our story</h2>
                <p className="text-2xl font-light text-zinc-900 leading-relaxed mb-6">
                  3Dthium started with a single printer, a handful of filament spools, and a lot of curiosity.
                </p>
                <p className="text-base text-zinc-600 leading-relaxed mb-4 font-light">
                  What began as a hobby — printing small models late into the night — gradually grew into something more. Friends started asking for custom pieces. Then strangers. Then orders from across the UK.
                </p>
                <p className="text-base text-zinc-600 leading-relaxed font-light">
                  Today 3Dthium is a proper studio, still small by design, with a tight focus on quality and craft. Every order is handled with care, printed to spec, and shipped with attention to detail that you won&apos;t get from a factory floor.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 text-center">
                  <p className="text-4xl font-light text-zinc-900 mb-1">UK</p>
                  <p className="text-sm text-zinc-500 font-light">Based & printed</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                  <p className="text-4xl font-light text-emerald-700 mb-1">100%</p>
                  <p className="text-sm text-zinc-500 font-light">Made to order</p>
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 text-center">
                  <p className="text-4xl font-light text-zinc-900 mb-1">FDM</p>
                  <p className="text-sm text-zinc-500 font-light">& resin printing</p>
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 text-center">
                  <p className="text-4xl font-light text-zinc-900 mb-1">Fast</p>
                  <p className="text-sm text-zinc-500 font-light">UK-wide shipping</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What we stand for */}
        <section className="py-20 bg-zinc-50 border-y border-zinc-100">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-widest mb-12 text-center">What we stand for</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              <div className="bg-white border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
                  <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-emerald-600">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-zinc-900 mb-3">Precision first</h3>
                <p className="text-sm text-zinc-600 leading-relaxed font-light">
                  Every print is dialled in before it leaves. We calibrate, test, and check — because a model that looks perfect on screen should look just as good in your hands.
                </p>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
                  <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-emerald-600">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-zinc-900 mb-3">No compromises on material</h3>
                <p className="text-sm text-zinc-600 leading-relaxed font-light">
                  We use quality filaments and resins — no cheap substitutes. The right material for the right print, whether that&apos;s a detailed figurine or a functional part that needs to last.
                </p>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
                  <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-emerald-600">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-zinc-900 mb-3">Made for you, not the shelf</h3>
                <p className="text-sm text-zinc-600 leading-relaxed font-light">
                  Nothing we make sits in a warehouse waiting. Every order is printed fresh, to your spec — custom colour, size, or design. That&apos;s the point of 3D printing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-widest mb-8">Our mission</h2>
            <p className="text-3xl md:text-4xl font-light text-zinc-900 leading-relaxed">
              To make custom 3D printing feel effortless — for anyone with an idea worth making real.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-xl font-light text-zinc-900 mb-1">Ready to make something?</p>
              <p className="text-sm text-zinc-500 font-light">Browse our ready-made prints or send us a custom request.</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link
                href="/products"
                className="px-6 py-3 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors"
              >
                Browse products
              </Link>
              <Link
                href="/custom-order"
                className="px-6 py-3 border border-zinc-200 text-zinc-700 text-sm font-medium rounded-xl hover:bg-zinc-50 transition-colors"
              >
                Custom order
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  )
}
