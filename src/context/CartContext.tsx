'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import { calculateRentalDays, calculateItemRentalPrice } from '@/lib/rental-pricing'

export interface CartItem {
  productId: string
  productName: string
  productImage?: string
  dailyRate: number
  quantity: number
  rentalStart: string
  rentalEnd: string
  selectedVariants?: Record<string, string>
  lineId?: string
  productType?: string
  category?: string
  driverOption?: 'SELF_DRIVE' | 'CHAUFFEUR'
  drivingLicenseNo?: string
}

interface CartContextType {
  cartItems: CartItem[]
  cartCount: number
  cartTotal: number
  addToCart: (item: CartItem) => void
  removeFromCart: (lineIdOrProductId: string) => void
  updateQuantity: (lineIdOrProductId: string, quantity: number) => void
  updateItemDates: (lineIdOrProductId: string, rentalStart: string, rentalEnd: string) => void
  updateGlobalDates: (rentalStart: string, rentalEnd: string) => void
  clearCart: () => void
}

function makeLineId(item: CartItem): string {
  return [
    item.productId,
    item.rentalStart,
    item.rentalEnd,
    JSON.stringify(item.selectedVariants || {}),
  ].join('|')
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
      const lineId = newItem.lineId || makeLineId(newItem)
      const idx = prev.findIndex(i => (i.lineId || makeLineId(i)) === lineId)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx].quantity += newItem.quantity
        return updated
      }
      return [...prev, { ...newItem, lineId }]
    })
  }

  const removeFromCart = (targetId: string) => {
    setCartItems(prev => prev.filter(i => (i.lineId || makeLineId(i)) !== targetId && i.productId !== targetId))
  }

  const updateQuantity = (targetId: string, quantity: number) => {
    setCartItems(prev =>
      prev.map(i => ((i.lineId || makeLineId(i)) === targetId || i.productId === targetId) ? { ...i, quantity } : i)
    )
  }

  const updateItemDates = (targetId: string, rentalStart: string, rentalEnd: string) => {
    setCartItems(prev =>
      prev.map(i => ((i.lineId || makeLineId(i)) === targetId || i.productId === targetId) ? { ...i, rentalStart, rentalEnd } : i)
    )
  }

  const updateGlobalDates = (rentalStart: string, rentalEnd: string) => {
    setCartItems(prev => prev.map(i => ({ ...i, rentalStart, rentalEnd })))
  }

  const clearCart = () => setCartItems([])

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)
  // Applies the same duration-tier pricing engine the server uses, so what the
  // cart displays is exactly what the order will be charged.
  const cartTotal = cartItems.reduce((sum, i) => {
    const pricing = calculateItemRentalPrice(
      i.dailyRate,
      calculateRentalDays(i.rentalStart, i.rentalEnd),
      i.quantity
    )
    return sum + pricing.lineSubtotal
  }, 0)

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateItemDates,
        updateGlobalDates,
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
      updateItemDates: () => {},
      updateGlobalDates: () => {},
      clearCart: () => {},
    }
  }
  return ctx
}

