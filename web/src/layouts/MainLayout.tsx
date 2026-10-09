import { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { ShoppingCart, User, Menu, Leaf, X, LayoutDashboard, Bike, LineChart, MessageSquare, Coins, Smartphone, Ticket, Sparkles, Download } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useStore } from '../context/StoreContext'
import NotificationBell from '../components/NotificationBell'
import SearchBar from '../components/SearchBar'
import InstallBanner from '../components/InstallBanner'
import ShopNowLink from '../components/ShopNowLink'
import BottomNav from '../components/BottomNav'
import DownloadAppModal from '../components/DownloadAppModal'
import VoucherCenterModal from '../components/VoucherCenterModal'
import DailyCoinsCheckIn from '../components/DailyCoinsCheckIn'
import FloatingQuickActions from '../components/FloatingQuickActions'
import AgriAiAssistant from '../components/AgriAiAssistant'

const MainLayout = () => {
  const { isAuthenticated, user, logout, hasRole } = useAuth()
  const { count } = useCart()
  const { loyaltyPoints } = useStore()
  const [open, setOpen] = useState(false)
  const [isDownloadOpen, setIsDownloadOpen] = useState(false)
  const [isVoucherOpen, setIsVoucherOpen] = useState(false)
  const [isCoinsOpen, setIsCoinsOpen] = useState(false)

  const dashboardLink = hasRole('admin')
    ? '/admin-dashboard'
    : hasRole('seller')
      ? '/seller-dashboard'
      : hasRole('delivery')
        ? '/delivery'
        : '/orders'

  const isAdminOrDelivery = hasRole('admin') || hasRole('delivery')

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <InstallBanner />
      <header className="bg-white/85 backdrop-blur-xl border-b border-gray-200/80 sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 group">
              <span className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary-700 to-primary-500 text-white grid place-items-center shadow-glow group-hover:scale-105 transition-transform">
                <Leaf className="h-5 w-5" />
              </span>
              <span className="text-xl font-display font-bold text-gray-900 tracking-tight">AgriMarket</span>
              <span className="hidden xl:inline text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                Region XII
              </span>
            </Link>

            <div className="hidden md:flex flex-1 max-w-lg mx-6">
              <SearchBar />
            </div>

            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <ShopNowLink className="btn-ghost">Shop</ShopNowLink>
              <Link to="/feed" className="btn-ghost">Feed</Link>

              {/* Trade is hidden from admin and delivery users per instructions */}
              {!isAdminOrDelivery && (
                <Link to="/trades" className="btn-ghost">Trade</Link>
              )}

              {/* Shopee Style Vouchers Wallet Button */}
              <button
                type="button"
                onClick={() => setIsVoucherOpen(true)}
                className="btn-ghost text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-semibold inline-flex items-center gap-1.5"
                title="Vouchers Wallet"
              >
                <Ticket className="h-4 w-4" />
                <span>Vouchers</span>
              </button>

              {/* Shopee Style Daily Coins Check-In Button */}
              <button
                type="button"
                onClick={() => setIsCoinsOpen(true)}
                className="btn-ghost text-amber-700 hover:text-amber-800 hover:bg-amber-50 font-bold inline-flex items-center gap-1.5"
                title="Daily Coins Check-In"
              >
                <Coins className="h-4 w-4 text-amber-500" />
                <span>{loyaltyPoints}</span>
              </button>

              {/* Prominent Download Mobile App Button */}
              <button
                type="button"
                onClick={() => setIsDownloadOpen(true)}
                className="btn-ghost text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 font-bold inline-flex items-center gap-1.5 border border-emerald-200/80 rounded-xl px-2.5 py-1.5"
              >
                <Smartphone className="h-4 w-4 text-emerald-600 animate-pulse" />
                <span>App</span>
                <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-1 rounded">SYNC</span>
              </button>

              {!hasRole('admin') && (
                <Link to="/cart" className="relative btn-ghost" title="Cart">
                  <ShoppingCart className="h-5 w-5" />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[11px] rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center animate-pop font-bold">
                      {count}
                    </span>
                  )}
                </Link>
              )}

              <NotificationBell />

              {isAuthenticated ? (
                <>
                  {hasRole('delivery') && (
                    <Link to="/delivery" className="btn-ghost text-primary-700" title="Delivery Desk"><Bike className="h-5 w-5" /></Link>
                  )}
                  {(hasRole('admin') || hasRole('seller')) && (
                    <Link to="/analytics" className="btn-ghost" title="Analytics"><LineChart className="h-5 w-5" /></Link>
                  )}
                  <Link to="/messages" className="btn-ghost" title="Messages"><MessageSquare className="h-5 w-5" /></Link>
                  <Link to={dashboardLink} className="btn-ghost" title="Dashboard">
                    <LayoutDashboard className="h-5 w-5" />
                  </Link>
                  <Link to="/profile" className="btn-ghost">
                    <User className="h-5 w-5" />
                    <span className="hidden lg:inline">{user?.firstName}</span>
                  </Link>
                  <button type="button" className="btn-outline py-1.5 px-3 text-xs" onClick={logout}>
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost">Log in</Link>
                  <Link to="/register" className="btn-primary py-1.5 px-3.5 text-xs">Sign up</Link>
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
        <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-white p-6 space-y-3.5 overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="font-display font-bold text-lg">Menu</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
                <X />
              </button>
            </div>
            <SearchBar compact onSubmitted={() => setOpen(false)} />

            {/* Mobile App Download Card */}
            <div
              onClick={() => { setOpen(false); setIsDownloadOpen(true) }}
              className="bg-gradient-to-r from-emerald-600 to-primary-700 text-white p-3.5 rounded-2xl cursor-pointer shadow-md flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className="h-5 w-5" />
                <div>
                  <div className="font-bold text-xs">Download Mobile App</div>
                  <div className="text-[10px] text-emerald-100">Full standalone app & live sync</div>
                </div>
              </div>
              <Download className="h-4 w-4" />
            </div>

            <ShopNowLink className="block py-2 font-medium">Shop Harvests</ShopNowLink>
            <Link to="/feed" onClick={() => setOpen(false)} className="block py-2 font-medium">Seller feed</Link>

            {/* Trade hidden in mobile menu for admin and delivery */}
            {!isAdminOrDelivery && (
              <Link to="/trades" onClick={() => setOpen(false)} className="block py-2 font-medium">Trade board</Link>
            )}

            <button
              type="button"
              onClick={() => { setOpen(false); setIsVoucherOpen(true) }}
              className="w-full text-left py-2 font-medium text-orange-600 flex items-center justify-between"
            >
              <span>Vouchers Wallet</span>
              <Ticket className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => { setOpen(false); setIsCoinsOpen(true) }}
              className="w-full text-left py-2 font-medium text-amber-700 flex items-center justify-between"
            >
              <span>Daily Coins Check-In</span>
              <span className="font-bold bg-amber-100 px-2 py-0.5 rounded-full text-xs">{loyaltyPoints} pts</span>
            </button>

            <Link to="/prices" onClick={() => setOpen(false)} className="block py-2 font-medium">Price monitor</Link>
            {!hasRole('admin') && (
              <Link to="/cart" onClick={() => setOpen(false)} className="block py-2 font-medium">Cart ({count})</Link>
            )}

            <div className="pt-3 border-t border-gray-100 space-y-2">
              {isAuthenticated ? (
                <>
                  <Link to="/orders" onClick={() => setOpen(false)} className="block py-1.5 font-medium">My Orders</Link>
                  <Link to="/messages" onClick={() => setOpen(false)} className="block py-1.5 font-medium">Messages</Link>
                  <Link to="/profile" onClick={() => setOpen(false)} className="block py-1.5 font-medium">Profile</Link>
                  <Link to={dashboardLink} onClick={() => setOpen(false)} className="block py-1.5 font-bold text-primary-700">Dashboard</Link>
                  <button type="button" className="btn-outline w-full mt-3" onClick={() => { logout(); setOpen(false) }}>Log out</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="block py-1.5 font-medium">Log in</Link>
                  <Link to="/register" onClick={() => setOpen(false)} className="btn-primary w-full text-center">Sign up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>
      <BottomNav />
      <FloatingQuickActions />
      <AgriAiAssistant />

      {/* Modals */}
      <DownloadAppModal isOpen={isDownloadOpen} onClose={() => setIsDownloadOpen(false)} />
      <VoucherCenterModal isOpen={isVoucherOpen} onClose={() => setIsVoucherOpen(false)} />
      <DailyCoinsCheckIn isOpen={isCoinsOpen} onClose={() => setIsCoinsOpen(false)} />

      <footer className="bg-soil-900 text-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Leaf className="h-6 w-6 text-primary-400" />
                <span className="text-lg font-display font-bold">AgriMarket</span>
              </div>
      <p className="text-gray-400 text-sm leading-relaxed">
                A trusted agricultural marketplace connecting SOCCSKSARGEN farmers with households, grocers, and restaurants.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Marketplace</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><ShopNowLink className="hover:text-white">Browse products</ShopNowLink></li>
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
