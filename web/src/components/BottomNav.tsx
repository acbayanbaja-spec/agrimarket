import { Link, useLocation } from 'react-router-dom'
import { Home, Store, ShoppingCart, ClipboardList, User, LayoutDashboard, Bike, MessageSquare } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

import { scrollToTopNow } from './ScrollToTop'

const BottomNav = () => {
  const { pathname } = useLocation()
  const { count } = useCart()
  const { isAuthenticated, hasRole } = useAuth()
  const isAdmin = hasRole('admin')
  const isDelivery = hasRole('delivery')

  const handleNavClick = (to: string) => {
    scrollToTopNow()
    if (pathname === to) {
      window.scrollTo(0, 0)
      if (document.documentElement) document.documentElement.scrollTop = 0
      if (document.body) document.body.scrollTop = 0
    }
  }

  const items = isDelivery
    ? [
        { to: '/', label: 'Home', icon: Home, match: (path: string) => path === '/' },
        { to: '/feed', label: 'Feed', icon: Store, match: (path: string) => path.startsWith('/feed') },
        { to: '/delivery', label: 'Deliveries', icon: Bike, match: (path: string) => path.startsWith('/delivery') },
        { to: '/rider-dashboard', label: 'Dashboard', icon: LayoutDashboard, match: (path: string) => path.startsWith('/rider-dashboard') },
        { to: isAuthenticated ? '/profile' : '/login', label: 'Me', icon: User, match: (path: string) => path.startsWith('/profile') || path.startsWith('/login') },
      ]
    : [
        { to: '/', label: 'Home', icon: Home, match: (path: string) => path === '/' },
        { to: isAuthenticated ? '/marketplace' : '/login', label: 'Shop', icon: Store, match: (path: string) => path.startsWith('/marketplace') || path.startsWith('/products') },
        isAdmin
          ? { to: '/admin-dashboard', label: 'Admin', icon: LayoutDashboard, match: (path: string) => path.startsWith('/admin-dashboard') }
          : { to: '/cart', label: 'Cart', icon: ShoppingCart, match: (path: string) => path === '/cart' },
        { to: '/orders', label: 'Orders', icon: ClipboardList, match: (path: string) => path.startsWith('/orders') },
        { to: isAuthenticated ? '/profile' : '/login', label: 'Me', icon: User, match: (path: string) => path.startsWith('/profile') || path.startsWith('/login') },
      ]

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const active = item.match(pathname)
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => handleNavClick(item.to)}
              className={`relative flex flex-col items-center py-2 text-[11px] font-semibold ${active ? 'text-primary-700' : 'text-gray-500'}`}
            >
              <Icon className={`h-5 w-5 mb-0.5 ${active ? 'animate-pop' : ''}`} />
              {item.label === 'Cart' && count > 0 && (
                <span className="absolute top-1 right-[22%] min-w-[16px] h-4 px-1 rounded-full bg-primary-600 text-white text-[10px] leading-4 text-center animate-pop">
                  {count}
                </span>
              )}
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
