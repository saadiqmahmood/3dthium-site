import Link from 'next/link'
import type React from 'react'
import { useId, useState } from 'react'
import { useSupabase } from '@/context/SupabaseContext'

export default function CustomOrderForm() {
  const fId = useId()
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle')
  const [fileError, setFileError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // Use hook unconditionally - must be at top level
  const supabaseContext = useSupabase()
  const supabase = supabaseContext?.client

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('loading')
    setFileError(null)
    setFormError(null)

    const form = e.target as HTMLFormElement
    const fileInput = form.file as HTMLInputElement
    const file = fileInput?.files?.[0]

    if (!file) {
      setStatus('idle')
      setFileError('Please upload a file.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setStatus('idle')
      setFileError('File size must be 20MB or less.')
      return
    }

    // Upload file to Supabase Storage
    let fileUrl = ''
    try {
      if (!supabase) {
        setStatus('idle')
        setFileError('Supabase client is not available. Please refresh the page.')
        return
      }

      const filePath = `${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('custom-orders')
        .upload(filePath, file)
      if (uploadError) {
        console.error('Supabase upload error:', uploadError)
        setStatus('idle')
        setFileError(uploadError.message || 'File upload failed. Please try again.')
        return
      }
      const { data: publicUrlData } = supabase.storage.from('custom-orders').getPublicUrl(filePath)
      fileUrl = publicUrlData.publicUrl
    } catch (err: unknown) {
      setStatus('idle')
      setFileError(err instanceof Error ? err.message : 'File upload failed. Please try again.')
      return
    }

    // Gather form data
    const formData = {
      name: (form.name as unknown as HTMLInputElement).value,
      email: (form.email as unknown as HTMLInputElement).value,
      phone: (form.phone as unknown as HTMLInputElement).value,
      material: (form.material as unknown as HTMLSelectElement).value,
      address: (form.address as unknown as HTMLInputElement).value,
      width: (form.width as unknown as HTMLInputElement).value,
      height: (form.height as unknown as HTMLInputElement).value,
      depth: (form.depth as unknown as HTMLInputElement).value,
      description: (form.description as unknown as HTMLTextAreaElement).value,
      file_url: fileUrl,
    }

    // Submit to API
    try {
      const res = await fetch('/api/custom-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Failed to submit custom order.')
      setStatus('success')
      form.reset()
    } catch {
      setStatus('error')
      setFormError('Failed to submit custom order. Please try again.')
    }
  }

  if (!supabase) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="text-red-800">
          Error: Supabase client is not available. Please refresh the page.
        </p>
      </div>
    )
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6 px-8 rounded-xl">
        {/* Success Message */}
        {status === 'success' && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Your request has been submitted successfully!
          </div>
        )}
        {/* Error Message */}
        {status === 'error' && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Something went wrong. Please try again.
          </div>
        )}
        {fileError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {fileError}
          </div>
        )}
        {formError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {formError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div>
            <label htmlFor={`${fId}-name`} className="block text-base font-medium text-zinc-900">
              Full Name
            </label>
            <input
              type="text"
              id={`${fId}-name`}
              name="name"
              required
              className="mt-1 p-2 block w-full rounded-md border border-gray-300 bg-white font-normal text-zinc-900 placeholder:text-zinc-500 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor={`${fId}-email`} className="block text-base font-medium text-zinc-900">
              Email Address
            </label>
            <input
              type="email"
              id={`${fId}-email`}
              name="email"
              required
              className="mt-1 p-2 block w-full rounded-md border border-gray-300 bg-white font-normal text-zinc-900 placeholder:text-zinc-500 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor={`${fId}-phone`} className="block text-base font-medium text-zinc-900">
              Phone Number
            </label>
            <input
              type="tel"
              id={`${fId}-phone`}
              name="phone"
              className="mt-1 p-2 block w-full rounded-md border border-gray-300 bg-white font-normal text-zinc-900 placeholder:text-zinc-500 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Preferred Material */}
          <div>
            <label
              htmlFor={`${fId}-material`}
              className="block text-base font-medium text-zinc-900"
            >
              Preferred Material
            </label>
            <select
              id={`${fId}-material`}
              name="material"
              required
              className="mt-1 p-2 block w-full rounded-md border border-gray-300 bg-white font-normal text-zinc-900 placeholder:text-zinc-500 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select material</option>
              <option value="PLA">PLA</option>
              <option value="Resin">Resin</option>
              <option value="Eco-Plastic">Eco-Plastic</option>
            </select>
          </div>

          {/* Delivery Address */}
          <div className="md:col-span-2">
            <label htmlFor={`${fId}-address`} className="block text-base font-medium text-zinc-900">
              Delivery Address
            </label>
            <input
              type="text"
              id={`${fId}-address`}
              name="address"
              required
              className="mt-1 p-2 block w-full rounded-md border border-gray-300 bg-white font-normal text-zinc-900 placeholder:text-zinc-500 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Scale */}
          <div className="md:col-span-2">
            <p className="block text-base font-medium text-zinc-900 mb-1">
              Object Dimensions (in mm)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="number"
                name="width"
                placeholder="Width"
                max={250}
                className="p-2 block w-full rounded-md border border-gray-300 bg-white font-normal text-zinc-900 placeholder:text-zinc-500 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <input
                type="number"
                name="height"
                placeholder="Height"
                max={250}
                className="p-2 block w-full rounded-md border border-gray-300 bg-white font-normal text-zinc-900 placeholder:text-zinc-500 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <input
                type="number"
                name="depth"
                placeholder="Depth"
                max={250}
                className="p-2 block w-full rounded-md border border-gray-300 bg-white font-normal text-zinc-900 placeholder:text-zinc-500 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Maximum dimensions: 250 x 250 x 250 mm</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor={`${fId}-desc`} className="block text-base font-medium text-zinc-900">
            Project Description
          </label>
          <textarea
            id={`${fId}-desc`}
            name="description"
            rows={4}
            required
            className="mt-1 p-2 block w-full rounded-md border border-gray-300 bg-white font-normal text-zinc-900 placeholder:text-zinc-500 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* File Upload */}
        <div>
          <label htmlFor={`${fId}-file`} className="block text-base font-medium text-zinc-900">
            Upload Design File (STL, DWG, SLDPRT, 3MF)
          </label>
          <input
            type="file"
            id={`${fId}-file`}
            name="file"
            accept=".stl,.dwg,.sldprt,.3mf"
            required
            className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0 file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500 mt-1">Max size: 20MB per file.</p>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-zinc-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
      <div className="mt-4 text-center">
        <Link href="/privacy" className="text-sm text-emerald-600 hover:underline">
          Read our Privacy Policy
        </Link>
      </div>
    </div>
  )
}
