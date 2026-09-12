import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { formatPeso } from '../lib/utils'
import { shippingCoupons } from '../data/catalog'
import Seo from '../components/Seo'
import ProductImage from '../components/ProductImage'

const CheckoutPage = () => {
  const { items, subtotal, clear } = useCart()
  const { placeOrder, applyCoupon } = useStore()
  const { user } = useAuth()
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [payment, setPayment] = useState<'GCash' | 'Cash on delivery'>('Cash on delivery')
  const [gcashRef, setGcashRef] = useState('')
  const [couponInput, setCouponInput] = useState('')
  const [couponMsg, setCouponMsg] = useState('')
  const [shippingDiscount, setShippingDiscount] = useState(0)
  const [couponCode, setCouponCode] = useState<string | undefined>()
  const [placed, setPlaced] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 14.5995, lng: 120.9842 })
  const [gpsNote, setGpsNote] = useState('Using Metro Manila pin until the browser shares GPS.')

  const shippingFee = subtotal >= 500 ? 0 : 50
  const payableShipping = Math.max(0, shippingFee - shippingDiscount)
  const total = subtotal + payableShipping

  const tryCoupon = () => {
    const result = applyCoupon(couponInput, shippingFee, subtotal)
    setCouponMsg(result.message)
    setShippingDiscount(result.ok ? result.discount : 0)
    setCouponCode(result.ok ? result.code : undefined)
  }

  const couponHints = useMemo(() => shippingCoupons.map((item) => item.code).join(', '), [])

  const pinGps = () => {
    if (!navigator.geolocation) {
      setGpsNote('This browser cannot share GPS. The rider still gets a Metro Manila pin.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude })
        setGpsNote('Drop-off GPS captured for the rider.')
      },
      () => setGpsNote('GPS was denied. The rider will navigate from the typed address.')
    )
  }

  if (items.length === 0 && !placed) {
    return (
      <div className="page-shell text-center">
        <h1 className="text-3xl font-bold mb-3">Nothing to check out</h1>
        <Link to="/marketplace" className="btn-primary">Shop first</Link>
      </div>
    )
  }

  if (placed) {
    return (
      <div className="page-shell max-w-lg text-center">
        <div className="card animate-fade-up">
          <h1 className="text-3xl font-bold mb-2">Order confirmed</h1>
          <p className="text-gray-600">Your rider can SMS you updates. Receipt {placed} is ready to print.</p>
          <div className="flex gap-3 justify-center mt-6">
            <Link to={`/orders/${placed}/receipt`} className="btn-primary">View receipt</Link>
            <Link to="/orders" className="btn-outline">Order history</Link>
          </div>
        </div>
      </div>
    )
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (payment === 'GCash' && gcashRef.trim().length < 4) return
    const order = placeOrder({
      items: items.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image,
        seller: item.product.seller,
      })),
      subtotal,
      shippingFee,
      shippingDiscount,
      couponCode,
      total,
      address: `${address}, ${city}`,
      payment,
      paymentRef: payment === 'GCash' ? gcashRef.trim() : undefined,
      buyerPhone: user?.phone,
      lat: coords.lat,
      lng: coords.lng,
    })
    clear()
    setPlaced(order.id)
  }

  return (
    <div className="page-shell grid lg:grid-cols-3 gap-8">
      <Seo title="Checkout" description="Pay with GCash or cash on delivery and apply shipping-only coupons." path="/checkout" />
      <form onSubmit={submit} className="lg:col-span-2 card space-y-4">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <div>
          <label className="label" htmlFor="address">Street address</label>
          <input id="address" required className="input-field" value={address} onChange={(event) => setAddress(event.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="city">City / municipality</label>
          <input id="city" required className="input-field" value={city} onChange={(event) => setCity(event.target.value)} />
        </div>
        <div className="rounded-2xl border border-gray-200 p-4">
          <p className="font-semibold">Drop-off GPS</p>
          <p className="text-sm text-gray-600 mt-1">{gpsNote}</p>
          <button type="button" className="btn-outline mt-3" onClick={pinGps}>Share my location</button>
        </div>
        <div>
          <label className="label">Mode of payment</label>
          <div className="grid sm:grid-cols-2 gap-3">
            {(['Cash on delivery', 'GCash'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPayment(method)}
                className={`rounded-2xl border-2 p-4 text-left ${payment === method ? 'border-primary-600 bg-primary-50' : 'border-gray-200'}`}
              >
                <p className="font-semibold">{method}</p>
                <p className="text-sm text-gray-600">{method === 'GCash' ? 'Send to 09XX AgriMarket and paste the reference.' : 'Pay the rider on arrival.'}</p>
              </button>
            ))}
          </div>
        </div>
        {payment === 'GCash' && (
          <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4 space-y-2">
            <p className="font-semibold">GCash checkout</p>
            <p className="text-sm text-gray-700">Send {formatPeso(total)} to <strong>0917 000 2468</strong> (AgriMarket Treasury).</p>
            <input required className="input-field" placeholder="GCash reference number" value={gcashRef} onChange={(event) => setGcashRef(event.target.value)} />
          </div>
        )}
        <div>
          <label className="label">Shipping coupon</label>
          <div className="flex gap-2">
            <input className="input-field" placeholder="SHIP50 / FREESHIP" value={couponInput} onChange={(event) => setCouponInput(event.target.value)} />
            <button type="button" className="btn-outline" onClick={tryCoupon}>Apply</button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Coupons discount shipping only. Try {couponHints}.</p>
          {couponMsg && <p className="text-sm mt-2 text-primary-800">{couponMsg}</p>}
        </div>
        <button type="submit" className="btn-primary">Place order · {formatPeso(total)}</button>
      </form>
      <aside className="card h-fit">
        <h2 className="font-semibold mb-4">Your basket</h2>
        <ul className="space-y-3 text-sm">
          {items.map((item) => (
            <li key={item.product.id} className="flex justify-between gap-2">
              <span className="flex items-center gap-2">
                <ProductImage src={item.product.image} alt="" className="h-8 w-8 rounded object-cover" />
                {item.product.name} × {item.quantity}
              </span>
              <span>{formatPeso(item.product.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t mt-4 pt-4 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatPeso(subtotal)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{formatPeso(shippingFee)}</span></div>
          <div className="flex justify-between text-primary-800"><span>Shipping discount</span><span>-{formatPeso(shippingDiscount)}</span></div>
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
