import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { categories } from '../data/catalog'
import { useStore } from '../context/StoreContext'
import ProductCard from '../components/ProductCard'
import Seo from '../components/Seo'
import { formatPeso } from '../lib/utils'
import { BUDGET_PRESETS, filterByBudget, matchProduct } from '../lib/commerce'

const stockFilters = [
  ['all', 'All stock'],
  ['in', 'In stock'],
  ['low', 'Low stock'],
  ['out', 'Out of stock'],
] as const

type StockFilter = (typeof stockFilters)[number][0]

const MarketplacePage = () => {
  const { products, recommended } = useStore()
  const [params, setParams] = useSearchParams()
  const sort = params.get('sort') || 'featured'
  const budgetParam = params.get('budget')
  const budget = budgetParam ? Number(budgetParam) : undefined
  const availability = (params.get('stock') as StockFilter) || 'all'
  const selectedCategory = params.get('category') || 'All'
  const seller = params.get('seller') || ''
  const query = params.get('q') || ''

  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([key, value]) => {
      if (!value || (key === 'stock' && value === 'all') || (key === 'sort' && value === 'featured') || (key === 'category' && value === 'All')) {
        next.delete(key)
      } else {
        next.set(key, value)
      }
    })
    setParams(next)
  }

  const filtered = useMemo(() => {
    let list = products.filter((product) => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
      const matchesQuery = matchProduct(product, query)
      const matchesSeller = !seller || product.seller === seller
      const matchesStock =
        availability === 'all' ||
        (availability === 'in' && product.stock > 20) ||
        (availability === 'low' && product.stock > 0 && product.stock <= 20) ||
        (availability === 'out' && product.stock <= 0)
      const matchesBudget = !budget || product.price <= budget
      return matchesCategory && matchesQuery && matchesSeller && matchesStock && matchesBudget
    })
    if (budget && sort === 'featured') list = filterByBudget(list, budget)
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'rating') list = [...list].sort((a, b) => recommended.findIndex((item) => item.id === a.id) - recommended.findIndex((item) => item.id === b.id))
    if (sort === 'stock') list = [...list].sort((a, b) => a.stock - b.stock)
    return list
  }, [products, selectedCategory, query, seller, sort, recommended, availability, budget])

  return (
    <div className="page-shell">
      <Seo title="Marketplace" description="Browse farm-direct produce with budget search, harvest points, GCash and COD." path="/marketplace" />
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold">Marketplace</h1>
          <p className="text-gray-600 mt-2">
            {filtered.length} listing{filtered.length === 1 ? '' : 's'}
            {query ? ` for “${query}”` : ''}
            {budget ? ` · at or under ${formatPeso(budget)}, highest first` : ''}
            {availability !== 'all' ? ` · ${availability === 'in' ? 'in stock' : availability === 'low' ? 'low stock' : 'sold out'}` : ''}
          </p>
        </div>
        <select className="input-field max-w-xs" value={sort} onChange={(event) => updateParams({ sort: event.target.value })}>
          <option value="featured">Featured</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="rating">Best ratings</option>
          <option value="stock">Availability</option>
        </select>
      </div>

      <div className="card mb-6">
        <p className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">Budget recommendation</p>
        <div className="flex flex-wrap gap-2">
          {BUDGET_PRESETS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => updateParams({ budget: String(amount) })}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                budget === amount ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-800'
              }`}
            >
              {formatPeso(amount)}
            </button>
          ))}
          {budget && (
            <button type="button" className="text-sm font-semibold text-gray-500" onClick={() => updateParams({ budget: null })}>
              Clear budget
            </button>
          )}
        </div>
        {budget && (
          <p className="text-sm text-primary-800 mt-3">
            Showing harvests from {formatPeso(budget)} down to the lowest price that still fits.
          </p>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {stockFilters.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => updateParams({ stock: value })}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold ${
              availability === value ? 'bg-soil-900 text-white' : 'bg-white border border-gray-200 text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        {['All', ...categories.map((category) => category.name)].map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => updateParams({ category })}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              selectedCategory === category ? 'bg-primary-600 text-white shadow-glow' : 'bg-white border border-gray-200 text-gray-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center">
          <p className="text-gray-600">No harvests match that budget or search yet. Try ₱200 or ₱300.</p>
          <Link to="/marketplace" className="btn-primary mt-4">Clear filters</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product, index) => (
            <ProductCard key={product.id} product={product} delay={index * 40} />
          ))}
        </div>
      )}
    </div>
  )
}

export default MarketplacePage
