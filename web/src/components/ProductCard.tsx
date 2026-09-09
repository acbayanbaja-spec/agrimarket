import { Link } from 'react-router-dom'
import { MapPin, Star } from 'lucide-react'
import type { Product } from '../data/catalog'
import { formatPeso } from '../lib/utils'
import { useCart } from '../context/CartContext'

type Props = {
  product: Product
}

const ProductCard = ({ product }: Props) => {
  const { addItem } = useCart()

  return (
    <article className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-soft transition-shadow">
      <Link to={`/products/${product.id}`} className="block overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="h-48 w-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
        />
      </Link>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{product.category}</p>
            <Link to={`/products/${product.id}`} className="font-display text-lg font-semibold text-gray-900 hover:text-primary-700">
              {product.name}
            </Link>
          </div>
          {product.organic && (
            <span className="text-[11px] font-semibold bg-primary-50 text-primary-800 px-2 py-1 rounded-full">Organic</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Star className="h-4 w-4 fill-secondary-400 text-secondary-400" />
            {product.rating} ({product.reviews})
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {product.location}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-gray-900">
            {formatPeso(product.price)}
            <span className="text-sm font-medium text-gray-500"> / {product.unit}</span>
          </p>
          <button type="button" className="btn-primary px-3 py-2 text-sm" onClick={() => addItem(product)}>
            Add
          </button>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
