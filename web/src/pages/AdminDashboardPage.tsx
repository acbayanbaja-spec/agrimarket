import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  ShieldAlert,
  Package,
  Users,
  TrendingUp,
  FileCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Truck,
  Bike,
  LineChart,
  AlertCircle,
  BadgeAlert,
  Tag,
  Percent,
  Star,
  History,
  Plus,
  Trash2,
  Edit3,
  Lock,
  Unlock,
  AlertTriangle,
  RotateCcw,
  Clock,
  Layers,
  FileText,
  UserCheck,
} from 'lucide-react'
import {
  useStore,
  type Order,
  type CategoryItem,
  type PromotionCoupon,
  type AdminUser,
  type AuditLog,
  type Review,
} from '../context/StoreContext'
import { type Product } from '../data/catalog'
import { formatPeso } from '../lib/utils'
import Seo from '../components/Seo'
import ProductImage from '../components/ProductImage'

type AdminTab =
  | 'overview'
  | 'users'
  | 'sellers'
  | 'catalog'
  | 'categories'
  | 'promotions'
  | 'reviews'
  | 'audit'

const statuses: Order['status'][] = ['Pending', 'Confirmed', 'Shipped', 'Out for delivery', 'Delivered']

const STANDARD_CATEGORIES: Array<{ name: string; description: string; icon: string }> = [
  { name: 'Vegetables', description: 'Fresh highland & lowland vegetables sourced across SOCCSKSARGEN.', icon: 'Carrot' },
  { name: 'Fruits', description: 'Tropical harvested fruits including sweet mangoes, bananas, and papayas.', icon: 'Apple' },
  { name: 'Rice', description: 'Milled grains, premium Dinorado, Sinandomeng, and brown rice.', icon: 'Wheat' },
  { name: 'Grains', description: 'Yellow corn, white corn, feed grains, and organic pulses.', icon: 'Grain' },
  { name: 'Farm Supplies', description: 'Certified seeds, organic fertilizers, and local farming implements.', icon: 'Sprout' },
  { name: 'Livestock & Poultry', description: 'Free-range native chicken, table eggs, and pasture livestock.', icon: 'Egg' },
  { name: 'Fisheries & Aquaculture', description: 'Fresh tilapia, milkfish, and inland aquaculture harvests.', icon: 'Fish' },
]

