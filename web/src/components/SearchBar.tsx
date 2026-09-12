import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Wallet } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { BUDGET_PRESETS, filterByBudget, harvestMeta, matchProduct, parseSearchQuery } from '../lib/commerce'
import { formatPeso } from '../lib/utils'
import ProductImage from './ProductImage'

type Props = {
  compact?: boolean
  onSubmitted?: () => void
}

const SearchBar = ({ compact, onSubmitted }: Props) => {
  const { products } = useStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const parsed = parseSearchQuery(query)

  const suggestions = useMemo(() => {
    let list = products.filter((product) => product.stock > 0 && matchProduct(product, parsed.text))
    if (parsed.budget) list = filterByBudget(list, parsed.budget)
    else list = [...list].sort((a, b) => b.rating - a.rating)
    return list.slice(0, 6)
  }, [products, parsed.budget, parsed.text])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const go = (event?: FormEvent) => {
    event?.preventDefault()
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
          placeholder="Search harvests or type a budget like 200 pesos"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white"
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </form>
      {open && (
        <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-white shadow-soft border border-gray-100 overflow-hidden z-50 animate-fade-up">
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
            <button type="button" onClick={() => go()} className="w-full text-left px-4 py-2.5 bg-amber-50 border-y border-amber-100 flex items-center gap-2">
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
                      <span className="block text-xs text-gray-500">{product.seller} · {meta.sold} sold · +{meta.points} pts</span>
                    </span>
                    <span className="text-sm font-bold text-primary-700">{formatPeso(product.price)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          {suggestions.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-500">No harvests in that budget yet. Try ₱200 or ₱300.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar
