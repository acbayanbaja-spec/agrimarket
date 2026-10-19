import React, { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Scale,
  Sparkles,
  Search,
  Filter,
  Plus,
  Package,
  Layers,
  MapPin,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Coins,
  Send,
  MessageSquare,
  RefreshCw,
  Info,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import { useStore, type TradeOffer } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { categories, type Product } from '../data/catalog'
import Seo from '../components/Seo'
import ProductImage from '../components/ProductImage'
import { formatPeso } from '../lib/utils'

const TradesPage = () => {
  const { products, trades, offerTrade, respondTrade, myListings } = useStore()
  const { isAuthenticated, hasRole, user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const isSeller = hasRole('seller') || hasRole('admin')

  // Selected want query from URL
  const wantParam = params.get('want') || ''

  // Form State: You Offer (from myListings)
  const [selectedOfferProductId, setSelectedOfferProductId] = useState<string>(() => {
    return myListings[0]?.id || ''
  })
  const [offerQuantity, setOfferQuantity] = useState<number>(10)

  // Form State: What I Want (from all marketplace products)
  const [wantCategoryFilter, setWantCategoryFilter] = useState<string>('All')
  const [wantSearchQuery, setWantSearchQuery] = useState<string>('')
  const [selectedWantProductId, setSelectedWantProductId] = useState<string>(() => {
    if (wantParam) return wantParam
    const tradableOther = products.find((p) => p.tradeable && !myListings.some((m) => m.id === p.id))
    return tradableOther?.id || products.find((p) => !myListings.some((m) => m.id === p.id))?.id || ''
  })
  const [wantQuantity, setWantQuantity] = useState<number>(10)

  // Barter settlement and logistics
  const [cashOffsetMode, setCashOffsetMode] = useState<'even' | 'pay_offset' | 'request_offset'>('even')
  const [customCashOffset, setCustomCashOffset] = useState<number>(0)
  const [note, setNote] = useState<string>('Even barter exchange. Both parties inspect produce upon farm gate exchange.')

  // UI Tabs & Filters
  const [activeTab, setActiveTab] = useState<'create' | 'incoming' | 'outgoing' | 'all'>('create')
  const [tradeFilterCategory, setTradeFilterCategory] = useState<string>('All')

  // Counter Offer Modal State
  const [counterModal, setCounterModal] = useState<{
    isOpen: boolean
    trade: TradeOffer | null
    quantity: number
    cashOffset: number
    note: string
  }>({
    isOpen: false,
    trade: null,
    quantity: 1,
    cashOffset: 0,
    note: '',
  })

  // Toast feedback
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  // Selected Offer Product Object
  const selectedOfferProduct = useMemo(() => {
    return myListings.find((p) => p.id === selectedOfferProductId) || myListings[0] || null
  }, [myListings, selectedOfferProductId])

  // Available Products for "What I Want" (excludes current seller's own products)
  const availableWantProducts = useMemo(() => {
    const myIds = new Set(myListings.map((p) => p.id))
    return products.filter((p) => {
      // Exclude seller's own listings
      if (myIds.has(p.id)) return false
      if (user && (p.sellerUserId === user.id || p.sellerId === `seller-${user.id}` || p.sellerId === `user-${user.id}`)) return false

      // Category filter
      if (wantCategoryFilter !== 'All' && p.category !== wantCategoryFilter) return false

      // Search query
      if (wantSearchQuery.trim()) {
        const q = wantSearchQuery.toLowerCase()
        const matchName = p.name.toLowerCase().includes(q)
        const matchSeller = p.seller.toLowerCase().includes(q)
        const matchLoc = p.location.toLowerCase().includes(q)
        if (!matchName && !matchSeller && !matchLoc) return false
      }

      return true
    })
  }, [products, myListings, user, wantCategoryFilter, wantSearchQuery])

  // Selected Want Product Object
  const selectedWantProduct = useMemo(() => {
    return (
      availableWantProducts.find((p) => p.id === selectedWantProductId) ||
      products.find((p) => p.id === selectedWantProductId) ||
      availableWantProducts[0] ||
      null
    )
  }, [availableWantProducts, selectedWantProductId, products])

  // Calculations for Fair-Value Barter Valuation
  const offerTotalValue = useMemo(() => {
    if (!selectedOfferProduct) return 0
    return Math.round(selectedOfferProduct.price * Math.max(1, offerQuantity))
  }, [selectedOfferProduct, offerQuantity])

  const wantTotalValue = useMemo(() => {
    if (!selectedWantProduct) return 0
    return Math.round(selectedWantProduct.price * Math.max(1, wantQuantity))
  }, [selectedWantProduct, wantQuantity])

  const rawDifference = wantTotalValue - offerTotalValue // positive = wanted is more expensive

  // Computed final cash offset (positive = proposer pays extra cash to balance; negative = proposer requests cash)
  const calculatedCashOffset = useMemo(() => {
    if (cashOffsetMode === 'even') return 0
    if (cashOffsetMode === 'pay_offset') return customCashOffset || Math.max(0, rawDifference)
    if (cashOffsetMode === 'request_offset') return -(customCashOffset || Math.max(0, -rawDifference))
    return 0
  }, [cashOffsetMode, customCashOffset, rawDifference])

  // Trades categorization
  const myIncomingTrades = useMemo(() => {
    if (!user) return []
    const myProductIds = new Set(myListings.map((p) => p.id))
    return trades.filter((t) => {
      return (
        t.toSellerId === `seller-${user.id}` ||
        t.toSellerId === `user-${user.id}` ||
        myProductIds.has(t.toProductId) ||
        ((user.email === 'seller@agrimarket.com' || user.email === 'seller.vegetables@agrimarket.com') && t.toSellerId === 'seller-2')
      )
    })
  }, [trades, user, myListings])

  const myOutgoingTrades = useMemo(() => {
    if (!user) return []
    return trades.filter((t) => t.fromUserId === user.id)
  }, [trades, user])

  // Handle Trade Proposal Submit
  const handleOfferSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedOfferProduct || !selectedWantProduct) return

    offerTrade({
      fromProductId: selectedOfferProduct.id,
      fromProductName: selectedOfferProduct.name,
      fromProductImage: selectedOfferProduct.image,
      offerQuantity: Math.max(1, offerQuantity),
      offerUnit: selectedOfferProduct.unit || 'kg',
      offerValue: offerTotalValue,
      toSellerId: selectedWantProduct.sellerId,
      toSellerName: selectedWantProduct.seller,
      toProductId: selectedWantProduct.id,
      toProductName: selectedWantProduct.name,
      toProductImage: selectedWantProduct.image,
      wantQuantity: Math.max(1, wantQuantity),
      wantUnit: selectedWantProduct.unit || 'kg',
      wantValue: wantTotalValue,
      cashOffset: calculatedCashOffset,
      note: note.trim() || 'Even barter exchange agreed between growers.',
    })

    setSubmitSuccess(`Trade proposal sent to ${selectedWantProduct.seller}!`)
    setActiveTab('outgoing')
    window.setTimeout(() => setSubmitSuccess(null), 4000)
  }

  // Handle Counter Offer Submit
  const handleCounterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!counterModal.trade) return

    respondTrade(counterModal.trade.id, 'Countered', {
      counterQuantity: counterModal.quantity,
      counterCashOffset: counterModal.cashOffset,
      counterNote: counterModal.note,
    })

    setCounterModal({ isOpen: false, trade: null, quantity: 1, cashOffset: 0, note: '' })
    setSubmitSuccess('Counter-offer submitted to trading partner!')
    window.setTimeout(() => setSubmitSuccess(null), 4000)
  }

  // ---------------------------------------------------------------------------
  // AUTHENTICATION GATE: User Must Be Logged In
  // ---------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="page-shell max-w-4xl mx-auto py-12 px-4 sm:px-6">
        <Seo
          title="Producer Barter Tradeboard"
          description="Direct agricultural harvest barter exchange between registered SOCCSKSARGEN growers."
          path="/trades"
        />
        <div className="card p-8 sm:p-12 text-center bg-white border border-gray-200/90 shadow-xl rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 via-primary-600 to-amber-500" />
          <div className="mx-auto w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-6 shadow-inner">
            <ArrowRightLeft className="h-10 w-10 animate-pulse" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 mb-4">
            <ShieldCheck className="h-4 w-4" />
            Verified Producer & Seller Network Only
          </span>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            AgriMarket Regional Barter & Tradeboard
          </h1>

          <p className="text-gray-600 max-w-xl mx-auto text-sm sm:text-base leading-relaxed mb-8">
            The Tradeboard is a specialized producer-to-producer barter exchange across Region 12
            (SOCCSKSARGEN). Registered farmers and food producers exchange surplus crates, grains, and harvests directly
            without cash intermediaries.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left mb-8">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <Scale className="h-6 w-6 text-primary-700 mb-2" />
              <h4 className="font-bold text-xs text-gray-900">Fair-Value Appraisal</h4>
              <p className="text-[11px] text-gray-500 mt-1">Automatic real-time market value appraisal based on farmgate price indexes.</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <Package className="h-6 w-6 text-emerald-700 mb-2" />
              <h4 className="font-bold text-xs text-gray-900">Producer Catalog Lock</h4>
              <p className="text-[11px] text-gray-500 mt-1">Sellers offer produce verified in their inventory and in-stock listings.</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <Coins className="h-6 w-6 text-amber-700 mb-2" />
              <h4 className="font-bold text-xs text-gray-900">Cash Top-up Balancing</h4>
              <p className="text-[11px] text-gray-500 mt-1">Easily balance uneven weights with optional cash differentials.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/login?redirect=/trades"
              className="btn-primary py-3 px-8 text-sm font-bold w-full sm:w-auto shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5"
            >
              Sign In with Seller Account
            </Link>
            <Link
              to="/register?role=seller"
              className="btn-outline py-3 px-6 text-sm font-bold w-full sm:w-auto hover:bg-gray-50"
            >
              Register as Farmer / Producer
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // ROLE GATE: Must Be a Registered Seller or Admin
  // ---------------------------------------------------------------------------
  if (!isSeller) {
    return (
      <div className="page-shell max-w-3xl mx-auto py-12 px-4">
        <Seo title="Seller Account Required" description="Barter tradeboard is exclusive to registered producers." path="/trades" />
        <div className="card p-8 sm:p-10 text-center bg-white border border-amber-200/90 shadow-xl rounded-3xl">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-5">
            <AlertCircle className="h-8 w-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
            Producer / Seller Profile Required
          </h2>

          <p className="text-gray-600 max-w-lg mx-auto text-sm leading-relaxed mb-6">
            Your current account is registered as a <strong className="text-gray-900">Buyer</strong>. In order to propose and exchange harvest lots on the Tradeboard, you need a verified Seller / Producer profile with active harvest inventory.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/become-seller" className="btn-primary py-3 px-6 text-sm font-bold w-full sm:w-auto">
              Apply to Become a Seller
            </Link>
            <Link to="/marketplace" className="btn-outline py-3 px-6 text-sm font-bold w-full sm:w-auto">
              Return to Marketplace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // AUTHENTICATED SELLER TRADEBOARD VIEW
  // ---------------------------------------------------------------------------
  return (
    <div className="page-shell max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Seo
        title="Producer Barter Tradeboard"
        description="Swap harvests, seeds, and crops with other farms across Region 12."
        path="/trades"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-primary-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-sm text-emerald-200 border border-white/20">
              Region XII Barter Network
            </span>
            <span className="text-xs text-emerald-200">
              Logged in as <strong className="text-white">{user?.firstName} {user?.lastName}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Agricultural Barter & Harvest Tradeboard
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed max-w-2xl">
            Propose farm-to-farm crop trades using verified listings from your inventory.
            Browse all categories across SOCCSKSARGEN, match market valuations, and coordinate harvest exchanges.
          </p>
        </div>

        {/* Quick Tabs in Header */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/15">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-white text-primary-900 shadow-md scale-102'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Propose New Trade</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('incoming')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'incoming'
                ? 'bg-white text-primary-900 shadow-md scale-102'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            <span>Incoming Proposals</span>
            {myIncomingTrades.length > 0 && (
              <span className="bg-amber-400 text-gray-900 text-[10px] font-black rounded-full px-1.5 py-0.2">
                {myIncomingTrades.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('outgoing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'outgoing'
                ? 'bg-white text-primary-900 shadow-md scale-102'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>My Sent Offers</span>
            {myOutgoingTrades.length > 0 && (
              <span className="bg-white/30 text-white text-[10px] font-black rounded-full px-1.5 py-0.2">
                {myOutgoingTrades.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-white text-primary-900 shadow-md scale-102'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Community Trade Feed ({trades.length})</span>
          </button>
        </div>
      </div>

      {/* Success Notice Banner */}
      {submitSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center gap-3 animate-fade-in shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* TAB 1: CREATE TRADE PROPOSAL */}
      {activeTab === 'create' && (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Main Proposal Builder (8 Cols) */}
          <form onSubmit={handleOfferSubmit} className="lg:col-span-8 space-y-6">
            {/* Step 1: YOU OFFER (Strictly from seller's own listings) */}
            <div className="card p-6 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-base font-extrabold text-gray-900">
                    What You Offer (From Your Farm Inventory)
                  </h3>
                </div>
                <span className="text-xs font-bold text-gray-500">
                  {myListings.length} {myListings.length === 1 ? 'listing' : 'listings'} available
                </span>
              </div>

              {myListings.length === 0 ? (
                <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3">
                  <Package className="h-10 w-10 text-amber-600 mx-auto" />
                  <h4 className="font-bold text-sm text-amber-900">No Farm Listings Found</h4>
                  <p className="text-xs text-amber-800 max-w-md mx-auto">
                    You must have at least one active crop or harvest listed in your seller catalog to propose barter trades.
                  </p>
                  <Link to="/seller-dashboard" className="btn-primary inline-flex text-xs py-2 px-4 font-bold">
                    Go to Seller Dashboard to Add Listing
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-gray-700">Select which produce to trade:</label>
                  <div className="grid sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {myListings.map((p) => {
                      const isSelected = p.id === (selectedOfferProduct?.id || '')
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedOfferProductId(p.id)}
                          className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                            isSelected
                              ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xs'
                              : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                          }`}
                        >
                          <ProductImage
                            src={p.image}
                            alt={p.name}
                            className="h-14 w-14 rounded-xl object-cover border border-gray-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-gray-900 truncate">{p.name}</p>
                            <p className="text-[11px] font-extrabold text-primary-800">
                              {formatPeso(p.price)} / {p.unit || 'kg'}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              In Stock: {p.stock} {p.unit || 'kg'}
                            </p>
                          </div>
                          {isSelected && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
                        </div>
                      )
                    })}
                  </div>

                  {selectedOfferProduct && (
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400">Selected Offering:</span>
                        <p className="font-extrabold text-sm text-gray-900">{selectedOfferProduct.name}</p>
                        <p className="text-xs text-gray-500">
                          Unit Price: {formatPeso(selectedOfferProduct.price)} / {selectedOfferProduct.unit || 'kg'} · Max Stock: {selectedOfferProduct.stock}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="text-xs font-bold text-gray-700">Quantity to Offer:</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            max={selectedOfferProduct.stock || 1000}
                            value={offerQuantity}
                            onChange={(e) => setOfferQuantity(Math.max(1, Number(e.target.value)))}
                            className="input-field text-xs py-1.5 px-3 w-24 font-bold text-center"
                          />
                          <span className="text-xs font-semibold text-gray-600">
                            {selectedOfferProduct.unit || 'kg'}
                          </span>
                        </div>
                      </div>

                      <div className="w-full sm:w-auto text-right">
                        <span className="text-[10px] uppercase font-bold text-gray-400">Calculated Valuation:</span>
                        <p className="text-base font-extrabold text-emerald-700">{formatPeso(offerTotalValue)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: WHAT YOU WANT (Show All Categories and Marketplace Products) */}
            <div className="card p-6 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-800 text-xs font-extrabold flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-base font-extrabold text-gray-900">
                    What You Want (Browse All Marketplace Categories)
                  </h3>
                </div>
                <span className="text-xs font-bold text-gray-500">
                  {availableWantProducts.length} partner products found
                </span>
              </div>

              {/* Category Pills Filter */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">Filter by Agricultural Category:</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setWantCategoryFilter('All')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      wantCategoryFilter === 'All'
                        ? 'bg-primary-700 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setWantCategoryFilter(cat.name)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                        wantCategoryFilter === cat.name
                          ? 'bg-primary-700 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat.emoji} {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar for Desired Products */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search produce name, farm, or municipality (e.g. Rice, Kidapawan, Tilapia)..."
                  value={wantSearchQuery}
                  onChange={(e) => setWantSearchQuery(e.target.value)}
                  className="input-field text-xs pl-9 py-2"
                />
              </div>

              {/* Product Catalog Grid */}
              <div className="grid sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                {availableWantProducts.length === 0 ? (
                  <div className="sm:col-span-2 text-center py-8 text-xs text-gray-500">
                    No products found matching &quot;{wantCategoryFilter}&quot;. Try selecting another category or keyword.
                  </div>
                ) : (
                  availableWantProducts.map((p) => {
                    const isSelected = p.id === selectedWantProduct?.id
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedWantProductId(p.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                          isSelected
                            ? 'bg-primary-50/70 border-primary-500 ring-2 ring-primary-500/30 shadow-xs'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                        }`}
                      >
                        <ProductImage
                          src={p.image}
                          alt={p.name}
                          className="h-14 w-14 rounded-xl object-cover border border-gray-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs text-gray-900 truncate">{p.name}</p>
                          <p className="text-[11px] font-extrabold text-primary-800">
                            {formatPeso(p.price)} / {p.unit || 'kg'}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">
                            {p.seller} · {p.location}
                          </p>
                        </div>
                        {isSelected && <CheckCircle2 className="h-5 w-5 text-primary-700 shrink-0" />}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Selected Want Product Summary & Quantity */}
              {selectedWantProduct && (
                <div className="p-4 rounded-2xl bg-primary-50/50 border border-primary-200 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-primary-700">Requested Harvest:</span>
                    <p className="font-extrabold text-sm text-gray-900">{selectedWantProduct.name}</p>
                    <p className="text-xs text-gray-600">
                      Farmer: {selectedWantProduct.seller} · {selectedWantProduct.location}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-gray-700">Quantity Desired:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        value={wantQuantity}
                        onChange={(e) => setWantQuantity(Math.max(1, Number(e.target.value)))}
                        className="input-field text-xs py-1.5 px-3 w-24 font-bold text-center"
                      />
                      <span className="text-xs font-semibold text-gray-600">
                        {selectedWantProduct.unit || 'kg'}
                      </span>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto text-right">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Target Valuation:</span>
                    <p className="text-base font-extrabold text-primary-800">{formatPeso(wantTotalValue)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Barter Valuation & Settlement Settlement Terms */}
            <div className="card p-6 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold flex items-center justify-center">
                  3
                </span>
                <h3 className="text-base font-extrabold text-gray-900">
                  Fair-Exchange Valuation & Cash Differential
                </h3>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setCashOffsetMode('even')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    cashOffsetMode === 'even'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="font-extrabold text-xs block text-gray-900">Even Barter (₱0 offset)</span>
                  <span className="text-[11px] text-gray-500">Pure produce-for-produce swap without cash adjustments.</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCashOffsetMode('pay_offset')
                    if (!customCashOffset && rawDifference > 0) setCustomCashOffset(rawDifference)
                  }}
                  className={`p-3 rounded-2xl border text-left transition ${
                    cashOffsetMode === 'pay_offset'
                      ? 'bg-primary-50 border-primary-500 ring-2 ring-primary-500/20'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="font-extrabold text-xs block text-gray-900">I will add cash top-up</span>
                  <span className="text-[11px] text-gray-500">Offer extra cash to balance higher value produce.</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCashOffsetMode('request_offset')
                    if (!customCashOffset && rawDifference < 0) setCustomCashOffset(Math.abs(rawDifference))
                  }}
                  className={`p-3 rounded-2xl border text-left transition ${
                    cashOffsetMode === 'request_offset'
                      ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="font-extrabold text-xs block text-gray-900">Request cash top-up</span>
                  <span className="text-[11px] text-gray-500">Ask the receiver to pay cash difference for your surplus.</span>
                </button>
              </div>

              {cashOffsetMode !== 'even' && (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-gray-700">
                      {cashOffsetMode === 'pay_offset' ? 'Amount of cash you offer to add:' : 'Amount of cash you request:'}
                    </label>
                    <p className="text-[11px] text-gray-500">Suggested market gap: {formatPeso(Math.abs(rawDifference))}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-600">₱</span>
                    <input
                      type="number"
                      min={0}
                      value={customCashOffset || (Math.abs(rawDifference) || 0)}
                      onChange={(e) => setCustomCashOffset(Math.max(0, Number(e.target.value)))}
                      className="input-field text-xs py-1.5 px-3 w-28 font-bold"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Logistics & Exchange Agreement Note:
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="input-field text-xs"
                  placeholder="e.g. Ready for meetup at Koronadal Trading Post or farm gate inspection on Saturday morning."
                />
              </div>

              <button
                type="submit"
                disabled={!selectedOfferProduct || !selectedWantProduct || myListings.length === 0}
                className="btn-primary w-full py-3 text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                <span>Submit Trade Proposal to {selectedWantProduct?.seller || 'Farmer'}</span>
              </button>
            </div>
          </form>

          {/* Right Sidebar: Live Valuation & Fair Exchange Appraisal (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="card p-6 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-5 sticky top-24">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <Scale className="h-5 w-5 text-emerald-700" />
                <h3 className="font-extrabold text-sm text-gray-900">Barter Appraisal Summary</h3>
              </div>

              {/* Offer Card */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">You Give</span>
                <p className="font-extrabold text-xs text-gray-900">
                  {offerQuantity} {selectedOfferProduct?.unit || 'kg'} of {selectedOfferProduct?.name || 'Selected produce'}
                </p>
                <p className="text-xs text-emerald-800 font-bold">
                  Estimated Worth: {formatPeso(offerTotalValue)}
                </p>
              </div>

              {/* Exchange Symbol */}
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shadow-inner">
                  <ArrowRightLeft className="h-4 w-4" />
                </div>
              </div>

              {/* Want Card */}
              <div className="p-3.5 rounded-2xl bg-primary-50/70 border border-primary-100 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary-700">You Receive</span>
                <p className="font-extrabold text-xs text-gray-900">
                  {wantQuantity} {selectedWantProduct?.unit || 'kg'} of {selectedWantProduct?.name || 'Desired produce'}
                </p>
                <p className="text-xs text-primary-800 font-bold">
                  Estimated Worth: {formatPeso(wantTotalValue)}
                </p>
                <p className="text-[10px] text-gray-500">Seller: {selectedWantProduct?.seller}</p>
              </div>

              {/* Net Balance Status */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-semibold">Value Difference:</span>
                  <span className={`font-bold ${rawDifference > 0 ? 'text-amber-700' : rawDifference < 0 ? 'text-emerald-700' : 'text-gray-700'}`}>
                    {rawDifference > 0 ? `+${formatPeso(rawDifference)} requested` : rawDifference < 0 ? `${formatPeso(rawDifference)} surplus` : 'Balanced (₱0)'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-semibold">Cash Settlement:</span>
                  <span className="font-extrabold text-gray-900">
                    {calculatedCashOffset > 0
                      ? `+${formatPeso(calculatedCashOffset)} to partner`
                      : calculatedCashOffset < 0
                      ? `${formatPeso(Math.abs(calculatedCashOffset))} from partner`
                      : 'None (₱0)'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 text-[11px] text-gray-600 leading-relaxed border border-gray-100 flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
                  <span>
                    AgriMarket verifies weight and quality upon meetup. Both parties must inspect packaging and seal before final release.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INCOMING PROPOSALS */}
      {activeTab === 'incoming' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-gray-900">
              Incoming Barter Proposals ({myIncomingTrades.length})
            </h3>
            <span className="text-xs text-gray-500">Offers proposed by fellow producers for your harvests</span>
          </div>

          {myIncomingTrades.length === 0 ? (
            <div className="card p-12 text-center text-gray-500 space-y-3">
              <ArrowRightLeft className="h-10 w-10 text-gray-300 mx-auto" />
              <p className="font-bold text-sm text-gray-700">No incoming trade offers right now.</p>
              <p className="text-xs text-gray-500">When other farmers request your produce, their proposals will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {myIncomingTrades.map((t) => (
                <div key={t.id} className="card p-5 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{t.fromName}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                        t.status === 'Accepted'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : t.status === 'Declined'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : t.status === 'Countered'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-primary-50 text-primary-800 border-primary-200'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* They Offer */}
                    <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3">
                      <ProductImage
                        src={t.fromProductImage || '/images/farm.jpg'}
                        alt={t.fromProductName}
                        className="h-12 w-12 rounded-xl object-cover border border-gray-200 shrink-0"
                      />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-700">They Offer</span>
                        <p className="font-extrabold text-xs text-gray-900">
                          {t.offerQuantity ? `${t.offerQuantity} ${t.offerUnit || 'kg'} of ` : ''}{t.fromProductName}
                        </p>
                        {t.offerValue ? <p className="text-[11px] font-bold text-emerald-800">{formatPeso(t.offerValue)}</p> : null}
                      </div>
                    </div>

                    {/* In Exchange For */}
                    <div className="p-3.5 rounded-2xl bg-primary-50/60 border border-primary-100 flex items-center gap-3">
                      <ProductImage
                        src={t.toProductImage || '/images/farm.jpg'}
                        alt={t.toProductName}
                        className="h-12 w-12 rounded-xl object-cover border border-gray-200 shrink-0"
                      />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-primary-700">For Your Produce</span>
                        <p className="font-extrabold text-xs text-gray-900">
                          {t.wantQuantity ? `${t.wantQuantity} ${t.wantUnit || 'kg'} of ` : ''}{t.toProductName}
                        </p>
                        {t.wantValue ? <p className="text-[11px] font-bold text-primary-800">{formatPeso(t.wantValue)}</p> : null}
                      </div>
                    </div>
                  </div>

                  {t.cashOffset ? (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                      <Coins className="h-4 w-4 text-amber-700 shrink-0" />
                      <span>
                        Cash Offset Proposed:{' '}
                        <strong>
                          {t.cashOffset > 0 ? `+${formatPeso(t.cashOffset)} extra cash from buyer` : `${formatPeso(Math.abs(t.cashOffset))} cash requested`}
                        </strong>
                      </span>
                    </div>
                  ) : null}

                  <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 italic">
                    &quot;{t.note}&quot;
                  </p>

                  {/* Counter Offer History Details */}
                  {t.counterOffer && (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Counter-Offer Proposed by {t.counterOffer.counterBy}:
                      </p>
                      <p className="text-[11px] text-blue-800">&quot;{t.counterOffer.counterNote}&quot;</p>
                    </div>
                  )}

                  {/* Actions for recipient */}
                  {t.status === 'Open' && (
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => respondTrade(t.id, 'Accepted')}
                        className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Accept Barter Swap</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setCounterModal({
                            isOpen: true,
                            trade: t,
                            quantity: t.wantQuantity || 5,
                            cashOffset: t.cashOffset || 0,
                            note: '',
                          })
                        }
                        className="btn-secondary py-2 px-4 text-xs font-bold inline-flex items-center gap-1"
                      >
                        <Coins className="h-4 w-4" />
                        <span>Propose Counter-Offer</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => respondTrade(t.id, 'Declined')}
                        className="btn-outline py-2 px-4 text-xs font-bold text-rose-600 hover:bg-rose-50 border-rose-200 inline-flex items-center gap-1"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Decline</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OUTGOING OFFERS */}
      {activeTab === 'outgoing' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-gray-900">
              My Sent Barter Offers ({myOutgoingTrades.length})
            </h3>
            <span className="text-xs text-gray-500">Track responses and negotiations from partners</span>
          </div>

          {myOutgoingTrades.length === 0 ? (
            <div className="card p-12 text-center text-gray-500 space-y-3">
              <Send className="h-10 w-10 text-gray-300 mx-auto" />
              <p className="font-bold text-sm text-gray-700">You haven&apos;t sent any barter offers yet.</p>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="btn-primary text-xs py-2 px-4 font-bold inline-flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create a Trade Proposal</span>
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {myOutgoingTrades.map((t) => (
                <div key={t.id} className="card p-5 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">To Partner: {t.toSellerName || t.toSellerId}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                        t.status === 'Accepted'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : t.status === 'Declined'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : t.status === 'Countered'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-primary-50 text-primary-800 border-primary-200'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                      <span className="text-[10px] uppercase font-bold text-emerald-700">You Offered</span>
                      <p className="font-extrabold text-xs text-gray-900">
                        {t.offerQuantity ? `${t.offerQuantity} ${t.offerUnit || 'kg'} of ` : ''}{t.fromProductName}
                      </p>
                      {t.offerValue ? <p className="text-[11px] font-bold text-emerald-800">{formatPeso(t.offerValue)}</p> : null}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-primary-50/60 border border-primary-100">
                      <span className="text-[10px] uppercase font-bold text-primary-700">You Requested</span>
                      <p className="font-extrabold text-xs text-gray-900">
                        {t.wantQuantity ? `${t.wantQuantity} ${t.wantUnit || 'kg'} of ` : ''}{t.toProductName}
                      </p>
                      {t.wantValue ? <p className="text-[11px] font-bold text-primary-800">{formatPeso(t.wantValue)}</p> : null}
                    </div>
                  </div>

                  {t.counterOffer && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                      <p className="font-bold flex items-center gap-1.5">
                        <Coins className="h-4 w-4 text-amber-700" />
                        Counter-Offer Received from Partner:
                      </p>
                      <p className="text-xs">&quot;{t.counterOffer.counterNote}&quot;</p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => respondTrade(t.id, 'Accepted')}
                          className="btn-primary py-1.5 px-3 text-xs font-bold"
                        >
                          Accept Counter-Offer
                        </button>
                        <button
                          type="button"
                          onClick={() => respondTrade(t.id, 'Declined')}
                          className="btn-outline py-1.5 px-3 text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 italic">&quot;{t.note}&quot;</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: COMMUNITY TRADE FEED */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-gray-900">
              Community Barter Feed ({trades.length})
            </h3>
            <span className="text-xs text-gray-500">Live exchange activities across Region 12</span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trades.map((t) => (
              <div key={t.id} className="card p-4 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 truncate">{t.fromName}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      t.status === 'Accepted'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-primary-50 text-primary-800 border-primary-200'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-emerald-800">
                    Offers: {t.offerQuantity ? `${t.offerQuantity} ${t.offerUnit || 'kg'} ` : ''}{t.fromProductName}
                  </p>
                  <p className="text-xs font-bold text-primary-800">
                    Wants: {t.wantQuantity ? `${t.wantQuantity} ${t.wantUnit || 'kg'} ` : ''}{t.toProductName}
                  </p>
                </div>

                <p className="text-[11px] text-gray-500 line-clamp-2 italic">&quot;{t.note}&quot;</p>
                <p className="text-[10px] text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Counter-Offer Modal */}
      {counterModal.isOpen && counterModal.trade && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <Coins className="h-5 w-5 text-amber-700" />
                <span>Propose Counter-Offer</span>
              </h3>
              <button
                type="button"
                onClick={() => setCounterModal({ isOpen: false, trade: null, quantity: 1, cashOffset: 0, note: '' })}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCounterSubmit} className="space-y-4">
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 space-y-1 text-xs">
                <p className="text-gray-500">
                  Original Offer: <strong>{counterModal.trade.fromProductName}</strong> for{' '}
                  <strong>{counterModal.trade.toProductName}</strong>
                </p>
                <p className="text-gray-500">From: {counterModal.trade.fromName}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Adjusted Quantity of Your Harvest:
                </label>
                <input
                  type="number"
                  min={1}
                  value={counterModal.quantity}
                  onChange={(e) => setCounterModal((prev) => ({ ...prev, quantity: Math.max(1, Number(e.target.value)) }))}
                  className="input-field text-xs py-2 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Requested Cash Offset (Optional):
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">₱</span>
                  <input
                    type="number"
                    min={0}
                    value={counterModal.cashOffset}
                    onChange={(e) => setCounterModal((prev) => ({ ...prev, cashOffset: Math.max(0, Number(e.target.value)) }))}
                    className="input-field text-xs py-2 font-bold"
                    placeholder="e.g. 50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Counter-Offer Terms / Logistics Note:
                </label>
                <textarea
                  rows={3}
                  required
                  value={counterModal.note}
                  onChange={(e) => setCounterModal((prev) => ({ ...prev, note: e.target.value }))}
                  className="input-field text-xs"
                  placeholder="e.g. Can provide 8kg instead of 10kg due to high quality grade A sort, plus meetup at Koronadal terminal."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCounterModal({ isOpen: false, trade: null, quantity: 1, cashOffset: 0, note: '' })}
                  className="btn-outline py-2 px-4 text-xs font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2 px-5 text-xs font-bold">
                  Send Counter Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TradesPage
