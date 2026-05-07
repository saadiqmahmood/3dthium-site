import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useId, useState } from 'react'
import ImageManager from '@/components/admin/ImageManager'
import Toast from '@/components/ui/Toast'

interface Category {
  id: string
  name: string
  slug: string
  is_active: boolean
  parent_id: string | null
}

interface FormData {
  name: string
  description: string
  category_id: string
  base_price: string
  slug: string
  is_active: boolean
  customizable: boolean
  galleryImages: string[]
}

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function CreateProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category_id: '',
    base_price: '',
    slug: '',
    is_active: true,
    customizable: false,
    galleryImages: [],
  })
  const fId = useId()

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((data) => {
        // Handle both old flat response and new { data } envelope
        const list = Array.isArray(data) ? data : (data.data ?? [])
        setCategories(list.filter((c: Category) => c.is_active))
      })
      .catch(console.error)
  }, [])

  const set = (field: keyof FormData, value: unknown) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      // Only auto-generate if slug hasn't been manually edited
      slug:
        prev.slug === generateSlug(prev.name) || prev.slug === '' ? generateSlug(name) : prev.slug,
    }))
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!formData.name.trim()) e.name = 'Name is required'
    if (!formData.category_id) e.category_id = 'Category is required'
    if (!formData.base_price || Number(formData.base_price) <= 0)
      e.base_price = 'Price must be greater than 0'
    if (!formData.description.trim()) e.description = 'Description is required'
    if (formData.galleryImages.length === 0) e.galleryImages = 'At least one image is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category_id: formData.category_id,
          base_price: Number(formData.base_price),
          slug: formData.slug,
          is_active: formData.is_active,
          customizable: formData.customizable,
          images: formData.galleryImages,
          thumbnail_url: formData.galleryImages[0],
          gallery_images: formData.galleryImages.slice(1),
        }),
      })

      const json = await response.json()

      if (response.ok) {
        const newId = json.data?.id ?? json.id
        setToast({ message: 'Product created', type: 'success' })
        setTimeout(() => router.push(`/admin/products/${newId}`), 1000)
      } else {
        setToast({
          message: json.error?.message ?? json.error ?? 'Failed to create product',
          type: 'error',
        })
      }
    } catch {
      setToast({ message: 'Failed to create product', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const selectedCategory = categories.find((c) => c.id === formData.category_id)

  const fieldClass = (name: string) =>
    `w-full border rounded-lg px-4 py-2 text-sm font-light text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 ${
      errors[name] ? 'border-red-400' : 'border-gray-200'
    }`

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-light text-zinc-900">New Product</h1>
          <p className="text-sm text-zinc-500 font-light mt-1">
            Fill in the details and upload images, then save.
          </p>
        </div>
        <Link
          href="/admin/products"
          className="text-sm text-zinc-500 hover:text-zinc-700 font-light"
        >
          ← Back
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-base font-medium text-zinc-800">Basic info</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor={`${fId}-name`}
                className="block text-sm font-light text-zinc-700 mb-1"
              >
                Name *
              </label>
              <input
                id={`${fId}-name`}
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={fieldClass('name')}
                placeholder="e.g. Blue Ceramic Vase"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label
                htmlFor={`${fId}-slug`}
                className="block text-sm font-light text-zinc-700 mb-1"
              >
                Slug <span className="text-zinc-400 text-xs">(auto-generated, editable)</span>
              </label>
              <input
                id={`${fId}-slug`}
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                }
                className={fieldClass('slug')}
                placeholder="blue-ceramic-vase"
              />
            </div>

            <div>
              <label
                htmlFor={`${fId}-category`}
                className="block text-sm font-light text-zinc-700 mb-1"
              >
                Category *
              </label>
              <select
                id={`${fId}-category`}
                value={formData.category_id}
                onChange={(e) => set('category_id', e.target.value)}
                className={fieldClass('category_id')}
              >
                <option value="">Select a category</option>
                {(() => {
                    const parentMap = Object.fromEntries(
                      categories.map((c) => [c.id, c.name])
                    )
                    return categories
                      .slice()
                      .sort((a, b) => {
                        const aLabel = a.parent_id ? `${parentMap[a.parent_id]} > ${a.name}` : a.name
                        const bLabel = b.parent_id ? `${parentMap[b.parent_id]} > ${b.name}` : b.name
                        return aLabel.localeCompare(bLabel)
                      })
                      .map((c) => {
                        const label = c.parent_id ? `${parentMap[c.parent_id]} > ${c.name}` : c.name
                        return (
                          <option key={c.id} value={c.id}>
                            {label}
                          </option>
                        )
                      })
                  })()}
              </select>
              {errors.category_id && (
                <p className="text-red-500 text-xs mt-1">{errors.category_id}</p>
              )}
            </div>

            <div>
              <label
                htmlFor={`${fId}-price`}
                className="block text-sm font-light text-zinc-700 mb-1"
              >
                Base price (£) *
              </label>
              <input
                id={`${fId}-price`}
                type="number"
                step="0.01"
                min="0.01"
                value={formData.base_price}
                onChange={(e) => set('base_price', e.target.value)}
                className={fieldClass('base_price')}
                placeholder="0.00"
              />
              {errors.base_price && (
                <p className="text-red-500 text-xs mt-1">{errors.base_price}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor={`${fId}-desc`} className="block text-sm font-light text-zinc-700 mb-1">
              Description *
            </label>
            <textarea
              id={`${fId}-desc`}
              value={formData.description}
              onChange={(e) => set('description', e.target.value)}
              rows={4}
              className={fieldClass('description')}
              placeholder="Describe the product…"
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => set('is_active', e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span className="text-sm font-light text-zinc-700">Active (visible in store)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.customizable}
                onChange={(e) => set('customizable', e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span className="text-sm font-light text-zinc-700">Customizable</span>
            </label>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
          <h2 className="text-base font-medium text-zinc-800 mb-4">Images *</h2>
          {formData.category_id ? (
            <>
              <ImageManager
                categorySlug={selectedCategory?.slug ?? 'products'}
                productSlug={formData.slug || 'new-product'}
                galleryImages={formData.galleryImages}
                onGalleryChange={(imgs) => set('galleryImages', imgs)}
                maxGalleryImages={9}
              />
              {errors.galleryImages && (
                <p className="text-red-500 text-xs mt-2">{errors.galleryImages}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-zinc-400 font-light">
              Select a category first to upload images.
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-2.5 bg-emerald-600 text-white text-sm font-light rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Creating…' : 'Create product'}
          </button>
        </div>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
