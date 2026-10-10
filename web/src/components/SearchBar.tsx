import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Wallet, Package, Bike } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { BUDGET_PRESETS, filterByBudget, harvestMeta, matchProduct, parseSearchQuery } from '../lib/commerce'
import { formatPeso } from '../lib/utils'
import ProductImage from './ProductImage'

type Props = {
  compact?: boolean
  onSubmitted?: () => void
}

const SearchBar = ({ compact, onSubmitted }: Props) => {
  const { products, orders } = useStore()
  const { hasRole } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const isDelivery = hasRole('delivery') || location.pathname.startsWith('/delivery')
  const parsed = parseSearchQuery(query)

  const suggestions = useMemo(() => {
    if (isDelivery) return []
    let list = products.filter((product) => product.stock > 0 && matchProduct(product, parsed.text))
    if (parsed.budget) list = filterByBudget(list, parsed.budget)
    else list = [...list].sort((a, b) => b.rating - a.rating)
    return list.slice(0, 6)
  }, [products, parsed.budget, parsed.text, isDelivery])

  const orderSuggestions = useMemo(() => {
    if (!isDelivery) return []
    if (!query.trim()) return orders.slice(0, 6)
    const q = query.toLowerCase().trim()
    return orders
      .filter((order) =>
        order.id.toLowerCase().includes(q) ||
        (order.receiptNo && order.receiptNo.toLowerCase().includes(q)) ||
        (order.trackingNumber && order.trackingNumber.toLowerCase().includes(q)) ||
        order.buyerName.toLowerCase().includes(q) ||
        (order.buyerPhone && order.buyerPhone.includes(q)) ||
        order.address.toLowerCase().includes(q) ||
        order.items.some((item) => item.name.toLowerCase().includes(q))
      )
      .slice(0, 6)
  }, [orders, query, isDelivery])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const go = (event?: FormEvent) => {
    event?.preventDefault()
    if (isDelivery) {
      const q = query.trim()
      navigate(q ? `/delivery?q=${encodeURIComponent(q)}` : '/delivery')
      setOpen(false)
      onSubmitted?.()
      return
    }

    const params = new URLSearchParams()
    if (parsed.text) params.set('q', parsed.text)
    if (parsed.budget) params.set('budget', String(parsed.budget))
    if (!parsed.text && !parsed.budget && query.trim()) params.set('q', query.trim())
    navigate(`/marketplace?${params.toString()}`)
    setOpen(false)
    onSubmitted?.()
  }

  const goBudget = (budget: number) => {
    setQuery(`${budget} pesos`)
    navigate(`/marketplace?budget=${budget}`)
    setOpen(false)
    onSubmitted?.()
  }

  return (
    <div ref={boxRef} className={`relative ${compact ? 'w-full' : 'w-full'}`}>
      <form onSubmit={go}>
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={
            isDelivery
              ? 'Search orders by order #, receipt, buyer, or address'
              : 'Search harvests, sellers, or cities in SOCCSKSARGEN'
          }
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm"
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </form>
      {open && (
        <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-white shadow-soft border border-gray-100 overflow-hidden z-50 animate-fade-up max-h-96 overflow-y-auto">
          {isDelivery ? (
            <div>
              <div className="px-3 pt-3 pb-2 border-b border-gray-100 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wide text-primary-700 flex items-center gap-1.5">
                  <Bike className="h-3.5 w-3.5" />
                  <span>Delivery Orders</span>
                </p>
                <span className="text-[10px] text-gray-400">Order # / Buyer lookup</span>
              </div>
              <ul>
                {orderSuggestions.map((order) => (
                  <li key={order.id}>
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-primary-50 text-left transition-colors"
                      onClick={() => {
                        navigate(`/delivery?q=${encodeURIComponent(order.id)}`)
                        setOpen(false)
                        onSubmitted?.()
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
                        <Package className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-gray-900">{order.id}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              order.status === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.status === 'Out for delivery'
                                ? 'bg-primary-100 text-primary-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 truncate mt-0.5">
                          <strong>{order.buyerName}</strong> · {order.address}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-primary-800 shrink-0">
                        {formatPeso(order.total)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {orderSuggestions.length === 0 && (
                <p className="px-4 py-3 text-xs text-gray-500 text-center">
                  No orders match "{query}". Try order ID or buyer name.
                </p>
              )}
            </div>
          ) : (
            <div>
              <div className="px-3 pt-3 pb-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Budget picks</p>
                <div className="flex flex-wrap gap-2">
                  {BUDGET_PRESETS.map((budget) => (
                    <button
                      key={budget}
                      type="button"
                      onClick={() => goBudget(budget)}
                      className="rounded-full bg-primary-50 text-primary-800 text-xs font-semibold px-3 py-1.5 hover:bg-primary-100"
                    >
                      {formatPeso(budget)}
                    </button>
                  ))}
                </div>
              </div>
              {parsed.budget && (
                <button
                  type="button"
                  onClick={() => go()}
                  className="w-full text-left px-4 py-2.5 bg-amber-50 border-y border-amber-100 flex items-center gap-2"
                >
                  <Wallet className="h-4 w-4 text-amber-700" />
                  <span className="text-sm font-semibold text-amber-900">
                    Show harvests from {formatPeso(parsed.budget)} down to the lowest price
                  </span>
                </button>
              )}
              <ul>
                {suggestions.map((product) => {
                  const meta = harvestMeta(product)
                  return (
                    <li key={product.id}>
                      <button
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-primary-50 text-left"
                        onClick={() => {
                          navigate(`/products/${product.id}`)
                          setOpen(false)
                          onSubmitted?.()
                        }}
                      >
                        <ProductImage src={product.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-semibold truncate">{product.name}</span>
                          <span className="block text-xs text-gray-500">
                            {product.seller} · {meta.sold} sold · +{meta.points} pts
                          </span>
                        </span>
                        <span className="text-sm font-bold text-primary-700">{formatPeso(product.price)}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              {suggestions.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-500">No harvests match yet. Try a city or crop name.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar
