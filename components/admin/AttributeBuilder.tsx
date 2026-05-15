import { useEffect, useId, useRef, useState } from 'react'
import ImageUpload from './ImageUpload'
import { authFetch } from '@/lib/api/authFetch'

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
  const isEditingRef = useRef(false)
  const lastSyncedLengthRef = useRef(initialAttributes.length)

  // Only sync from props when not actively editing
  // This prevents the disappearing issue when adding new attributes
  // biome-ignore lint/correctness/useExhaustiveDependencies: lastSyncedLengthRef is a plain object ref, not a reactive dep
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
  }, [initialAttributes, attributes])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [expandedAttributes, setExpandedAttributes] = useState<Set<number>>(new Set())
  const fId = useId()

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
      const response = await authFetch(`/api/admin/products/${productId}/attributes`, {
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
          <h3 className="text-lg font-light text-zinc-900">Product Attributes</h3>
          <p className="text-sm text-zinc-600 mt-1 font-light">
            Define attributes that customers can choose from (e.g., Color, Size, Design)
          </p>
        </div>
        <button
          type="button"
          onClick={addAttribute}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-light"
        >
          + Add Attribute
        </button>
      </div>

      {/* How It Works Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-light text-blue-900 mb-2 flex items-center gap-2">
          <svg
            aria-hidden="true"
            focusable="false"
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
        <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside font-light">
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
        <p className="text-xs text-blue-700 mt-3 font-light">
          💡 Example: Color (Red, Blue) × Height (150mm, 200mm) = 4 variations automatically
          created!
        </p>
      </div>

      {attributes.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center bg-gray-50">
          <p className="text-zinc-600 mb-2 font-light">No attributes defined yet</p>
          <p className="text-sm text-zinc-500 mb-4 font-light">
            Click &quot;Add Attribute&quot; to create attributes like Color, Size, or Design
          </p>
        </div>
      )}

      {attributes.map((attr, attrIdx) => {
        const isExpanded = expandedAttributes.has(attrIdx)
        const hasName = attr.name && attr.name.trim().length > 0
        const firstOptionImage = attr.options?.[0]?.images?.[0]

        return (
          <div
            key={attr.id ?? `attr-${attrIdx}`}
            className="border border-gray-200 rounded-lg bg-white shadow-sm mb-4"
          >
            {/* Collapsed Summary View */}
            <div
              className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                !isExpanded ? 'border-b border-gray-100' : ''
              }`}
            >
              <button
                type="button"
                className="flex items-center gap-4 flex-1 text-left cursor-pointer"
                onClick={() => toggleAttribute(attrIdx)}
              >
                {/* Expand/Collapse Icon */}
                <svg
                  aria-hidden="true"
                  focusable="false"
                  className={`w-5 h-5 text-zinc-400 transition-transform ${
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
                    <div className="font-light text-zinc-900">{attr.name}</div>
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full capitalize font-light">
                      {attr.type}
                    </span>
                    <span className="text-sm text-zinc-600 font-light">
                      {attr.options.length} option{attr.options.length !== 1 ? 's' : ''}
                    </span>
                    {firstOptionImage && (
                      <div className="w-10 h-10 border border-gray-200 rounded-lg overflow-hidden">
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
                  <div className="text-zinc-500 italic font-light">
                    New attribute (click to edit)
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => removeAttribute(attrIdx)}
                className="text-red-600 hover:text-red-700 font-light text-sm px-2"
              >
                Remove
              </button>
            </div>

            {/* Expanded Edit View */}
            {isExpanded && (
              <div className="p-6 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor={`${fId}-attr-${attrIdx}-name`}
                      className="block text-sm font-light mb-2 text-zinc-700"
                    >
                      Attribute Name *
                    </label>
                    <input
                      id={`${fId}-attr-${attrIdx}-name`}
                      type="text"
                      placeholder="e.g., Color, Height, Material"
                      value={attr.name || ''}
                      onChange={(e) => updateAttribute(attrIdx, 'name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-zinc-900 bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-sm font-light"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`${fId}-attr-${attrIdx}-type`}
                      className="block text-sm font-light mb-2 text-zinc-700"
                    >
                      Type
                    </label>
                    <select
                      id={`${fId}-attr-${attrIdx}-type`}
                      value={attr.type}
                      onChange={(e) => updateAttribute(attrIdx, 'type', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-zinc-900 bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-sm font-light"
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
                    <span className="text-sm font-light text-zinc-700">
                      Options * ({attr.options.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => addOption(attrIdx)}
                      className="text-sm px-3 py-1.5 bg-white border border-gray-200 text-zinc-700 rounded-lg hover:bg-gray-50 transition-colors font-light"
                    >
                      + Add Option
                    </button>
                  </div>

                  {attr.options.length === 0 && (
                    <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center text-sm text-zinc-600 bg-gray-50">
                      <p className="font-light">
                        No options yet. Click &quot;Add Option&quot; to create options like Red,
                        Blue, Small, Large, etc.
                      </p>
                    </div>
                  )}

                  {attr.options.map((option, optIdx) => (
                    <div
                      key={`attr-${attrIdx}-opt-${optIdx}`}
                      className="grid grid-cols-12 gap-3 items-start p-4 bg-gray-50 rounded-lg border border-gray-200"
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
                        <label
                          htmlFor={`${fId}-opt-${attrIdx}-${optIdx}-dn`}
                          className="block text-xs text-zinc-600 mb-1 font-light"
                        >
                          Display Name *
                        </label>
                        <input
                          id={`${fId}-opt-${attrIdx}-${optIdx}-dn`}
                          type="text"
                          placeholder="e.g., Crimson Red, 150mm"
                          value={option.displayName || ''}
                          onChange={(e) =>
                            updateOption(attrIdx, optIdx, 'displayName', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 font-light"
                          title="What customers see (can include units, spaces, etc.)"
                        />
                        <p className="text-xs text-zinc-500 mt-0.5 font-light">
                          What customers see
                        </p>
                      </div>

                      {/* Color Picker (only for color type) */}
                      {attr.type === 'color' && (
                        <div className="col-span-1">
                          <label
                            htmlFor={`${fId}-opt-${attrIdx}-${optIdx}-color`}
                            className="block text-xs text-zinc-600 mb-1 font-light"
                          >
                            Color
                          </label>
                          <input
                            id={`${fId}-opt-${attrIdx}-${optIdx}-color`}
                            type="color"
                            value={option.hexColor || '#000000'}
                            onChange={(e) =>
                              updateOption(attrIdx, optIdx, 'hexColor', e.target.value)
                            }
                            className="w-full h-9 border border-gray-200 rounded-lg cursor-pointer"
                            title="Color swatch for this option"
                          />
                          <p className="text-xs text-zinc-500 mt-0.5 font-light">Swatch</p>
                        </div>
                      )}

                      {/* Price Modifier */}
                      <div className={attr.type === 'color' ? 'col-span-2' : 'col-span-3'}>
                        <label
                          htmlFor={`${fId}-opt-${attrIdx}-${optIdx}-price`}
                          className="block text-xs text-zinc-600 mb-1 font-light"
                        >
                          Price Modifier
                        </label>
                        <input
                          id={`${fId}-opt-${attrIdx}-${optIdx}-price`}
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
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 font-light"
                          title="Price adjustment: +5 adds $5, -2 subtracts $2, 0 = no change"
                        />
                        <p className="text-xs text-zinc-500 mt-0.5 font-light">
                          +5 adds $5, -2 subtracts $2
                        </p>
                      </div>

                      {/* Images */}
                      <div className={attr.type === 'color' ? 'col-span-3' : 'col-span-3'}>
                        <div className="text-xs text-zinc-700 mb-1 font-light">
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
                          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-sm text-zinc-500 bg-gray-50">
                            <p className="font-light">
                              Please fill in the attribute name and option value before uploading
                              images
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Remove Button */}
                      <div className="col-span-1 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeOption(attrIdx, optIdx)}
                          className="text-red-600 hover:text-red-700 font-light text-lg"
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
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div>
            {message && (
              <span
                className={`text-sm font-light ${
                  message.type === 'success' ? 'text-emerald-600' : 'text-red-600'
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
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition-colors font-light"
          >
            {saving ? 'Saving...' : 'Save Attributes'}
          </button>
        </div>
      )}
    </div>
  )
}
