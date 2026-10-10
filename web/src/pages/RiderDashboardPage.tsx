import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Bike,
  TrendingUp,
  DollarSign,
  PackageCheck,
  Star,
  Clock,
  MapPin,
  Calendar,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Navigation,
  AlertCircle,
  Truck,
  Wallet,
  Phone,
} from 'lucide-react'
import { useStore, type Order } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { formatPeso } from '../lib/utils'
import Seo from '../components/Seo'

const RiderDashboardPage = () => {
  const { orders } = useStore()
  const { user } = useAuth()
  const [onDuty, setOnDuty] = useState(true)
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'all'>('today')

  // Filter orders relevant to deliveries
  const allDelivered = useMemo(
    () => orders.filter((o) => o.status === 'Delivered'),
    [orders]
  )
  const inTransitOrders = useMemo(
    () => orders.filter((o) => o.status === 'Out for delivery'),
    [orders]
  )
  const readyPickupOrders = useMemo(
    () => orders.filter((o) => o.status === 'Confirmed' || o.status === 'Shipped'),
    [orders]
  )

  // Calculations
  const deliveredCount = allDelivered.length
  const deliveryFeeRate = 50 // ₱50 per crate drop in Region XII
  const totalEarnings = deliveredCount * deliveryFeeRate

  // COD Collected in hand (Delivered orders paid via Cash on delivery)
  const codCollected = useMemo(() => {
    return allDelivered
      .filter((o) => o.payment === 'Cash on delivery')
      .reduce((sum, o) => sum + o.total, 0)
  }, [allDelivered])

  const filteredHistory = useMemo(() => {
    if (filterPeriod === 'today') return allDelivered.slice(0, 10)
    return allDelivered
  }, [allDelivered, filterPeriod])

  const riderName = user?.firstName
    ? `${user.firstName} ${user.lastName}`
    : 'Rico Rider'

  return (
    <div className="page-shell space-y-8 max-w-6xl mx-auto">
      <Seo
        title="Rider Performance & Earnings Dashboard"
        description="Delivery analytics, earnings ledger, on-time rates, and COD collection reports for Region XII riders."
        path="/rider-dashboard"
      />

      {/* Header Banner */}
      <section className="bg-gradient-to-br from-emerald-800 via-primary-700 to-emerald-900 text-white rounded-3xl p-6 sm:p-8 shadow-soft relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-amber-400/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white text-primary-800 flex items-center justify-center font-bold text-2xl shadow-md border-2 border-emerald-300/60 shrink-0">
              <Bike className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white">
                  {riderName}
                </h1>
                <span className="bg-emerald-300 text-emerald-950 font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                  Rider ID #{user?.id || 108}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1">
                Regional Logistics Desk • SOCCSKSARGEN Central Fleet
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Shift Duty Toggle */}
            <button
              type="button"
              onClick={() => setOnDuty(!onDuty)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border transition-all ${
                onDuty
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100 hover:bg-emerald-500/30'
                  : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  onDuty ? 'bg-emerald-400 animate-ping' : 'bg-gray-400'
                }`}
              />
              <span>{onDuty ? 'On Duty (Active Dispatches)' : 'Off Duty'}</span>
            </button>

            {/* Link to Active Live Dispatch Map */}
            <Link
              to="/delivery"
              className="btn-secondary py-2 px-4 text-xs sm:text-sm inline-flex items-center gap-2 shadow-md"
            >
              <Navigation className="h-4 w-4" />
              <span>Launch Live GPS Desk</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* KPI Cards: Earnings & Revenue */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Delivery Revenue */}
        <div className="card bg-white p-5 border-emerald-100 space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Delivery Payout</span>
            <Wallet className="h-5 w-5 text-primary-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black font-display text-gray-900 mt-1">
            {formatPeso(totalEarnings)}
          </p>
          <p className="text-xs text-primary-700 font-medium">
            ₱50.00 × {deliveredCount} parcel drops completed
          </p>
        </div>

        {/* COD In Hand */}
        <div className="card bg-white p-5 border-amber-100 space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">COD Collected</span>
            <DollarSign className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black font-display text-gray-900 mt-1">
            {formatPeso(codCollected)}
          </p>
          <p className="text-xs text-amber-700 font-medium">
            Cash on delivery awaiting hub remittance
          </p>
        </div>

        {/* Delivered Success Rate */}
        <div className="card bg-white p-5 border-emerald-100 space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Completion Rate</span>
            <PackageCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black font-display text-gray-900 mt-1">
            99.2%
          </p>
          <p className="text-xs text-emerald-700 font-medium">
            Top 5% among SOCCSKSARGEN couriers
          </p>
        </div>

        {/* Rating */}
        <div className="card bg-white p-5 border-emerald-100 space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Buyer Rating</span>
            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black font-display text-gray-900 mt-1">
            4.95 ★
          </p>
          <p className="text-xs text-gray-500 font-medium">
            Based on {Math.max(deliveredCount, 12)} verified drop ratings
          </p>
        </div>
      </section>

      {/* Real-time Status Alert / Ongoing In-Transit Jobs */}
      {inTransitOrders.length > 0 && (
        <section className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="font-bold text-base sm:text-lg text-emerald-950">
                {inTransitOrders.length} Order(s) Currently In Transit
              </h2>
            </div>
            <Link
              to="/delivery"
              className="btn-primary py-1.5 px-3.5 text-xs font-bold inline-flex items-center gap-1"
            >
              <span>View Route Map</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {inTransitOrders.slice(0, 2).map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">{order.id}</span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {order.buyerName}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{order.address}</span>
                  </p>
                  <p className="text-xs font-bold text-primary-700 mt-1">
                    COD: {formatPeso(order.total)} ({order.payment})
                  </p>
                </div>
                <Link
                  to="/delivery"
                  className="px-3 py-1.5 bg-soil-100 hover:bg-soil-200 text-soil-900 text-xs font-semibold rounded-xl"
                >
                  Navigate
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Completed Runs History Ledger */}
      <section className="card bg-white p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <h2 className="font-bold text-base sm:text-lg text-gray-900">
              Completed Delivery Ledger
            </h2>
            <p className="text-xs text-gray-500">
              Verified harvest drops, customer receipts, and delivery payout credits
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterPeriod('today')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                filterPeriod === 'today'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-soil-100 text-gray-700 hover:bg-soil-200'
              }`}
            >
              Recent
            </button>
            <button
              type="button"
              onClick={() => setFilterPeriod('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                filterPeriod === 'all'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-soil-100 text-gray-700 hover:bg-soil-200'
              }`}
            >
              All Records ({deliveredCount})
            </button>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <Truck className="h-10 w-10 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold">No completed drop-offs yet for this filter.</p>
            <p className="text-xs mt-1">Accept orders from your Delivery Desk to start earning.</p>
            <Link to="/delivery" className="btn-primary mt-4 py-2 px-4 text-xs font-bold">
              Open Delivery Desk
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-soil-50 text-gray-600 text-[11px] uppercase tracking-wider font-semibold border-y border-gray-100">
                <tr>
                  <th className="py-3 px-4">Order / Receipt</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Order Amount</th>
                  <th className="py-3 px-4 text-right">Rider Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredHistory.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                      {order.id}
                      <span className="block text-[10px] text-gray-400 font-sans font-normal">
                        {order.receiptNo || 'AGRI-REC'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">{order.buyerName}</div>
                      {order.buyerPhone && (
                        <span className="text-[11px] text-gray-400">{order.buyerPhone}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 max-w-xs truncate">
                      {order.address}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          order.payment === 'Cash on delivery'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {order.payment}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {formatPeso(order.total)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-primary-700">
                      +₱50.00
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Safety & Logistics Guidelines */}
      <section className="bg-soil-100/60 rounded-3xl p-5 sm:p-6 border border-soil-200 space-y-3">
        <div className="flex items-center gap-2 text-soil-900">
          <ShieldCheck className="h-5 w-5 text-primary-700" />
          <h3 className="font-bold text-sm sm:text-base">
            SOCCSKSARGEN Dispatch Protocols
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-700">
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100">
            <p className="font-bold text-gray-900 mb-1">Cold-Chain Handling</p>
            <p className="text-gray-500">
              Ensure fresh produce, green leafy vegetables, and fruits are strapped securely in ventilated crates.
            </p>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100">
            <p className="font-bold text-gray-900 mb-1">Buyer SMS Ping</p>
            <p className="text-gray-500">
              Always send the 10-minute ETA SMS from your Delivery Desk before reaching remote drop-off gates.
            </p>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100">
            <p className="font-bold text-gray-900 mb-1">COD Remittance</p>
            <p className="text-gray-500">
              Cash on delivery collections must be settled daily at your registered regional hub.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default RiderDashboardPage
