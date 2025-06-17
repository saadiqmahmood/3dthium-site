import { Product } from '@/data/products'
import Link from 'next/link'

type Props = {
  product: Product
}

export default function ProductCard({ product }: Props) {
  return (
    <Link href={`/products/${product.slug}`} className="block">
      <div className="bg-white rounded-xl shadow hover:shadow-md transition">
        <div className="w-full h-48 bg-gray-100 rounded-t-xl overflow-hidden">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">{product.title}</h3>
          <p className="text-sm text-gray-500">{product.material}</p>
          {product.customizable && (
            <p className="text-xs text-blue-500 mt-1">Customizable</p>
          )}
        </div>
      </div>
    </Link>
  )
}