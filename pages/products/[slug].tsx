import { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import { supabase } from '@/lib/supabaseClient'
import { Product } from '@/types'
import { useCart } from '@/context/CartContext'
import Image from 'next/image'
import { useState } from 'react'

type ProductDetailPageProps = {
  product: Product | null
}

const ProductDetailPage: NextPage<ProductDetailPageProps> = ({ product }) => {
  const { addToCart } = useCart()
  const [showMessage, setShowMessage] = useState(false)
  const [buttonClicked, setButtonClicked] = useState(false)

  if (!product) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-red-500">Product not found</h1>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Image
            src={product.image}
            alt={product.title}
            className="w-full h-auto rounded-lg"
            width={300}
            height={300}
        />
        <div>
          <h1 className="text-3xl font-bold text-stone-800">{product.title}</h1>
          <p className="text-sm text-gray-600 mt-2">{product.category}</p>
          <p className="mt-4 text-gray-700">
            Material: <span className="font-medium">{product.material}</span>
          </p>
          <p className="mt-1 text-gray-700">
            Customizable:{' '}
            <span className="font-medium">
              {product.customizable ? 'Yes' : 'No'}
            </span>
          </p>
          <p className="mt-4 text-xl font-semibold text-gray-900">
            £{product.price.toFixed(2)}
          </p>

          <div className="mt-6 flex gap-4">
            <button
                onClick={() => {
                    console.log('adding', product)
                    setButtonClicked(true)
                    addToCart(product)
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

            <button className="bg-gray-200 text-gray-800 px-5 py-2 rounded hover:bg-gray-300">
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

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    console.error('Error fetching product by slug:', error)
    return { notFound: true }
  }

  return {
    props: {
      product: data,
    },
    revalidate: 60, // Re-generate the page every 60 seconds
  }
}
