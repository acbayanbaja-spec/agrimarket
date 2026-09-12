import { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { ShoppingCart, User, Menu, Leaf, X, LayoutDashboard, Bike, LineChart, MessageSquare, Coins, Smartphone } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useStore } from '../context/StoreContext'
import NotificationBell from '../components/NotificationBell'
import SearchBar from '../components/SearchBar'
import InstallBanner from '../components/InstallBanner'
import BottomNav from '../components/BottomNav'

const MainLayout = () => {
  const { isAuthenticated, user, logout, hasRole } = useAuth()
  const { count } = useCart()
  const { loyaltyPoints } = useStore()
  const [open, setOpen] = useState(false)

  const dashboardLink = hasRole('admin')
    ? '/admin-dashboard'
    : hasRole('seller')
      ? '/seller-dashboard'
      : hasRole('delivery')
        ? '/delivery'
        : '/orders'

  return (
    <div className="min-h-screen flex flex-col">
      <InstallBanner />
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/70 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <span className="h-9 w-9 rounded-xl bg-primary-600 text-white grid place-items-center shadow-glow">
                <Leaf className="h-5 w-5" />
              </span>
              <span className="text-xl font-display font-bold text-gray-900">AgriMarket</span>
            </Link>

            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <SearchBar />
            </div>

            <nav className="hidden md:flex items-center gap-1">
              <Link to="/marketplace" className="btn-ghost">Shop</Link>
              <Link to="/feed" className="btn-ghost">Feed</Link>
              <Link to="/trades" className="btn-ghost">Trade</Link>
              <Link to="/cart" className="relative btn-ghost">
                <ShoppingCart className="h-5 w-5" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[11px] rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center animate-pop">
                    {count}
                  </span>
                )}
              </Link>
              {isAuthenticated && (
                <Link to="/profile" className="btn-ghost text-amber-800" title="Harvest points">
                  <Coins className="h-5 w-5" />
                  <span className="hidden lg:inline">{loyaltyPoints}</span>
                </Link>
              )}
              <NotificationBell />
              {isAuthenticated ? (
                <>
                  {hasRole('delivery') && (
                    <Link to="/delivery" className="btn-ghost" title="Deliveries"><Bike className="h-5 w-5" /></Link>
                  )}
                  {(hasRole('admin') || hasRole('seller')) && (
                    <Link to="/analytics" className="btn-ghost" title="Analytics"><LineChart className="h-5 w-5" /></Link>
                  )}
                  <Link to="/messages" className="btn-ghost" title="Messages"><MessageSquare className="h-5 w-5" /></Link>
                  <Link to={dashboardLink} className="btn-ghost">
                    <LayoutDashboard className="h-5 w-5" />
                  </Link>
                  <Link to="/profile" className="btn-ghost">
                    <User className="h-5 w-5" />
                    <span className="hidden lg:inline">{user?.firstName}</span>
                  </Link>
                  <button type="button" className="btn-outline py-2" onClick={logout}>
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost">Log in</Link>
                  <Link to="/register" className="btn-primary">Sign up</Link>
                </>
              )}
            </nav>

            <button type="button" className="md:hidden p-2" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-6 w-6 text-gray-700" />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-white p-6 space-y-4" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-lg">Menu</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
                <X />
              </button>
            </div>
            <SearchBar compact onSubmitted={() => setOpen(false)} />
            <Link to="/marketplace" onClick={() => setOpen(false)} className="block py-2">Marketplace</Link>
            <Link to="/feed" onClick={() => setOpen(false)} className="block py-2">Seller feed</Link>
            <Link to="/trades" onClick={() => setOpen(false)} className="block py-2">Trade board</Link>
            <Link to="/prices" onClick={() => setOpen(false)} className="block py-2">Price monitor</Link>
            <Link to="/cart" onClick={() => setOpen(false)} className="block py-2">Cart ({count})</Link>
            <Link to="/get-app" onClick={() => setOpen(false)} className="block py-2">Install on phone</Link>
            {isAuthenticated ? (
              <>
                <Link to="/orders" onClick={() => setOpen(false)} className="block py-2">Orders</Link>
                <Link to="/messages" onClick={() => setOpen(false)} className="block py-2">Messages</Link>
                <Link to="/profile" onClick={() => setOpen(false)} className="block py-2">Profile</Link>
                <Link to={dashboardLink} onClick={() => setOpen(false)} className="block py-2">Dashboard</Link>
                <button type="button" className="btn-outline w-full" onClick={() => { logout(); setOpen(false) }}>Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="block py-2">Log in</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-primary w-full">Sign up</Link>
              </>
            )}
          </div>
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>
      <BottomNav />

      <footer className="bg-soil-900 text-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Leaf className="h-6 w-6 text-primary-400" />
                <span className="text-lg font-display font-bold">AgriMarket</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                A trusted agricultural marketplace connecting Filipino farmers with households, grocers, and restaurants.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Marketplace</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/marketplace" className="hover:text-white">Browse products</Link></li>
                <li><Link to="/categories" className="hover:text-white">Categories</Link></li>
                <li><Link to="/sellers" className="hover:text-white">Sellers</Link></li>
                <li><Link to="/prices" className="hover:text-white">Price monitor</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Community</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/feed" className="hover:text-white">Harvest feed</Link></li>
                <li><Link to="/trades" className="hover:text-white">Trade board</Link></li>
                <li><Link to="/shipping" className="hover:text-white">Shipping coupons</Link></li>
                <li><Link to="/get-app" className="hover:text-white inline-flex items-center gap-1"><Smartphone className="h-3.5 w-3.5" /> Get the app</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-gray-400 text-sm">
            © 2026 AgriMarket. Grown with care.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default MainLayout
