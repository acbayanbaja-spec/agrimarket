import { Link } from 'react-router-dom'
import { ArrowRight, Truck, Shield, Leaf, Store, Sparkles, Wallet } from 'lucide-react'
import { categories } from '../data/catalog'
import { useStore } from '../context/StoreContext'
import ProductCard from '../components/ProductCard'
import ProductImage from '../components/ProductImage'
import Seo from '../components/Seo'

const HomePage = () => {
  const { products, recommended } = useStore()
  const featured = recommended.slice(0, 4)
  const harvest = products.filter((product) => product.stock > 0).slice(0, 4)

  return (
    <div>
      <Seo
        title="Fresh harvests from Filipino farms"
        description="Shop vegetables, fruits, rice, poultry and farm supplies. Pay with GCash or COD, track delivery, trade produce, and follow category posts."
        path="/"
      />
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 text-white">
        <div className="absolute inset-0 opacity-25 bg-[url('/images/hero.jpg')] bg-cover bg-center" />
        <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-secondary-400/30 blur-2xl animate-float" />
        <div className="absolute left-20 bottom-6 h-24 w-24 rounded-full bg-white/10 blur-xl animate-float" style={{ animationDelay: '1.2s' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm mb-6 animate-fade-up">
            <Leaf className="h-4 w-4" /> Direct from farms across the Philippines
          </p>
          <h1 className="text-4xl md:text-6xl font-bold max-w-3xl leading-tight animate-fade-up" style={{ animationDelay: '80ms' }}>
            Fresh harvests, honest prices, delivered with care.
          </h1>
          <p className="text-lg md:text-xl mt-6 max-w-2xl text-primary-100 animate-fade-up" style={{ animationDelay: '140ms' }}>
            Shop, trade, and follow farm posts. Pay with GCash or cash on delivery. Riders can SMS you when the crate is on the road.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-10 animate-fade-up" style={{ animationDelay: '200ms' }}>
            <Link to="/marketplace" className="btn-primary bg-white text-primary-800 hover:bg-primary-50">
              Browse marketplace
            </Link>
            <Link to="/marketplace?budget=200" className="btn-outline border-white text-white hover:bg-white/10">
              Shop a ₱200 budget
            </Link>
            <Link to="/get-app" className="btn-outline border-white text-white hover:bg-white/10">
              Install on phone
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: Leaf, title: 'Farm-direct', copy: 'Listings from growers, co-ops, and verified aggregators.' },
            { icon: Truck, title: 'GCash & COD', copy: 'Shipping coupons stack on delivery fees only — Shopee-style.' },
            { icon: Shield, title: 'Seller KYC', copy: 'Buyers apply with ID, permit, and farm photos before selling.' },
            { icon: Sparkles, title: 'Harvest points', copy: 'Earn points on every order and spend them on shipping, like Shopee coins — but farm-first.' },
          ].map((item, index) => (
            <div key={item.title} className="card hover:-translate-y-1 transition-transform animate-fade-up" style={{ animationDelay: `${index * 70}ms` }}>
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
              <p className="text-gray-600 mt-1">Follow a category on the feed to get pinged when sellers post.</p>
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
                className="card hover:shadow-soft hover:-translate-y-1 transition-all text-center"
              >
                <ProductImage src={category.image} alt="" className="h-16 w-16 mx-auto rounded-2xl object-cover mb-2" />
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
              <h2 className="text-3xl font-bold">Recommended for you</h2>
              <p className="text-gray-600 mt-1">Highest ratings weighted by review volume — the harvest people trust.</p>
            </div>
            <Link to="/marketplace?sort=rating" className="btn-outline">View all</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((product, index) => (
              <ProductCard key={product.id} product={product} delay={index * 60} />
            ))}
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">This week’s harvest</h2>
              <p className="text-gray-600 mt-1">Live stock, GPS-tagged farms, GCash or cash on delivery.</p>
            </div>
            <Link to="/marketplace" className="btn-outline">Marketplace</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {harvest.map((product, index) => (
              <ProductCard key={product.id} product={product} delay={index * 60} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">Sell what you grow</h2>
            <p className="text-primary-100 max-w-xl">
              Buyers can become sellers after ID, barangay/business permit, farm photos, and admin review. Sellers can still shop as buyers.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/become-seller" className="btn-primary bg-white text-primary-800 hover:bg-primary-50">
              <Store className="h-4 w-4 mr-2" /> Become a seller
            </Link>
            <Link to="/prices" className="btn-outline border-white text-white hover:bg-white/10">
              <Wallet className="h-4 w-4 mr-2" /> Price monitor
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
