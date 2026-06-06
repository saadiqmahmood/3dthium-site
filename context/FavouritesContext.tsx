import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { authFetch } from '@/lib/api/authFetch'

const LS_KEY = '3dthium_favourites'

type FavouritesContextType = {
  favouriteIds: string[]
  isFavourited: (productId: string) => boolean
  toggle: (productId: string) => Promise<void>
  loading: boolean
}

const FavouritesContext = createContext<FavouritesContextType | undefined>(undefined)

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [favouriteIds, setFavouriteIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (user) {
      authFetch('/api/favourites')
        .then((r) => r.json())
        .then((data) => setFavouriteIds(data.data?.productIds ?? data.productIds ?? []))
        .catch(() => setFavouriteIds([]))
        .finally(() => setLoading(false))
    } else {
      try {
        const stored = localStorage.getItem(LS_KEY)
        setFavouriteIds(stored ? JSON.parse(stored) : [])
      } catch {
        setFavouriteIds([])
      }
      setLoading(false)
    }
  }, [authLoading, user?.id])

  const isFavourited = useCallback(
    (productId: string) => favouriteIds.includes(productId),
    [favouriteIds]
  )

  const toggle = useCallback(
    async (productId: string) => {
      const already = favouriteIds.includes(productId)
      const next = already
        ? favouriteIds.filter((id) => id !== productId)
        : [...favouriteIds, productId]

      setFavouriteIds(next)

      if (user) {
        if (already) {
          await authFetch(`/api/favourites/${productId}`, { method: 'DELETE' })
        } else {
          await authFetch('/api/favourites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId }),
          })
        }
      } else {
        try {
          localStorage.setItem(LS_KEY, JSON.stringify(next))
        } catch {}
      }
    },
    [favouriteIds, user]
  )

  return (
    <FavouritesContext.Provider value={{ favouriteIds, isFavourited, toggle, loading }}>
      {children}
    </FavouritesContext.Provider>
  )
}

export function useFavourites() {
  const ctx = useContext(FavouritesContext)
  if (!ctx) throw new Error('useFavourites must be used inside FavouritesProvider')
  return ctx
}
