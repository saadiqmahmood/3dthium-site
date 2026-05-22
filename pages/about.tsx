import Head from 'next/head'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About | 3Dthium</title>
      </Head>

      <div className="min-h-screen bg-white">

        {/* Hero — dark, bold */}
        <section className="bg-zinc-900 pt-40 pb-24 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-7xl mx-auto px-6">
            <p className="text-emerald-400 text-sm font-medium uppercase tracking-widest mb-6">About 3Dthium</p>
            <h1 className="text-5xl md:text-7xl font-light text-white mb-8 leading-tight max-w-3xl">
              Built on curiosity.<br />
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">Driven by craft.</span>
            </h1>
            <p className="text-lg text-zinc-400 font-light max-w-xl leading-relaxed">
              A UK-based 3D printing studio turning ideas into real, tangible objects — one layer at a time.
            </p>
          </div>
        </section>

        {/* Stats strip */}
        <section className="bg-emerald-600">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-emerald-500">
              {[
                { value: 'UK', label: 'Based & printed' },
                { value: '100%', label: 'Made to order' },
                { value: 'FDM + Resin', label: 'Print technologies' },
                { value: 'Fast', label: 'UK-wide shipping' },
              ].map((stat) => (
                <div key={stat.label} className="py-8 px-6 text-center">
                  <p className="text-2xl font-light text-white mb-1">{stat.value}</p>
                  <p className="text-sm text-emerald-100 font-light">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              <div>
                <h2 className="text-3xl font-light text-zinc-900 mb-6">Our story</h2>
                <p className="text-lg text-zinc-700 leading-relaxed mb-5 font-light">
                  3Dthium started with a single printer, a handful of filament spools, and a lot of curiosity.
                </p>
                <p className="text-base text-zinc-500 leading-relaxed mb-5 font-light">
                  What began as a hobby — printing small models late into the night — gradually grew into something more. Friends started asking for custom pieces. Then strangers. Then orders from across the UK.
                </p>
                <p className="text-base text-zinc-500 leading-relaxed font-light">
                  Today 3Dthium is a proper studio, still small by design, with a tight focus on quality and craft. Every order is handled with care, printed to spec, and shipped with attention to detail that you won&apos;t get from a factory floor.
                </p>
              </div>

              <div className="bg-zinc-900 rounded-3xl p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
                <p className="relative text-emerald-400 text-sm font-medium uppercase tracking-widest mb-6">The way we work</p>
                <ul className="relative space-y-6">
                  {[
                    { n: '01', title: 'You order', body: 'Choose from our catalogue or submit a fully custom request with your own specs.' },
                    { n: '02', title: 'We print', body: 'Your piece goes straight to the printer. No stock. No waiting around for a batch.' },
                    { n: '03', title: 'It ships', body: 'Packed carefully and dispatched across the UK — tracked every step of the way.' },
                  ].map((step) => (
                    <li key={step.n} className="flex gap-5">
                      <span className="text-emerald-400 font-light text-sm mt-0.5 flex-shrink-0 w-6">{step.n}</span>
                      <div>
                        <p className="font-medium text-white mb-1">{step.title}</p>
                        <p className="text-sm text-zinc-400 font-light leading-relaxed">{step.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-24 bg-zinc-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14">
              <h2 className="text-3xl font-light text-zinc-900">What we stand for</h2>
              <p className="text-zinc-500 font-light text-sm max-w-xs">Three things we won&apos;t cut corners on, no matter the order size.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-zinc-200 rounded-2xl p-8 hover:border-emerald-300 hover:shadow-sm transition-all">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-6">
                  <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-zinc-900 mb-3">Precision first</h3>
                <p className="text-sm text-zinc-500 leading-relaxed font-light">
                  Every print is dialled in before it leaves. We calibrate, test, and check — because a model that looks perfect on screen should look just as good in your hands.
                </p>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-8 hover:border-emerald-300 hover:shadow-sm transition-all">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-6">
                  <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-zinc-900 mb-3">No compromises on material</h3>
                <p className="text-sm text-zinc-500 leading-relaxed font-light">
                  Quality filaments and resins — no cheap substitutes. The right material for the right print, whether that&apos;s a detailed figurine or a functional part that needs to last.
                </p>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-8 hover:border-emerald-300 hover:shadow-sm transition-all">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-6">
                  <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-zinc-900 mb-3">Made for you, not the shelf</h3>
                <p className="text-sm text-zinc-500 leading-relaxed font-light">
                  Nothing we make sits in a warehouse waiting. Every order is printed fresh, to your spec — custom colour, size, or design. That&apos;s the point of 3D printing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission — dark callout */}
        <section className="bg-zinc-900 py-24 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          </div>
          <div className="relative max-w-4xl mx-auto px-6 text-center">
            <p className="text-emerald-400 text-sm font-medium uppercase tracking-widest mb-8">Our mission</p>
            <p className="text-3xl md:text-5xl font-light text-white leading-tight">
              To make custom 3D printing feel effortless —{' '}
              <span className="text-zinc-400">for anyone with an idea worth making real.</span>
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div>
              <p className="text-2xl font-light text-zinc-900 mb-2">Ready to make something?</p>
              <p className="text-sm text-zinc-500 font-light">Browse our catalogue or send us a custom request.</p>
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
