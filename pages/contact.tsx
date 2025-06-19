import { useState } from 'react'
import Head from 'next/head'

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('loading')

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setStatus('success')
      ;(e.target as HTMLFormElement).reset()
    } catch (err) {
      setStatus('error')
    }
  }

  return (
    <>
      <Head>
        <title>Contact Us | 3Dthium</title>
      </Head>

      <section className="bg-gray-50 py-16 px-6 sm:px-10 md:px-20">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-stone-800 mb-3">Contact Us</h1>
            <p className="text-gray-600">
              Questions or enquiries? Fill out the form below and we’ll get back to you.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 px-8 rounded-xl bg-white py-10 shadow-sm">
            {status === 'success' && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                Your message was sent successfully!
              </div>
            )}
            {status === 'error' && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                Something went wrong. Please try again.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="bg-white mt-1 p-1 block w-full rounded-md border border-stone-300 font-normal text-stone-800 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="bg-white mt-1 p-1 block w-full rounded-md border border-stone-300 font-normal text-stone-800 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                required
                className="bg-white mt-1 p-1 block w-full rounded-md border border-stone-300 font-normal text-stone-800 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="bg-stone-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-stone-700 transition disabled:opacity-50"
              >
                {status === 'loading' ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}
