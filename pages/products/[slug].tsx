import { createClient } from '@supabase/supabase-js'
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import Toast from '@/components/ui/Toast'
import { useCart } from '@/context/CartContext'
import type { ProductVariantNew } from '@/types'
import { formatMoney } from '@/lib/format/money'

// Server-side client for static generation
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
)

// New product type from products_new API
type ProductNew = {
  id: string
  name: string
  description: string
  slug: string
  base_price: number
  thumbnail_url: string
  images: string[]
  gallery_images: string[]
  customizable: boolean
  attributes: Record<string, unknown>
  created_at: string
  updated_at: string
  categories: {
    id: string
    name: string
    slug: string
  }[]
  category: {
    id: string
    name: string
    slug: string
  }
}

type VariantOption = {
  value: string
  displayName: string
  hexColor?: string | null
}

type ProductDetailPageProps = {
  product: ProductNew | null
  variants: ProductVariantNew[]
  variantOptions: {
    sizes: VariantOption[]
    colors: VariantOption[]
    materials: VariantOption[]
  }
  priceRange: {
    min: number
    max: number
    has_variants: boolean
  }
}

const ProductDetailPage: NextPage<ProductDetailPageProps> = ({
  product,
  variants,
  variantOptions,
  priceRange,
}) => {
  const { addToCart } = useCart()
  const router = useRouter()

  // Variant selection state
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)
  const [mainImage, setMainImage] = useState<string | null>(null)

  // Calculate selected variant synchronously during render to prevent flicker
  // This ensures the variant is always in sync with selections without state updates
  const selectedVariant = useMemo(() => {
    if (!variants.length) return null

    // Filter variants that match the selected attributes (partial matching)
    const matchingVariants = variants.filter((variant) => {
      const sizeMatch = !selectedSize || variant.size === selectedSize
      const colorMatch = !selectedColor || variant.color === selectedColor
      const materialMatch = !selectedMaterial || variant.material === selectedMaterial
      return sizeMatch && colorMatch && materialMatch
    })

    // If we have selections, find the best matching variant
    // Priority: exact match > matches all selected > first match
    if (selectedSize || selectedColor || selectedMaterial) {
      // First, try to find exact match (all selected attributes match)
      const exactMatch = matchingVariants.find(
        (variant) =>
          variant.size === selectedSize &&
          variant.color === selectedColor &&
          variant.material === selectedMaterial
      )

      if (exactMatch) {
        return exactMatch
      }

      // If no exact match, use the first matching variant for price preview
      // This gives users a dynamic price as they select options
      if (matchingVariants.length > 0) {
        return matchingVariants[0]
      }
    }

    // No selections or no matches
    return null
  }, [selectedSize, selectedColor, selectedMaterial, variants])

  if (!product) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-red-500">Product not found</h1>
      </div>
    )
  }

  // Calculate display price - dynamic based on selections
  const displayPrice = selectedVariant
    ? product.base_price + selectedVariant.price_adjustment
    : product.base_price

  // Check if we have an exact variant match (all selected attributes match the variant exactly)
  const hasCompleteVariantMatch =
    selectedVariant &&
    selectedVariant.size === selectedSize &&
    selectedVariant.color === selectedColor &&
    selectedVariant.material === selectedMaterial

  // Helper function to get display name for a value
  const getDisplayName = (value: string | null | undefined): string => {
    if (!value) return ''
    // Try to find in variantOptions
    const allOptions = [
      ...variantOptions.sizes,
      ...variantOptions.colors,
      ...variantOptions.materials,
    ]
    const option = allOptions.find((opt) => opt.value === value)
    return option?.displayName || value
  }

  // Helper function to format size display name with unit
  const formatSizeDisplay = (displayName: string): string => {
    // If it already contains a unit (mm, cm, in, ft, etc.), return as is
    if (/mm|cm|in|ft|m\b/i.test(displayName)) {
      return displayName
    }
    // Otherwise, add "mm" as default unit
    return `${displayName}mm`
  }

  // Handler for size selection - auto-select first available color
  const handleSizeSelect = (sizeValue: string) => {
    setSelectedSize(sizeValue)

    // If size is selected and color is not selected, auto-select first available color
    if (variantOptions.colors.length > 0 && !selectedColor) {
      // Find variants with this size
      const sizeVariants = variants.filter((v) => v.size === sizeValue)
      if (sizeVariants.length > 0) {
        // Get the first color from variants with this size (prefer black if available)
        const blackVariant = sizeVariants.find((v) => {
          const colorDisplay = getDisplayName(v.color)
          return (
            colorDisplay.toLowerCase().includes('black') ||
            v.color?.toLowerCase().includes('black') ||
            v.color?.toLowerCase().includes('b-') ||
            v.color === 'option-b'
          )
        })
        const firstColorValue = blackVariant?.color || sizeVariants[0].color
        if (firstColorValue) {
          setSelectedColor(firstColorValue)
        }
      } else {
        // If no variants with this size, just select first color option
        setSelectedColor(variantOptions.colors[0].value)
      }
    }
  }

  // Only update image when color is selected, not when size changes
  const getDisplayImage = () => {
    // Only use variant image if color is selected
    if (selectedColor && selectedVariant?.image_url) {
      return selectedVariant.image_url
    }
    return product.thumbnail_url || ''
  }

  // Get display image (only changes when color is selected)
  // Use manually selected main image if set, otherwise use calculated image
  const displayImage = mainImage || getDisplayImage()

  const handleAddToCart = () => {
    // Require all attributes that have variants to be selected
    const hasSizeOptions = variantOptions.sizes.length > 0
    const hasColorOptions = variantOptions.colors.length > 0
    const hasMaterialOptions = variantOptions.materials.length > 0

    const requiresSize = hasSizeOptions && !selectedSize
    const requiresColor = hasColorOptions && !selectedColor
    const requiresMaterial = hasMaterialOptions && !selectedMaterial

    if (variants.length > 0 && (requiresSize || requiresColor || requiresMaterial)) {
      const missing = []
      if (requiresSize) missing.push('size')
      if (requiresColor) missing.push('color')
      if (requiresMaterial) missing.push('material')
      setToast({
        message: `Please select ${missing.join(' and ')}`,
        type: 'error',
      })
      return
    }

    // If we have variants but no exact match, user needs to complete selection
    if (variants.length > 0 && !hasCompleteVariantMatch) {
      setToast({
        message: 'Please complete all variant selections',
        type: 'error',
      })
      return
    }

    const cartItem = {
      product_id: product.id,
      variant_id: selectedVariant?.id || null,
      quantity,
      size: selectedSize,
      color: selectedColor,
      material: selectedMaterial,
      price: displayPrice,
      name: product.name,
      image_url: displayImage,
    }

    addToCart(cartItem)
    setToast({ message: 'Added to cart!', type: 'success' })

    // Reset quantity after adding to cart
    setQuantity(1)
  }

  // Check if a color option is available for the selected size
  const isColorAvailable = (colorValue: string): boolean => {
    if (!selectedSize) return true // All colors available if no size selected
    return variants.some((v) => v.size === selectedSize && v.color === colorValue)
  }

  // Check if a size option is available for the selected color
  const isSizeAvailable = (sizeValue: string): boolean => {
    if (!selectedColor) return true // All sizes available if no color selected
    return variants.some((v) => v.color === selectedColor && v.size === sizeValue)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto py-24 px-6">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="ml-2 mb-6 text-emerald-600 hover:text-emerald-700 text-base flex items-center"
        >
          ← Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div>
            <div className="sticky top-24">
              <div className="relative bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 p-4">
                <div className="relative aspect-square w-full bg-gray-50 rounded-lg overflow-hidden">
                  <Image
                    src={displayImage}
                    alt={product.name}
                    className="w-full h-full object-contain transition-opacity duration-300"
                    width={1000}
                    height={1000}
                  />
                </div>
                {/* Gallery images */}
                {product.gallery_images && product.gallery_images.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {/* Main image as first thumbnail */}
                    <button
                      type="button"
                      onClick={() => setMainImage(null)}
                      className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        mainImage === null
                          ? 'border-emerald-500 ring-2 ring-emerald-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={displayImage}
                        alt={`${product.name} main`}
                        className="w-full h-full object-cover"
                        width={100}
                        height={100}
                      />
                    </button>
                    {/* Gallery images */}
                    {product.gallery_images.slice(0, 3).map((image, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setMainImage(image)}
                        className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          mainImage === image
                            ? 'border-emerald-500 ring-2 ring-emerald-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${product.name} gallery ${index + 1}`}
                          className="w-full h-full object-cover"
                          width={100}
                          height={100}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-light text-zinc-900 mb-3">{product.name}</h1>
              <div className="text-base text-zinc-600 font-light mb-4">{product.category.name}</div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="text-zinc-700 text-lg leading-relaxed font-light">
                {product.description}
              </div>
            )}

            {/* Variant Selectors */}
            {variants.length > 0 && (
              <div className="space-y-4">
                {/* Size Selector */}
                {variantOptions.sizes.length > 0 && (
                  <div>
                    <label className="block font-semibold mb-2 text-zinc-900 text-lg">Size</label>
                    <div className="flex flex-wrap gap-2">
                      {variantOptions.sizes.map((sizeOption) => {
                        const isDisabled = !isSizeAvailable(sizeOption.value)
                        return (
                          <button
                            key={sizeOption.value}
                            onClick={() => !isDisabled && handleSizeSelect(sizeOption.value)}
                            disabled={isDisabled}
                            className={`px-4 py-2 rounded-lg border text-base font-light transition ${
                              selectedSize === sizeOption.value
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : isDisabled
                                  ? 'bg-gray-50 text-zinc-400 border-gray-200 cursor-not-allowed opacity-50'
                                  : 'bg-gray-100 text-zinc-700 border-gray-300 hover:border-gray-400 hover:text-zinc-900'
                            }`}
                          >
                            {formatSizeDisplay(sizeOption.displayName)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Color Selector */}
                {variantOptions.colors.length > 0 && (
                  <div>
                    <label className="block font-semibold mb-2 text-zinc-900 text-lg">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {variantOptions.colors.map((colorOption) => {
                        const isDisabled = !isColorAvailable(colorOption.value)
                        const hasColorSwatch =
                          colorOption.hexColor && colorOption.hexColor.trim() !== ''
                        return (
                          <button
                            key={colorOption.value}
                            onClick={() => !isDisabled && setSelectedColor(colorOption.value)}
                            disabled={isDisabled}
                            className={`relative px-4 py-2 rounded-lg border text-base font-light transition flex items-center gap-2 ${
                              selectedColor === colorOption.value
                                ? 'bg-emerald-500 text-white border-emerald-500 ring-2 ring-emerald-200'
                                : isDisabled
                                  ? 'bg-gray-50 text-zinc-400 border-gray-200 cursor-not-allowed opacity-50'
                                  : 'bg-gray-100 text-zinc-700 border-gray-300 hover:border-gray-400 hover:text-zinc-900'
                            }`}
                            title={
                              isDisabled
                                ? 'Not available for selected size'
                                : colorOption.displayName
                            }
                          >
                            {hasColorSwatch && (
                              <span
                                className={`w-5 h-5 rounded-full border-2 ${
                                  selectedColor === colorOption.value
                                    ? 'border-white'
                                    : 'border-gray-300'
                                }`}
                                style={{ backgroundColor: colorOption.hexColor || '#ccc' }}
                              />
                            )}
                            <span>{colorOption.displayName}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Material Selector */}
                {variantOptions.materials.length > 0 && (
                  <div>
                    <label className="block font-semibold mb-2 text-zinc-900 text-lg">
                      Material
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {variantOptions.materials.map((materialOption) => (
                        <button
                          key={materialOption.value}
                          onClick={() => setSelectedMaterial(materialOption.value)}
                          className={`px-4 py-2 rounded-lg border text-base font-light transition ${
                            selectedMaterial === materialOption.value
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : 'bg-gray-100 text-zinc-700 border-gray-300 hover:border-gray-400 hover:text-zinc-900'
                          }`}
                        >
                          {materialOption.displayName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Price */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <div className="text-base text-zinc-600 font-light mb-2">Price</div>
              <div className="text-4xl font-semibold text-zinc-900">
                {formatMoney(displayPrice)}
                {variants.length > 0 && !hasCompleteVariantMatch && (
                  <span className="text-xl text-zinc-600 ml-2 font-light">(preview)</span>
                )}
                {variants.length === 0 && priceRange.has_variants && (
                  <span className="text-xl text-zinc-600 ml-2 font-light">
                    {'(from '}{formatMoney(priceRange.min)}{')'}
                  </span>
                )}
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4">
              <div>
                <label className="block font-medium mb-3 text-zinc-900 text-base">Quantity</label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100 text-zinc-900 transition"
                  >
                    -
                  </button>
                  <span className="text-lg font-medium text-zinc-900 min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(99, quantity + 1))}
                    disabled={quantity >= 99}
                    className="w-10 h-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100 text-zinc-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full bg-zinc-900 text-white py-4 px-6 rounded-lg font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={variants.length > 0 && !hasCompleteVariantMatch}
              >
                {variants.length > 0 && !hasCompleteVariantMatch ? 'Select Options' : 'Add to Cart'}
              </button>
            </div>

            {/* Customizable Badge */}
            {product.customizable && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  <span className="font-semibold">Customizable:</span> This product can be
                  personalized with your own text or design.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type || 'success'}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  // For now, return empty paths to use fallback
  // In production, you might want to pre-generate popular product pages
  return {
    paths: [],
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps<ProductDetailPageProps> = async (context) => {
  const { slug } = context.params || {}

  if (!slug || typeof slug !== 'string') {
    return { notFound: true }
  }

  try {
    console.log(`[getStaticProps] Starting for slug: ${slug}`)
    console.log(`[getStaticProps] Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
    console.log(`[getStaticProps] Anon key exists: ${!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`)

    // Test basic connection first
    const { data: testData, error: testError } = await supabaseServer
      .from('products')
      .select('id, name, slug')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (testError) {
      console.error(`[getStaticProps] Basic query error:`, testError)
      return { notFound: true }
    }

    if (!testData) {
      console.log(`[getStaticProps] Product not found for slug: ${slug}`)
      return { notFound: true }
    }

    console.log(`[getStaticProps] Basic query successful for: ${testData.name}`)

    // Now try the full query
    const { data: product, error: productError } = await supabaseServer
      .from('products')
      .select(`
        id,
        name,
        description,
        slug,
        base_price,
        thumbnail_url,
        images,
        gallery_images,
        customizable,
        attributes,
        created_at,
        updated_at,
        category_id,
        categories!category_id(
          id,
          name,
          slug
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (productError) {
      console.error(`[getStaticProps] Full query error:`, productError)
      return { notFound: true }
    }

    console.log(`[getStaticProps] Full query successful for: ${product.name}`)

    // Fetch variants
    const { data: variants, error: variantsError } = await supabaseServer
      .from('product_variants')
      .select('*')
      .eq('product_id', product.id)
      .eq('is_available', true)
      .order('created_at', { ascending: true })

    if (variantsError) {
      console.error(`[getStaticProps] Variants error:`, variantsError)
      // Don't return notFound for variants error, just use empty array
    }

    console.log(
      `[getStaticProps] Variants query completed, found: ${variants?.length || 0} variants`
    )

    // Fetch product attributes and options to get display names
    const { data: attributes, error: attrError } = await supabaseServer
      .from('product_attributes')
      .select('*')
      .eq('product_id', product.id)
      .order('display_order', { ascending: true })

    const valueToDisplayNameMap: Record<string, string> = {}
    let attributeOptions: Array<{
      value: string
      display_name: string
      hex_color?: string | null
      attribute_id: string
    }> = []

    if (!attrError && attributes && attributes.length > 0) {
      const attributeIds = attributes.map((attr) => attr.id)
      const { data: options, error: optError } = await supabaseServer
        .from('product_attribute_options')
        .select('*')
        .in('attribute_id', attributeIds)

      if (!optError && options) {
        attributeOptions = options
        // Create mapping from value to display_name and hex_color
        options.forEach(
          (opt: { value: string; display_name: string; hex_color?: string | null }) => {
            valueToDisplayNameMap[opt.value] = opt.display_name
          }
        )
      }
    }

    // Calculate price range
    let minPrice = product.base_price
    let maxPrice = product.base_price
    const hasVariants = Boolean(variants && variants.length > 0)

    if (hasVariants && variants) {
      const variantPrices = variants.map(
        (v: { price_adjustment: number }) => product.base_price + v.price_adjustment
      )
      minPrice = Math.min(...variantPrices)
      maxPrice = Math.max(...variantPrices)
    }

    // Extract unique options for display (using display names, but store values for matching)
    const uniqueSizeValues = Array.from(
      new Set(variants?.map((v: { size?: string }) => v.size).filter(Boolean) || [])
    ) as string[]
    const uniqueColorValues = Array.from(
      new Set(variants?.map((v: { color?: string }) => v.color).filter(Boolean) || [])
    ) as string[]
    const uniqueMaterialValues = Array.from(
      new Set(variants?.map((v: { material?: string }) => v.material).filter(Boolean) || [])
    ) as string[]

    // Map values to display names and hex colors
    const sizeOptions = uniqueSizeValues.map((value) => ({
      value,
      displayName: valueToDisplayNameMap[value] || value,
    }))

    // For colors, also include hex_color if available
    const colorOptionsMap: Record<string, string | null> = {}
    if (attributeOptions.length > 0 && attributes) {
      attributeOptions.forEach((opt) => {
        // Check if this option belongs to a color attribute
        const attr = attributes.find((a: { id: string; type: string }) => a.id === opt.attribute_id)
        if (attr?.type === 'color' && uniqueColorValues.includes(opt.value)) {
          colorOptionsMap[opt.value] = opt.hex_color || null
        }
      })
    }

    const colorOptions = uniqueColorValues.map((value) => ({
      value,
      displayName: valueToDisplayNameMap[value] || value,
      hexColor: colorOptionsMap[value] || null,
    }))

    const materialOptions = uniqueMaterialValues.map((value) => ({
      value,
      displayName: valueToDisplayNameMap[value] || value,
    }))

    console.log(`[getStaticProps] Returning data for: ${product.name}`)
    console.log(`[getStaticProps] Product categories:`, product.categories)

    // Handle category data safely
    const categoryData =
      product.categories && Array.isArray(product.categories) && product.categories.length > 0
        ? product.categories[0]
        : { id: null, name: 'Uncategorized', slug: 'uncategorized' }

    return {
      props: {
        product: { ...product, category: categoryData }, // Flatten category
        variants: variants || [],
        variantOptions: {
          sizes: sizeOptions,
          colors: colorOptions,
          materials: materialOptions,
        },
        priceRange: {
          min: minPrice,
          max: maxPrice,
          has_variants: hasVariants,
        },
      },
      revalidate: 60, // Revalidate every minute
    }
  } catch (error) {
    console.error('Error fetching product:', error)
    return { notFound: true }
  }
}

export default ProductDetailPage
