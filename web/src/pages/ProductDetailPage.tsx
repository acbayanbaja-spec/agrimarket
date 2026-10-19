import { useState, useLayoutEffect, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import {
  MapPin,
  Star,
  Truck,
  Repeat,
  Coins,
  ShieldCheck,
  Clock,
  Heart,
  Zap,
  Flag,
  AlertTriangle,
  CheckCircle2,
  X,
  Leaf,
  Bell,
  Building2,
  Calendar,
  Users,
  Thermometer,
} from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { fileToDataUrl, formatPeso, mapsUrl } from '../lib/utils'
import { stockLabel, stockTone } from '../data/catalog'
import { harvestMeta } from '../lib/commerce'
import { scrollToTopNow } from '../components/ScrollToTop'
import ProductCard from '../components/ProductCard'
import ProductImage from '../components/ProductImage'
import QuantityStepper from '../components/QuantityStepper'
import ProductReviewsSection from '../components/ProductReviewsSection'
import Seo from '../components/Seo'
import ProduceFreshnessBadge from '../components/ProduceFreshnessBadge'
import GapCertificationModal from '../components/GapCertificationModal'
import FoodMilesCalculatorModal from '../components/FoodMilesCalculatorModal'
import BulkQuotationModal from '../components/BulkQuotationModal'
import PriceAlertModal from '../components/PriceAlertModal'
import ForwardHarvestModal from '../components/ForwardHarvestModal'
import BayanihanPoolModal from '../components/BayanihanPoolModal'
import ColdChainMonitorModal from '../components/ColdChainMonitorModal'
import api from '../services/api'
import type { Product } from '../data/catalog'

const ProductDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { products, allProducts, addReview, reviewsFor, recommended, posts, toggleWishlist, isWishlisted } = useStore()
  const { addItem } = useCart()
  const { toast } = useToast()
  const { isAuthenticated, user, hasRole } = useAuth()
  const [quantity, setQuantity] = useState(1)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [showMap, setShowMap] = useState(false)
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('misleading')
  const [reportDetails, setReportDetails] = useState('')
  const [reporting, setReporting] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([])
  const [showGapModal, setShowGapModal] = useState(false)
  const [showFoodMilesModal, setShowFoodMilesModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showPriceAlertModal, setShowPriceAlertModal] = useState(false)
  const [showForwardHarvestModal, setShowForwardHarvestModal] = useState(false)
  const [showBayanihanModal, setShowBayanihanModal] = useState(false)
  const [showColdChainModal, setShowColdChainModal] = useState(false)

  useLayoutEffect(() => {
    scrollToTopNow()
    const t1 = setTimeout(scrollToTopNow, 40)
    const t2 = setTimeout(scrollToTopNow, 150)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [id])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [relatedRemote, setRelatedRemote] = useState<Product[]>([])
  const [remoteProduct, setRemoteProduct] = useState<Product | null>(null)
  const [productLoading, setProductLoading] = useState(false)

  const cleanId = String(id || '').trim().toLowerCase()
  const localSavedProduct: Product | undefined = (() => {
    try {
      const raw = localStorage.getItem('agrimarket.products')
      const list: Product[] = raw ? JSON.parse(raw) : []
      return list.find((item) => {
        const itemId = String(item.id || '').trim().toLowerCase()
        return itemId === cleanId || itemId.includes(cleanId) || cleanId.includes(itemId)
      })
    } catch {
      return undefined
    }
  })()

  // Match from store, local storage, or post reference
  const catalogProduct =
    products.find((item) => {
      const itemId = String(item.id || '').trim().toLowerCase()
      return itemId === cleanId || itemId.includes(cleanId) || cleanId.includes(itemId)
    }) ||
    allProducts.find((item) => {
      const itemId = String(item.id || '').trim().toLowerCase()
      return itemId === cleanId || itemId.includes(cleanId) || cleanId.includes(itemId)
    }) ||
    localSavedProduct ||
    (() => {
      const postMatch = posts.find((p) => String(p.productId || '').trim().toLowerCase() === cleanId)
      if (postMatch) {
        return (
          products.find((p) => p.name.toLowerCase() === (postMatch.productName || '').toLowerCase()) ||
          allProducts.find((p) => p.name.toLowerCase() === (postMatch.productName || '').toLowerCase())
        )
      }
      return undefined
    })()

  const product = catalogProduct || remoteProduct
  const feedback = product ? reviewsFor(product.id) : []

  useEffect(() => {
    if (!id) return
    api
      .get<{ data?: { products?: Product[] } }>(`/products/${id}/related`)
      .then((res) => setRelatedRemote(res.data?.data?.products || []))
      .catch(() => setRelatedRemote([]))
  }, [id])

  useEffect(() => {
    if (!id || catalogProduct) {
      setRemoteProduct(null)
      setProductLoading(false)
      return
    }
    let cancelled = false
    setProductLoading(true)
    api
      .get<{ data?: { product?: Product } }>(`/products/${id}`)
      .then((res) => {
        if (!cancelled && res.data?.data?.product) {
          setRemoteProduct(res.data.data.product)
        }
      })
      .catch(() => {
        // Fallback search by query parameter if direct ID was not found
        api
          .get<{ data?: { products?: Product[] } }>(`/products?search=${encodeURIComponent(id)}`)
          .then((searchRes) => {
            const found = searchRes.data?.data?.products?.[0]
            if (!cancelled) setRemoteProduct(found || null)
          })
          .catch(() => {
            if (!cancelled) setRemoteProduct(null)
          })
      })
      .finally(() => {
        if (!cancelled) setProductLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, catalogProduct])

  useEffect(() => {
    if (!product?.id) return
    try {
      const raw = localStorage.getItem('agrimarket_recently_viewed')
      const parsed: string[] = raw ? JSON.parse(raw) : []
      const updated = [product.id, ...parsed.filter((item) => item !== product.id)].slice(0, 8)
      localStorage.setItem('agrimarket_recently_viewed', JSON.stringify(updated))
      setRecentlyViewedIds(updated.filter((item) => item !== product.id))
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, [product?.id])

  if (!product) {
    return (
      <div className="page-shell text-center">
        <h1 className="text-3xl font-bold mb-3">{productLoading ? 'Loading harvest…' : 'Product not found'}</h1>
        <p className="text-gray-600 mb-6">
          {productLoading ? 'Fetching this listing from the marketplace.' : 'It may have been harvested already.'}
        </p>
        <Link to="/marketplace" className="btn-primary">Back to marketplace</Link>
      </div>
    )
  }

  const related =
    relatedRemote.length > 0
      ? relatedRemote
      : recommended.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 4)
  const rawGallery = [
    product.image,
    ...(Array.isArray(product.photos) ? product.photos : [])
  ].filter((p): p is string => Boolean(p && typeof p === 'string' && p.trim().length > 0))
  const gallery = Array.from(new Set(rawGallery.length > 0 ? rawGallery : ['/images/farm.jpg']))
  const productPrice = typeof product.price === 'number' && !isNaN(product.price) ? product.price : (Number(product.price) || 0)
  const productStock = typeof product.stock === 'number' && !isNaN(product.stock) ? product.stock : (Number(product.stock) || 0)
  const out = productStock <= 0
  const meta = harvestMeta(product)
  const sellerFeed = posts.filter((post) => post.productId === product.id || (post.sellerName === product.seller && post.category === product.category)).slice(0, 4)

  const variations: Array<{ id: string; name: string; multiplier: number; price: number; unit: string; inStock?: boolean }> =
    (product as any).variations && (product as any).variations.length > 0
      ? (product as any).variations
      : [
          { id: 'var-1', name: `Single ${product.unit || 'kg'} Pack`, multiplier: 1, price: productPrice, unit: product.unit || 'kg', inStock: productStock > 0 },
          { id: 'var-2', name: `5× ${product.unit || 'kg'} Value Bundle`, multiplier: 5, price: Math.round(productPrice * 5 * 0.95), unit: product.unit || 'kg', inStock: productStock >= 5 },
          { id: 'var-3', name: `25× ${product.unit || 'kg'} Wholesale Crate`, multiplier: 25, price: Math.round(productPrice * 25 * 0.90), unit: product.unit || 'kg', inStock: productStock >= 25 },
        ]

  const activeVariation = variations.find((v) => v.id === selectedVariationId) || variations[0]
  const currentPrice = activeVariation ? activeVariation.price : productPrice

  const recentlyViewedProducts = recentlyViewedIds
    .map((viewedId) => products.find((p) => p.id === viewedId))
    .filter((p): p is Product => Boolean(p))
    .slice(0, 4)

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault()
    addReview({ productId: product.id, rating, comment: comment.trim(), photos })
    setComment('')
    setPhotos([])
  }

  const addToCart = () => {
    if (hasRole('delivery')) {
      toast('Delivery riders do not place orders. Manage parcels in your Delivery Desk.')
      return
    }
    if (!isAuthenticated) {
      toast('Please log in or sign up to order harvests', '/login')
      navigate('/login', { state: { from: `/products/${product.id}` } })
      return
    }
    const itemToAdd = {
      ...product,
      price: currentPrice,
      unit: activeVariation ? activeVariation.name : product.unit,
    }
    addItem(itemToAdd, quantity)
    toast(`Added to cart · ${product.name} (${activeVariation?.name || product.unit})`, '/cart')
  }

  const handleReportListing = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast('Please log in first to report a listing', '/login')
      return
    }
    setReporting(true)
    try {
      await api.post(`/products/${product.id}/report`, {
        reason: reportReason,
        details: reportDetails,
      })
      setReportSuccess(true)
      toast('Listing report submitted to marketplace moderators')
      setTimeout(() => {
        setShowReportModal(false)
        setReportSuccess(false)
        setReportDetails('')
      }, 1800)
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to submit report. Please try again.')
    } finally {
      setReporting(false)
    }
  }

  return (
    <div className="page-shell">
      <Seo title={product.name} description={product.description} path={`/products/${product.id}`} />
      <div className="grid lg:grid-cols-2 gap-10">
        <div>
          <ProductImage src={gallery[photoIndex]} alt={product.name} className="w-full h-[420px] object-cover rounded-3xl shadow-soft" />
          {gallery.length > 1 && (
            <div className="flex gap-2 mt-3">
              {gallery.map((src, index) => (
                <button key={src + index} type="button" onClick={() => setPhotoIndex(index)} className={`h-16 w-16 rounded-xl overflow-hidden border-2 ${index === photoIndex ? 'border-primary-600' : 'border-transparent'}`}>
                  <ProductImage src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-primary-700 uppercase">{product.category}</p>
          <h1 className="text-4xl font-bold mt-2">{product.name}</h1>
          <div className="flex flex-wrap items-center gap-2.5 mt-3 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-secondary-400 text-secondary-400" /> {product.rating} · {meta.sold}+ sold</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {product.location}</span>
            <span className={`chip ${stockTone(product.stock)}`}>{stockLabel(product.stock)}</span>
            {product.tradeable && <span className="chip bg-primary-50 text-primary-800"><Repeat className="h-3 w-3 mr-1" /> Tradable</span>}
            <ProduceFreshnessBadge category={product.category} productName={product.name} />
            <button
              type="button"
              onClick={() => setShowGapModal(true)}
              className="chip bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold inline-flex items-center gap-1 hover:bg-emerald-100 transition cursor-pointer"
              title="Click to view official PhilGAP and Organic safety accreditation"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>PhilGAP Verified</span>
            </button>
            <button
              type="button"
              onClick={() => setShowFoodMilesModal(true)}
              className="chip bg-teal-50 text-teal-800 border border-teal-300 font-bold inline-flex items-center gap-1 hover:bg-teal-100 transition cursor-pointer"
              title="Click to calculate farm-to-fork transit distance and CO2 saved"
            >
              <Leaf className="h-3.5 w-3.5 text-teal-600" />
              <span>Food Miles</span>
            </button>
          </div>
          <div className="flex items-baseline gap-3 mt-6">
            <p className="text-3xl font-bold">{formatPeso(currentPrice)}</p>
            <p className="text-gray-400 line-through">
              {formatPeso(meta.originalPrice * (activeVariation?.multiplier || 1))}
            </p>
            <span className="text-base font-medium text-gray-500">
              / {activeVariation?.name || product.unit}
            </span>
          </div>

          {/* Product Packaging / Bundle Variations */}
          {variations.length > 0 && (
            <div className="mt-4 space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Packaging / Bundle Size:
              </label>
              <div className="flex flex-wrap gap-2">
                {variations.map((v) => {
                  const isSelected = (selectedVariationId || variations[0].id) === v.id
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariationId(v.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-primary-400'
                      }`}
                    >
                      {v.name} · {formatPeso(v.price)}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <p className="mt-4 text-gray-700 leading-relaxed">{product.description}</p>
          <div className="mt-5 grid sm:grid-cols-2 gap-2 text-sm">
            <p className="rounded-xl bg-amber-50 px-3 py-2 inline-flex items-center gap-2"><Coins className="h-4 w-4" /> Earn {meta.points * quantity} pts (₱10 = 1 pt)</p>
            <p className="rounded-xl bg-sky-50 px-3 py-2 inline-flex items-center gap-2"><Clock className="h-4 w-4" /> {meta.eta}</p>
            <p className="rounded-xl bg-primary-50 px-3 py-2 inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> {meta.freshness}</p>
            <p className="rounded-xl bg-soil-100 px-3 py-2 inline-flex items-center gap-2"><Truck className="h-4 w-4" /> {meta.guarantee}</p>
          </div>
          <p className="mt-4 text-sm text-gray-500">Sold by <Link className="font-semibold text-primary-700" to={`/marketplace?seller=${encodeURIComponent(product.seller)}`}>{product.seller}</Link> · {product.stock} {product.unit} available · SOCCSKSARGEN</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <a className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:underline" href={mapsUrl(product.lat, product.lng)} target="_blank" rel="noreferrer">
                <MapPin className="h-4 w-4" /> Open GPS pin on Google Maps
              </a>
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 underline"
              >
                {showMap ? 'Hide map preview' : 'Preview map location'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-rose-600 transition-colors"
              title="Report this listing to moderators"
            >
              <Flag className="h-3.5 w-3.5" /> Report listing
            </button>
          </div>
          {showMap && (
            <div className="mt-3 h-48 rounded-2xl overflow-hidden border">
              <iframe
                title="Product location"
                loading="lazy"
                tabIndex={-1}
                className="h-full w-full"
                src={`https://maps.google.com/maps?q=${product.lat},${product.lng}&z=9&output=embed`}
              />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4 mt-8">
            {hasRole('delivery') ? (
              <div className="flex items-center gap-3 bg-primary-50 border border-primary-200 text-primary-900 px-4 py-3 rounded-2xl text-sm font-semibold w-full">
                <Truck className="h-5 w-5 text-primary-600 shrink-0" />
                <span>Rider View: Deliveries are managed through the Delivery Command Desk.</span>
                <Link to="/delivery" className="btn-primary text-xs py-1.5 px-3 ml-auto">Go to Desk</Link>
              </div>
            ) : (
              <>
                <QuantityStepper value={quantity} max={Math.max(productStock, 1)} onChange={setQuantity} disabled={out} />
                <button type="button" className="btn-primary" disabled={out} onClick={addToCart}>
                  {out ? 'Out of stock' : `Confirm add · ${formatPeso(currentPrice * quantity)}`}
                </button>
              </>
            )}
            {!hasRole('delivery') && (
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className={`p-3 rounded-2xl border transition-all ${
                  isWishlisted(product.id)
                    ? 'bg-rose-50 border-rose-300 text-rose-600 scale-105 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-500 hover:text-rose-600 hover:border-rose-200'
                }`}
                title="Add to Wishlist"
                aria-label={isWishlisted(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart className={`h-5 w-5 ${isWishlisted(product.id) ? 'fill-rose-500' : ''}`} />
              </button>
            )}
            {!hasRole('delivery') && (
              <button
                type="button"
                onClick={() => setShowPriceAlertModal(true)}
                className="btn-outline py-2.5 px-3 inline-flex items-center gap-1.5 text-xs font-bold"
                title="Set price drop alert"
              >
                <Bell className="h-4 w-4 text-amber-600" />
                <span className="hidden sm:inline">Price Alert</span>
              </button>
            )}
            {!hasRole('delivery') && (
              <button
                type="button"
                onClick={() => setShowBulkModal(true)}
                className="btn-secondary py-2.5 px-3.5 inline-flex items-center gap-1.5 text-xs font-bold"
                title="Request wholesale volume quote for restaurants or business"
              >
                <Building2 className="h-4 w-4 text-primary-700" />
                <span className="hidden sm:inline">Wholesale Quote</span>
              </button>
            )}
            {!hasRole('delivery') && (
              <button
                type="button"
                onClick={() => setShowForwardHarvestModal(true)}
                className="btn-outline py-2.5 px-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 border-amber-300 hover:bg-amber-50"
                title="Book a pre-harvest forward contract at locked farm-gate rate"
              >
                <Calendar className="h-4 w-4 text-amber-700" />
                <span className="hidden sm:inline">Forward Harvest</span>
              </button>
            )}
            {!hasRole('delivery') && (
              <button
                type="button"
                onClick={() => setShowBayanihanModal(true)}
                className="btn-outline py-2.5 px-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                title="Join a Bayanihan community group pool for wholesale price"
              >
                <Users className="h-4 w-4 text-emerald-700" />
                <span className="hidden sm:inline">Group Pool</span>
              </button>
            )}
            {!hasRole('delivery') && (
              <button
                type="button"
                onClick={() => setShowColdChainModal(true)}
                className="btn-outline py-2.5 px-3 inline-flex items-center gap-1.5 text-xs font-bold text-cyan-800 border-cyan-300 hover:bg-cyan-50"
                title="Inspect real-time IoT cold chain telemetry"
              >
                <Thermometer className="h-4 w-4 text-cyan-700" />
                <span className="hidden sm:inline">Cold Chain</span>
              </button>
            )}
            {/* Offer a trade is hidden from delivery roles */}
            {product.tradeable && !hasRole('delivery') && (
              <Link to={`/trades?want=${product.id}`} className="btn-outline">
                Offer a trade
              </Link>
            )}
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-sm text-gray-600">
            <Truck className="h-4 w-4" /> GCash or COD · harvest points apply to shipping at checkout
          </p>
        </div>
      </div>

      {sellerFeed.length > 0 && (
        <div className="card mt-12">
          <h2 className="text-xl font-semibold mb-4">Seller feed for this harvest</h2>
          <div className="space-y-4">
            {sellerFeed.map((post) => (
              <article key={post.id} className="border-b border-gray-100 pb-4 last:border-0">
                <p className="font-semibold">{post.sellerName}</p>
                <p className="text-xs text-gray-500">{new Date(post.createdAt || Date.now()).toLocaleString()} · {post.category}</p>
                <p className="text-gray-800 mt-2">{post.body}</p>
              </article>
            ))}
          </div>
          <Link to="/feed" className="btn-outline mt-4">Open harvest feed</Link>
        </div>
      )}

      {/* Shopee & Lazada Style Customer Reviews Section */}
      <div className="mt-12">
        <ProductReviewsSection
          productId={product.id}
          rating={typeof product.rating === 'number' && !isNaN(product.rating) ? product.rating : 5}
          reviewCount={typeof product.reviews === 'number' && !isNaN(product.reviews) ? product.reviews : 0}
        />
      </div>

      <div className="card mt-12">
        <h2 className="text-xl font-semibold mb-4">Price monitoring (Historical Regional Pricing)</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={
                Array.isArray(product.priceHistory) && product.priceHistory.length > 0
                  ? product.priceHistory
                  : [{ date: 'Today', price: productPrice }]
              }
            >
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(v) => `₱${v}`} />
              <Tooltip formatter={(value) => formatPeso(Number(value))} />
              <Line type="monotone" dataKey="price" stroke="#16a34a" strokeWidth={3} dot={{ r: 4, fill: '#16a34a' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">More in {product.category}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
      {/* Recently Viewed Harvests Shelf */}
      {recentlyViewedProducts.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Recently Viewed Harvests</h2>
              <p className="text-xs text-gray-500">Pick up where you left off browsing SOCCSKSARGEN farms</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentlyViewedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}

      {/* Report Listing Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-9 w-9 rounded-xl bg-rose-100 text-rose-700 grid place-items-center">
                  <Flag className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-lg font-bold">Report This Listing</h3>
                  <p className="text-xs text-gray-500">{product.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto grid place-items-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-gray-900">Report Submitted</h4>
                <p className="text-xs text-gray-600">
                  Thank you for keeping AgriMarket trustworthy. Platform moderators will review this listing.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReportListing} className="space-y-4">
                <p className="text-xs text-gray-600">
                  Help us maintain fair pricing, safe agricultural quality, and authentic farmer identities across Region XII.
                </p>

                <div>
                  <label className="label" htmlFor="report-reason">
                    Reason for Report
                  </label>
                  <select
                    id="report-reason"
                    className="input-field text-sm"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                  >
                    <option value="misleading">Misleading description, origin, or photos</option>
                    <option value="spoiled">Spoiled, damaged, or poor quality produce reported</option>
                    <option value="price_gouging">Abnormal price gouging or incorrect unit</option>
                    <option value="fake_organic">Unsubstantiated or fake organic claim</option>
                    <option value="fraud">Suspected fake farmer or scam stall</option>
                    <option value="other">Other policy violation</option>
                  </select>
                </div>

                <div>
                  <label className="label" htmlFor="report-details">
                    Additional Details / Evidence (Optional)
                  </label>
                  <textarea
                    id="report-details"
                    rows={3}
                    className="input-field text-sm"
                    placeholder="Describe what is inaccurate or suspicious about this harvest..."
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="btn-outline flex-1 py-2 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reporting}
                    className="btn-primary flex-1 py-2 text-sm bg-rose-600 hover:bg-rose-700 border-rose-600"
                  >
                    {reporting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Agricultural Feature Modals */}
      <GapCertificationModal
        isOpen={showGapModal}
        onClose={() => setShowGapModal(false)}
        farmName={product.seller}
        location={product.location}
        isOrganic={product.organic}
      />
      <FoodMilesCalculatorModal
        isOpen={showFoodMilesModal}
        onClose={() => setShowFoodMilesModal(false)}
        farmOrigin={product.location}
        productName={product.name}
      />
      <BulkQuotationModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        productId={product.id}
        productName={product.name}
        sellerName={product.seller}
        unit={product.unit}
        currentPrice={product.price}
      />
      <PriceAlertModal
        isOpen={showPriceAlertModal}
        onClose={() => setShowPriceAlertModal(false)}
        product={{
          id: product.id,
          name: product.name,
          price: product.price,
          unit: product.unit,
        }}
      />
      <ForwardHarvestModal
        isOpen={showForwardHarvestModal}
        onClose={() => setShowForwardHarvestModal(false)}
        productName={product.name}
        sellerName={product.seller}
        sellerLocation={product.location}
        currentPrice={product.price}
        unit={product.unit}
      />
      <BayanihanPoolModal
        isOpen={showBayanihanModal}
        onClose={() => setShowBayanihanModal(false)}
        productName={product.name}
        retailPrice={product.price}
        wholesalePrice={Math.round(product.price * 0.72)}
        unit={product.unit}
      />
      <ColdChainMonitorModal
        isOpen={showColdChainModal}
        onClose={() => setShowColdChainModal(false)}
        productName={product.name}
        sellerLocation={product.location}
      />
    </div>
  )
}

export default ProductDetailPage
