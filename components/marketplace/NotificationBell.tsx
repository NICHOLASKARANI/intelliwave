'use client'

import { useEffect, useState, useRef } from 'react'
import { Bell, X, Loader2, UserPlus, ShoppingCart, MessageSquare, Star, Package, Check } from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  content: string | null
  isRead: boolean
  createdAt: string
}

const TYPE_ICONS: Record<string, any> = {
  new_follower: UserPlus,
  new_order: ShoppingCart,
  new_comment: MessageSquare,
  new_review: Star,
  order_status: Package,
}

const TYPE_COLORS: Record<string, string> = {
  new_follower: 'text-cyan-400 bg-cyan-500/10',
  new_order: 'text-green-400 bg-green-500/10',
  new_comment: 'text-blue-400 bg-blue-500/10',
  new_review: 'text-amber-400 bg-amber-500/10',
  order_status: 'text-purple-400 bg-purple-500/10',
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/marketplace/notifications?limit=20', { cache: 'no-store' })
      if (res.status === 401) {
        // Not logged in â€” hide bell
        return
      }
      if (res.ok) {
        const d = await res.json()
        setNotifications(d.notifications || [])
        setUnreadCount(d.unreadCount || 0)
      }
    } catch {}
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const markAllRead = async () => {
    try {
      await fetch('/api/marketplace/notifications', { method: 'POST' })
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch {}
  }

  const markOneRead = async (id: string) => {
    try {
      await fetch('/api/marketplace/notifications/' + id + '/read', { method: 'POST' })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return mins + 'm'
    const hours = Math.floor(mins / 60)
    if (hours < 24) return hours + 'h'
    const days = Math.floor(hours / 24)
    if (days < 7) return days + 'd'
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }


  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-800">
            <h3 className="font-bold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-neutral-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Bell className="w-10 h-10 mx-auto mb-2 text-neutral-700" />
                <p className="text-sm text-neutral-500">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-800">
                {notifications.map(n => {
                  const Icon = TYPE_ICONS[n.type] || Bell
                  const colorClass = TYPE_COLORS[n.type] || 'text-neutral-400 bg-neutral-800'

                  return (
                    <button
                      key={n.id}
                      onClick={() => markOneRead(n.id)}
                      className={'w-full text-left p-4 hover:bg-neutral-800/50 transition-colors ' + (!n.isRead ? 'bg-cyan-500/5' : '')}
                    >
                      <div className="flex items-start gap-3">
                        <div className={'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ' + colorClass}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className={'text-sm ' + (!n.isRead ? 'font-bold text-white' : 'font-medium text-neutral-300')}>
                              {n.title}
                            </p>
                            <span className="text-xs text-neutral-500 flex-shrink-0">{formatTime(n.createdAt)}</span>
                          </div>
                          {n.content && (
                            <p className="text-xs text-neutral-400 line-clamp-2">{n.content}</p>
                          )}
                          {!n.isRead && (
                            <span className="inline-block w-2 h-2 bg-cyan-500 rounded-full mt-2" />
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}