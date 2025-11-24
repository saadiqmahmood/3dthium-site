import { useEffect, useState } from 'react'
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
  const isEditingRef = { current: false }
  const lastSyncedLengthRef = { current: initialAttributes.length }

  // Only sync from props when not actively editing
  // This prevents the disappearing issue when adding new attributes
  useEffect(() => {
    if (isEditingRef.current) {
      return // Don't sync while user is editing
    }

    // Only sync if the length changed and we didn't cause it (i.e., it came from server)
    // Or if attributes have IDs that we don't have locally
    const propsHaveIds = initialAttributes.some((a) => a.id)
    const localHasIds = attributes.some((a) => a.id)

    if (
      propsHaveIds &&
      (!localHasIds || initialAttributes.length !== lastSyncedLengthRef.current)
    ) {
      setAttributes(initialAttributes)
      setExpandedAttributes(new Set())
      lastSyncedLengthRef.current = initialAttributes.length
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAttributes])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [expandedAttributes, setExpandedAttributes] = useState<Set<number>>(new Set())

  const updateAttributes = (newAttrs: Attribute[]) => {
    isEditingRef.current = true // Mark that we're editing
    setAttributes(newAttrs)
    // Don't call onAttributesChange on every update - only parent needs to know on save
    // onAttributesChange?.(newAttrs)
    // Reset editing flag after state update
    setTimeout(() => {
      isEditingRef.current = false
    }, 50)
  }

  const addAttribute = () => {
    isEditingRef.current = true
    const newIndex = attributes.length
    updateAttributes([
      ...attributes,
      {
        name: '',
        type: 'custom',
        options: [],
        displayOrder: attributes.length,
      },
    ])
    // Auto-expand the new attribute
    setExpandedAttributes(new Set([...expandedAttributes, newIndex]))
    // Reset editing flag after a short delay to allow state to settle
    setTimeout(() => {
      isEditingRef.current = false
    }, 100)
  }

  const toggleAttribute = (index: number) => {
    const newExpanded = new Set(expandedAttributes)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedAttributes(newExpanded)
  }

  const updateAttribute = (
    index: number,
    field: keyof Attribute,
    value:
      | string
      | number
      | AttributeOption[]
      | 'color'
      | 'size'
      | 'material'
      | 'design'
      | 'custom'
      | undefined
  ) => {
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

  // Auto-generate value from displayName and attribute name for better uniqueness
  const generateValueFromDisplayName = (displayName: string, attributeName: string): string => {
    // Clean the attribute name to use as prefix
    const attrPrefix = attributeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 10) // Limit prefix length

    // Clean the display name
    const displayValue = displayName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Combine: attribute-name-display-value
    // This ensures uniqueness and makes values more meaningful
    return `${attrPrefix}-${displayValue}`
  }

  const updateOption = (
    attrIndex: number,
    optIndex: number,
    field: keyof AttributeOption,
    value: string | number | string[] | undefined
  ) => {
    const newAttrs = [...attributes]
    const option = newAttrs[attrIndex].options[optIndex]
    const attribute = newAttrs[attrIndex]

    // Auto-generate value when displayName changes and value is empty
    if (field === 'displayName' && !option.value && typeof value === 'string') {
      const autoValue = generateValueFromDisplayName(value, attribute.name || 'option')
      newAttrs[attrIndex].options[optIndex] = {
        ...option,
        displayName: value,
        value: autoValue,
      }
    } else {
      newAttrs[attrIndex].options[optIndex] = {
        ...option,
        [field]: value,
      }
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

      // Color attributes must have images for all options
      const isColorType =
        attr.type === 'color' ||
        attr.name.toLowerCase().includes('color') ||
        attr.name.toLowerCase().includes('colour')
      if (isColorType) {
        for (const opt of attr.options) {
          if (!opt.images || opt.images.length === 0) {
            setMessage({
              text: `Color attribute "${attr.name}" requires images for all options. Please add images to option "${opt.displayName || opt.value}".`,
              type: 'error',
            })
            return
          }
        }
      }
      if (attr.options.length === 0) {
        setMessage({
          text: `Attribute "${attr.name}" must have at least one option`,
          type: 'error',
        })
        return
      }
      for (const opt of attr.options) {
        if (!opt.displayName || !opt.displayName.trim()) {
          setMessage({
            text: `All options in "${attr.name}" must have a display name`,
            type: 'error',
          })
          return
        }
        // Auto-generate value if missing
        if (!opt.value?.trim() && opt.displayName) {
          opt.value = generateValueFromDisplayName(opt.displayName, attr.name || 'option')
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
        // Transform the response to match our Attribute type
        const transformedAttributes = data.attributes.map(
          (attr: {
            id: string
            name: string
            type: string
            display_order: number
            required: boolean
            options?: Array<{
              value: string
              display_name: string
              hex_color?: string
              images?: string[]
              price_modifier?: number
            }>
          }) => ({
            id: attr.id,
            name: attr.name,
            type: attr.type,
            displayOrder: attr.display_order,
            required: attr.required,
            options: (attr.options || []).map((opt) => ({
              value: opt.value,
              displayName: opt.display_name,
              hexColor: opt.hex_color,
              images: opt.images || [],
              priceModifier: opt.price_modifier || 0,
            })),
          })
        )
        updateAttributes(transformedAttributes)
        // Notify parent after save (this will trigger fetchProductAttributes)
        onAttributesChange?.(transformedAttributes)
        // Collapse all attributes after saving
        setExpandedAttributes(new Set())
        // Auto-dismiss success message after 3 seconds
        setTimeout(() => {
          setMessage(null)
        }, 3000)
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

      {/* How It Works Info Box */}
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
          How Attributes Work:
        </h4>
        <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
          <li>
            <strong>Add an Attribute:</strong> Click &quot;+ Add Attribute&quot; and name it (e.g.,
            &quot;Color&quot;, &quot;Height&quot;, &quot;Material&quot;)
          </li>
          <li>
            <strong>Choose Type:</strong> Select Color, Size, Material, Design, or Custom (Color
            shows a color picker)
          </li>
          <li>
            <strong>Add Options:</strong> Click &quot;+ Add Option&quot; for each attribute and
            enter the Display Name (e.g., &quot;Red&quot;, &quot;150mm&quot;, &quot;Small&quot;).
            The system ID is auto-generated.
          </li>
          <li>
            <strong>Set Price (Optional):</strong> Add a price modifier if this option affects price
            (e.g., +5 for Large, -2 for Small, or 0 for no change)
          </li>
          <li>
            <strong>Upload Images (Optional):</strong> Add product images specific to each option.
            These will be inherited by all variations with that option.
          </li>
          <li>
            <strong>Save Attributes:</strong> Click &quot;Save Attributes&quot; to save your changes
          </li>
          <li>
            <strong>Generate Variations:</strong> Scroll down to the &quot;Bulk Variation
            Generator&quot; section to automatically create all possible combinations
          </li>
        </ol>
        <p className="text-xs text-blue-700 mt-3 font-medium">
          💡 Example: Color (Red, Blue) × Height (150mm, 200mm) = 4 variations automatically
          created!
        </p>
      </div>

      {attributes.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-stone-600 mb-2">No attributes defined yet</p>
          <p className="text-sm text-stone-500 mb-4">
            Click &quot;Add Attribute&quot; to create attributes like Color, Size, or Design
          </p>
        </div>
      )}

      {attributes.map((attr, attrIdx) => {
        const isExpanded = expandedAttributes.has(attrIdx)
        const hasName = attr.name && attr.name.trim().length > 0
        const firstOptionImage = attr.options?.[0]?.images?.[0]

        return (
          <div key={attrIdx} className="border rounded-lg bg-white shadow-sm mb-4">
            {/* Collapsed Summary View */}
            <div
              className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                !isExpanded ? 'border-b' : ''
              }`}
              onClick={() => toggleAttribute(attrIdx)}
            >
              <div className="flex items-center gap-4 flex-1">
                {/* Expand/Collapse Icon */}
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>

                {/* Attribute Preview */}
                {hasName ? (
                  <div className="flex items-center gap-3 flex-1">
                    <div className="font-semibold text-stone-800">{attr.name}</div>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded capitalize">
                      {attr.type}
                    </span>
                    <span className="text-sm text-gray-600">
                      {attr.options.length} option{attr.options.length !== 1 ? 's' : ''}
                    </span>
                    {firstOptionImage && (
                      <div className="w-10 h-10 border rounded overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={firstOptionImage}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 italic">New attribute (click to edit)</div>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeAttribute(attrIdx)
                }}
                className="text-red-600 hover:text-red-800 font-medium text-sm px-2"
              >
                Remove
              </button>
            </div>

            {/* Expanded Edit View */}
            {isExpanded && (
              <div className="p-6 border-t">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-stone-800">
                      Attribute Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Color, Height, Material"
                      value={attr.name || ''}
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
                      No options yet. Click &quot;Add Option&quot; to create options like Red, Blue,
                      Small, Large, etc.
                    </div>
                  )}

                  {attr.options.map((option, optIdx) => (
                    <div
                      key={`attr-${attrIdx}-opt-${optIdx}`}
                      className="grid grid-cols-12 gap-3 items-start p-3 bg-gray-50 rounded border"
                    >
                      {/* Value - Hidden, auto-generated from display name */}
                      <input
                        type="hidden"
                        value={
                          option.value ||
                          generateValueFromDisplayName(
                            option.displayName || '',
                            attr.name || 'option'
                          )
                        }
                      />

                      {/* Display Name */}
                      <div className={attr.type === 'color' ? 'col-span-3' : 'col-span-4'}>
                        <label className="block text-xs text-stone-600 mb-1">Display Name *</label>
                        <input
                          type="text"
                          placeholder="e.g., Crimson Red, 150mm"
                          value={option.displayName || ''}
                          onChange={(e) =>
                            updateOption(attrIdx, optIdx, 'displayName', e.target.value)
                          }
                          className="w-full px-2 py-1.5 border rounded text-sm text-stone-900 bg-white"
                          title="What customers see (can include units, spaces, etc.)"
                        />
                        <p className="text-xs text-stone-500 mt-0.5">What customers see</p>
                      </div>

                      {/* Color Picker (only for color type) */}
                      {attr.type === 'color' && (
                        <div className="col-span-1">
                          <label className="block text-xs text-stone-600 mb-1">Color</label>
                          <input
                            type="color"
                            value={option.hexColor || '#000000'}
                            onChange={(e) =>
                              updateOption(attrIdx, optIdx, 'hexColor', e.target.value)
                            }
                            className="w-full h-9 border rounded cursor-pointer"
                            title="Color swatch for this option"
                          />
                          <p className="text-xs text-stone-500 mt-0.5">Swatch</p>
                        </div>
                      )}

                      {/* Price Modifier */}
                      <div className={attr.type === 'color' ? 'col-span-2' : 'col-span-3'}>
                        <label className="block text-xs text-stone-600 mb-1">Price Modifier</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          value={option.priceModifier || 0}
                          onChange={(e) =>
                            updateOption(
                              attrIdx,
                              optIdx,
                              'priceModifier',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-2 py-1.5 border rounded text-sm text-stone-900 bg-white"
                          title="Price adjustment: +5 adds $5, -2 subtracts $2, 0 = no change"
                        />
                        <p className="text-xs text-stone-500 mt-0.5">+5 adds $5, -2 subtracts $2</p>
                      </div>

                      {/* Images */}
                      <div className={attr.type === 'color' ? 'col-span-3' : 'col-span-3'}>
                        <div className="text-xs text-stone-700 mb-1">
                          Images ({option.images?.length || 0})
                        </div>
                        {productSlug && attr.name && option.value ? (
                          <ImageUpload
                            key={`img-${attrIdx}-${optIdx}-${option.value}-${attr.name}`}
                            categorySlug={categorySlug || 'products'}
                            productSlug={`${productSlug}-${attr.name.toLowerCase().replace(/\s+/g, '-')}-${option.value.toLowerCase().replace(/\s+/g, '-')}`}
                            initialImages={option.images || []}
                            onImagesChange={(images) => {
                              console.log(
                                `📸 Updating images for attr ${attrIdx}, option ${optIdx}:`,
                                images
                              )
                              updateOption(attrIdx, optIdx, 'images', images)
                            }}
                            maxImages={5}
                          />
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center text-sm text-gray-500">
                            Please fill in the attribute name and option value before uploading
                            images
                          </div>
                        )}
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
            )}
          </div>
        )
      })}

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
    </div>
  )
}
