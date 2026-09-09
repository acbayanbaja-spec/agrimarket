import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MapPin, Star, Truck } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useCart } from '../context/CartContext'
import { formatPeso } from '../lib/utils'
import ProductCard from '../components/ProductCard'

const ProductDetailPage = () => {
  const { id } = useParams()
  const { products } = useStore()
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const product = products.find((item) => item.id === id)

  if (!product) {
    return (
      <div className="page-shell text-center">
        <h1 className="text-3xl font-bold mb-3">Product not found</h1>
        <p className="text-gray-600 mb-6">It may have been harvested already.</p>
        <Link to="/marketplace" className="btn-primary">Back to marketplace</Link>
      </div>
    )
  }

  const related = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 4)

  return (
    <div className="page-shell">
      <div className="grid lg:grid-cols-2 gap-10">
        <img src={product.image} alt={product.name} className="w-full h-[420px] object-cover rounded-3xl" />
        <div>
          <p className="text-sm font-semibold text-primary-700 uppercase">{product.category}</p>
          <h1 className="text-4xl font-bold mt-2">{product.name}</h1>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-secondary-400 text-secondary-400" /> {product.rating} · {product.reviews} reviews</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {product.location}</span>
          </div>
          <p className="text-3xl font-bold mt-6">
            {formatPeso(product.price)} <span className="text-base font-medium text-gray-500">/ {product.unit}</span>
          </p>
          <p className="mt-4 text-gray-700 leading-relaxed">{product.description}</p>
          <p className="mt-4 text-sm text-gray-500">Sold by {product.seller} · {product.stock} {product.unit} in stock</p>
          <div className="flex items-center gap-3 mt-8">
            <input
              type="number"
              min={1}
              max={product.stock}
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
              className="input-field w-24"
            />
            <button type="button" className="btn-primary" onClick={() => addItem(product, quantity)}>
              Add to cart
            </button>
            <Link to="/cart" className="btn-outline">View cart</Link>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-sm text-gray-600">
            <Truck className="h-4 w-4" /> Metro Manila next-day, provincial 2–4 days
          </p>
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
