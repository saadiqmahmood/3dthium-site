import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import { Product, ProductVariant } from '@/types'

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CATEGORIES = [
  'Vases',
  'Home Decor',
  'Kitchen Accessories',
  'Camera Accessories',
  'Charms & Keychains',
  'Personalized Party Items',
  'Gifts & Custom Items',
]

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showVariantsModal, setShowVariantsModal] = useState(false)
  const [variantProduct, setVariantProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  // Type for form state
  interface ProductForm {
    title: string;
    description: string;
    category: string;
    thumbnail_url: string;
    slug: string;
  }
  const [form, setForm] = useState<ProductForm>({
    title: '',
    description: '',
    category: 'Vases',
    thumbnail_url: '',
    slug: '',
  })
  // Type for variant form
  interface VariantForm {
    color: string;
    image_url: string;
    price: string;
    in_stock: boolean;
    customizable: boolean;
  }
  const [variantForm, setVariantForm] = useState<VariantForm>({ color: '', image_url: '', price: '', in_stock: true, customizable: false })
  // Filtered products
  const filteredProducts = products.filter(p =>
    (p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())) &&
    (filterCategory ? p.category === filterCategory : true)
  );
  const PRODUCTS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabaseClient
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }
  useEffect(() => { fetchProducts() }, [])

  // Fetch variants for a product
  const fetchVariants = async (productId: string) => {
    const { data } = await supabaseClient.from('product_variants').select('*').eq('product_id', productId)
    setVariants(data || [])
  }

  // Open modal for add/edit
  const openModal = (product: Product | null = null) => {
    setEditingProduct(product)
    setForm(product ? {
      title: product.title,
      description: product.description || '',
      category: product.category || 'Vases',
      thumbnail_url: product.thumbnail_url || '',
      slug: product.slug || '',
    } : {
      title: '',
      description: '',
      category: 'Vases',
      thumbnail_url: '',
      slug: '',
    })
    setShowModal(true)
  }
  // Handle form change
  type ChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  const handleChange = (e: ChangeEvent) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }
  // Save product
  const handleSave = async () => {
    if (!form.title || !form.slug) return alert('Title and slug are required')
    if (editingProduct) {
      await supabaseClient.from('products').update(form).eq('id', editingProduct.id)
    } else {
      await supabaseClient.from('products').insert([{ ...form, id: crypto.randomUUID() }])
    }
    setShowModal(false)
    setEditingProduct(null)
    await fetchProducts()
  }
  // Delete product
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    await supabaseClient.from('products').delete().eq('id', id)
    await fetchProducts()
  }

  const openVariantsModal = async (product: Product) => {
    setVariantProduct(product)
    setShowVariantsModal(true)
    setEditingVariant(null)
    setVariantForm({ color: '', image_url: '', price: '', in_stock: true, customizable: false })
    await fetchVariants(product.id)
  }

  const handleVariantChange = (e: ChangeEvent) => {
    setVariantForm(f => ({ ...f, [e.target.name]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))
  }

  const handleSaveVariant = async () => {
    if (!variantProduct) return
    // No need to check for image_url_manual, just rely on the input/upload handlers
    if (!variantForm.color || !variantForm.image_url || !variantForm.price) return alert('Color, image, and price are required')
    if (editingVariant) {
      await supabaseClient.from('product_variants').update({
        ...variantForm,
        price: Number(variantForm.price)
      }).eq('id', editingVariant.id)
    } else {
      await supabaseClient.from('product_variants').insert([{
        ...variantForm,
        price: Number(variantForm.price),
        product_id: variantProduct.id
      }])
    }
    setEditingVariant(null)
    setVariantForm({ color: '', image_url: '', price: '', in_stock: true, customizable: false })
    await fetchVariants(variantProduct.id)
  }

  const handleEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant)
    setVariantForm({
      color: variant.color,
      image_url: variant.image_url,
      price: String(variant.price),
      in_stock: variant.in_stock,
      customizable: variant.customizable
    })
  }

  const handleDeleteVariant = async (id: string) => {
    if (!variantProduct) return
    if (!confirm('Delete this variant?')) return
    await supabaseClient.from('product_variants').delete().eq('id', id)
    await fetchVariants(variantProduct.id)
  }

  // Reset to page 1 when filters/search change
  useEffect(() => { setCurrentPage(1); }, [search, filterCategory]);

  // Bulk select logic
  const allSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedProducts.includes(p.id))
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedProducts(selectedProducts.filter(id => !filteredProducts.some(p => p.id === id)))
    } else {
      setSelectedProducts([...new Set([...selectedProducts, ...filteredProducts.map(p => p.id)])])
    }
  }
  const toggleSelectProduct = (id: string) => {
    setSelectedProducts(selectedProducts.includes(id) ? selectedProducts.filter(i => i !== id) : [...selectedProducts, id])
  }
  const handleBulkDelete = async () => {
    for (const id of selectedProducts) {
      await supabaseClient.from('products').delete().eq('id', id)
    }
    setProducts(products => products.filter(p => !selectedProducts.includes(p.id)))
    setSelectedProducts([])
  }

  // Add image upload helpers
  const uploadImage = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${folder}/${crypto.randomUUID()}.${fileExt}`
    const { error } = await supabaseClient.storage.from('public').upload(fileName, file, { upsert: true })
    if (error) throw error
    // Get public URL
    supabaseClient.storage.from('public').getPublicUrl(fileName)
    return fileName
  }

  return (
    <div className="w-full mx-auto bg-white p-16">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-stone-800">Products</h2>
        <button onClick={() => openModal(null)} className="text-stone-800 border border-stone-300 px-3 py-1 rounded hover:bg-stone-100 transition">Add Product</button>
      </div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Search by title or category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-48 text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="border rounded px-3 py-2 text-stone-800"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <button onClick={() => { setFilterCategory(''); setSearch(''); }} className="text-sm text-gray-500 underline ml-2">Clear Filters</button>
      </div>
      {/* Bulk actions */}
      <div className="mb-2 flex items-center gap-2">
        <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="accent-blue-200 w-5 h-3 rounded" />
        <span className="text-sm text-stone-800">Select All</span>
        {selectedProducts.length > 0 && (
          <span
            onClick={handleBulkDelete}
            className="ml-4 text-red-700 font-semibold hover:underline cursor-pointer select-none text-sm"
          >
            Delete Selected
          </span>
        )}
        <span className="ml-auto text-sm text-gray-500">{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-3"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="accent-blue-200 w-5 h-3 rounded" /></th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Image</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Title</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Slug</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading products...</td></tr>
            ) : paginatedProducts.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">No products found.</td></tr>
            ) : paginatedProducts.map(product => (
              <tr key={product.id} className="border-b hover:bg-gray-50">
                <td className="px-2 py-3"><input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => toggleSelectProduct(product.id)} className="accent-blue-200 w-5 h-3 rounded" /></td>
                <td className="px-4 py-3">
                  {product.thumbnail_url ? (
                    <Image src={product.thumbnail_url} alt={product.title} width={64} height={64} className="object-cover rounded" />
                  ) : (
                    <span className="text-gray-400 italic">No image</span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{product.title}</td>
                <td className="px-4 py-3 text-gray-700">{product.category}</td>
                <td className="px-4 py-3 text-gray-500 font-mono break-all">{product.slug}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(product)}
                      className="text-stone-800 border border-stone-300 px-3 py-1 rounded hover:bg-stone-100 transition"
                    >Edit</button>
                    <button
                      onClick={() => openVariantsModal(product)}
                      className="text-stone-800 border border-stone-300 px-3 py-1 rounded hover:bg-stone-100 transition"
                    >Edit Variants</button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 border border-stone-300 px-3 py-1 rounded hover:bg-red-50 transition"
                    >Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50">Previous</button>
        <span className="text-sm text-stone-800">Page {currentPage} of {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50">Next</button>
      </div>
      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-stone-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-stone-800">{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1 text-stone-800">Title</label>
              <input name="title" value={form.title} onChange={handleChange} className="border rounded px-3 py-2 w-full text-stone-800" />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1 text-stone-800">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} className="border rounded px-3 py-2 w-full text-stone-800" />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1 text-stone-800">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="border rounded px-3 py-2 w-full text-stone-800">
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1 text-stone-800">Thumbnail URL</label>
              <div className="flex items-center gap-2">
                <input name="thumbnail_url" value={form.thumbnail_url} onChange={e => {
                  // If thumbnail_url is already a Supabase URL (from upload), block manual entry
                  if (form.thumbnail_url && form.thumbnail_url.includes('supabase.co/storage/v1/object/public/product-images')) {
                    alert('Please use either a thumbnail URL or upload a file, not both.');
                    return;
                  }
                  handleChange(e);
                }} className="border rounded px-3 py-2 w-full text-stone-800" />
                <span className="mx-1 text-stone-800 font-semibold">or</span>
                <input type="file" accept="image/*" style={{ display: 'none' }} id="product-image-upload" onChange={async e => {
                  if (form.thumbnail_url && form.thumbnail_url.trim() !== '') {
                    alert('Please use either a thumbnail URL or upload a file, not both.');
                    return;
                  }
                  if (e.target.files && e.target.files[0]) {
                    const url = await uploadImage(e.target.files[0], 'product-images')
                    setForm(f => ({ ...f, thumbnail_url: url }))
                  }
                }} />
                <label htmlFor="product-image-upload" className="text-stone-800 border border-stone-300 px-3 py-1 rounded cursor-pointer hover:bg-stone-100 transition">Upload</label>
              </div>
              {form.thumbnail_url && <Image src={form.thumbnail_url} alt="Preview" width={96} height={96} className="mt-2 object-cover rounded" />}
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1 text-stone-800">Slug</label>
              <input name="slug" value={form.slug} onChange={handleChange} className="border rounded px-3 py-2 w-full text-stone-800" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSave} className="text-stone-800 border border-stone-300 px-3 py-1 rounded hover:bg-stone-100 transition">Save</button>
              <button onClick={() => setShowModal(false)} className="text-stone-800 border border-stone-300 px-3 py-1 rounded hover:bg-stone-100 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showVariantsModal && variantProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowVariantsModal(false)}>
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-stone-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-stone-800">Variants for {variantProduct.title}</h3>
            <table className="min-w-full text-sm mb-4">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-2 text-stone-800">Color</th>
                  <th className="px-2 py-2 text-stone-800">Image</th>
                  <th className="px-2 py-2 text-stone-800">Price</th>
                  <th className="px-2 py-2 text-stone-800">In Stock</th>
                  <th className="px-2 py-2 text-stone-800">Customizable</th>
                  <th className="px-2 py-2 text-stone-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {variants.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-gray-500">No variants</td></tr>}
                {variants.map(variant => (
                  <tr key={variant.id}>
                    <td className="px-2 py-2 text-stone-800">{variant.color}</td>
                    <td className="px-2 py-2">{variant.image_url ? <Image src={variant.image_url} alt={variant.color} width={40} height={40} className="object-cover rounded" /> : <span className="text-gray-400 italic">No image</span>}</td>
                    <td className="px-2 py-2 text-stone-800">£{Number(variant.price).toFixed(2)}</td>
                    <td className="px-2 py-2 text-stone-800">{variant.in_stock ? 'Yes' : 'No'}</td>
                    <td className="px-2 py-2 text-stone-800">{variant.customizable ? 'Yes' : 'No'}</td>
                    <td className="px-2 py-2">
                      <div className="flex gap-2">
                        <button onClick={() => handleEditVariant(variant)} className="text-stone-800 border border-stone-300 px-3 py-1 rounded hover:bg-stone-100 transition">Edit</button>
                        <button onClick={() => handleDeleteVariant(variant.id)} className="text-red-600 border border-stone-300 px-3 py-1 rounded hover:bg-red-50 transition">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Add/Edit Variant Form */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1 text-stone-800">Color</label>
              <input name="color" value={variantForm.color} onChange={handleVariantChange} className="border rounded px-3 py-2 w-full text-stone-800" />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1 text-stone-800">Image URL</label>
              <div className="flex items-center gap-2">
                <input name="image_url" value={variantForm.image_url} onChange={e => {
                  // If image_url is already a Supabase URL (from upload), block manual entry
                  if (variantForm.image_url && variantForm.image_url.includes('supabase.co/storage/v1/object/public/variant-images')) {
                    alert('Please use either an image URL or upload a file, not both.');
                    return;
                  }
                  handleVariantChange(e);
                }} className="border rounded px-3 py-2 w-full text-stone-800" />
                <span className="mx-1 text-stone-800 font-semibold">or</span>
                <input type="file" accept="image/*" style={{ display: 'none' }} id="variant-image-upload" onChange={async e => {
                  if (variantForm.image_url && variantForm.image_url.trim() !== '') {
                    alert('Please use either an image URL or upload a file, not both.');
                    return;
                  }
                  if (e.target.files && e.target.files[0]) {
                    const url = await uploadImage(e.target.files[0], 'variant-images')
                    setVariantForm(f => ({ ...f, image_url: url }))
                  }
                }} />
                <label htmlFor="variant-image-upload" className="text-stone-800 border border-stone-300 px-3 py-1 rounded cursor-pointer hover:bg-stone-100 transition">Upload</label>
              </div>
              {variantForm.image_url && <Image src={variantForm.image_url} alt="Preview" width={80} height={80} className="mt-2 object-cover rounded" />}
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1 text-stone-800">Price</label>
              <input name="price" type="number" min="0" value={variantForm.price} onChange={handleVariantChange} className="border rounded px-3 py-2 w-full text-stone-800" />
            </div>
            <div className="mb-3 flex gap-4 items-center">
              <label className="flex items-center gap-2 text-sm font-medium text-stone-800">
                <input type="checkbox" name="in_stock" checked={variantForm.in_stock} onChange={handleVariantChange} /> In Stock
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-stone-800">
                <input type="checkbox" name="customizable" checked={variantForm.customizable} onChange={handleVariantChange} /> Customizable
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSaveVariant} className="text-stone-800 border border-stone-300 px-3 py-1 rounded hover:bg-stone-100 transition">{editingVariant ? 'Save Changes' : 'Add Variant'}</button>
              <button onClick={() => { setEditingVariant(null); setVariantForm({ color: '', image_url: '', price: '', in_stock: true, customizable: false }) }} className="text-stone-800 border border-stone-300 px-3 py-1 rounded hover:bg-stone-100 transition">Clear</button>
              <button onClick={() => setShowVariantsModal(false)} className="text-stone-800 border border-stone-300 px-3 py-1 rounded hover:bg-stone-100 transition ml-auto">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 