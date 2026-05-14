import Image from 'next/image'
import Link from 'next/link'
import { formatMoney } from '@/lib/format/money'
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

export default function ProductCard({ product }: Props) {
  const displayPrice = product.price_range.has_variants
    ? product.price_range.min === product.price_range.max
      ? formatMoney(product.price_range.min)
      : `${formatMoney(product.price_range.min)} – ${formatMoney(product.price_range.max)}`
    : formatMoney(product.base_price)

  const uniqueSizes = Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean)))
  const uniqueColors = Array.from(new Set(product.variants.map((v) => v.color).filter(Boolean)))
  const uniqueMaterials = Array.from(new Set(product.variants.map((v) => v.material).filter(Boolean)))

  const variantParts: string[] = []
  if (uniqueSizes.length > 0) variantParts.push(`${uniqueSizes.length} size${uniqueSizes.length > 1 ? 's' : ''}`)
  if (uniqueColors.length > 0) variantParts.push(`${uniqueColors.length} colour${uniqueColors.length > 1 ? 's' : ''}`)
  if (uniqueMaterials.length > 0) variantParts.push(`${uniqueMaterials.length} material${uniqueMaterials.length > 1 ? 's' : ''}`)

  return (
    <Link href={`/products/${product.slug}`} className="block w-full">
      <div className="bg-white border border-gray-200 overflow-hidden">
        {/* Product Image */}
        <div className="relative w-full aspect-square bg-gray-50">
          <Image
            src={product.thumbnail_url}
            alt={product.name}
            className="w-full h-full object-contain"
            width={300}
            height={300}
          />
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="text-sm font-normal text-zinc-900 mb-2 line-clamp-2">{product.name}</h3>
          <p className="text-base font-semibold text-zinc-900">{displayPrice}</p>
          {variantParts.length > 0 && (
            <p className="text-xs text-zinc-400 mt-1">{variantParts.join(' · ')}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
