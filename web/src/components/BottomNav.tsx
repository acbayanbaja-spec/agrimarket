import { Link, useLocation } from 'react-router-dom'
import { Home, Store, ShoppingCart, ClipboardList, User } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const BottomNav = () => {
  const { pathname } = useLocation()
  const { count } = useCart()
  const { isAuthenticated } = useAuth()

  const items = [
    { to: '/', label: 'Home', icon: Home, match: (path: string) => path === '/' },
    { to: '/marketplace', label: 'Shop', icon: Store, match: (path: string) => path.startsWith('/marketplace') || path.startsWith('/products') },
    { to: '/cart', label: 'Cart', icon: ShoppingCart, match: (path: string) => path === '/cart' },
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
