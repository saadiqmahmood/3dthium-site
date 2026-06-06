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
}

export default function ProductCard({ product }: Props) {
  const displayPrice = product.price_range.has_variants
    ? product.price_range.min === product.price_range.max
      ? formatMoney(product.price_range.min)
      : `From ${formatMoney(product.price_range.min)}`
    : formatMoney(product.base_price)

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden bg-zinc-50">
        <Image
          src={product.thumbnail_url}
          alt={product.name}
          fill
          className="object-contain transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
        <h3 className="text-base text-zinc-800 leading-snug line-clamp-2 group-hover:text-zinc-600 transition-colors duration-200">
          {product.name}
        </h3>
        <p className="mt-2 text-base font-semibold text-zinc-900">{displayPrice}</p>
      </div>
    </Link>
  )
}
