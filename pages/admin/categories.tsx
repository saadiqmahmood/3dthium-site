import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

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
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    parent_id: null,
    description: '',
    image_url: '',
    sort_order: 0,
    is_active: true
  })
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        console.error('Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const buildCategoryTree = (categories: Category[], parentId: string | null = null): Category[] => {
    return categories
      .filter(cat => cat.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(cat => ({
        ...cat,
        children: buildCategoryTree(categories, cat.id)
      }))
  }

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        window.location.href = '/auth'
        return
      }
      if (!isAdmin) {
        window.location.href = '/'
        return
      }
    }
  }, [user, isAdmin, authLoading])

  useEffect(() => {
    fetchCategories()
  }, [])

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated or not admin
  if (!user || !isAdmin) {
    return null
  }

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
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowForm(false)
        setEditingCategory(null)
        resetForm()
        fetchCategories()
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'Failed to save category'}`)
      }
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Failed to save category')
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
      is_active: category.is_active
    })
    setShowForm(true)
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchCategories()
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'Failed to delete category'}`)
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category')
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
      is_active: true
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
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }))
  }

  const renderCategoryTree = (categories: Category[], level: number = 0) => {
    return categories.map(category => (
      <div key={category.id} className="border-l-2 border-gray-200 ml-4">
        <div className={`flex items-center justify-between p-3 hover:bg-gray-50 ${level > 0 ? 'ml-4' : ''}`}>
          <div className="flex items-center space-x-3">
            {category.children && category.children.length > 0 && (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="text-gray-500 hover:text-gray-700"
              >
                {expandedCategories.has(category.id) ? '▼' : '▶'}
              </button>
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className={`font-medium text-gray-900 ${level === 0 ? 'text-lg' : 'text-base'}`}>
                  {category.name}
                </span>
                {category.product_count !== undefined && (
                  <span className="text-sm text-gray-500">({category.product_count})</span>
                )}
                {!category.is_active && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Inactive</span>
                )}
              </div>
              {category.description && (
                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleEdit(category)}
              className="text-stone-800 border border-stone-300 px-3 py-1 rounded hover:bg-stone-100 transition"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(category.id)}
              className="text-stone-800 border border-stone-300 px-3 py-1 rounded hover:bg-stone-100 transition"
            >
              Delete
            </button>
          </div>
        </div>
        {category.children && category.children.length > 0 && expandedCategories.has(category.id) && (
          <div className="ml-4">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  const categoryTree = buildCategoryTree(categories)

  if (loading) {
    return (
      <div className="w-full mx-auto bg-white p-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full mx-auto bg-white p-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-stone-800">Category Management</h1>
        <div className="flex space-x-4">
          <Link href="/admin" className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
            Back to Admin
          </Link>
          <button
            onClick={() => {
              setShowForm(true)
              setEditingCategory(null)
              resetForm()
            }}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
          >
            Add New Category
          </button>
        </div>
      </div>

      {/* Category Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-stone-800">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-stone-800"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-stone-800"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                <select
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value || null }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-stone-800"
                >
                  <option value="">No Parent (Top Level)</option>
                  {categories
                    .filter(cat => cat.parent_id === null)
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-stone-800"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-stone-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-stone-800"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300"
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
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b bg-gray-100">
          <h3 className="text-lg font-medium text-gray-900">Categories ({categories.length})</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {categoryTree.length > 0 ? (
            renderCategoryTree(categoryTree)
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No categories found. Create your first category to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 