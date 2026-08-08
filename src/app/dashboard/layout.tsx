'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Wrench,
  Bot,
  Users,
  UserCheck,
  Settings,
  BarChart3,
  Calendar,
  CreditCard,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'
import { NotificationBell } from '@/components'
import SubscriptionBanner from '@/components/SubscriptionBanner'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'STAFF', 'PORTAL_USER'] },
  { href: '/dashboard/products', label: 'Products', icon: Package, roles: ['ADMIN', 'STAFF', 'PORTAL_USER'] },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart, roles: ['ADMIN', 'STAFF', 'PORTAL_USER'] },
  { href: '/dashboard/schedule', label: 'Rental Schedule', icon: Calendar, roles: ['ADMIN', 'STAFF', 'PORTAL_USER'] },
  { href: '/dashboard/quotations', label: 'Quotations', icon: FileText, roles: ['ADMIN', 'STAFF', 'PORTAL_USER'] },
  { href: '/dashboard/reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['ADMIN', 'STAFF'] },
  { href: '/dashboard/settings', label: 'Configuration & Settings', icon: Settings, roles: ['ADMIN', 'STAFF', 'PORTAL_USER'] },
  { href: '/dashboard/maintenance', label: 'Maintenance', icon: Wrench, roles: ['ADMIN', 'STAFF'] },
  { href: '/dashboard/ai', label: 'AI Assistant', icon: Bot, roles: ['ADMIN', 'STAFF'] },
  { href: '/dashboard/users', label: 'Users & eKYC', icon: Users, roles: ['ADMIN', 'STAFF'] },
  { href: '/dashboard/billing', label: 'Billing & Plans', icon: CreditCard, roles: ['ADMIN', 'STAFF', 'PORTAL_USER'] },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
      return
    }
    // Role-based route guard: redirect to the dashboard home when the user
    // tries to open a section outside their role.
    if (user) {
      const blocked = navItems.find(
        (item) => pathname.startsWith(item.href) && !item.roles.includes(user.role)
      )
      if (blocked && pathname !== '/dashboard') {
        router.replace('/dashboard')
      }
    }
  }, [user, loading, router, pathname])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F26522]/30 border-t-[#F26522] rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const visibleNav = navItems.filter((item) => item.roles.includes(user.role))
  const mobileNavItems = visibleNav.slice(0, 5) // Top 5 items for mobile bottom bar

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const sidebarContent = (
    <aside className="flex flex-col h-full bg-[#111111] border-r border-white/10 w-64 select-none">
      {/* Logo & Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Lease360 Logo"
            className="w-9 h-9 object-contain p-0.5 bg-white/10 ring-1 ring-white/20 rounded-xl shrink-0 shadow-md"
          />
          <div>
            <div className="text-white font-bold text-base tracking-tight">Lease360</div>
            <div className="text-[#F26522] text-[10px] font-bold uppercase tracking-wider">
              {user.role.replace('_', ' ')}
            </div>
          </div>
        </Link>
        {sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/40 hover:text-white p-1"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto scrollbar-none">
        {visibleNav.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                active
                  ? 'bg-[#F26522] text-white shadow-lg shadow-[#F26522]/20 font-bold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={17} className={active ? 'text-white' : 'text-white/50'} />
              <span>{item.label}</span>
              {active && <ChevronRight size={14} className="ml-auto text-white/80" />}
            </Link>
          )
        })}
      </nav>
    </aside>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col lg:flex-row pb-20 lg:pb-0">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>

      {/* Main content area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Header bar */}
        <header className="sticky top-0 z-20 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 h-16 flex items-center gap-4">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-white/60 hover:text-white transition-colors cursor-pointer p-1"
          >
            <Menu size={22} />
          </button>

          <div className="flex items-center gap-2 lg:hidden">
            <img
              src="/logo.png"
              alt="Lease360"
              className="w-7 h-7 object-contain p-0.5 bg-white/10 ring-1 ring-white/10 rounded-lg shrink-0 shadow-sm"
            />
            <span className="text-white font-bold text-sm tracking-tight">Lease360</span>
          </div>

          <div className="flex-1" />
          <NotificationBell />

          {/* Top Right Header Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/5 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 bg-[#F26522]/20 border border-[#F26522]/40 rounded-full flex items-center justify-center text-[#F26522] font-bold text-xs shadow-md">
                {(user.name?.[0] || 'U').toUpperCase()}
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[#151515] border border-white/10 rounded-2xl shadow-2xl p-2 space-y-1 z-50 text-xs font-semibold">
                <div className="px-3 py-2 border-b border-white/10 mb-1">
                  <div className="text-white font-bold">{user.name}</div>
                  <div className="text-white/40 text-[10px] font-mono">{user.email}</div>
                  <span className="inline-block mt-1 text-[9px] bg-[#F26522]/20 text-[#F26522] border border-[#F26522]/30 px-2 py-0.5 rounded-full font-bold uppercase">
                    {user.role === 'ADMIN' ? 'Admin / Vendor' : user.role === 'STAFF' ? 'Staff' : 'Customer Account'}
                  </span>
                </div>
                <Link href="/dashboard/profile" className="block px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5">
                  My Profile
                </Link>
                <Link href="/dashboard/orders" className="block px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5">
                  My Orders
                </Link>
                <Link href="/dashboard/settings" className="block px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5">
                  Warehouse & Settings
                </Link>
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer">
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page children content */}
        <SubscriptionBanner />
        <main className="flex-1 p-4 sm:p-6">{children}</main>

        {/* Mobile PWA Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#111111]/95 backdrop-blur-xl border-t border-white/10 px-3 py-2 safe-area-bottom flex items-center justify-around shadow-2xl">
          {mobileNavItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                  active ? 'text-[#F26522] font-bold' : 'text-white/40 hover:text-white/70'
                }`}
              >
                <item.icon size={18} className={active ? 'text-[#F26522] scale-110' : ''} />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
