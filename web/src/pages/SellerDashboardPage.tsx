import { useState } from 'react'
import { Link } from 'react-router-dom'
import { categories } from '../data/catalog'
import { useStore, type Order } from '../context/StoreContext'
import { formatPeso } from '../lib/utils'

const statuses: Order['status'][] = ['Pending', 'Confirmed', 'Shipped', 'Delivered']

const SellerDashboardPage = () => {
  const { addProduct, myListings, removeProduct, orders, updateOrderStatus } = useStore()
  const [form, setForm] = useState({
    name: '',
    category: categories[0].name,
    price: 50,
    unit: 'kg',
    stock: 20,
    location: '',
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80',
    description: '',
    organic: false,
  })
  const [listed, setListed] = useState(false)

  const incoming = orders.filter((order) =>
    order.items.some((item) => myListings.some((product) => product.id === item.productId))
  )

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    addProduct({
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
      unit: form.unit,
      stock: Number(form.stock),
      location: form.location.trim(),
      image: form.image.trim(),
      description: form.description.trim(),
      organic: form.organic,
    })
    setListed(true)
    setForm((current) => ({ ...current, name: '', description: '' }))
    window.setTimeout(() => setListed(false), 2500)
  }

  return (
    <div className="page-shell space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Seller dashboard</h1>
        <p className="text-gray-600 mt-2">List harvests, watch stock, and move orders toward delivery.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: 'Active listings', value: myListings.length },
          { label: 'Incoming orders', value: incoming.length },
          { label: 'Pending fulfillment', value: incoming.filter((order) => order.status !== 'Delivered').length },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <form onSubmit={submit} className="card space-y-4">
          <h2 className="text-xl font-semibold">New listing</h2>
          {listed && <p className="text-sm text-primary-800 bg-primary-50 rounded-xl px-3 py-2">Listing published to the marketplace.</p>}
          <input required className="input-field" placeholder="Product name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <select className="input-field" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
            {categories.map((category) => (
              <option key={category.name}>{category.name}</option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-3">
            <input type="number" min={1} className="input-field" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} />
            <input className="input-field" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
            <input type="number" min={1} className="input-field" value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })} />
          </div>
          <input required className="input-field" placeholder="Farm location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
          <input className="input-field" placeholder="Image URL" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} />
          <textarea required rows={4} className="input-field" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.organic} onChange={(event) => setForm({ ...form, organic: event.target.checked })} />
            Organic
          </label>
          <button type="submit" className="btn-primary">Publish listing</button>
        </form>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Your listings</h2>
          {myListings.length === 0 ? (
            <p className="text-gray-600">No listings yet. Publish your first harvest on the left.</p>
          ) : (
            <ul className="space-y-3">
              {myListings.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <Link to={`/products/${product.id}`} className="font-semibold hover:text-primary-700">{product.name}</Link>
                    <p className="text-sm text-gray-500">{formatPeso(product.price)} / {product.unit}</p>
                  </div>
                  <button type="button" className="text-sm text-red-600" onClick={() => removeProduct(product.id)}>Remove</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Orders for your products</h2>
        {incoming.length === 0 ? (
          <p className="text-gray-600">No orders yet. Share your stall from the marketplace.</p>
        ) : (
          <div className="space-y-4">
            {incoming.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <p className="font-semibold">{order.id}</p>
                  <p className="text-sm text-gray-500">{order.items.map((item) => `${item.name} × ${item.quantity}`).join(', ')}</p>
                </div>
                <select
                  className="input-field w-44"
                  value={order.status}
                  onChange={(event) => updateOrderStatus(order.id, event.target.value as Order['status'])}
                >
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SellerDashboardPage
