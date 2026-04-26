import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import AttributeBuilder from '@/components/admin/AttributeBuilder'
import ImageManager from '@/components/admin/ImageManager'
import VariantManager from '@/components/admin/VariantManager'
import VariationGenerator from '@/components/admin/VariationGenerator'
import Toast from '@/components/ui/Toast'

interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  description: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
  children?: Category[]
}

interface CategoryAttribute {
  id: string
  category_id: string
  name: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect'
  required: boolean
  options?: string[]
  default_value?: string
  description?: string
}

interface ProductFormData {
  name: string
  description: string
  category_id: string
  base_price: number
  slug: string
  is_active: boolean
  customizable: boolean
  attributes: Record<string, unknown>
  galleryImages: string[]
}

export default function EditProductPage() {
  const router = useRouter()
  const { id } = router.query

  const [categories, setCategories] = useState<Category[]>([])
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProduct, setLoadingProduct] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category_id: '',
    base_price: 0,
    slug: '',
    is_active: true,
    customizable: false,
    attributes: {},
    galleryImages: [],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [productAttributes, setProductAttributes] = useState<any[]>([])
  const [variantRefreshTrigger, setVariantRefreshTrigger] = useState(0)
  // Fetch product attributes
  const fetchProductAttributes = async () => {
    if (!id) return

    try {
      const response = await fetch(`/api/admin/products/${id}/attributes`)
      if (response.ok) {
        const data = await response.json()
        // Transform from API format (snake_case) to component format (camelCase)
        const transformedAttributes = (data.attributes || []).map(
          (attr: {
            id: string
            name: string
            type: string
            display_order: number
            required: boolean
            options?: Array<{
              value: string
              display_name: string
              hex_color?: string
              images?: string[]
              price_modifier?: number
            }>
          }) => ({
            id: attr.id,
            name: attr.name,
            type: attr.type,
            displayOrder: attr.display_order,
            required: attr.required,
            options: (attr.options || []).map((opt) => ({
              value: opt.value,
              displayName: opt.display_name,
              hexColor: opt.hex_color,
              images: opt.images || [],
              priceModifier: opt.price_modifier || 0,
            })),
          })
        )
        setProductAttributes(transformedAttributes)
      }
    } catch (error) {
      console.error('Error fetching attributes:', error)
    }
  }

  // Fetch product data
  useEffect(() => {
    if (!id) return

    const fetchProduct = async () => {
      setLoadingProduct(true)
      try {
        const response = await fetch(`/api/admin/products/${id}`)
        if (response.ok) {
          const product = await response.json()
          setFormData({
            name: product.name || '',
            description: product.description || '',
            category_id: product.category_id || '',
            base_price: Number(product.base_price) || 0,
            slug: product.slug || '',
            is_active: product.is_active !== undefined ? product.is_active : true,
            customizable: product.customizable !== undefined ? product.customizable : false,
            attributes: product.attributes || {},
            galleryImages: product.images || [],
          })
        } else {
          setToast({ message: 'Failed to load product', type: 'error' })
        }
      } catch (error) {
        console.error('Error fetching product:', error)
        setToast({ message: 'Failed to load product', type: 'error' })
      } finally {
        setLoadingProduct(false)
      }
    }

    fetchProduct()
    fetchProductAttributes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/categories')
        if (response.ok) {
          const data = await response.json()
          setCategories(data)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    fetchCategories()
  }, [])

  // Fetch category attributes when category changes
  useEffect(() => {
    if (!formData.category_id) return

    const fetchCategoryAttributes = async () => {
      try {
        const response = await fetch(`/api/admin/category-attributes/${formData.category_id}`)
        if (response.ok) {
          const data = await response.json()
          setCategoryAttributes(data)
        }
      } catch (error) {
        console.error('Error fetching category attributes:', error)
      }
    }

    fetchCategoryAttributes()
  }, [formData.category_id])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      // Only auto-generate slug if it's empty or matches the old auto-generated one
      slug: prev.slug === generateSlug(prev.name) || !prev.slug ? generateSlug(name) : prev.slug,
    }))
  }

  const handleGalleryChange = (galleryImages: string[]) => {
    setFormData((prev) => ({
      ...prev,
      galleryImages: galleryImages,
    }))
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Name is required'
      if (!formData.category_id) newErrors.category_id = 'Category is required'
      if (formData.base_price <= 0) newErrors.base_price = 'Base price must be greater than 0'
    }

    if (step === 2) {
      if (!formData.description.trim()) newErrors.description = 'Description is required'
      if (formData.galleryImages.length === 0)
        newErrors.galleryImages = 'At least one image is required'
    }

    if (step === 3) {
      // Validate required attributes
      categoryAttributes.forEach((attr) => {
        if (attr.required) {
          const value = formData.attributes[attr.name]
          if (!value || (Array.isArray(value) && value.length === 0)) {
            newErrors[`attr_${attr.name}`] = `${attr.name} is required`
          }
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep(currentStep)) {
      return
    }

    setLoading(true)

    try {
      if (formData.galleryImages.length === 0) {
        throw new Error('Please upload at least one image')
      }

      // Update the product
      const productData = {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id,
        base_price: formData.base_price,
        slug: formData.slug,
        is_active: formData.is_active,
        customizable: formData.customizable,
        attributes: formData.attributes,
        images: formData.galleryImages,
        thumbnail_url: formData.galleryImages[0],
        gallery_images: formData.galleryImages.slice(1),
      }

      console.log('📤 Updating product:', productData)

      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })

      if (response.ok) {
        const updatedProduct = await response.json()
        console.log('✅ Product updated:', updatedProduct)
        setToast({ message: 'Product updated successfully!', type: 'success' })
        setTimeout(() => {
          router.push('/admin/products')
        }, 1500)
      } else {
        const error = await response.json()
        console.error('❌ Product update failed:', error)
        setToast({ message: error.message || 'Failed to update product', type: 'error' })
      }
    } catch (error) {
      console.error('❌ Error updating product:', error)
      setToast({ message: 'Failed to update product: ' + error, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const selectedCategory = categories.find((c) => c.id === formData.category_id)

  if (loadingProduct) {
    return (
      <div className="w-full mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          <p className="ml-4 text-zinc-600 font-light">Loading product...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/admin/products"
            className="text-emerald-600 hover:text-emerald-700 text-sm mb-2 inline-block font-light"
          >
            ← Back to Products
          </Link>
          <h1 className="text-3xl font-light text-zinc-900 mb-2">Edit Product</h1>
          <p className="text-sm text-zinc-600 font-light">{formData.name || 'Untitled Product'}</p>
        </div>
      </div>

      {/* Clickable Tabs */}
      <div className="mb-8 border-b border-gray-200 bg-white rounded-lg shadow-sm border border-gray-100 p-2">
        <div className="flex space-x-1">
          {[
            { num: 1, label: 'Basic Info' },
            { num: 2, label: 'Images & Description' },
            { num: 3, label: 'Attributes' },
            { num: 4, label: 'Variants' },
            { num: 5, label: 'Review' },
          ].map((step) => (
            <button
              key={step.num}
              type="button"
              onClick={() => setCurrentStep(step.num)}
              className={`px-4 py-2 text-sm font-light transition-colors rounded-lg ${
                currentStep === step.num
                  ? 'bg-emerald-600 text-white'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-gray-50'
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-light mb-6 text-zinc-900">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-light text-zinc-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-zinc-900 text-sm font-light ${
                    errors.name ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="e.g., Blue Ceramic Vase"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1 font-light">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-light text-zinc-700 mb-2">Category *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, category_id: e.target.value }))
                  }
                  className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-zinc-900 text-sm font-light ${
                    errors.category_id ? 'border-red-500' : 'border-gray-200'
                  }`}
                >
                  <option value="">Select a category</option>
                  {(() => {
                    // Normalize and deduplicate categories
                    const seen = new Set<string>()
                    return categories
                      .filter((cat) => cat.is_active)
                      .filter((cat) => {
                        // Normalize name for comparison (trim whitespace, lowercase)
                        const normalizedName = cat.name.trim().toLowerCase()
                        if (seen.has(normalizedName)) {
                          return false // Skip duplicate
                        }
                        seen.add(normalizedName)
                        return true
                      })
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))
                  })()}
                </select>
                {errors.category_id && (
                  <p className="text-red-500 text-sm mt-1 font-light">{errors.category_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-light text-zinc-700 mb-2">
                  Base Price (£) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_price}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      base_price: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-zinc-900 text-sm font-light ${
                    errors.base_price ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="29.99"
                />
                {errors.base_price && (
                  <p className="text-red-500 text-sm mt-1 font-light">{errors.base_price}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-light text-zinc-700 mb-2">URL Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-zinc-900 text-sm font-light bg-gray-50"
                  placeholder="blue-ceramic-vase"
                />
                <p className="text-xs text-zinc-500 mt-1 font-light">
                  URL: /products/{formData.slug || 'product-slug'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Images & Description */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-light mb-6 text-zinc-900">Images & Description</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-light text-zinc-700 mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={6}
                  className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-zinc-900 text-sm font-light ${
                    errors.description ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Describe your product..."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1 font-light">{errors.description}</p>
                )}
              </div>

              {/* Image Management Component */}
              {selectedCategory && (
                <div>
                  <label className="block text-sm font-light text-zinc-700 mb-2">
                    Product Images *
                  </label>
                  <ImageManager
                    categorySlug={selectedCategory.slug}
                    productSlug={formData.slug || 'temp'}
                    galleryImages={formData.galleryImages}
                    onGalleryChange={handleGalleryChange}
                    maxGalleryImages={9}
                  />
                  {errors.galleryImages && (
                    <p className="text-red-500 text-sm mt-1 font-light">{errors.galleryImages}</p>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
                    }
                    className="mr-2 w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                  />
                  <span className="text-sm text-zinc-700 font-light">
                    Active (visible to customers)
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.customizable}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, customizable: e.target.checked }))
                    }
                    className="mr-2 w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                  />
                  <span className="text-sm text-zinc-700 font-light">Customizable</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Attributes - Create and manage product attributes (Color, Size, etc.) */}
        {currentStep === 3 && id && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <AttributeBuilder
              productId={id as string}
              productSlug={formData.slug}
              categorySlug={selectedCategory?.slug || 'products'}
              initialAttributes={productAttributes}
              onAttributesChange={async (attrs) => {
                setProductAttributes(attrs)
                // Refresh attributes from server after save to get IDs
                await fetchProductAttributes()
              }}
            />
          </div>
        )}

        {/* Step 4: Variants - Generate and manage variants */}
        {currentStep === 4 && id && (
          <div className="space-y-6">
            {/* Variation Generator */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-light mb-2 text-zinc-900">Generate Variants</h2>
              <p className="text-zinc-600 mb-4 font-light">
                Create all possible combinations from your attributes. For example, 3 colors × 2
                sizes = 6 variants.
              </p>
              {productAttributes.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-zinc-600 mb-2 font-light">No attributes defined yet</p>
                  <p className="text-sm text-zinc-500 mb-4 font-light">
                    Go to the &quot;Attributes&quot; tab to create attributes first
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-light"
                  >
                    Go to Attributes
                  </button>
                </div>
              ) : (
                <VariationGenerator
                  productId={id as string}
                  attributes={productAttributes}
                  basePrice={formData.base_price}
                  onGenerated={() => {
                    fetchProductAttributes()
                    // Trigger variant refresh
                    setVariantRefreshTrigger((prev) => prev + 1)
                  }}
                />
              )}
            </div>

            {/* Variant Manager - View and manage all variants */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-light mb-2 text-zinc-900">Manage Variants</h2>
              <p className="text-zinc-600 mb-4 font-light">
                View, edit, and delete all variants (both auto-generated and manual).
              </p>
              <VariantManager
                productId={id as string}
                basePrice={formData.base_price}
                refreshTrigger={variantRefreshTrigger}
              />
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {currentStep === 5 && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-light mb-6 text-zinc-900">Review Changes</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-light text-zinc-900 mb-3">Basic Information</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-700 font-light">
                      <span className="font-medium">Name:</span> {formData.name}
                    </p>
                    <p className="text-sm text-zinc-700 font-light">
                      <span className="font-medium">Category:</span> {selectedCategory?.name}
                    </p>
                    <p className="text-sm text-zinc-700 font-light">
                      <span className="font-medium">Base Price:</span> £{formData.base_price}
                    </p>
                    <p className="text-sm text-zinc-700 font-light">
                      <span className="font-medium">Slug:</span> {formData.slug}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-light text-zinc-900 mb-3">Settings</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-700 font-light">
                      <span className="font-medium">Status:</span>{' '}
                      {formData.is_active ? 'Active' : 'Inactive'}
                    </p>
                    <p className="text-sm text-zinc-700 font-light">
                      <span className="font-medium">Customizable:</span>{' '}
                      {formData.customizable ? 'Yes' : 'No'}
                    </p>
                    <p className="text-sm text-zinc-700 font-light">
                      <span className="font-medium">Images:</span> {formData.galleryImages.length}{' '}
                      uploaded
                    </p>
                  </div>
                </div>
              </div>

              {/* Attributes and Options Summary */}
              {productAttributes && productAttributes.length > 0 && (
                <div>
                  <h3 className="font-light text-zinc-900 mb-4">Product Attributes & Options</h3>
                  <div className="space-y-4">
                    {productAttributes.map((attr, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className="font-light text-zinc-900">{attr.name}</h4>
                          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-light">
                            {attr.type}
                          </span>
                          {attr.required && (
                            <span className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-full font-light">
                              Required
                            </span>
                          )}
                        </div>
                        {attr.options && attr.options.length > 0 ? (
                          <div>
                            <p className="text-sm text-zinc-600 mb-3 font-light">
                              Options ({attr.options.length}):
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {attr.options.map(
                                (
                                  opt: {
                                    value: string
                                    displayName: string
                                    images?: string[]
                                    priceModifier?: number
                                  },
                                  optIdx: number
                                ) => (
                                  <div
                                    key={optIdx}
                                    className="border border-gray-200 rounded-lg p-3 bg-white text-sm"
                                  >
                                    <div className="font-light text-zinc-900">
                                      {opt.displayName}
                                    </div>
                                    {opt.priceModifier !== undefined && opt.priceModifier !== 0 && (
                                      <div className="text-xs text-zinc-600 mt-1 font-light">
                                        {opt.priceModifier >= 0 ? '+' : ''}£
                                        {opt.priceModifier.toFixed(2)}
                                      </div>
                                    )}
                                    {opt.images &&
                                      Array.isArray(opt.images) &&
                                      opt.images.length > 0 && (
                                        <div className="text-xs text-zinc-500 mt-1 font-light">
                                          {opt.images.length} image
                                          {opt.images.length !== 1 ? 's' : ''}
                                        </div>
                                      )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-500 italic font-light">
                            No options defined
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gallery Preview */}
              {formData.galleryImages.length > 0 && (
                <div>
                  <h3 className="font-light text-zinc-900 mb-3">
                    Images ({formData.galleryImages.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {formData.galleryImages.map((imageUrl, index) => (
                      <div key={index} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt={`Gallery image ${index + 1}`}
                          className="w-full h-16 object-cover rounded-lg border border-gray-200"
                        />
                        {index === 0 && (
                          <div className="absolute top-1 left-1 bg-emerald-600 text-white text-xs px-2 py-0.5 rounded font-light">
                            Thumbnail
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(formData.attributes).length > 0 && (
                <div>
                  <h3 className="font-light text-zinc-900 mb-3">Attributes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(formData.attributes).map(([key, value]) => (
                      <p key={key} className="text-sm text-zinc-700 font-light">
                        <span className="font-medium">{key}:</span>{' '}
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end mt-6 pt-6 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-light"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
