import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { MapPin, Star, Truck, Repeat, Coins, ShieldCheck, Clock } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { fileToDataUrl, formatPeso, mapsUrl } from '../lib/utils'
import { stockLabel, stockTone } from '../data/catalog'
import { harvestMeta } from '../lib/commerce'
import ProductCard from '../components/ProductCard'
import ProductImage from '../components/ProductImage'
import QuantityStepper from '../components/QuantityStepper'
import Seo from '../components/Seo'

const ProductDetailPage = () => {
  const { id } = useParams()
  const { products, addReview, reviewsFor, recommended } = useStore()
  const { addItem } = useCart()
  const { toast } = useToast()
  const { isAuthenticated, user } = useAuth()
  const [quantity, setQuantity] = useState(1)
  const [photoIndex, setPhotoIndex] = useState(0)
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

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault()
    addReview({ productId: product.id, rating, comment: comment.trim(), photos })
    setComment('')
    setPhotos([])
  }

  const addToCart = () => {
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
          <p className="mt-4 text-sm text-gray-500">Sold by {meta.origin} · {product.stock} {product.unit} available</p>
          <a className="mt-3 inline-flex text-sm font-semibold text-primary-700" href={mapsUrl(product.lat, product.lng)} target="_blank" rel="noreferrer">
            Open GPS pin on Google Maps
          </a>
          <div className="mt-4 h-48 rounded-2xl overflow-hidden border">
            <iframe
              title="Product location"
              className="h-full w-full"
              src={`https://maps.google.com/maps?q=${product.lat},${product.lng}&z=9&output=embed`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-8">
            <QuantityStepper value={quantity} max={Math.max(product.stock, 1)} onChange={setQuantity} disabled={out} />
            <button type="button" className="btn-primary" disabled={out} onClick={addToCart}>
              {out ? 'Out of stock' : `Confirm add · ${formatPeso(product.price * quantity)}`}
            </button>
            {product.tradeable && <Link to={`/trades?want=${product.id}`} className="btn-outline">Offer a trade</Link>}
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-sm text-gray-600">
            <Truck className="h-4 w-4" /> GCash or COD · harvest points apply to shipping at checkout
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mt-12">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Price monitoring</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={product.priceHistory}>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip formatter={(value) => formatPeso(Number(value))} />
                <Line type="monotone" dataKey="price" stroke="#16a34a" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Buyer feedback</h2>
          {feedback.length === 0 ? <p className="text-gray-600 text-sm">Be the first to review with a photo.</p> : (
            <div className="space-y-4 max-h-56 overflow-y-auto">
              {feedback.map((review) => (
                <article key={review.id}>
                  <p className="font-semibold">{review.userName} · {review.rating}★</p>
                  <p className="text-sm text-gray-700">{review.comment}</p>
                  {review.photos[0] && <ProductImage src={review.photos[0]} alt="" className="h-16 w-16 rounded-lg object-cover mt-2" />}
                </article>
              ))}
            </div>
          )}
          {isAuthenticated ? (
            <form onSubmit={submitReview} className="mt-4 space-y-3">
              <select className="input-field" value={rating} onChange={(event) => setRating(Number(event.target.value))}>
                {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}
              </select>
              <textarea required rows={3} className="input-field" placeholder={`How was the ${product.name}, ${user?.firstName}?`} value={comment} onChange={(event) => setComment(event.target.value)} />
              <input
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0]
                  if (file) setPhotos([await fileToDataUrl(file)])
                }}
              />
              <button type="submit" className="btn-primary">Post review</button>
            </form>
          ) : (
            <Link to="/login" className="btn-outline mt-4">Log in to review</Link>
          )}
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
