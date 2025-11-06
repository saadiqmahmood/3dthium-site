import { useState } from 'react'

type Attribute = {
  id: string
  name: string
  type: string
  options: any[]
}

type VariationGeneratorProps = {
  productId: string
  attributes: Attribute[]
  basePrice: number
  onGenerated: () => void
}

export default function VariationGenerator({
  productId,
  attributes,
  basePrice,
  onGenerated,
}: VariationGeneratorProps) {
  const [selectedAttrIds, setSelectedAttrIds] = useState<string[]>([])
  const [pricingStrategy, setPricingStrategy] = useState<'base' | 'additive'>('additive')
  const [defaultStock, setDefaultStock] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Calculate combination count
  const combinationCount = selectedAttrIds.reduce((total, attrId) => {
    const attr = attributes.find((a) => a.id === attrId)
    return total * (attr?.options?.length || 1)
  }, 1)

  const toggleAttribute = (attrId: string) => {
    if (selectedAttrIds.includes(attrId)) {
      setSelectedAttrIds(selectedAttrIds.filter((id) => id !== attrId))
    } else {
      setSelectedAttrIds([...selectedAttrIds, attrId])
    }
  }

  const handleGenerate = async () => {
    if (selectedAttrIds.length === 0) {
      setMessage({ text: 'Please select at least one attribute', type: 'error' })
      return
    }

    if (combinationCount > 1000) {
      if (!confirm(`This will create ${combinationCount} variations. This may take a while. Continue?`)) {
        return
      }
    }

    setGenerating(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/admin/products/${productId}/variations/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attributeIds: selectedAttrIds,
          pricingStrategy,
          defaultStock,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setMessage({
          text: `Successfully created ${result.created} variations!`,
          type: 'success',
        })
        onGenerated()
      } else {
        const error = await response.json()
        setMessage({
          text: error.error || 'Failed to generate variations',
          type: 'error',
        })
      }
    } catch {
      setMessage({ text: 'Failed to generate variations', type: 'error' })
    } finally {
      setGenerating(false)
    }
  }

  if (attributes.length === 0) {
    return (
      <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-stone-600 mb-2">No attributes defined</p>
        <p className="text-sm text-stone-500">
          Please create and save attributes above before generating variations
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <h3 className="text-xl font-bold text-stone-800 mb-4">Generate Variations</h3>

        {/* Attribute Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3 text-stone-800">
            Select Attributes to Combine:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {attributes.map((attr) => (
              <label
                key={attr.id}
                className="flex items-center space-x-3 p-3 border rounded hover:bg-gray-50 cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  checked={selectedAttrIds.includes(attr.id)}
                  onChange={() => toggleAttribute(attr.id)}
                  className="rounded w-4 h-4"
                />
                <span className="text-stone-800 font-medium">{attr.name}</span>
                <span className="text-sm text-stone-600">({attr.options.length} options)</span>
              </label>
            ))}
          </div>
        </div>

        {/* Preview */}
        {selectedAttrIds.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 mb-1">Total Combinations:</p>
                <p className="text-4xl font-bold text-blue-900">{combinationCount}</p>
                <p className="text-xs text-blue-600 mt-2">
                  {selectedAttrIds
                    .map((id) => {
                      const attr = attributes.find((a) => a.id === id)
                      return `${attr?.name} (${attr?.options.length})`
                    })
                    .join(' × ')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-700">Estimated Time:</p>
                <p className="text-lg font-semibold text-blue-900">
                  {combinationCount < 50 ? '< 5 sec' : combinationCount < 200 ? '5-15 sec' : '15-30 sec'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1 text-stone-800">
              Pricing Strategy
            </label>
            <select
              value={pricingStrategy}
              onChange={(e) => setPricingStrategy(e.target.value as 'base' | 'additive')}
              className="w-full px-3 py-2 border rounded text-stone-900 bg-white focus:ring-2 focus:ring-blue-200"
            >
              <option value="base">Base Price (all same: £{basePrice})</option>
              <option value="additive">Additive (base + modifiers)</option>
            </select>
            <p className="text-xs text-stone-600 mt-1">
              {pricingStrategy === 'base'
                ? 'All variations will have the same price'
                : 'Prices will include modifiers set on each option'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-stone-800">Default Stock</label>
            <input
              type="number"
              value={defaultStock}
              onChange={(e) => setDefaultStock(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded text-stone-900 bg-white focus:ring-2 focus:ring-blue-200"
              min="0"
            />
            <p className="text-xs text-stone-600 mt-1">
              Set to 0 for print-on-demand (no stock tracking)
            </p>
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={selectedAttrIds.length === 0 || generating}
          className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-lg"
        >
          {generating
            ? 'Generating...'
            : `Generate ${combinationCount} Variation${combinationCount !== 1 ? 's' : ''}`}
        </button>

        {/* Warning for large batches */}
        {combinationCount > 200 && (
          <p className="text-sm text-orange-600 mt-2 text-center">
            ⚠️ Large batch detected ({combinationCount} variations). This may take 15-30 seconds.
          </p>
        )}

        {/* Message */}
        {message && (
          <div
            className={`mt-4 p-3 rounded ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">⚠️ Important:</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• This will create variations based on ALL selected attribute combinations</li>
          <li>• If you already have auto-generated variations, they will be duplicated</li>
          <li>• You can delete auto-generated variations and regenerate if needed</li>
          <li>• Images will be inherited from attribute options automatically</li>
        </ul>
      </div>
    </div>
  )
}

