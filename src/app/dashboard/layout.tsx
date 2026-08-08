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
  LogOut,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'
import { NotificationBell } from '@/components'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'STAFF', 'PORTAL_USER'] },
  { href: '/dashboard/products', label: 'Products', icon: Package, roles: ['ADMIN', 'STAFF', 'PORTAL_USER'] },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart, roles: ['ADMIN', 'STAFF', 'PORTAL_USER'] },
  { href: '/dashboard/schedule', label: 'Rental Schedule', icon: Calendar, roles: ['ADMIN', 'STAFF', 'PORTAL_USER'] },
  { href: '/dashboard/quotations', label: 'Quotations', icon: FileText, roles: ['ADMIN', 'STAFF', 'PORTAL_USER'] },
  { href: '/dashboard/reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['ADMIN', 'STAFF'] },
  { href: '/dashboard/profile', label: 'Profile & eKYC', icon: UserCheck, roles: ['ADMIN', 'STAFF', 'PORTAL_USER'] },
  { href: '/dashboard/settings', label: 'Configuration & Settings', icon: Settings, roles: ['ADMIN', 'STAFF', 'PORTAL_USER'] },
  { href: '/dashboard/maintenance', label: 'Maintenance', icon: Wrench, roles: ['ADMIN', 'STAFF'] },
  { href: '/dashboard/ai', label: 'AI Assistant', icon: Bot, roles: ['ADMIN', 'STAFF'] },
  { href: '/dashboard/users', label: 'Users & eKYC', icon: Users, roles: ['ADMIN', 'STAFF'] },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

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

      {/* User Footer Account Box */}
      <div className="p-4 border-t border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-[#F26522]/20 border border-[#F26522]/30 rounded-full flex items-center justify-center">
            <span className="text-[#F26522] text-xs font-bold">{user.name[0].toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-bold truncate">{user.name}</div>
            <div className="text-white/40 text-[11px] truncate">{user.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs font-medium cursor-pointer"
        >
          <LogOut size={14} />
          <span>Sign out</span>
        </button>
      </div>
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

          <div className="w-8 h-8 bg-[#F26522]/20 border border-[#F26522]/30 rounded-full flex items-center justify-center">
            <span className="text-[#F26522] text-xs font-bold">{user.name[0].toUpperCase()}</span>
          </div>
        </header>

        {/* Page children content */}
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
