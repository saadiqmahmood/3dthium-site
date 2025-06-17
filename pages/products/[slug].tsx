import { useRouter } from 'next/router'
import { products } from '@/data/products'
import { useCart } from '@/context/CartContext'

export default function ProductDetailPage() {
  const router = useRouter()
  const { slug } = router.query
  const { addToCart } = useCart()

  if (!slug || typeof slug !== 'string') return null

  const product = products.find((p) => p.slug === slug)

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
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-auto rounded-lg"
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
                // onClick={() => addToCart(product)} 
                onClick={() => {
                    console.log('adding', product)
                    addToCart(product)
                  }}
                className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
                
            >
              Add to Cart
            </button>
            <button className="bg-gray-200 text-gray-800 px-5 py-2 rounded hover:bg-gray-300">
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
