import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Package,
  Users,
  TrendingUp,
  FileCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Filter,
  Truck,
  LineChart,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  BadgeAlert,
} from 'lucide-react'
import { useStore, type Order } from '../context/StoreContext'
import { formatPeso } from '../lib/utils'
import Seo from '../components/Seo'
import ProductImage from '../components/ProductImage'

const statuses: Order['status'][] = ['Pending', 'Confirmed', 'Shipped', 'Out for delivery', 'Delivered']

const AdminDashboardPage = () => {
  const { products, orders, applications, reviewApplication, removeProduct, updateOrderStatus } = useStore()
  const [orderFilter, setOrderFilter] = useState<string>('all')
  const [orderSearch, setOrderSearch] = useState<string>('')
  const [productSearch, setProductSearch] = useState<string>('')
  const [inspectDoc, setInspectDoc] = useState<string | null>(null)

  const pendingApps = applications.filter((item) => item.status === 'Pending')
  const approvedApps = applications.filter((item) => item.status === 'Approved')
  const revenue = orders.reduce((sum, order) => sum + order.total, 0)
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered').length

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = orderFilter === 'all' || order.status === orderFilter
    const matchesSearch =
      orderSearch === '' ||
      order.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (order.buyerName && order.buyerName.toLowerCase().includes(orderSearch.toLowerCase())) ||
      order.address.toLowerCase().includes(orderSearch.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const filteredProducts = products.filter((prod) =>
    productSearch === '' ||
    prod.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    prod.seller.toLowerCase().includes(productSearch.toLowerCase()) ||
    prod.category.toLowerCase().includes(productSearch.toLowerCase())
  )

  return (
    <div className="page-shell space-y-8">
      <Seo
        title="Admin Control Center"
        description="Verify farmer KYC, moderate regional agricultural listings, and monitor SOCCSKSARGEN GMV."
        path="/admin-dashboard"
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 animate-fade-up">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-bold font-display text-gray-900">Admin Control Center</h1>
            <span className="chip bg-primary-100 text-primary-800 font-bold border border-primary-300">
              Operations Hub
            </span>
          </div>
          <p className="text-gray-600 mt-1.5 text-sm sm:text-base">
            Review passport and valid-ID KYC seller applications, moderate agricultural catalog, and oversee SOCCSKSARGEN order flow.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link to="/analytics" className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm">
            <LineChart className="h-4 w-4" /> Sales Analytics
          </Link>
          <Link to="/delivery" className="btn-outline py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5 bg-white">
            <Truck className="h-4 w-4 text-primary-700" /> Delivery Desk
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Marketplace GMV', value: formatPeso(revenue), sub: `${orders.length} total orders`, icon: TrendingUp, tone: 'from-emerald-600 to-teal-700 text-white' },
          { label: 'Active Listings', value: products.length, sub: 'Regional harvests', icon: Package, tone: 'from-primary-700 to-emerald-800 text-white' },
          { label: 'Pending Seller KYC', value: pendingApps.length, sub: 'Requires inspection', icon: FileCheck, tone: pendingApps.length > 0 ? 'from-amber-500 to-orange-600 text-white' : 'from-gray-700 to-gray-800 text-white' },
          { label: 'Delivered Parcels', value: deliveredOrders, sub: 'Completed drop-offs', icon: ShieldCheck, tone: 'from-soil-800 to-soil-950 text-white' },
        ].map((stat, idx) => (
          <div
            key={stat.label}
            className={`rounded-3xl p-5 bg-gradient-to-br shadow-soft text-white relative overflow-hidden animate-fade-up`}
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <div className="flex items-center justify-between opacity-85 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">{stat.label}</span>
              <stat.icon className="h-5 w-5 opacity-90" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight">{stat.value}</p>
            <p className="text-[11px] opacity-75 mt-1 font-medium">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Seller KYC Verification Section */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-5 sm:p-6 space-y-5 animate-fade-up">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Seller KYC Applications</h2>
              <p className="text-xs text-gray-500">Government valid ID, permits, and farm photos vetting.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
              {pendingApps.length} Pending
            </span>
            <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
              {approvedApps.length} Verified Sellers
            </span>
          </div>
        </div>

        {applications.length === 0 ? (
          <p className="text-gray-500 text-xs py-4 text-center">No seller applications submitted yet.</p>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <article
                key={application.id}
                className="bg-gray-50/70 rounded-2xl p-4 sm:p-5 border border-gray-200/80 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-gray-900">{application.farmName}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-xs text-gray-600">{application.name}</span>
                    </div>

                    <p className="text-xs text-gray-500">
                      📍 {application.location} · 📞 {application.phone} · Specialization: <strong>{application.categories}</strong>
                    </p>

                    <p className="text-xs text-gray-700 bg-white p-2.5 rounded-xl border border-gray-100 mt-2">
                      "{application.description}"
                    </p>

                    <p className="text-[11px] font-semibold text-primary-800 mt-1">
                      ID Document: {application.idType || 'Philippine Valid ID'} {application.idNumber ? `(${application.idNumber})` : ''}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                      application.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : application.status === 'Rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-900 animate-pulse'
                    }`}
                  >
                    {application.status}
                  </span>
                </div>

                {/* Uploaded Documents Gallery */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <span className="text-xs font-semibold text-gray-500">KYC Attachments:</span>
                  {application.idDocument && (
                    <button
                      type="button"
                      onClick={() => setInspectDoc(application.idDocument!)}
                      className="group relative rounded-xl overflow-hidden border border-gray-300 w-16 h-16 shadow-sm"
                      title="Inspect Government ID"
                    >
                      <ProductImage src={application.idDocument} alt="ID Document" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="h-4 w-4" />
                      </span>
                    </button>
                  )}
                  {application.permitDocument && (
                    <button
                      type="button"
                      onClick={() => setInspectDoc(application.permitDocument!)}
                      className="group relative rounded-xl overflow-hidden border border-gray-300 w-16 h-16 shadow-sm"
                      title="Inspect Business/Barangay Permit"
                    >
                      <ProductImage src={application.permitDocument} alt="Permit" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="h-4 w-4" />
                      </span>
                    </button>
                  )}
                  {application.farmPhoto && (
                    <button
                      type="button"
                      onClick={() => setInspectDoc(application.farmPhoto!)}
                      className="group relative rounded-xl overflow-hidden border border-gray-300 w-16 h-16 shadow-sm"
                      title="Inspect Farm Photo"
                    >
                      <ProductImage src={application.farmPhoto} alt="Farm" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="h-4 w-4" />
                      </span>
                    </button>
                  )}
                </div>

                {application.status === 'Pending' && (
                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                      onClick={() => reviewApplication(application.id, 'Approved')}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve Seller
                    </button>
                    <button
                      type="button"
                      className="btn-outline py-2 px-4 text-xs font-bold text-rose-700 hover:bg-rose-50 border-rose-200 inline-flex items-center gap-1.5"
                      onClick={() => reviewApplication(application.id, 'Rejected')}
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Order Moderation & Triage */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-5 sm:p-6 space-y-5 animate-fade-up">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Marketplace Orders</h2>
            <p className="text-xs text-gray-500">Live order status and dispatch oversight.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders..."
                className="input-field text-xs pl-8 py-1.5 w-48"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
              />
            </div>

            <select
              className="input-field text-xs py-1.5 w-36"
              value={orderFilter}
              onChange={(e) => setOrderFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <p className="text-gray-500 text-xs py-4 text-center">No orders match current filter.</p>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-2xl bg-gray-50 border border-gray-200/70 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-gray-900">{order.id}</span>
                    <span className="font-bold text-primary-800 text-sm">{formatPeso(order.total)}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-emerald-100 text-emerald-800">
                      {order.payment}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Buyer: <strong>{order.buyerName}</strong> · Drop-off: {order.address}
                  </p>
                  <p className="text-[11px] text-gray-400 font-mono">{order.createdAt.slice(0, 10)}</p>
                </div>

                <div className="flex items-center gap-2.5">
                  <select
                    className="input-field text-xs py-1.5 w-44 font-semibold"
                    value={order.status}
                    onChange={(event) => updateOrderStatus(order.id, event.target.value as Order['status'])}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <Link
                    to={`/orders/${order.id}/receipt`}
                    className="btn-outline text-xs py-1.5 px-3 bg-white"
                  >
                    Receipt
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Catalog Moderation */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-5 sm:p-6 space-y-5 animate-fade-up">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Catalog Moderation</h2>
            <p className="text-xs text-gray-500">Audit listings, enforce fair pricing, and unlist non-compliant crops.</p>
          </div>

          <div className="relative">
            <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search listings..."
              className="input-field text-xs pl-8 py-1.5 w-52"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <ProductImage src={product.image} alt="" className="h-12 w-12 rounded-xl object-cover shrink-0" />
                <div className="overflow-hidden">
                  <Link
                    to={`/products/${product.id}`}
                    className="font-bold text-xs text-gray-900 hover:text-primary-700 truncate block"
                  >
                    {product.name}
                  </Link>
                  <p className="text-[11px] text-gray-500 truncate">{product.seller} · {formatPeso(product.price)}/{product.unit}</p>
                  <span className="text-[10px] font-semibold text-primary-700 bg-primary-50 px-1.5 py-0.2 rounded">
                    Stock: {product.stock}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
                onClick={() => removeProduct(product.id)}
              >
                Unlist
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* KYC Document Lightbox Modal */}
      {inspectDoc && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setInspectDoc(null)}
        >
          <div className="relative max-w-2xl w-full bg-white rounded-3xl p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-gray-900">KYC Verification Document Inspection</h3>
              <button
                type="button"
                onClick={() => setInspectDoc(null)}
                className="text-xs font-bold bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-gray-700"
              >
                Close
              </button>
            </div>
            <img src={inspectDoc} alt="KYC Document" className="w-full max-h-[70vh] object-contain rounded-2xl border border-gray-200" />
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboardPage
