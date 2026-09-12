import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'

const NotificationBell = () => {
  const { isAuthenticated, user } = useAuth()
  const { notifications, unreadCount, markNotificationsRead, markNotificationRead } = useStore()
  const [open, setOpen] = useState(false)

  if (!isAuthenticated) return null

  return (
    <div className="relative">
      <button
        type="button"
        className="relative btn-ghost"
        aria-label="Notifications"
        onClick={() => {
          setOpen((value) => !value)
          if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => undefined)
          }
        }}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-secondary-500 text-soil-900 text-[11px] rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center animate-pulse-soft">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <p className="font-semibold">Notifications</p>
            <button type="button" className="text-xs text-primary-700 font-semibold" onClick={markNotificationsRead}>
              Mark read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">You’re all caught up.</p>
            ) : (
              notifications.slice(0, 10).map((item) => (
                <Link
                  key={item.id}
                  to={item.href || '/'}
                  onClick={() => {
                    markNotificationRead(item.id)
                    setOpen(false)
                  }}
                  className={`block px-4 py-3 text-sm hover:bg-primary-50 ${item.readBy.includes(user?.id || -1) ? 'text-gray-600' : 'bg-primary-50/50'}`}
                >
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-gray-600 mt-0.5">{item.message}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
