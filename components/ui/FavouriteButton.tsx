import { useFavourites } from '@/context/FavouritesContext'

type Props = {
  productId: string
  className?: string
}

export default function FavouriteButton({ productId, className = '' }: Props) {
  const { isFavourited, toggle } = useFavourites()
  const faved = isFavourited(productId)

  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(productId) }}
      aria-label={faved ? 'Remove from favourites' : 'Add to favourites'}
      className={`flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-colors hover:bg-white ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="w-4 h-4 transition-colors"
        fill={faved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={faved ? 0 : 1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          className={faved ? 'text-red-500' : 'text-zinc-400 hover:text-red-400'}
        />
      </svg>
    </button>
  )
}
