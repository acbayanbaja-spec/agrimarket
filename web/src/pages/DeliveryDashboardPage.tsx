import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Truck,
  MapPin,
  Phone,
  Navigation,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  Package,
  Clock,
  ShieldCheck,
  Send,
  Compass,
} from 'lucide-react'
import { useStore, type Order } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { formatPeso } from '../lib/utils'
import { findPlace, soccsksargenPlaces } from '../data/locations'
import Seo from '../components/Seo'
import OrderTimeline from '../components/OrderTimeline'
import SoccsksargenDeliveryMap from '../components/SoccsksargenDeliveryMap'

const riderStatuses: Order['status'][] = ['Out for delivery', 'Delivered']

const DeliveryDashboardPage = () => {
  const { orders, updateOrderStatus, sendSms, messages } = useStore()
  const { user, hasRole } = useAuth()
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [flash, setFlash] = useState<Record<string, string>>({})
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('all')
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  // Allow admin and any delivery rider to view and accept jobs
  const jobs = useMemo(() => {
    const list = orders.filter((order) => {
      if (order.status === 'Pending') return false
      if (hasRole('admin')) return true
      if (hasRole('delivery')) return true
      if (!user) return false
      return order.driverId === user.id
    })

    if (selectedCityFilter === 'all') {
      return [...list].sort((a, b) => Number(a.status === 'Delivered') - Number(b.status === 'Delivered'))
    }

    return list
      .filter((order) => order.address.toLowerCase().includes(selectedCityFilter.toLowerCase()))
      .sort((a, b) => Number(a.status === 'Delivered') - Number(b.status === 'Delivered'))
  }, [orders, user, hasRole, selectedCityFilter])

  // Active coordinates for the regional dispatch map
  const activeOrder = jobs.find((j) => j.id === activeJobId) || jobs.find((j) => j.status === 'Out for delivery') || jobs[0]
  const resolvedCoords = useMemo(() => {
    if (!activeOrder) return undefined
    if (activeOrder.lat && activeOrder.lng) {
      return {
        lat: activeOrder.lat,
        lng: activeOrder.lng,
        address: activeOrder.address,
        title: `${activeOrder.id} - ${activeOrder.buyerName}`,
      }
    }
    const place = findPlace(activeOrder.address)
    return {
      lat: place.lat,
      lng: place.lng,
      address: activeOrder.address,
      title: `${activeOrder.id} - ${activeOrder.buyerName}`,
    }
  }, [activeOrder])

  const pingBuyer = (order: Order, customText?: string) => {
    const body =
      customText ||
      notes[order.id] ||
      'Good day po! Your farm-fresh harvest is out for delivery inside SOCCSKSARGEN. Rider ETA ~20 mins.'

    if (!order.buyerPhone) {
      setFlash((current) => ({ ...current, [order.id]: 'No buyer mobile number recorded on this order.' }))
      return
    }

    const sent = sendSms({
      orderId: order.id,
      fromRole: 'delivery',
      fromName: user ? `${user.firstName} ${user.lastName}` : 'Rico Rider (SOCCSKSARGEN)',
      fromUserId: user?.id,
      toUserId: order.userId,
      phone: order.buyerPhone,
      body,
    })

    if (order.status === 'Confirmed' || order.status === 'Shipped') {
      updateOrderStatus(order.id, 'Out for delivery')
    }

    setFlash((current) => ({
      ...current,
      [order.id]: `✓ SMS ${sent.status} to ${order.buyerPhone}. Rider update broadcasted to buyer.`,
    }))
  }

  // Quick SMS Templates
  const smsTemplates = [
    '🛵 10 minutes away po! Please prepare cash/GCash.',
    '📍 Arrived at your drop-off gate in SOCCSKSARGEN.',
    '📦 Fresh produce packed securely in crates, headed to your address now.',
  ]

  const readyPickups = jobs.filter((j) => j.status === 'Confirmed' || j.status === 'Shipped').length
  const inTransit = jobs.filter((j) => j.status === 'Out for delivery').length
  const completedToday = jobs.filter((j) => j.status === 'Delivered').length
  const totalRiderEarnings = completedToday * 50

  return (
    <div className="page-shell space-y-8">
      <Seo
        title="SOCCSKSARGEN Delivery Command Desk"
        description="Riders pick up confirmed harvests and navigate SOCCSKSARGEN drop-offs with real-time GPS."
        path="/delivery"
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 animate-fade-up">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-bold font-display text-gray-900">Delivery Command Desk</h1>
            <span className="chip bg-primary-100 text-primary-800 font-bold border border-primary-300">
              Region XII Active
            </span>
          </div>
          <p className="text-gray-600 mt-1.5 text-sm sm:text-base">
            Live harvest drop-offs, GPS routing, and buyer SMS alerts across South Cotabato, General Santos City, Sarangani, Cotabato, and Sultan Kudarat.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/messages" className="btn-outline text-xs py-2 px-3.5 inline-flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" /> Inbox
          </Link>
          <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Rider Online
          </span>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Ready for Pickup', value: readyPickups, sub: 'Confirmed crates', tone: 'text-amber-700 bg-amber-50 border-amber-200' },
          { label: 'Out for Delivery', value: inTransit, sub: 'Currently en route', tone: 'text-primary-700 bg-primary-50 border-primary-200' },
          { label: 'Delivered Today', value: completedToday, sub: 'Completed drop-offs', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
          { label: 'Delivery Revenue', value: formatPeso(totalRiderEarnings), sub: '₱50 per crate drop', tone: 'text-soil-900 bg-soil-50 border-soil-200' },
        ].map((stat, idx) => (
          <div key={stat.label} className={`card p-4 border rounded-2xl animate-fade-up ${stat.tone}`} style={{ animationDelay: `${idx * 60}ms` }}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{stat.label}</p>
            <p className="text-2xl sm:text-3xl font-extrabold mt-1 font-display">{stat.value}</p>
            <p className="text-[11px] mt-1 opacity-70">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Master SOCCSKSARGEN Dispatch Map */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary-600" />
            <span>SOCCSKSARGEN Dispatch & Route Navigation</span>
          </h2>
          <span className="text-xs text-gray-500 hidden sm:inline">Centered on Region XII Hubs</span>
        </div>

        <SoccsksargenDeliveryMap
          activeLocation={resolvedCoords}
          allOrders={jobs}
        />
      </div>

      {/* Job Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
          <span className="font-bold text-gray-700 text-xs">Filter City:</span>
          <button
            type="button"
            onClick={() => setSelectedCityFilter('all')}
            className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
              selectedCityFilter === 'all'
                ? 'bg-primary-700 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            All SOCCSKSARGEN ({orders.filter((o) => o.status !== 'Pending').length})
          </button>
          {['Koronadal', 'General Santos', 'Polomolok', 'Tacurong', 'Kidapawan', 'Alabel'].map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCityFilter(city)}
              className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
                selectedCityFilter === city
                  ? 'bg-primary-700 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        <span className="text-xs text-gray-500 font-medium">
          Showing {jobs.length} active delivery parcel{jobs.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Jobs Feed */}
      {jobs.length === 0 ? (
        <div className="card text-center py-12 bg-white rounded-3xl border border-gray-100 shadow-soft">
          <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-800 text-lg">No pickup jobs matching current filter</h3>
          <p className="text-gray-500 text-xs max-w-md mx-auto mt-1">
            Confirmed buyer orders will automatically populate here for regional riders across South Cotabato, GenSan, Sarangani, and Cotabato.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {jobs.map((order) => {
            const thread = messages.filter((item) => item.orderId === order.id)
            const harvest = order.items.map((item) => `${item.quantity}× ${item.name} (${item.pickupLocation || item.seller})`).join(', ')
            const isDelivered = order.status === 'Delivered'
            const place = findPlace(order.address)
            const lat = order.lat || place.lat
            const lng = order.lng || place.lng

            const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
            const wazeUrl = `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`

            return (
              <article
                key={order.id}
                className={`card p-5 sm:p-6 space-y-4 rounded-3xl border transition-all duration-300 animate-fade-up ${
                  activeJobId === order.id
                    ? 'ring-2 ring-primary-500 shadow-md bg-white'
                    : isDelivered
                    ? 'bg-gray-50/70 opacity-90 border-gray-200'
                    : 'bg-white hover:shadow-soft border-gray-100'
                }`}
                onClick={() => setActiveJobId(order.id)}
              >
                {/* Parcel Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-gray-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-base text-gray-900">{order.id}</span>
                      <span className="text-gray-400">·</span>
                      <span className="font-bold text-gray-800">{order.buyerName}</span>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        {order.payment}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-primary-600 shrink-0" />
                      <span><strong>Drop-off:</strong> {order.address}</span>
                    </p>

                    <p className="text-xs text-soil-800 flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-soil-600 shrink-0" />
                      <span><strong>Harvest Pickup:</strong> {harvest}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-extrabold text-lg text-primary-800">{formatPeso(order.total)}</p>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase inline-block mt-1 ${
                        isDelivered
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'Out for delivery'
                          ? 'bg-primary-100 text-primary-800 animate-pulse'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Milestone Stepper */}
                <OrderTimeline status={order.status} />

                {/* Order Mini-Map & GPS Routing */}
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 h-44 rounded-2xl overflow-hidden border border-gray-200 relative bg-gray-100">
                    <iframe
                      title={`Drop-off ${order.id}`}
                      className="w-full h-full border-0"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.03}%2C${lat - 0.03}%2C${lng + 0.03}%2C${lat + 0.03}&layer=mapnik&marker=${lat}%2C${lng}`}
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-800 shadow-sm border border-gray-100">
                      📍 SOCCSKSARGEN Drop-off: {order.address.split(',')[0]}
                    </div>
                  </div>

                  <div className="space-y-2 flex flex-col justify-between bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-xs">
                    <div>
                      <p className="font-bold text-gray-800 mb-1">Rider GPS Navigation</p>
                      <p className="text-[11px] text-gray-500">Launch one-touch turn-by-turn directions within Region XII:</p>
                    </div>

                    <div className="space-y-1.5">
                      <a
                        href={gmapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary w-full bg-primary-600 hover:bg-primary-700 text-white text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm font-semibold"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        <span>Google Maps GPS</span>
                      </a>
                      <a
                        href={wazeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-outline w-full text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-semibold bg-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-sky-600" />
                        <span>Waze Route</span>
                      </a>
                      {order.buyerPhone && (
                        <a
                          href={`tel:${order.buyerPhone}`}
                          className="btn-outline w-full text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-semibold bg-white text-emerald-700"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span>Call: {order.buyerPhone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Update Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {(order.status === 'Confirmed' || order.status === 'Shipped') && (
                      <button
                        type="button"
                        className="btn-primary py-2 px-4 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                        onClick={() => updateOrderStatus(order.id, 'Out for delivery')}
                      >
                        <Truck className="h-3.5 w-3.5 mr-1.5 inline" />
                        Mark Picked Up & Out For Delivery
                      </button>
                    )}

                    {riderStatuses.map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={`text-xs py-2 px-3.5 rounded-xl font-bold transition-all border ${
                          order.status === status
                            ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                        onClick={() => updateOrderStatus(order.id, status)}
                      >
                        {status === 'Delivered' && <CheckCircle2 className="h-3.5 w-3.5 mr-1 inline" />}
                        {status}
                      </button>
                    ))}
                  </div>

                  <span className="text-[11px] text-gray-400 font-mono">
                    Coords: {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
                  </span>
                </div>

                {/* Buyer SMS Section */}
                <div className="bg-gray-50/80 rounded-2xl p-3.5 border border-gray-100 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                      <Send className="h-3.5 w-3.5 text-primary-600" />
                      <span>Direct SMS to Buyer ({order.buyerPhone || 'No number on file'})</span>
                    </span>

                    {/* Quick SMS pills */}
                    <div className="flex items-center gap-1 overflow-x-auto text-[10px]">
                      {smsTemplates.map((tmpl, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => pingBuyer(order, tmpl)}
                          className="bg-white hover:bg-primary-50 hover:text-primary-800 text-gray-600 px-2 py-1 rounded-lg border border-gray-200 transition-colors whitespace-nowrap"
                        >
                          Quick Ping #{i + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      className="input-field text-xs flex-1"
                      placeholder="Type custom SMS update to buyer..."
                      value={notes[order.id] ?? 'Good day po! Your harvest is out for delivery across SOCCSKSARGEN.'}
                      onChange={(event) => setNotes((current) => ({ ...current, [order.id]: event.target.value }))}
                    />
                    <button
                      type="button"
                      className="btn-primary text-xs py-2 px-4 whitespace-nowrap shadow-sm"
                      onClick={() => pingBuyer(order)}
                    >
                      Send SMS Update
                    </button>
                  </div>

                  {flash[order.id] && (
                    <p className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-fade-in">
                      {flash[order.id]}
                    </p>
                  )}

                  {thread.length > 0 && (
                    <p className="text-[11px] text-gray-500 pl-1">
                      <strong>Last dispatch update:</strong> "{thread[thread.length - 1].body}"
                    </p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DeliveryDashboardPage
