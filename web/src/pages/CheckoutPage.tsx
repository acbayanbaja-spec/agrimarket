import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useStore } from '../context/StoreContext'
import { formatPeso } from '../lib/utils'

const CheckoutPage = () => {
  const { items, subtotal, clear } = useCart()
  const { placeOrder } = useStore()
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [payment, setPayment] = useState('Cash on delivery')
  const [placed, setPlaced] = useState<string | null>(null)

  const delivery = subtotal >= 500 ? 0 : 50
  const total = subtotal + delivery

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
        <div className="card">
          <h1 className="text-3xl font-bold mb-2">Order confirmed</h1>
          <p className="text-gray-600">Your order <span className="font-semibold">{placed}</span> is with the farm now.</p>
          <div className="flex gap-3 justify-center mt-6">
            <Link to="/orders" className="btn-primary">View orders</Link>
            <Link to="/marketplace" className="btn-outline">Keep shopping</Link>
          </div>
        </div>
      </div>
    )
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const order = placeOrder({
      items: items.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image,
      })),
      total,
      address: `${address}, ${city}`,
      payment,
    })
    clear()
    setPlaced(order.id)
  }

  return (
    <div className="page-shell grid lg:grid-cols-3 gap-8">
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
        <div>
          <label className="label" htmlFor="payment">Payment</label>
          <select id="payment" className="input-field" value={payment} onChange={(event) => setPayment(event.target.value)}>
            <option>Cash on delivery</option>
            <option>GCash</option>
            <option>Bank transfer</option>
          </select>
        </div>
        <button type="submit" className="btn-primary">Place order · {formatPeso(total)}</button>
      </form>
      <aside className="card h-fit">
        <h2 className="font-semibold mb-4">Your basket</h2>
        <ul className="space-y-3 text-sm">
          {items.map((item) => (
            <li key={item.product.id} className="flex justify-between gap-2">
              <span>{item.product.name} × {item.quantity}</span>
              <span>{formatPeso(item.product.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t mt-4 pt-4 font-bold flex justify-between">
          <span>Total</span>
          <span>{formatPeso(total)}</span>
        </div>
      </aside>
    </div>
  )
}

export default CheckoutPage
