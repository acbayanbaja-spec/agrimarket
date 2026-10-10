import { useState } from 'react'
import { Link } from 'react-router-dom'
import { categories, stockLabel } from '../data/catalog'
import { soccsksargenPlaces, findPlace } from '../data/locations'
import { useStore, type Order } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { Bike } from 'lucide-react'
import { fileToDataUrl, formatPeso } from '../lib/utils'
import Seo from '../components/Seo'
import ProductImage from '../components/ProductImage'
import OrderTimeline from '../components/OrderTimeline'

const SellerDashboardPage = () => {
  const { user } = useAuth()
  const { addProduct, myListings, removeProduct, sellerOrders, confirmOrder, markShipped, addPost, updateProductStock, updateProductPrice, ridersList, assignDriver } = useStore()
  const [form, setForm] = useState({
    name: '',
    category: categories[0].name,
    price: 50,
    unit: 'kg',
    stock: 20,
    location: soccsksargenPlaces[0].label,
    image: '/images/farm.jpg',
    description: '',
    organic: false,
    tradeable: true,
    lat: soccsksargenPlaces[0].lat,
    lng: soccsksargenPlaces[0].lng,
  })
  const [listed, setListed] = useState(false)
  const [postBody, setPostBody] = useState('')
  const [postCategory, setPostCategory] = useState(categories[0].name)
  const [postProduct, setPostProduct] = useState('')

  const incoming = sellerOrders

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const place = findPlace(form.location)
    const listedProduct = addProduct({
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
      unit: form.unit,
      stock: Number(form.stock),
      location: form.location,
      image: form.image,
      description: form.description.trim(),
      organic: form.organic,
      tradeable: form.tradeable,
      lat: place.lat,
      lng: place.lng,
    })
    addPost({
      body: `New listing: ${listedProduct.name} from ${listedProduct.location}. ${listedProduct.description.slice(0, 140)}`,
      category: listedProduct.category,
      photos: [listedProduct.image],
      productId: listedProduct.id,
      productName: listedProduct.name,
    })
    setListed(true)
    setForm((current) => ({ ...current, name: '', description: '' }))
    window.setTimeout(() => setListed(false), 2500)
  }

  return (
    <div className="page-shell space-y-8">
      <Seo title="Seller dashboard" description="List harvests, post to the feed, and confirm orders for SOCCSKSARGEN riders." path="/seller-dashboard" />
      <div className="animate-fade-up">
        <h1 className="text-4xl font-bold">Seller dashboard</h1>
        <p className="text-gray-600 mt-2">Confirm a sale first. That pings the rider with buyer info. Mark shipped when the rider collects the crate.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: 'Active listings', value: myListings.length },
          { label: 'Incoming orders', value: incoming.length },
          { label: 'Awaiting your confirm', value: incoming.filter((order) => order.status === 'Pending').length },
        ].map((stat, index) => (
          <div key={stat.label} className="card animate-fade-up" style={{ animationDelay: `${index * 70}ms` }}>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <form onSubmit={submit} className="card space-y-4">
          <h2 className="text-xl font-semibold">New listing</h2>
          {listed && <p className="text-sm text-primary-800 bg-primary-50 rounded-xl px-3 py-2">Listing published and posted to the harvest feed.</p>}
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
          <select
            className="input-field"
            value={form.location}
            onChange={(event) => {
              const location = event.target.value
              const place = findPlace(location)
              setForm({ ...form, location, lat: place.lat, lng: place.lng })
            }}
          >
            {soccsksargenPlaces.map((place) => (
              <option key={place.label} value={place.label}>{place.label}</option>
            ))}
          </select>
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
          <button type="submit" className="btn-primary w-full">Publish listing + feed post</button>
        </form>

        <div className="space-y-6">
          <form
            className="card space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              if (!postBody.trim()) return
              const product = myListings.find((item) => item.id === postProduct)
              addPost({
                body: postBody.trim(),
                category: postCategory,
                photos: [product?.image || form.image],
                productId: product?.id,
                productName: product?.name,
              })
              setPostBody('')
            }}
          >
            <h2 className="text-xl font-semibold">Product feed</h2>
            <p className="text-sm text-gray-600">Posts show on the harvest feed and on the product page buyers open.</p>
            <select className="input-field" value={postCategory} onChange={(event) => setPostCategory(event.target.value)}>
              {categories.map((category) => <option key={category.name}>{category.name}</option>)}
            </select>
            <select className="input-field" value={postProduct} onChange={(event) => setPostProduct(event.target.value)}>
              <option value="">Tag a listing (optional)</option>
              {myListings.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
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
                        <p className="text-sm text-gray-500">{formatPeso(product.price)} · {stockLabel(product.stock)} · {product.location}</p>
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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-semibold">Orders for your products</h2>
            <p className="text-xs text-gray-500">
              Assigned Seller: <strong>{user ? `${user.firstName} ${user.lastName}` : 'Maria Santos (Green Valley Farm)'}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/delivery"
              className="btn-outline text-xs py-1.5 px-3 inline-flex items-center gap-1.5 font-semibold text-emerald-800 border-emerald-200 hover:bg-emerald-50"
            >
              <Bike className="w-4 h-4 text-emerald-600" />
              Delivery Command Desk
            </Link>
            <span className="chip bg-primary-100 text-primary-800 font-bold text-xs">
              {incoming.length} orders assigned to you
            </span>
          </div>
        </div>

        {incoming.length === 0 ? (
          <p className="text-gray-600">No orders yet for your listings. When a buyer checks out an item from your farm, you are the designated seller who confirms it.</p>
        ) : (
          <div className="space-y-6">
            {incoming.map((order: Order) => (
              <div key={order.id} className="border-b border-gray-100 pb-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{order.id} · {order.buyerName}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{order.buyerPhone || 'no mobile'} · {order.address}</p>
                    <div className="mt-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-800">
                      <span className="font-semibold text-gray-700">Your Harvest Items: </span>
                      {order.items.map((item) => `${item.name} (${item.quantity}×)`).join(', ')}
                    </div>
                    <p className="text-sm font-semibold mt-1 text-primary-800">{formatPeso(order.total)} · {order.payment}</p>
                  </div>
                  <div className="flex flex-col gap-2 min-w-[210px]">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-500">Assign Delivery Rider:</label>
                      <select
                        className="input-field text-xs py-1.5 w-full font-semibold"
                        value={order.driverId || ''}
                        onChange={(e) => assignDriver(order.id, Number(e.target.value))}
                      >
                        <option value="">Choose Rider...</option>
                        {ridersList.map((r) => (
                          <option key={r.id} value={r.id}>
                            🛵 {r.first_name} {r.last_name} ({r.phone || 'mobile'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {order.status === 'Pending' && (
                      <button
                        type="button"
                        className="btn-primary py-2 px-4 shadow-sm text-xs font-bold"
                        onClick={() => confirmOrder(order.id, order.driverId || undefined)}
                      >
                        Confirm & dispatch rider
                      </button>
                    )}
                    {order.status === 'Confirmed' && (
                      <button
                        type="button"
                        className="btn-primary py-2 px-4 shadow-sm text-xs font-bold"
                        onClick={() => markShipped(order.id)}
                      >
                        Rider collected · mark shipped
                      </button>
                    )}
                    {order.status !== 'Pending' && order.status !== 'Confirmed' && (
                      <span className="chip bg-primary-50 text-primary-800 text-center">{order.status}</span>
                    )}
                  </div>
                </div>
                <OrderTimeline status={order.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SellerDashboardPage
