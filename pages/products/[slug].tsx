import { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Product, ProductVariant } from '@/types'
import { useCart } from '@/context/CartContext'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/router'
import Toast from '@/components/ui/Toast'

// Server-side client for static generation
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false
    }
  }
)

type ProductDetailPageProps = {
  product: Product | null
  variants: ProductVariant[]
}

const ProductDetailPage: NextPage<ProductDetailPageProps> = ({ product, variants }) => {
  const { addToCart, clearCart } = useCart()
  const router = useRouter()
  // null means show thumbnail, otherwise show selected variant
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [showMessage, setShowMessage] = useState(false)
  const [buttonClicked, setButtonClicked] = useState(false)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)

  if (!product) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-red-500">Product not found</h1>
      </div>
    )
  }

  // Use thumbnail if no variant selected
  const imageUrl = selectedVariant ? selectedVariant.image_url : product.thumbnail_url;
  // Determine base price for selected variant (or first variant)
  const baseVariant = selectedVariant || variants[0];
  let basePrice = baseVariant ? baseVariant.price : 0;
  // If color contains 'And', override base price to 17.99
  if (baseVariant && baseVariant.color && baseVariant.color.includes('And')) {
    basePrice = 17.99;
  } else if (baseVariant) {
    basePrice = 16.99;
  }
  // Calculate price based on selected size
  let displayPrice = basePrice;
  if (selectedSize === '210mm') {
    displayPrice = basePrice - 4;
  } else if (selectedSize === '180mm') {
    displayPrice = basePrice - 7;
  } else if (selectedSize === '150mm') {
    displayPrice = basePrice - 10;
  } else if (selectedSize === '240mm') {
    displayPrice = basePrice;
  }
  const customizable = selectedVariant ? selectedVariant.customizable : (variants[0]?.customizable ?? false)

  return (
    <div className="max-w-7xl mx-auto py-20 px-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="ml-2 mb-6 text-blue-600 hover:text-blue-800 text-sm flex items-center"
      >
        ← Back
      </button>
      <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 pb-10">{product.title}</h1>
          <Image
            src={imageUrl}
            alt={product.title + (selectedVariant ? ' - ' + selectedVariant.color : '')}
            className="w-full h-auto rounded-lg"
            width={1000}
            height={1000}
          />
          {/* Mobile: Variant selector, price, customizable info under image */}
          <div className="block md:hidden pt-15">
            <div className="mt-6">
              <label className="block font-semibold mb-2">Colour</label>
              <div className="flex flex-wrap gap-2">
                {/* Dash button for thumbnail */}
                <button
                  className={`px-3 py-1 rounded-full border ${selectedVariant === null ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                  onClick={() => setSelectedVariant(null)}
                >
                  -
                </button>
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    className={`px-3 py-1 rounded-full border ${selectedVariant?.id === variant.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                    onClick={() => setSelectedVariant(variant)}
                  >
                    {variant.color}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-4 text-xl font-semibold text-gray-900">£{displayPrice.toFixed(2)}</p>
            <p className="mt-1 text-gray-700">
              Customizable: <span className="font-medium">{customizable ? 'Yes' : 'No'}</span>
            </p>
            {/* Mobile: Size selector */}
            <div className="mt-6">
              <label className="block font-semibold mb-2">Size</label>
              <div className="flex flex-wrap gap-2">
                {/* Dash button for size deselect */}
                <button
                  type="button"
                  className={`px-3 py-1 rounded-full border ${selectedSize === null ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                  onClick={() => setSelectedSize(null)}
                >
                  -
                </button>
                {["150mm", "180mm", "210mm", "240mm"].map(size => (
                  <button
                    key={size}
                    type="button"
                    className={`px-3 py-1 rounded-full border ${selectedSize === size ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-200 text-gray-800 border-gray-300'}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            {/* Mobile: Action buttons */}
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => {
                  if (!selectedSize) {
                    setToast({ message: 'Please select a size before adding to cart.', type: 'error' })
                    return
                  }
                  if (!selectedVariant) {
                    setToast({ message: 'Please select a color before adding to cart.', type: 'error' })
                    return
                  }
                  setButtonClicked(true)
                  addToCart(product, selectedVariant, selectedSize)
                  setShowMessage(true)
                  setTimeout(() => setButtonClicked(false), 1000)
                  setTimeout(() => setShowMessage(false), 5000)
                }}
                className={`px-5 py-2 rounded transition font-medium ${
                  buttonClicked
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {buttonClicked ? 'Added!' : 'Add to Cart'}
              </button>
              <button 
                onClick={() => {
                  if (!selectedSize) {
                    setToast({ message: 'Please select a size before buying.', type: 'error' })
                    return
                  }
                  if (!selectedVariant) {
                    setToast({ message: 'Please select a color before buying.', type: 'error' })
                    return
                  }
                  // Clear cart and add single item for buy now
                  clearCart()
                  addToCart(product, selectedVariant, selectedSize)
                  // Redirect to checkout
                  router.push('/checkout')
                }}
                className="bg-gray-200 text-gray-800 px-5 py-2 rounded hover:bg-gray-300"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
        <div className="pt-0 md:pt-15">
          <p className="text-sm text-gray-500 mt-2">{product.category}</p>
          <p className="mt-4 text-gray-700 whitespace-pre-line">{product.description}</p>
          {/* Desktop: Size selector above Colour selector */}
          <div className="hidden md:block py-5">
            <div className="mt-2">
              <label className="block mb-2 font-medium text-stone-800">Size</label>
              <div className="flex flex-wrap gap-2 pb-2">
                {/* Dash button for size deselect */}
                <button
                  type="button"
                  className={`px-3 py-1 rounded-full border ${selectedSize === null ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                  onClick={() => setSelectedSize(null)}
                >
                  -
                </button>
                {["150mm", "180mm", "210mm", "240mm"].map(size => (
                  <button
                    key={size}
                    type="button"
                    className={`px-3 py-1 rounded-full border ${selectedSize === size ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-200 text-gray-800 border-gray-300'}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <label className="block font-medium text-stone-800 mb-2">Colour</label>
              <div className="flex flex-wrap gap-2 pb-2">
                {/* Dash button for thumbnail */}
                <button
                  className={`px-3 py-1 rounded-full border ${selectedVariant === null ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                  onClick={() => setSelectedVariant(null)}
                >
                  -
                </button>
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    className={`px-3 py-1 rounded-full border ${selectedVariant?.id === variant.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                    onClick={() => setSelectedVariant(variant)}
                  >
                    {variant.color}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-4 text-xl font-semibold text-gray-900">£{displayPrice.toFixed(2)}</p>
            <p className="mt-1 text-gray-700">
              Customizable: <span className="font-medium">{customizable ? 'Yes' : 'No'}</span>
            </p>
          </div>
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => {
                if (!selectedSize) {
                  setToast({ message: 'Please select a size before adding to cart.', type: 'error' })
                  return
                }
                if (!selectedVariant) {
                  setToast({ message: 'Please select a color before adding to cart.', type: 'error' })
                  return
                }
                setButtonClicked(true)
                addToCart(product, selectedVariant, selectedSize)
                setShowMessage(true)
                setTimeout(() => setButtonClicked(false), 1000)
                setTimeout(() => setShowMessage(false), 5000)
              }}
              className={`px-5 py-2 rounded transition font-medium ${
                buttonClicked
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {buttonClicked ? 'Added!' : 'Add to Cart'}
            </button>
            <button 
              onClick={() => {
                if (!selectedSize) {
                  setToast({ message: 'Please select a size before buying.', type: 'error' })
                  return
                }
                if (!selectedVariant) {
                  setToast({ message: 'Please select a color before buying.', type: 'error' })
                  return
                }
                // Clear cart and add single item for buy now
                clearCart()
                addToCart(product, selectedVariant, selectedSize)
                // Redirect to checkout
                router.push('/checkout')
              }}
              className="bg-gray-200 text-gray-800 px-5 py-2 rounded hover:bg-gray-300"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
      {showMessage && (
        <div className="fixed max-w-5xs md:max-w-none bottom-6 right-6 md:right-6 md:bottom-20 md:left-auto left-1/2 transform -translate-x-1/2 md:translate-x-0 bg-gray-200/50 border-stone-300 text-stone-800 px-4 py-2 shadow-md text-sm md:text-base z-50 transition-opacity duration-300 text-center">
          Item added to cart
        </div>
      )}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}

export default ProductDetailPage

export const getStaticPaths: GetStaticPaths = async () => {
  console.log('🔄 [ProductDetail] Generating static paths...')
  
  const { data: products, error } = await supabaseServer.from('products').select('slug')

  if (error) {
    console.error('❌ [ProductDetail] Error fetching products for static paths:', error)
    return { paths: [], fallback: 'blocking' }
  }

  if (!products) {
    console.log('⚠️ [ProductDetail] No products found for static paths')
    return { paths: [], fallback: 'blocking' }
  }

  const paths = products.map((product: { slug: string }) => ({
    params: { slug: product.slug },
  }))

  console.log('✅ [ProductDetail] Generated static paths:', paths.length)
  return { paths, fallback: 'blocking' }
}

export const getStaticProps: GetStaticProps<ProductDetailPageProps> = async (context) => {
  const { slug } = context.params || {}

  console.log('🔄 [ProductDetail] Getting static props for slug:', slug)

  if (!slug || typeof slug !== 'string') {
    console.log('❌ [ProductDetail] Invalid slug:', slug)
    return { notFound: true }
  }

  console.log('🔍 [ProductDetail] Fetching product with slug:', slug)
  const { data: product, error: productError } = await supabaseServer
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single()
    
  if (productError) {
    console.error('❌ [ProductDetail] Error fetching product:', productError)
    return { notFound: true }
  }
  
  if (!product) {
    console.log('❌ [ProductDetail] Product not found for slug:', slug)
    return { notFound: true }
  }

  console.log('✅ [ProductDetail] Product found:', product.title)
  console.log('🔍 [ProductDetail] Fetching variants for product:', product.id)
  
  const { data: variants, error: variantsError } = await supabaseServer
    .from('product_variants')
    .select('*')
    .eq('product_id', product.id)
    
  if (variantsError) {
    console.error('❌ [ProductDetail] Error fetching variants:', variantsError)
    return { notFound: true }
  }
  
  if (!variants || variants.length === 0) {
    console.log('⚠️ [ProductDetail] No variants found for product:', product.id)
    return { notFound: true }
  }

  console.log('✅ [ProductDetail] Variants found:', variants.length)
  
  return {
    props: {
      product,
      variants,
    },
    revalidate: 60,
  }
}
