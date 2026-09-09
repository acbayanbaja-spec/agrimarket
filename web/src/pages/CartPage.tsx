import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatPeso } from '../lib/utils'

const CartPage = () => {
  const { items, subtotal, updateQuantity, removeItem } = useCart()

  if (items.length === 0) {
    return (
      <div className="page-shell max-w-2xl text-center">
        <h1 className="text-3xl font-bold mb-3">Your basket is empty</h1>
        <p className="text-gray-600 mb-6">Add produce from the marketplace and it will wait here.</p>
        <Link to="/marketplace" className="btn-primary">Browse marketplace</Link>
      </div>
    )
  }

  return (
    <div className="page-shell grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <h1 className="text-3xl font-bold">Cart</h1>
        {items.map((item) => (
          <div key={item.product.id} className="card flex gap-4">
            <img src={item.product.image} alt="" className="h-24 w-24 rounded-xl object-cover" />
            <div className="flex-1">
              <Link to={`/products/${item.product.id}`} className="font-semibold hover:text-primary-700">{item.product.name}</Link>
              <p className="text-sm text-gray-500">{item.product.seller}</p>
              <p className="mt-1 font-semibold">{formatPeso(item.product.price)}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <input
                type="number"
                min={1}
                className="input-field w-20"
                value={item.quantity}
                onChange={(event) => updateQuantity(item.product.id, Number(event.target.value))}
              />
              <button type="button" className="text-sm text-red-600" onClick={() => removeItem(item.product.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <aside className="card h-fit">
        <h2 className="text-xl font-semibold mb-4">Summary</h2>
        <div className="flex justify-between text-gray-600 mb-2">
          <span>Subtotal</span>
          <span>{formatPeso(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600 mb-4">
          <span>Delivery</span>
          <span>{subtotal >= 500 ? 'Free' : formatPeso(50)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg mb-6">
          <span>Total</span>
          <span>{formatPeso(subtotal + (subtotal >= 500 ? 0 : 50))}</span>
        </div>
        <Link to="/checkout" className="btn-primary w-full">Checkout</Link>
      </aside>
    </div>
  )
}

export default CartPage
