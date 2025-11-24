import Link from 'next/link'

export default function CustomPrintsCTA() {
  return (
    <section className="relative py-16 px-6 bg-white overflow-hidden">
      {/* Hexagon pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(134,239,172,0.1)_40%,rgba(134,239,172,0.1)_60%,transparent_60%),linear-gradient(150deg,transparent_40%,rgba(34,211,238,0.1)_40%,rgba(34,211,238,0.1)_60%,transparent_60%)] bg-[size:80px_140px]" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/20 p-12 md:p-16">
          {/* Subtle glow effect */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h2 className="text-4xl md:text-5xl font-light text-zinc-900 mb-4">
                Have a{' '}
                <span className="font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                  Custom Design?
                </span>
              </h2>
              <p className="text-lg text-zinc-600 font-light leading-relaxed">
                Upload your 3D model or work with our team to bring your unique vision to life.
              </p>
            </div>
            <Link
              href="/custom-order"
              className="bg-zinc-900 text-white px-8 py-4 rounded-lg font-medium hover:bg-zinc-800 transition-all duration-300 whitespace-nowrap"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
