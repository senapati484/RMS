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
  LogOut,
  ChevronRight,
  Menu,
} from 'lucide-react'
import { NotificationBell } from '@/components'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'STAFF', 'PORTAL_USER'] },
  { href: '/dashboard/products', label: 'Products', icon: Package, roles: ['ADMIN', 'STAFF', 'PORTAL_USER'] },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart, roles: ['ADMIN', 'STAFF', 'PORTAL_USER'] },
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
        <div className="w-8 h-8 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
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

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-[#111] border-r border-white/5 w-64">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <img src="/logo.png" alt="" className="w-9 h-9 object-contain p-0.5 bg-white/10 ring-1 ring-white/10 rounded-xl shrink-0 shadow-md" />
          <div>
            <div className="text-white font-semibold text-sm">Lease360</div>
            <div className="text-brand-orange text-[10px] font-semibold uppercase tracking-wider">
              {user.role.replace('_', ' ')}
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleNav.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-[background,color,border-color,transform] ${
                active
                  ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20 font-semibold'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={16} />
              {item.label}
              {active && <ChevronRight size={12} className="ml-auto" />}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-brand-orange/20 rounded-full flex items-center justify-center">
            <span className="text-brand-orange text-xs font-bold">{user.name[0].toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user.name}</div>
            <div className="text-white/30 text-xs truncate">{user.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-[background,color,border-color,transform] text-sm"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col lg:flex-row pb-20 lg:pb-0">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex fixed inset-y-0 left-0 z-30">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 h-16 flex items-center gap-4">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-white/40 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <img src="/logo.png" alt="" className="w-8 h-8 object-contain p-0.5 bg-white/10 ring-1 ring-white/10 rounded-xl shrink-0 shadow-sm" />
            <span className="text-white font-bold text-sm tracking-tight">Lease360</span>
          </div>
          <div className="flex-1" />
          <NotificationBell />
          <div className="w-8 h-8 bg-brand-orange/20 rounded-full flex items-center justify-center">
            <span className="text-brand-orange text-xs font-bold">{user.name[0].toUpperCase()}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">{children}</main>

        {/* Mobile PWA Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#111111]/90 backdrop-blur-xl border-t border-white/10 px-3 py-2 safe-area-bottom flex items-center justify-around shadow-2xl">
          {mobileNavItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-[color,background,transform] active:scale-[0.96] ${
                  active ? 'text-brand-orange font-semibold' : 'text-white/40 hover:text-white/70'
                }`}
              >
                <item.icon size={18} className={active ? 'text-brand-orange scale-110 transition-transform will-change-transform' : ''} />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
