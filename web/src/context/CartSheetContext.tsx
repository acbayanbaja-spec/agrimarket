import React, { createContext, useContext, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Truck, Coins, ShieldCheck, X } from 'lucide-react'
import type { Product } from '../data/catalog'
import { harvestMeta } from '../lib/commerce'
import { formatPeso } from '../lib/utils'
import { useCart } from './CartContext'
import { useToast } from './ToastContext'
import ProductImage from '../components/ProductImage'
import QuantityStepper from '../components/QuantityStepper'

type CartSheetContextType = {
  openSheet: (product: Product) => void
}

const CartSheetContext = createContext<CartSheetContextType | undefined>(undefined)

export const CartSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addItem } = useCart()
  const { toast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)

  const openSheet = (next: Product) => {
    if (next.stock <= 0) return
    setProduct(next)
    setQuantity(1)
  }

  const meta = product ? harvestMeta(product) : null
  const total = product ? product.price * quantity : 0

  const confirm = () => {
    if (!product) return
    addItem(product, quantity)
    toast(`Added to cart · ${product.name}`, '/cart')
    setProduct(null)
  }

  const value = useMemo(() => ({ openSheet }), [])

  return (
    <CartSheetContext.Provider value={value}>
      {children}
      {product && meta && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
          <button type="button" className="absolute inset-0 bg-black/50 animate-fade-in" aria-label="Close" onClick={() => setProduct(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-soft p-5 animate-sheet-up max-h-[92vh] overflow-y-auto">
            <button type="button" className="absolute right-4 top-4 p-1 text-gray-500" onClick={() => setProduct(null)} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
            <div className="flex gap-4">
              <ProductImage src={product.image} alt="" className="h-28 w-28 rounded-2xl object-cover" />
              <div className="flex-1 pr-6">
                <p className="text-xs font-bold uppercase tracking-wide text-primary-700">{product.category}</p>
                <h2 className="text-xl font-bold leading-tight">{product.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{meta.origin}</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-2xl font-bold text-primary-700">{formatPeso(product.price)}</p>
                  <p className="text-sm text-gray-400 line-through">{formatPeso(meta.originalPrice)}</p>
                  <p className="text-sm text-gray-500">/ {product.unit}</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-700 leading-relaxed">{product.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <p className="rounded-xl bg-primary-50 px-3 py-2 inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-secondary-500" /> {product.rating} · {meta.sold} sold</p>
              <p className="rounded-xl bg-amber-50 px-3 py-2 inline-flex items-center gap-1.5"><Coins className="h-3.5 w-3.5" /> Earn {meta.points * quantity} pts</p>
              <p className="rounded-xl bg-sky-50 px-3 py-2 inline-flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> {meta.eta}</p>
              <p className="rounded-xl bg-soil-100 px-3 py-2 inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> {meta.freshness}</p>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Quantity</p>
                <QuantityStepper value={quantity} max={product.stock} onChange={setQuantity} />
              </div>
              <p className="text-lg font-bold">{formatPeso(total)}</p>
            </div>
            <p className="mt-2 text-xs text-gray-500">{product.stock} {product.unit} left · {meta.guarantee}</p>
            <button type="button" className="btn-primary w-full mt-5 py-3 text-base animate-pulse-soft" onClick={confirm}>
              Confirm add to cart
            </button>
            <Link to={`/products/${product.id}`} className="block text-center text-sm font-semibold text-primary-700 mt-3" onClick={() => setProduct(null)}>
              See full product details
            </Link>
          </div>
        </div>
      )}
    </CartSheetContext.Provider>
  )
}

export const useCartSheet = () => {
  const context = useContext(CartSheetContext)
  if (!context) throw new Error('useCartSheet must be used within a CartSheetProvider')
  return context
}
