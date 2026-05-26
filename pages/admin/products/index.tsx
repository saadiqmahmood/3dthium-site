import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import Toast from '@/components/ui/Toast'
import { formatMoney } from '@/lib/format/money'
import { authFetch } from '@/lib/api/authFetch'

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
      const response = await authFetch('/api/admin/products')
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
      const response = await authFetch('/api/admin/categories')
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
  }, [])

  // Toggle product status
  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await authFetch(`/api/admin/products/${productId}`, {
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
      const response = await authFetch(`/api/admin/products/${productId}`, {
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
        await authFetch(`/api/admin/products/${productId}`, { method: 'DELETE' })
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
        await authFetch(`/api/admin/products/${productId}`, {
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-0.5 bg-emerald-500" />
          <div className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-zinc-500">Total Products</span>
            </div>
            <p className="text-3xl font-semibold text-zinc-900 tabular-nums">{products.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-0.5 bg-emerald-500" />
          <div className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-zinc-500">Active</span>
            </div>
            <p className="text-3xl font-semibold text-zinc-900 tabular-nums">{products.filter((p) => p.is_active).length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-0.5 bg-emerald-500" />
          <div className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <span className="text-sm font-medium text-zinc-500">Inactive</span>
            </div>
            <p className="text-3xl font-semibold text-zinc-900 tabular-nums">{products.filter((p) => !p.is_active).length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-0.5 bg-emerald-500" />
          <div className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-zinc-500">Customizable</span>
            </div>
            <p className="text-3xl font-semibold text-zinc-900 tabular-nums">{products.filter((p) => p.customizable).length}</p>
          </div>
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
          type="button"
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
              type="button"
              onClick={() => handleBulkStatusChange(true)}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors font-light"
            >
              Activate Selected
            </button>
            <button
              type="button"
              onClick={() => handleBulkStatusChange(false)}
              className="px-3 py-1.5 bg-zinc-600 text-white rounded-lg text-sm hover:bg-zinc-700 transition-colors font-light"
            >
              Deactivate Selected
            </button>
            <button
              type="button"
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
                        type="button"
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
                      {formatMoney(product.base_price)}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
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
                        type="button"
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
            type="button"
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
            type="button"
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
