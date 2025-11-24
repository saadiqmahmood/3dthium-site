import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import ImageManager from '@/components/admin/ImageManager'
import VariantManager from '@/components/admin/VariantManager'
import AttributeBuilder from '@/components/admin/AttributeBuilder'
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
  // Fetch product attributes
  const fetchProductAttributes = async () => {
    if (!id) return

    try {
      const response = await fetch(`/api/admin/products/${id}/attributes`)
      if (response.ok) {
        const data = await response.json()
        setProductAttributes(data.attributes || [])
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
            {attribute.description && (
              <p className="text-xs text-gray-500 mb-1">{attribute.description}</p>
            )}
            <input
              type="text"
              value={String(value)}
              onChange={(e) => handleAttributeChange(attribute.name, e.target.value)}
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-stone-800 ${
                error ? 'border-red-500' : ''
              }`}
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
                error ? 'border-red-500' : ''
              }`}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        )

      case 'boolean':
        return (
          <div key={attribute.id}>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                id={attribute.id}
                checked={Boolean(value)}
                onChange={(e) => handleAttributeChange(attribute.name, e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">{attribute.name}</span>
            </label>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
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
                error ? 'border-red-500' : ''
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
                <label key={option} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Array.isArray(value) && value.includes(option)}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : []
                      const newValues = e.target.checked
                        ? [...currentValues, option]
                        : currentValues.filter((v) => v !== option)
                      handleAttributeChange(attribute.name, newValues)
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
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

  const selectedCategory = categories.find((c) => c.id === formData.category_id)

  if (loadingProduct) {
    return (
      <div className="w-full mx-auto bg-white p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full mx-auto bg-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/admin/products"
            className="text-blue-600 hover:underline text-sm mb-2 inline-block"
          >
            ← Back to Products
          </Link>
          <h2 className="text-2xl font-bold text-stone-800">Edit Product</h2>
          <p className="text-sm text-gray-600 mt-1">{formData.name || 'Untitled Product'}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {[
            { num: 1, label: 'Basic Info' },
            { num: 2, label: 'Images & Description' },
            { num: 3, label: 'Attributes' },
            { num: 4, label: 'Variants' },
            { num: 5, label: 'Review' },
          ].map((step, index) => (
            <div key={step.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step.num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.num}
                </div>
                <span className="text-xs mt-1 text-gray-600">{step.label}</span>
              </div>
              {index < 4 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    currentStep > step.num ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-stone-800">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-stone-800 ${
                    errors.name ? 'border-red-500' : ''
                  }`}
                  placeholder="e.g., Blue Ceramic Vase"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, category_id: e.target.value }))
                  }
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-stone-800 ${
                    errors.category_id ? 'border-red-500' : ''
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
                  <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-stone-800 ${
                    errors.base_price ? 'border-red-500' : ''
                  }`}
                  placeholder="29.99"
                />
                {errors.base_price && (
                  <p className="text-red-500 text-sm mt-1">{errors.base_price}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-stone-800 bg-gray-100"
                  placeholder="blue-ceramic-vase"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL: /products/{formData.slug || 'product-slug'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Images & Description */}
        {currentStep === 2 && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-stone-800">Images & Description</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={6}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-stone-800 ${
                    errors.description ? 'border-red-500' : ''
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
                  <span className="text-sm text-gray-700">Active (visible to customers)</span>
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
            <h2 className="text-xl font-semibold mb-4 text-stone-800">Product Attributes</h2>
            {categoryAttributes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryAttributes.map(renderAttributeField)}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No attributes defined for this category.
              </p>
            )}
          </div>
        )}

        {/* Step 4: Variants */}
        {currentStep === 4 && id && (
          <div className="space-y-8">
            {/* Attribute Builder */}
            <div className="bg-gray-50 rounded-lg p-6">
              <AttributeBuilder
                productId={id as string}
                productSlug={formData.slug}
                categorySlug={selectedCategory?.slug || 'products'}
                initialAttributes={productAttributes}
                onAttributesChange={(attrs) => setProductAttributes(attrs)}
              />
            </div>

            {/* Variation Generator */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-stone-800">
                Bulk Variation Generator
              </h2>
              <p className="text-stone-600 mb-6">
                Generate all possible combinations from your attributes automatically. For example,
                3 colors × 2 sizes = 6 variations created instantly.
              </p>
              <VariationGenerator
                productId={id as string}
                attributes={productAttributes}
                basePrice={formData.base_price}
                onGenerated={fetchProductAttributes}
              />
            </div>

            {/* Manual Variant Manager (Old System - Still Available) */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-stone-800">
                Manual Variant Management
              </h2>
              <p className="text-stone-600 mb-6">
                View and manage all variants (both auto-generated and manual). You can also add
                individual variants here if needed.
              </p>
              <VariantManager productId={id as string} basePrice={formData.base_price} />
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {currentStep === 5 && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-stone-800">Review Changes</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">Basic Information</h3>
                  <p>
                    <strong>Name:</strong> {formData.name}
                  </p>
                  <p>
                    <strong>Category:</strong> {selectedCategory?.name}
                  </p>
                  <p>
                    <strong>Base Price:</strong> £{formData.base_price}
                  </p>
                  <p>
                    <strong>Slug:</strong> {formData.slug}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Settings</h3>
                  <p>
                    <strong>Status:</strong> {formData.is_active ? 'Active' : 'Inactive'}
                  </p>
                  <p>
                    <strong>Customizable:</strong> {formData.customizable ? 'Yes' : 'No'}
                  </p>
                  <p>
                    <strong>Images:</strong> {formData.galleryImages.length} uploaded
                  </p>
                </div>
              </div>

              {/* Gallery Preview */}
              {formData.galleryImages.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900">
                    Images ({formData.galleryImages.length})
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
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 transition"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </form>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
