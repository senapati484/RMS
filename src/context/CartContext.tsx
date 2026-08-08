'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'

export interface CartItem {
  productId: string
  productName: string
  productImage?: string
  dailyRate: number
  quantity: number
  rentalStart: string
  rentalEnd: string
  selectedVariants?: Record<string, string>
}

interface CartContextType {
  cartItems: CartItem[]
  cartCount: number
  cartTotal: number
  addToCart: (item: CartItem) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lease360_cart')
      if (saved) setCartItems(JSON.parse(saved))
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('lease360_cart', JSON.stringify(cartItems))
    } catch {
      // ignore
    }
  }, [cartItems])

  const addToCart = (newItem: CartItem) => {
    setCartItems(prev => {
      const idx = prev.findIndex(i => i.productId === newItem.productId)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx].quantity += newItem.quantity
        return updated
      }
      return [...prev, newItem]
    })
  }

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(i => i.productId !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    setCartItems(prev =>
      prev.map(i => (i.productId === productId ? { ...i, quantity } : i))
    )
  }

  const clearCart = () => setCartItems([])

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)
  const cartTotal = cartItems.reduce((sum, i) => sum + i.dailyRate * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    // Fallback for SSR or un-wrapped components
    return {
      cartItems: [],
      cartCount: 0,
      cartTotal: 0,
      addToCart: () => {},
      removeFromCart: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
    }
  }
  return ctx
}
