import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
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
  attributes: Record<string, any>
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
        const data = await response.json()
        setProducts(data || [])
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
    <div className="w-full mx-auto bg-white p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Products</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your 3D printable products</p>
        </div>
        <Link
          href="/admin/create-product"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          + Create Product
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-2xl font-bold text-gray-900">{products.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600">Active</p>
          <p className="text-2xl font-bold text-green-900">
            {products.filter((p) => p.is_active).length}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-red-600">Inactive</p>
          <p className="text-2xl font-bold text-red-900">
            {products.filter((p) => !p.is_active).length}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600">Customizable</p>
          <p className="text-2xl font-bold text-blue-900">
            {products.filter((p) => p.customizable).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3 items-center bg-gray-50 p-4 rounded-lg">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-64 text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border rounded px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
          className="border rounded px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
          className="text-sm text-gray-600 hover:text-gray-900 underline ml-auto"
        >
          Clear Filters
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm text-blue-900 font-medium">
            {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkStatusChange(true)}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition"
            >
              Activate Selected
            </button>
            <button
              onClick={() => handleBulkStatusChange(false)}
              className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition"
            >
              Deactivate Selected
            </button>
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 w-12">
                <input
                  type="checkbox"
                  checked={
                    paginatedProducts.length > 0 &&
                    selectedProducts.length === paginatedProducts.length
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4"
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Image</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Product</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Price</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading products...</p>
                </td>
              </tr>
            ) : paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  {search || filterCategory || filterStatus !== 'all' ? (
                    <>
                      <p className="text-lg mb-2">No products match your filters</p>
                      <button
                        onClick={() => {
                          setSearch('')
                          setFilterCategory('')
                          setFilterStatus('all')
                        }}
                        className="text-blue-600 hover:underline"
                      >
                        Clear filters
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-lg mb-2">No products yet</p>
                      <Link href="/admin/create-product" className="text-blue-600 hover:underline">
                        Create your first product
                      </Link>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              paginatedProducts.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleSelectProduct(product.id)}
                      className="w-4 h-4"
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
                          className="object-cover rounded border"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No image</span>
                        </div>
                      )}
                      {product.images && product.images.length > 1 && (
                        <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                          +{product.images.length - 1}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      {product.customizable && (
                        <span className="inline-block mt-1 bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded">
                          Customizable
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-gray-700">{getCategoryName(product)}</td>

                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-900">
                      £{Number(product.base_price).toFixed(2)}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleProductStatus(product.id, product.is_active)}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition ${
                        product.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${product.is_active ? 'bg-green-500' : 'bg-gray-400'}`}
                      />
                      {product.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-center">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-blue-600 hover:text-blue-800 border border-blue-300 px-3 py-1 rounded text-xs hover:bg-blue-50 transition"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-800 border border-red-300 px-3 py-1 rounded text-xs hover:bg-red-50 transition"
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
        <div className="flex justify-between items-center mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition"
          >
            Previous
          </button>
          <span className="text-sm text-stone-800">
            Page {currentPage} of {totalPages} ({filteredProducts.length} products)
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition"
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
