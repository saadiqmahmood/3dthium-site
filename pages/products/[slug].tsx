import { createClient } from '@supabase/supabase-js'
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import CartToast, { type CartToastItem } from '@/components/ui/CartToast'
import Toast from '@/components/ui/Toast'
import { useCart } from '@/context/CartContext'
import { formatMoney } from '@/lib/format/money'
import type { ProductVariantNew } from '@/types'

// Server-side client for static generation
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
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

type SiteSettings = {
  accordion_materials_printing?: string
  accordion_delivery_returns?: string
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
  siteSettings: SiteSettings
}

const ProductDetailPage: NextPage<ProductDetailPageProps> = ({
  product,
  variants,
  variantOptions,
  siteSettings,
}) => {
  const { addToCart } = useCart()

  // Variant selection state
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)
  const [cartToast, setCartToast] = useState<CartToastItem | null>(null)
  const [cartToastKey, setCartToastKey] = useState(0)
  const [mainImage, setMainImage] = useState<string | null>(null)
  const [openAccordion, setOpenAccordion] = useState<string | null>(null)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  // Preload all variant images on mount so color switching is instant
  useEffect(() => {
    const urls = Array.from(
      new Set(variants.map((v) => v.image_url).filter((url): url is string => Boolean(url)))
    )
    for (const url of urls) {
      const img = new window.Image()
      img.src = url
    }
  }, [variants])

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

  const getDisplayImage = () => {
    if (selectedColor && selectedVariant?.image_url) {
      return selectedVariant.image_url
    }
    return product?.thumbnail_url || ''
  }
  const displayImage = mainImage || getDisplayImage()
  const lightboxImages = product
    ? ([displayImage, ...(product.gallery_images || []).filter((img) => img !== displayImage)].filter(
        Boolean
      ) as string[])
    : []

  useEffect(() => {
    if (lightboxIdx === null) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIdx(null)
      if (e.key === 'ArrowRight')
        setLightboxIdx((i) => Math.min((i ?? 0) + 1, lightboxImages.length - 1))
      if (e.key === 'ArrowLeft') setLightboxIdx((i) => Math.max((i ?? 0) - 1, 0))
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [lightboxIdx, lightboxImages.length])

  if (!product) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-red-500">Product not found</h1>
      </div>
    )
  }

  // Calculate display price - dynamic based on selections
  const displayPrice = selectedVariant
    ? Number(product.base_price) + Number(selectedVariant.price_adjustment)
    : Number(product.base_price)

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
    if (/mm|cm|in|ft|m\b/i.test(displayName)) return displayName
    // Only append mm to bare numbers (e.g. "100" → "100mm"); leave words like "Small" alone
    if (/^\d+(\.\d+)?$/.test(displayName.trim())) return `${displayName.trim()}mm`
    return displayName
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
      size_display: selectedSize ? formatSizeDisplay(getDisplayName(selectedSize)) : null,
      color_display: selectedColor ? getDisplayName(selectedColor) : null,
      material_display: selectedMaterial ? getDisplayName(selectedMaterial) : null,
      price: displayPrice,
      name: product.name,
      image_url: displayImage,
    }

    addToCart(cartItem)
    setCartToastKey((k) => k + 1)
    setCartToast({
      name: product.name,
      image_url: displayImage,
      price: displayPrice,
      quantity,
      size_display: selectedSize ? formatSizeDisplay(getDisplayName(selectedSize)) : null,
      color_display: selectedColor ? getDisplayName(selectedColor) : null,
      material_display: selectedMaterial ? getDisplayName(selectedMaterial) : null,
    })

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
      <div className="max-w-7xl mx-auto pt-24 pb-20 px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-lg mb-10 flex-wrap" aria-label="Breadcrumb">
          <Link
            href="/"
            className="text-zinc-400 hover:text-zinc-900 hover:underline underline-offset-2 transition-colors"
          >
            Home
          </Link>
          <svg
            aria-hidden="true"
            className="w-4 h-4 text-zinc-300 flex-shrink-0"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M4 2l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <Link
            href="/products"
            className="text-zinc-400 hover:text-zinc-900 hover:underline underline-offset-2 transition-colors"
          >
            Shop
          </Link>
          <svg
            aria-hidden="true"
            className="w-4 h-4 text-zinc-300 flex-shrink-0"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M4 2l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <Link
            href={`/products?cat=${product.category.slug}`}
            className="text-zinc-400 hover:text-zinc-900 hover:underline underline-offset-2 transition-colors"
          >
            {product.category.name}
          </Link>
          <svg
            aria-hidden="true"
            className="w-4 h-4 text-zinc-300 flex-shrink-0"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M4 2l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-zinc-900 font-semibold truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* ── Left: Image panel ── */}
          <div className="sticky top-24 space-y-3">
            {/* Main image */}
            <button
              type="button"
              onClick={() => setLightboxIdx(0)}
              className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 shadow-sm group cursor-zoom-in block"
            >
              <Image
                src={displayImage}
                alt={product.name}
                className="w-full h-full object-contain transition-all duration-500 ease-in-out group-hover:scale-[1.03]"
                width={1000}
                height={1000}
                priority
              />
            </button>

            {/* Thumbnails */}
            {product.gallery_images && product.gallery_images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => { setMainImage(null); setLightboxIdx(0) }}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                    mainImage === null
                      ? 'border-emerald-500 shadow-md shadow-emerald-100'
                      : 'border-transparent hover:border-zinc-300'
                  }`}
                >
                  <Image
                    src={getDisplayImage()}
                    alt={`${product.name} main`}
                    className="w-full h-full object-cover"
                    width={160}
                    height={160}
                  />
                </button>
                {product.gallery_images.slice(0, 3).map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => { setMainImage(image); setLightboxIdx(0) }}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      mainImage === image
                        ? 'border-emerald-500 shadow-md shadow-emerald-100'
                        : 'border-transparent hover:border-zinc-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      width={160}
                      height={160}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Details panel ── */}
          <div className="space-y-8">
            {/* Category + title */}
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-emerald-600 mb-2">
                {product.category.name}
              </p>
              <h1 className="text-4xl md:text-5xl font-light text-zinc-900 leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Price — hero, not in a card */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-semibold text-zinc-900">
                {formatMoney(displayPrice)}
              </span>
            </div>

            {/* Divider */}
            <div className="border-t border-zinc-100" />

            {/* Variant Selectors */}
            {variants.length > 0 && (
              <div className="space-y-6">
                {/* Size */}
                {variantOptions.sizes.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">
                        Size
                      </p>
                      {selectedSize && (
                        <span className="text-sm text-zinc-500 font-light">
                          {formatSizeDisplay(getDisplayName(selectedSize))}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {variantOptions.sizes.map((sizeOption) => {
                        const isDisabled = !isSizeAvailable(sizeOption.value)
                        const isSelected = selectedSize === sizeOption.value
                        return (
                          <button
                            type="button"
                            key={sizeOption.value}
                            onClick={() => !isDisabled && handleSizeSelect(sizeOption.value)}
                            disabled={isDisabled}
                            className={`relative min-w-[3.5rem] px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-150 ${
                              isSelected
                                ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                                : isDisabled
                                  ? 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed'
                                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:text-zinc-900'
                            }`}
                          >
                            {isDisabled && (
                              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="w-full h-px bg-zinc-300 rotate-[-20deg] absolute" />
                              </span>
                            )}
                            {formatSizeDisplay(sizeOption.displayName)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Colour */}
                {variantOptions.colors.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">
                        Colour
                      </p>
                      {selectedColor && (
                        <span className="text-sm text-zinc-500 font-light">
                          {getDisplayName(selectedColor)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {variantOptions.colors.map((colorOption) => {
                        const isDisabled = !isColorAvailable(colorOption.value)
                        const isSelected = selectedColor === colorOption.value
                        const hasSwatch = colorOption.hexColor && colorOption.hexColor.trim() !== ''

                        if (hasSwatch) {
                          return (
                            <button
                              type="button"
                              key={colorOption.value}
                              onClick={() => !isDisabled && setSelectedColor(colorOption.value)}
                              disabled={isDisabled}
                              title={colorOption.displayName}
                              className={`relative w-9 h-9 rounded-full transition-all duration-150 ${
                                isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                              } ${
                                isSelected
                                  ? 'ring-2 ring-offset-2 ring-zinc-900 scale-110'
                                  : 'ring-1 ring-zinc-200 hover:ring-zinc-400 hover:scale-105'
                              }`}
                              style={{ backgroundColor: colorOption.hexColor || '#ccc' }}
                            >
                              {isDisabled && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                  <span className="w-full h-px bg-white/60 rotate-45 absolute" />
                                </span>
                              )}
                            </button>
                          )
                        }

                        return (
                          <button
                            type="button"
                            key={colorOption.value}
                            onClick={() => !isDisabled && setSelectedColor(colorOption.value)}
                            disabled={isDisabled}
                            className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-150 ${
                              isSelected
                                ? 'border-zinc-900 bg-zinc-900 text-white'
                                : isDisabled
                                  ? 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed'
                                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
                            }`}
                          >
                            {colorOption.displayName}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Material */}
                {variantOptions.materials.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-3">
                      Material
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {variantOptions.materials.map((materialOption) => {
                        const isSelected = selectedMaterial === materialOption.value
                        return (
                          <button
                            type="button"
                            key={materialOption.value}
                            onClick={() => setSelectedMaterial(materialOption.value)}
                            className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-150 ${
                              isSelected
                                ? 'border-zinc-900 bg-zinc-900 text-white'
                                : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
                            }`}
                          >
                            {materialOption.displayName}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-zinc-100" />

            {/* Quantity + CTA */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <p className="text-sm font-semibold text-zinc-900 uppercase tracking-wider w-20">
                  Qty
                </p>
                <div className="flex items-center border-2 border-zinc-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 transition-colors text-lg font-light"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-medium text-zinc-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(99, quantity + 1))}
                    disabled={quantity >= 99}
                    className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 transition-colors text-lg font-light disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={variants.length > 0 && !hasCompleteVariantMatch}
                className={`w-full py-4 px-6 rounded-2xl text-base font-medium transition-all duration-200 ${
                  variants.length > 0 && !hasCompleteVariantMatch
                    ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                    : 'bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.99] shadow-sm hover:shadow-md'
                }`}
              >
                {variants.length > 0 && !hasCompleteVariantMatch
                  ? 'Select options above'
                  : 'Add to Cart'}
              </button>

              {/* Trust strip */}
              <div className="flex items-center justify-center gap-6 text-xs text-zinc-400 font-light pt-1">
                <span className="flex items-center gap-1.5">
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <path d="M6.5 3c-1.051 0-2.093.04-3.125.117A1.49 1.49 0 0 0 2 4.607V10.5h9.5V4.606c0-.74-.55-1.375-1.375-1.489A41.35 41.35 0 0 0 6.5 3ZM2 12v2.5A1.5 1.5 0 0 0 3.5 16h.041a3 3 0 0 1 5.918 0h.791a.75.75 0 0 0 .75-.75V12H2Z" />
                    <path d="M6.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM13.25 5a.75.75 0 0 0-.75.75v8.514a3.001 3.001 0 0 1 4.893 1.44c.37-.275.607-.714.607-1.204V7.803a1.5 1.5 0 0 0-.82-1.337l-3.25-1.625A.75.75 0 0 0 13.25 5ZM14.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
                  </svg>
                  Made to order
                </span>
                <span className="flex items-center gap-1.5">
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Secure checkout
                </span>
                <span className="flex items-center gap-1.5">
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  UK made
                </span>
              </div>
            </div>

            {/* Customisable badge */}
            {product.customizable && (
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <svg
                  aria-hidden="true"
                  focusable="false"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5"
                >
                  <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                  <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-emerald-800">Customisable product</p>
                  <p className="text-xs text-emerald-600 font-light mt-0.5">
                    This product can be personalised with your own text or design.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Below-fold: About this product */}
        <div className="mt-24 pt-16 border-t border-zinc-200">
          <h2 className="text-4xl font-semibold text-zinc-900 mb-10 tracking-tight">
            About this product
          </h2>

          {product.description && (
            <p className="text-base text-zinc-600 leading-relaxed max-w-3xl mb-12">
              {product.description}
            </p>
          )}

          <div className="divide-y divide-zinc-100 border-t border-zinc-100">
            {(
              [
                {
                  key: 'details',
                  title: 'Product details',
                  content:
                    'Each piece is 3D printed to order in the UK using precision FDM technology. Slight layer lines are a natural characteristic of the process. Dimensions vary by size option — refer to the size selector above for available options.',
                },
                {
                  key: 'materials',
                  title: 'Materials & printing',
                  content:
                    siteSettings.accordion_materials_printing ??
                    'We print in PLA+ and PETG — both durable, environmentally conscious materials. PLA+ is ideal for decorative and display pieces; PETG is stronger and heat-resistant, suited to functional items. Colours are produced in-house and may vary slightly from on-screen representations.',
                },
                {
                  key: 'delivery',
                  title: 'Delivery & returns',
                  content:
                    siteSettings.accordion_delivery_returns ??
                    'Free UK standard delivery on orders over £30. Items are dispatched within 2–4 business days of ordering. We accept returns on non-personalised items within 14 days of receipt — please contact us to arrange.',
                },
                ...(product.customizable
                  ? [
                      {
                        key: 'custom',
                        title: 'Custom options',
                        content:
                          "This product is available with personalised text or a custom design. Leave a note at checkout with your requirements, or get in touch before ordering to discuss what's possible.",
                      },
                    ]
                  : []),
              ] as Array<{ key: string; title: string; content: string }>
            ).map(({ key, title, content }) => {
              const isOpen = openAccordion === key
              return (
                <div key={key}>
                  <button
                    type="button"
                    onClick={() => setOpenAccordion(isOpen ? null : key)}
                    className="w-full flex items-center justify-between py-5 text-left group"
                  >
                    <span
                      className={`text-2xl font-semibold tracking-tight transition-colors ${
                        isOpen ? 'text-zinc-900' : 'text-zinc-700 group-hover:text-zinc-900'
                      }`}
                    >
                      {title}
                    </span>
                    <svg
                      aria-hidden="true"
                      focusable="false"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`w-5 h-5 text-zinc-400 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-zinc-600' : ''
                      }`}
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <div
                    className={`grid transition-all duration-200 ease-out ${
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-6 text-base text-zinc-500 leading-relaxed max-w-3xl">
                        {content}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Lightbox */}
        {lightboxIdx !== null && (
          <>
            {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop */}
            <div
              className="fixed inset-0 z-[100] bg-black/92 flex items-center justify-center"
              onClick={() => setLightboxIdx(null)}
              onKeyDown={(e) => e.key === 'Escape' && setLightboxIdx(null)}
              style={{ animation: 'fadeIn 0.2s ease-out' }}
            >
              {/* Close button */}
              <button
                type="button"
                onClick={() => setLightboxIdx(null)}
                className="absolute top-5 right-5 z-10 p-2 text-white/50 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg
                  aria-hidden="true"
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Image */}
              {/* biome-ignore lint/a11y/noStaticElementInteractions: stops propagation */}
              <div
                className="flex items-center justify-center w-full max-w-3xl mx-6"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                style={{ animation: 'lightboxIn 0.25s ease-out' }}
              >
                <Image
                  src={lightboxImages[lightboxIdx]}
                  alt={product.name}
                  width={1000}
                  height={1000}
                  className="object-contain max-h-[90vh] w-auto h-auto"
                  priority
                />
              </div>

              {/* Prev */}
              {lightboxIdx > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxIdx(lightboxIdx - 1)
                  }}
                  className="absolute left-4 p-3 text-white/50 hover:text-white transition-colors"
                  aria-label="Previous image"
                >
                  <svg
                    aria-hidden="true"
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
              )}

              {/* Next */}
              {lightboxIdx < lightboxImages.length - 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxIdx(lightboxIdx + 1)
                  }}
                  className="absolute right-4 p-3 text-white/50 hover:text-white transition-colors"
                  aria-label="Next image"
                >
                  <svg
                    aria-hidden="true"
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              )}

              {/* Dot indicators */}
              {lightboxImages.length > 1 && (
                <div className="absolute bottom-5 flex items-center gap-2">
                  {lightboxImages.map((_, i) => (
                    <button
                      key={lightboxImages[i]}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setLightboxIdx(i)
                      }}
                      aria-label={`Image ${i + 1}`}
                      className={`rounded-full transition-all duration-200 ${
                        i === lightboxIdx ? 'w-2.5 h-2.5 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {cartToast && (
          <CartToast key={cartToastKey} item={cartToast} onClose={() => setCartToast(null)} />
        )}
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
    // Fetch product
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

    if (productError || !product) {
      return { notFound: true }
    }

    // Fetch variants and attributes (with their options) in parallel
    const [variantsResult, attributesResult] = await Promise.all([
      supabaseServer
        .from('product_variants')
        .select('*')
        .eq('product_id', product.id)
        .eq('is_available', true)
        .order('created_at', { ascending: true }),
      supabaseServer
        .from('product_attributes')
        .select('*, options:product_attribute_options(*)')
        .eq('product_id', product.id)
        .order('display_order', { ascending: true }),
    ])

    const variants = variantsResult.data || []
    const attributes = attributesResult.data || []

    const valueToDisplayNameMap: Record<string, string> = {}
    const attributeOptions: Array<{
      value: string
      display_name: string
      hex_color?: string | null
      attribute_id: string
    }> = []

    for (const attr of attributes) {
      for (const opt of (attr.options || []) as Array<{
        value: string
        display_name: string
        hex_color?: string | null
        attribute_id: string
      }>) {
        valueToDisplayNameMap[opt.value] = opt.display_name
        attributeOptions.push({ ...opt, attribute_id: attr.id })
      }
    }

    // Calculate price range
    let minPrice = Number(product.base_price)
    let maxPrice = Number(product.base_price)
    const hasVariants = variants.length > 0

    if (hasVariants) {
      const variantPrices = variants.map(
        (v: { price_adjustment: number }) => Number(product.base_price) + Number(v.price_adjustment)
      )
      minPrice = Math.min(...variantPrices)
      maxPrice = Math.max(...variantPrices)
    }

    // Extract unique options for display (using display names, but store values for matching)
    const uniqueSizeValues = Array.from(
      new Set(variants.map((v: { size?: string }) => v.size).filter(Boolean))
    ) as string[]
    const uniqueColorValues = Array.from(
      new Set(variants.map((v: { color?: string }) => v.color).filter(Boolean))
    ) as string[]
    const uniqueMaterialValues = Array.from(
      new Set(variants.map((v: { material?: string }) => v.material).filter(Boolean))
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

    // PostgREST returns many-to-one joins as objects, not arrays — handle both shapes
    const rawCat = product.categories
    const categoryData = rawCat
      ? Array.isArray(rawCat)
        ? (rawCat[0] ?? { id: null, name: 'Uncategorized', slug: 'uncategorized' })
        : rawCat
      : { id: null, name: 'Uncategorized', slug: 'uncategorized' }

    const { data: settingsRows } = await supabaseServer
      .from('site_settings')
      .select('key, value')
    const siteSettings: SiteSettings = Object.fromEntries(
      (settingsRows ?? []).map(({ key, value }: { key: string; value: string }) => [key, value])
    )

    return {
      props: {
        product: { ...product, category: categoryData },
        variants,
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
        siteSettings,
      },
      revalidate: 60,
    }
  } catch (error) {
    console.error('Error fetching product:', error)
    return { notFound: true }
  }
}

export default ProductDetailPage
