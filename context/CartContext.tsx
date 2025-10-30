import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react'

export type CartItem = {
  product_id: string
  variant_id?: string | null
  quantity: number
  size?: string | null
  color?: string | null
  material?: string | null
  price: number
  name: string
  image_url: string
}

type CartContextType = {
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (productId: string, variantId?: string) => void
  clearCart: () => void
  updateCartItemQuantity: (
    productId: string,
    variantId: string | undefined,
    quantity: number
  ) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([])
  // Load cart from localStorage on initial render
  useEffect(() => {
    const stored = localStorage.getItem('cart')
    if (stored) {
      try {
        setCart(JSON.parse(stored))
      } catch (err) {
        console.error('Failed to parse cart from localStorage:', err)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find(
        (cartItem) =>
          cartItem.product_id === item.product_id &&
          cartItem.variant_id === item.variant_id &&
          cartItem.size === item.size &&
          cartItem.color === item.color &&
          cartItem.material === item.material
      )
      if (existing) {
        return prev.map((cartItem) =>
          cartItem.product_id === item.product_id &&
          cartItem.variant_id === item.variant_id &&
          cartItem.size === item.size &&
          cartItem.color === item.color &&
          cartItem.material === item.material
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem
        )
      }
      return [...prev, item]
    })
  }, [])

  const removeFromCart = useCallback((productId: string, variantId?: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.product_id === productId && item.variant_id === variantId))
    )
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const updateCartItemQuantity = useCallback(
    (productId: string, variantId: string | undefined, quantity: number) => {
      setCart((prev) => {
        if (quantity <= 0) {
          return prev.filter(
            (item) => !(item.product_id === productId && item.variant_id === variantId)
          )
        }
        return prev.map((item) =>
          item.product_id === productId && item.variant_id === variantId
            ? { ...item, quantity }
            : item
        )
      })
    },
    []
  )

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, clearCart, updateCartItemQuantity }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}
