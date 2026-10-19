import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Calendar,
  CloudSun,
  Stethoscope,
  Sparkles,
  Users,
  Sprout,
} from 'lucide-react'
import { categories, type Product } from '../data/catalog'
import { soccsksargenPlaces } from '../data/locations'
import { useStore } from '../context/StoreContext'
import ProductCard from '../components/ProductCard'
import Seo from '../components/Seo'
import { formatPeso } from '../lib/utils'
import { BUDGET_PRESETS, filterByBudget, matchProduct } from '../lib/commerce'
import ProductImage from '../components/ProductImage'
import WeatherAdvisoryWidget from '../components/WeatherAdvisoryWidget'
import SeasonalHarvestCalendarModal from '../components/SeasonalHarvestCalendarModal'
import CropDoctorModal from '../components/CropDoctorModal'
import BayanihanPoolModal from '../components/BayanihanPoolModal'
import SoilYieldCalculatorModal from '../components/SoilYieldCalculatorModal'
import api from '../services/api'

const stockFilters = [
  ['all', 'All stock'],
  ['in', 'In stock'],
  ['low', 'Low stock'],
  ['out', 'Out of stock'],
] as const

type StockFilter = (typeof stockFilters)[number][0]

const MarketplacePage = () => {
  const { products, recommended, posts } = useStore()
  const [params, setParams] = useSearchParams()
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [showCropDoctorModal, setShowCropDoctorModal] = useState(false)
  const [showWeatherWidget, setShowWeatherWidget] = useState(false)
  const [showBayanihanModal, setShowBayanihanModal] = useState(false)
  const [showYieldModal, setShowYieldModal] = useState(false)
  const sort = params.get('sort') || 'featured'
  const budgetParam = params.get('budget')
  const budget = budgetParam ? Number(budgetParam) : undefined
  const availability = (params.get('stock') as StockFilter) || 'all'
  const selectedCategory = params.get('category') || 'All'
  const seller = params.get('seller') || ''
  const query = params.get('q') || ''
  const locationFilter = params.get('location') || ''
  const organicParam = params.get('organic') === 'true'
  const page = Math.max(1, Number(params.get('page') || '1'))
  const [remote, setRemote] = useState<{ products: Product[]; total: number; totalPages: number; page: number } | null>(null)
  const [loading, setLoading] = useState(false)

  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([key, value]) => {
      if (!value || (key === 'stock' && value === 'all') || (key === 'sort' && value === 'featured') || (key === 'category' && value === 'All')) {
        next.delete(key)
      } else {
        next.set(key, value)
      }
    })
    if (!('page' in patch)) next.delete('page')
    setParams(next)
  }

  useEffect(() => {
    let cancelled = false
    const search = new URLSearchParams()
    if (query) search.set('search', query)
    if (selectedCategory && selectedCategory !== 'All') search.set('category', selectedCategory)
    if (seller) search.set('seller', seller)
    if (budget) search.set('maxPrice', String(budget))
    if (locationFilter) search.set('location', locationFilter)
    if (organicParam) search.set('organic', 'true')
    if (availability !== 'all') search.set('stock', availability)
    search.set('sort', sort)
    search.set('page', String(page))
    search.set('pageSize', '24')
    setLoading(true)
    api
      .get<{ data?: { products: Product[]; total: number; totalPages: number; page: number } }>(`/products?${search.toString()}`)
      .then((res) => {
        if (cancelled) return
        const data = res.data?.data
        if (data?.products) {
          setRemote({
            products: data.products,
            total: data.total,
            totalPages: data.totalPages,
            page: data.page,
          })
        }
      })
      .catch(() => {
        if (!cancelled) setRemote(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [query, selectedCategory, seller, budget, locationFilter, organicParam, availability, sort, page])

  const localFiltered = useMemo(() => {
    let list = products.filter((product) => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
      const matchesQuery = matchProduct(product, query)
      const matchesSeller = !seller || product.seller === seller
      const matchesStock =
        availability === 'all' ||
        (availability === 'in' && product.stock > 0) ||
        (availability === 'low' && product.stock > 0 && product.stock <= 10) ||
        (availability === 'out' && product.stock <= 0)
      const matchesLocation = !locationFilter || product.location === locationFilter
      const matchesBudget = !budget || product.price <= budget
      const matchesOrganic = !organicParam || product.organic === true
      return matchesCategory && matchesQuery && matchesSeller && matchesStock && matchesBudget && matchesLocation && matchesOrganic
    })
    if (budget && sort === 'featured') list = filterByBudget(list, budget)
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'rating') list = [...list].sort((a, b) => recommended.findIndex((item) => item.id === a.id) - recommended.findIndex((item) => item.id === b.id))
    if (sort === 'stock') list = [...list].sort((a, b) => a.stock - b.stock)
    return list
  }, [products, selectedCategory, query, seller, sort, recommended, availability, budget, locationFilter, organicParam])

  const filtered = useMemo(() => {
    if (!remote?.products) return localFiltered
    const remoteIds = new Set(remote.products.map((p) => p.id))
    const localOnly = localFiltered.filter((p) => !remoteIds.has(p.id))
    return [...localOnly, ...remote.products]
  }, [remote, localFiltered])

  const total = remote?.total ? remote.total + (filtered.length - (remote.products?.length || 0)) : filtered.length
  const totalPages = remote?.totalPages ?? 1

  return (
    <div className="page-shell">
      <Seo title="Marketplace" description="Browse farm-direct produce with budget search, harvest points, GCash and COD." path="/marketplace" />
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold">Marketplace</h1>
          <p className="text-gray-600 mt-2">
            {total} listing{total === 1 ? '' : 's'} in SOCCSKSARGEN
            {query ? ` for “${query}”` : ''}
            {budget ? ` · at or under ${formatPeso(budget)}, highest first` : ''}
            {availability !== 'all' ? ` · ${availability === 'in' ? 'in stock' : availability === 'low' ? 'low stock' : 'sold out'}` : ''}
            {loading ? ' · updating…' : ''}
          </p>
        </div>
        <select className="input-field max-w-xs" value={sort} onChange={(event) => updateParams({ sort: event.target.value })} aria-label="Sort harvests">
          <option value="featured">Featured</option>
          <option value="newest">Newest listings</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="rating">Best ratings</option>
          <option value="stock">Availability</option>
        </select>
      </div>

      {/* Regional Agricultural Intelligence & Field Tools */}
      <div className="flex flex-wrap items-center gap-2.5 mb-6">
        <button
          type="button"
          onClick={() => setShowWeatherWidget(!showWeatherWidget)}
          className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
            showWeatherWidget
              ? 'bg-emerald-700 text-white'
              : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          <CloudSun className="h-4 w-4 text-amber-500" />
          <span>{showWeatherWidget ? 'Hide Region XII Weather' : 'Region XII Agri-Weather'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowCalendarModal(true)}
          className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-white text-primary-800 border border-primary-200 hover:bg-primary-50 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <Calendar className="h-4 w-4 text-primary-700" />
          <span>Seasonal Harvest Guide</span>
        </button>

        <button
          type="button"
          onClick={() => setShowCropDoctorModal(true)}
          className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-white text-teal-800 border border-teal-200 hover:bg-teal-50 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <Stethoscope className="h-4 w-4 text-teal-700" />
          <span>Crop Doctor (Pest Advisory)</span>
        </button>

        <button
          type="button"
          onClick={() => setShowBayanihanModal(true)}
          className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-white text-amber-800 border border-amber-200 hover:bg-amber-50 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <Users className="h-4 w-4 text-amber-700" />
          <span>Bayanihan Group Pool</span>
        </button>

        <button
          type="button"
          onClick={() => setShowYieldModal(true)}
          className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <Sprout className="h-4 w-4 text-emerald-700" />
          <span>Soil & Yield AI</span>
        </button>
      </div>

      {showWeatherWidget && (
        <div className="mb-6 animate-fade-down">
          <WeatherAdvisoryWidget />
        </div>
      )}

      <div className="card mb-6">
        <p className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">Price cap (optional)</p>
        <div className="flex flex-wrap gap-2">
          {BUDGET_PRESETS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => updateParams({ budget: String(amount) })}
              className={`rounded-full px-4 py-2 text-sm font-semibold min-h-[40px] ${
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
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold min-h-[40px] ${
              availability === value ? 'bg-soil-900 text-white' : 'bg-white border border-gray-200 text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => updateParams({ organic: organicParam ? null : 'true' })}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-all min-h-[40px] ${
            organicParam
              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
              : 'bg-white border border-gray-200 text-gray-700 hover:border-emerald-300'
          }`}
        >
          <span>🌱</span> {organicParam ? 'Organic Only ✓' : 'Organic Only'}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        <button
          type="button"
          onClick={() => updateParams({ location: null })}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold min-h-[40px] ${!locationFilter ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
        >
          All SOCCSKSARGEN
        </button>
        {soccsksargenPlaces.map((place) => (
          <button
            key={place.label}
            type="button"
            onClick={() => updateParams({ location: place.label })}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold min-h-[40px] ${
              locationFilter === place.label ? 'bg-primary-600 text-white shadow-glow' : 'bg-white border border-gray-200 text-gray-700'
            }`}
          >
            {place.city}
          </button>
        ))}
      </div>

      {posts.slice(0, 3).length > 0 && (
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Live seller feed</h2>
            <Link to="/feed" className="text-sm font-semibold text-primary-700">See all</Link>
          </div>
          <div className="space-y-3">
            {posts.slice(0, 3).map((post) => (
              <div key={post.id} className="flex gap-3">
                {post.photos[0] && <ProductImage src={post.photos[0]} alt="" className="h-12 w-12 rounded-xl object-cover" />}
                <div>
                  <p className="text-sm font-semibold">{post.sellerName}{post.productName ? ` · ${post.productName}` : ''}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{post.body}</p>
                  {post.productId && <Link to={`/products/${post.productId}`} className="text-xs font-semibold text-primary-700">View product</Link>}
                </div>
              </div>
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
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all min-h-[40px] ${
              selectedCategory === category ? 'bg-primary-600 text-white shadow-glow' : 'bg-white border border-gray-200 text-gray-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center">
          <p className="text-gray-600">No harvests match that filter yet. Clear it or pick another city in SOCCSKSARGEN.</p>
          <Link to="/marketplace" className="btn-primary mt-4">Clear filters</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product, index) => (
              <ProductCard key={product.id} product={product} delay={index * 40} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                type="button"
                className="btn-outline py-2"
                disabled={page <= 1}
                onClick={() => updateParams({ page: String(page - 1) })}
              >
                Previous
              </button>
              <p className="text-sm text-gray-600">
                Page {remote?.page || page} of {totalPages}
              </p>
              <button
                type="button"
                className="btn-outline py-2"
                disabled={page >= totalPages}
                onClick={() => updateParams({ page: String(page + 1) })}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Feature Modals */}
      <SeasonalHarvestCalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
      />
      <CropDoctorModal
        isOpen={showCropDoctorModal}
        onClose={() => setShowCropDoctorModal(false)}
      />
      <BayanihanPoolModal
        isOpen={showBayanihanModal}
        onClose={() => setShowBayanihanModal(false)}
      />
      <SoilYieldCalculatorModal
        isOpen={showYieldModal}
        onClose={() => setShowYieldModal(false)}
      />
    </div>
  )
}

export default MarketplacePage
