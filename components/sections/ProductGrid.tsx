import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import ProductCard from '@/components/ui/ProductCard'
import type { ProductVariantNew } from '@/types'

export type ProductNew = {
  id: string
  name: string
  description: string
  slug: string
  base_price: number
  thumbnail_url: string
  customizable: boolean
  category: { id: string; name: string; slug: string }
  variants: ProductVariantNew[]
  price_range: { min: number; max: number; has_variants: boolean }
  created_at: string
}

export type Category = {
  id: string
  name: string
  slug: string
  parent_id: string | null
}

type Props = {
  initialProducts?: ProductNew[]
  initialCategories?: Category[]
}

export default function ProductGrid({ initialProducts, initialCategories }: Props) {
  const router = useRouter()
  const [products, setProducts] = useState<ProductNew[]>(initialProducts ?? [])
  const [categories, setCategories] = useState<Category[]>(initialCategories ?? [])
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(!initialProducts)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const searchQuery = typeof router.query.q === 'string' ? router.query.q.trim() : ''

  useEffect(() => {
    const cat = router.query.cat
    setSelectedSlug(typeof cat === 'string' ? cat : null)
  }, [router.query.cat])

  useEffect(() => {
    if (initialProducts && initialCategories) return
    Promise.all([
      fetch('/api/products').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
    ])
      .then(([prodData, catData]) => {
        setProducts(prodData.products || [])
        setCategories(catData.categories || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [initialProducts, initialCategories])

  const selectCategory = useCallback(
    (slug: string | null) => {
      setSelectedSlug(slug)
      setSidebarOpen(false)
      const query: Record<string, string> = {}
      if (slug) query.cat = slug
      if (searchQuery) query.q = searchQuery
      router.replace({ pathname: '/products', query }, undefined, { shallow: true })
    },
    [router, searchQuery]
  )

  const clearSearch = useCallback(() => {
    const query: Record<string, string> = {}
    if (selectedSlug) query.cat = selectedSlug
    router.replace({ pathname: '/products', query }, undefined, { shallow: true })
  }, [router, selectedSlug])

  const topLevel = categories.filter((c) => !c.parent_id)
  const childrenOf = (parentId: string) => categories.filter((c) => c.parent_id === parentId)

  const countFor = (slug: string, parentId?: string) => {
    const childSlugs = parentId ? childrenOf(parentId).map((c) => c.slug) : []
    return products.filter((p) => p.category.slug === slug || childSlugs.includes(p.category.slug))
      .length
  }

  const isParentActive = (catId: string) => childrenOf(catId).some((s) => s.slug === selectedSlug)

  const searchFiltered = searchQuery
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.category?.name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products

  const filteredProducts = selectedSlug
    ? (() => {
        const cat = categories.find((c) => c.slug === selectedSlug)
        const childSlugs = cat && !cat.parent_id ? childrenOf(cat.id).map((c) => c.slug) : []
        return searchFiltered.filter(
          (p) => p.category.slug === selectedSlug || childSlugs.includes(p.category.slug)
        )
      })()
    : searchFiltered

  const sidebarTree = (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => selectCategory(null)}
        className={`w-full text-left py-2.5 pr-4 text-base transition-all flex items-center justify-between border-l-2 pl-[14px] ${
          !selectedSlug
            ? 'border-emerald-500 text-emerald-600 font-medium bg-emerald-50/50'
            : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
        }`}
      >
        <span>All products</span>
        {products.length > 0 && (
          <span className="text-sm text-zinc-400 tabular-nums">{products.length}</span>
        )}
      </button>

      {topLevel.map((cat) => {
        const subs = childrenOf(cat.id)
        const isActive = selectedSlug === cat.slug
        const expanded = isActive || isParentActive(cat.id)
        return (
          <div key={cat.id}>
            <button
              type="button"
              onClick={() => selectCategory(cat.slug)}
              className={`w-full text-left py-2.5 pr-4 text-base transition-all flex items-center justify-between border-l-2 pl-[14px] ${
                isActive
                  ? 'border-emerald-500 text-emerald-600 font-medium bg-emerald-50/50'
                  : expanded
                    ? 'border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50'
                    : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              <span>{cat.name}</span>
              {countFor(cat.slug, cat.id) > 0 && (
                <span className="text-sm text-zinc-400 tabular-nums">
                  {countFor(cat.slug, cat.id)}
                </span>
              )}
            </button>
            {subs.length > 0 && expanded && (
              <div className="ml-[14px] border-l-2 border-emerald-100 pl-3 pb-1 space-y-0.5">
                {subs.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => selectCategory(sub.slug)}
                    className={`w-full text-left px-3 py-2 text-sm transition-all flex items-center justify-between ${
                      selectedSlug === sub.slug
                        ? 'text-emerald-600 font-medium'
                        : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                    }`}
                  >
                    <span>{sub.name}</span>
                    {countFor(sub.slug) > 0 && (
                      <span className="text-xs text-zinc-400 tabular-nums">
                        {countFor(sub.slug)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-6 pb-20">
      {/* Mobile filter bar */}
      <div className="flex items-center justify-between py-5 border-b border-zinc-100 lg:hidden">
        <p className="text-base text-zinc-600">
          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
        </p>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 text-base font-medium text-zinc-700 border border-zinc-200 px-4 py-2 hover:border-zinc-400 transition-colors"
        >
          <svg
            aria-hidden="true"
            focusable="false"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.845 1.757l-1.075.859A.75.75 0 0 1 9 17.598V13.49a2.25 2.25 0 0 0-.659-1.59L3.659 7.218A2.25 2.25 0 0 1 3 5.629V3.34a.75.75 0 0 1 .628-.74Z"
              clipRule="evenodd"
            />
          </svg>
          Filter{selectedSlug ? ' (1)' : ''}
        </button>
      </div>

      <div className="flex gap-12 pt-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 px-4 pb-4">
            Categories
          </p>
          {sidebarTree}
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-base text-zinc-500">
                {searchQuery ? `No results for "${searchQuery}"` : 'No products found'}
              </p>
              <div className="flex items-center justify-center gap-4 mt-4">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="text-base text-zinc-700 underline underline-offset-2 hover:text-zinc-900"
                  >
                    Clear search
                  </button>
                )}
                {selectedSlug && (
                  <button
                    type="button"
                    onClick={() => selectCategory(null)}
                    className="text-base text-zinc-700 underline underline-offset-2 hover:text-zinc-900"
                  >
                    View all products
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6 hidden lg:flex">
                <p className="text-base text-zinc-600">
                  {searchQuery && (
                    <span className="mr-3">
                      Results for <span className="text-zinc-900 font-medium">"{searchQuery}"</span>
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="ml-2 text-zinc-400 hover:text-zinc-700 transition-colors"
                        aria-label="Clear search"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                  {selectedSlug && (
                    <button
                      type="button"
                      onClick={() => selectCategory(null)}
                      className="ml-3 text-zinc-400 hover:text-zinc-700 transition-colors"
                    >
                      Clear filter ×
                    </button>
                  )}
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-px bg-zinc-100">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-white p-5">
                    <ProductCard product={product} variants={product.variants} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-black/20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSidebarOpen(false)
            }}
          />
          {/* biome-ignore lint/a11y/noStaticElementInteractions: stops click propagation */}
          <div
            className="fixed top-0 left-0 z-[70] bg-white w-72 h-full shadow-xl lg:hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            style={{ animation: 'slideInLeft 0.2s ease-out' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <span className="text-sm font-semibold text-zinc-900">Filter</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                <svg
                  aria-hidden="true"
                  focusable="false"
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{sidebarTree}</div>
          </div>
        </>
      )}
    </div>
  )
}
