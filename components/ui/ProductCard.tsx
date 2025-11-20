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
      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all duration-300 overflow-hidden">
        <div className="relative w-full h-72 bg-zinc-950 overflow-hidden">
          <Image
            src={product.thumbnail_url}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            width={300}
            height={300}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
          
          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <span className="bg-zinc-900/80 backdrop-blur-sm text-zinc-300 px-3 py-1 rounded-full text-sm font-light border border-zinc-800">
              {product.category.name}
            </span>
          </div>
          
          {/* Customizable badge */}
          {product.customizable && (
            <div className="absolute top-4 right-4">
              <span className="bg-emerald-500/20 backdrop-blur-sm text-emerald-400 px-3 py-1 rounded-full text-sm font-light border border-emerald-500/30">
                Custom
              </span>
            </div>
          )}
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-medium text-white mb-2 group-hover:text-emerald-400 transition-colors">{product.name}</h3>

          {/* Price display */}
          <p className="text-2xl font-semibold text-white mt-2">{displayPrice}</p>

          {/* Variant info */}
          {product.price_range.has_variants && (
            <p className="text-sm text-zinc-500 mt-2 font-light">{variantText}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
