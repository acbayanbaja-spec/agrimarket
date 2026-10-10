import { useState, useLayoutEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { MapPin, Star, Truck, Repeat, Coins, ShieldCheck, Clock, Heart, Zap } from 'lucide-react'
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

const ProductDetailPage = () => {
  const { id } = useParams()
  const { products, addReview, reviewsFor, recommended, posts, toggleWishlist, isWishlisted } = useStore()
  const { addItem } = useCart()
  const { toast } = useToast()
  const { isAuthenticated, user, hasRole } = useAuth()
  const [quantity, setQuantity] = useState(1)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [showMap, setShowMap] = useState(false)

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
  const product = products.find((item) => item.id === id)
  const feedback = product ? reviewsFor(product.id) : []

  if (!product) {
    return (
      <div className="page-shell text-center">
        <h1 className="text-3xl font-bold mb-3">Product not found</h1>
        <p className="text-gray-600 mb-6">It may have been harvested already.</p>
        <Link to="/marketplace" className="btn-primary">Back to marketplace</Link>
      </div>
    )
  }

  const related = recommended.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 4)
  const gallery = product.photos?.length ? product.photos : [product.image]
  const out = product.stock <= 0
  const meta = harvestMeta(product)
  const sellerFeed = posts.filter((post) => post.productId === product.id || (post.sellerName === product.seller && post.category === product.category)).slice(0, 4)

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault()
    addReview({ productId: product.id, rating, comment: comment.trim(), photos })
    setComment('')
    setPhotos([])
  }

  const addToCart = () => {
    if (hasRole('admin')) {
      toast('Admins cannot place orders. The admin role is for management only.')
      return
    }
    if (hasRole('delivery')) {
      toast('Delivery riders do not place orders. Manage parcels in your Delivery Desk.')
      return
    }
    addItem(product, quantity)
    toast(`Added to cart · ${product.name}`, '/cart')
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
          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-secondary-400 text-secondary-400" /> {product.rating} · {meta.sold}+ sold</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {product.location}</span>
            <span className={`chip ${stockTone(product.stock)}`}>{stockLabel(product.stock)}</span>
            {product.tradeable && <span className="chip bg-primary-50 text-primary-800"><Repeat className="h-3 w-3 mr-1" /> Tradable</span>}
          </div>
          <div className="flex items-baseline gap-3 mt-6">
            <p className="text-3xl font-bold">{formatPeso(product.price)}</p>
            <p className="text-gray-400 line-through">{formatPeso(meta.originalPrice)}</p>
            <span className="text-base font-medium text-gray-500">/ {product.unit}</span>
          </div>
          <p className="mt-4 text-gray-700 leading-relaxed">{product.description}</p>
          <div className="mt-5 grid sm:grid-cols-2 gap-2 text-sm">
            <p className="rounded-xl bg-amber-50 px-3 py-2 inline-flex items-center gap-2"><Coins className="h-4 w-4" /> Earn {meta.points * quantity} pts (₱10 = 1 pt)</p>
            <p className="rounded-xl bg-sky-50 px-3 py-2 inline-flex items-center gap-2"><Clock className="h-4 w-4" /> {meta.eta}</p>
            <p className="rounded-xl bg-primary-50 px-3 py-2 inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> {meta.freshness}</p>
            <p className="rounded-xl bg-soil-100 px-3 py-2 inline-flex items-center gap-2"><Truck className="h-4 w-4" /> {meta.guarantee}</p>
          </div>
          <p className="mt-4 text-sm text-gray-500">Sold by <Link className="font-semibold text-primary-700" to={`/marketplace?seller=${encodeURIComponent(product.seller)}`}>{product.seller}</Link> · {product.stock} {product.unit} available · SOCCSKSARGEN</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
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
            {hasRole('admin') ? (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl text-sm font-semibold">
                <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
                <span>Admin View (Management Only): Administrators cannot order harvests.</span>
              </div>
            ) : hasRole('delivery') ? (
              <div className="flex items-center gap-3 bg-primary-50 border border-primary-200 text-primary-900 px-4 py-3 rounded-2xl text-sm font-semibold w-full">
                <Truck className="h-5 w-5 text-primary-600 shrink-0" />
                <span>Rider View: Deliveries are managed through the Delivery Command Desk.</span>
                <Link to="/delivery" className="btn-primary text-xs py-1.5 px-3 ml-auto">Go to Desk</Link>
              </div>
            ) : (
              <>
                <QuantityStepper value={quantity} max={Math.max(product.stock, 1)} onChange={setQuantity} disabled={out} />
                <button type="button" className="btn-primary" disabled={out} onClick={addToCart}>
                  {out ? 'Out of stock' : `Confirm add · ${formatPeso(product.price * quantity)}`}
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
              >
                <Heart className={`h-5 w-5 ${isWishlisted(product.id) ? 'fill-rose-500' : ''}`} />
              </button>
            )}
            {/* Offer a trade is hidden from admin and delivery roles */}
            {product.tradeable && !hasRole('admin') && !hasRole('delivery') && (
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
                <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()} · {post.category}</p>
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
          rating={product.rating}
          reviewCount={product.reviews}
        />
      </div>

      <div className="card mt-12">
        <h2 className="text-xl font-semibold mb-4">Price monitoring (Historical Regional Pricing)</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={product.priceHistory}>
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
    </div>
  )
}

export default ProductDetailPage
