import { Link } from 'react-router-dom'
import { ArrowRight, Truck, Shield, Leaf, Store } from 'lucide-react'
import { categories } from '../data/catalog'
import { useStore } from '../context/StoreContext'
import ProductCard from '../components/ProductCard'

const HomePage = () => {
  const { products } = useStore()
  const featured = products.slice(0, 4)

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 text-white">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm mb-6">
            <Leaf className="h-4 w-4" /> Direct from farms across the Philippines
          </p>
          <h1 className="text-4xl md:text-6xl font-bold max-w-3xl leading-tight">
            Fresh harvests, honest prices, delivered with care.
          </h1>
          <p className="text-lg md:text-xl mt-6 max-w-2xl text-primary-100">
            Shop vegetables, fruits, rice, poultry, and farm supplies from verified sellers. No middlemen markup. No mystery produce.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            <Link to="/marketplace" className="btn-primary bg-white text-primary-800 hover:bg-primary-50">
              Browse marketplace
            </Link>
            <Link to="/register" className="btn-outline border-white text-white hover:bg-white/10">
              Create a buyer account
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Leaf, title: 'Farm-direct freshness', copy: 'Listings come from growers, co-ops, and trusted aggregators.' },
            { icon: Truck, title: 'Island-aware delivery', copy: 'Choose cash on delivery or GCash. Track every order from farm to door.' },
            { icon: Shield, title: 'Verified sellers', copy: 'Admins review seller applications before a stall goes live.' },
          ].map((item) => (
            <div key={item.title} className="card">
              <div className="h-12 w-12 rounded-2xl bg-primary-50 text-primary-700 grid place-items-center mb-4">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Shop by category</h2>
              <p className="text-gray-600 mt-1">From kangkong to compost, the stall is stocked.</p>
            </div>
            <Link to="/categories" className="hidden sm:inline-flex items-center text-primary-700 font-semibold">
              All categories <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={`/marketplace?category=${encodeURIComponent(category.name)}`}
                className="card hover:shadow-soft transition-shadow text-center"
              >
                <div className="text-3xl mb-2">{category.emoji}</div>
                <h3 className="font-semibold">{category.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{category.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">This week’s harvest</h2>
              <p className="text-gray-600 mt-1">A short list of what farms are packing now.</p>
            </div>
            <Link to="/marketplace" className="btn-outline">View all</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Sell what you grow</h2>
            <p className="text-primary-100 max-w-xl">
              Apply once, get reviewed by AgriMarket admins, then list produce with your own prices and stock.
            </p>
          </div>
          <Link to="/become-seller" className="btn-primary bg-white text-primary-800 hover:bg-primary-50">
            <Store className="h-4 w-4 mr-2" /> Become a seller
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage
