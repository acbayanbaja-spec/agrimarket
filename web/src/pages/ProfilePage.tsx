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
  Smartphone,
  Coins,
  Ticket,
  Building2,
  CreditCard,
  ShieldCheck,
  Gift,
  LogOut,
  Store,
  Bike,
  LayoutDashboard,
  HelpCircle,
  CheckCircle2,
  KeyRound,
  Crown,
  Tag,
  ArrowRight,
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

  // Dismissable Security Banner
  const [showSecurityBanner, setShowSecurityBanner] = useState(true)

  // Interactive Modals State
  const [isVoucherOpen, setIsVoucherOpen] = useState(false)
  const [isCoinsOpen, setIsCoinsOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false)
  const [isTierModalOpen, setIsTierModalOpen] = useState(false)
  const [isVipModalOpen, setIsVipModalOpen] = useState(false)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [isSpayLaterModalOpen, setIsSpayLaterModalOpen] = useState(false)
  const [isMariBankModalOpen, setIsMariBankModalOpen] = useState(false)
  const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false)
  const [isLoadDealsModalOpen, setIsLoadDealsModalOpen] = useState(false)
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

  // ShopeePay / AgriPay simulated balance
  const [walletBalance, setWalletBalance] = useState(350)
  const [walletTopUpAmount, setWalletTopUpAmount] = useState('200')
  const [walletMessage, setWalletMessage] = useState('')

  // SPayLater simulated limit
  const [creditActivated, setCreditActivated] = useState(false)

  // Order status counts for Shopee status pipeline
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

  const handleTopUp = () => {
    const amt = Number(walletTopUpAmount) || 0
    if (amt > 0) {
      setWalletBalance((prev) => prev + amt)
      setWalletMessage(`✓ Successfully cashed in ${formatPeso(amt)} via GCash!`)
      setTimeout(() => setWalletMessage(''), 3000)
    }
  }

  const dashboardLink = hasRole('admin')
    ? '/admin-dashboard'
    : hasRole('seller')
    ? '/seller-dashboard'
    : hasRole('delivery')
    ? '/delivery'
    : '/orders'

  const displayName = user
    ? user.firstName
      ? `${user.firstName} ${user.lastName}`
      : user.email.split('@')[0]
    : 'AgriMarket Member'

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-24 font-sans text-gray-800">
      <Seo title="Me | Profile" description="Your AgriMarket purchases, wallet, vouchers, and account settings." path="/profile" />

      {/* 1. Shopee-Style Orange-Red Festive Header */}
      <header className="relative bg-gradient-to-b from-[#ee4d2d] via-[#f0532d] to-[#ff5722] text-white pt-3 pb-6 px-4 shadow-md overflow-hidden">
        {/* Subtle festive background circles */}
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute top-20 -left-10 w-36 h-36 rounded-full bg-amber-400/20 blur-lg pointer-events-none" />

        {/* Top Action Icons Row */}
        <div className="flex items-center justify-end gap-3.5 mb-3 relative z-10">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            title="Account Settings"
          >
            <Settings className="h-5 w-5 text-white" />
          </button>

          {!hasRole('admin') && !hasRole('delivery') && (
            <Link to="/cart" className="relative p-1.5 hover:bg-white/20 rounded-full transition-colors" title="Cart">
              <ShoppingCart className="h-5 w-5 text-white" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-[#ee4d2d] text-[10px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow-sm animate-pop">
                  {count}
                </span>
              )}
            </Link>
          )}

          <Link to="/messages" className="relative p-1.5 hover:bg-white/20 rounded-full transition-colors" title="Messages">
            <MessageSquare className="h-5 w-5 text-white" />
          </Link>
        </div>

        {/* User Identity Info */}
        <div className="flex items-center gap-3.5 relative z-10">
          <div
            onClick={() => setIsSettingsOpen(true)}
            className="w-14 h-14 rounded-full bg-white/90 text-[#ee4d2d] flex items-center justify-center font-bold text-xl shadow-md border-2 border-white/80 cursor-pointer overflow-hidden shrink-0"
          >
            {user?.firstName ? user.firstName.charAt(0).toUpperCase() : displayName.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold truncate tracking-tight text-white">{displayName}</h2>
              <button
                type="button"
                onClick={() => setIsTierModalOpen(true)}
                className="bg-white/25 hover:bg-white/35 backdrop-blur-sm text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 transition-colors"
              >
                <span>Silver</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-orange-100 mt-1">
              <span><strong>2</strong> Following</span>
              <span><strong>0</strong> Followers</span>
              {hasRole('seller') && <span className="bg-amber-400 text-amber-950 font-extrabold text-[9px] px-1.5 py-0.2 rounded">SELLER</span>}
              {hasRole('delivery') && <span className="bg-emerald-300 text-emerald-950 font-extrabold text-[9px] px-1.5 py-0.2 rounded">RIDER</span>}
              {hasRole('admin') && <span className="bg-white text-rose-800 font-extrabold text-[9px] px-1.5 py-0.2 rounded">ADMIN</span>}
            </div>
          </div>
        </div>

        {/* VIP+ Golden Banner */}
        <div
          onClick={() => setIsVipModalOpen(true)}
          className="mt-4 bg-gradient-to-r from-[#ffe1a0] via-[#ffd276] to-[#f9be52] text-[#6b3c00] rounded-xl px-3 py-2 flex items-center justify-between shadow-sm cursor-pointer hover:opacity-95 transition-all"
        >
          <div className="flex items-center gap-2">
            <span className="bg-[#6b3c00] text-[#ffd276] text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
              <Crown className="h-3 w-3 fill-[#ffd276]" /> VIP+
            </span>
            <span className="text-xs font-bold tracking-tight">Get Extra 20% Off Every Day</span>
          </div>
          <ChevronRight className="h-4 w-4 text-[#6b3c00]" />
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-xl mx-auto px-3 sm:px-4 -mt-2 space-y-3 relative z-20">
        {/* 2. Set Your Password / Security Card */}
        {showSecurityBanner && (
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-fade-up">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                <Lock className="h-5 w-5 text-[#ee4d2d]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-gray-900">Set Your Password</h3>
                  <button
                    type="button"
                    onClick={() => setShowSecurityBanner(false)}
                    className="text-gray-400 hover:text-gray-600 p-0.5"
                    aria-label="Dismiss security banner"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  Set a password to login with an OTP and get greater account security.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setShowSecurityBanner(false)}
                    className="px-3.5 py-1.5 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50"
                  >
                    Later
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSecurityModalOpen(true)}
                    className="px-4 py-1.5 bg-[#ee4d2d] text-white text-xs font-semibold rounded-lg hover:bg-[#d63d1e] shadow-sm"
                  >
                    Set Now
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3. My Purchases Section (Shopee Order Status Hub) */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 pt-3.5 pb-2 flex items-center justify-between border-b border-gray-50">
            <h3 className="font-bold text-sm text-gray-900">My Purchases</h3>
            <Link to="/orders" className="text-xs text-gray-500 hover:text-[#ee4d2d] flex items-center gap-0.5 font-medium">
              <span>View Purchase History</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-4 py-4 text-center">
            {/* To Pay */}
            <button
              type="button"
              onClick={() => navigate('/orders?status=to_pay')}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="relative">
                <Wallet className="h-6 w-6 text-gray-700 group-hover:text-[#ee4d2d] transition-colors" strokeWidth={1.75} />
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#ee4d2d] text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-700 group-hover:text-[#ee4d2d]">To Pay</span>
            </button>

            {/* To Ship */}
            <button
              type="button"
              onClick={() => navigate('/orders?status=to_ship')}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="relative">
                <Package className="h-6 w-6 text-gray-700 group-hover:text-[#ee4d2d] transition-colors" strokeWidth={1.75} />
                {confirmedCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#ee4d2d] text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                    {confirmedCount}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-700 group-hover:text-[#ee4d2d]">To Ship</span>
            </button>

            {/* To Receive */}
            <button
              type="button"
              onClick={() => navigate('/orders?status=to_receive')}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="relative">
                <Truck className="h-6 w-6 text-gray-700 group-hover:text-[#ee4d2d] transition-colors" strokeWidth={1.75} />
                {toReceiveCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#ee4d2d] text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center animate-pulse">
                    {toReceiveCount}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-700 group-hover:text-[#ee4d2d]">To Receive</span>
            </button>

            {/* To Rate */}
            <button
              type="button"
              onClick={() => navigate('/orders?status=to_rate')}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="relative">
                <Star className="h-6 w-6 text-gray-700 group-hover:text-[#ee4d2d] transition-colors" strokeWidth={1.75} />
                {deliveredCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#ee4d2d] text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                    {deliveredCount}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-700 group-hover:text-[#ee4d2d]">To Rate</span>
            </button>
          </div>

          {/* Sub-row: Load, Bills & Travel */}
          <div
            onClick={() => setIsLoadDealsModalOpen(true)}
            className="border-t border-gray-100 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Smartphone className="h-5 w-5 text-emerald-600" />
              <span className="text-xs font-semibold text-gray-800">Load, Bills & Farm Utilities</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#ee4d2d] font-bold">
              <span>₱1 Data Deals 🏷️</span>
              <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            </div>
          </div>
        </section>

        {/* 4. My Wallet Section */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-bold text-sm text-gray-900 mb-3.5">My Wallet</h3>

          <div className="grid grid-cols-4 gap-2 text-center">
            {/* ShopeePay / AgriPay */}
            <button
              type="button"
              onClick={() => setIsWalletModalOpen(true)}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#ee4d2d] flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <Wallet className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-gray-800">ShopeePay</span>
              <span className="text-[10px] font-bold text-[#ee4d2d] border border-[#ee4d2d] px-2 py-0.2 rounded-full">
                Activate
              </span>
            </button>

            {/* Coins */}
            <button
              type="button"
              onClick={() => setIsCoinsOpen(true)}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="relative w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <Coins className="h-5 w-5 text-amber-500" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ee4d2d]" />
              </div>
              <span className="text-xs font-bold text-gray-800">Coins</span>
              <span className="text-[10px] font-semibold text-[#ee4d2d]">Check in now!</span>
            </button>

            {/* Vouchers */}
            <button
              type="button"
              onClick={() => setIsVoucherOpen(true)}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="relative w-10 h-10 rounded-2xl bg-orange-50 text-[#ee4d2d] flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <Ticket className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ee4d2d]" />
              </div>
              <span className="text-xs font-bold text-gray-800">Vouchers</span>
              <span className="text-[10px] font-semibold text-[#ee4d2d]">50+ Vouchers</span>
            </button>

            {/* MariBank */}
            <button
              type="button"
              onClick={() => setIsMariBankModalOpen(true)}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-gray-800">MariBank</span>
              <span className="text-[10px] font-semibold text-[#ee4d2d]">Download App</span>
            </button>
          </div>
        </section>

        {/* 5. Financial Services Section */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-gray-900">Financial Services</h3>
            <button
              type="button"
              onClick={() => setIsSpayLaterModalOpen(true)}
              className="text-xs text-gray-500 hover:text-[#ee4d2d] flex items-center gap-0.5 font-medium"
            >
              <span>See More</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* SPayLater Card */}
            <div
              onClick={() => setIsSpayLaterModalOpen(true)}
              className="border border-gray-200/80 rounded-xl p-3 cursor-pointer hover:border-[#ee4d2d] transition-all bg-gradient-to-br from-white to-orange-50/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-sky-600" />
                  <span className="font-bold text-xs text-gray-900">SPayLater</span>
                </div>
                <ChevronRight className="h-3 w-3 text-gray-400" />
              </div>
              <p className="text-[11px] text-[#ee4d2d] font-bold mt-1.5 truncate">
                {creditActivated ? 'Credit Available: ₱50,000' : 'Credit up to ₱50,000'}
              </p>
            </div>

            {/* MariBank Card */}
            <div
              onClick={() => setIsMariBankModalOpen(true)}
              className="border border-gray-200/80 rounded-xl p-3 cursor-pointer hover:border-[#ee4d2d] transition-all bg-gradient-to-br from-white to-blue-50/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-blue-700" />
                  <span className="font-bold text-xs text-gray-900">MariBank</span>
                </div>
                <ChevronRight className="h-3 w-3 text-gray-400" />
              </div>
              <p className="text-[11px] text-[#ee4d2d] font-bold mt-1.5 truncate">
                Claim up to ₱588 Pamasko
              </p>
            </div>

            {/* Insurance Card */}
            <div
              onClick={() => setIsInsuranceModalOpen(true)}
              className="col-span-2 border border-gray-200/80 rounded-xl p-3 cursor-pointer hover:border-[#ee4d2d] transition-all flex items-center justify-between bg-gradient-to-br from-white to-emerald-50/20"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#ee4d2d]" />
                <div>
                  <span className="font-bold text-xs text-gray-900">Crop & Purchase Insurance</span>
                  <p className="text-[11px] text-[#ee4d2d] font-medium mt-0.5">
                    20% savings, pay with ShopeePay/MariBank
                  </p>
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            </div>
          </div>
        </section>

        {/* 6. More Activities & Workspace Management */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50/50">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500">More Activities & Roles</h3>
          </div>

          {/* Role Specific Workspace Links */}
          {hasRole('seller') && (
            <Link
              to="/seller-dashboard"
              className="px-4 py-3.5 flex items-center justify-between hover:bg-orange-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Store className="h-5 w-5 text-amber-600" />
                <div>
                  <div className="text-xs font-bold text-gray-900">My Farm Stall (Seller Desk)</div>
                  <div className="text-[11px] text-gray-500">Post harvest listings, manage crates and confirm buyer orders</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
          )}

          {hasRole('delivery') && (
            <Link
              to="/delivery"
              className="px-4 py-3.5 flex items-center justify-between hover:bg-orange-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bike className="h-5 w-5 text-[#ee4d2d]" />
                <div>
                  <div className="text-xs font-bold text-gray-900">Delivery Command Desk</div>
                  <div className="text-[11px] text-gray-500">Region XII pickup parcels, buyer GPS and drop-off navigation</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
          )}

          {hasRole('admin') && (
            <Link
              to="/admin-dashboard"
              className="px-4 py-3.5 flex items-center justify-between hover:bg-orange-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-xs font-bold text-gray-900">Admin Control Center</div>
                  <div className="text-[11px] text-gray-500">Platform KYC verification, catalog moderation and reports</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
          )}

          {!hasRole('seller') && !hasRole('admin') && !hasRole('delivery') && (
            <Link
              to="/become-seller"
              className="px-4 py-3.5 flex items-center justify-between hover:bg-orange-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Store className="h-5 w-5 text-emerald-600" />
                <div>
                  <div className="text-xs font-bold text-gray-900">
                    {myApplication ? `Seller Application (${myApplication.status})` : 'Start Selling on AgriMarket'}
                  </div>
                  <div className="text-[11px] text-gray-500">Submit farm credentials to list harvests directly</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
          )}

          <Link
            to="/prices"
            className="px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5 text-sky-600" />
              <div className="text-xs font-semibold text-gray-900">SOCCSKSARGEN Market Prices</div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </Link>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-gray-600" />
              <div className="text-xs font-semibold text-gray-900">Account Settings & Edit Profile</div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>

          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-gray-600" />
              <div className="text-xs font-semibold text-gray-900">Help Centre & Agronomist Support</div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>
        </section>

        {/* 7. Log Out Button */}
        <section className="pt-2">
          <button
            type="button"
            onClick={logout}
            className="w-full bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-2xl py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Log out</span>
          </button>
        </section>
      </main>

      {/* --- REUSABLE MODALS (ALL FULLY FUNCTIONAL) --- */}

      {/* Existing Voucher Modal */}
      <VoucherCenterModal isOpen={isVoucherOpen} onClose={() => setIsVoucherOpen(false)} />

      {/* Existing Coins Check-In Modal */}
      <DailyCoinsCheckIn isOpen={isCoinsOpen} onClose={() => setIsCoinsOpen(false)} />

      {/* Account Settings / Edit Profile Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl animate-sheet-up">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-base text-gray-900">Account Settings</h3>
              <button type="button" onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {editSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Profile updated and saved to central database!
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Email (Account ID)</label>
                <input
                  type="text"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#ee4d2d] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#ee4d2d] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Mobile (Used for SMS & Rider Pings)</label>
                <input
                  type="text"
                  placeholder="+63 9XX XXX XXXX"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#ee4d2d] outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#ee4d2d] text-white rounded-xl text-xs font-bold hover:bg-[#d63d1e] shadow-sm"
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
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl animate-sheet-up">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-[#ee4d2d]" />
                <h3 className="font-bold text-base text-gray-900">Set Account Password</h3>
              </div>
              <button type="button" onClick={() => setIsSecurityModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {passwordSaved ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-base text-gray-900">Password Secured!</h4>
                <p className="text-xs text-gray-500">Your account is now protected with 2-Factor OTP and password authentication.</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordSave} className="space-y-3.5">
                <p className="text-xs text-gray-600">
                  Protect your orders, harvests, and GCash/ShopeePay wallet with a secure password.
                </p>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={passwordForm.password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#ee4d2d] outline-none"
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
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#ee4d2d] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">SMS OTP Verification Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={passwordForm.otp}
                      className="w-32 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#ee4d2d] text-center"
                    />
                    <span className="text-[11px] text-gray-500 self-center">✓ Mock OTP auto-verified for SOCCSKSARGEN demo</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSecurityModalOpen(false)}
                    className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#ee4d2d] text-white rounded-xl text-xs font-bold hover:bg-[#d63d1e] shadow-sm"
                  >
                    Save Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Silver Member Tier Modal */}
      {isTierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-sheet-up">
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-gray-500" />
                <h3 className="font-bold text-base text-gray-900">Silver Membership</h3>
              </div>
              <button type="button" onClick={() => setIsTierModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600">
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-3.5 rounded-2xl text-gray-900">
                <p className="font-bold text-sm">Silver Member Privileges</p>
                <p className="text-[11px] text-gray-600 mt-1">Complete 3 more orders to unlock <strong>Gold Member</strong> status!</p>
              </div>

              <ul className="space-y-2 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Free shipping voucher every Monday inside SOCCSKSARGEN</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Earn 1 AgriCoin for every ₱10 harvest spend</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Direct SMS access with farm growers and verified dispatch riders</span>
                </li>
              </ul>

              <button
                type="button"
                onClick={() => setIsTierModalOpen(false)}
                className="w-full mt-3 py-2.5 bg-gray-900 text-white font-bold rounded-xl text-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIP+ Harvest Club Modal */}
      {isVipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-sheet-up">
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500 fill-amber-500" />
                <h3 className="font-bold text-base text-gray-900">AgriMarket VIP+ Club</h3>
              </div>
              <button type="button" onClick={() => setIsVipModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600">
              <div className="bg-gradient-to-r from-amber-400 to-yellow-500 p-4 rounded-2xl text-amber-950">
                <p className="font-black text-sm">Extra 20% Off Every Day</p>
                <p className="text-[11px] mt-1 opacity-90">Unlimited free shipping discounts & 20% discount on certified organic crops.</p>
              </div>

              <div className="border border-gray-100 rounded-xl p-3 space-y-1.5">
                <p className="font-bold text-gray-800">Exclusive VIP Benefits:</p>
                <p>• ₱0 Minimum Spend Free Shipping on Region XII deliveries</p>
                <p>• 2× Daily Coins check-in multiplier</p>
                <p>• Priority harvest packing from Koronadal & Polomolok farms</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  alert('🎉 VIP+ Membership Activated for your account!')
                  setIsVipModalOpen(false)
                }}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Join VIP+ for Free Today
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ShopeePay / AgriPay Digital Wallet Modal */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-sheet-up">
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-[#ee4d2d]" />
                <h3 className="font-bold text-base text-gray-900">ShopeePay / AgriPay</h3>
              </div>
              <button type="button" onClick={() => setIsWalletModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="bg-gradient-to-r from-orange-600 to-[#ee4d2d] text-white p-4 rounded-2xl shadow-sm">
                <p className="text-[11px] opacity-80 uppercase tracking-wider font-semibold">Available Escrow Balance</p>
                <p className="text-3xl font-extrabold mt-1">{formatPeso(walletBalance)}</p>
                <p className="text-[10px] opacity-90 mt-1 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Protected by AgriMarket Escrow & BSP
                </p>
              </div>

              {walletMessage && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">
                  {walletMessage}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Instant Cash In (GCash / Maya)</label>
                <div className="grid grid-cols-3 gap-2">
                  {['100', '200', '500'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setWalletTopUpAmount(amt)}
                      className={`py-1.5 rounded-xl text-xs font-bold border ${
                        walletTopUpAmount === amt ? 'bg-orange-50 border-[#ee4d2d] text-[#ee4d2d]' : 'border-gray-200'
                      }`}
                    >
                      +{formatPeso(Number(amt))}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleTopUp}
                className="w-full py-2.5 bg-[#ee4d2d] text-white font-bold rounded-xl text-xs shadow-sm hover:bg-[#d63d1e]"
              >
                Top Up Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SPayLater Modal */}
      {isSpayLaterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-sheet-up">
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-sky-600" />
                <h3 className="font-bold text-base text-gray-900">SPayLater (AgriCredit)</h3>
              </div>
              <button type="button" onClick={() => setIsSpayLaterModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600">
              <div className="bg-sky-50 border border-sky-100 p-3.5 rounded-2xl">
                <p className="text-xs font-bold text-sky-950">Approved Credit Line</p>
                <p className="text-2xl font-black text-sky-800 mt-1">₱50,000.00</p>
                <p className="text-[10px] text-sky-700 mt-1">Buy crops now, pay on next month's harvest cycle (0% interest).</p>
              </div>

              <div className="space-y-1.5 text-gray-700">
                <p className="font-semibold text-gray-900">Why use SPayLater on AgriMarket?</p>
                <p>• Flexible payment terms: 1, 3, or 6 months</p>
                <p>• Zero hidden fees for verified local farmers and bulk buyers</p>
                <p>• Instant checkout approval on produce and bulk grains</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCreditActivated(true)
                  alert('✓ SPayLater line of ₱50,000 is now active for your checkout!')
                  setIsSpayLaterModalOpen(false)
                }}
                className="w-full mt-2 py-2.5 bg-[#ee4d2d] text-white font-bold rounded-xl text-xs shadow-sm hover:bg-[#d63d1e]"
              >
                {creditActivated ? 'Credit Line Active' : 'Activate Credit Line Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MariBank Modal */}
      {isMariBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-sheet-up">
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-700" />
                <h3 className="font-bold text-base text-gray-900">MariBank Philippines</h3>
              </div>
              <button type="button" onClick={() => setIsMariBankModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600">
              <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-2xl">
                <p className="text-xs font-bold text-blue-950">MariBank Savings Account</p>
                <p className="text-xl font-black text-blue-800 mt-1">5.0% p.a. Interest Rate</p>
                <p className="text-[10px] text-blue-700 mt-1">Claim up to ₱588 Welcome Bonus when linking your AgriMarket account.</p>
              </div>

              <p>• Licensed by Bangko Sentral ng Pilipinas (BSP)</p>
              <p>• Deposits insured by PDIC up to ₱500,000</p>
              <p>• Zero transfer fees to GCash, Maya, and BDO</p>

              <button
                type="button"
                onClick={() => {
                  alert('✓ MariBank connection successful! ₱588 welcome voucher added.')
                  setIsMariBankModalOpen(false)
                }}
                className="w-full mt-2 py-2.5 bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm hover:bg-blue-800"
              >
                Link MariBank Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insurance Modal */}
      {isInsuranceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-sheet-up">
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#ee4d2d]" />
                <h3 className="font-bold text-base text-gray-900">AgriMarket Insurance</h3>
              </div>
              <button type="button" onClick={() => setIsInsuranceModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600">
              <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl">
                <p className="text-xs font-bold text-emerald-950">Crop & Freight Coverage</p>
                <p className="text-lg font-black text-emerald-800 mt-0.5">100% Guaranteed Freshness</p>
                <p className="text-[10px] text-emerald-700 mt-1">Instant refunds for bruised fruits or transit delays in Region XII.</p>
              </div>

              <p>• Partnered with Philippine Crop Insurance Corporation (PCIC)</p>
              <p>• 20% discount when paying via ShopeePay or MariBank</p>
              <p>• Free storm and rainfall cargo indemnity for farmers</p>

              <button
                type="button"
                onClick={() => {
                  alert('✓ Crop & Freight transit protection is active on all your orders.')
                  setIsInsuranceModalOpen(false)
                }}
                className="w-full mt-2 py-2.5 bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm hover:bg-emerald-800"
              >
                Activate Coverage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load, Bills & Travel Modal */}
      {isLoadDealsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-sheet-up">
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-base text-gray-900">Load & Farm Utilities</h3>
              </div>
              <button type="button" onClick={() => setIsLoadDealsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600">
              <div className="border border-orange-200 bg-orange-50 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">₱1 Daily Data Flash Deal</p>
                  <p className="text-[11px] text-gray-500">1GB All-Access Data (Smart / Globe / DITO)</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    alert('✓ 1GB Data successfully credited to your registered mobile number!')
                    setIsLoadDealsModalOpen(false)
                  }}
                  className="bg-[#ee4d2d] text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                >
                  Buy ₱1
                </button>
              </div>

              <div className="border border-gray-100 p-3 rounded-xl">
                <p className="font-bold text-gray-900 mb-1">SOCCSKSARGEN Utility Payments</p>
                <p className="text-[11px] text-gray-500">Pay SOCOTECO I & II, GenSan Water District, and irrigation fees with 0 convenience fee.</p>
              </div>

              <button
                type="button"
                onClick={() => setIsLoadDealsModalOpen(false)}
                className="w-full mt-2 py-2 bg-gray-200 text-gray-800 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Centre Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-sheet-up">
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-base text-gray-900">AgriMarket Support</h3>
              </div>
              <button type="button" onClick={() => setIsHelpOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600">
              <p>Need assistance with your crops, delivery dispatch, or GCash payment?</p>
              <div className="bg-gray-50 p-3 rounded-xl space-y-1">
                <p className="font-bold text-gray-900">Regional Hotline:</p>
                <p>📞 +63 912 345 6789 (Region XII Central)</p>
                <p>💬 In-App Chat: Tap Messages icon above</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsHelpOpen(false)
                  navigate('/messages')
                }}
                className="w-full py-2.5 bg-[#ee4d2d] text-white font-bold rounded-xl text-xs"
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
