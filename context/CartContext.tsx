import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { Product, ProductVariant } from '@/types'

export type CartItem = {
  product: Product
  variant: ProductVariant
  size: string
  quantity: number
}

type CartContextType = {
  cart: CartItem[]
  addToCart: (product: Product, variant: ProductVariant, size: string) => void
  removeFromCart: (productId: string, variantId: string, size: string) => void
  clearCart: () => void
  updateCartItemQuantity: (
    productId: string,
    variantId: string,
    size: string,
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

  const addToCart = useCallback((product: Product, variant: ProductVariant, size: string) => {
    if (!variant) {
      alert('Please select a color/variant before adding to cart.')
      return
    }
    if (!size) {
      alert('Please select a size before adding to cart.')
      return
    }
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.product.id === product.id && item.variant.id === variant.id && item.size === size
      )
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.variant.id === variant.id && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, variant, size, quantity: 1 }]
    })
  }, [])

  const removeFromCart = useCallback((productId: string, variantId: string, size: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(item.product.id === productId && item.variant.id === variantId && item.size === size)
      )
    )
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const updateCartItemQuantity = useCallback(
    (productId: string, variantId: string, size: string, quantity: number) => {
      setCart((prev) => {
        if (quantity <= 0) {
          return prev.filter(
            (item) =>
              !(
                item.product.id === productId &&
                item.variant.id === variantId &&
                item.size === size
              )
          )
        }
        return prev.map((item) =>
          item.product.id === productId && item.variant.id === variantId && item.size === size
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
