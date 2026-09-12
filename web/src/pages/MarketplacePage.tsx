import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { categories } from '../data/catalog'
import { useStore } from '../context/StoreContext'
import ProductCard from '../components/ProductCard'
import Seo from '../components/Seo'
import { formatPeso } from '../lib/utils'

const stockFilters = [
  ['all', 'All stock'],
  ['in', 'In stock'],
  ['low', 'Low stock'],
  ['out', 'Out of stock'],
] as const

type StockFilter = (typeof stockFilters)[number][0]

const MarketplacePage = () => {
  const { products, recommended, budgetPicks } = useStore()
  const [params, setParams] = useSearchParams()
  const sort = params.get('sort') || 'featured'
  const budget = Number(params.get('budget') || 200)
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
      const haystack = `${product.name} ${product.seller} ${product.location} ${product.category}`.toLowerCase()
      const matchesQuery = !query || haystack.includes(query.toLowerCase())
      const matchesSeller = !seller || product.seller === seller
      const matchesStock =
        availability === 'all' ||
        (availability === 'in' && product.stock > 20) ||
        (availability === 'low' && product.stock > 0 && product.stock <= 20) ||
        (availability === 'out' && product.stock <= 0)
      return matchesCategory && matchesQuery && matchesSeller && matchesStock
    })
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'rating') list = [...list].sort((a, b) => recommended.findIndex((item) => item.id === a.id) - recommended.findIndex((item) => item.id === b.id))
    if (sort === 'stock') list = [...list].sort((a, b) => a.stock - b.stock)
    return list
  }, [products, selectedCategory, query, seller, sort, recommended, availability])

  const withinBudget = budgetPicks(budget)

  return (
    <div className="page-shell">
      <Seo title="Marketplace" description="Browse farm-direct produce with live stock, GPS locations, GCash and COD, and shipping coupons." path="/marketplace" />
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold">Marketplace</h1>
          <p className="text-gray-600 mt-2">
            {filtered.length} listing{filtered.length === 1 ? '' : 's'}
            {query ? ` for “${query}”` : ''}
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

      <div className="card mb-8 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <p className="font-semibold">Budget basket</p>
          <p className="text-sm text-gray-600">Show harvests at or under {formatPeso(budget)} per unit.</p>
        </div>
        <input
          type="range"
          min={20}
          max={400}
          value={budget}
          onChange={(event) => updateParams({ budget: event.target.value })}
          className="w-full md:w-64"
        />
        <p className="text-sm text-primary-800 font-semibold">{withinBudget.length} matches</p>
      </div>

      {withinBudget.length > 0 && sort === 'featured' && selectedCategory === 'All' && !query && availability === 'all' && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Within your budget</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {withinBudget.slice(0, 4).map((product, index) => (
              <ProductCard key={product.id} product={product} delay={index * 50} />
            ))}
          </div>
        </div>
      )}

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
          <p className="text-gray-600">No products match that search.</p>
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
