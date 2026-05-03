import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import Toast from '@/components/ui/Toast'

interface Category {
  id: string
  name: string
  slug: string
}

interface Product {
  id: string
  name: string
  slug: string
  description: string
  category_id: string
  base_price: number
  thumbnail_url: string
  images: string[]
  gallery_images: string[]
  is_active: boolean
  customizable: boolean
  attributes: Record<string, unknown>
  created_at: string
  updated_at: string
  categories?: {
    name: string
    slug: string
  }
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const PRODUCTS_PER_PAGE = 20

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/products')
      if (response.ok) {
        const json = await response.json()
        setProducts(Array.isArray(json) ? json : (json.data ?? []))
      } else {
        setToast({ message: 'Failed to fetch products', type: 'error' })
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setToast({ message: 'Failed to load products', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [fetchProducts, fetchCategories])

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())

    const matchesCategory = filterCategory ? p.category_id === filterCategory : true

    const matchesStatus =
      filterStatus === 'all' ? true : filterStatus === 'active' ? p.is_active : !p.is_active

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  )

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterCategory, filterStatus])

  // Toggle product status
  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      })

      if (response.ok) {
        setToast({
          message: `Product ${!currentStatus ? 'activated' : 'deactivated'}`,
          type: 'success',
        })
        fetchProducts()
      } else {
        setToast({ message: 'Failed to update product status', type: 'error' })
      }
    } catch (error) {
      console.error('Error toggling product status:', error)
      setToast({ message: 'Failed to update status', type: 'error' })
    }
  }

  // Delete product
  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setToast({ message: 'Product deleted successfully', type: 'success' })
        setProducts(products.filter((p) => p.id !== productId))
        setSelectedProducts(selectedProducts.filter((id) => id !== productId))
      } else {
        const error = await response.json()
        setToast({ message: error.message || 'Failed to delete product', type: 'error' })
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      setToast({ message: 'Failed to delete product', type: 'error' })
    }
  }

  // Bulk operations
  const toggleSelectAll = () => {
    if (selectedProducts.length === paginatedProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(paginatedProducts.map((p) => p.id))
    }
  }

  const toggleSelectProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    )
  }

  const handleBulkDelete = async () => {
    if (
      !confirm(`Delete ${selectedProducts.length} selected products? This action cannot be undone.`)
    ) {
      return
    }

    for (const productId of selectedProducts) {
      try {
        await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' })
      } catch (error) {
        console.error('Error deleting product:', productId, error)
      }
    }

    setToast({ message: `Deleted ${selectedProducts.length} products`, type: 'success' })
    setSelectedProducts([])
    fetchProducts()
  }

  const handleBulkStatusChange = async (newStatus: boolean) => {
    for (const productId of selectedProducts) {
      try {
        await fetch(`/api/admin/products/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: newStatus }),
        })
      } catch (error) {
        console.error('Error updating product:', productId, error)
      }
    }

    setToast({
      message: `${selectedProducts.length} products ${newStatus ? 'activated' : 'deactivated'}`,
      type: 'success',
    })
    setSelectedProducts([])
    fetchProducts()
  }

  // Get category name
  const getCategoryName = (product: Product) => {
    if (product.categories?.name) return product.categories.name
    const category = categories.find((c) => c.id === product.category_id)
    return category?.name || 'Uncategorized'
  }

  return (
    <div className="w-full mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-light text-zinc-900 mb-2">Products</h1>
          <p className="text-sm text-zinc-600 font-light">Manage your 3D printable products</p>
        </div>
        <Link
          href="/admin/create-product"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-light"
        >
          + Create Product
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-zinc-500 font-light mb-1">Total Products</p>
          <p className="text-2xl font-light text-zinc-900">{products.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-emerald-600 font-light mb-1">Active</p>
          <p className="text-2xl font-light text-zinc-900">
            {products.filter((p) => p.is_active).length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-zinc-500 font-light mb-1">Inactive</p>
          <p className="text-2xl font-light text-zinc-900">
            {products.filter((p) => !p.is_active).length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-zinc-500 font-light mb-1">Customizable</p>
          <p className="text-2xl font-light text-zinc-900">
            {products.filter((p) => p.customizable).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3 items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 w-64 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-sm font-light"
        />

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-sm font-light"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
          className="border border-gray-200 rounded-lg px-4 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-sm font-light"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>

        <button
          onClick={() => {
            setSearch('')
            setFilterCategory('')
            setFilterStatus('all')
          }}
          className="text-sm text-zinc-600 hover:text-zinc-900 font-light ml-auto"
        >
          Clear Filters
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm text-emerald-900 font-light">
            {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkStatusChange(true)}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors font-light"
            >
              Activate Selected
            </button>
            <button
              onClick={() => handleBulkStatusChange(false)}
              className="px-3 py-1.5 bg-zinc-600 text-white rounded-lg text-sm hover:bg-zinc-700 transition-colors font-light"
            >
              Deactivate Selected
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors font-light"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 w-12">
                <input
                  type="checkbox"
                  checked={
                    paginatedProducts.length > 0 &&
                    selectedProducts.length === paginatedProducts.length
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                />
              </th>
              <th className="px-4 py-3 text-left font-light text-zinc-700">Image</th>
              <th className="px-4 py-3 text-left font-light text-zinc-700">Product</th>
              <th className="px-4 py-3 text-left font-light text-zinc-700">Category</th>
              <th className="px-4 py-3 text-left font-light text-zinc-700">Price</th>
              <th className="px-4 py-3 text-center font-light text-zinc-700">Status</th>
              <th className="px-4 py-3 text-center font-light text-zinc-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="text-zinc-600 mt-2 font-light">Loading products...</p>
                </td>
              </tr>
            ) : paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-zinc-500">
                  {search || filterCategory || filterStatus !== 'all' ? (
                    <>
                      <p className="text-lg mb-2 font-light">No products match your filters</p>
                      <button
                        onClick={() => {
                          setSearch('')
                          setFilterCategory('')
                          setFilterStatus('all')
                        }}
                        className="text-emerald-600 hover:text-emerald-700 font-light"
                      >
                        Clear filters
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-lg mb-2 font-light">No products yet</p>
                      <Link
                        href="/admin/create-product"
                        className="text-emerald-600 hover:text-emerald-700 font-light"
                      >
                        Create your first product
                      </Link>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              paginatedProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleSelectProduct(product.id)}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <div className="relative">
                      {product.thumbnail_url ? (
                        <Image
                          src={product.thumbnail_url}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-zinc-400 text-xs font-light">No image</span>
                        </div>
                      )}
                      {product.images && product.images.length > 1 && (
                        <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full font-light">
                          +{product.images.length - 1}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div>
                      <p className="font-light text-zinc-900">{product.name}</p>
                      {product.customizable && (
                        <span className="inline-block mt-1 bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded font-light">
                          Customizable
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-zinc-700 font-light">{getCategoryName(product)}</td>

                  <td className="px-4 py-3">
                    <span className="font-light text-zinc-900">
                      £{Number(product.base_price).toFixed(2)}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleProductStatus(product.id, product.is_active)}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-light transition-colors ${
                        product.is_active
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-gray-100 text-zinc-600 hover:bg-gray-200'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${product.is_active ? 'bg-emerald-500' : 'bg-zinc-400'}`}
                      />
                      {product.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-center">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-emerald-600 hover:text-emerald-700 border border-emerald-300 px-3 py-1 rounded-lg text-xs hover:bg-emerald-50 transition-colors font-light"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-700 border border-red-300 px-3 py-1 rounded-lg text-xs hover:bg-red-50 transition-colors font-light"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-light text-sm"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-600 font-light">
            Page {currentPage} of {totalPages} ({filteredProducts.length} products)
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-light text-sm"
          >
            Next
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
