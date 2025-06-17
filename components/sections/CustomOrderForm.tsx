import React, { useState } from 'react'

export default function CustomOrderForm() {
    const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle')
    const [fileError, setFileError] = useState<string | null>(null)


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setStatus('loading')
        setFileError(null)
      
        const form = e.target as HTMLFormElement
        const fileInput = form.file as HTMLInputElement
        const file = fileInput?.files?.[0]
      
        if (file && file.size > 20 * 1024 * 1024) {
          setStatus('idle')
          setFileError('File size must be 20MB or less.')
          return
        }
      
        try {
          await new Promise((resolve) => setTimeout(resolve, 1500))
          setStatus('success')
          form.reset()
        } catch {
          setStatus('error')
        }
      }

  return (
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
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

            {/* Phone */}
            <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                </label>
                <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="bg-white mt-1 p-1 block w-full rounded-md border border-stone-300 font-normal text-stone-800 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* Preferred Material */}
            <div>
                <label htmlFor="material" className="block text-sm font-medium text-gray-700">
                    Preferred Material
                </label>
                <select
                    id="material"
                    name="material"
                    required
                    className="bg-white mt-1 p-1 block w-full rounded-md border border-stone-300 font-normal text-stone-800 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">Select material</option>
                    <option value="PLA">PLA</option>
                    <option value="Resin">Resin</option>
                    <option value="Eco-Plastic">Eco-Plastic</option>
                </select>
            </div>

            {/* Delivery Address */}
            <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Delivery Address
                </label>
                <input
                    type="text"
                    id="address"
                    name="address"
                    required
                    className="bg-white mt-1 p-1 block w-full rounded-md border border-stone-300 font-normal text-stone-800 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* Scale */}
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Object Dimensions (in mm)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input
                        type="number"
                        name="width"
                        placeholder="Width"
                        max={250}
                        className="bg-white p-1 block w-full rounded-md border border-stone-300 font-normal text-stone-800 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                        type="number"
                        name="height"
                        placeholder="Height"
                        max={250}
                        className="bg-white p-1 block w-full rounded-md border border-stone-300 font-normal text-stone-800 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                        type="number"
                        name="depth"
                        placeholder="Depth"
                        max={250}
                        className="bg-white p-1 block w-full rounded-md border border-stone-300 font-normal text-stone-800 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <p className="text-xs text-gray-500 mt-1">Maximum dimensions: 250 x 250 x 250 mm</p>
            </div>
        </div>

        {/* Description */}
        <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Project Description
            </label>
            <textarea
                id="description"
                name="description"
                rows={4}
                required
                className="bg-white mt-1 p-1 block w-full rounded-md border border-stone-300 font-normal text-stone-800 focus:ring-blue-500 focus:border-blue-500"
            />
        </div>

        {/* File Upload */}
        <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                Upload Design File (STL, DWG, SLDPRT, 3MF)
            </label>
            <input
                type="file"
                id="file"
                name="file"
                accept=".stl,.dwg,.sldprt,.3mf"
                required
                className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0 file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">Max size: 20MB per file.</p>
            {fileError && (
                <p className="text-sm text-red-600 mt-2">{fileError}</p>
            )}
        </div>

        {/* Submit Button */}
        <div>
            <button
                type="submit"
                disabled={status === 'loading'}
                className="bg-stone-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-stone-700 transition disabled:opacity-50"
            >
                {status === 'loading' ? 'Submitting...' : 'Submit Request'}
            </button>
        </div>
    </form>

  )
}
