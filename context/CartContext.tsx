import { createContext, useContext, useState, ReactNode } from 'react'
import { Product } from '@/types'
import { useEffect } from 'react'

export type CartItem = Product & {
    quantity: number
}

type CartContextType = {
    cart: CartItem[]
    addToCart: (product: Product) => void
    removeFromCart: (id: string) => void
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

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.id === product.id)
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                )
            }
            return [...prev, { ...product, quantity: 1 }]
        })
    }

    const removeFromCart = (id: string) => {
        setCart((prev) => prev.filter((item) => item.id !== id))
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
