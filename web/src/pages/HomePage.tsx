import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Truck, Shield, Leaf, Store, Wallet, MapPin, Zap, Ticket, Coins, Smartphone, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react'
import { categories } from '../data/catalog'
import { useStore } from '../context/StoreContext'
import ProductCard from '../components/ProductCard'
import ProductImage from '../components/ProductImage'
import Seo from '../components/Seo'
import ShopNowLink from '../components/ShopNowLink'
import FlashDealsSection from '../components/FlashDealsSection'
import DownloadAppModal from '../components/DownloadAppModal'
import VoucherCenterModal from '../components/VoucherCenterModal'
import DailyCoinsCheckIn from '../components/DailyCoinsCheckIn'

const HomePage = () => {
  const { products, recommended, loyaltyPoints } = useStore()
  const [isDownloadOpen, setIsDownloadOpen] = useState(false)
  const [isVoucherOpen, setIsVoucherOpen] = useState(false)
  const [isCoinsOpen, setIsCoinsOpen] = useState(false)

  const featured = recommended.slice(0, 4)
  const harvest = products.filter((product) => product.stock > 0).slice(0, 4)

  // Quick Feature & Category bubbles (Shopee circular strip)
  const quickBubbles = [
    { label: 'Flash Deals', icon: Zap, tone: 'bg-rose-500 text-white', to: '/marketplace', badge: 'HOT' },
    { label: 'Free Delivery', icon: Truck, tone: 'bg-emerald-600 text-white', action: () => setIsVoucherOpen(true), badge: '₱0' },
    { label: 'Daily Coins', icon: Coins, tone: 'bg-amber-500 text-white', action: () => setIsCoinsOpen(true), badge: `${loyaltyPoints}pts` },
    { label: 'Vouchers', icon: Ticket, tone: 'bg-orange-500 text-white', action: () => setIsVoucherOpen(true) },
    { label: 'Vegetables', icon: Leaf, tone: 'bg-green-600 text-white', to: '/marketplace?category=Vegetables' },
    { label: 'Fresh Fruits', icon: Sparkles, tone: 'bg-yellow-500 text-white', to: '/marketplace?category=Fruits' },
    { label: 'Rice & Grains', icon: Store, tone: 'bg-soil-700 text-white', to: '/marketplace?category=Rice%20%26%20Grains' },
    { label: 'Mobile App', icon: Smartphone, tone: 'bg-primary-700 text-white', action: () => setIsDownloadOpen(true), badge: 'SYNC' },
  ]

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <Seo
        title="Fresh harvests from SOCCSKSARGEN farms"
        description="Shop Region XII harvests. Log in as a buyer or seller, then order. Sellers confirm before riders pick up."
        path="/"
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 text-white">
        <div className="absolute inset-0 opacity-25 bg-[url('/images/hero.jpg')] bg-cover bg-center" />
        <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-secondary-400/30 blur-2xl animate-float" />
        <div className="absolute left-20 bottom-6 h-24 w-24 rounded-full bg-white/10 blur-xl animate-float" style={{ animationDelay: '1.2s' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 text-xs sm:text-sm mb-6 border border-white/20 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <Leaf className="h-4 w-4 text-emerald-300" />
            <span>Direct from certified farms across SOCCSKSARGEN</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold font-display max-w-3xl leading-tight animate-fade-up" style={{ animationDelay: '80ms' }}>
            Fresh harvests, honest prices, delivered across SOCCSKSARGEN.
          </h1>
          <p className="text-base md:text-lg mt-5 max-w-2xl text-primary-100 animate-fade-up" style={{ animationDelay: '140ms' }}>
            Shop from verified farms in South Cotabato, Cotabato, Sultan Kudarat, Sarangani, and General Santos. Log in as a buyer or seller first — then sellers confirm every crate before a rider picks up.
          </p>

          <div className="flex flex-wrap gap-3.5 mt-8 animate-fade-up" style={{ animationDelay: '200ms' }}>
            <ShopNowLink className="btn-primary bg-white text-primary-800 hover:bg-primary-50 min-h-[46px] px-6 text-sm font-bold shadow-lg">
              Shop Now
            </ShopNowLink>

            <button
              type="button"
              onClick={() => setIsDownloadOpen(true)}
              className="btn-primary bg-gradient-to-r from-emerald-500 to-primary-600 hover:from-emerald-600 hover:to-primary-700 text-white min-h-[46px] px-5 text-sm font-bold shadow-lg inline-flex items-center gap-2"
            >
              <Smartphone className="h-4 w-4" /> Download Mobile App
            </button>

            <button
              type="button"
              onClick={() => setIsVoucherOpen(true)}
              className="btn-outline border-white text-white hover:bg-white/10 min-h-[46px] px-5 text-sm font-semibold inline-flex items-center gap-1.5"
            >
              <Ticket className="h-4 w-4 text-yellow-300" /> Claim Vouchers
            </button>
          </div>
        </div>
      </section>

      {/* Shopee Style Circular Quick Icons Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-soft border border-gray-100">
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4 text-center">
            {quickBubbles.map((bubble) => {
              const Icon = bubble.icon
              const content = (
                <div className="flex flex-col items-center group cursor-pointer">
                  <div className="relative mb-2">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${bubble.tone} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    {bubble.badge && (
                      <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-sm animate-pop uppercase">
                        {bubble.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-gray-800 group-hover:text-primary-700 transition-colors line-clamp-1">
                    {bubble.label}
                  </span>
                </div>
              )

              if (bubble.to) {
                return (
                  <Link key={bubble.label} to={bubble.to}>
                    {content}
                  </Link>
                )
              }

              return (
                <button key={bubble.label} type="button" onClick={bubble.action}>
                  {content}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Shopee Style Live Flash Deals Section */}
      <FlashDealsSection />

      {/* Voucher Teaser Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          onClick={() => setIsVoucherOpen(true)}
          className="bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 rounded-3xl p-4 sm:p-5 text-white flex flex-wrap items-center justify-between gap-4 cursor-pointer shadow-sm hover:shadow-md transition-all hover:scale-[1.01]"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Ticket className="h-6 w-6 text-yellow-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg">Shopee & Lazada Style Voucher Center</span>
                <span className="bg-yellow-400 text-orange-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                  Collect Now
                </span>
              </div>
              <p className="text-xs text-orange-100 mt-0.5">
                Up to ₱100 OFF Fresh Harvests & 100% Free Shipping inside SOCCSKSARGEN.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-primary bg-white text-orange-800 hover:bg-orange-50 text-xs py-2 px-4 rounded-xl font-bold shadow-sm inline-flex items-center gap-1 shrink-0"
          >
            <span>Open Voucher Wallet</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: Leaf, title: 'Farm-direct', copy: 'Listings from growers across SOCCSKSARGEN, GPS-pinned to the stall.' },
            { icon: Truck, title: 'Seller then rider', copy: 'Checkout waits for seller confirm. Riders are pinged only when pickup is ready.' },
            { icon: Shield, title: 'Seller KYC', copy: 'Buyers apply with passport or valid ID. Admin approves before anyone can list.' },
            { icon: MapPin, title: 'Region XII only', copy: 'Drop-offs and pickups stay inside South Cotabato, Cotabato, SK, Sarangani, and Gensan.' },
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
            <ShopNowLink className="btn-outline">View all</ShopNowLink>
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
            <ShopNowLink className="btn-outline">Marketplace</ShopNowLink>
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
              Buyers can become sellers from Profile → Become a seller. Upload a passport or valid ID, barangay/business permit, and farm photo. Admin reviews the file before you can list.
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

      {/* Modals */}
      <DownloadAppModal isOpen={isDownloadOpen} onClose={() => setIsDownloadOpen(false)} />
      <VoucherCenterModal isOpen={isVoucherOpen} onClose={() => setIsVoucherOpen(false)} />
      <DailyCoinsCheckIn isOpen={isCoinsOpen} onClose={() => setIsCoinsOpen(false)} />
    </div>
  )
}

export default HomePage
