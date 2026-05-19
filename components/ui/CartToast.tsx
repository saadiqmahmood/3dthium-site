import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'
import { formatMoney } from '@/lib/format/money'

export type CartToastItem = {
  name: string
  image_url: string
  price: number
  quantity: number
  size_display?: string | null
  color_display?: string | null
  material_display?: string | null
}

type Props = {
  item: CartToastItem
  onClose: () => void
}

export default function CartToast({ item, onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4500)
    return () => clearTimeout(timer)
  }, [onClose])

  const details = [item.size_display, item.color_display, item.material_display]
    .filter(Boolean)
    .join(' · ')

  return (
    <>
      {/* Desktop: speech bubble anchored near cart icon */}
      <div
        className="hidden lg:block fixed top-20 right-6 z-50 w-80"
        style={{
          animation: 'slide-in-right 0.2s ease-out',
          filter:
            'drop-shadow(0 8px 24px rgba(0,0,0,0.11)) drop-shadow(0 2px 6px rgba(0,0,0,0.06))',
        }}
      >
        {/* Caret: rotated box, bottom half painted over by card */}
        <div className="absolute -top-2 right-5 w-4 h-4 bg-white border-l border-t border-zinc-200 rotate-45" />

        {/* Card */}
        <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
          <div className="flex items-start gap-3 p-4">
            <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100">
              <Image
                src={item.image_url}
                alt={item.name}
                fill
                className="object-contain"
                sizes="64px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
                Added to cart
              </p>
              <p className="text-sm font-semibold text-zinc-900 leading-snug line-clamp-2">
                {item.quantity > 1 ? `${item.quantity} × ${item.name}` : item.name}
              </p>
              {details && <p className="text-xs text-zinc-400 mt-0.5">{details}</p>}
              <p className="text-sm font-semibold text-zinc-900 mt-1">
                {formatMoney(item.price * item.quantity)}
                {item.quantity > 1 && (
                  <span className="text-xs font-normal text-zinc-400 ml-1.5">
                    {formatMoney(item.price)} each
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Dismiss"
              className="flex-shrink-0 p-1 -mt-0.5 -mr-0.5 text-zinc-300 hover:text-zinc-600 transition-colors"
            >
              <svg
                aria-hidden="true"
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-4 pb-4">
            <Link
              href="/cart"
              onClick={onClose}
              className="block text-center py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors"
            >
              View cart
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      <div
        className="lg:hidden fixed bottom-6 left-4 right-4 z-50 bg-white rounded-2xl border border-zinc-100 overflow-hidden"
        style={{
          animation: 'fadeIn 0.2s ease-out',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        <div className="flex items-center gap-3 p-4">
          <div className="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100">
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className="object-contain"
              sizes="48px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Added to cart
            </p>
            <p className="text-sm font-semibold text-zinc-900 truncate">
              {item.quantity > 1 ? `${item.quantity} × ${item.name}` : item.name}
            </p>
          </div>
          <Link
            href="/cart"
            onClick={onClose}
            className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-zinc-900 border border-zinc-200 rounded-lg hover:border-zinc-400 transition-colors"
          >
            View
          </Link>
        </div>
      </div>
    </>
  )
}
