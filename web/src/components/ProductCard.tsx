import { Link } from 'react-router-dom'
import { MapPin, Star, Repeat, Coins } from 'lucide-react'
import type { Product } from '../data/catalog'
import { formatPeso } from '../lib/utils'
import { stockLabel, stockTone } from '../data/catalog'
import { harvestMeta } from '../lib/commerce'
import { useCartSheet } from '../context/CartSheetContext'
import ProductImage from './ProductImage'

type Props = {
  product: Product
  delay?: number
}

const ProductCard = ({ product, delay = 0 }: Props) => {
  const { openSheet } = useCartSheet()
  const out = product.stock <= 0
  const meta = harvestMeta(product)

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
        <span className="absolute bottom-3 left-3 chip bg-soil-900/80 text-white">{meta.sold}+ sold</span>
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
        <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Star className="h-4 w-4 fill-secondary-400 text-secondary-400" />
            {product.rating}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {product.location}
          </span>
        </div>
        <p className="text-xs inline-flex items-center gap-1 text-amber-800">
          <Coins className="h-3.5 w-3.5" /> Earn {meta.points} harvest pts · {meta.eta}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-gray-900">
            {formatPeso(product.price)}
            <span className="text-sm font-medium text-gray-500"> / {product.unit}</span>
            <span className="block text-xs font-medium text-gray-400 line-through">{formatPeso(meta.originalPrice)}</span>
          </p>
          <button type="button" className="btn-primary px-3 py-2 text-sm" disabled={out} onClick={() => openSheet(product)}>
            {out ? 'Sold out' : 'Add'}
          </button>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
