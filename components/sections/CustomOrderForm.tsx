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

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 text-zinc-900 placeholder:text-zinc-400 text-sm font-light focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition-all bg-white'

const labelClass = 'block text-sm font-medium text-zinc-700 mb-1.5'

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
      <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm font-light">
        Supabase client unavailable — please refresh the page.
      </div>
    )
  }

  const onSubmit = async (data: CustomOrderFormValues) => {
    setFileError(null)
    setApiStatus('idle')

    const file = fileInputRef.current?.files?.[0]

    let fileUrl: string | undefined
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setFileError('File size must be 20MB or less.')
        return
      }
      try {
        const filePath = `${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('custom-orders')
          .upload(filePath, file)
        if (uploadError) {
          setFileError(uploadError.message || 'File upload failed. Please try again.')
          return
        }
        const { data: publicUrlData } = supabase.storage.from('custom-orders').getPublicUrl(filePath)
        fileUrl = publicUrlData.publicUrl
      } catch (err: unknown) {
        setFileError(err instanceof Error ? err.message : 'File upload failed. Please try again.')
        return
      }
    }

    try {
      const res = await fetch('/api/custom-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, ...(fileUrl ? { file_url: fileUrl } : {}) }),
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {apiStatus === 'success' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-xl flex items-start gap-3 text-sm font-light">
          <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0 mt-0.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>Request submitted — we&apos;ll be in touch with a quote within 24–48 hours.</span>
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
      {fileError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl flex items-start gap-3 text-sm font-light">
          <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{fileError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor={`${fId}-name`} className={labelClass}>Full name</label>
          <input
            type="text"
            id={`${fId}-name`}
            {...register('name')}
            placeholder="Jane Smith"
            className={inputClass}
          />
          {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor={`${fId}-email`} className={labelClass}>Email address</label>
          <input
            type="email"
            id={`${fId}-email`}
            {...register('email')}
            placeholder="jane@example.com"
            className={inputClass}
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor={`${fId}-phone`} className={labelClass}>
            Phone <span className="text-zinc-400 font-light">(optional)</span>
          </label>
          <input
            type="tel"
            id={`${fId}-phone`}
            {...register('phone')}
            placeholder="+44 7700 900000"
            className={inputClass}
          />
          {errors.phone && <p className="mt-1.5 text-xs text-red-600">{errors.phone.message}</p>}
        </div>

        <div>
          <label htmlFor={`${fId}-material`} className={labelClass}>Preferred material</label>
          <select
            id={`${fId}-material`}
            {...register('material')}
            className={inputClass}
          >
            <option value="">Select material</option>
            <option value="PLA">PLA</option>
            <option value="Resin">Resin</option>
            <option value="Eco-Plastic">Eco-Plastic</option>
          </select>
          {errors.material && <p className="mt-1.5 text-xs text-red-600">{errors.material.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor={`${fId}-address`} className={labelClass}>Delivery address</label>
        <input
          type="text"
          id={`${fId}-address`}
          {...register('address')}
          placeholder="123 Example Street, London, E1 1AA"
          className={inputClass}
        />
        {errors.address && <p className="mt-1.5 text-xs text-red-600">{errors.address.message}</p>}
      </div>

      <div>
        <p className={labelClass}>Dimensions <span className="text-zinc-400 font-light">(mm, optional)</span></p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <input
              type="number"
              {...register('width', { setValueAs: dimSetValueAs })}
              placeholder="Width"
              max={250}
              className={inputClass}
            />
            {errors.width && <p className="mt-1.5 text-xs text-red-600">{errors.width.message}</p>}
          </div>
          <div>
            <input
              type="number"
              {...register('height', { setValueAs: dimSetValueAs })}
              placeholder="Height"
              max={250}
              className={inputClass}
            />
            {errors.height && <p className="mt-1.5 text-xs text-red-600">{errors.height.message}</p>}
          </div>
          <div>
            <input
              type="number"
              {...register('depth', { setValueAs: dimSetValueAs })}
              placeholder="Depth"
              max={250}
              className={inputClass}
            />
            {errors.depth && <p className="mt-1.5 text-xs text-red-600">{errors.depth.message}</p>}
          </div>
        </div>
      </div>

      <div>
        <label htmlFor={`${fId}-desc`} className={labelClass}>Project description</label>
        <textarea
          id={`${fId}-desc`}
          {...register('description')}
          rows={5}
          placeholder="Tell us what you're after — material preferences, colours, intended use, any reference images or links..."
          className={`${inputClass} resize-none`}
        />
        {errors.description && <p className="mt-1.5 text-xs text-red-600">{errors.description.message}</p>}
      </div>

      <div>
        <label htmlFor={`${fId}-file`} className={labelClass}>Design file <span className="text-zinc-400 font-light">(optional)</span></label>
        <label
          htmlFor={`${fId}-file`}
          className="mt-1 flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-gray-200 border-dashed text-sm text-zinc-400 font-light cursor-pointer hover:border-emerald-300 hover:text-emerald-600 transition-all"
        >
          <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>Upload STL, DWG, SLDPRT or 3MF — max 20MB</span>
        </label>
        <input
          type="file"
          id={`${fId}-file`}
          ref={fileInputRef}
          accept=".stl,.dwg,.sldprt,.3mf"
          className="sr-only"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit request'}
        </button>
        <Link href="/privacy" className="text-xs text-zinc-400 font-light hover:text-zinc-600 transition-colors">
          Privacy policy
        </Link>
      </div>
    </form>
  )
}
