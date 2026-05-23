import Head from 'next/head'
import CustomOrderForm from '@/components/sections/CustomOrderForm'

export default function CustomOrderPage() {
  return (
    <>
      <Head>
        <title>Custom Order | 3Dthium</title>
      </Head>

      <div className="min-h-screen bg-white">

        {/* Hero — dark */}
        <section className="bg-zinc-900 pt-40 pb-24 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-7xl mx-auto px-6">
            <p className="text-emerald-400 text-sm font-medium uppercase tracking-widest mb-6">Custom order</p>
            <h1 className="text-5xl md:text-7xl font-light text-white mb-8 leading-tight max-w-3xl">
              Bring your idea.<br />
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">We&apos;ll make it real.</span>
            </h1>
            <p className="text-lg text-zinc-400 font-light max-w-xl leading-relaxed">
              Upload a file or describe what you need. We&apos;ll review it and come back with a quote within 24–48 hours.
            </p>
          </div>
        </section>

        {/* Main content */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">

              {/* Left — info */}
              <div className="lg:col-span-2 space-y-10">

                <div>
                  <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-widest mb-6">What to expect</h2>
                  <ul className="space-y-6">
                    {[
                      { n: '01', title: 'Submit your request', body: 'Fill in your project details and upload a design file if you have one.' },
                      { n: '02', title: 'We review & quote', body: 'We\'ll come back with a clear, itemised quote within 24–48 hours.' },
                      { n: '03', title: 'It gets printed', body: 'Approved? We print, inspect, and ship it straight to your door.' },
                    ].map((step) => (
                      <li key={step.n} className="flex gap-5">
                        <span className="text-emerald-400 font-light text-sm mt-0.5 flex-shrink-0 w-6">{step.n}</span>
                        <div>
                          <p className="text-sm font-medium text-zinc-900 mb-1">{step.title}</p>
                          <p className="text-sm text-zinc-500 font-light leading-relaxed">{step.body}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
                  <p className="text-sm font-medium text-zinc-900 mb-3">Accepted file formats</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['STL', 'DWG', 'SLDPRT', '3MF'].map((fmt) => (
                      <span key={fmt} className="px-3 py-1 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700">
                        {fmt}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-400 font-light leading-relaxed">
                    Max file size: 20MB. No file yet? Describe your idea in the form — we&apos;ll work from that.
                  </p>
                </div>

                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
                  <p className="text-sm font-medium text-zinc-900 mb-1">Max print size</p>
                  <p className="text-sm text-zinc-500 font-light leading-relaxed">
                    250 × 250 × 250 mm. Need something larger? Mention it in your description — multi-part assembly is possible.
                  </p>
                </div>

              </div>

              {/* Right — form */}
              <div className="lg:col-span-3">
                <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-widest mb-6">Your request</h2>
                <CustomOrderForm />
              </div>

            </div>
          </div>
        </section>

      </div>
    </>
  )
}
