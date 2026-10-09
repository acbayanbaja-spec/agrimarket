import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Flame, Clock, ChevronRight, ShoppingCart } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useCartSheet } from '../context/CartSheetContext'
import { useAuth } from '../context/AuthContext'
import { scrollToTopNow } from './ScrollToTop'
import { formatPeso } from '../lib/utils'
import ProductImage from './ProductImage'

export const FlashDealsSection = () => {
  const { products } = useStore()
  const { openSheet } = useCartSheet()
  const { hasRole } = useAuth()

  // Calculate live countdown timer ending at next 6-hour interval
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 2,
    minutes: 47,
    seconds: 35,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const endOfFlash = new Date()
      endOfFlash.setHours(endOfFlash.getHours() + (4 - (endOfFlash.getHours() % 4)), 0, 0, 0)
      const diff = Math.max(0, endOfFlash.getTime() - now.getTime())

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ hours, minutes, seconds })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Pick top 4 products for flash deals
  const flashProducts = products.slice(0, 4).map((item, idx) => {
    const discounts = [35, 25, 40, 30]
    const percent = discounts[idx % discounts.length]
    const flashPrice = Math.round(item.price * (1 - percent / 100))
    const soldPercents = [88, 74, 92, 65]
    const soldPercent = soldPercents[idx % soldPercents.length]

    return {
      ...item,
      flashPrice,
      originalPrice: item.price,
      discountPercent: percent,
      soldPercent,
    }
  })

  const pad = (n: number) => n.toString().padStart(2, '0')

  return (
    <section className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 rounded-3xl p-4 sm:p-6 text-white shadow-soft relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-16 w-48 h-48 bg-yellow-400/20 rounded-full blur-2xl pointer-events-none" />

          {/* Flash Deals Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20">
                <Flame className="h-5 w-5 text-yellow-300 fill-yellow-300 animate-bounce" />
                <span className="font-display font-black text-xl sm:text-2xl tracking-wide uppercase text-yellow-300 drop-shadow">
                  FLASH DEALS
                </span>
                <span className="bg-yellow-400 text-orange-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full ml-1 uppercase">
                  SOCCSKSARGEN
                </span>
              </div>

              {/* Countdown Timer Block */}
              <div className="flex items-center gap-1 text-sm font-bold">
                <Clock className="h-4 w-4 opacity-90 mr-1" />
                <span className="text-xs uppercase tracking-wider opacity-90 hidden sm:inline">Ending in</span>
                <span className="bg-soil-950 text-white font-mono text-sm px-2 py-1 rounded-lg shadow-inner">
                  {pad(timeLeft.hours)}
                </span>
                <span className="font-bold">:</span>
                <span className="bg-soil-950 text-white font-mono text-sm px-2 py-1 rounded-lg shadow-inner">
                  {pad(timeLeft.minutes)}
                </span>
                <span className="font-bold">:</span>
                <span className="bg-soil-950 text-white font-mono text-sm px-2 py-1 rounded-lg shadow-inner">
                  {pad(timeLeft.seconds)}
                </span>
              </div>
            </div>

            <Link
              to="/marketplace"
              onClick={scrollToTopNow}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold bg-white/20 hover:bg-white/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 transition-all text-white hover:translate-x-0.5"
            >
              See All Deals <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Flash Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 relative z-10">
            {flashProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 text-gray-900 group flex flex-col justify-between"
              >
                <div className="relative">
                  <Link to={`/products/${product.id}`} onClick={scrollToTopNow} className="block overflow-hidden">
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      className="h-36 sm:h-44 w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  {/* Discount Badge */}
                  <div className="absolute top-2 left-2 bg-rose-600 text-white font-black text-xs px-2 py-0.5 rounded-lg shadow-md flex items-center gap-0.5">
                    <Zap className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                    <span>-{product.discountPercent}%</span>
                  </div>

                  {/* Location Chip */}
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-md font-medium">
                    📍 {product.location.split(',')[0]}
                  </div>
                </div>

                <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-2.5">
                  <div>
                    <p className="text-[11px] font-semibold text-orange-600 uppercase tracking-wide">
                      {product.category}
                    </p>
                    <Link
                      to={`/products/${product.id}`}
                      onClick={scrollToTopNow}
                      className="font-bold text-sm text-gray-900 hover:text-orange-600 line-clamp-1 transition-colors"
                    >
                      {product.name}
                    </Link>
                  </div>

                  {/* Price Row */}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-extrabold text-base sm:text-lg text-rose-600">
                        {formatPeso(product.flashPrice)}
                      </span>
                      <span className="text-xs text-gray-400 line-through">
                        {formatPeso(product.originalPrice)}
                      </span>
                    </div>

                    {/* Shopee Style Claimed Progress Bar */}
                    <div className="mt-2">
                      <div className="flex justify-between items-center text-[10px] text-gray-500 font-medium mb-1">
                        <span className="text-orange-700 font-bold">{product.soldPercent}% Claimed</span>
                        <span>Fast Selling</span>
                      </div>
                      <div className="w-full bg-orange-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-rose-600 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${product.soldPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  {hasRole('admin') ? (
                    <div className="w-full text-center text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 py-2 rounded-xl">
                      Manage only
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openSheet(product)}
                      className="w-full btn-primary bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white text-xs py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm font-bold"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" /> Grab Deal
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default FlashDealsSection
