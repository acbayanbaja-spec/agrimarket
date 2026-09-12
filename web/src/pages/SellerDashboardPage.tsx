import { useState } from 'react'
import { Link } from 'react-router-dom'
import { categories, stockLabel } from '../data/catalog'
import { useStore, type Order } from '../context/StoreContext'
import { fileToDataUrl, formatPeso } from '../lib/utils'
import Seo from '../components/Seo'
import ProductImage from '../components/ProductImage'

const statuses: Order['status'][] = ['Pending', 'Confirmed', 'Shipped', 'Out for delivery', 'Delivered']

const SellerDashboardPage = () => {
  const { addProduct, myListings, removeProduct, orders, updateOrderStatus, addPost, updateProductStock, updateProductPrice } = useStore()
  const [form, setForm] = useState({
    name: '',
    category: categories[0].name,
    price: 50,
    unit: 'kg',
    stock: 20,
    location: '',
    image: '/images/farm.jpg',
    description: '',
    organic: false,
    tradeable: true,
    lat: 14.5995,
    lng: 120.9842,
  })
  const [listed, setListed] = useState(false)
  const [postBody, setPostBody] = useState('')
  const [postCategory, setPostCategory] = useState(categories[0].name)

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
      image: form.image,
      description: form.description.trim(),
      organic: form.organic,
      tradeable: form.tradeable,
      lat: Number(form.lat),
      lng: Number(form.lng),
    })
    setListed(true)
    setForm((current) => ({ ...current, name: '', description: '' }))
    window.setTimeout(() => setListed(false), 2500)
  }

  return (
    <div className="page-shell space-y-8">
      <Seo title="Seller dashboard" description="List harvests, post to the feed, and fulfill orders." path="/seller-dashboard" />
      <div>
        <h1 className="text-4xl font-bold">Seller dashboard</h1>
        <p className="text-gray-600 mt-2">You can still buy as a shopper. List harvests, tag a category, and ping followers.</p>
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
          {listed && <p className="text-sm text-primary-800 bg-primary-50 rounded-xl px-3 py-2">Listing published. Followers of that category are notified.</p>}
          <input required className="input-field" placeholder="Product name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <select className="input-field" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
            {categories.map((category) => (
              <option key={category.name}>{category.name}</option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-3">
            <input type="number" min={1} className="input-field" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} />
            <input className="input-field" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
            <input type="number" min={0} className="input-field" value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })} />
          </div>
          <input required className="input-field" placeholder="Farm location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input-field" type="number" step="0.0001" value={form.lat} onChange={(event) => setForm({ ...form, lat: Number(event.target.value) })} />
            <input className="input-field" type="number" step="0.0001" value={form.lng} onChange={(event) => setForm({ ...form, lng: Number(event.target.value) })} />
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={async (event) => {
              const file = event.target.files?.[0]
              if (file) setForm({ ...form, image: await fileToDataUrl(file) })
            }}
          />
          <textarea required rows={4} className="input-field" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.organic} onChange={(event) => setForm({ ...form, organic: event.target.checked })} />
            Organic
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.tradeable} onChange={(event) => setForm({ ...form, tradeable: event.target.checked })} />
            Open to trade
          </label>
          <button type="submit" className="btn-primary">Publish listing</button>
        </form>

        <div className="space-y-6">
          <form
            className="card space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              if (!postBody.trim()) return
              addPost({ body: postBody.trim(), category: postCategory, photos: [form.image] })
              setPostBody('')
            }}
          >
            <h2 className="text-xl font-semibold">Post like a feed</h2>
            <p className="text-sm text-gray-600">Tag a category. Buyers and sellers who follow it get a notification.</p>
            <select className="input-field" value={postCategory} onChange={(event) => setPostCategory(event.target.value)}>
              {categories.map((category) => <option key={category.name}>{category.name}</option>)}
            </select>
            <textarea required rows={3} className="input-field" placeholder="What’s harvesting today?" value={postBody} onChange={(event) => setPostBody(event.target.value)} />
            <button type="submit" className="btn-primary">Share to feed</button>
          </form>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Your listings</h2>
            {myListings.length === 0 ? (
              <p className="text-gray-600">No listings yet. Publish your first harvest on the left.</p>
            ) : (
              <ul className="space-y-3">
                {myListings.map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-3">
                      <ProductImage src={product.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      <div>
                        <Link to={`/products/${product.id}`} className="font-semibold hover:text-primary-700">{product.name}</Link>
                        <p className="text-sm text-gray-500">{formatPeso(product.price)} · {stockLabel(product.stock)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="text-xs" onClick={() => updateProductStock(product.id, Math.max(0, product.stock - 5))}>− stock</button>
                      <button type="button" className="text-xs" onClick={() => updateProductPrice(product.id, product.price + 5)}>+ price</button>
                      <button type="button" className="text-sm text-red-600" onClick={() => removeProduct(product.id)}>Remove</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
                  className="input-field w-52"
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
