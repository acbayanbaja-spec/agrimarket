import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { categories } from '../data/catalog'
import { useStore } from '../context/StoreContext'
import ProductCard from '../components/ProductCard'

const MarketplacePage = () => {
  const { products } = useStore()
  const [params, setParams] = useSearchParams()
  const [sort, setSort] = useState('featured')
  const selectedCategory = params.get('category') || 'All'
  const seller = params.get('seller') || ''
  const query = params.get('q') || ''

  const filtered = useMemo(() => {
    let list = products.filter((product) => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
      const haystack = `${product.name} ${product.seller} ${product.location} ${product.category}`.toLowerCase()
      const matchesQuery = !query || haystack.includes(query.toLowerCase())
      const matchesSeller = !seller || product.seller === seller
      return matchesCategory && matchesQuery && matchesSeller
    })
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating)
    return list
  }, [products, selectedCategory, query, seller, sort])

  const setCategory = (category: string) => {
    const next = new URLSearchParams(params)
    if (category === 'All') next.delete('category')
    else next.set('category', category)
    setParams(next)
  }

  return (
    <div className="page-shell">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold">Marketplace</h1>
          <p className="text-gray-600 mt-2">
            {filtered.length} listing{filtered.length === 1 ? '' : 's'}
            {query ? ` for “${query}”` : ''}
          </p>
        </div>
        <select className="input-field max-w-xs" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="featured">Featured</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        {['All', ...categories.map((category) => category.name)].map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setCategory(category)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold ${
              selectedCategory === category ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700'
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
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}

export default MarketplacePage
