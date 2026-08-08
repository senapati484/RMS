'use client'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/context'

export default function CartHeaderIcon() {
  const { cartCount } = useCart()

  return (
    <Link
      href="/cart"
      aria-label="View Shopping Cart"
      className="relative p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer flex items-center justify-center"
    >
      <ShoppingCart size={20} />
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-[#F26522] text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#111111] animate-in zoom-in-75 shadow-md">
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      )}
    </Link>
  )
}
