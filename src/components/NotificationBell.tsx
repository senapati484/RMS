'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Bell } from 'lucide-react'
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
      //
    }
  }

  useEffect(() => {
    if (user) {
      fetchNotifs()
      const interval = setInterval(fetchNotifs, 30000) // poll every 30s
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
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
      >
        <Bell size={18} className="text-white/60" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#F26522] rounded-full text-white text-[9px] flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-80 liquid-glass border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <span className="text-white font-semibold text-sm">Notifications</span>
              <button onClick={markAllRead} className="text-white/40 text-xs hover:text-[#F26522] transition-colors">
                Mark all read
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="p-6 text-center text-white/30 text-sm">No notifications yet</div>
              ) : (
                notifs.slice(0, 10).map((n) => (
                  <Link
                    key={n._id}
                    href={n.linkHref || '#'}
                    onClick={() => setOpen(false)}
                    className={`block p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${
                      !n.isRead ? 'bg-[#F26522]/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {!n.isRead && (
                        <div className="w-1.5 h-1.5 bg-[#F26522] rounded-full mt-1.5 flex-shrink-0" />
                      )}
                      <div className={!n.isRead ? '' : 'ml-4'}>
                        <div className="text-white text-xs font-medium">{n.title}</div>
                        <div className="text-white/40 text-xs mt-0.5 line-clamp-2">{n.message}</div>
                        <div className="text-white/20 text-[10px] mt-1">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
