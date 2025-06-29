import { createContext, useContext, useState, ReactNode } from 'react'
import { Product, ProductVariant } from '@/types'
import { useEffect } from 'react'

export type CartItem = {
    product: Product
    variant: ProductVariant
    quantity: number
}

type CartContextType = {
    cart: CartItem[]
    addToCart: (product: Product, variant: ProductVariant) => void
    removeFromCart: (productId: string, variantId: string) => void
    clearCart: () => void
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

    const addToCart = (product: Product, variant: ProductVariant) => {
        if (!variant) {
            alert('Please select a color/variant before adding to cart.')
            return
        }
        setCart((prev) => {
            const existing = prev.find((item) => item.product.id === product.id && item.variant.id === variant.id)
            if (existing) {
                return prev.map((item) =>
                    item.product.id === product.id && item.variant.id === variant.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prev, { product, variant, quantity: 1 }]
        })
    }

    const removeFromCart = (productId: string, variantId: string) => {
        setCart((prev) => prev.filter((item) => !(item.product.id === productId && item.variant.id === variantId)))
    }

    const clearCart = () => setCart([])

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => {
    const context = useContext(CartContext)
    if (!context) throw new Error('useCart must be used within a CartProvider')
    return context
}