const AdminDashboardPage = () => {
  const {
    allProducts,
    products,
    orders,
    applications,
    reviewApplication,
    removeProduct,
    updateOrderStatus,
    categoriesList,
    createCategory,
    updateCategory,
    deleteCategory,
    promotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    usersList,
    updateUserStatus,
    updateUserRoles,
    auditLogs,
    moderateProduct,
    moderateReview,
    deleteReview,
    reviews,
    ridersList,
    assignDriver,
  } = useStore()

  const [activeTab, setActiveTab] = useState<AdminTab>('overview')

  // Search & Filter States
  const [orderFilter, setOrderFilter] = useState<string>('all')
  const [orderSearch, setOrderSearch] = useState<string>('')
  const [userSearch, setUserSearch] = useState<string>('')
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all')
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all')
  const [appSearch, setAppSearch] = useState<string>('')
  const [appStatusFilter, setAppStatusFilter] = useState<string>('all')
  const [productSearch, setProductSearch] = useState<string>('')
  const [productModFilter, setProductModFilter] = useState<string>('all')
  const [categorySearch, setCategorySearch] = useState<string>('')
  const [promoSearch, setPromoSearch] = useState<string>('')
  const [reviewSearch, setReviewSearch] = useState<string>('')
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('all')
  const [auditSearch, setAuditSearch] = useState<string>('')
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all')

  // Modals
  const [inspectDoc, setInspectDoc] = useState<string | null>(null)

  // Suspend User Modal
  const [suspendModal, setSuspendModal] = useState<{
    isOpen: boolean
    user: AdminUser | null
    reason: string
  }>({ isOpen: false, user: null, reason: '' })

  // Request Revision Modal
  const [revisionModal, setRevisionModal] = useState<{
    isOpen: boolean
    appId: string
    farmName: string
    notes: string
  }>({ isOpen: false, appId: '', farmName: '', notes: '' })

  // Moderate Product Modal
  const [modProductModal, setModProductModal] = useState<{
    isOpen: boolean
    product: Product | null
    action: 'flag' | 'delist'
    reason: string
  }>({ isOpen: false, product: null, action: 'flag', reason: '' })

  // Category Modal (Create / Edit)
  const [categoryModal, setCategoryModal] = useState<{
    isOpen: boolean
    id?: string
    name: string
    description: string
    icon: string
    imageUrl: string
  }>({ isOpen: false, name: '', description: '', icon: 'Leaf', imageUrl: '/images/farm.jpg' })

  // Promotion Modal (Create / Edit)
  const [promoModal, setPromoModal] = useState<{
    isOpen: boolean
    isEditing: boolean
    code: string
    discount: number
    type: 'fixed' | 'percentage' | 'shipping'
    minSpend: number
    description: string
  }>({
    isOpen: false,
    isEditing: false,
    code: '',
    discount: 20,
    type: 'fixed',
    minSpend: 200,
    description: '',
  })

  // Role Edit Modal
  const [roleModal, setRoleModal] = useState<{
    isOpen: boolean
    user: AdminUser | null
    selectedRoles: string[]
  }>({ isOpen: false, user: null, selectedRoles: [] })

  // KPIs
  const pendingApps = applications.filter((item) => item.status === 'Pending')
  const needsRevisionApps = applications.filter((item) => item.status === 'Needs Revision')
  const revenue = orders.reduce((sum, order) => sum + order.total, 0)
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered').length
  const suspendedUsersCount = usersList.filter((u) => u.is_active === false).length
  const flaggedProductsCount = (allProducts || products).filter((p) => p.moderationStatus === 'flagged' || p.isUnlisted).length
  const flaggedReviewsCount = reviews.filter((r) => r.status === 'flagged' || r.status === 'hidden').length

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = orderFilter === 'all' || order.status === orderFilter
      const matchesSearch =
        orderSearch === '' ||
        order.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
        (order.buyerName && order.buyerName.toLowerCase().includes(orderSearch.toLowerCase())) ||
        order.address.toLowerCase().includes(orderSearch.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [orders, orderFilter, orderSearch])

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const fullName = `${u.first_name} ${u.last_name}`.toLowerCase()
      const matchesSearch =
        userSearch === '' ||
        fullName.includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.phone && u.phone.includes(userSearch))
      const matchesRole = userRoleFilter === 'all' || u.roles.includes(userRoleFilter)
      const matchesStatus =
        userStatusFilter === 'all' ||
        (userStatusFilter === 'active' && u.is_active !== false) ||
        (userStatusFilter === 'suspended' && u.is_active === false)
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [usersList, userSearch, userRoleFilter, userStatusFilter])

  // Filtered Applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        appSearch === '' ||
        app.farmName.toLowerCase().includes(appSearch.toLowerCase()) ||
        app.name.toLowerCase().includes(appSearch.toLowerCase()) ||
        app.location.toLowerCase().includes(appSearch.toLowerCase())
      const matchesStatus = appStatusFilter === 'all' || app.status === appStatusFilter
      return matchesSearch && matchesStatus
    })
  }, [applications, appSearch, appStatusFilter])

  // Filtered Products
  const catalogSource = allProducts && allProducts.length > 0 ? allProducts : products
  const filteredProducts = useMemo(() => {
    return catalogSource.filter((prod) => {
      const matchesSearch =
        productSearch === '' ||
        prod.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        prod.seller.toLowerCase().includes(productSearch.toLowerCase()) ||
        prod.category.toLowerCase().includes(productSearch.toLowerCase())
      const status = prod.moderationStatus || (prod.isUnlisted ? 'rejected' : 'approved')
      const matchesMod =
        productModFilter === 'all' ||
        (productModFilter === 'approved' && status === 'approved' && !prod.isUnlisted) ||
        (productModFilter === 'flagged' && status === 'flagged') ||
        (productModFilter === 'delisted' && (status === 'rejected' || prod.isUnlisted))
      return matchesSearch && matchesMod
    })
  }, [catalogSource, productSearch, productModFilter])

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    return categoriesList.filter(
      (c) =>
        categorySearch === '' ||
        c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
        c.description.toLowerCase().includes(categorySearch.toLowerCase())
    )
  }, [categoriesList, categorySearch])

  // Filtered Promotions
  const filteredPromotions = useMemo(() => {
    return promotions.filter(
      (p) =>
        promoSearch === '' ||
        p.code.toLowerCase().includes(promoSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(promoSearch.toLowerCase())
    )
  }, [promotions, promoSearch])

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchesSearch =
        reviewSearch === '' ||
        r.userName.toLowerCase().includes(reviewSearch.toLowerCase()) ||
        r.comment.toLowerCase().includes(reviewSearch.toLowerCase()) ||
        r.productId.toLowerCase().includes(reviewSearch.toLowerCase())
      const status = r.status || 'published'
      const matchesStatus = reviewStatusFilter === 'all' || status === reviewStatusFilter
      return matchesSearch && matchesStatus
    })
  }, [reviews, reviewSearch, reviewStatusFilter])

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        auditSearch === '' ||
        log.adminEmail.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.targetType.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.targetId.toLowerCase().includes(auditSearch.toLowerCase())
      const matchesAction = auditActionFilter === 'all' || log.action === auditActionFilter
      return matchesSearch && matchesAction
    })
  }, [auditLogs, auditSearch, auditActionFilter])

  // Distinct audit actions for filter dropdown
  const uniqueAuditActions = useMemo(() => {
    return Array.from(new Set(auditLogs.map((l) => l.action)))
  }, [auditLogs])

  // Handlers
  const handleConfirmSuspension = async () => {
    if (!suspendModal.user) return
    const reason = suspendModal.reason.trim() || 'Violating AgriMarket terms of service'
    await updateUserStatus(suspendModal.user.id, false, reason)
    setSuspendModal({ isOpen: false, user: null, reason: '' })
  }

  const handleConfirmReactivation = async (u: AdminUser) => {
    if (confirm(`Reactivate account for ${u.first_name} ${u.last_name}?`)) {
      await updateUserStatus(u.id, true)
    }
  }

  const handleSaveRoles = async () => {
    if (!roleModal.user) return
    await updateUserRoles(roleModal.user.id, roleModal.selectedRoles)
    setRoleModal({ isOpen: false, user: null, selectedRoles: [] })
  }

  const handleConfirmRevisionRequest = () => {
    if (!revisionModal.appId) return
    const notes = revisionModal.notes.trim() || 'Please re-submit with clear government ID and valid farm permit.'
    reviewApplication(revisionModal.appId, 'Needs Revision', notes)
    setRevisionModal({ isOpen: false, appId: '', farmName: '', notes: '' })
  }

  const handleConfirmProductModeration = async () => {
    if (!modProductModal.product) return
    const action = modProductModal.action
    const reason = modProductModal.reason.trim() || 'Listing moderated due to catalog quality guidelines'
    await moderateProduct(modProductModal.product.id, action, reason)
    setModProductModal({ isOpen: false, product: null, action: 'flag', reason: '' })
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryModal.name.trim()) return
    if (categoryModal.id) {
      await updateCategory(categoryModal.id, {
        name: categoryModal.name.trim(),
        description: categoryModal.description.trim(),
        icon: categoryModal.icon || 'Leaf',
        imageUrl: categoryModal.imageUrl || '/images/farm.jpg',
      })
    } else {
      await createCategory({
        name: categoryModal.name.trim(),
        description: categoryModal.description.trim(),
        icon: categoryModal.icon || 'Leaf',
        imageUrl: categoryModal.imageUrl || '/images/farm.jpg',
      })
    }
    setCategoryModal({ isOpen: false, name: '', description: '', icon: 'Leaf', imageUrl: '/images/farm.jpg' })
  }

  const handleSavePromotion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!promoModal.code.trim()) return
    const payload = {
      code: promoModal.code.trim().toUpperCase(),
      discount: Number(promoModal.discount),
      type: promoModal.type,
      minSpend: Number(promoModal.minSpend),
      description: promoModal.description.trim(),
      isActive: true,
    }
    if (promoModal.isEditing) {
      await updatePromotion(payload.code, payload)
    } else {
      await createPromotion(payload)
    }
    setPromoModal({
      isOpen: false,
      isEditing: false,
      code: '',
      discount: 20,
      type: 'fixed',
      minSpend: 200,
      description: '',
    })
  }

  const handleEnsureStandardCategories = async () => {
    for (const std of STANDARD_CATEGORIES) {
      const exists = categoriesList.some((c) => c.name.toLowerCase() === std.name.toLowerCase())
      if (!exists) {
        await createCategory({
          name: std.name,
          description: std.description,
          icon: std.icon,
          imageUrl: '/images/farm.jpg',
        })
      }
    }
  }

  return (
    <div className="page-shell space-y-8">
      <Seo
        title="Admin Control Center"
        description="Comprehensive administration: manage accounts, review KYC, moderate listings & reviews, maintain categories, oversee promotions, and inspect audit logs."
        path="/admin-dashboard"
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 animate-fade-up">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-bold font-display text-gray-900">Admin Control Center</h1>
            <span className="chip bg-primary-100 text-primary-800 font-bold border border-primary-300">
              Root Administration
            </span>
          </div>
          <p className="text-gray-600 mt-1.5 text-sm sm:text-base">
            Manage account access & suspensions, review seller applications, moderate listings and reviews, maintain agricultural categories, control promotional discounts, and inspect audit trails.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link to="/analytics" className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm">
            <LineChart className="h-4 w-4" /> Sales Analytics
          </Link>
          <Link to="/delivery" className="btn-outline py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5 bg-white">
            <Truck className="h-4 w-4 text-primary-700" /> Delivery Desk
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-gray-200 text-xs sm:text-sm font-semibold scrollbar-none">
        {[
          { id: 'overview', label: 'Overview & Orders', icon: TrendingUp, count: orders.length },
          { id: 'users', label: 'Accounts & Access', icon: Users, count: suspendedUsersCount ? `${suspendedUsersCount} suspended` : usersList.length },
          { id: 'sellers', label: 'Seller KYC', icon: FileCheck, count: pendingApps.length + needsRevisionApps.length || undefined, badgeTone: pendingApps.length > 0 ? 'bg-amber-500 text-white' : undefined },
          { id: 'catalog', label: 'Listing Moderation', icon: Package, count: flaggedProductsCount || undefined, badgeTone: flaggedProductsCount > 0 ? 'bg-rose-500 text-white' : undefined },
          { id: 'categories', label: 'Categories', icon: Layers, count: categoriesList.length },
          { id: 'promotions', label: 'Promotions & Discounts', icon: Percent, count: promotions.length },
          { id: 'reviews', label: 'Reviews Safety', icon: Star, count: flaggedReviewsCount || undefined, badgeTone: flaggedReviewsCount > 0 ? 'bg-amber-500 text-white' : undefined },
          { id: 'audit', label: 'Audit Logs', icon: History, count: auditLogs.length },
        ].map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary-900 text-white shadow-soft font-bold'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200/70'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-primary-300' : 'text-gray-500'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    tab.badgeTone
                      ? tab.badgeTone
                      : isActive
                      ? 'bg-primary-800 text-primary-100'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW & ORDERS
          ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Marketplace GMV',
                value: formatPeso(revenue),
                sub: `${orders.length} total orders`,
                icon: TrendingUp,
                tone: 'bg-emerald-800 bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 border-emerald-500/30',
                accentText: 'text-emerald-100',
                subText: 'text-emerald-200',
                iconBg: 'bg-emerald-600/40 text-emerald-100',
              },
              {
                label: 'Active Listings',
                value: products.length,
                sub: `${catalogSource.length} in Central Database`,
                icon: Package,
                tone: 'bg-primary-900 bg-gradient-to-br from-primary-800 via-emerald-800 to-primary-950 border-primary-500/30',
                accentText: 'text-emerald-100',
                subText: 'text-emerald-200',
                iconBg: 'bg-primary-700/40 text-emerald-100',
              },
              {
                label: 'Pending Seller KYC',
                value: pendingApps.length,
                sub: needsRevisionApps.length > 0 ? `${needsRevisionApps.length} in revision` : 'Requires inspection',
                icon: FileCheck,
                tone: pendingApps.length > 0
                  ? 'bg-amber-800 bg-gradient-to-br from-amber-700 via-amber-800 to-orange-900 border-amber-500/40'
                  : 'bg-slate-800 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-slate-600/40',
                accentText: pendingApps.length > 0 ? 'text-amber-100' : 'text-slate-200',
                subText: pendingApps.length > 0 ? 'text-amber-200' : 'text-slate-300',
                iconBg: pendingApps.length > 0 ? 'bg-amber-600/40 text-amber-100' : 'bg-slate-700/50 text-slate-200',
              },
              {
                label: 'Delivered Parcels',
                value: deliveredOrders,
                sub: 'Completed drop-offs',
                icon: ShieldCheck,
                tone: 'bg-teal-900 bg-gradient-to-br from-teal-800 via-teal-900 to-soil-900 border-teal-500/30',
                accentText: 'text-teal-100',
                subText: 'text-teal-200',
                iconBg: 'bg-teal-700/40 text-teal-100',
              },
            ].map((stat, idx) => (
              <div
                key={stat.label}
                className={`rounded-3xl p-5 ${stat.tone} shadow-lg text-white border relative overflow-hidden animate-fade-up transition-transform hover:-translate-y-0.5 duration-200`}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* Decorative subtle ambient orb */}
                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/5 blur-xl pointer-events-none" />

                <div className="flex items-center justify-between mb-3 relative z-10">
                  <span className={`text-xs font-bold uppercase tracking-wider ${stat.accentText}`}>{stat.label}</span>
                  <div className={`p-2 rounded-xl backdrop-blur-sm ${stat.iconBg}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white drop-shadow-sm relative z-10">
                  {stat.value}
                </p>
                <p className={`text-[11px] ${stat.subText} mt-1.5 font-medium relative z-10`}>{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Live Order Oversight */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-5 sm:p-6 space-y-5 animate-fade-up">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Marketplace Orders</h2>
                <p className="text-xs text-gray-500">Real-time order status, payment confirmations, and dispatch oversight.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    className="input-field text-xs pl-8 py-1.5 w-48"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />
                </div>

                <select
                  className="input-field text-xs py-1.5 w-36"
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <p className="text-gray-500 text-xs py-4 text-center">No orders match current filter.</p>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-gray-50 border border-gray-200/70 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-gray-900">{order.id}</span>
                        <span className="font-bold text-primary-800 text-sm">{formatPeso(order.total)}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-emerald-100 text-emerald-800">
                          {order.payment}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Buyer: <strong>{order.buyerName}</strong> · Drop-off: {order.address}
                      </p>
                      <p className="text-[11px] text-gray-400 font-mono">{order.createdAt.slice(0, 10)}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        className="input-field text-xs py-1.5 w-40 font-semibold"
                        value={order.driverId || ''}
                        onChange={(e) => assignDriver(order.id, Number(e.target.value))}
                        title="Assign delivery rider to order"
                      >
                        <option value="">Assign Rider...</option>
                        {ridersList.map((r) => (
                          <option key={r.id} value={r.id}>
                            🛵 {r.first_name} {r.last_name}
                          </option>
                        ))}
                      </select>

                      <select
                        className="input-field text-xs py-1.5 w-36 font-semibold"
                        value={order.status}
                        onChange={(event) => updateOrderStatus(order.id, event.target.value as Order['status'])}
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      <Link
                        to={`/orders/${order.id}/receipt`}
                        className="btn-outline text-xs py-1.5 px-3 bg-white"
                      >
                        Receipt
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: REGISTERED USERS & ACCOUNT ACCESS / SUSPENSION
          ========================================================================= */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-5 sm:p-6 space-y-5 animate-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-700" /> Registered Accounts & Access Management
              </h2>
              <p className="text-xs text-gray-500">
                Monitor user accounts, manage role permissions, and suspend or reinstate access for security compliance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  className="input-field text-xs pl-8 py-1.5 w-56"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>

              <select
                className="input-field text-xs py-1.5 w-32"
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="delivery">Delivery</option>
                <option value="admin">Admin</option>
              </select>

              <select
                className="input-field text-xs py-1.5 w-32"
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>

              <Link
                to="/delivery"
                className="btn-outline py-1.5 px-3.5 text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm bg-white hover:bg-gray-50"
              >
                <Bike className="w-4 h-4 text-primary-600" /> Delivery Desk
              </Link>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <p className="text-gray-500 text-xs py-6 text-center">No users match the search filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/50">
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Roles</th>
                    <th className="py-3 px-3">Contact</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Access Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((u) => {
                    const isSuspended = u.is_active === false
                    return (
                      <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-800 font-bold flex items-center justify-center text-xs">
                              {u.first_name[0]}{u.last_name[0]}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{u.first_name} {u.last_name}</div>
                              <div className="text-[11px] text-gray-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {u.roles.map((r) => (
                              <span
                                key={r}
                                className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                                  r === 'admin'
                                    ? 'bg-purple-100 text-purple-800'
                                    : r === 'seller'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : r === 'delivery'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-gray-600">
                          {u.phone || 'No phone'}
                        </td>
                        <td className="py-3 px-3">
                          {isSuspended ? (
                            <div>
                              <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-[11px]">
                                <Lock className="w-3 h-3" /> Suspended
                              </span>
                              {u.suspension_reason && (
                                <p className="text-[10px] text-rose-600 mt-1 max-w-xs truncate" title={u.suspension_reason}>
                                  Reason: {u.suspension_reason}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px]">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setRoleModal({
                                  isOpen: true,
                                  user: u,
                                  selectedRoles: [...u.roles],
                                })
                              }
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                              title="Modify Role Permissions"
                            >
                              Roles
                            </button>

                            {isSuspended ? (
                              <button
                                type="button"
                                onClick={() => handleConfirmReactivation(u)}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1"
                              >
                                <Unlock className="w-3 h-3" /> Reactivate
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setSuspendModal({
                                    isOpen: true,
                                    user: u,
                                    reason: '',
                                  })
                                }
                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center gap-1"
                              >
                                <Lock className="w-3 h-3" /> Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: SELLER KYC APPLICATIONS (Approve, Reject, Request Revision)
          ========================================================================= */}
      {activeTab === 'sellers' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-5 sm:p-6 space-y-5 animate-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Seller KYC Applications</h2>
                <p className="text-xs text-gray-500">Government valid ID, permits, and farm photos vetting with revision feedback.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search farm or name..."
                  className="input-field text-xs pl-8 py-1.5 w-48"
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                />
              </div>

              <select
                className="input-field text-xs py-1.5 w-36"
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
              >
                <option value="all">All Applications</option>
                <option value="Pending">Pending</option>
                <option value="Needs Revision">Needs Revision</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <p className="text-gray-500 text-xs py-6 text-center">No seller applications match the filter criteria.</p>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <article
                  key={application.id}
                  className="bg-gray-50/70 rounded-2xl p-4 sm:p-5 border border-gray-200/80 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-gray-900">{application.farmName}</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-xs text-gray-600">{application.name}</span>
                      </div>

                      <p className="text-xs text-gray-500">
                        📍 {application.location} · 📞 {application.phone} · Specialization: <strong>{application.categories}</strong>
                      </p>

                      <p className="text-xs text-gray-700 bg-white p-2.5 rounded-xl border border-gray-100 mt-2">
                        "{application.description}"
                      </p>

                      <p className="text-[11px] font-semibold text-primary-800 mt-1">
                        ID Document: {application.idType || 'Philippine Valid ID'} {application.idNumber ? `(${application.idNumber})` : ''}
                      </p>

                      {application.reviewNotes && (
                        <div className="mt-2 text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-2.5">
                          <strong>Admin Feedback Notes:</strong> "{application.reviewNotes}"
                        </div>
                      )}
                    </div>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                        application.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : application.status === 'Needs Revision'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : application.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-900 animate-pulse'
                      }`}
                    >
                      {application.status}
                    </span>
                  </div>

                  {/* Uploaded Documents Gallery */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <span className="text-xs font-semibold text-gray-500">KYC Attachments:</span>
                    {application.idDocument && (
                      <button
                        type="button"
                        onClick={() => setInspectDoc(application.idDocument!)}
                        className="group relative rounded-xl overflow-hidden border border-gray-300 w-16 h-16 shadow-sm"
                        title="Inspect Government ID"
                      >
                        <ProductImage src={application.idDocument} alt="ID Document" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="h-4 w-4" />
                        </span>
                      </button>
                    )}
                    {application.permitDocument && (
                      <button
                        type="button"
                        onClick={() => setInspectDoc(application.permitDocument!)}
                        className="group relative rounded-xl overflow-hidden border border-gray-300 w-16 h-16 shadow-sm"
                        title="Inspect Business/Barangay Permit"
                      >
                        <ProductImage src={application.permitDocument} alt="Permit" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="h-4 w-4" />
                        </span>
                      </button>
                    )}
                    {application.farmPhoto && (
                      <button
                        type="button"
                        onClick={() => setInspectDoc(application.farmPhoto!)}
                        className="group relative rounded-xl overflow-hidden border border-gray-300 w-16 h-16 shadow-sm"
                        title="Inspect Farm Photo"
                      >
                        <ProductImage src={application.farmPhoto} alt="Farm" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="h-4 w-4" />
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Actions: Approve, Request Revision, Reject */}
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    <button
                      type="button"
                      className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                      onClick={() => reviewApplication(application.id, 'Approved')}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve Seller
                    </button>

                    <button
                      type="button"
                      className="py-2 px-4 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl inline-flex items-center gap-1.5 transition-colors"
                      onClick={() =>
                        setRevisionModal({
                          isOpen: true,
                          appId: application.id,
                          farmName: application.farmName,
                          notes: application.reviewNotes || '',
                        })
                      }
                    >
                      <RotateCcw className="h-4 w-4" /> Request Revision
                    </button>

                    <button
                      type="button"
                      className="btn-outline py-2 px-4 text-xs font-bold text-rose-700 hover:bg-rose-50 border-rose-200 inline-flex items-center gap-1.5"
                      onClick={() => {
                        const note = prompt('Rejection reason/notes (optional):')
                        reviewApplication(application.id, 'Rejected', note || undefined)
                      }}
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: CATALOG MODERATION (Flag, Delist, Approve, Delete with reasons)
          ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-5 sm:p-6 space-y-5 animate-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary-700" /> Catalog Moderation & Content Safety
              </h2>
              <p className="text-xs text-gray-500">
                Audit listings, flag inappropriate entries with reasons, approve or delist crops, and purge invalid items.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search listings..."
                  className="input-field text-xs pl-8 py-1.5 w-52"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>

              <select
                className="input-field text-xs py-1.5 w-36"
                value={productModFilter}
                onChange={(e) => setProductModFilter(e.target.value)}
              >
                <option value="all">All Moderation</option>
                <option value="approved">Approved / Live</option>
                <option value="flagged">Flagged</option>
                <option value="delisted">Delisted / Rejected</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProducts.map((product) => {
              const isUnlisted = Boolean(product.isUnlisted || product.isActive === false || product.moderationStatus === 'rejected')
              const isFlagged = product.moderationStatus === 'flagged'

              return (
                <div
                  key={product.id}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 ${
                    isFlagged
                      ? 'bg-amber-50/80 border-amber-300'
                      : isUnlisted
                      ? 'bg-rose-50/60 border-rose-200'
                      : 'bg-gray-50 border-gray-200/80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <ProductImage src={product.image} alt="" className="h-14 w-14 rounded-xl object-cover shrink-0" />
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          to={`/products/${product.id}`}
                          className="font-bold text-xs text-gray-900 hover:text-primary-700 truncate block"
                        >
                          {product.name}
                        </Link>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">{product.seller} · {formatPeso(product.price)}/{product.unit}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-semibold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded">
                          {product.category}
                        </span>
                        <span className="text-[10px] text-gray-500">Stock: {product.stock}</span>
                      </div>

                      {/* Moderation Status Badges */}
                      <div className="mt-2">
                        {isFlagged ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Flagged for Review
                          </span>
                        ) : isUnlisted ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Delisted
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Approved & Live
                          </span>
                        )}

                        {product.moderationReason && (
                          <p className="text-[10px] text-gray-600 italic mt-1 bg-white/80 p-1 rounded border border-gray-200">
                            Reason: "{product.moderationReason}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Moderation Actions */}
                  <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-gray-200/60">
                    <button
                      type="button"
                      onClick={() => moderateProduct(product.id, 'approve')}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors border border-emerald-200"
                      title="Approve / Restore listing"
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setModProductModal({
                          isOpen: true,
                          product,
                          action: 'flag',
                          reason: product.moderationReason || '',
                        })
                      }
                      className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition-colors border border-amber-300"
                      title="Flag inappropriate listing"
                    >
                      Flag
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setModProductModal({
                          isOpen: true,
                          product,
                          action: 'delist',
                          reason: product.moderationReason || '',
                        })
                      }
                      className="text-xs font-bold text-orange-700 hover:text-orange-900 bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 rounded-lg transition-colors border border-orange-200"
                      title="Delist from store"
                    >
                      Delist
                    </button>

                    <button
                      type="button"
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-white hover:bg-rose-50 px-2 py-1.5 rounded-lg transition-colors border border-rose-200"
                      onClick={() => {
                        if (confirm(`Permanently delete "${product.name}"?`)) {
                          removeProduct(product.id)
                        }
                      }}
                      title="Permanently delete from database"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: CATEGORIES MAINTENANCE (Vegetables, Fruits, Rice, Grains, Farm Supplies)
          ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-5 sm:p-6 space-y-5 animate-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary-700" /> Agricultural Categories Maintenance
              </h2>
              <p className="text-xs text-gray-500">
                Maintain standard catalog taxonomy (Vegetables, Fruits, Rice, Grains, Farm Supplies) and custom departments.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  className="input-field text-xs pl-8 py-1.5 w-48"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={handleEnsureStandardCategories}
                className="btn-outline py-1.5 px-3 text-xs font-semibold bg-white"
                title="Verify and seed standard agricultural categories"
              >
                Ensure Defaults
              </button>

              <button
                type="button"
                onClick={() =>
                  setCategoryModal({
                    isOpen: true,
                    name: '',
                    description: '',
                    icon: 'Leaf',
                    imageUrl: '/images/farm.jpg',
                  })
                }
                className="btn-primary py-1.5 px-3 text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((cat) => {
              const matchedProducts = (allProducts || products).filter(
                (p) => p.category.toLowerCase() === cat.name.toLowerCase()
              )

              return (
                <div
                  key={cat.id}
                  className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 flex flex-col justify-between gap-3 hover:shadow-soft transition-shadow"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-xs">
                          🌱
                        </div>
                        <h3 className="font-bold text-sm text-gray-900">{cat.name}</h3>
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-800 border border-primary-200">
                        {matchedProducts.length} listings
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2">
                      {cat.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200/60">
                    <span className="text-[10px] text-gray-400 font-mono">ID: {cat.id}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setCategoryModal({
                            isOpen: true,
                            id: cat.id,
                            name: cat.name,
                            description: cat.description,
                            icon: cat.icon || 'Leaf',
                            imageUrl: cat.imageUrl || '/images/farm.jpg',
                          })
                        }
                        className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
                        title="Edit category"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete category "${cat.name}"?`)) {
                            deleteCategory(cat.id)
                          }
                        }}
                        className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: PROMOTIONAL DISCOUNTS & COUPONS
          ========================================================================= */}
      {activeTab === 'promotions' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-5 sm:p-6 space-y-5 animate-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Percent className="w-5 h-5 text-primary-700" /> Promotional Discounts & Vouchers
              </h2>
              <p className="text-xs text-gray-500">
                Create promotional voucher codes, percentage discounts, fixed peso markdowns, and free shipping perks.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search promo codes..."
                  className="input-field text-xs pl-8 py-1.5 w-48"
                  value={promoSearch}
                  onChange={(e) => setPromoSearch(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  setPromoModal({
                    isOpen: true,
                    isEditing: false,
                    code: '',
                    discount: 25,
                    type: 'fixed',
                    minSpend: 250,
                    description: '',
                  })
                }
                className="btn-primary py-1.5 px-3 text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create Coupon
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPromotions.map((promo) => {
              const isActive = promo.isActive !== false
              return (
                <div
                  key={promo.code}
                  className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                    isActive ? 'bg-emerald-50/40 border-emerald-200' : 'bg-gray-50 border-gray-200 opacity-70'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-extrabold text-sm text-primary-900 bg-white border border-primary-200 px-2 py-0.5 rounded-md">
                        {promo.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="text-base font-extrabold text-gray-900">
                      {promo.type === 'percentage'
                        ? `${promo.discount}% OFF`
                        : promo.type === 'shipping'
                        ? `FREE SHIPPING`
                        : `₱${promo.discount} OFF`}
                    </div>

                    <p className="text-xs text-gray-600">{promo.description}</p>
                    <p className="text-[11px] text-gray-500 font-semibold">
                      Min. Spend: {formatPeso(promo.minSpend)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200/60">
                    <button
                      type="button"
                      onClick={() => updatePromotion(promo.code, { isActive: !isActive })}
                      className={`text-xs font-semibold px-2 py-1 rounded-md transition-colors ${
                        isActive
                          ? 'text-amber-700 hover:bg-amber-100'
                          : 'text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {isActive ? 'Deactivate' : 'Activate'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setPromoModal({
                            isOpen: true,
                            isEditing: true,
                            code: promo.code,
                            discount: promo.discount,
                            type: promo.type,
                            minSpend: promo.minSpend,
                            description: promo.description,
                          })
                        }
                        className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
                        title="Edit Coupon"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete promotion code "${promo.code}"?`)) {
                            deletePromotion(promo.code)
                          }
                        }}
                        className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: REVIEWS MODERATION & CONTENT SAFETY
          ========================================================================= */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-5 sm:p-6 space-y-5 animate-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Product Review Moderation & Safety
              </h2>
              <p className="text-xs text-gray-500">
                Inspect customer ratings, moderate inappropriate feedback or spam, hide fraudulent reviews, or purge offensive entries.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search reviews & comments..."
                  className="input-field text-xs pl-8 py-1.5 w-56"
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                />
              </div>

              <select
                className="input-field text-xs py-1.5 w-36"
                value={reviewStatusFilter}
                onChange={(e) => setReviewStatusFilter(e.target.value)}
              >
                <option value="all">All Reviews</option>
                <option value="published">Published</option>
                <option value="hidden">Hidden</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>
          </div>

          {filteredReviews.length === 0 ? (
            <p className="text-gray-500 text-xs py-6 text-center">No reviews match the current filters.</p>
          ) : (
            <div className="space-y-3">
              {filteredReviews.map((rev) => {
                const status = rev.status || 'published'
                const isHidden = status === 'hidden'
                const isFlagged = status === 'flagged'

                return (
                  <div
                    key={rev.id}
                    className={`p-4 rounded-2xl border space-y-2.5 ${
                      isHidden
                        ? 'bg-rose-50/60 border-rose-200'
                        : isFlagged
                        ? 'bg-amber-50/60 border-amber-300'
                        : 'bg-gray-50 border-gray-200/80'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">{rev.userName}</span>
                          <span className="text-gray-400">·</span>
                          <span className="text-xs text-gray-500 font-mono">Product: {rev.productId}</span>
                          <div className="flex text-amber-500 text-xs">
                            {Array.from({ length: 5 }, (_, i) => (
                              <span key={i}>{i < rev.rating ? '★' : '☆'}</span>
                            ))}
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-400 font-mono">{rev.createdAt.slice(0, 10)}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            status === 'published'
                              ? 'bg-emerald-100 text-emerald-800'
                              : status === 'hidden'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-800 bg-white p-3 rounded-xl border border-gray-100">
                      "{rev.comment}"
                    </p>

                    {rev.moderationReason && (
                      <p className="text-[11px] text-amber-900 bg-amber-100/60 p-2 rounded-lg">
                        <strong>Moderation Reason:</strong> {rev.moderationReason}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200/60">
                      {status !== 'published' && (
                        <button
                          type="button"
                          onClick={() => moderateReview(rev.id, 'published')}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        >
                          Publish
                        </button>
                      )}

                      {status !== 'flagged' && (
                        <button
                          type="button"
                          onClick={() => {
                            const reason = prompt('Reason for flagging review (optional):')
                            moderateReview(rev.id, 'flagged', reason || undefined)
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300"
                        >
                          Flag
                        </button>
                      )}

                      {status !== 'hidden' && (
                        <button
                          type="button"
                          onClick={() => {
                            const reason = prompt('Reason for hiding review:')
                            moderateReview(rev.id, 'hidden', reason || 'Violates community guidelines')
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200"
                        >
                          Hide Review
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Permanently delete this review from the database?')) {
                            deleteReview(rev.id)
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 8: AUDIT LOGS INSPECTION (Sensitive Administrative Actions)
          ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-5 sm:p-6 space-y-5 animate-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-primary-700" /> Administrative Audit Log
              </h2>
              <p className="text-xs text-gray-500">
                Tamper-evident log of sensitive actions: account suspensions, role changes, KYC reviews, catalog and review moderations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search logs by actor, target, details..."
                  className="input-field text-xs pl-8 py-1.5 w-60"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                />
              </div>

              <select
                className="input-field text-xs py-1.5 w-44"
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
              >
                <option value="all">All Action Types</option>
                {uniqueAuditActions.map((act) => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredAuditLogs.length === 0 ? (
            <p className="text-gray-500 text-xs py-6 text-center">No administrative actions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/50">
                    <th className="py-3 px-3">Timestamp</th>
                    <th className="py-3 px-3">Admin</th>
                    <th className="py-3 px-3">Action</th>
                    <th className="py-3 px-3">Target</th>
                    <th className="py-3 px-3">Details & Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-3 text-gray-500 font-mono whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-gray-900">{log.adminEmail}</span>
                        <span className="text-[10px] text-gray-400 block font-mono">ID: {log.adminId}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            log.action.includes('SUSPEND')
                              ? 'bg-rose-100 text-rose-800'
                              : log.action.includes('KYC')
                              ? 'bg-amber-100 text-amber-900'
                              : log.action.includes('MODERATE') || log.action.includes('DELIST')
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-primary-100 text-primary-800'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-gray-700">{log.targetType}</span>
                        <span className="text-[10px] text-gray-400 block font-mono truncate max-w-[120px]">
                          {log.targetId}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-800">
                        <div className="max-w-md break-words">
                          {log.details}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODALS
          ========================================================================= */}

      {/* KYC Document Lightbox Modal */}
      {inspectDoc && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setInspectDoc(null)}
        >
          <div className="relative max-w-2xl w-full bg-white rounded-3xl p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-gray-900">KYC Verification Document Inspection</h3>
              <button
                type="button"
                onClick={() => setInspectDoc(null)}
                className="text-xs font-bold bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-gray-700"
              >
                Close
              </button>
            </div>
            <img src={inspectDoc} alt="KYC Document" className="w-full max-h-[70vh] object-contain rounded-2xl border border-gray-200" />
          </div>
        </div>
      )}

      {/* Suspend Account Modal */}
      {suspendModal.isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSuspendModal({ isOpen: false, user: null, reason: '' })}
        >
          <div
            className="relative max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900">Suspend Account Access</h3>
                <p className="text-xs text-gray-500">
                  {suspendModal.user?.first_name} {suspendModal.user?.last_name} ({suspendModal.user?.email})
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              Suspending this user will immediately revoke their ability to log in, create harvest listings, make purchases, or confirm transactions.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Reason for Suspension (Visible to User & Audit Log)
              </label>
              <textarea
                required
                className="input-field text-xs w-full min-h-[80px]"
                placeholder="e.g. Failure to comply with agricultural quality standards / Suspicious transaction activity"
                value={suspendModal.reason}
                onChange={(e) => setSuspendModal((prev) => ({ ...prev, reason: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSuspendModal({ isOpen: false, user: null, reason: '' })}
                className="btn-outline text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSuspension}
                className="py-2 px-4 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Management Modal */}
      {roleModal.isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setRoleModal({ isOpen: false, user: null, selectedRoles: [] })}
        >
          <div
            className="relative max-w-sm w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-bold text-base text-gray-900">Manage User Roles</h3>
              <p className="text-xs text-gray-500">
                {roleModal.user?.first_name} {roleModal.user?.last_name}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              {['buyer', 'seller', 'delivery', 'admin'].map((role) => {
                const checked = roleModal.selectedRoles.includes(role)
                return (
                  <label key={role} className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...roleModal.selectedRoles, role]
                          : roleModal.selectedRoles.filter((r) => r !== role)
                        setRoleModal((prev) => ({ ...prev, selectedRoles: next }))
                      }}
                      className="rounded text-primary-600"
                    />
                    <span className="capitalize font-semibold text-gray-800">{role}</span>
                  </label>
                )
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRoleModal({ isOpen: false, user: null, selectedRoles: [] })}
                className="btn-outline text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRoles}
                className="btn-primary text-xs py-2 px-4"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Revision Modal */}
      {revisionModal.isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setRevisionModal({ isOpen: false, appId: '', farmName: '', notes: '' })}
        >
          <div
            className="relative max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-amber-700">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center font-bold">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900">Request KYC Revision</h3>
                <p className="text-xs text-gray-500">{revisionModal.farmName}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              The applicant will be alerted with these notes and guided to re-submit clearer identification or valid farm documentation.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Revision Instructions & Feedback Notes
              </label>
              <textarea
                required
                className="input-field text-xs w-full min-h-[90px]"
                placeholder="e.g. The photo of your government ID is blurry and cropped. Please provide an uncropped government ID and valid Barangay clearance."
                value={revisionModal.notes}
                onChange={(e) => setRevisionModal((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRevisionModal({ isOpen: false, appId: '', farmName: '', notes: '' })}
                className="btn-outline text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevisionRequest}
                className="py-2 px-4 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors"
              >
                Send Revision Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Moderate Product Modal */}
      {modProductModal.isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setModProductModal({ isOpen: false, product: null, action: 'flag', reason: '' })}
        >
          <div
            className="relative max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-bold text-base text-gray-900">
                {modProductModal.action === 'flag' ? 'Flag Listing for Review' : 'Delist Inappropriate Product'}
              </h3>
              <p className="text-xs text-gray-500">{modProductModal.product?.name}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Moderation Reason / Violation Details
              </label>
              <textarea
                required
                className="input-field text-xs w-full min-h-[80px]"
                placeholder="e.g. Unrealistic price per unit, prohibited substance, misleading crop imagery."
                value={modProductModal.reason}
                onChange={(e) => setModProductModal((prev) => ({ ...prev, reason: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModProductModal({ isOpen: false, product: null, action: 'flag', reason: '' })}
                className="btn-outline text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmProductModeration}
                className={`py-2 px-4 text-xs font-bold rounded-xl text-white transition-colors ${
                  modProductModal.action === 'flag' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Apply Moderation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Create/Edit Modal */}
      {categoryModal.isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setCategoryModal((prev) => ({ ...prev, isOpen: false }))}
        >
          <form
            onSubmit={handleSaveCategory}
            className="relative max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-bold text-base text-gray-900">
                {categoryModal.id ? 'Edit Category' : 'Create Agricultural Category'}
              </h3>
              <p className="text-xs text-gray-500">Categories organize listings across the marketplace.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Category Name</label>
                <input
                  required
                  type="text"
                  className="input-field text-xs"
                  placeholder="e.g. Farm Supplies"
                  value={categoryModal.name}
                  onChange={(e) => setCategoryModal((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  className="input-field text-xs min-h-[60px]"
                  placeholder="Brief overview of crops/produce in this department"
                  value={categoryModal.description}
                  onChange={(e) => setCategoryModal((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Icon Label</label>
                  <input
                    type="text"
                    className="input-field text-xs"
                    placeholder="e.g. Carrot, Leaf, Wheat"
                    value={categoryModal.icon}
                    onChange={(e) => setCategoryModal((prev) => ({ ...prev, icon: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    className="input-field text-xs"
                    placeholder="/images/farm.jpg"
                    value={categoryModal.imageUrl}
                    onChange={(e) => setCategoryModal((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCategoryModal((prev) => ({ ...prev, isOpen: false }))}
                className="btn-outline text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs py-2 px-4">
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Promotion Create/Edit Modal */}
      {promoModal.isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPromoModal((prev) => ({ ...prev, isOpen: false }))}
        >
          <form
            onSubmit={handleSavePromotion}
            className="relative max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-bold text-base text-gray-900">
                {promoModal.isEditing ? 'Edit Promotion Coupon' : 'Create Promotional Discount'}
              </h3>
              <p className="text-xs text-gray-500">Configure customer vouchers and seasonal discounts.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Voucher Code</label>
                <input
                  required
                  disabled={promoModal.isEditing}
                  type="text"
                  className="input-field text-xs uppercase font-mono"
                  placeholder="e.g. HARVEST2026"
                  value={promoModal.code}
                  onChange={(e) => setPromoModal((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Discount Type</label>
                  <select
                    className="input-field text-xs"
                    value={promoModal.type}
                    onChange={(e) =>
                      setPromoModal((prev) => ({
                        ...prev,
                        type: e.target.value as 'fixed' | 'percentage' | 'shipping',
                      }))
                    }
                  >
                    <option value="fixed">Fixed Peso (₱)</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="shipping">Free Shipping</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {promoModal.type === 'percentage' ? 'Percent Value (%)' : 'Amount (₱)'}
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="input-field text-xs"
                    value={promoModal.discount}
                    onChange={(e) => setPromoModal((prev) => ({ ...prev, discount: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Minimum Spend (₱)</label>
                <input
                  type="number"
                  min="0"
                  className="input-field text-xs"
                  value={promoModal.minSpend}
                  onChange={(e) => setPromoModal((prev) => ({ ...prev, minSpend: Number(e.target.value) }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  className="input-field text-xs"
                  placeholder="e.g. ₱50 off vegetables on orders over ₱300"
                  value={promoModal.description}
                  onChange={(e) => setPromoModal((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPromoModal((prev) => ({ ...prev, isOpen: false }))}
                className="btn-outline text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs py-2 px-4">
                Save Voucher
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default AdminDashboardPage
