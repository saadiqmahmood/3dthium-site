import { useState } from 'react'

type Attribute = {
  id: string
  name: string
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Filter out attributes without IDs (unsaved attributes)
  const savedAttributes = attributes.filter((attr) => attr.id && attr.id.trim() !== '')

  // Calculate combination count
  const combinationCount = selectedAttrIds.reduce((total, attrId) => {
    const attr = savedAttributes.find((a) => a.id === attrId)
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

    // Validate that all selected attributes have IDs
    const attributesWithoutIds = selectedAttrIds.filter((id) => !id || id.trim() === '')
    if (attributesWithoutIds.length > 0) {
      setMessage({
        text: 'Some selected attributes are missing IDs. Please save your attributes first.',
        type: 'error',
      })
      return
    }

    if (combinationCount > 1000) {
      if (
        !confirm(
          `This will create ${combinationCount} variations. This may take a while. Continue?`
        )
      ) {
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
        let messageText = `Successfully created ${result.created} variation${result.created !== 1 ? 's' : ''}!`
        if (result.skipped > 0) {
          messageText += ` (${result.skipped} already existed)`
        }
        if (result.failed > 0) {
          messageText += ` (${result.failed} failed)`
        }
        setMessage({
          text: messageText,
          type: 'success',
        })
        onGenerated()
      } else {
        const error = await response.json()
        let errorText = error.error || 'Failed to generate variations'
        if (error.message) {
          errorText = error.message
        } else if (error.details) {
          errorText = `${errorText}: ${error.details}`
        }
        setMessage({
          text: errorText,
          type: 'error',
        })
      }
    } catch {
      setMessage({ text: 'Failed to generate variations', type: 'error' })
    } finally {
      setGenerating(false)
    }
  }

  if (savedAttributes.length === 0) {
    return (
      <div className="border border-dashed border-gray-200 rounded-lg p-8 text-center bg-gray-50">
        <p className="text-zinc-600 mb-2 font-light">No saved attributes found</p>
        <p className="text-sm text-zinc-500 font-light">
          Please create and save attributes in the &quot;Attributes&quot; tab first before
          generating variations
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="border border-gray-100 rounded-lg p-6 bg-white shadow-sm">
        <h3 className="text-xl font-light text-zinc-900 mb-4">Generate Variations</h3>

        {/* Attribute Selection */}
        <div className="mb-6">
          <label className="block text-sm font-light mb-3 text-zinc-700">
            Select Attributes to Combine:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {savedAttributes.map((attr) => (
              <label
                key={attr.id}
                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedAttrIds.includes(attr.id)}
                  onChange={() => toggleAttribute(attr.id)}
                  className="rounded w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-zinc-900 font-light">{attr.name}</span>
                <span className="text-sm text-zinc-600 font-light">({attr.options.length} options)</span>
              </label>
            ))}
          </div>
        </div>

        {/* Preview */}
        {selectedAttrIds.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700 mb-1 font-light">Total Combinations:</p>
                <p className="text-4xl font-light text-emerald-900">{combinationCount}</p>
                <p className="text-xs text-emerald-600 mt-2 font-light">
                  {selectedAttrIds
                    .map((id) => {
                      const attr = savedAttributes.find((a) => a.id === id)
                      return `${attr?.name} (${attr?.options.length})`
                    })
                    .join(' × ')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-emerald-700 font-light">Estimated Time:</p>
                <p className="text-lg font-light text-emerald-900">
                  {combinationCount < 50
                    ? '< 5 sec'
                    : combinationCount < 200
                      ? '5-15 sec'
                      : '15-30 sec'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-light mb-2 text-zinc-700">
              Pricing Strategy
            </label>
            <select
              value={pricingStrategy}
              onChange={(e) => setPricingStrategy(e.target.value as 'base' | 'additive')}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-zinc-900 bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-sm font-light"
            >
              <option value="base">Base Price (all same: £{basePrice})</option>
              <option value="additive">Additive (base + modifiers)</option>
            </select>
            <p className="text-xs text-zinc-600 mt-1 font-light">
              {pricingStrategy === 'base'
                ? 'All variations will have the same price'
                : 'Prices will include modifiers set on each option'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-light mb-2 text-zinc-700">Default Stock</label>
            <input
              type="number"
              value={defaultStock}
              onChange={(e) => setDefaultStock(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-zinc-900 bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-sm font-light"
              min="0"
            />
            <p className="text-xs text-zinc-600 mt-1 font-light">
              Set to 0 for print-on-demand (no stock tracking)
            </p>
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={selectedAttrIds.length === 0 || generating}
          className="w-full py-3 bg-emerald-600 text-white rounded-lg font-light hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {generating
            ? 'Generating...'
            : `Generate ${combinationCount} Variation${combinationCount !== 1 ? 's' : ''}`}
        </button>

        {/* Warning for large batches */}
        {combinationCount > 200 && (
          <p className="text-sm text-orange-600 mt-2 text-center flex items-center justify-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Large batch detected ({combinationCount} variations). This may take 15-30 seconds.
          </p>
        )}

        {/* Message */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-lg font-light ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-light text-yellow-900 mb-2 flex items-center gap-2">
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
            <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Important:
        </h4>
        <ul className="text-sm text-yellow-800 space-y-1 font-light">
          <li>• This will create variations based on ALL selected attribute combinations</li>
          <li>• Existing variants with the same combinations will be skipped (not duplicated)</li>
          <li>• Only new combinations will be created</li>
          <li>• Images will be inherited from attribute options automatically</li>
        </ul>
      </div>
    </div>
  )
}
