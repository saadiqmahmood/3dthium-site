import { useEffect, useState } from 'react'
import Spinner from '@/components/ui/Spinner'
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
  created_at: string
  children?: Category[]
  product_count?: number
}

interface CategoryFormData {
  name: string
  slug: string
  parent_id: string | null
  description: string
  image_url: string
  sort_order: number
  is_active: boolean
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    parent_id: null,
    description: '',
    image_url: '',
    sort_order: 0,
    is_active: true,
  })
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        setToast({ message: 'Failed to fetch categories', type: 'error' })
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setToast({ message: 'Failed to fetch categories', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const buildCategoryTree = (
    categories: Category[],
    parentId: string | null = null
  ): Category[] => {
    return categories
      .filter((cat) => cat.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((cat) => ({
        ...cat,
        children: buildCategoryTree(categories, cat.id),
      }))
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories'

      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowForm(false)
        setEditingCategory(null)
        resetForm()
        fetchCategories()
        setToast({ message: editingCategory ? 'Category updated' : 'Category created', type: 'success' })
      } else {
        const json = await response.json()
        setToast({ message: json.message || 'Failed to save category', type: 'error' })
      }
    } catch (error) {
      console.error('Error saving category:', error)
      setToast({ message: 'Failed to save category', type: 'error' })
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      parent_id: category.parent_id,
      description: category.description || '',
      image_url: category.image_url || '',
      sort_order: category.sort_order,
      is_active: category.is_active,
    })
    setShowForm(true)
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchCategories()
        setToast({ message: 'Category deleted', type: 'success' })
      } else {
        const json = await response.json()
        setToast({ message: json.message || 'Failed to delete category', type: 'error' })
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      setToast({ message: 'Failed to delete category', type: 'error' })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      parent_id: null,
      description: '',
      image_url: '',
      sort_order: 0,
      is_active: true,
    })
  }

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

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

  const renderCategoryTree = (categories: Category[], level: number = 0) => {
    return categories.map((category) => (
      <div key={category.id} className="border-l-2 border-gray-100 ml-4">
        <div
          className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${level > 0 ? 'ml-4' : ''}`}
        >
          <div className="flex items-center space-x-3">
            {category.children && category.children.length > 0 && (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {expandedCategories.has(category.id) ? '▼' : '▶'}
              </button>
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span
                  className={`font-light text-zinc-900 ${level === 0 ? 'text-base' : 'text-sm'}`}
                >
                  {category.name}
                </span>
                {category.product_count !== undefined && (
                  <span className="text-xs text-zinc-500 font-light">
                    ({category.product_count})
                  </span>
                )}
                {!category.is_active && (
                  <span className="text-xs bg-gray-100 text-zinc-600 px-2 py-0.5 rounded-full font-light">
                    Inactive
                  </span>
                )}
              </div>
              {category.description && (
                <p className="text-sm text-zinc-600 mt-1 font-light">{category.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleEdit(category)}
              className="text-emerald-600 hover:text-emerald-700 border border-emerald-300 px-3 py-1 rounded-lg hover:bg-emerald-50 transition-colors text-xs font-light"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(category.id)}
              className="text-red-600 hover:text-red-700 border border-red-300 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors text-xs font-light"
            >
              Delete
            </button>
          </div>
        </div>
        {category.children &&
          category.children.length > 0 &&
          expandedCategories.has(category.id) && (
            <div className="ml-4">{renderCategoryTree(category.children, level + 1)}</div>
          )}
      </div>
    ))
  }

  const categoryTree = buildCategoryTree(categories)

  if (loading) {
    return (
      <div className="w-full mx-auto">
        <Spinner label="Loading categories..." />
      </div>
    )
  }

  return (
    <div className="w-full mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-light text-zinc-900 mb-2">Categories</h1>
          <p className="text-sm text-zinc-600 font-light">Manage product categories</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingCategory(null)
            resetForm()
          }}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-light"
        >
          + Add Category
        </button>
      </div>

      {/* Category Form */}
      {showForm && (
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-light mb-6 text-zinc-900">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-light text-zinc-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-zinc-900 text-sm font-light"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-light text-zinc-700 mb-2">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-zinc-900 text-sm font-light"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-light text-zinc-700 mb-2">
                  Parent Category
                </label>
                <select
                  value={formData.parent_id || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, parent_id: e.target.value || null }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-zinc-900 text-sm font-light"
                >
                  <option value="">No Parent (Top Level)</option>
                  {categories
                    .filter((cat) => cat.parent_id === null)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-light text-zinc-700 mb-2">Sort Order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-zinc-900 text-sm font-light"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-light text-zinc-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-zinc-900 text-sm font-light"
              />
            </div>
            <div>
              <label className="block text-sm font-light text-zinc-700 mb-2">Image URL</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-zinc-900 text-sm font-light"
                placeholder="https://example.com/image.jpg"
              />
            </div>
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
                <span className="text-sm text-zinc-700 font-light">Active</span>
              </label>
            </div>
            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-light"
              >
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingCategory(null)
                  resetForm()
                }}
                className="px-6 py-2 bg-white border border-gray-200 text-zinc-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-light"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-light text-zinc-900">Categories ({categories.length})</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {categoryTree.length > 0 ? (
            renderCategoryTree(categoryTree)
          ) : (
            <div className="px-6 py-12 text-center text-zinc-500 font-light">
              No categories found. Create your first category to get started.
            </div>
          )}
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
