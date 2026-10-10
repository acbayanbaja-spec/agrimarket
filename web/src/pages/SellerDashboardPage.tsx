import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { categories, stockLabel, stockTone, type Product } from '../data/catalog'
import { soccsksargenPlaces, findPlace } from '../data/locations'
import { useStore, type Order, type OrderItem } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import {
  Package,
  TrendingUp,
  Plus,
  Edit3,
  Trash2,
  Power,
  PowerOff,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  MessageSquare,
  Send,
  Truck,
  FileText,
  Search,
  Filter,
  BarChart3,
  Layers,
  Phone,
  MapPin,
  Sparkles,
  Share2,
  ShoppingBag,
  Check,
  Boxes,
} from 'lucide-react'
import { fileToDataUrl, formatPeso } from '../lib/utils'
import Seo from '../components/Seo'
import ProductImage from '../components/ProductImage'
import OrderTimeline from '../components/OrderTimeline'

type SellerTab = 'products' | 'orders' | 'messages' | 'analytics' | 'feed'

const SellerDashboardPage = () => {
  const { user } = useAuth()
  const {
    addProduct,
    updateProduct,
    updateProductStock,
    updateProductPrice,
    setProductAvailability,
    removeProduct,
    unlistProduct,
    myListings,
    sellerOrders,
    confirmOrder,
    markShipped,
    assignDriver,
    ridersList,
    updateOrderItemPrep,
    packOrder,
    addPost,
    messages,
    sendSms,
  } = useStore()

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<SellerTab>('products')

  // Product Search & Filter States
  const [productSearch, setProductSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all')

  // Order Search & Filter States
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')

  // Add Product Form State
  const [form, setForm] = useState({
    name: '',
    category: categories[0].name,
    price: 60,
    unit: 'kg',
    stock: 25,
    location: soccsksargenPlaces[0].label,
    image: '/images/farm.jpg',
    description: '',
    organic: false,
    tradeable: true,
    lat: soccsksargenPlaces[0].lat,
    lng: soccsksargenPlaces[0].lng,
    availabilityStatus: 'in_stock' as const,
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [listedNotice, setListedNotice] = useState(false)

  // Edit Product Modal State
  const [editModal, setEditModal] = useState<{
    isOpen: boolean
    product: Product | null
    name: string
    category: string
    price: number
    unit: string
    stock: number
    location: string
    image: string
    description: string
    organic: boolean
    tradeable: boolean
    availabilityStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'temporarily_unavailable'
    isUnlisted: boolean
  }>({
    isOpen: false,
    product: null,
    name: '',
    category: '',
    price: 0,
    unit: 'kg',
    stock: 0,
    location: '',
    image: '',
    description: '',
    organic: false,
    tradeable: false,
    availabilityStatus: 'in_stock',
    isUnlisted: false,
  })

  // Packing & Prep Modal / Drawer State
  const [packingModal, setPackingModal] = useState<{
    isOpen: boolean
    order: Order | null
    packingNotes: string
  }>({
    isOpen: false,
    order: null,
    packingNotes: '',
  })

  // Buyer Message Thread State
  const [selectedOrderForMessage, setSelectedOrderForMessage] = useState<string>(
    sellerOrders[0]?.id || ''
  )
  const [messageBody, setMessageBody] = useState('')
  const [messageNotice, setMessageNotice] = useState('')

  // Harvest Feed Post State
  const [postBody, setPostBody] = useState('')
  const [postCategory, setPostCategory] = useState(categories[0].name)
  const [postProduct, setPostProduct] = useState('')

  // ---------------------------------------------------------------------------
  // FILTERED LISTINGS
  // ---------------------------------------------------------------------------
  const filteredListings = useMemo(() => {
    return myListings.filter((product) => {
      if (categoryFilter !== 'All' && product.category !== categoryFilter) return false
      if (productSearch) {
        const q = productSearch.toLowerCase()
        const matchesName = product.name.toLowerCase().includes(q)
        const matchesDesc = product.description.toLowerCase().includes(q)
        const matchesLoc = product.location.toLowerCase().includes(q)
        if (!matchesName && !matchesDesc && !matchesLoc) return false
      }
      if (availabilityFilter !== 'all') {
        const isDeactivated = product.isUnlisted || product.isActive === false
        if (availabilityFilter === 'deactivated' && !isDeactivated) return false
        if (availabilityFilter === 'in_stock' && (isDeactivated || product.stock <= 20)) return false
        if (availabilityFilter === 'low_stock' && (isDeactivated || product.stock <= 0 || product.stock > 20)) return false
        if (availabilityFilter === 'out_of_stock' && (isDeactivated || product.stock > 0)) return false
      }
      return true
    })
  }, [myListings, categoryFilter, productSearch, availabilityFilter])

  // ---------------------------------------------------------------------------
  // FILTERED ORDERS
  // ---------------------------------------------------------------------------
  const filteredOrders = useMemo(() => {
    return sellerOrders.filter((order) => {
      if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) return false
      if (orderSearch) {
        const q = orderSearch.toLowerCase()
        const matchId = order.id.toLowerCase().includes(q)
        const matchBuyer = order.buyerName.toLowerCase().includes(q)
        const matchPhone = (order.buyerPhone || '').toLowerCase().includes(q)
        const matchItem = order.items.some((i) => i.name.toLowerCase().includes(q))
        if (!matchId && !matchBuyer && !matchPhone && !matchItem) return false
      }
      return true
    })
  }, [sellerOrders, orderStatusFilter, orderSearch])

  // ---------------------------------------------------------------------------
  // SALES PERFORMANCE & METRICS
  // ---------------------------------------------------------------------------
  const performance = useMemo(() => {
    const listingIds = new Set(myListings.map((p) => p.id))

    let totalRevenue = 0
    let totalUnitsSold = 0
    const productSalesMap = new Map<
      string,
      { product: Product; unitsSold: number; revenue: number; orderCount: number }
    >()

    // Initialize map
    myListings.forEach((p) => {
      productSalesMap.set(p.id, { product: p, unitsSold: 0, revenue: 0, orderCount: 0 })
    })

    sellerOrders.forEach((order) => {
      const isConfirmedOrDelivered = true
      order.items.forEach((item) => {
        const belongsToSeller =
          listingIds.has(item.productId) ||
          item.sellerUserId === user?.id ||
          (!user && (item.sellerUserId === 2 || item.sellerId === 'seller-1'))

        if (belongsToSeller) {
          const itemTotal = item.price * item.quantity
          if (isConfirmedOrDelivered) {
            totalRevenue += itemTotal
            totalUnitsSold += item.quantity
          }

          const record = productSalesMap.get(item.productId)
          if (record && isConfirmedOrDelivered) {
            record.unitsSold += item.quantity
            record.revenue += itemTotal
            record.orderCount += 1
          }
        }
      })
    })

    const deliveredOrdersCount = sellerOrders.filter((o) => o.status === 'Delivered').length
    const pendingOrdersCount = sellerOrders.filter((o) => o.status === 'Pending').length
    const fulfillmentRate =
      sellerOrders.length > 0 ? Math.round((deliveredOrdersCount / sellerOrders.length) * 100) : 100

    // Top selling products ranked by revenue
    const topProducts = Array.from(productSalesMap.values()).sort(
      (a, b) => b.revenue - a.revenue || b.unitsSold - a.unitsSold
    )

    // Stock availability breakdown
    const inStockCount = myListings.filter((p) => !p.isUnlisted && p.isActive !== false && p.stock > 20).length
    const lowStockCount = myListings.filter((p) => !p.isUnlisted && p.isActive !== false && p.stock > 0 && p.stock <= 20).length
    const outOfStockCount = myListings.filter((p) => !p.isUnlisted && p.isActive !== false && p.stock <= 0).length
    const deactivatedCount = myListings.filter((p) => p.isUnlisted || p.isActive === false).length

    return {
      totalRevenue,
      totalOrders: sellerOrders.length,
      deliveredOrdersCount,
      pendingOrdersCount,
      fulfillmentRate,
      totalUnitsSold,
      topProducts,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      deactivatedCount,
    }
  }, [myListings, sellerOrders, user])

  // Active Order for Message Thread
  const activeMessageOrder = useMemo(() => {
    return sellerOrders.find((o) => o.id === selectedOrderForMessage) || sellerOrders[0]
  }, [sellerOrders, selectedOrderForMessage])

  // Messages for Active Thread
  const threadMessages = useMemo(() => {
    if (!activeMessageOrder) return []
    return messages.filter((m) => m.orderId === activeMessageOrder.id)
  }, [messages, activeMessageOrder])

  // ---------------------------------------------------------------------------
  // HANDLERS: PRODUCTS & AVAILABILITY
  // ---------------------------------------------------------------------------
  const handleCreateProduct = (event: React.FormEvent) => {
    event.preventDefault()
    const place = findPlace(form.location)
    const listedProduct = addProduct({
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
      unit: form.unit,
      stock: Number(form.stock),
      location: form.location,
      image: form.image,
      description: form.description.trim(),
      organic: form.organic,
      tradeable: form.tradeable,
      lat: place.lat,
      lng: place.lng,
    })

    if (form.availabilityStatus !== 'in_stock') {
      setProductAvailability(listedProduct.id, form.availabilityStatus)
    }

    addPost({
      body: `Fresh farm harvest: ${listedProduct.name} from ${listedProduct.location}. ${listedProduct.description.slice(0, 140)}`,
      category: listedProduct.category,
      photos: [listedProduct.image],
      productId: listedProduct.id,
      productName: listedProduct.name,
    })

    setListedNotice(true)
    setShowAddForm(false)
    setForm((current) => ({ ...current, name: '', description: '' }))
    window.setTimeout(() => setListedNotice(false), 3000)
  }

  const openEditModal = (product: Product) => {
    setEditModal({
      isOpen: true,
      product,
      name: product.name,
      category: product.category,
      price: product.price,
      unit: product.unit || 'kg',
      stock: product.stock,
      location: product.location,
      image: product.image,
      description: product.description,
      organic: Boolean(product.organic),
      tradeable: product.tradeable ?? true,
      availabilityStatus: product.availabilityStatus || (product.stock > 0 ? 'in_stock' : 'out_of_stock'),
      isUnlisted: Boolean(product.isUnlisted || product.isActive === false),
    })
  }

  const handleSaveEditProduct = (event: React.FormEvent) => {
    event.preventDefault()
    if (!editModal.product) return

    updateProduct(editModal.product.id, {
      name: editModal.name.trim(),
      category: editModal.category,
      price: Number(editModal.price),
      unit: editModal.unit,
      stock: Number(editModal.stock),
      location: editModal.location,
      image: editModal.image,
      description: editModal.description.trim(),
      organic: editModal.organic,
      tradeable: editModal.tradeable,
      availabilityStatus: editModal.availabilityStatus,
      isUnlisted: editModal.isUnlisted,
      isActive: !editModal.isUnlisted,
    })

    setEditModal((prev) => ({ ...prev, isOpen: false, product: null }))
  }

  const handleToggleListingActive = (product: Product) => {
    const nextUnlisted = !(product.isUnlisted || product.isActive === false)
    unlistProduct(product.id, nextUnlisted)
  }

  // ---------------------------------------------------------------------------
  // HANDLERS: ORDER PREPARATION & PACKING
  // ---------------------------------------------------------------------------
  const openPackingDrawer = (order: Order) => {
    setPackingModal({
      isOpen: true,
      order,
      packingNotes: order.packingNotes || '',
    })
  }

  const handlePackAllAndReady = (orderId: string) => {
    packOrder(orderId, packingModal.packingNotes)
    setPackingModal((prev) => ({ ...prev, isOpen: false, order: null }))
  }

  // ---------------------------------------------------------------------------
  // HANDLERS: BUYER MESSAGES & NOTIFICATIONS
  // ---------------------------------------------------------------------------
  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault()
    if (!activeMessageOrder || !messageBody.trim()) return

    const sellerName = user ? `${user.firstName} ${user.lastName}` : 'Green Valley Farm'
    const sent = sendSms({
      orderId: activeMessageOrder.id,
      fromRole: 'seller',
      fromName: sellerName,
      fromUserId: user?.id || 2,
      toUserId: activeMessageOrder.userId,
      phone: activeMessageOrder.buyerPhone,
      body: messageBody.trim(),
    })

    setMessageNotice(
      activeMessageOrder.buyerPhone
        ? `Message sent to buyer (${activeMessageOrder.buyerPhone}).`
        : 'Message delivered to buyer in-app.'
    )
    setMessageBody('')
    window.setTimeout(() => setMessageNotice(''), 3000)
  }

  const handleSendQuickNote = (noteText: string) => {
    setMessageBody(noteText)
  }

  return (
    <div className="page-shell space-y-8">
      <Seo
        title="Seller Command Center"
        description="Comprehensive seller management: listing inventory, pricing, availability, order fulfillment, packing produce, and buyer messaging."
        path="/seller-dashboard"
      />

      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 animate-fade-up">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-bold font-display text-gray-900">Seller Dashboard</h1>
            <span className="chip bg-primary-100 text-primary-800 font-bold border border-primary-300">
              Harvest Merchant
            </span>
          </div>
          <p className="text-gray-600 mt-1.5 text-sm sm:text-base">
            Manage your harvest listings, set live prices & availability, inspect and pack orders, coordinate with buyers, and track sales revenue.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('products')
              setShowAddForm(true)
            }}
            className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Harvest Product
          </button>
        </div>
      </div>

      {listedNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <span>Harvest listing successfully published and synced across all buyer devices and the harvest feed!</span>
          </div>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Farm GMV',
            value: formatPeso(performance.totalRevenue),
            sub: `${performance.totalOrders} total orders received`,
            icon: TrendingUp,
            tone: 'bg-emerald-800 bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 border-emerald-500/30',
            accent: 'text-emerald-100',
            iconBg: 'bg-emerald-600/40 text-emerald-100',
          },
          {
            label: 'Active Listings',
            value: myListings.filter((p) => !p.isUnlisted && p.isActive !== false).length,
            sub: `${performance.deactivatedCount} deactivated/paused`,
            icon: Package,
            tone: 'bg-primary-900 bg-gradient-to-br from-primary-800 via-emerald-800 to-primary-950 border-primary-500/30',
            accent: 'text-emerald-100',
            iconBg: 'bg-primary-700/40 text-emerald-100',
          },
          {
            label: 'Orders Awaiting Fulfillment',
            value: performance.pendingOrdersCount,
            sub: `${performance.deliveredOrdersCount} orders completed`,
            icon: ShoppingBag,
            tone:
              performance.pendingOrdersCount > 0
                ? 'bg-amber-800 bg-gradient-to-br from-amber-700 via-amber-800 to-orange-900 border-amber-500/40'
                : 'bg-slate-800 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-slate-600/40',
            accent: performance.pendingOrdersCount > 0 ? 'text-amber-100' : 'text-slate-200',
            iconBg: performance.pendingOrdersCount > 0 ? 'bg-amber-600/40 text-amber-100' : 'bg-slate-700/50 text-slate-200',
          },
          {
            label: 'Produce Units Sold',
            value: `${performance.totalUnitsSold} units`,
            sub: `${performance.fulfillmentRate}% completion rate`,
            icon: Boxes,
            tone: 'bg-teal-900 bg-gradient-to-br from-teal-800 via-teal-900 to-soil-900 border-teal-500/30',
            accent: 'text-teal-100',
            iconBg: 'bg-teal-700/40 text-teal-100',
          },
        ].map((kpi, idx) => (
          <div
            key={kpi.label}
            className={`rounded-3xl p-5 ${kpi.tone} shadow-lg text-white border relative overflow-hidden animate-fade-up transition-transform hover:-translate-y-0.5 duration-200`}
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/5 blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className={`text-xs font-bold uppercase tracking-wider ${kpi.accent}`}>{kpi.label}</span>
              <div className={`p-2 rounded-xl backdrop-blur-sm ${kpi.iconBg}`}>
                <kpi.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white drop-shadow-sm relative z-10">
              {kpi.value}
            </p>
            <p className={`text-[11px] ${kpi.accent} opacity-90 mt-1.5 font-medium relative z-10`}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-gray-200 text-xs sm:text-sm font-semibold scrollbar-none">
        {[
          { id: 'products', label: 'Products & Inventory', icon: Package, count: myListings.length },
          { id: 'orders', label: 'Orders & Fulfillment', icon: ShoppingBag, count: sellerOrders.length },
          { id: 'messages', label: 'Buyer Communications', icon: MessageSquare, count: threadMessages.length || undefined },
          { id: 'analytics', label: 'Sales Performance', icon: BarChart3 },
          { id: 'feed', label: 'Harvest Feed Posts', icon: Share2 },
        ].map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as SellerTab)}
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
                    isActive ? 'bg-primary-800 text-primary-100' : 'bg-gray-100 text-gray-600'
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
          TAB 1: PRODUCTS & INVENTORY
          ========================================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Add Product Collapsible Panel */}
          {showAddForm && (
            <div className="bg-white rounded-3xl border border-primary-200/80 shadow-soft p-5 sm:p-6 space-y-4 animate-fade-down">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Add New Agricultural Listing</h2>
                  <p className="text-xs text-gray-500">Publish farm produce with custom price, stock, and immediate availability.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  Close Form
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Product Name</label>
                    <input
                      required
                      className="input-field text-xs"
                      placeholder="e.g. Organic Red Tomatoes"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                    <select
                      className="input-field text-xs"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      {categories.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Price (₱) & Unit</label>
                    <div className="flex gap-2">
                      <input
                        required
                        type="number"
                        min={1}
                        className="input-field text-xs w-28"
                        placeholder="₱ Price"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      />
                      <input
                        required
                        className="input-field text-xs"
                        placeholder="Unit (e.g. kg, sack, crate)"
                        value={form.unit}
                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Initial Stock Quantity</label>
                    <input
                      required
                      type="number"
                      min={0}
                      className="input-field text-xs"
                      placeholder="Available stock"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Availability Status</label>
                    <select
                      className="input-field text-xs"
                      value={form.availabilityStatus}
                      onChange={(e) => setForm({ ...form, availabilityStatus: e.target.value as any })}
                    >
                      <option value="in_stock">🟢 In Stock</option>
                      <option value="low_stock">🟡 Low Stock</option>
                      <option value="out_of_stock">🔴 Out of Stock</option>
                      <option value="temporarily_unavailable">⚪ Temporarily Unavailable</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Farm / Harvest Location</label>
                    <select
                      className="input-field text-xs"
                      value={form.location}
                      onChange={(e) => {
                        const loc = e.target.value
                        const p = findPlace(loc)
                        setForm({ ...form, location: loc, lat: p.lat, lng: p.lng })
                      }}
                    >
                      {soccsksargenPlaces.map((pl) => (
                        <option key={pl.label} value={pl.label}>{pl.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Photo Upload / Photo URL</label>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="input-field text-xs py-1.5"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) setForm({ ...form, image: await fileToDataUrl(file) })
                        }}
                      />
                      <input
                        type="text"
                        className="input-field text-xs"
                        placeholder="Or image URL"
                        value={form.image}
                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Product Description</label>
                    <input
                      required
                      className="input-field text-xs"
                      placeholder="Describe freshness, harvest date, and produce grade"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.organic}
                        onChange={(e) => setForm({ ...form, organic: e.target.checked })}
                      />
                      <span>Certified Organic</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.tradeable}
                        onChange={(e) => setForm({ ...form, tradeable: e.target.checked })}
                      />
                      <span>Open for Barter / Trade</span>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="btn-outline py-2 px-4 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary py-2 px-5 text-xs font-bold">
                      Publish Harvest Listing
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Search, Filter, and Inventory Control Bar */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">My Product Catalog</h2>
                <p className="text-xs text-gray-500">
                  Control product prices, live inventory stock, availability labels, and listing active states.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search my harvests..."
                    className="input-field text-xs pl-8 py-1.5 w-44"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>

                <select
                  className="input-field text-xs py-1.5 w-32"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <select
                  className="input-field text-xs py-1.5 w-40"
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                >
                  <option value="all">All Availabilities</option>
                  <option value="in_stock">🟢 In Stock (&gt;20)</option>
                  <option value="low_stock">🟡 Low Stock (1-20)</option>
                  <option value="out_of_stock">🔴 Out of Stock (0)</option>
                  <option value="deactivated">⚪ Deactivated Listings</option>
                </select>

                {!showAddForm && (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="btn-primary py-1.5 px-3 text-xs font-bold inline-flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" /> New Product
                  </button>
                )}
              </div>
            </div>

            {filteredListings.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-xs space-y-2">
                <Package className="h-10 w-10 text-gray-300 mx-auto" />
                <p className="font-semibold text-gray-700">No product listings found.</p>
                <p>Publish your farm harvest above to start receiving buyer orders.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredListings.map((product) => {
                  const isDeactivated = product.isUnlisted || product.isActive === false
                  const curLabel = stockLabel(product.stock, product.availabilityStatus, product.isActive, product.isUnlisted)
                  const curTone = stockTone(product.stock, product.availabilityStatus, product.isActive, product.isUnlisted)

                  return (
                    <div
                      key={product.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-4 ${
                        isDeactivated
                          ? 'bg-gray-50/70 border-gray-200 opacity-75'
                          : 'bg-white border-gray-200/80 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-[240px]">
                        <ProductImage
                          src={product.image}
                          alt={product.name}
                          className="h-16 w-16 rounded-2xl object-cover border border-gray-100 flex-shrink-0"
                        />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              to={`/products/${product.id}`}
                              className="font-bold text-sm text-gray-900 hover:text-primary-700 transition"
                            >
                              {product.name}
                            </Link>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {product.category}
                            </span>
                            {product.organic && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Organic
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-500 line-clamp-1">{product.description}</p>
                          <p className="text-xs text-gray-400">
                            {product.location} · {product.rating}★ ({product.reviews} reviews)
                          </p>
                        </div>
                      </div>

                      {/* Pricing & Stock Stats */}
                      <div className="flex items-center gap-6">
                        <div className="text-right sm:text-left">
                          <p className="text-base font-extrabold text-primary-800">
                            {formatPeso(product.price)}
                            <span className="text-xs font-normal text-gray-500"> / {product.unit || 'kg'}</span>
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${curTone}`}>
                              {curLabel}
                            </span>
                            <span className="text-xs font-semibold text-gray-700">
                              ({product.stock} {product.unit || 'kg'} in stock)
                            </span>
                          </div>
                        </div>

                        {/* Availability Selector & Quick Stock Actions */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Set Availability:
                          </label>
                          <select
                            className="input-field text-xs py-1 px-2 font-semibold w-36 bg-gray-50"
                            value={
                              isDeactivated
                                ? 'temporarily_unavailable'
                                : product.availabilityStatus || (product.stock > 20 ? 'in_stock' : product.stock > 0 ? 'low_stock' : 'out_of_stock')
                            }
                            onChange={(e) => setProductAvailability(product.id, e.target.value as any)}
                          >
                            <option value="in_stock">🟢 In Stock</option>
                            <option value="low_stock">🟡 Low Stock</option>
                            <option value="out_of_stock">🔴 Out of Stock</option>
                            <option value="temporarily_unavailable">⚪ Unavailable</option>
                          </select>
                        </div>

                        {/* Stock Bumpers */}
                        <div className="flex flex-col gap-1 items-center">
                          <span className="text-[10px] font-bold text-gray-400">Adjust Qty:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700"
                              title="Decrease stock by 5"
                              onClick={() => updateProductStock(product.id, Math.max(0, product.stock - 5))}
                            >
                              −5
                            </button>
                            <button
                              type="button"
                              className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700"
                              title="Increase stock by 5"
                              onClick={() => updateProductStock(product.id, product.stock + 5)}
                            >
                              +5
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Management Controls */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleListingActive(product)}
                          className={`p-2 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition ${
                            isDeactivated
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title={isDeactivated ? 'Reactivate listing' : 'Deactivate / hide from buyers'}
                        >
                          {isDeactivated ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                          <span className="hidden sm:inline">{isDeactivated ? 'Activate' : 'Deactivate'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className="btn-outline py-2 px-3 text-xs font-bold inline-flex items-center gap-1 shadow-sm"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove "${product.name}"?`)) {
                              removeProduct(product.id)
                            }
                          }}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Listing"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: ORDERS & FULFILLMENT (PACK & PREPARE)
          ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-5 sm:p-6 space-y-5 animate-fade-up">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Incoming Harvest Orders</h2>
                <p className="text-xs text-gray-500">
                  Inspect produce, prepare crates with moisture packaging, confirm harvest packing, and assign SOCCSKSARGEN riders.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search buyer or order..."
                    className="input-field text-xs pl-8 py-1.5 w-48"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />
                </div>

                <select
                  className="input-field text-xs py-1.5 w-36"
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending Confirmation</option>
                  <option value="Confirmed">Confirmed / Packed</option>
                  <option value="Shipped">Shipped / En Route</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-xs space-y-2">
                <ShoppingBag className="h-10 w-10 text-gray-300 mx-auto" />
                <p className="font-semibold text-gray-700">No orders match the current filter.</p>
                <p>When buyers purchase your farm listings, their orders will appear here for packing and dispatch.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const myListingIds = new Set(myListings.map((p) => p.id))
                  const myHarvestItems = order.items.filter(
                    (it) =>
                      myListingIds.has(it.productId) ||
                      it.sellerUserId === user?.id ||
                      (!user && (it.sellerUserId === 2 || it.sellerId === 'seller-1'))
                  )

                  const allMyItemsPacked = myHarvestItems.every((it) => it.prepStatus === 'packed')
                  const anyMyItemsPacking = myHarvestItems.some((it) => it.prepStatus === 'packing' || it.prepStatus === 'packed')

                  return (
                    <div
                      key={order.id}
                      className="p-5 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-4 hover:border-primary-200 transition"
                    >
                      {/* Order Header */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-sm text-gray-900">{order.id}</span>
                            <span className="text-sm font-semibold text-gray-700">· {order.buyerName}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                order.status === 'Pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : order.status === 'Confirmed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : order.status === 'Shipped'
                                  ? 'bg-primary-100 text-primary-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {order.buyerPhone || 'No contact provided'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              {order.address}
                            </span>
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Total & Quick Action */}
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="font-extrabold text-primary-800 text-base">{formatPeso(order.total)}</p>
                            <p className="text-[11px] text-gray-500 font-medium">{order.payment}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrderForMessage(order.id)
                              setActiveTab('messages')
                            }}
                            className="btn-outline py-1.5 px-3 text-xs font-bold inline-flex items-center gap-1 shadow-sm ml-2 bg-white"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-primary-700" />
                            <span>Message Buyer</span>
                          </button>
                        </div>
                      </div>

                      {/* Items Packing & Produce Inspection Panel */}
                      <div className="bg-white rounded-xl p-4 border border-gray-200/70 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <Boxes className="h-4 w-4 text-emerald-700" />
                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                              Your Harvest Produce & Packing Checklist:
                            </h3>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                allMyItemsPacked
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : anyMyItemsPacking
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {allMyItemsPacked ? '✓ All Packed & Inspected' : anyMyItemsPacking ? 'Packing in progress' : 'Awaiting packaging'}
                            </span>

                            <button
                              type="button"
                              onClick={() => openPackingDrawer(order)}
                              className="text-xs font-bold text-primary-700 hover:text-primary-800 hover:underline"
                            >
                              Edit Packing Notes
                            </button>
                          </div>
                        </div>

                        {/* Produce Item Rows */}
                        <div className="space-y-2">
                          {myHarvestItems.map((item) => (
                            <div
                              key={item.productId}
                              className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <ProductImage
                                  src={item.image}
                                  alt={item.name}
                                  className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                                />
                                <div>
                                  <p className="font-bold text-gray-900">
                                    {item.name} <span className="text-primary-700">({item.quantity}×)</span>
                                  </p>
                                  <p className="text-[11px] text-gray-500">
                                    {formatPeso(item.price)} each · Subtotal: {formatPeso(item.price * item.quantity)}
                                  </p>
                                  {item.prepNotes && (
                                    <p className="text-[10px] text-emerald-700 italic">Note: {item.prepNotes}</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-semibold text-gray-500 mr-1">Status:</span>
                                <button
                                  type="button"
                                  onClick={() => updateOrderItemPrep(order.id, item.productId, 'unpacked')}
                                  className={`px-2 py-1 rounded-lg font-bold text-[11px] transition ${
                                    item.prepStatus === 'unpacked' || !item.prepStatus
                                      ? 'bg-gray-200 text-gray-800'
                                      : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100'
                                  }`}
                                >
                                  Unpacked
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateOrderItemPrep(order.id, item.productId, 'packing')}
                                  className={`px-2 py-1 rounded-lg font-bold text-[11px] transition ${
                                    item.prepStatus === 'packing'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-white border border-gray-200 text-gray-500 hover:bg-amber-50'
                                  }`}
                                >
                                  Packing
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateOrderItemPrep(order.id, item.productId, 'packed')}
                                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition inline-flex items-center gap-1 ${
                                    item.prepStatus === 'packed'
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'bg-white border border-gray-200 text-gray-500 hover:bg-emerald-50'
                                  }`}
                                >
                                  <Check className="h-3 w-3" /> Packed & Ready
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {order.packingNotes && (
                          <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                            <span><strong>Crate / Packaging Details:</strong> {order.packingNotes}</span>
                          </div>
                        )}
                      </div>

                      {/* Delivery Rider Assignment & Dispatch */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="text-xs font-bold text-gray-600">Assign Delivery Courier:</label>
                          <select
                            className="input-field text-xs py-1.5 w-56 font-semibold"
                            value={order.driverId || ''}
                            onChange={(e) => assignDriver(order.id, Number(e.target.value))}
                          >
                            <option value="">Select rider from fleet...</option>
                            {ridersList.map((r) => (
                              <option key={r.id} value={r.id}>
                                🛵 {r.first_name} {r.last_name} ({r.phone || 'on duty'})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          {!allMyItemsPacked && (
                            <button
                              type="button"
                              className="btn-outline py-2 px-3 text-xs font-bold text-emerald-800 border-emerald-300 hover:bg-emerald-50 inline-flex items-center gap-1"
                              onClick={() => handlePackAllAndReady(order.id)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Pack All Produce</span>
                            </button>
                          )}

                          {order.status === 'Pending' && (
                            <button
                              type="button"
                              className="btn-primary py-2 px-4 shadow-sm text-xs font-bold"
                              onClick={() => confirmOrder(order.id, order.driverId || undefined)}
                            >
                              Confirm & Dispatch Rider
                            </button>
                          )}

                          {order.status === 'Confirmed' && (
                            <button
                              type="button"
                              className="btn-primary py-2 px-4 shadow-sm text-xs font-bold inline-flex items-center gap-1"
                              onClick={() => markShipped(order.id)}
                            >
                              <Truck className="h-3.5 w-3.5" />
                              <span>Rider Collected · Mark Shipped</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <OrderTimeline status={order.status} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: BUYER COMMUNICATIONS
          ========================================================================= */}
      {activeTab === 'messages' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-5 sm:p-6 space-y-5 animate-fade-up">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Direct Buyer Communications & Order Threads</h2>
                <p className="text-xs text-gray-500">
                  Answer questions, coordinate drop-off timing, and inform customers about produce harvesting and packing.
                </p>
              </div>

              {sellerOrders.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-600">Select Order Thread:</label>
                  <select
                    className="input-field text-xs py-1.5 w-60 font-semibold"
                    value={selectedOrderForMessage}
                    onChange={(e) => setSelectedOrderForMessage(e.target.value)}
                  >
                    {sellerOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.id} · {o.buyerName} ({o.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {sellerOrders.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-xs space-y-2">
                <MessageSquare className="h-10 w-10 text-gray-300 mx-auto" />
                <p className="font-semibold text-gray-700">No buyer messages yet.</p>
                <p>When buyers order your farm produce, a dedicated messaging channel is created here.</p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column: Buyer & Order Info Card */}
                {activeMessageOrder && (
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 space-y-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700">Order Context</span>
                      <h3 className="font-bold text-base text-gray-900">{activeMessageOrder.id}</h3>
                      <p className="text-xs text-gray-500">Status: <strong className="text-primary-800">{activeMessageOrder.status}</strong></p>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-800">{activeMessageOrder.buyerName}</p>
                          <p className="text-gray-500">{activeMessageOrder.buyerPhone || 'Mobile not provided'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-800">Drop-off Destination</p>
                          <p className="text-gray-500">{activeMessageOrder.address}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-200 space-y-1">
                        <p className="font-semibold text-gray-700">Produce Ordered:</p>
                        {activeMessageOrder.items.map((it) => (
                          <p key={it.productId} className="text-gray-600 flex justify-between">
                            <span>{it.name} ({it.quantity}×)</span>
                            <span className="font-bold">{formatPeso(it.price * it.quantity)}</span>
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-[11px] font-semibold text-gray-500 mb-2">Quick Message Templates:</p>
                      <div className="flex flex-col gap-1.5">
                        {[
                          '🌱 Your produce was picked fresh from the farm this morning.',
                          '📦 Produce is inspected, packed in ventilated crates, and ready for dispatch.',
                          '🛵 Rider is en route to collect your package from our farm hub.',
                          '📍 Please ensure gate is accessible and landmark is visible for delivery.',
                        ].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => handleSendQuickNote(chip)}
                            className="text-left text-[11px] p-2 rounded-lg bg-white hover:bg-emerald-50 text-gray-700 hover:text-emerald-900 border border-gray-200 transition"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Right Column: Chat Stream & Message Input */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-200/70 min-h-[300px] max-h-[380px] overflow-y-auto space-y-3">
                    {threadMessages.length === 0 ? (
                      <div className="h-full py-16 text-center text-xs text-gray-400 space-y-2">
                        <MessageSquare className="h-8 w-8 mx-auto text-gray-300" />
                        <p>No messages sent yet for this order.</p>
                        <p>Use the input below to send harvest updates or coordinate drop-off details.</p>
                      </div>
                    ) : (
                      threadMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3.5 rounded-2xl max-w-lg text-xs space-y-1 ${
                            msg.fromRole === 'seller'
                              ? 'ml-auto bg-emerald-700 text-white rounded-br-none shadow-sm'
                              : msg.fromRole === 'delivery'
                              ? 'bg-blue-50 text-blue-900 border border-blue-200 rounded-bl-none'
                              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none shadow-sm'
                          }`}
                        >
                          <div
                            className={`flex items-center justify-between text-[10px] font-bold ${
                              msg.fromRole === 'seller' ? 'text-emerald-200' : 'text-gray-500'
                            }`}
                          >
                            <span className="uppercase">
                              {msg.fromRole === 'seller' ? 'You (Seller)' : msg.fromRole === 'delivery' ? '🛵 Rider' : 'Buyer'}
                            </span>
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="leading-relaxed font-medium">{msg.body}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {messageNotice && (
                    <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 animate-fade-in">
                      {messageNotice}
                    </p>
                  )}

                  <form onSubmit={handleSendMessage} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        required
                        type="text"
                        className="input-field text-xs py-2.5"
                        placeholder="Type update or answer buyer questions..."
                        value={messageBody}
                        onChange={(e) => setMessageBody(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="btn-primary py-2.5 px-5 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                        disabled={!messageBody.trim()}
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Send</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: SALES PERFORMANCE & ANALYTICS
          ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-5 sm:p-6 space-y-6 animate-fade-up">
            <div className="pb-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Farm Sales & Product Performance</h2>
              <p className="text-xs text-gray-500">
                Monitor sales volume, revenue generated per crop, fulfillment metrics, and current inventory health.
              </p>
            </div>

            {/* Inventory Health Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">In Stock Products</span>
                <p className="text-2xl font-extrabold text-emerald-900 mt-1">{performance.inStockCount}</p>
                <p className="text-[11px] text-emerald-700">Healthy stock levels (&gt;20)</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Low Stock Warnings</span>
                <p className="text-2xl font-extrabold text-amber-900 mt-1">{performance.lowStockCount}</p>
                <p className="text-[11px] text-amber-700">Needs restock (1-20 units)</p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80">
                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Out of Stock</span>
                <p className="text-2xl font-extrabold text-rose-900 mt-1">{performance.outOfStockCount}</p>
                <p className="text-[11px] text-rose-700">0 units available</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Deactivated / Paused</span>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">{performance.deactivatedCount}</p>
                <p className="text-[11px] text-gray-500">Hidden from marketplace</p>
              </div>
            </div>

            {/* Top Performing Produce Products Table */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-gray-900">Product Performance Ranking</h3>
              {performance.topProducts.length === 0 ? (
                <p className="text-xs text-gray-500 py-4">No product sales recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-400 uppercase font-bold text-[10px]">
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Price</th>
                        <th className="py-2.5 px-3">Units Sold</th>
                        <th className="py-2.5 px-3">Revenue Generated</th>
                        <th className="py-2.5 px-3">Current Stock</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {performance.topProducts.map((row, idx) => (
                        <tr key={row.product.id} className="hover:bg-gray-50 transition">
                          <td className="py-3 px-3 font-semibold text-gray-900 flex items-center gap-2">
                            <span className="font-bold text-gray-400 w-4">{idx + 1}.</span>
                            <ProductImage
                              src={row.product.image}
                              alt=""
                              className="h-8 w-8 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                            />
                            <span>{row.product.name}</span>
                          </td>
                          <td className="py-3 px-3 text-gray-600">{row.product.category}</td>
                          <td className="py-3 px-3 font-bold text-gray-800">
                            {formatPeso(row.product.price)} / {row.product.unit || 'kg'}
                          </td>
                          <td className="py-3 px-3 font-extrabold text-primary-800">{row.unitsSold} units</td>
                          <td className="py-3 px-3 font-extrabold text-emerald-800">{formatPeso(row.revenue)}</td>
                          <td className="py-3 px-3 font-semibold text-gray-700">{row.product.stock} {row.product.unit || 'kg'}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stockTone(
                                row.product.stock,
                                row.product.availabilityStatus,
                                row.product.isActive,
                                row.product.isUnlisted
                              )}`}
                            >
                              {stockLabel(
                                row.product.stock,
                                row.product.availabilityStatus,
                                row.product.isActive,
                                row.product.isUnlisted
                              )}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: HARVEST FEED POSTS
          ========================================================================= */}
      {activeTab === 'feed' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-5 sm:p-6 space-y-4 animate-fade-up max-w-2xl">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Post Farm Updates to Harvest Feed</h2>
              <p className="text-xs text-gray-500">
                Share what’s harvesting today with buyers across Region XII. Tag your listing so buyers can order in 1-click.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!postBody.trim()) return
                const tagged = myListings.find((item) => item.id === postProduct)
                addPost({
                  body: postBody.trim(),
                  category: postCategory,
                  photos: [tagged?.image || '/images/farm.jpg'],
                  productId: tagged?.id,
                  productName: tagged?.name,
                })
                setPostBody('')
                alert('Harvest update shared to the feed!')
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Produce Department</label>
                <select
                  className="input-field text-xs"
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tag Product Listing (Optional)</label>
                <select
                  className="input-field text-xs"
                  value={postProduct}
                  onChange={(e) => setPostProduct(e.target.value)}
                >
                  <option value="">Choose an active harvest listing...</option>
                  {myListings.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({formatPeso(p.price)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Farm Update Note</label>
                <textarea
                  required
                  rows={3}
                  className="input-field text-xs"
                  placeholder="What was harvested fresh this morning? Mention sweetness, quality, or special discounts!"
                  value={postBody}
                  onChange={(e) => setPostBody(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <button type="submit" className="btn-primary py-2 px-5 text-xs font-bold">
                  Share to Harvest Feed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: EDIT PRODUCT LISTING
          ========================================================================= */}
      {editModal.isOpen && editModal.product && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
        >
          <form
            onSubmit={handleSaveEditProduct}
            className="relative max-w-lg w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-base text-gray-900">Edit Product Listing</h3>
                <p className="text-xs text-gray-500">Update pricing, description, stock, and availability status.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Product Name</label>
                <input
                  required
                  type="text"
                  className="input-field text-xs"
                  value={editModal.name}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <select
                    className="input-field text-xs"
                    value={editModal.category}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, category: e.target.value }))}
                  >
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Price (₱) & Unit</label>
                  <div className="flex gap-1.5">
                    <input
                      required
                      type="number"
                      min={1}
                      className="input-field text-xs w-24"
                      value={editModal.price}
                      onChange={(e) => setEditModal((prev) => ({ ...prev, price: Number(e.target.value) }))}
                    />
                    <input
                      required
                      type="text"
                      className="input-field text-xs"
                      value={editModal.unit}
                      onChange={(e) => setEditModal((prev) => ({ ...prev, unit: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    required
                    type="number"
                    min={0}
                    className="input-field text-xs"
                    value={editModal.stock}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Availability Status</label>
                  <select
                    className="input-field text-xs font-semibold"
                    value={editModal.availabilityStatus}
                    onChange={(e) =>
                      setEditModal((prev) => ({
                        ...prev,
                        availabilityStatus: e.target.value as any,
                      }))
                    }
                  >
                    <option value="in_stock">🟢 In Stock</option>
                    <option value="low_stock">🟡 Low Stock</option>
                    <option value="out_of_stock">🔴 Out of Stock</option>
                    <option value="temporarily_unavailable">⚪ Temporarily Unavailable</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  className="input-field text-xs"
                  value={editModal.description}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Photo URL / Upload</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input-field text-xs"
                    value={editModal.image}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, image: e.target.value }))}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="input-field text-xs py-1.5 w-40"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) setEditModal((prev) => ({ ...prev, image: '' }))
                      if (file) {
                        const url = await fileToDataUrl(file)
                        setEditModal((prev) => ({ ...prev, image: url }))
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editModal.organic}
                      onChange={(e) => setEditModal((prev) => ({ ...prev, organic: e.target.checked }))}
                    />
                    <span>Organic</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editModal.tradeable}
                      onChange={(e) => setEditModal((prev) => ({ ...prev, tradeable: e.target.checked }))}
                    />
                    <span>Tradeable</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-amber-700">
                    <input
                      type="checkbox"
                      checked={editModal.isUnlisted}
                      onChange={(e) => setEditModal((prev) => ({ ...prev, isUnlisted: e.target.checked }))}
                    />
                    <span>Deactivate (Hide)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
                className="btn-outline text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs py-2 px-5 font-bold">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: PACKING & PREPARATION DETAILS
          ========================================================================= */}
      {packingModal.isOpen && packingModal.order && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPackingModal((prev) => ({ ...prev, isOpen: false }))}
        >
          <div
            className="relative max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-bold text-base text-gray-900">
                Packaging & Inspection Notes ({packingModal.order.id})
              </h3>
              <p className="text-xs text-gray-500">Record crate specifications, freshness seal, or insulation notes.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Packaging Specifications</label>
                <textarea
                  rows={3}
                  className="input-field text-xs"
                  placeholder="e.g. Packed in ventilated wooden crate #2 with moisture absorbent lining and ice packs."
                  value={packingModal.packingNotes}
                  onChange={(e) => setPackingModal((prev) => ({ ...prev, packingNotes: e.target.value }))}
                />
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600 space-y-1">
                <p className="font-semibold text-gray-800">Standard Produce Handling:</p>
                <p>• Remove damaged leaves or soil residue before packing.</p>
                <p>• Secure with breathable twine or food-grade crate covers.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setPackingModal((prev) => ({ ...prev, isOpen: false }))}
                className="btn-outline text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handlePackAllAndReady(packingModal.order!.id)}
                className="btn-primary text-xs py-2 px-5 font-bold inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Mark All Packed & Ready</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SellerDashboardPage
