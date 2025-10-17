import Image from 'next/image'
import Link from 'next/link'
import { Product, ProductVariant } from '@/types'

type Props = {
  product: Product
  variants: ProductVariant[]
}

export default function ProductCard({ product, variants }: Props) {
  return (
    <Link href={`/products/${product.slug}`} className="block">
      <div className="bg-white rounded-xl shadow hover:shadow-md transition">
        <div className="w-full h-72 bg-gray-100 rounded-t-xl overflow-hidden">
          <Image
            src={product.thumbnail_url}
            alt={product.title}
            className="w-full h-full object-cover object-center"
            width={300}
            height={300}
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">{product.title}</h3>
          <p className="text-sm text-gray-500">{product.category}</p>
          {variants[0] && variants[0].customizable && (
            <p className="text-xs text-blue-500 mt-1">Customizable</p>
          )}
          {variants[0] && (
            <p className="text-md text-gray-800 mt-2 font-semibold">
              £{variants[0].price.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
