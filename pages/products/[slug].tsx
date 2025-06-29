import { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import { supabase } from '@/lib/supabaseClient'
import { Product, ProductVariant } from '@/types'
import { useCart } from '@/context/CartContext'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/router'
import Toast from '@/components/ui/Toast'

type ProductDetailPageProps = {
  product: Product | null
  variants: ProductVariant[]
}

const ProductDetailPage: NextPage<ProductDetailPageProps> = ({ product, variants }) => {
  const { addToCart } = useCart()
  const router = useRouter()
  // null means show thumbnail, otherwise show selected variant
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
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
  const imageUrl = selectedVariant ? selectedVariant.image_url : product.thumbnail_url
  const price = selectedVariant ? selectedVariant.price : (variants[0]?.price ?? 0)
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
      <div className="grid grid-cols-1 md:grid-cols-[450px_1fr] gap-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 pb-10">{product.title}</h1>
          <Image
            src={imageUrl}
            alt={product.title + (selectedVariant ? ' - ' + selectedVariant.color : '')}
            className="w-full h-auto rounded-lg"
            width={1000}
            height={1000}
          />
          <div className="mt-4 flex flex-wrap gap-2">
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
        <div className="pt-15">
          <p className="text-sm text-gray-500 mt-2">{product.category}</p>
          <div className="mt-4 text-gray-700 whitespace-pre-line">
            {product.description.split('\n').map((line, idx) => (
              <div key={idx} className="mb-2">{line}</div>
            ))}
          </div>
          <p className="mt-4 text-xl font-semibold text-gray-900">
            £{price.toFixed(2)}
          </p>
          <p className="mt-1 text-gray-700">
            Customizable: <span className="font-medium">{customizable ? 'Yes' : 'No'}</span>
          </p>
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => {
                if (!selectedVariant) {
                  setToast({ message: 'Please select a color before adding to cart.', type: 'error' })
                  return
                }
                setButtonClicked(true)
                addToCart(product, selectedVariant)
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
  const { data: products, error } = await supabase.from('products').select('slug')

  if (error || !products) {
    return { paths: [], fallback: 'blocking' }
  }

  const paths = products.map((product) => ({
    params: { slug: product.slug },
  }))

  return { paths, fallback: 'blocking' }
}

export const getStaticProps: GetStaticProps<ProductDetailPageProps> = async (context) => {
  const { slug } = context.params || {}

  if (!slug || typeof slug !== 'string') {
    return { notFound: true }
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single()
  if (productError || !product) {
    return { notFound: true }
  }
  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', product.id)
  if (variantsError || !variants || variants.length === 0) {
    return { notFound: true }
  }
  return {
    props: {
      product,
      variants,
    },
    revalidate: 60,
  }
}
