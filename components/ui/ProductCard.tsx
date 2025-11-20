import Image from 'next/image'
import Link from 'next/link'
import type { ProductVariantNew } from '@/types'

// New product type from products_new API
type ProductNew = {
  id: string
  name: string
  description: string
  slug: string
  base_price: number
  thumbnail_url: string
  customizable: boolean
  category: {
    name: string
    slug: string
  }
  variants: ProductVariantNew[]
  price_range: {
    min: number
    max: number
    has_variants: boolean
  }
  created_at: string
}

type Props = {
  product: ProductNew
  variants: ProductVariantNew[]
}

export default function ProductCard({ product, variants }: Props) {
  // Calculate display price
  const displayPrice = product.price_range.has_variants
    ? product.price_range.min === product.price_range.max
      ? `£${product.price_range.min.toFixed(2)}`
      : `£${product.price_range.min.toFixed(2)} - £${product.price_range.max.toFixed(2)}`
    : `£${product.base_price.toFixed(2)}`

  // Count available variants
  const variantCount = variants.length
  const variantText =
    variantCount > 0
      ? `${variantCount} variant${variantCount > 1 ? 's' : ''} available`
      : 'No variants'

  return (
    <Link href={`/products/${product.slug}`} className="block group">
      <div className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-300 overflow-hidden shadow-sm">
        <div className="relative w-full h-72 bg-gray-100 overflow-hidden">
          <Image
            src={product.thumbnail_url}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            width={300}
            height={300}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
          
          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <span className="bg-white/90 backdrop-blur-sm text-zinc-700 px-3 py-1 rounded-full text-sm font-light border border-gray-200">
              {product.category.name}
            </span>
          </div>
          
          {/* Customizable badge */}
          {product.customizable && (
            <div className="absolute top-4 right-4">
              <span className="bg-emerald-500/10 backdrop-blur-sm text-emerald-600 px-3 py-1 rounded-full text-sm font-light border border-emerald-500/30">
                Custom
              </span>
            </div>
          )}
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-medium text-zinc-900 mb-2 group-hover:text-emerald-600 transition-colors">{product.name}</h3>

          {/* Price display */}
          <p className="text-2xl font-semibold text-zinc-900 mt-2">{displayPrice}</p>

          {/* Variant info */}
          {product.price_range.has_variants && (
            <p className="text-sm text-zinc-600 mt-2 font-light">{variantText}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
