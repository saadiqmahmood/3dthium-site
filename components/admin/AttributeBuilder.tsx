import { useState } from 'react'
import ImageUpload from './ImageUpload'

type AttributeOption = {
  value: string
  displayName: string
  hexColor?: string
  images?: string[]
  priceModifier?: number
}

type Attribute = {
  id?: string
  name: string
  type: 'color' | 'size' | 'material' | 'design' | 'custom'
  options: AttributeOption[]
  displayOrder?: number
}

type AttributeBuilderProps = {
  productId: string
  productSlug: string
  categorySlug: string
  initialAttributes?: Attribute[]
  onAttributesChange?: (attrs: Attribute[]) => void
}

export default function AttributeBuilder({
  productId,
  productSlug,
  categorySlug,
  initialAttributes = [],
  onAttributesChange,
}: AttributeBuilderProps) {
  const [attributes, setAttributes] = useState<Attribute[]>(initialAttributes)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const updateAttributes = (newAttrs: Attribute[]) => {
    setAttributes(newAttrs)
    onAttributesChange?.(newAttrs)
  }

  const addAttribute = () => {
    updateAttributes([
      ...attributes,
      {
        name: '',
        type: 'custom',
        options: [],
        displayOrder: attributes.length,
      },
    ])
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateAttribute = (index: number, field: keyof Attribute, value: any) => {
    const newAttrs = [...attributes]
    newAttrs[index] = { ...newAttrs[index], [field]: value }
    updateAttributes(newAttrs)
  }

  const removeAttribute = (index: number) => {
    const newAttrs = attributes.filter((_, i) => i !== index)
    updateAttributes(newAttrs)
  }

  const addOption = (attrIndex: number) => {
    const newAttrs = [...attributes]
    newAttrs[attrIndex].options.push({
      value: '',
      displayName: '',
      images: [],
      priceModifier: 0,
    })
    updateAttributes(newAttrs)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateOption = (attrIndex: number, optIndex: number, field: keyof AttributeOption, value: any) => {
    const newAttrs = [...attributes]
    newAttrs[attrIndex].options[optIndex] = {
      ...newAttrs[attrIndex].options[optIndex],
      [field]: value,
    }
    updateAttributes(newAttrs)
  }

  const removeOption = (attrIndex: number, optIndex: number) => {
    const newAttrs = [...attributes]
    newAttrs[attrIndex].options = newAttrs[attrIndex].options.filter((_, i) => i !== optIndex)
    updateAttributes(newAttrs)
  }

  const handleSave = async () => {
    // Validate
    for (const attr of attributes) {
      if (!attr.name.trim()) {
        setMessage({ text: 'All attributes must have a name', type: 'error' })
        return
      }
      if (attr.options.length === 0) {
        setMessage({ text: `Attribute "${attr.name}" must have at least one option`, type: 'error' })
        return
      }
      for (const opt of attr.options) {
        if (!opt.displayName.trim()) {
          setMessage({ text: `All options in "${attr.name}" must have a display name`, type: 'error' })
          return
        }
      }
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/products/${productId}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributes }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ text: 'Attributes saved successfully!', type: 'success' })
        updateAttributes(data.attributes)
      } else {
        const error = await response.json()
        setMessage({ text: error.error || 'Failed to save attributes', type: 'error' })
      }
    } catch {
      setMessage({ text: 'Failed to save attributes', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-stone-800">Product Attributes</h3>
          <p className="text-sm text-stone-600 mt-1">
            Define attributes that customers can choose from (e.g., Color, Size, Design)
          </p>
        </div>
        <button
          type="button"
          onClick={addAttribute}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          + Add Attribute
        </button>
      </div>

      {attributes.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-stone-600 mb-2">No attributes defined yet</p>
          <p className="text-sm text-stone-500">
            Click &quot;Add Attribute&quot; to create attributes like Color, Size, or Design
          </p>
        </div>
      )}

      {attributes.map((attr, attrIdx) => (
        <div key={attrIdx} className="border rounded-lg p-6 bg-white shadow-sm">
          {/* Attribute Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="grid grid-cols-2 gap-4 flex-1 mr-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-stone-800">
                  Attribute Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Color, Height, Material"
                  value={attr.name}
                  onChange={(e) => updateAttribute(attrIdx, 'name', e.target.value)}
                  className="w-full px-3 py-2 border rounded text-stone-900 bg-white focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-stone-800">Type</label>
                <select
                  value={attr.type}
                  onChange={(e) => updateAttribute(attrIdx, 'type', e.target.value)}
                  className="w-full px-3 py-2 border rounded text-stone-900 bg-white focus:ring-2 focus:ring-blue-200"
                >
                  <option value="color">Color (with color picker)</option>
                  <option value="size">Size/Dimensions</option>
                  <option value="material">Material</option>
                  <option value="design">Design Pattern</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeAttribute(attrIdx)}
              className="text-red-600 hover:text-red-800 font-medium text-sm"
            >
              Remove
            </button>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-stone-800">
                Options * ({attr.options.length})
              </label>
              <button
                type="button"
                onClick={() => addOption(attrIdx)}
                className="text-sm px-3 py-1 bg-gray-200 text-stone-800 rounded hover:bg-gray-300 transition"
              >
                + Add Option
              </button>
            </div>

            {attr.options.length === 0 && (
              <div className="border border-dashed border-gray-300 rounded p-4 text-center text-sm text-stone-600">
                No options yet. Click &quot;Add Option&quot; to create options like Red, Blue, Small, Large, etc.
              </div>
            )}

            {attr.options.map((option, optIdx) => (
              <div
                key={optIdx}
                className="grid grid-cols-12 gap-3 items-start p-3 bg-gray-50 rounded border"
              >
                {/* Value */}
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Value"
                    value={option.value}
                    onChange={(e) => updateOption(attrIdx, optIdx, 'value', e.target.value)}
                    className="w-full px-2 py-1.5 border rounded text-sm text-stone-900 bg-white"
                    title="Machine-readable value (e.g., 'red', 'small')"
                  />
                </div>

                {/* Display Name */}
                <div className="col-span-3">
                  <input
                    type="text"
                    placeholder="Display Name *"
                    value={option.displayName}
                    onChange={(e) => updateOption(attrIdx, optIdx, 'displayName', e.target.value)}
                    className="w-full px-2 py-1.5 border rounded text-sm text-stone-900 bg-white"
                    title="Human-readable name (e.g., 'Crimson Red', '6 inch')"
                  />
                </div>

                {/* Color Picker (only for color type) */}
                {attr.type === 'color' && (
                  <div className="col-span-1">
                    <input
                      type="color"
                      value={option.hexColor || '#000000'}
                      onChange={(e) => updateOption(attrIdx, optIdx, 'hexColor', e.target.value)}
                      className="w-full h-9 border rounded cursor-pointer"
                      title="Color swatch"
                    />
                  </div>
                )}

                {/* Price Modifier */}
                <div className={attr.type === 'color' ? 'col-span-2' : 'col-span-3'}>
                  <input
                    type="number"
                    placeholder="Price +/-"
                    step="0.01"
                    value={option.priceModifier || 0}
                    onChange={(e) =>
                      updateOption(attrIdx, optIdx, 'priceModifier', parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-2 py-1.5 border rounded text-sm text-stone-900 bg-white"
                    title="Price adjustment (e.g., +5 for large, -2 for small)"
                  />
                </div>

                {/* Images */}
                <div className={attr.type === 'color' ? 'col-span-3' : 'col-span-3'}>
                  <div className="text-xs text-stone-700 mb-1">
                    Images ({option.images?.length || 0})
                  </div>
                  <ImageUpload
                    categorySlug={categorySlug}
                    productSlug={`${productSlug}-${attr.name.toLowerCase()}-${option.value || optIdx}`}
                    initialImages={option.images || []}
                    onImagesChange={(images) => updateOption(attrIdx, optIdx, 'images', images)}
                    maxImages={5}
                  />
                </div>

                {/* Remove Button */}
                <div className="col-span-1 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeOption(attrIdx, optIdx)}
                    className="text-red-600 hover:text-red-800 font-bold text-lg"
                    title="Remove option"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Save Button */}
      {attributes.length > 0 && (
        <div className="flex justify-between items-center">
          <div>
            {message && (
              <span
                className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {message.text}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition"
          >
            {saving ? 'Saving...' : 'Save Attributes'}
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          How It Works:
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>1. Define attributes (e.g., Color, Height)</li>
          <li>2. Add options to each (e.g., Red, Blue for Color)</li>
          <li>3. Upload images for each option (all Red variants will inherit these images)</li>
          <li>4. Set price modifiers (e.g., +£5 for Large size)</li>
          <li>5. Save attributes, then use the Variation Generator below</li>
        </ul>
      </div>
    </div>
  )
}

