import Link from 'next/link'
import type { GetStaticProps } from 'next'
import ProductGrid, { type ProductNew, type Category } from '@/components/sections/ProductGrid'
import { getSupabaseAnon } from '@/lib/supabase/anon'
import type { ProductVariantNew } from '@/types'

type Props = {
  initialProducts: ProductNew[]
  initialCategories: Category[]
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const supabase = getSupabaseAnon()

  const [productsResult, categoriesResult] = await Promise.all([
    supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        slug,
        base_price,
        thumbnail_url,
        customizable,
        created_at,
        categories!category_id(id, name, slug)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('id, name, slug, parent_id')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ])

  const products = productsResult.data ?? []
  const categories = categoriesResult.data ?? []

  const productIds = products.map((p) => p.id)
  let variants: ProductVariantNew[] = []

  if (productIds.length > 0) {
    const { data: variantData } = await supabase
      .from('product_variants')
      .select('id, product_id, size, color, material, price_adjustment, is_available, sku')
      .in('product_id', productIds)
      .eq('is_available', true)
    variants = (variantData as ProductVariantNew[]) ?? []
  }

  const variantsByProduct: Record<string, ProductVariantNew[]> = {}
  for (const v of variants) {
    if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = []
    variantsByProduct[v.product_id].push(v)
  }

  const initialProducts: ProductNew[] = products.map((product) => {
    const productVariants = variantsByProduct[product.id] ?? []
    let minPrice = Number(product.base_price)
    let maxPrice = Number(product.base_price)
    if (productVariants.length > 0) {
      const prices = productVariants.map((v) => Number(product.base_price) + Number(v.price_adjustment))
      minPrice = Math.min(...prices)
      maxPrice = Math.max(...prices)
    }
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      slug: product.slug,
      base_price: product.base_price,
      thumbnail_url: product.thumbnail_url,
      customizable: product.customizable,
      category: product.categories as unknown as { id: string; name: string; slug: string },
      variants: productVariants,
      price_range: { min: minPrice, max: maxPrice, has_variants: productVariants.length > 0 },
      created_at: product.created_at,
    }
  })

  return {
    props: { initialProducts, initialCategories: categories as Category[] },
    revalidate: 60,
  }
}

export default function ProductsPage({ initialProducts, initialCategories }: Props) {
  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-8 border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex items-center gap-2 text-lg mb-6" aria-label="Breadcrumb">
            <Link
              href="/"
              className="text-zinc-400 hover:text-zinc-900 hover:underline underline-offset-2 transition-colors"
            >
              Home
            </Link>
            <svg
              aria-hidden="true"
              className="w-4 h-4 text-zinc-300 flex-shrink-0"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M4 2l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-zinc-900 font-semibold">Shop</span>
          </nav>
          <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">Shop</h1>
        </div>
      </div>
      <ProductGrid initialProducts={initialProducts} initialCategories={initialCategories} />
    </div>
  )
}
