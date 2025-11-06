import { useEffect, useState } from 'react'
import Toast from '@/components/ui/Toast'
import type { ProductVariantNew } from '@/types'

interface VariantManagerProps {
  productId: string
  basePrice: number
}

export default function VariantManager({ productId, basePrice }: VariantManagerProps) {
  const [variants, setVariants] = useState<ProductVariantNew[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)

  // Form state for new variant
  const [formData, setFormData] = useState({
    size: '',
    color: '',
    material: '',
    price_adjustment: '0',
    sku: '',
    is_available: true,
  })

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (productId) {
      fetchVariants()
    }
  }, [productId])

  const fetchVariants = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/product-variants/${productId}`)
      if (response.ok) {
        const data = await response.json()
        setVariants(data)
      } else {
        const error = await response.json()
        setToast({ message: error.error || 'Failed to fetch variants', type: 'error' })
      }
    } catch (error) {
      console.error('Error fetching variants:', error)
      setToast({ message: 'Failed to fetch variants', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateVariant = async () => {
    // Validate at least one attribute
    if (!formData.size && !formData.color && !formData.material) {
      setToast({
        message: 'Please provide at least one attribute (size, color, or material)',
        type: 'error',
      })
      return
    }

    setSaving(true)
    
    const payload = {
      size: formData.size || null,
      color: formData.color || null,
      material: formData.material || null,
      price_adjustment: Number.parseFloat(formData.price_adjustment) || 0,
      sku: formData.sku || null,
      is_available: formData.is_available,
      stock_quantity: 0, // Print-on-demand
    }
    
    console.log('🚀 [VARIANT MANAGER] Creating variant:', payload)
    
    try {
      const response = await fetch(`/api/admin/product-variants/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      console.log('📡 [VARIANT MANAGER] Response status:', response.status)

      if (response.ok) {
        const created = await response.json()
        console.log('✅ [VARIANT MANAGER] Variant created:', created)
        setToast({ message: 'Variant created successfully', type: 'success' })
        // Reset form
        setFormData({
          size: '',
          color: '',
          material: '',
          price_adjustment: '0',
          sku: '',
          is_available: true,
        })
        // Refresh variants
        fetchVariants()
      } else {
        const error = await response.json()
        console.error('❌ [VARIANT MANAGER] Error response:', error)
        setToast({ 
          message: error.details || error.hint || error.error || 'Failed to create variant', 
          type: 'error' 
        })
      }
    } catch (error) {
      console.error('❌ [VARIANT MANAGER] Fetch error:', error)
      setToast({ message: 'Network error: Failed to create variant', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateVariant = async (variantId: string) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/product-variants/${productId}/${variantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      })

      if (response.ok) {
        setToast({ message: 'Variant updated successfully', type: 'success' })
        setEditingId(null)
        setEditFormData({})
        fetchVariants()
      } else {
        const error = await response.json()
        setToast({ message: error.error || 'Failed to update variant', type: 'error' })
      }
    } catch (error) {
      console.error('Error updating variant:', error)
      setToast({ message: 'Failed to update variant', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) {
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/product-variants/${productId}/${variantId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setToast({ message: 'Variant deleted successfully', type: 'success' })
        fetchVariants()
      } else {
        const error = await response.json()
        setToast({ message: error.error || 'Failed to delete variant', type: 'error' })
      }
    } catch (error) {
      console.error('Error deleting variant:', error)
      setToast({ message: 'Failed to delete variant', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const startEditing = (variant: ProductVariantNew) => {
    setEditingId(variant.id)
    setEditFormData({
      size: variant.size || '',
      color: variant.color || '',
      material: variant.material || '',
      price_adjustment: variant.price_adjustment,
      sku: variant.sku || '',
      is_available: variant.is_available,
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditFormData({})
  }

  const calculateFinalPrice = (priceAdjustment: number) => {
    return basePrice + priceAdjustment
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-stone-800">Loading variants...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create Variant Form */}
      <div className="border rounded-lg p-6 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4 text-stone-800">Add New Variant</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Size */}
            <div>
              <label className="block text-sm font-medium mb-1 text-stone-800">
                Size (optional)
              </label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="e.g., 150mm, 180mm"
                className="w-full border rounded px-3 py-2 text-stone-900 placeholder:text-stone-500 bg-white"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium mb-1 text-stone-800">
                Color (optional)
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="e.g., White, Black"
                className="w-full border rounded px-3 py-2 text-stone-900 placeholder:text-stone-500 bg-white"
              />
            </div>

            {/* Material */}
            <div>
              <label className="block text-sm font-medium mb-1 text-stone-800">
                Material (optional)
              </label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                placeholder="e.g., PLA, PETG"
                className="w-full border rounded px-3 py-2 text-stone-900 placeholder:text-stone-500 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Price Adjustment */}
            <div>
              <label className="block text-sm font-medium mb-1 text-stone-800">
                Price Adjustment (£)
                <span className="text-stone-700 text-xs ml-2">
                  Base: £{basePrice.toFixed(2)} → Final: £
                  {calculateFinalPrice(Number.parseFloat(formData.price_adjustment || '0')).toFixed(
                    2
                  )}
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price_adjustment}
                onChange={(e) => setFormData({ ...formData, price_adjustment: e.target.value })}
                placeholder="0.00"
                className="w-full border rounded px-3 py-2 text-stone-900 placeholder:text-stone-500 bg-white"
              />
              <p className="text-xs text-stone-700 mt-1">
                Positive = more expensive, negative = cheaper
              </p>
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium mb-1 text-stone-800">
                SKU (optional)
                <span className="text-stone-700 text-xs ml-2">Auto-generated if empty</span>
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="PROD-150-WHT-PLA"
                className="w-full border rounded px-3 py-2 text-stone-900 placeholder:text-stone-500 bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_available"
              checked={formData.is_available}
              onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="is_available" className="text-sm font-medium text-stone-800">
              Available for purchase
            </label>
          </div>

          <button
            type="button"
            onClick={handleCreateVariant}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Creating...' : 'Add Variant'}
          </button>
        </div>
      </div>

      {/* Variants List */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-stone-800">
          Existing Variants ({variants.length})
        </h3>

        {variants.length === 0 ? (
          <div className="border rounded-lg p-8 text-center text-stone-700">
            <p className="text-stone-800">No variants created yet. Add your first variant above.</p>
            <p className="text-sm mt-2 text-stone-700">
              Variants allow customers to choose size, color, and material options.
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-stone-800">Size</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-stone-800">
                    Color
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-stone-800">
                    Material
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-stone-800">
                    Adjustment
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-stone-800">
                    Final Price
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-stone-800">SKU</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-stone-800">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-stone-800">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {variants.map((variant) => (
                  <tr key={variant.id} className="hover:bg-gray-50">
                    {editingId === variant.id ? (
                      // Edit mode
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={(editFormData.size as string) || ''}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, size: e.target.value })
                            }
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={(editFormData.color as string) || ''}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, color: e.target.value })
                            }
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={(editFormData.material as string) || ''}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, material: e.target.value })
                            }
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={editFormData.price_adjustment as number}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                price_adjustment: Number.parseFloat(e.target.value),
                              })
                            }
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          £
                          {calculateFinalPrice(
                            (editFormData.price_adjustment as number) || 0
                          ).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={(editFormData.sku as string) || ''}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, sku: e.target.value })
                            }
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={editFormData.is_available as boolean}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                is_available: e.target.checked,
                              })
                            }
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleUpdateVariant(variant.id)}
                            disabled={saving}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      // View mode
                      <>
                        <td className="px-4 py-3 text-sm text-stone-800">{variant.size || '-'}</td>
                        <td className="px-4 py-3 text-sm text-stone-800">{variant.color || '-'}</td>
                        <td className="px-4 py-3 text-sm text-stone-800">
                          {variant.material || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-stone-800">
                          {variant.price_adjustment >= 0 ? '+' : ''}£
                          {variant.price_adjustment.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-stone-800">
                          £{calculateFinalPrice(variant.price_adjustment).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-stone-700">
                          {variant.sku || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${
                              variant.is_available
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {variant.is_available ? 'Available' : 'Hidden'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => startEditing(variant)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteVariant(variant.id)}
                            disabled={saving}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
