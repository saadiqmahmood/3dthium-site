import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import AttributeBuilder from '@/components/admin/AttributeBuilder'
import ImageManager from '@/components/admin/ImageManager'
import VariantManager from '@/components/admin/VariantManager'
import VariationGenerator from '@/components/admin/VariationGenerator'
import Toast from '@/components/ui/Toast'

type ProductAttribute = {
  id?: string
  name: string
  type: 'color' | 'size' | 'material' | 'design' | 'custom'
  options: {
    value: string
    displayName: string
    hexColor?: string
    images?: string[]
    priceModifier?: number
  }[]
}

interface Category {
  id: string
  name: string
  slug: string
  is_active: boolean
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

export default function EditProductPage() {
  const router = useRouter()
  const { id } = router.query as { id?: string }

  const [tab, setTab] = useState<'details' | 'variants'>('details')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [originalSlug, setOriginalSlug] = useState('')
  const [productAttributes, setProductAttributes] = useState<ProductAttribute[]>([])
  const [showGenerator, setShowGenerator] = useState(false)
  const [variantRefreshTrigger, setVariantRefreshTrigger] = useState(0)
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

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.data ?? [])
        setCategories(list.filter((c: Category) => c.is_active))
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!id) return
    fetch(`/api/admin/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        const p = data.data ?? data
        const allImages = [p.thumbnail_url, ...(p.gallery_images ?? [])].filter(Boolean) as string[]
        setFormData({
          name: p.name ?? '',
          description: p.description ?? '',
          category_id: p.category_id ?? '',
          base_price: String(p.base_price ?? ''),
          slug: p.slug ?? '',
          is_active: p.is_active ?? true,
          customizable: p.customizable ?? false,
          galleryImages: allImages,
        })
        setOriginalSlug(p.slug ?? '')
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    fetch(`/api/admin/products/${id}/attributes`)
      .then((r) => r.json())
      .then((data) => {
        const raw = data.attributes ?? data.data?.attributes ?? []
        const attrs: ProductAttribute[] = raw.map(
          (a: {
            id?: string
            name: string
            type: string
            options?: Array<{
              value: string
              display_name: string
              hex_color?: string
              images?: string[]
              price_modifier?: number
            }>
          }) => ({
            id: a.id,
            name: a.name,
            type: a.type as ProductAttribute['type'],
            options: (a.options ?? []).map((o) => ({
              value: o.value,
              displayName: o.display_name,
              hexColor: o.hex_color,
              images: o.images ?? [],
              priceModifier: o.price_modifier ?? 0,
            })),
          })
        )
        setProductAttributes(attrs)
        if (attrs.length > 0) setShowGenerator(true)
      })
      .catch(console.error)
  }, [id])

  const set = (field: keyof FormData, value: unknown) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug:
        prev.slug === originalSlug || prev.slug === generateSlug(prev.name)
          ? generateSlug(name)
          : prev.slug,
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

  const handleSave = async () => {
    if (!validate() || !id) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category_id: formData.category_id,
          base_price: Number(formData.base_price),
          slug: formData.slug,
          is_active: formData.is_active,
          customizable: formData.customizable,
          thumbnail_url: formData.galleryImages[0] ?? null,
          images: formData.galleryImages,
          gallery_images: formData.galleryImages.slice(1),
        }),
      })

      const json = await response.json()

      if (response.ok) {
        setOriginalSlug(formData.slug)
        setToast({ message: 'Product saved', type: 'success' })
      } else {
        setToast({ message: json.error?.message ?? json.error ?? 'Failed to save', type: 'error' })
      }
    } catch {
      setToast({ message: 'Failed to save product', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !confirm('Delete this product? This cannot be undone.')) return
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    router.push('/admin/products')
  }

  const selectedCategory = categories.find((c) => c.id === formData.category_id)

  const fieldClass = (name: string) =>
    `w-full border rounded-lg px-4 py-2 text-sm font-light text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 ${
      errors[name] ? 'border-red-400' : 'border-gray-200'
    }`

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 font-light text-sm">Loading…</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-light text-zinc-900">{formData.name || 'Edit Product'}</h1>
          <p className="text-sm text-zinc-500 font-light mt-1">/{formData.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-light text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
          <Link
            href="/admin/products"
            className="px-4 py-2 text-sm font-light text-zinc-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['details', 'variants'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-light capitalize transition-colors ${
              tab === t
                ? 'border-b-2 border-emerald-600 text-emerald-700'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Details tab */}
      {tab === 'details' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-base font-medium text-zinc-800">Basic info</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-light text-zinc-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={fieldClass('name')}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-light text-zinc-700 mb-1">
                  Slug{' '}
                  <span className="text-zinc-400 text-xs">(editable)</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                  }
                  className={fieldClass('slug')}
                />
              </div>

              <div>
                <label className="block text-sm font-light text-zinc-700 mb-1">Category *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => set('category_id', e.target.value)}
                  className={fieldClass('category_id')}
                >
                  <option value="">Select a category</option>
                  {categories
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
                {errors.category_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.category_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-light text-zinc-700 mb-1">Base price (£) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.base_price}
                  onChange={(e) => set('base_price', e.target.value)}
                  className={fieldClass('base_price')}
                />
                {errors.base_price && (
                  <p className="text-red-500 text-xs mt-1">{errors.base_price}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-light text-zinc-700 mb-1">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => set('description', e.target.value)}
                rows={4}
                className={fieldClass('description')}
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
                <span className="text-sm font-light text-zinc-700">Active</span>
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
            <h2 className="text-base font-medium text-zinc-800 mb-4">Images</h2>
            <ImageManager
              categorySlug={selectedCategory?.slug ?? 'products'}
              productSlug={formData.slug || (id ?? 'product')}
              galleryImages={formData.galleryImages}
              onGalleryChange={(imgs) => set('galleryImages', imgs)}
              maxGalleryImages={9}
            />
            {errors.galleryImages && (
              <p className="text-red-500 text-xs mt-2">{errors.galleryImages}</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-2.5 bg-emerald-600 text-white text-sm font-light rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {/* Variants tab */}
      {tab === 'variants' && id && (
        <div className="space-y-6">
          <VariantManager
            productId={id}
            basePrice={Number(formData.base_price)}
            refreshTrigger={variantRefreshTrigger}
          />

          {/* Generator — collapsible */}
          <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setShowGenerator((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-light text-zinc-700 hover:bg-gray-50 transition-colors rounded-lg"
            >
              <span className="flex items-center gap-2">
                <svg
                  className={`w-4 h-4 text-zinc-400 transition-transform ${showGenerator ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Generate variants from a template
              </span>
              <span className="text-xs text-zinc-400">
                {productAttributes.length > 0
                  ? `${productAttributes.length} attribute${productAttributes.length !== 1 ? 's' : ''} defined`
                  : 'Define options like Color, Size, Material — then auto-create all combinations'}
              </span>
            </button>

            {showGenerator && (
              <div className="px-5 pb-6 border-t border-gray-100 space-y-8 pt-6">
                {/* Step 1 — define attributes */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-4">
                    Step 1 — Define your options
                  </p>
                  <AttributeBuilder
                    productId={id}
                    productSlug={formData.slug}
                    categorySlug={selectedCategory?.slug ?? 'products'}
                    initialAttributes={productAttributes}
                    onAttributesChange={setProductAttributes}
                  />
                </div>

                {/* Step 2 — generate (only once at least one attribute is saved) */}
                {productAttributes.some((a) => a.id) && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-4">
                      Step 2 — Generate all combinations
                    </p>
                    <VariationGenerator
                      productId={id}
                      attributes={productAttributes.filter((a): a is ProductAttribute & { id: string } => Boolean(a.id))}
                      basePrice={Number(formData.base_price)}
                      onGenerated={() => setVariantRefreshTrigger((n) => n + 1)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
