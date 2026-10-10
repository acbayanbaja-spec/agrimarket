import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Settings,
  ShoppingCart,
  MessageSquare,
  Lock,
  X,
  ChevronRight,
  Wallet,
  Package,
  Truck,
  Star,
  Coins,
  Ticket,
  LogOut,
  Store,
  Bike,
  LayoutDashboard,
  HelpCircle,
  CheckCircle2,
  KeyRound,
  Tag,
  ArrowRight,
  ShieldCheck,
  User,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { useCart } from '../context/CartContext'
import { formatPeso } from '../lib/utils'
import Seo from '../components/Seo'
import { VoucherCenterModal } from '../components/VoucherCenterModal'
import { DailyCoinsCheckIn } from '../components/DailyCoinsCheckIn'

const ProfilePage = () => {
  const { user, updateProfile, hasRole, logout } = useAuth()
  const { myOrders, loyaltyPoints, claimedVouchers, myApplication } = useStore()
  const { count } = useCart()
  const navigate = useNavigate()
  const isAdmin = hasRole('admin')

  // Dismissable Security Banner
  const [showSecurityBanner, setShowSecurityBanner] = useState(true)

  // Interactive Modals State
  const [isVoucherOpen, setIsVoucherOpen] = useState(false)
  const [isCoinsOpen, setIsCoinsOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  // Edit Profile Form State
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  })
  const [editSuccess, setEditSuccess] = useState(false)

  // Password / Security Form State
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirm: '',
    otp: '928410',
  })
  const [passwordSaved, setPasswordSaved] = useState(false)

  // Order status counts for Purchase Pipeline
  const pendingCount = useMemo(() => myOrders.filter((o) => o.status === 'Pending').length, [myOrders])
  const confirmedCount = useMemo(() => myOrders.filter((o) => o.status === 'Confirmed').length, [myOrders])
  const toReceiveCount = useMemo(
    () => myOrders.filter((o) => o.status === 'Shipped' || o.status === 'Out for delivery').length,
    [myOrders]
  )
  const deliveredCount = useMemo(() => myOrders.filter((o) => o.status === 'Delivered').length, [myOrders])

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile({
      firstName: editForm.firstName.trim(),
      lastName: editForm.lastName.trim(),
      phone: editForm.phone.trim() || undefined,
    })
    setEditSuccess(true)
    setTimeout(() => {
      setEditSuccess(false)
      setIsSettingsOpen(false)
    }, 1500)
  }

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordForm.password) return
    setPasswordSaved(true)
    setTimeout(() => {
      setPasswordSaved(false)
      setIsSecurityModalOpen(false)
      setShowSecurityBanner(false)
    }, 1500)
  }

  const displayName = user
    ? user.firstName
      ? `${user.firstName} ${user.lastName}`
      : user.email.split('@')[0]
    : 'AgriMarket Member'

  return (
    <div className="page-shell max-w-5xl mx-auto space-y-6">
      <Seo
        title={isAdmin ? "Admin Profile & Governance" : "My Profile & Purchases"}
        description={isAdmin ? "Platform governance, system moderation tools, and account settings." : "Track harvest orders, loyalty rewards, vouchers, and account settings."}
        path="/profile"
      />

      {/* 1. Header Card - Styled in AgriMarket Emerald Theme */}
      <section className="relative bg-gradient-to-br from-emerald-800 via-primary-700 to-emerald-900 text-white rounded-3xl p-6 sm:p-8 shadow-soft border border-emerald-600/30 overflow-hidden">
        {/* Subtle ambient lighting */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-amber-400/15 blur-2xl pointer-events-none" />

        <div className="relative z-10">
          {/* Top Quick Actions Row */}
          <div className="flex items-center justify-between gap-4 pb-6 border-b border-white/15 mb-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-emerald-100 border border-white/10">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                SOCCSKSARGEN Harvest Network
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10"
                title="Account Settings"
                aria-label="Account Settings"
              >
                <Settings className="h-5 w-5 text-white" />
              </button>

              {!hasRole('admin') && !hasRole('delivery') && (
                <Link
                  to="/cart"
                  className="relative p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10"
                  title="Cart"
                  aria-label="Cart"
                >
                  <ShoppingCart className="h-5 w-5 text-white" />
                  {count > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-soil-900 text-[11px] font-black rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center shadow-md animate-pop">
                      {count}
                    </span>
                  )}
                </Link>
              )}

              <Link
                to="/messages"
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10"
                title="Messages"
                aria-label="Messages"
              >
                <MessageSquare className="h-5 w-5 text-white" />
              </Link>
            </div>
          </div>

          {/* User Profile Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                onClick={() => setIsSettingsOpen(true)}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white text-primary-800 flex items-center justify-center font-bold text-2xl sm:text-3xl shadow-md border-2 border-emerald-300/60 cursor-pointer overflow-hidden shrink-0 hover:scale-105 transition-transform"
                title="Edit Profile"
              >
                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : displayName.charAt(0).toUpperCase()}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{displayName}</h1>
                </div>

                <p className="text-xs sm:text-sm text-emerald-100/90 font-mono">{user?.email}</p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {hasRole('seller') && (
                    <span className="bg-amber-400 text-soil-900 font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                      Verified Seller
                    </span>
                  )}
                  {hasRole('delivery') && (
                    <span className="bg-emerald-300 text-emerald-950 font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                      Dispatch Rider
                    </span>
                  )}
                  {hasRole('admin') && (
                    <span className="bg-rose-500 text-white font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                      Admin
                    </span>
                  )}
                  {!hasRole('seller') && !hasRole('delivery') && !hasRole('admin') && (
                    <span className="bg-white/20 text-white font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                      Harvest Buyer
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick stats on desktop */}
            {!isAdmin ? (
              <div className="flex items-center gap-6 sm:border-l sm:border-white/15 sm:pl-6 text-emerald-100">
                <div className="text-center sm:text-left">
                  <div className="text-2xl font-extrabold text-white">{myOrders.length}</div>
                  <div className="text-xs text-emerald-200">Total Orders</div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-2xl font-extrabold text-amber-300">{loyaltyPoints}</div>
                  <div className="text-xs text-emerald-200">AgriCoins</div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-2xl font-extrabold text-white">{claimedVouchers.length}</div>
                  <div className="text-xs text-emerald-200">Vouchers</div>
                </div>
              </div>
            ) : (
              <div className="sm:border-l sm:border-white/15 sm:pl-6 text-emerald-100">
                <div className="text-xs text-emerald-200 uppercase tracking-wider font-bold">Admin Governance</div>
                <div className="text-base font-extrabold text-white mt-0.5">Platform Operations Hub</div>
                <div className="text-xs text-emerald-200/90 mt-0.5">Management & Moderation Only</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Dismissable Account Security & Password Alert */}
      {showSecurityBanner && (
        <section className="card border-emerald-100 bg-white/95">
          <div className="flex items-start justify-between gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm sm:text-base text-gray-900">Account Password & Security</h3>
                <button
                  type="button"
                  onClick={() => setShowSecurityBanner(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  aria-label="Dismiss security banner"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                Protect your account, orders, and delivery addresses with password verification and two-factor authentication.
              </p>
              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setShowSecurityBanner(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Later
                </button>
                <button
                  type="button"
                  onClick={() => setIsSecurityModalOpen(true)}
                  className="btn-primary py-2 px-5 text-xs sm:text-sm"
                >
                  Set Password Now
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. My Purchases Section (Functional Order Pipeline - Non-Admin Only) */}
      {!isAdmin && (
        <section className="card bg-white p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="font-bold text-base sm:text-lg text-gray-900">My Purchases</h2>
              <p className="text-xs text-gray-500">Track and manage every harvest package you ordered</p>
            </div>
            <Link
              to="/orders"
              className="text-xs sm:text-sm text-primary-700 hover:text-primary-800 font-semibold flex items-center gap-1 group"
            >
              <span>View Purchase History</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
            {/* To Pay */}
            <button
              type="button"
              onClick={() => navigate('/orders?status=to_pay')}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-soil-50/70 hover:bg-emerald-50/60 border border-gray-100 hover:border-emerald-200 transition-all group"
            >
              <div className="relative mb-2">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-gray-700 group-hover:text-primary-600 transition-colors">
                  <Wallet className="h-6 w-6" strokeWidth={1.8} />
                </div>
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary-600 text-white text-[11px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shadow-sm">
                    {pendingCount}
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-primary-700">To Pay</span>
              <span className="text-[11px] text-gray-500 mt-0.5">Awaiting Payment</span>
            </button>

            {/* To Ship */}
            <button
              type="button"
              onClick={() => navigate('/orders?status=to_ship')}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-soil-50/70 hover:bg-emerald-50/60 border border-gray-100 hover:border-emerald-200 transition-all group"
            >
              <div className="relative mb-2">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-gray-700 group-hover:text-primary-600 transition-colors">
                  <Package className="h-6 w-6" strokeWidth={1.8} />
                </div>
                {confirmedCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary-600 text-white text-[11px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shadow-sm">
                    {confirmedCount}
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-primary-700">To Ship</span>
              <span className="text-[11px] text-gray-500 mt-0.5">Preparing Crates</span>
            </button>

            {/* To Receive */}
            <button
              type="button"
              onClick={() => navigate('/orders?status=to_receive')}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-soil-50/70 hover:bg-emerald-50/60 border border-gray-100 hover:border-emerald-200 transition-all group"
            >
              <div className="relative mb-2">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-gray-700 group-hover:text-primary-600 transition-colors">
                  <Truck className="h-6 w-6" strokeWidth={1.8} />
                </div>
                {toReceiveCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary-600 text-white text-[11px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shadow-sm animate-pulse">
                    {toReceiveCount}
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-primary-700">To Receive</span>
              <span className="text-[11px] text-gray-500 mt-0.5">Rider in Transit</span>
            </button>

            {/* To Rate */}
            <button
              type="button"
              onClick={() => navigate('/orders?status=to_rate')}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-soil-50/70 hover:bg-emerald-50/60 border border-gray-100 hover:border-emerald-200 transition-all group"
            >
              <div className="relative mb-2">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-gray-700 group-hover:text-primary-600 transition-colors">
                  <Star className="h-6 w-6" strokeWidth={1.8} />
                </div>
                {deliveredCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary-600 text-white text-[11px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shadow-sm">
                    {deliveredCount}
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-primary-700">To Rate</span>
              <span className="text-[11px] text-gray-500 mt-0.5">Delivered Crops</span>
            </button>
          </div>
        </section>
      )}

      {/* Admin Platform Operations Desk (Admin Only) */}
      {isAdmin && (
        <section className="card bg-white p-5 sm:p-6 space-y-4 border-purple-100 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h2 className="font-bold text-base sm:text-lg text-gray-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                <span>Platform Management Desk</span>
              </h2>
              <p className="text-xs text-gray-500">
                Administrative operations, seller verification, catalog moderation, and platform governance.
              </p>
            </div>
            <Link
              to="/admin-dashboard"
              className="btn-primary text-xs py-2 px-3.5 font-bold inline-flex items-center gap-1.5 shadow-sm"
            >
              <span>Admin Control Center</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <Link
              to="/admin-dashboard"
              className="p-4 rounded-2xl bg-purple-50/70 hover:bg-purple-100/70 border border-purple-100 transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-purple-700 flex items-center justify-center shadow-sm">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">Admin Control Hub</div>
                <div className="text-[11px] text-gray-500">Users, KYC & listings</div>
              </div>
            </Link>

            <Link
              to="/analytics"
              className="p-4 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-100 transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-emerald-700 flex items-center justify-center shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">Sales Analytics</div>
                <div className="text-[11px] text-gray-500">Regional farm revenue</div>
              </div>
            </Link>

            <Link
              to="/prices"
              className="p-4 rounded-2xl bg-sky-50/70 hover:bg-sky-100/70 border border-sky-100 transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-sky-700 flex items-center justify-center shadow-sm">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">Market Price Monitor</div>
                <div className="text-[11px] text-gray-500">DA Region XII benchmarks</div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* 4. Rewards, Coins & Vouchers Section (Non-Admin Only) */}
      {!isAdmin && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* AgriCoins Card */}
          <div
            onClick={() => setIsCoinsOpen(true)}
            className="card bg-white p-5 hover:border-emerald-300 transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                <Coins className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm sm:text-base text-gray-900">AgriCoins Balance</h3>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Daily Check-in
                  </span>
                </div>
                <p className="text-2xl font-black text-amber-600 mt-0.5">{loyaltyPoints} Coins</p>
                <p className="text-xs text-gray-500">Tap to check in and earn daily rewards</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
          </div>

          {/* AgriVouchers Card */}
          <div
            onClick={() => setIsVoucherOpen(true)}
            className="card bg-white p-5 hover:border-emerald-300 transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform">
                <Ticket className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm sm:text-base text-gray-900">Discount Vouchers</h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Claim Now
                  </span>
                </div>
                <p className="text-2xl font-black text-primary-700 mt-0.5">{claimedVouchers.length} Active</p>
                <p className="text-xs text-gray-500">Free shipping & produce discount codes</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
          </div>
        </section>
      )}

      {/* 5. Workspaces, Roles & Platform Tools */}
      <section className="card bg-white p-5 sm:p-6 space-y-3">
        <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 mb-2">
          Workspaces & Activities
        </h3>

        <div className="divide-y divide-gray-100">
          {/* Seller Desk */}
          {hasRole('seller') && (
            <Link
              to="/seller-dashboard"
              className="py-3.5 flex items-center justify-between hover:bg-emerald-50/50 -mx-3 px-3 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Farm Stall (Seller Desk)</div>
                  <div className="text-xs text-gray-500">Post harvest listings, manage crates and confirm buyer orders</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
          )}

          {/* Delivery Desk */}
          {hasRole('delivery') && (
            <>
              <Link
                to="/delivery"
                className="py-3.5 flex items-center justify-between hover:bg-emerald-50/50 -mx-3 px-3 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary-700 flex items-center justify-center shrink-0">
                    <Bike className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Delivery Command Desk</div>
                    <div className="text-xs text-gray-500">Live parcel pickups, GPS route navigation, and buyer SMS</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>

              <Link
                to="/rider-dashboard"
                className="py-3.5 flex items-center justify-between hover:bg-emerald-50/50 -mx-3 px-3 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-soil-100 text-soil-900 flex items-center justify-center shrink-0">
                    <LayoutDashboard className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Rider Performance & Earnings Dashboard</div>
                    <div className="text-xs text-gray-500">Delivery fees, COD collections, ratings, and drop-off records</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
            </>
          )}

          {/* Admin Control Center */}
          {hasRole('admin') && (
            <Link
              to="/admin-dashboard"
              className="py-3.5 flex items-center justify-between hover:bg-emerald-50/50 -mx-3 px-3 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Admin Control Center</div>
                  <div className="text-xs text-gray-500">Platform KYC verification, catalog moderation and reports</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
          )}

          {/* Become a Seller */}
          {!hasRole('seller') && !hasRole('admin') && !hasRole('delivery') && (
            <Link
              to="/become-seller"
              className="py-3.5 flex items-center justify-between hover:bg-emerald-50/50 -mx-3 px-3 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary-700 flex items-center justify-center shrink-0">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    {myApplication ? `Seller Application (${myApplication.status})` : 'Start Selling on AgriMarket'}
                  </div>
                  <div className="text-xs text-gray-500">Submit farm credentials to list harvests directly</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
          )}

          {/* Market Prices */}
          <Link
            to="/prices"
            className="py-3.5 flex items-center justify-between hover:bg-emerald-50/50 -mx-3 px-3 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">SOCCSKSARGEN Market Prices</div>
                <div className="text-xs text-gray-500">Daily DA / Bantay Presyo wholesale and retail benchmarks</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </Link>

          {/* Account Settings */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="w-full py-3.5 flex items-center justify-between hover:bg-emerald-50/50 -mx-3 px-3 rounded-xl transition-colors text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Account Settings & Profile</div>
                <div className="text-xs text-gray-500">Update name, phone number, and address</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>

          {/* Help Centre */}
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            className="w-full py-3.5 flex items-center justify-between hover:bg-emerald-50/50 -mx-3 px-3 rounded-xl transition-colors text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Help Centre & Agronomist Support</div>
                <div className="text-xs text-gray-500">Platform assistance, order inquiries, and hotline</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </section>

      {/* 6. Clean Logout Action */}
      <section className="pt-2">
        <button
          type="button"
          onClick={logout}
          className="w-full bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-2xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <LogOut className="h-4 w-4" />
          <span>Log out of AgriMarket</span>
        </button>
      </section>

      {/* --- REUSABLE MODALS --- */}

      {/* Voucher Center Modal */}
      {!isAdmin && <VoucherCenterModal isOpen={isVoucherOpen} onClose={() => setIsVoucherOpen(false)} />}

      {/* Daily Coins Check-In Modal */}
      {!isAdmin && <DailyCoinsCheckIn isOpen={isCoinsOpen} onClose={() => setIsCoinsOpen(false)} />}

      {/* Account Settings / Edit Profile Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-sheet-up">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary-600" />
                <h3 className="font-bold text-base text-gray-900">Account Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary-600 shrink-0" />
                Profile updated successfully and synced to central database!
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Email Address (Account ID)</label>
                <input
                  type="text"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Mobile Number (SMS & Rider Contact)</label>
                <input
                  type="text"
                  placeholder="+63 9XX XXX XXXX"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary py-2.5 text-xs font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Password & Security Modal */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-sheet-up">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary-600" />
                <h3 className="font-bold text-base text-gray-900">Account Security & Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSecurityModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {passwordSaved ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="h-12 w-12 text-primary-600 mx-auto" />
                <h4 className="font-bold text-base text-gray-900">Password Secured!</h4>
                <p className="text-xs text-gray-500">Your account is now secured with password & OTP authentication.</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordSave} className="space-y-4">
                <p className="text-xs text-gray-600">
                  Secure your harvest orders and account details with a verified password.
                </p>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={passwordForm.password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-type new password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">SMS OTP Verification Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={passwordForm.otp}
                      className="w-32 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-primary-700 text-center"
                    />
                    <span className="text-[11px] text-gray-500 self-center">✓ Mock OTP auto-verified for SOCCSKSARGEN demo</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSecurityModalOpen(false)}
                    className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary py-2.5 text-xs font-bold"
                  >
                    Save Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}



      {/* Help Centre Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-sheet-up">
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary-600" />
                <h3 className="font-bold text-base text-gray-900">AgriMarket Support</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-gray-600">
              <p>Need assistance with your crops, delivery dispatch, or payments?</p>
              <div className="bg-soil-50 border border-gray-200/80 p-3.5 rounded-xl space-y-1.5">
                <p className="font-bold text-gray-900">Regional Hotline:</p>
                <p className="text-gray-700 font-medium">📞 +63 912 345 6789 (Region XII Central)</p>
                <p className="text-gray-700 font-medium">💬 In-App Chat: Tap Messages icon above</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsHelpOpen(false)
                  navigate('/messages')
                }}
                className="w-full btn-primary py-2.5 text-xs font-bold"
              >
                Open Support Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfilePage
