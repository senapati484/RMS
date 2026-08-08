'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Bell, ShoppingCart, FileText, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import Link from 'next/link'

interface Notif {
  _id: string
  title: string
  message: string
  isRead: boolean
  type: string
  linkHref?: string
  createdAt: string
}

function getNotifIcon(type: string) {
  switch (type) {
    case 'ORDER_CONFIRMED':
    case 'ORDER_STATUS':
      return <ShoppingCart size={14} className="text-[#F26522]" />
    case 'QUOTATION_READY':
    case 'QUOTATION_ACCEPTED':
      return <FileText size={14} className="text-purple-400" />
    case 'OVERDUE_ALERT':
    case 'MAINTENANCE_REQUIRED':
      return <AlertTriangle size={14} className="text-red-400" />
    case 'RETURN_COMPLETED':
      return <CheckCircle2 size={14} className="text-green-400" />
    default:
      return <Info size={14} className="text-blue-400" />
  }
}

export default function NotificationBell() {
  const { user } = useAuth()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)

  const fetchNotifs = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifs(data.notifications || [])
        setUnread(data.unreadCount || 0)
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (user) {
      fetchNotifs()
      const interval = setInterval(fetchNotifs, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' })
    setUnread(0)
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open && unread > 0) markAllRead() }}
        aria-label="Notifications"
        className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all active:scale-95 cursor-pointer"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F26522] rounded-full text-white text-[10px] flex items-center justify-center font-bold shadow-md shadow-[#F26522]/40 animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop to dismiss popover when clicking outside */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Solid popover container */}
          <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-[#121212] border border-white/15 rounded-2xl shadow-2xl shadow-black/90 overflow-hidden fade-in-up">
            <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm">Notifications</span>
                {unread > 0 && (
                  <span className="text-[10px] bg-[#F26522]/20 text-[#F26522] px-2 py-0.5 rounded-full font-semibold border border-[#F26522]/30">
                    {unread} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[#F26522] hover:underline text-xs font-medium cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/40 hover:text-white transition-colors cursor-pointer p-0.5"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
              {notifs.length === 0 ? (
                <div className="p-8 text-center text-white/30 text-xs">
                  <Bell size={24} className="mx-auto mb-2 opacity-30" />
                  No notifications right now
                </div>
              ) : (
                notifs.slice(0, 10).map((n) => (
                  <Link
                    key={n._id}
                    href={n.linkHref || '#'}
                    onClick={() => setOpen(false)}
                    className={`block p-3.5 hover:bg-white/5 transition-colors ${
                      !n.isRead ? 'bg-[#F26522]/10 border-l-2 border-l-[#F26522]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {getNotifIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-semibold truncate ${!n.isRead ? 'text-white' : 'text-white/80'}`}>
                            {n.title}
                          </span>
                          <span className="text-white/30 text-[10px] shrink-0">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-white/50 text-xs mt-0.5 line-clamp-2 leading-snug">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {notifs.length > 0 && (
              <div className="px-4 py-2.5 bg-white/5 border-t border-white/10 text-center">
                <span className="text-[11px] text-white/40">Showing latest updates</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

