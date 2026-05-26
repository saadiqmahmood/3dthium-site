import { useEffect, useId, useState } from 'react'
import Toast from '@/components/ui/Toast'
import { formatMoney } from '@/lib/format/money'
import type { ProductVariantNew } from '@/types'
import { authFetch } from '@/lib/api/authFetch'

interface VariantManagerProps {
  productId: string
  basePrice: number
  refreshTrigger?: number // Add refresh trigger prop
}

export default function VariantManager({
  productId,
  basePrice,
  refreshTrigger,
}: VariantManagerProps) {
  const [variants, setVariants] = useState<ProductVariantNew[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)
  const [valueToDisplayNameMap, setValueToDisplayNameMap] = useState<Record<string, string>>({})
  const fId = useId()

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

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkApplying, setBulkApplying] = useState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchVariants and fetchAttributeOptions are stable async fetchers
  useEffect(() => {
    if (productId) {
      fetchVariants()
      fetchAttributeOptions()
    }
  }, [productId, refreshTrigger])

  const fetchAttributeOptions = async () => {
    try {
      const response = await authFetch(`/api/admin/products/${productId}/attributes`)
      if (response.ok) {
        const data = await response.json()
        const attributes = data.attributes || []

        // Create mapping from value to display_name
        const mapping: Record<string, string> = {}
        attributes.forEach((attr: { options?: Array<{ value: string; display_name: string }> }) => {
          if (attr.options) {
            attr.options.forEach((opt: { value: string; display_name: string }) => {
              mapping[opt.value] = opt.display_name
            })
          }
        })
        setValueToDisplayNameMap(mapping)
      }
    } catch (error) {
      console.error('Error fetching attribute options:', error)
    }
  }

  const fetchVariants = async () => {
    setLoading(true)
    try {
      const response = await authFetch(`/api/admin/product-variants/${productId}`)
      if (response.ok) {
        const json = await response.json()
        setVariants(Array.isArray(json) ? json : (json.data ?? []))
      } else {
        const json = await response.json()
        const msg = json.error?.message ?? json.error ?? 'Failed to fetch variants'
        setToast({ message: msg, type: 'error' })
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

    // Check for duplicate before submitting
    const normalizedSize = formData.size?.trim() || null
    const normalizedColor = formData.color?.trim() || null
    const normalizedMaterial = formData.material?.trim() || null

    const duplicate = variants.find((v) => {
      const vSize = v.size?.trim() || null
      const vColor = v.color?.trim() || null
      const vMaterial = v.material?.trim() || null

      return (
        vSize === normalizedSize && vColor === normalizedColor && vMaterial === normalizedMaterial
      )
    })

    if (duplicate) {
      setToast({
        message: `A variant with this combination already exists (SKU: ${duplicate.sku || 'N/A'})`,
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

    try {
      const response = await authFetch(`/api/admin/product-variants/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        await response.json()
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
        const errorMessage = error.error?.message ?? error.error ?? 'Failed to create variant'

        setToast({
          message: errorMessage,
          type: 'error',
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
    // Check for duplicate before submitting (excluding current variant)
    const normalizedSize = (editFormData.size as string)?.trim() || null
    const normalizedColor = (editFormData.color as string)?.trim() || null
    const normalizedMaterial = (editFormData.material as string)?.trim() || null

    const duplicate = variants.find(
      (v) =>
        v.id !== variantId &&
        (v.size?.trim() || null) === normalizedSize &&
        (v.color?.trim() || null) === normalizedColor &&
        (v.material?.trim() || null) === normalizedMaterial
    )

    if (duplicate) {
      setToast({
        message: `Another variant already has this combination (ID: ${duplicate.id}, SKU: ${duplicate.sku || 'N/A'})`,
        type: 'error',
      })
      return
    }

    setSaving(true)
    try {
      const response = await authFetch(`/api/admin/product-variants/${productId}/${variantId}`, {
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

        setToast({
          message: error.error?.message ?? error.error ?? 'Failed to update variant',
          type: 'error',
        })
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
      const response = await authFetch(`/api/admin/product-variants/${productId}/${variantId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setToast({ message: 'Variant deleted successfully', type: 'success' })
        fetchVariants()
      } else {
        const error = await response.json()
        setToast({
          message: error.error?.message ?? error.error ?? 'Failed to delete variant',
          type: 'error',
        })
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
      price_adjustment: Number(variant.price_adjustment),
      sku: variant.sku || '',
      is_available: variant.is_available,
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditFormData({})
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === variants.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(variants.map((v) => v.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (!selectedIds.size) return
    if (!confirm(`Delete ${selectedIds.size} variant${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`)) return
    setBulkApplying(true)
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          authFetch(`/api/admin/product-variants/${productId}/${id}`, { method: 'DELETE' })
        )
      )
      setToast({ message: `${selectedIds.size} variant${selectedIds.size > 1 ? 's' : ''} deleted`, type: 'success' })
      setSelectedIds(new Set())
      fetchVariants()
    } catch {
      setToast({ message: 'Failed to delete some variants', type: 'error' })
    } finally {
      setBulkApplying(false)
    }
  }

  const calculateFinalPrice = (priceAdjustment: number | string) => {
    return Number(basePrice) + Number(priceAdjustment)
  }

  // Helper function to get display name for a value
  const getDisplayName = (value: string | null | undefined): string => {
    if (!value) return '-'
    return valueToDisplayNameMap[value] || value
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="text-zinc-600 mt-2 font-light">Loading variants...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create Variant Form */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
        <h3 className="text-lg font-light mb-4 text-zinc-900">Add New Variant</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Size */}
            <div>
              <label
                htmlFor={`${fId}-size`}
                className="block text-sm font-light mb-2 text-zinc-700"
              >
                Size (optional)
              </label>
              <input
                id={`${fId}-size`}
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="e.g., 150mm, 180mm"
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-zinc-900 placeholder:text-zinc-500 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-sm font-light"
              />
            </div>

            {/* Color */}
            <div>
              <label
                htmlFor={`${fId}-color`}
                className="block text-sm font-light mb-2 text-zinc-700"
              >
                Color (optional)
              </label>
              <input
                id={`${fId}-color`}
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="e.g., White, Black"
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-zinc-900 placeholder:text-zinc-500 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-sm font-light"
              />
            </div>

            {/* Material */}
            <div>
              <label
                htmlFor={`${fId}-material`}
                className="block text-sm font-light mb-2 text-zinc-700"
              >
                Material (optional)
              </label>
              <input
                id={`${fId}-material`}
                type="text"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                placeholder="e.g., PLA, PETG"
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-zinc-900 placeholder:text-zinc-500 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-sm font-light"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Price Adjustment */}
            <div>
              <label
                htmlFor={`${fId}-price`}
                className="block text-sm font-light mb-2 text-zinc-700"
              >
                Price Adjustment (£)
                <span className="text-zinc-600 text-xs ml-2 font-light">
                  Base: {formatMoney(basePrice)} → Final:{' '}
                  {formatMoney(
                    calculateFinalPrice(Number.parseFloat(formData.price_adjustment || '0'))
                  )}
                </span>
              </label>
              <input
                id={`${fId}-price`}
                type="number"
                step="0.01"
                value={formData.price_adjustment}
                onChange={(e) => setFormData({ ...formData, price_adjustment: e.target.value })}
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-zinc-900 placeholder:text-zinc-500 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-sm font-light"
              />
              <p className="text-xs text-zinc-600 mt-1 font-light">
                Positive = more expensive, negative = cheaper
              </p>
            </div>

            {/* SKU */}
            <div>
              <label htmlFor={`${fId}-sku`} className="block text-sm font-light mb-2 text-zinc-700">
                SKU (optional)
                <span className="text-zinc-600 text-xs ml-2 font-light">
                  Auto-generated if empty
                </span>
              </label>
              <input
                id={`${fId}-sku`}
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="PROD-150-WHT-PLA"
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-zinc-900 placeholder:text-zinc-500 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-sm font-light"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`${fId}-available`}
              checked={formData.is_available}
              onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              className="rounded w-4 h-4 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor={`${fId}-available`} className="text-sm font-light text-zinc-700">
              Available for purchase
            </label>
          </div>

          <button
            type="button"
            onClick={handleCreateVariant}
            disabled={saving}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition-colors font-light"
          >
            {saving ? 'Creating...' : 'Add Variant'}
          </button>
        </div>
      </div>

      {/* Variants List */}
      <div>
        <h3 className="text-lg font-light mb-4 text-zinc-900">
          Existing Variants ({variants.length})
        </h3>

        {variants.length === 0 ? (
          <div className="border border-gray-200 rounded-lg p-8 text-center bg-gray-50">
            <p className="text-zinc-900 font-light">
              No variants created yet. Add your first variant above.
            </p>
            <p className="text-sm mt-2 text-zinc-600 font-light">
              Variants allow customers to choose size, color, and material options.
            </p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            {/* Bulk action bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border-b border-red-100">
                <span className="text-sm font-light text-red-800">
                  {selectedIds.size} variant{selectedIds.size > 1 ? 's' : ''} selected
                </span>
                <button
                  type="button"
                  disabled={bulkApplying}
                  onClick={handleBulkDelete}
                  className="ml-auto px-4 py-1.5 bg-red-600 text-white text-sm font-light rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors"
                >
                  {bulkApplying ? 'Deleting…' : 'Delete Selected'}
                </button>
              </div>
            )}
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === variants.length && variants.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-light text-zinc-700">Size</th>
                  <th className="px-4 py-3 text-left text-sm font-light text-zinc-700">Color</th>
                  <th className="px-4 py-3 text-left text-sm font-light text-zinc-700">Material</th>
                  <th className="px-4 py-3 text-left text-sm font-light text-zinc-700">
                    Adjustment
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-light text-zinc-700">
                    Final Price
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-light text-zinc-700">SKU</th>
                  <th className="px-4 py-3 text-left text-sm font-light text-zinc-700">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-light text-zinc-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {variants.map((variant) => (
                  <tr key={variant.id} className={`transition-colors ${selectedIds.has(variant.id) ? 'bg-emerald-50/60' : 'hover:bg-gray-50'}`}>
                    {editingId === variant.id ? (
                      // Edit mode
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(variant.id)}
                            onChange={() => toggleSelect(variant.id)}
                            className="rounded w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={(editFormData.size as string) || ''}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, size: e.target.value })
                            }
                            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm font-light focus:outline-none focus:ring-2 focus:ring-emerald-200"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={(editFormData.color as string) || ''}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, color: e.target.value })
                            }
                            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm font-light focus:outline-none focus:ring-2 focus:ring-emerald-200"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={(editFormData.material as string) || ''}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, material: e.target.value })
                            }
                            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm font-light focus:outline-none focus:ring-2 focus:ring-emerald-200"
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
                            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm font-light focus:outline-none focus:ring-2 focus:ring-emerald-200"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-900 font-light">
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
                            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm font-light focus:outline-none focus:ring-2 focus:ring-emerald-200"
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
                            className="rounded w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateVariant(variant.id)}
                            disabled={saving}
                            className="text-emerald-600 hover:text-emerald-700 text-sm font-light"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="text-zinc-600 hover:text-zinc-700 text-sm font-light"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      // View mode
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(variant.id)}
                            onChange={() => toggleSelect(variant.id)}
                            className="rounded w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-900 font-light">
                          {getDisplayName(variant.size)}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-900 font-light">
                          {getDisplayName(variant.color)}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-900 font-light">
                          {getDisplayName(variant.material)}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-900 font-light">
                          {variant.price_adjustment >= 0 ? '+' : ''}
                          {formatMoney(variant.price_adjustment)}
                        </td>
                        <td className="px-4 py-3 text-sm font-light text-zinc-900">
                          {formatMoney(calculateFinalPrice(variant.price_adjustment))}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-zinc-700 font-light">
                          {variant.sku || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full font-light ${
                              variant.is_available
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-gray-100 text-zinc-600'
                            }`}
                          >
                            {variant.is_available ? 'Available' : 'Hidden'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => startEditing(variant)}
                            className="text-emerald-600 hover:text-emerald-700 text-sm font-light"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVariant(variant.id)}
                            disabled={saving}
                            className="text-red-600 hover:text-red-700 text-sm font-light"
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
