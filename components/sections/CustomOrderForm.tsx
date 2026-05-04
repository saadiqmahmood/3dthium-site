import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useId, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useSupabase } from '@/context/SupabaseContext'

const dimField = z.number().int().min(1, 'Must be at least 1mm').max(250, 'Max 250mm').optional()
const dimSetValueAs = (v: string) => (v === '' || v == null ? undefined : Number(v))

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().max(30).optional(),
  material: z.string().min(1, 'Please select a material'),
  address: z.string().min(1, 'Delivery address is required').max(500),
  width: dimField,
  height: dimField,
  depth: dimField,
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
})
type CustomOrderFormValues = z.infer<typeof schema>

export default function CustomOrderForm() {
  const fId = useId()
  const [fileError, setFileError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabaseContext = useSupabase()
  const supabase = supabaseContext?.client

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomOrderFormValues>({ resolver: zodResolver(schema) })

  if (!supabase) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="text-red-800">
          Error: Supabase client is not available. Please refresh the page.
        </p>
      </div>
    )
  }

  const onSubmit = async (data: CustomOrderFormValues) => {
    setFileError(null)
    setApiStatus('idle')

    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setFileError('Please upload a file.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setFileError('File size must be 20MB or less.')
      return
    }

    if (!supabase) {
      setFileError('Supabase client is not available. Please refresh the page.')
      return
    }

    let fileUrl = ''
    try {
      const filePath = `${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('custom-orders')
        .upload(filePath, file)
      if (uploadError) {
        console.error('Supabase upload error:', uploadError)
        setFileError(uploadError.message || 'File upload failed. Please try again.')
        return
      }
      const { data: publicUrlData } = supabase.storage.from('custom-orders').getPublicUrl(filePath)
      fileUrl = publicUrlData.publicUrl
    } catch (err: unknown) {
      setFileError(err instanceof Error ? err.message : 'File upload failed. Please try again.')
      return
    }

    try {
      const res = await fetch('/api/custom-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, file_url: fileUrl }),
      })
      if (!res.ok) throw new Error('Failed to submit custom order.')
      setApiStatus('success')
      reset()
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch {
      setApiStatus('error')
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 px-8 rounded-xl">
        {apiStatus === 'success' && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Your request has been submitted successfully!
          </div>
        )}
        {apiStatus === 'error' && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Something went wrong. Please try again.
          </div>
        )}
        {fileError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {fileError}
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
              {...register('name')}
              className="mt-1 p-2 block w-full rounded-md border border-gray-300 bg-white font-normal text-zinc-900 placeholder:text-zinc-500 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor={`${fId}-email`} className="block text-base font-medium text-zinc-900">
              Email Address
            </label>
            <input
              type="email"
              id={`${fId}-email`}
              {...register('email')}
              className="mt-1 p-2 block w-full rounded-md border border-gray-300 bg-white font-normal text-zinc-900 placeholder:text-zinc-500 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor={`${fId}-phone`} className="block text-base font-medium text-zinc-900">
              Phone Number
            </label>
            <input
              type="tel"
              id={`${fId}-phone`}
              {...register('phone')}
              className="mt-1 p-2 block w-full rounded-md border border-gray-300 bg-white font-normal text-zinc-900 placeholder:text-zinc-500 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
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
              {...register('material')}
              className="mt-1 p-2 block w-full rounded-md border border-gray-300 bg-white font-normal text-zinc-900 placeholder:text-zinc-500 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select material</option>
              <option value="PLA">PLA</option>
              <option value="Resin">Resin</option>
              <option value="Eco-Plastic">Eco-Plastic</option>
            </select>
            {errors.material && (
              <p className="mt-1 text-sm text-red-600">{errors.material.message}</p>
            )}
          </div>

          {/* Delivery Address */}
          <div className="md:col-span-2">
            <label htmlFor={`${fId}-address`} className="block text-base font-medium text-zinc-900">
              Delivery Address
            </label>
            <input
              type="text"
              id={`${fId}-address`}
              {...register('address')}
              className="mt-1 p-2 block w-full rounded-md border border-gray-300 bg-white font-normal text-zinc-900 placeholder:text-zinc-500 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
            )}
          </div>

          {/* Dimensions */}
          <div className="md:col-span-2">
            <p className="block text-base font-medium text-zinc-900 mb-1">
              Object Dimensions (in mm)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <input
                  type="number"
                  {...register('width', { setValueAs: dimSetValueAs })}
                  placeholder="Width"
                  max={250}
                  className="p-2 block w-full rounded-md border border-gray-300 bg-white font-normal text-zinc-900 placeholder:text-zinc-500 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {errors.width && (
                  <p className="mt-1 text-sm text-red-600">{errors.width.message}</p>
                )}
              </div>
              <div>
                <input
                  type="number"
                  {...register('height', { setValueAs: dimSetValueAs })}
                  placeholder="Height"
                  max={250}
                  className="p-2 block w-full rounded-md border border-gray-300 bg-white font-normal text-zinc-900 placeholder:text-zinc-500 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {errors.height && (
                  <p className="mt-1 text-sm text-red-600">{errors.height.message}</p>
                )}
              </div>
              <div>
                <input
                  type="number"
                  {...register('depth', { setValueAs: dimSetValueAs })}
                  placeholder="Depth"
                  max={250}
                  className="p-2 block w-full rounded-md border border-gray-300 bg-white font-normal text-zinc-900 placeholder:text-zinc-500 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {errors.depth && (
                  <p className="mt-1 text-sm text-red-600">{errors.depth.message}</p>
                )}
              </div>
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
            {...register('description')}
            rows={4}
            className="mt-1 p-2 block w-full rounded-md border border-gray-300 bg-white font-normal text-zinc-900 placeholder:text-zinc-500 focus:ring-emerald-500 focus:border-emerald-500"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* File Upload */}
        <div>
          <label htmlFor={`${fId}-file`} className="block text-base font-medium text-zinc-900">
            Upload Design File (STL, DWG, SLDPRT, 3MF)
          </label>
          <input
            type="file"
            id={`${fId}-file`}
            ref={fileInputRef}
            accept=".stl,.dwg,.sldprt,.3mf"
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
            disabled={isSubmitting}
            className="bg-zinc-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
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
