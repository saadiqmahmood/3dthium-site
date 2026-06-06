import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import FavouriteButton from '@/components/ui/FavouriteButton'
import { useAuth } from '@/context/AuthContext'
import { useFavourites } from '@/context/FavouritesContext'
import { authFetch } from '@/lib/api/authFetch'
import { formatMoney } from '@/lib/format/money'

type Product = {
  id: string
  name: string
  slug: string
  base_price: string
  thumbnail_url: string | null
}

export default function FavouritesPage() {
  const { user, loading: authLoading } = useAuth()
  const { favouriteIds, loading: favsLoading } = useFavourites()
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  useEffect(() => {
    if (authLoading || favsLoading) return
    if (favouriteIds.length === 0) { setProducts([]); return }

    setLoadingProducts(true)

    if (user) {
      authFetch('/api/favourites')
        .then((r) => r.json())
        .then((data) => setProducts(data.data?.products ?? data.products ?? []))
        .catch(() => setProducts([]))
        .finally(() => setLoadingProducts(false))
    } else {
      fetch('/api/products')
        .then((r) => r.json())
        .then((data) => {
          const all: Product[] = data.products ?? []
          setProducts(all.filter((p) => favouriteIds.includes(p.id)))
        })
        .catch(() => setProducts([]))
        .finally(() => setLoadingProducts(false))
    }
  }, [authLoading, favsLoading, user?.id, favouriteIds.length])

  const isLoading = authLoading || favsLoading || loadingProducts

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-8 border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex items-center gap-2 text-lg mb-6" aria-label="Breadcrumb">
            <Link href="/" className="text-zinc-400 hover:text-zinc-900 transition-colors">Home</Link>
            <svg aria-hidden="true" className="w-4 h-4 text-zinc-300" viewBox="0 0 12 12" fill="none">
              <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-zinc-900 font-semibold">Favourites</span>
          </nav>
          <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">Favourites</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
          </div>
        ) : favouriteIds.length === 0 ? (
          <div className="py-24 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-12 h-12 text-zinc-200 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <p className="text-base text-zinc-500 mb-4">No favourites yet</p>
            <Link href="/products" className="text-base text-emerald-600 hover:text-emerald-700 underline underline-offset-2 transition-colors">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <div key={product.id}>
                <Link href={`/products/${product.slug}`} className="group block">
                  <div className="relative aspect-square overflow-hidden bg-zinc-50">
                    {product.thumbnail_url && (
                      <Image
                        src={product.thumbnail_url}
                        alt={product.name}
                        fill
                        className="object-contain transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    )}
                    <FavouriteButton
                      productId={product.id}
                      className="absolute top-2 right-2"
                    />
                  </div>
                  <div className="pt-3 pb-1">
                    <h3 className="text-base text-zinc-800 leading-snug line-clamp-2 group-hover:text-zinc-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="mt-2 text-base font-semibold text-zinc-900">
                      {formatMoney(Number(product.base_price))}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
