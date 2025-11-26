import CustomOrderForm from '@/components/sections/CustomOrderForm'

export default function CustomOrderPage() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-60 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>
      {/* Hero Section */}
      <section className="relative bg-white pt-40 pb-8 overflow-hidden">
        {/* Hexagon pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(134,239,172,0.1)_40%,rgba(134,239,172,0.1)_60%,transparent_60%),linear-gradient(150deg,transparent_40%,rgba(34,211,238,0.1)_40%,rgba(34,211,238,0.1)_60%,transparent_60%)] bg-[size:80px_140px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-light text-zinc-900 mb-6">
            Bring Your{' '}
            <span className="font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
              Vision
            </span>{' '}
            to Life
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 max-w-3xl mx-auto font-light">
            Have a unique idea? We&apos;ll turn your custom designs into reality with precision 3D
            printing.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative pt-8 pb-16 bg-white overflow-hidden">
        {/* Hexagon pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(134,239,172,0.1)_40%,rgba(134,239,172,0.1)_60%,transparent_60%),linear-gradient(150deg,transparent_40%,rgba(34,211,238,0.1)_40%,rgba(34,211,238,0.1)_60%,transparent_60%)] bg-[size:80px_140px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-light text-center mb-12 text-white">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center p-6 rounded-2xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all duration-300">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-2xl font-light mx-auto mb-4 border border-emerald-500/20">
                1
              </div>
              <h3 className="text-xl font-medium text-zinc-900 mb-3">Submit Your Request</h3>
              <p className="text-zinc-600 font-light">
                Fill out the form with your project details and upload design files if you have
                them.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center p-6 rounded-2xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all duration-300">
              <div className="w-16 h-16 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center text-2xl font-light mx-auto mb-4 border border-cyan-500/20">
                2
              </div>
              <h3 className="text-xl font-medium text-zinc-900 mb-3">Get a Quote</h3>
              <p className="text-zinc-600 font-light">
                Our team reviews your request and provides a detailed quote within 24-48 hours.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center p-6 rounded-2xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all duration-300">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-2xl font-light mx-auto mb-4 border border-emerald-500/20">
                3
              </div>
              <h3 className="text-xl font-medium text-zinc-900 mb-3">Receive Your Print</h3>
              <p className="text-zinc-600 font-light">
                Once approved, we print and ship your custom creation with care and precision.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="relative py-12 bg-white overflow-hidden">
        {/* Hexagon pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(134,239,172,0.1)_40%,rgba(134,239,172,0.1)_60%,transparent_60%),linear-gradient(150deg,transparent_40%,rgba(34,211,238,0.1)_40%,rgba(34,211,238,0.1)_60%,transparent_60%)] bg-[size:80px_140px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-b border-gray-200 px-8 py-8">
              <h2 className="text-3xl md:text-4xl font-light text-zinc-900 mb-3">
                Start Your Custom Project
              </h2>
              <p className="text-zinc-600 text-lg font-light">
                Tell us about your project and we&apos;ll make it happen
              </p>
            </div>

            {/* Form Content */}
            <div className="p-8">
              <CustomOrderForm />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ or Benefits Section */}
      <section className="relative py-12 bg-white overflow-hidden">
        {/* Hexagon pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(134,239,172,0.1)_40%,rgba(134,239,172,0.1)_60%,transparent_60%),linear-gradient(150deg,transparent_40%,rgba(34,211,238,0.1)_40%,rgba(34,211,238,0.1)_60%,transparent_60%)] bg-[size:80px_140px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-light text-center mb-12 text-white">
            Why Choose Custom?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4 p-6 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-2xl transition-all">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-12 h-12 text-emerald-400 flex-shrink-0"
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
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Fully Customizable</h3>
                <p className="text-zinc-600 font-light">
                  Choose your materials, colors, sizes, and finishes to match your exact vision.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-2xl transition-all">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-12 h-12 text-cyan-400 flex-shrink-0"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              </svg>
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Quality Guaranteed</h3>
                <p className="text-zinc-600 font-light">
                  Every custom print is carefully inspected to ensure it meets our high standards.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-2xl transition-all">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-12 h-12 text-emerald-400 flex-shrink-0"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Expert Support</h3>
                <p className="text-zinc-600 font-light">
                  Our team is here to help refine your design and answer any questions you have.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-2xl transition-all">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-12 h-12 text-cyan-400 flex-shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Fast Turnaround</h3>
                <p className="text-zinc-600 font-light">
                  Most custom orders are completed and shipped within 5-7 business days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
