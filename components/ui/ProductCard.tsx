import Image from 'next/image'
import Link from 'next/link'
import { ProductVariantNew } from '@/types'

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
    <Link href={`/products/${product.slug}`} className="block">
      <div className="bg-white rounded-xl shadow hover:shadow-md transition">
        <div className="w-full h-72 bg-gray-100 rounded-t-xl overflow-hidden">
          <Image
            src={product.thumbnail_url}
            alt={product.name}
            className="w-full h-full object-cover object-center"
            width={300}
            height={300}
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">{product.name}</h3>
          <p className="text-sm text-gray-500">{product.category.name}</p>

          {/* Customizable badge */}
          {product.customizable && <p className="text-xs text-blue-500 mt-1">Customizable</p>}

          {/* Price display */}
          <p className="text-md text-gray-800 mt-2 font-semibold">{displayPrice}</p>

          {/* Variant info */}
          {product.price_range.has_variants && (
            <p className="text-xs text-gray-500 mt-1">{variantText}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
