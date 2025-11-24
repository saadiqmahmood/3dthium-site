import { createClient } from '@supabase/supabase-js'
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Toast from '@/components/ui/Toast'
import { useCart } from '@/context/CartContext'
import type { ProductVariantNew } from '@/types'

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

type ProductDetailPageProps = {
  product: ProductNew | null
  variants: ProductVariantNew[]
  variantOptions: {
    sizes: string[]
    colors: string[]
    materials: string[]
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
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantNew | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)

  // Update selected variant when selections change
  useEffect(() => {
    if (!variants.length) return

    // Find matching variant
    const matchingVariant = variants.find(
      (variant) =>
        variant.size === selectedSize &&
        variant.color === selectedColor &&
        variant.material === selectedMaterial
    )

    setSelectedVariant(matchingVariant || null)
  }, [selectedSize, selectedColor, selectedMaterial, variants])

  if (!product) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-red-500">Product not found</h1>
      </div>
    )
  }

  // Calculate display price
  const displayPrice = selectedVariant
    ? product.base_price + selectedVariant.price_adjustment
    : product.base_price

  // Get display image
  const displayImage = selectedVariant?.image_url || product.thumbnail_url || ''

  const handleAddToCart = () => {
    if (!selectedVariant && variants.length > 0) {
      setToast({ message: 'Please select a variant', type: 'error' })
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
                <Image
                  src={displayImage}
                  alt={product.name}
                  className="w-full h-auto rounded-lg"
                  width={1000}
                  height={1000}
                />
                {/* Gallery images */}
                {product.gallery_images && product.gallery_images.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {product.gallery_images.slice(0, 4).map((image, index) => (
                      <Image
                        key={index}
                        src={image}
                        alt={`${product.name} gallery ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-75 border border-gray-200"
                        width={100}
                        height={100}
                        onClick={() => {
                          /* TODO: Implement gallery modal */
                        }}
                      />
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
            <div className="text-zinc-700 text-lg leading-relaxed font-light">
              {product.description}
            </div>

            {/* Variant Selectors */}
            {variants.length > 0 && (
              <div className="space-y-4">
                {/* Size Selector */}
                {variantOptions.sizes.length > 0 && (
                  <div>
                    <label className="block font-semibold mb-2 text-zinc-900 text-lg">Size</label>
                    <div className="flex flex-wrap gap-2">
                      {variantOptions.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-4 py-2 rounded-lg border text-base font-light transition ${
                            selectedSize === size
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : 'bg-gray-100 text-zinc-700 border-gray-300 hover:border-gray-400 hover:text-zinc-900'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Selector */}
                {variantOptions.colors.length > 0 && (
                  <div>
                    <label className="block font-semibold mb-2 text-zinc-900 text-lg">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {variantOptions.colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`px-4 py-2 rounded-lg border text-base font-light transition ${
                            selectedColor === color
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : 'bg-gray-100 text-zinc-700 border-gray-300 hover:border-gray-400 hover:text-zinc-900'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
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
                      {variantOptions.materials.map((material) => (
                        <button
                          key={material}
                          onClick={() => setSelectedMaterial(material)}
                          className={`px-4 py-2 rounded-lg border text-base font-light transition ${
                            selectedMaterial === material
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : 'bg-gray-100 text-zinc-700 border-gray-300 hover:border-gray-400 hover:text-zinc-900'
                          }`}
                        >
                          {material}
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
                £{displayPrice.toFixed(2)}
                {priceRange.has_variants && !selectedVariant && (
                  <span className="text-xl text-zinc-600 ml-2 font-light">
                    (from £{priceRange.min.toFixed(2)})
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
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100 text-zinc-900 transition"
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
                disabled={variants.length > 0 && !selectedVariant}
              >
                {variants.length > 0 && !selectedVariant ? 'Select Options' : 'Add to Cart'}
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

            {/* Selected Variant Info */}
            {selectedVariant && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-zinc-900 text-base">
                  <span className="font-semibold">Selected:</span>
                  {selectedVariant.size && ` ${selectedVariant.size}`}
                  {selectedVariant.color && ` ${selectedVariant.color}`}
                  {selectedVariant.material && ` ${selectedVariant.material}`}
                  {selectedVariant.sku && ` (SKU: ${selectedVariant.sku})`}
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
      .from('products_new')
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
      .from('products_new')
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
      .from('product_variants_new')
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

    // Extract unique options for display
    const uniqueSizes = Array.from(
      new Set(variants?.map((v: { size?: string }) => v.size).filter(Boolean) || [])
    ) as string[]
    const uniqueColors = Array.from(
      new Set(variants?.map((v: { color?: string }) => v.color).filter(Boolean) || [])
    ) as string[]
    const uniqueMaterials = Array.from(
      new Set(variants?.map((v: { material?: string }) => v.material).filter(Boolean) || [])
    ) as string[]

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
          sizes: uniqueSizes,
          colors: uniqueColors,
          materials: uniqueMaterials,
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
