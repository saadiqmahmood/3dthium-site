import Head from 'next/head'
import { useState } from 'react'

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('loading')

    const form = e.target as HTMLFormElement
    const data = Object.fromEntries(new FormData(form))

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setStatus('success')
        form.reset()
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      <Head>
        <title>Contact Us | 3Dthium</title>
      </Head>

      <div className="min-h-screen bg-white relative overflow-hidden">
        {/* Background glow effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
        </div>
        {/* Hero Section */}
        <section className="relative bg-white pt-40 pb-8 overflow-hidden">
          {/* Hexagon pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(134,239,172,0.1)_40%,rgba(134,239,172,0.1)_60%,transparent_60%),linear-gradient(150deg,transparent_40%,rgba(34,211,238,0.1)_40%,rgba(34,211,238,0.1)_60%,transparent_60%)] bg-[size:80px_140px]" />
          </div>
          <div className="relative max-w-7xl mx-auto px-6 text-center">
            <h1 className="text-5xl md:text-6xl font-light text-zinc-900 mb-6">Get In Touch</h1>
            <p className="text-lg md:text-xl text-zinc-600 max-w-3xl mx-auto font-light">
              Have a question or need assistance? We&apos;re here to help bring your ideas to life.
            </p>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="relative pt-8 pb-16 bg-white overflow-hidden">
          {/* Hexagon pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(134,239,172,0.1)_40%,rgba(134,239,172,0.1)_60%,transparent_60%),linear-gradient(150deg,transparent_40%,rgba(34,211,238,0.1)_40%,rgba(34,211,238,0.1)_60%,transparent_60%)] bg-[size:80px_140px]" />
          </div>
          <div className="relative max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {/* Email */}
              <div className="bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-2xl p-8 text-center transition-all">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8 text-emerald-400"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Email Us</h3>
                <p className="text-zinc-400 mb-4 font-light">
                  We typically respond within 24 hours
                </p>
                <a
                  href="mailto:hello@3dthium.com"
                  className="text-emerald-400 hover:text-emerald-300 font-light transition-colors"
                >
                  hello@3dthium.com
                </a>
              </div>

              {/* Phone */}
              <div className="bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-2xl p-8 text-center transition-all">
                <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8 text-cyan-400"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Call Us</h3>
                <p className="text-zinc-400 mb-4 font-light">Mon-Fri, 9am-6pm GMT</p>
                <a
                  href="tel:+441234567890"
                  className="text-cyan-400 hover:text-cyan-300 font-light transition-colors"
                >
                  +44 (0) 123 456 7890
                </a>
              </div>

              {/* Location */}
              <div className="bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-2xl p-8 text-center transition-all">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8 text-emerald-400"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Visit Us</h3>
                <p className="text-zinc-400 mb-4 font-light">Based in the UK</p>
                <p className="text-white font-light">United Kingdom</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="relative py-12 bg-white overflow-hidden">
          {/* Hexagon pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(134,239,172,0.1)_40%,rgba(134,239,172,0.1)_60%,transparent_60%),linear-gradient(150deg,transparent_40%,rgba(34,211,238,0.1)_40%,rgba(34,211,238,0.1)_60%,transparent_60%)] bg-[size:80px_140px]" />
          </div>

          <div className="relative max-w-4xl mx-auto px-6">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Form Header */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-b border-gray-200 px-8 py-8">
                <h2 className="text-3xl md:text-4xl font-light text-zinc-900 mb-3">
                  Send Us a Message
                </h2>
                <p className="text-zinc-600 text-lg font-light">
                  Fill out the form and we&apos;ll get back to you as soon as possible
                </p>
              </div>

              {/* Form Content */}
              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {status === 'success' && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg flex items-center gap-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-6 h-6 flex-shrink-0"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span className="font-medium">
                        Your message was sent successfully! We&apos;ll be in touch soon.
                      </span>
                    </div>
                  )}
                  {status === 'error' && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg flex items-center gap-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-6 h-6 flex-shrink-0"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span className="font-medium">Something went wrong. Please try again.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-base font-medium text-zinc-900 mb-2"
                      >
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="John Smith"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-base font-medium text-zinc-900 mb-2"
                      >
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-base font-medium text-zinc-900 mb-2"
                    >
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="How can we help you?"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-base font-medium text-zinc-900 mb-2"
                    >
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  {/* Submit Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="w-full md:w-auto bg-zinc-900 text-white px-8 py-4 rounded-lg font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {status === 'loading' ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
