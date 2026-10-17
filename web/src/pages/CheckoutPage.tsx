import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Coins, MapPin, Package, Receipt, ArrowRight } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useStore, type Order } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { formatPeso } from '../lib/utils'
import { pointsFromSpend } from '../lib/commerce'
import { shippingCoupons } from '../data/catalog'
import { soccsksargenPlaces } from '../data/locations'
import Seo from '../components/Seo'
import ProductImage from '../components/ProductImage'
import OrderTimeline from '../components/OrderTimeline'

const CheckoutPage = () => {
  const { items, removeItems } = useCart()
  const { placeOrder, applyCoupon, loyaltyPoints } = useStore()
  const { user, hasRole } = useAuth()
  const [usePoints, setUsePoints] = useState(true)
  const [address, setAddress] = useState('')
  const [city, setCity] = useState(soccsksargenPlaces[0].label)
  const [payment, setPayment] = useState<'GCash' | 'Cash on delivery'>('Cash on delivery')
  const [gcashRef, setGcashRef] = useState('')
  const [couponInput, setCouponInput] = useState('')
  const [couponMsg, setCouponMsg] = useState('')
  const [shippingDiscount, setShippingDiscount] = useState(0)
  const [couponCode, setCouponCode] = useState<string | undefined>()
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const place = soccsksargenPlaces.find((item) => item.label === city) || soccsksargenPlaces[0]
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: place.lat, lng: place.lng })
  const [gpsNote, setGpsNote] = useState('Using the selected SOCCSKSARGEN city pin until you share GPS.')

  const validItems = useMemo(() => {
    return (items || []).filter(
      (item): item is any =>
        Boolean(item && item.product && item.product.id && item.selected !== false)
    )
  }, [items])

  const safeSubtotal = useMemo(() => {
    return validItems.reduce(
      (sum, item) => sum + (Number(item.product?.price) || 0) * (Number(item.quantity) || 1),
      0
    )
  }, [validItems])

  const shippingFee = safeSubtotal >= 500 ? 0 : 50
  const afterCoupon = Math.max(0, shippingFee - shippingDiscount)
  const safeLoyaltyPoints = Number(loyaltyPoints) || 0
  const pointsRedeemed = usePoints && user ? Math.min(safeLoyaltyPoints, afterCoupon) : 0
  const payableShipping = Math.max(0, afterCoupon - pointsRedeemed)
  const total = safeSubtotal + payableShipping
  const willEarn = pointsFromSpend(safeSubtotal)

  const couponHints = useMemo(() => shippingCoupons.map((item) => item.code).join(', '), [])

  const tryCoupon = () => {
    const result = applyCoupon(couponInput, shippingFee, safeSubtotal)
    setCouponMsg(result.message)
    setShippingDiscount(result.ok ? result.discount : 0)
    setCouponCode(result.ok ? result.code : undefined)
  }

  const pinGps = () => {
    if (!navigator.geolocation) {
      setGpsNote('This browser cannot share GPS. The rider will use your SOCCSKSARGEN city pin.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude })
        setGpsNote('Drop-off GPS captured for the rider after the seller confirms.')
      },
      () => setGpsNote('GPS was denied. The rider will navigate from the typed address.')
    )
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (payment === 'GCash' && gcashRef.trim().length < 4) return
    setErrorMessage(null)
    setIsSubmitting(true)

    const selected = soccsksargenPlaces.find((item) => item.label === city) || place
    try {
      const order = await placeOrder({
        items: validItems.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          price: Number(item.product.price) || 0,
          quantity: Math.max(1, Number(item.quantity) || 1),
          image: item.product.image || '',
          seller: item.product.seller || 'Farm Stall',
          sellerId: item.product.sellerId,
          sellerUserId: Number(item.product.sellerUserId),
          pickupLocation: item.product.location || 'SOCCSKSARGEN',
        })),
        subtotal: safeSubtotal,
        shippingFee,
        shippingDiscount,
        couponCode,
        total,
        address: `${address}, ${city}`,
        payment,
        paymentRef: payment === 'GCash' ? gcashRef.trim() : undefined,
        buyerPhone: user?.phone,
        lat: coords.lat || selected.lat,
        lng: coords.lng || selected.lng,
        pointsRedeemed,
      })
      const checkedOutIds = validItems.map((item) => item.product.id)
      removeItems(checkedOutIds)
      setPlacedOrder(order)
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to place order. Please check item stock and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (hasRole('delivery')) {
    return (
      <div className="page-shell max-w-2xl text-center">
        <div className="card p-8 animate-fade-up">
          <h1 className="text-3xl font-bold mb-3">Delivery Rider Desk</h1>
          <p className="text-gray-600 mb-6">
            Delivery riders do not place orders. Manage assigned deliveries in your Delivery Command Desk.
          </p>
          <Link to="/delivery" className="btn-primary">Open Delivery Command Desk</Link>
        </div>
      </div>
    )
  }

  if (placedOrder) {
    return (
      <div className="page-shell max-w-3xl space-y-6">
        <Seo title={`Order Placed #${placedOrder.id}`} description="Your harvest order is placed." path="/checkout" />
        <div className="card p-6 sm:p-8 text-center animate-fade-up">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4 ring-8 ring-emerald-50">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-100 text-primary-800 uppercase tracking-wider">
            Order Confirmed · Waiting for Seller
          </span>
          <h1 className="text-3xl font-extrabold mt-3 text-gray-900">Harvest Reserved!</h1>
          <p className="text-gray-600 max-w-lg mx-auto mt-2 text-sm sm:text-base">
            Order <strong className="text-gray-900">#{placedOrder.id}</strong> ({placedOrder.receiptNo}) has been transmitted to the farm stalls.
            The seller must confirm before a SOCCSKSARGEN rider is notified to collect and deliver your crates.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Link to={`/orders/${placedOrder.id}/receipt`} className="btn-primary inline-flex items-center gap-2">
              <Receipt className="h-4 w-4" /> View official receipt
            </Link>
            <Link to="/orders" className="btn-outline inline-flex items-center gap-2">
              <Package className="h-4 w-4" /> Track in My Purchases
            </Link>
          </div>
        </div>

        {/* Real-time Order Timeline */}
        <div className="card p-4 sm:p-6 animate-fade-up">
          <h2 className="font-bold text-gray-900 mb-3 text-sm sm:text-base flex items-center justify-between">
            <span>Status Timeline</span>
            <span className="text-xs font-normal text-gray-500">{new Date(placedOrder.createdAt || Date.now()).toLocaleString()}</span>
          </h2>
          <OrderTimeline status={placedOrder.status} statusHistory={placedOrder.statusHistory} />
        </div>

        {/* Order Details & Items Card */}
        <div className="card p-5 sm:p-6 space-y-5 animate-fade-up">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="font-bold text-lg text-gray-900">Order Items</h2>
              <p className="text-xs text-gray-500">Shipped direct from regional growers</p>
            </div>
            <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg">
              {placedOrder.items.length} {placedOrder.items.length === 1 ? 'variety' : 'varieties'}
            </span>
          </div>

          <ul className="divide-y divide-gray-100">
            {placedOrder.items.map((item) => (
              <li key={item.productId} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ProductImage src={item.image} alt={item.name} className="h-12 w-12 rounded-xl object-cover" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      Seller: <span className="font-medium text-primary-800">{item.seller}</span> · Qty: <strong>{item.quantity}</strong>
                    </p>
                  </div>
                </div>
                <p className="font-bold text-sm sm:text-base text-gray-900">{formatPeso((Number(item.price) || 0) * (Number(item.quantity) || 1))}</p>
              </li>
            ))}
          </ul>

          <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 text-sm">
            <div className="bg-gray-50 rounded-xl p-3.5 space-y-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Delivery Destination</p>
              <p className="font-semibold text-gray-900">{placedOrder.buyerName}</p>
              <p className="text-gray-600 text-xs sm:text-sm">{placedOrder.address}</p>
              <p className="text-gray-500 text-xs">{placedOrder.buyerPhone || user?.phone || 'Mobile provided'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3.5 space-y-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment & Total</p>
              <p className="font-semibold text-gray-900">{placedOrder.payment} {placedOrder.paymentRef ? `· ${placedOrder.paymentRef}` : ''}</p>
              <p className="text-gray-600 text-xs sm:text-sm">Subtotal: {formatPeso(placedOrder.subtotal)} + Delivery: {formatPeso(placedOrder.shippingFee)}</p>
              <p className="text-primary-800 font-bold text-base pt-1">Total: {formatPeso(placedOrder.total)}</p>
            </div>
          </div>

          <div className="pt-2 text-center">
            <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-800">
              Continue shopping fresh produce <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (validItems.length === 0) {
    return (
      <div className="page-shell text-center max-w-lg mx-auto">
        <div className="card p-8 animate-fade-up">
          <h1 className="text-3xl font-bold mb-3">Nothing to check out</h1>
          <p className="text-gray-600 mb-6">Your basket is currently empty or no produce was checked for checkout.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/cart" className="btn-primary">Go to Cart</Link>
            <Link to="/marketplace" className="btn-outline">Browse marketplace</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell grid lg:grid-cols-3 gap-8">
      <Seo title="Checkout" description="Pay with GCash or COD. Sellers confirm before a SOCCSKSARGEN rider is dispatched." path="/checkout" />
      <form onSubmit={submit} className="lg:col-span-2 card space-y-4">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="text-sm text-gray-600">The seller confirms first. Only then does the rider receive your name, mobile, drop-off, and the harvest list.</p>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}
        <div>
          <label className="label" htmlFor="address">Street / purok / barangay</label>
          <input id="address" required className="input-field" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Purok 2, Brgy. Zone 1" />
        </div>
        <div>
          <label className="label" htmlFor="city">City / municipality (SOCCSKSARGEN)</label>
          <select
            id="city"
            required
            className="input-field"
            value={city}
            onChange={(event) => {
              const next = event.target.value
              setCity(next)
              const match = soccsksargenPlaces.find((item) => item.label === next)
              if (match) setCoords({ lat: match.lat, lng: match.lng })
            }}
          >
            {soccsksargenPlaces.map((item) => (
              <option key={item.label} value={item.label}>{item.label}</option>
            ))}
          </select>
        </div>
        <div className="rounded-2xl border border-gray-200 p-4">
          <p className="font-semibold inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> Drop-off GPS</p>
          <p className="text-sm text-gray-600 mt-1">{gpsNote}</p>
          <button type="button" className="btn-outline mt-3" onClick={pinGps}>Share my location</button>
        </div>
        <div>
          <label className="label">Mode of payment</label>
          <div className="grid sm:grid-cols-2 gap-3">
            {(['Cash on delivery', 'GCash'] as const).map((method) => (
              <button
                type="button"
                key={method}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  payment === method ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setPayment(method)}
              >
                <p className="font-semibold">{method}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {method === 'GCash' ? 'Enter reference after sending to the stall QR' : 'Pay rider upon drop-off inside SOCCSKSARGEN'}
                </p>
              </button>
            ))}
          </div>
        </div>
        {payment === 'GCash' && (
          <div className="rounded-2xl border border-primary-200 bg-primary-50/60 p-4 space-y-3">
            <p className="font-semibold text-sm">GCash payment reference</p>
            <p className="text-xs text-gray-600">Scan stall QR or send to 0917-000-FARM. Input reference number below.</p>
            <input
              required
              className="input-field bg-white"
              placeholder="e.g. 1002 9384 1120"
              value={gcashRef}
              onChange={(event) => setGcashRef(event.target.value)}
            />
          </div>
        )}
        <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
          <p className="font-semibold text-sm">Shipping discount voucher</p>
          <div className="flex gap-2">
            <input
              className="input-field uppercase"
              placeholder="Voucher code"
              value={couponInput}
              onChange={(event) => setCouponInput(event.target.value)}
            />
            <button type="button" className="btn-outline whitespace-nowrap" onClick={tryCoupon}>Apply</button>
          </div>
          {couponMsg && <p className="text-xs text-primary-700 font-medium">{couponMsg}</p>}
          <p className="text-xs text-gray-400">Available demo vouchers: {couponHints}</p>
        </div>
        <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 cursor-pointer">
          <input type="checkbox" className="mt-1" checked={usePoints} onChange={(event) => setUsePoints(event.target.checked)} />
          <span>
            <span className="font-semibold inline-flex items-center gap-1"><Coins className="h-4 w-4" /> Apply harvest points to shipping</span>
            <span className="block text-sm text-gray-700 mt-1">
              Wallet: {loyaltyPoints} pts. This order uses {pointsRedeemed} pts (₱1 each) and earns {willEarn} pts from the harvest.
            </span>
          </span>
        </label>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
          {isSubmitting ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              <span>Processing order with central database...</span>
            </>
          ) : (
            <span>Place order · {formatPeso(total)}</span>
          )}
        </button>
      </form>
      <aside className="card h-fit">
        <h2 className="font-semibold mb-4">Checked Harvests</h2>
        <ul className="space-y-3 text-sm">
          {validItems.map((item) => {
            const prod = item.product || {}
            const itemPrice = Number(prod.price) || 0
            const itemQty = Math.max(1, Number(item.quantity) || 1)
            return (
              <li key={prod.id || Math.random()} className="flex justify-between gap-2">
                <span className="flex items-center gap-2">
                  <ProductImage src={prod.image} alt={prod.name || 'Harvest Produce'} className="h-8 w-8 rounded object-cover" />
                  <span>
                    {prod.name || 'Harvest Produce'} × {itemQty}
                    <span className="block text-xs text-gray-500">{prod.seller || 'Farm Stall'}</span>
                  </span>
                </span>
                <span>{formatPeso(itemPrice * itemQty)}</span>
              </li>
            )
          })}
        </ul>
        <div className="border-t mt-4 pt-4 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatPeso(safeSubtotal)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{formatPeso(shippingFee)}</span></div>
          <div className="flex justify-between text-primary-800"><span>Shipping discount</span><span>-{formatPeso(shippingDiscount)}</span></div>
          <div className="flex justify-between text-amber-800"><span>Points on shipping</span><span>-{formatPeso(pointsRedeemed)}</span></div>
          <div className="flex justify-between text-amber-800"><span>Points you will earn</span><span>+{willEarn}</span></div>
        </div>
        <div className="border-t mt-4 pt-4 font-bold flex justify-between">
          <span>Total</span>
          <span>{formatPeso(total)}</span>
        </div>
      </aside>
    </div>
  )
}

export default CheckoutPage
