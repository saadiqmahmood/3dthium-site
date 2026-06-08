import Image from 'next/image'
import Link from 'next/link'
import FavouriteButton from '@/components/ui/FavouriteButton'
import { formatMoney } from '@/lib/format/money'
import type { ProductVariantNew } from '@/types'

type ProductNew = {
  id: string
  name: string
  slug: string
  base_price: number
  thumbnail_url: string
  customizable: boolean
  category: { name: string; slug: string }
  variants: ProductVariantNew[]
  price_range: { min: number; max: number; has_variants: boolean }
  created_at: string
}

type Props = {
  product: ProductNew
  variants: ProductVariantNew[]
  priority?: boolean
}

export default function ProductCard({ product, priority = false }: Props) {
  const { price_range, base_price } = product
  const isRange = price_range.has_variants && price_range.min !== price_range.max
  const baseAmount = price_range.has_variants ? price_range.min : base_price

  const uniqueColorCount = new Set(
    product.variants.filter((v) => v.color).map((v) => v.color)
  ).size

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden bg-zinc-50">
        <Image
          src={product.thumbnail_url}
          alt={product.name}
          fill
          className="object-contain transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          sizes="(max-width: 640px) 50vw, 50vw"
          priority={priority}
        />
        <FavouriteButton
          productId={product.id}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        />
      </div>
      <div className="pt-3 pb-1">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-600 mb-1.5">
          {product.category.name}
        </p>
        <h3 className="text-base text-zinc-500 leading-snug line-clamp-2 group-hover:text-zinc-700 transition-colors duration-200">
          {product.name}
        </h3>
        <p className="mt-1.5 font-semibold text-zinc-600">
          {isRange && <span className="text-sm font-normal text-zinc-400 mr-1">From</span>}
          <span className="text-base">{formatMoney(baseAmount)}</span>
        </p>
        {uniqueColorCount > 0 && (
          <p className="mt-1 text-sm text-zinc-400 font-light">
            {uniqueColorCount} colour{uniqueColorCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </Link>
  )
}
