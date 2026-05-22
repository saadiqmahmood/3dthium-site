import { zodResolver } from '@hookform/resolvers/zod'
import Head from 'next/head'
import Link from 'next/link'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  email: z.string().email('Enter a valid email address'),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
})
type ContactFormValues = z.infer<typeof schema>

export default function ContactPage() {
  const [apiStatus, setApiStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const fId = useId()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: ContactFormValues) => {
    setApiStatus('idle')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setApiStatus('success')
        reset()
      } else {
        setApiStatus('error')
      }
    } catch {
      setApiStatus('error')
    }
  }

  return (
    <>
      <Head>
        <title>Contact Us | 3Dthium</title>
      </Head>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <section className="pt-40 pb-12 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6">
            <h1 className="text-5xl md:text-6xl font-light text-zinc-900 mb-4">Get in touch</h1>
            <p className="text-lg text-zinc-500 font-light max-w-xl">
              Have a question about an order, a custom print, or anything else? We&apos;re happy to help.
            </p>
          </div>
        </section>

        {/* Main content */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">

              {/* Left — contact details */}
              <div className="lg:col-span-2 space-y-10">
                <div>
                  <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-widest mb-6">Contact</h2>
                  <div className="space-y-8">
                    {/* Email */}
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-emerald-600">
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 mb-0.5">Email</p>
                        <a href="mailto:hello@3dthium.com" className="text-sm text-emerald-600 hover:text-emerald-700 font-light transition-colors">
                          hello@3dthium.com
                        </a>
                        <p className="text-xs text-zinc-400 mt-1 font-light">We reply within 24 hours</p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-emerald-600">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 mb-0.5">Based in</p>
                        <p className="text-sm text-zinc-600 font-light">United Kingdom</p>
                        <p className="text-xs text-zinc-400 mt-1 font-light">Shipping across the UK & internationally</p>
                      </div>
                    </div>

                    {/* Response time */}
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-emerald-600">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 mb-0.5">Hours</p>
                        <p className="text-sm text-zinc-600 font-light">Mon – Fri, 9am – 6pm GMT</p>
                        <p className="text-xs text-zinc-400 mt-1 font-light">We do our best to respond same day</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custom order nudge */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
                  <p className="text-sm font-medium text-zinc-900 mb-1">Have a custom project in mind?</p>
                  <p className="text-sm text-zinc-500 font-light mb-4">
                    Use our custom order form for detailed design requests — it helps us get back to you faster.
                  </p>
                  <Link
                    href="/custom-order"
                    className="inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    Submit a custom order →
                  </Link>
                </div>
              </div>

              {/* Right — form */}
              <div className="lg:col-span-3">
                <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-widest mb-6">Send a message</h2>

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                  {apiStatus === 'success' && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-xl flex items-start gap-3 text-sm font-light">
                      <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0 mt-0.5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span>Message sent — we&apos;ll be in touch within 24 hours.</span>
                    </div>
                  )}
                  {apiStatus === 'error' && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl flex items-start gap-3 text-sm font-light">
                      <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0 mt-0.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>Something went wrong. Please try again or email us directly.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor={`${fId}-name`} className="block text-sm font-medium text-zinc-700 mb-1.5">
                        Full name
                      </label>
                      <input
                        type="text"
                        id={`${fId}-name`}
                        {...register('name')}
                        placeholder="Jane Smith"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-zinc-900 placeholder:text-zinc-400 text-sm font-light focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition-all"
                      />
                      {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>}
                    </div>

                    <div>
                      <label htmlFor={`${fId}-email`} className="block text-sm font-medium text-zinc-700 mb-1.5">
                        Email address
                      </label>
                      <input
                        type="email"
                        id={`${fId}-email`}
                        {...register('email')}
                        placeholder="jane@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-zinc-900 placeholder:text-zinc-400 text-sm font-light focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition-all"
                      />
                      {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor={`${fId}-subject`} className="block text-sm font-medium text-zinc-700 mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      id={`${fId}-subject`}
                      {...register('subject')}
                      placeholder="What's your message about?"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-zinc-900 placeholder:text-zinc-400 text-sm font-light focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition-all"
                    />
                    {errors.subject && <p className="mt-1.5 text-xs text-red-600">{errors.subject.message}</p>}
                  </div>

                  <div>
                    <label htmlFor={`${fId}-message`} className="block text-sm font-medium text-zinc-700 mb-1.5">
                      Message
                    </label>
                    <textarea
                      id={`${fId}-message`}
                      {...register('message')}
                      rows={7}
                      placeholder="Tell us what you need..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-zinc-900 placeholder:text-zinc-400 text-sm font-light focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition-all resize-none"
                    />
                    {errors.message && <p className="mt-1.5 text-xs text-red-600">{errors.message.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending...' : 'Send message'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
