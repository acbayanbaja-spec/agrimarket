import { Link } from 'react-router-dom'
import { MapPin, Star, Repeat } from 'lucide-react'
import type { Product } from '../data/catalog'
import { formatPeso } from '../lib/utils'
import { stockLabel, stockTone } from '../data/catalog'
import { useCart } from '../context/CartContext'
import ProductImage from './ProductImage'

type Props = {
  product: Product
  delay?: number
}

const ProductCard = ({ product, delay = 0 }: Props) => {
  const { addItem } = useCart()
  const out = product.stock <= 0

  return (
    <article
      className="group bg-white/90 rounded-2xl border border-white overflow-hidden shadow-sm hover:shadow-soft hover:-translate-y-1 transition-all duration-300 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Link to={`/products/${product.id}`} className="block overflow-hidden relative">
        <ProductImage
          src={product.image}
          alt={product.name}
          className="h-48 w-full object-cover group-hover:scale-[1.06] transition-transform duration-500"
        />
        <span className={`absolute top-3 left-3 chip ${stockTone(product.stock)}`}>{stockLabel(product.stock)}</span>
        {product.tradeable && (
          <span className="absolute top-3 right-3 chip bg-white/90 text-primary-800">
            <Repeat className="h-3 w-3 mr-1" /> Trade
          </span>
        )}
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
          <button type="button" className="btn-primary px-3 py-2 text-sm" disabled={out} onClick={() => addItem(product)}>
            {out ? 'Sold out' : 'Add'}
          </button>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
