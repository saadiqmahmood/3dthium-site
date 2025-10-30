import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import ImageManager from '@/components/admin/ImageManager'
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
  attributes: Record<string, string | number | boolean | string[]>
  galleryImages: string[] // URLs of uploaded images
}

export default function CreateProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>([])
  const [loading, setLoading] = useState(false)
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

  // Define functions before using them in useEffect
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

  const fetchCategoryAttributes = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/admin/category-attributes/${categoryId}`)
      if (response.ok) {
        const data = await response.json()
        setCategoryAttributes(data)

        // Initialize attributes with default values
        const initialAttributes: Record<string, string | number | boolean | string[]> = {}
        data.forEach((attr: CategoryAttribute) => {
          if (attr.default_value) {
            initialAttributes[attr.name] = attr.default_value
          } else if (attr.type === 'boolean') {
            initialAttributes[attr.name] = false
          } else if (attr.type === 'multiselect') {
            initialAttributes[attr.name] = []
          } else {
            initialAttributes[attr.name] = ''
          }
        })

        setFormData((prev) => ({
          ...prev,
          attributes: { ...prev.attributes, ...initialAttributes },
        }))
      }
    } catch (error) {
      console.error('Error fetching category attributes:', error)
    }
  }

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (formData.category_id) {
      fetchCategoryAttributes(formData.category_id)
    }
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
      slug: generateSlug(name),
    }))
  }

  const handleAttributeChange = (
    attributeName: string,
    value: string | number | boolean | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attributeName]: value,
      },
    }))
  }

  const handleGalleryChange = (galleryImages: string[]) => {
    console.log('🖼️ Gallery images updated:', galleryImages)
    console.log('🖼️ Previous gallery state:', formData.galleryImages)
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
        newErrors.galleryImages = 'At least one gallery image is required'
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

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep(currentStep)) {
      return
    }

    setLoading(true)

    try {
      // Images are already uploaded to Supabase Storage via ImageManager
      // formData.galleryImages contains the URLs

      if (formData.galleryImages.length === 0) {
        throw new Error('Please upload at least one image')
      }

      // Create the product with the uploaded image URLs
      const productData = {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id,
        base_price: formData.base_price,
        slug: formData.slug,
        is_active: formData.is_active,
        customizable: formData.customizable,
        attributes: formData.attributes,
        images: formData.galleryImages, // URLs from ImageManager
        thumbnail_url: formData.galleryImages[0], // First image is thumbnail
        gallery_images: formData.galleryImages.slice(1), // Rest are gallery
      }

      console.log('📤 Submitting product:', productData)

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })

      if (response.ok) {
        const newProduct = await response.json()
        console.log('✅ Product created:', newProduct)
        setToast({ message: 'Product created successfully!', type: 'success' })
        // Redirect after a short delay to show the toast
        setTimeout(() => {
          router.push(`/admin/products`)
        }, 1500)
      } else {
        const error = await response.json()
        console.error('❌ Product creation failed:', error)
        setToast({ message: error.message || 'Failed to create product', type: 'error' })
      }
    } catch (error) {
      console.error('❌ Error creating product:', error)
      setToast({ message: 'Failed to create product: ' + error, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const renderAttributeField = (attribute: CategoryAttribute) => {
    const value = formData.attributes[attribute.name] || ''
    const error = errors[`attr_${attribute.name}`]

    switch (attribute.type) {
      case 'text':
        return (
          <div key={attribute.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {attribute.name} {attribute.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={String(value)}
              onChange={(e) => handleAttributeChange(attribute.name, e.target.value)}
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-stone-800 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={attribute.description}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        )

      case 'number':
        return (
          <div key={attribute.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {attribute.name} {attribute.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              value={String(value)}
              onChange={(e) =>
                handleAttributeChange(attribute.name, parseFloat(e.target.value) || 0)
              }
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-stone-800 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={attribute.description}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        )

      case 'boolean':
        return (
          <div key={attribute.id} className="flex items-center">
            <input
              type="checkbox"
              id={attribute.id}
              checked={Boolean(value)}
              onChange={(e) => handleAttributeChange(attribute.name, e.target.checked)}
              className="mr-2"
            />
            <label htmlFor={attribute.id} className="text-sm font-medium text-gray-700">
              {attribute.name} {attribute.required && <span className="text-red-500">*</span>}
            </label>
            {error && <p className="text-red-500 text-sm ml-2">{error}</p>}
          </div>
        )

      case 'select':
        return (
          <div key={attribute.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {attribute.name} {attribute.required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={String(value)}
              onChange={(e) => handleAttributeChange(attribute.name, e.target.value)}
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-stone-800 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select {attribute.name}</option>
              {attribute.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        )

      case 'multiselect':
        return (
          <div key={attribute.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {attribute.name} {attribute.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              {attribute.options?.map((option) => (
                <label key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={Array.isArray(value) && value.includes(option)}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : []
                      if (e.target.checked) {
                        handleAttributeChange(attribute.name, [...currentValues, option])
                      } else {
                        handleAttributeChange(
                          attribute.name,
                          currentValues.filter((v) => v !== option)
                        )
                      }
                    }}
                    className="mr-2"
                  />
                  {option}
                </label>
              ))}
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        )

      default:
        return null
    }
  }

  const steps = [
    { number: 1, title: 'Basic Info', description: 'Product name, category, and pricing' },
    { number: 2, title: 'Description & Media', description: 'Product description and images' },
    { number: 3, title: 'Attributes', description: 'Category-specific attributes' },
    { number: 4, title: 'Review & Create', description: 'Review and create product' },
  ]

  const selectedCategory = categories.find((c) => c.id === formData.category_id)

  return (
    <div className="w-full mx-auto bg-white p-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-stone-800">Create New Product</h1>
        <Link
          href="/admin/products"
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
        >
          Back to Products
        </Link>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= step.number
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 text-gray-500'
                }`}
              >
                {step.number}
              </div>
              <div className="ml-3">
                <div
                  className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-xs text-gray-400">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-stone-800">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-stone-800 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter product name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-stone-800 ${
                    errors.slug ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="product-url-slug"
                />
                {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, category_id: e.target.value }))
                  }
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-stone-800 ${
                    errors.category_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Category</option>
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
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))
                  })()}
                </select>
                {errors.category_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Price *</label>
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
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-stone-800 ${
                    errors.base_price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.base_price && (
                  <p className="text-red-500 text-sm mt-1">{errors.base_price}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Description & Media */}
        {currentStep === 2 && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-stone-800">Description & Media</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={4}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-stone-800 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe your product..."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              {/* Image Management Component */}
              {selectedCategory && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    <p className="text-red-500 text-sm mt-1">{errors.galleryImages}</p>
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
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.customizable}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, customizable: e.target.checked }))
                    }
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Customizable</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Attributes */}
        {currentStep === 3 && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-stone-800">Category Attributes</h2>
            {categoryAttributes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryAttributes.map(renderAttributeField)}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No attributes defined for this category. You can add attributes in the category
                management.
              </p>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-stone-800">Review & Create</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">Basic Information</h3>
                  <p>
                    <strong>Name:</strong> {formData.name}
                  </p>
                  <p>
                    <strong>Category:</strong>{' '}
                    {categories.find((c) => c.id === formData.category_id)?.name}
                  </p>
                  <p>
                    <strong>Base Price:</strong> ${formData.base_price}
                  </p>
                  <p>
                    <strong>Slug:</strong> {formData.slug}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Settings</h3>
                  <p>
                    <strong>Active:</strong> {formData.is_active ? 'Yes' : 'No'}
                  </p>
                  <p>
                    <strong>Customizable:</strong> {formData.customizable ? 'Yes' : 'No'}
                  </p>
                  <p>
                    <strong>Description:</strong> {formData.description.substring(0, 100)}...
                  </p>
                </div>
              </div>

              {/* Gallery Preview */}
              {formData.galleryImages.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900">
                    Gallery Images ({formData.galleryImages.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {formData.galleryImages.map((imageUrl, index) => (
                      <div key={index} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt={`Gallery image ${index + 1}`}
                          className="w-full h-16 object-cover rounded border"
                        />
                        {index === 0 && (
                          <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1 rounded">
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
                  <h3 className="font-medium text-gray-900">Attributes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(formData.attributes).map(([key, value]) => (
                      <p key={key}>
                        <strong>{key}:</strong>{' '}
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          )}
        </div>
      </form>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
